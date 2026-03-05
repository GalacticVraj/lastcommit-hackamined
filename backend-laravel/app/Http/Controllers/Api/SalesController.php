<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Inquiry;
use App\Models\Quotation;
use App\Models\SaleOrder;
use App\Models\Invoice;
use App\Models\SalesReceiptVoucher;
use App\Models\Employee;
use App\Models\Product;
use App\Services\GstCalculator;
use App\Services\AutoNumber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesController extends Controller
{
    // ─── CUSTOMERS ────────────────────────────────────────────────────────────

    public function listCustomers(Request $request)
    {
        $query = Customer::whereNull('deleted_at');

        if ($search = $request->get('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $perPage = (int) $request->get('per_page', 25);

        $customers = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

        return $this->paginatedResponse($customers);
    }

    public function createCustomer(Request $request)
    {
        $customer = Customer::create(array_merge(
            $request->only(['name', 'gstin', 'stateCode', 'address', 'city', 'state', 'pincode', 'contactPerson', 'phone', 'email', 'creditPeriod']),
            ['created_by' => $request->user()->id]
        ));

        return $this->successResponse($customer, 'Customer created', 201);
    }

    public function getCustomer(Request $request, $id)
    {
        $customer = Customer::with([
            'inquiries' => fn ($q) => $q->latest()->limit(10),
            'invoices' => fn ($q) => $q->latest()->limit(10),
        ])->find($id);

        if (!$customer) return $this->errorResponse('Customer not found', 404);

        return $this->successResponse($customer);
    }

    public function updateCustomer(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);
        $customer->update(array_merge(
            $request->only(['name', 'gstin', 'stateCode', 'address', 'city', 'state', 'pincode', 'contactPerson', 'phone', 'email', 'creditPeriod']),
            ['updated_by' => $request->user()->id]
        ));

        return $this->successResponse($customer, 'Customer updated');
    }

    public function deleteCustomer(Request $request, $id)
    {
        Customer::where('id', $id)->update([
            'deleted_at' => now(),
            'is_active' => false,
        ]);

        return $this->successResponse(null, 'Customer deleted');
    }

    public function getCustomerProfile(Request $request, $id)
    {
        $customer = Customer::find($id);
        if (!$customer) return $this->errorResponse('Customer not found', 404);

        $saleOrders = SaleOrder::where('customer_id', $id)->whereNull('deleted_at')->latest()->get();
        $invoices = Invoice::where('customer_id', $id)->whereNull('deleted_at')->latest()->get();
        $receipts = SalesReceiptVoucher::where('customer_id', $id)->latest('receipt_date')->get();

        $totalBusiness = $invoices->sum('grand_total');
        $totalReceived = $receipts->sum('amount');
        $outstanding = $totalBusiness - $totalReceived;

        $now = now();
        $taggedInvoices = $invoices->map(function ($inv) use ($now) {
            $inv->payment_status = $inv->status === 'Paid' ? 'Paid'
                : ($inv->due_date < $now ? 'Overdue' : 'Unpaid');
            return $inv;
        });

        return $this->successResponse([
            'customer' => $customer,
            'saleOrders' => $saleOrders,
            'invoices' => $taggedInvoices,
            'metrics' => [
                'totalBusiness' => $totalBusiness,
                'totalReceived' => $totalReceived,
                'outstanding' => $outstanding,
                'totalOrders' => $saleOrders->count(),
                'totalInvoices' => $invoices->count(),
            ],
        ]);
    }

    public function getSalesmanProfile(Request $request, $id)
    {
        $paramId = $id;
        $numericId = is_numeric($paramId) ? (int) $paramId : null;

        $employee = $numericId
            ? Employee::find($numericId)
            : Employee::where('name', urldecode($paramId))->first();

        if (!$employee) return $this->errorResponse('Salesman/Employee not found', 404);

        $inquiries = Inquiry::where('sales_person', $employee->name)->whereNull('deleted_at')->latest()->get();
        $saleOrders = SaleOrder::where('sales_person', $employee->name)->whereNull('deleted_at')->latest()->get();

        $convertedInquiries = $inquiries->filter(fn ($i) => in_array($i->status, ['Won', 'Converted']))->count();
        $conversionRate = $inquiries->count() ? round(($convertedInquiries / $inquiries->count()) * 100, 1) : 0;
        $totalSales = $saleOrders->sum('grand_total');
        $commission = round($totalSales * 0.02, 2);

        return $this->successResponse([
            'employee' => $employee,
            'inquiries' => $inquiries,
            'saleOrders' => $saleOrders,
            'metrics' => [
                'totalInquiries' => $inquiries->count(),
                'convertedOrders' => $saleOrders->count(),
                'conversionRate' => $conversionRate,
                'totalSales' => $totalSales,
                'commission' => $commission,
            ],
        ]);
    }

    // ─── INQUIRIES ────────────────────────────────────────────────────────────

    public function listInquiries(Request $request)
    {
        $query = Inquiry::with('customer:id,name')->whereNull('deleted_at');

        if ($search = $request->get('search')) {
            $query->where('inquiry_no', 'like', "%{$search}%");
        }

        $perPage = (int) $request->get('per_page', 25);
        return $this->paginatedResponse($query->latest()->paginate($perPage));
    }

    public function createInquiry(Request $request)
    {
        $inquiryNo = AutoNumber::generate('INQ', 'INQ');

        $inquiry = DB::transaction(function () use ($request, $inquiryNo) {
            $inquiry = Inquiry::create([
                'inquiry_no' => $inquiryNo,
                'customer_id' => $request->customerId,
                'sales_person' => $request->salesPerson,
                'remarks' => $request->remarks,
                'created_by' => $request->user()->id,
            ]);

            if ($request->has('items') && is_array($request->items)) {
                foreach ($request->items as $item) {
                    $inquiry->items()->create($item);
                }
            }

            return $inquiry->load(['items', 'customer']);
        });

        return $this->successResponse($inquiry, 'Inquiry created', 201);
    }

    public function getInquiry(Request $request, $id)
    {
        $inquiry = Inquiry::with(['items.product', 'customer', 'quotations'])->find($id);
        if (!$inquiry) return $this->errorResponse('Inquiry not found', 404);
        return $this->successResponse($inquiry);
    }

    public function updateInquiry(Request $request, $id)
    {
        $inquiry = Inquiry::findOrFail($id);
        $data = $request->only(['salesPerson', 'remarks', 'status']);
        $data['updated_by'] = $request->user()->id;
        $inquiry->update($data);

        return $this->successResponse($inquiry, 'Inquiry updated');
    }

    // ─── QUOTATIONS ───────────────────────────────────────────────────────────

    public function listQuotations(Request $request)
    {
        $query = Quotation::with('customer:id,name')->whereNull('deleted_at');

        if ($search = $request->get('search')) {
            $query->where('quote_no', 'like', "%{$search}%");
        }

        return $this->paginatedResponse($query->latest()->paginate(25));
    }

    public function createQuotation(Request $request)
    {
        $quoteNo = AutoNumber::generate('QT', 'QT');

        $quotation = DB::transaction(function () use ($request, $quoteNo) {
            $totalAmount = 0;
            $items = collect($request->items ?? [])->map(function ($item) use (&$totalAmount) {
                $lineTotal = $item['quantity'] * $item['rate'] * (1 + ($item['gstPercent'] ?? 18) / 100);
                $totalAmount += $lineTotal;
                return array_merge($item, ['total' => round($lineTotal, 2)]);
            });

            $quotation = Quotation::create([
                'quote_no' => $quoteNo,
                'customer_id' => $request->customerId,
                'inquiry_id' => $request->inquiryId,
                'valid_until' => $request->validUntil,
                'payment_terms' => $request->paymentTerms,
                'total_amount' => round($totalAmount, 2),
                'created_by' => $request->user()->id,
            ]);

            foreach ($items as $item) {
                $quotation->items()->create($item);
            }

            if ($request->inquiryId) {
                Inquiry::where('id', $request->inquiryId)->update(['status' => 'Quoted']);
            }

            return $quotation->load(['items', 'customer']);
        });

        return $this->successResponse($quotation, 'Quotation created', 201);
    }

    public function getQuotation(Request $request, $id)
    {
        $quotation = Quotation::with(['items.product', 'customer', 'inquiry'])->find($id);
        if (!$quotation) return $this->errorResponse('Quotation not found', 404);
        return $this->successResponse($quotation);
    }

    public function updateQuotation(Request $request, $id)
    {
        $quotation = Quotation::findOrFail($id);
        $updateData = ['updated_by' => $request->user()->id];

        if ($request->has('paymentTerms')) $updateData['payment_terms'] = $request->paymentTerms;
        if ($request->has('status')) $updateData['status'] = $request->status;
        if ($request->has('validUntil')) $updateData['valid_until'] = $request->validUntil;

        $quotation->update($updateData);

        return $this->successResponse($quotation, 'Quotation updated');
    }

    // ─── SALE ORDERS ──────────────────────────────────────────────────────────

    public function listSaleOrders(Request $request)
    {
        $query = SaleOrder::with('customer:id,name')->whereNull('deleted_at');
        if ($search = $request->get('search')) {
            $query->where('so_no', 'like', "%{$search}%");
        }
        return $this->paginatedResponse($query->latest()->paginate(25));
    }

    public function createSaleOrder(Request $request)
    {
        $soNo = AutoNumber::generate('SO', 'SO');

        $order = DB::transaction(function () use ($request, $soNo) {
            $totalAmount = 0;
            $items = collect($request->items ?? [])->map(function ($item) use (&$totalAmount) {
                $lineTotal = $item['quantity'] * $item['rate'] * (1 + ($item['gstPercent'] ?? 18) / 100);
                $totalAmount += $lineTotal;
                return array_merge($item, ['total' => round($lineTotal, 2)]);
            });

            $order = SaleOrder::create([
                'so_no' => $soNo,
                'customer_id' => $request->customerId,
                'quotation_id' => $request->quotationId,
                'customer_po_no' => $request->customerPoNo,
                'customer_po_date' => $request->customerPoDate,
                'billing_address' => $request->billingAddress,
                'shipping_address' => $request->shippingAddress,
                'total_amount' => round($totalAmount, 2),
                'created_by' => $request->user()->id,
            ]);

            foreach ($items as $item) {
                $order->items()->create($item);
            }

            return $order->load(['items', 'customer']);
        });

        return $this->successResponse($order, 'Sale Order created', 201);
    }

    public function getSaleOrder(Request $request, $id)
    {
        $order = SaleOrder::with(['items.product', 'customer', 'invoices', 'dispatchAdvice'])->find($id);
        if (!$order) return $this->errorResponse('Sale Order not found', 404);
        return $this->successResponse($order);
    }

    public function updateSaleOrder(Request $request, $id)
    {
        $order = DB::transaction(function () use ($request, $id) {
            $order = SaleOrder::findOrFail($id);
            $order->update(array_merge(
                $request->only(['billingAddress', 'shippingAddress', 'status']),
                ['updated_by' => $request->user()->id]
            ));

            if ($request->status === 'Closed') {
                $order->items()->update(['status' => 'Closed']);
            }

            return $order;
        });

        return $this->successResponse($order, 'Sale Order updated');
    }

    // ─── INVOICES ─────────────────────────────────────────────────────────────

    public function listInvoices(Request $request)
    {
        $query = Invoice::with('customer:id,name')->whereNull('deleted_at');
        if ($search = $request->get('search')) {
            $query->where('invoice_no', 'like', "%{$search}%");
        }
        return $this->paginatedResponse($query->latest()->paginate(25));
    }

    public function createInvoice(Request $request)
    {
        $invoiceNo = AutoNumber::generate('INV', 'INV');
        $customer = Customer::findOrFail($request->customerId);
        $companyGSTIN = env('COMPANY_GSTIN', '24XXXXX0000X1ZX');

        $taxableValue = 0;
        $cgstAmount = 0;
        $sgstAmount = 0;
        $igstAmount = 0;

        $processedItems = collect($request->items ?? [])->map(function ($item) use (&$taxableValue, &$cgstAmount, &$sgstAmount, &$igstAmount, $companyGSTIN, $customer) {
            $lineTaxable = $item['quantity'] * $item['rate'];
            $gst = GstCalculator::calculate($lineTaxable, $item['gstPercent'] ?? 18, $companyGSTIN, $customer->gstin);

            $taxableValue += $lineTaxable;
            $cgstAmount += $gst['cgst'];
            $sgstAmount += $gst['sgst'];
            $igstAmount += $gst['igst'];

            return array_merge($item, [
                'cgst' => $gst['cgst'],
                'sgst' => $gst['sgst'],
                'igst' => $gst['igst'],
                'total' => $gst['total'],
            ]);
        });

        $grandTotal = $taxableValue + $cgstAmount + $sgstAmount + $igstAmount;
        $roundOff = round(round($grandTotal) - $grandTotal, 2);
        $dueDate = now()->addDays($customer->credit_period ?? 30);

        $invoice = Invoice::create([
            'invoice_no' => $invoiceNo,
            'customer_id' => $request->customerId,
            'sale_order_id' => $request->saleOrderId,
            'place_of_supply' => $request->placeOfSupply,
            'eway_bill_no' => $request->ewayBillNo,
            'taxable_value' => round($taxableValue, 2),
            'cgst_amount' => round($cgstAmount, 2),
            'sgst_amount' => round($sgstAmount, 2),
            'igst_amount' => round($igstAmount, 2),
            'round_off' => $roundOff,
            'grand_total' => round($grandTotal + $roundOff, 2),
            'due_date' => $dueDate,
            'created_by' => $request->user()->id,
        ]);

        foreach ($processedItems as $item) {
            $invoice->items()->create($item);
        }

        return $this->successResponse($invoice->load(['items', 'customer']), 'Invoice created', 201);
    }

    public function getInvoice(Request $request, $id)
    {
        $invoice = Invoice::with(['items.product', 'customer', 'reminders', 'communications'])->find($id);
        if (!$invoice) return $this->errorResponse('Invoice not found', 404);
        return $this->successResponse($invoice);
    }

    // ─── RECEIPTS ─────────────────────────────────────────────────────────────

    public function listReceipts(Request $request)
    {
        $receipts = SalesReceiptVoucher::with('customer:id,name')
            ->latest()
            ->paginate(25);

        return $this->paginatedResponse($receipts);
    }

    public function createReceipt(Request $request)
    {
        $receiptNo = AutoNumber::generate('RV', 'RV');

        $receipt = DB::transaction(function () use ($request, $receiptNo) {
            $receipt = SalesReceiptVoucher::create(array_merge(
                $request->only(['customerId', 'amount', 'paymentMode', 'referenceNo', 'remarks', 'invoiceId']),
                ['receipt_no' => $receiptNo, 'created_by' => $request->user()->id]
            ));

            if ($request->invoiceId) {
                $invoice = Invoice::find($request->invoiceId);
                if ($invoice) {
                    $totalPaid = SalesReceiptVoucher::where('invoice_id', $request->invoiceId)->sum('amount');
                    $newStatus = $totalPaid >= $invoice->grand_total ? 'Paid' : 'Partial';
                    $invoice->update(['status' => $newStatus]);
                }
            }

            return $receipt;
        });

        return $this->successResponse($receipt, 'Receipt Voucher created', 201);
    }

    // ─── STOCK CHECK ──────────────────────────────────────────────────────────

    public function stockCheck(Request $request)
    {
        $results = [];
        foreach ($request->items ?? [] as $item) {
            $product = Product::find($item['productId']);
            if (!$product) continue;

            $netAvailable = $product->current_stock - $product->blocked_stock;
            $deliveryDate = $netAvailable >= $item['quantity']
                ? now()->addDays(2)
                : now()->addDays($product->production_days);

            $results[] = [
                'productId' => $product->id,
                'productName' => $product->name,
                'currentStock' => $product->current_stock,
                'blockedStock' => $product->blocked_stock,
                'netAvailable' => $netAvailable,
                'requestedQty' => $item['quantity'],
                'available' => $netAvailable >= $item['quantity'],
                'deliveryDate' => $deliveryDate,
            ];
        }

        return $this->successResponse($results);
    }

    // ─── DASHBOARD ────────────────────────────────────────────────────────────

    public function dashboard()
    {
        $totalCustomers = Customer::where('is_active', true)->whereNull('deleted_at')->count();
        $totalInvoices = Invoice::whereNull('deleted_at')->count();
        $totalRevenue = Invoice::whereNull('deleted_at')->sum('grand_total');
        $overdueInvoices = Invoice::where('status', 'Overdue')->whereNull('deleted_at')->count();

        $recentInvoices = Invoice::with('customer:id,name')
            ->latest()
            ->limit(10)
            ->get();

        $invoicesByStatus = Invoice::selectRaw('status, count(*) as _count')
            ->groupBy('status')
            ->get();

        $inquiriesByStatus = Inquiry::selectRaw('status, count(*) as _count')
            ->groupBy('status')
            ->get();

        return $this->successResponse([
            'stats' => [
                'totalCustomers' => $totalCustomers,
                'totalInvoices' => $totalInvoices,
                'totalRevenue' => $totalRevenue ?? 0,
                'overdueInvoices' => $overdueInvoices,
            ],
            'recentInvoices' => $recentInvoices,
            'invoicesByStatus' => $invoicesByStatus,
            'inquiriesByStatus' => $inquiriesByStatus,
        ]);
    }

    public function stats()
    {
        $startThis = now()->startOfMonth();
        $startNext = now()->addMonth()->startOfMonth();
        $startPrev = now()->subMonth()->startOfMonth();

        $thisCount = Invoice::whereBetween('invoice_date', [$startThis, $startNext])->count();
        $prevCount = Invoice::whereBetween('invoice_date', [$startPrev, $startThis])->count();
        $change = $prevCount ? (($thisCount - $prevCount) / $prevCount) * 100 : null;

        $breakdown = Invoice::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get();

        return $this->successResponse([
            'thisMonth' => $thisCount,
            'lastMonth' => $prevCount,
            'changePct' => $change,
            'breakdown' => $breakdown,
        ]);
    }
}
