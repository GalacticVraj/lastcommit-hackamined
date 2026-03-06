<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Inquiry;
use App\Models\Quotation;
use App\Models\SaleOrder;
use App\Models\Invoice;
use App\Models\SalesReceiptVoucher;
use App\Models\DispatchAdvice;
use App\Models\CollectionReminder;
use App\Models\CommunicationLog;
use App\Models\Transporter;
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
        $query = Customer::whereNull('deletedAt');

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
            'inquiries' => fn($q) => $q->latest()->limit(10),
            'invoices' => fn($q) => $q->latest()->limit(10),
        ])->find($id);

        if (!$customer)
            return $this->errorResponse('Customer not found', 404);

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
            'deletedAt' => now(),
            'isActive' => false,
        ]);

        return $this->successResponse(null, 'Customer deleted');
    }

    public function getCustomerProfile(Request $request, $id)
    {
        $customer = Customer::find($id);
        if (!$customer)
            return $this->errorResponse('Customer not found', 404);

        $saleOrders = SaleOrder::where('customerId', $id)->whereNull('deletedAt')->latest()->get();
        $invoices = Invoice::where('customerId', $id)->whereNull('deletedAt')->latest()->get();
        $receipts = SalesReceiptVoucher::where('customerId', $id)->latest('receiptDate')->get();

        $totalBusiness = $invoices->sum('grandTotal');
        $totalReceived = $receipts->sum('amount');
        $outstanding = $totalBusiness - $totalReceived;

        $now = now();
        $taggedInvoices = $invoices->map(function ($inv) use ($now) {
            $inv->paymentStatus = $inv->status === 'Paid' ? 'Paid'
                : ($inv->dueDate < $now ? 'Overdue' : 'Unpaid');
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

        if (!$employee)
            return $this->errorResponse('Salesman/Employee not found', 404);

        $inquiries = Inquiry::where('salesPerson', $employee->name)->whereNull('deletedAt')->latest()->get();
        $saleOrders = SaleOrder::where('salesPerson', $employee->name)->whereNull('deletedAt')->latest()->get();

        $convertedInquiries = $inquiries->filter(fn($i) => in_array($i->status, ['Won', 'Converted']))->count();
        $conversionRate = $inquiries->count() ? round(($convertedInquiries / $inquiries->count()) * 100, 1) : 0;
        $totalSales = $saleOrders->sum('grandTotal');
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

    // ─── DROPDOWN ENDPOINTS ──────────────────────────────────────────────────

    public function dropdownCustomers()
    {
        $customers = Customer::whereNull('deletedAt')
            ->where('isActive', true)
            ->select('id', 'name', 'gstin', 'address', 'city', 'state', 'pincode', 'contactPerson', 'phone', 'email', 'creditPeriod')
            ->orderBy('name')
            ->get();
        return $this->successResponse($customers);
    }

    public function dropdownInquiries(Request $request)
    {
        $query = Inquiry::with('customer:id,name')->whereNull('deletedAt');
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }
        $inquiries = $query->select('id', 'inquiryNo', 'customerId', 'status', 'salesPerson')
            ->orderBy('id', 'desc')
            ->get();
        return $this->successResponse($inquiries);
    }

    public function dropdownQuotations(Request $request)
    {
        $query = Quotation::with('customer:id,name')->whereNull('deletedAt');
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }
        $quotations = $query->select('id', 'quoteNo', 'customerId', 'inquiryId', 'totalAmount', 'status')
            ->orderBy('id', 'desc')
            ->get();
        return $this->successResponse($quotations);
    }

    public function dropdownSaleOrders(Request $request)
    {
        $query = SaleOrder::with('customer:id,name')->whereNull('deletedAt');
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }
        $orders = $query->select('id', 'soNo', 'customerId', 'quotationId', 'customerPoNo', 'totalAmount', 'status', 'billingAddress', 'shippingAddress')
            ->orderBy('id', 'desc')
            ->get();
        return $this->successResponse($orders);
    }

    public function dropdownInvoices(Request $request)
    {
        $query = Invoice::with('customer:id,name')->whereNull('deletedAt');
        if ($status = $request->get('status')) {
            if ($status === 'outstanding') {
                $query->whereIn('status', ['Unpaid', 'Partial', 'Overdue']);
            } else {
                $query->where('status', $status);
            }
        }
        $invoices = $query->select('id', 'invoiceNo', 'customerId', 'saleOrderId', 'grandTotal', 'status', 'dueDate')
            ->orderBy('id', 'desc')
            ->get();
        return $this->successResponse($invoices);
    }

    public function dropdownTransporters()
    {
        $transporters = Transporter::where('isActive', true)
            ->select('id', 'name', 'ownerName', 'mobile', 'gstin')
            ->orderBy('name')
            ->get();
        return $this->successResponse($transporters);
    }

    public function dropdownProducts()
    {
        $products = Product::whereNull('deletedAt')
            ->where('isActive', true)
            ->select('id', 'code', 'name', 'unit', 'gstPercent', 'lastSalePrice', 'currentStock')
            ->orderBy('name')
            ->get();
        return $this->successResponse($products);
    }

    // ─── INQUIRIES ────────────────────────────────────────────────────────────

    public function listInquiries(Request $request)
    {
        $query = Inquiry::with('customer:id,name')->whereNull('deletedAt');

        if ($search = $request->get('search')) {
            $query->where('inquiryNo', 'like', "%{$search}%");
        }

        $perPage = (int) $request->get('per_page', 25);
        return $this->paginatedResponse($query->latest()->paginate($perPage));
    }

    public function createInquiry(Request $request)
    {
        $inquiryNo = AutoNumber::generate('INQ', 'INQ');

        $inquiry = DB::transaction(function () use ($request, $inquiryNo) {
            $inquiry = Inquiry::create([
                'inquiryNo' => $inquiryNo,
                'customerId' => $request->customerId,
                'salesPerson' => $request->salesPerson,
                'remarks' => $request->remarks,
                'createdBy' => $request->user()->id,
            ]);

            if ($request->has('items') && is_array($request->items)) {
                foreach ($request->items as $item) {
                    $inquiry->items()->create([
                        'productId' => $item['productId'],
                        'quantity' => $item['quantity'],
                    ]);
                }
            }

            return $inquiry->load(['items', 'customer']);
        });

        return $this->successResponse($inquiry, 'Inquiry created', 201);
    }

    public function getInquiry(Request $request, $id)
    {
        $inquiry = Inquiry::with(['items.product', 'customer', 'quotations'])->find($id);
        if (!$inquiry)
            return $this->errorResponse('Inquiry not found', 404);
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
        $query = Quotation::with('customer:id,name')->whereNull('deletedAt');

        if ($search = $request->get('search')) {
            $query->where('quoteNo', 'like', "%{$search}%");
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
                'quoteNo' => $quoteNo,
                'customerId' => $request->customerId,
                'inquiryId' => $request->inquiryId,
                'validUntil' => $request->validUntil,
                'paymentTerms' => $request->paymentTerms,
                'totalAmount' => round($totalAmount, 2),
                'createdBy' => $request->user()->id,
            ]);

            foreach ($items as $item) {
                $quotation->items()->create([
                    'productId' => $item['productId'],
                    'quantity' => $item['quantity'],
                    'rate' => $item['rate'],
                    'gstPercent' => $item['gstPercent'] ?? 18,
                    'total' => $item['total'],
                ]);
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
        if (!$quotation)
            return $this->errorResponse('Quotation not found', 404);
        return $this->successResponse($quotation);
    }

    public function updateQuotation(Request $request, $id)
    {
        $quotation = Quotation::findOrFail($id);
        $updateData = ['updatedBy' => $request->user()->id];

        if ($request->has('paymentTerms'))
            $updateData['paymentTerms'] = $request->paymentTerms;
        if ($request->has('status'))
            $updateData['status'] = $request->status;
        if ($request->has('validUntil'))
            $updateData['validUntil'] = $request->validUntil;

        $quotation->update($updateData);

        return $this->successResponse($quotation, 'Quotation updated');
    }

    // ─── SALE ORDERS ──────────────────────────────────────────────────────────

    public function listSaleOrders(Request $request)
    {
        $query = SaleOrder::with('customer:id,name')->whereNull('deletedAt');
        if ($search = $request->get('search')) {
            $query->where('soNo', 'like', "%{$search}%");
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
                'soNo' => $soNo,
                'customerId' => $request->customerId,
                'quotationId' => $request->quotationId,
                'customerPoNo' => $request->customerPoNo,
                'customerPoDate' => $request->customerPoDate,
                'billingAddress' => $request->billingAddress,
                'shippingAddress' => $request->shippingAddress,
                'totalAmount' => round($totalAmount, 2),
                'createdBy' => $request->user()->id,
            ]);

            foreach ($items as $item) {
                $order->items()->create([
                    'productId' => $item['productId'],
                    'quantity' => $item['quantity'],
                    'rate' => $item['rate'],
                    'gstPercent' => $item['gstPercent'] ?? 18,
                    'total' => $item['total'],
                ]);
            }

            return $order->load(['items', 'customer']);
        });

        return $this->successResponse($order, 'Sale Order created', 201);
    }

    public function getSaleOrder(Request $request, $id)
    {
        $order = SaleOrder::with(['items.product', 'customer', 'invoices', 'dispatchAdvices'])->find($id);
        if (!$order)
            return $this->errorResponse('Sale Order not found', 404);
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

    // ─── DISPATCH ADVICES ─────────────────────────────────────────────────────

    public function listDispatchAdvices(Request $request)
    {
        $query = DispatchAdvice::with(['saleOrder.customer:id,name', 'transporter:id,name'])
            ->whereNull('deletedAt');
        if ($search = $request->get('search')) {
            $query->where('dispatchNo', 'like', "%{$search}%");
        }
        return $this->paginatedResponse($query->latest()->paginate(25));
    }

    public function createDispatchAdvice(Request $request)
    {
        $dispatchNo = AutoNumber::generate('DA', 'DA');

        $dispatch = DB::transaction(function () use ($request, $dispatchNo) {
            $dispatch = DispatchAdvice::create([
                'dispatchNo' => $dispatchNo,
                'saleOrderId' => $request->saleOrderId,
                'transporterId' => $request->transporterId,
                'vehicleNo' => $request->vehicleNo,
                'driverName' => $request->driverName,
                'createdBy' => $request->user()->id,
            ]);

            // Update sale order status to Dispatched
            SaleOrder::where('id', $request->saleOrderId)->update(['status' => 'Dispatched']);

            return $dispatch->load(['saleOrder.customer', 'transporter']);
        });

        return $this->successResponse($dispatch, 'Dispatch Advice created', 201);
    }

    public function getDispatchAdvice(Request $request, $id)
    {
        $dispatch = DispatchAdvice::with(['saleOrder.customer', 'saleOrder.items.product', 'transporter'])->find($id);
        if (!$dispatch)
            return $this->errorResponse('Dispatch Advice not found', 404);
        return $this->successResponse($dispatch);
    }

    public function updateDispatchAdvice(Request $request, $id)
    {
        $dispatch = DispatchAdvice::findOrFail($id);
        $dispatch->update(array_merge(
            $request->only(['vehicleNo', 'driverName', 'status', 'transporterId']),
            ['updatedBy' => $request->user()->id]
        ));
        return $this->successResponse($dispatch, 'Dispatch Advice updated');
    }

    // ─── INVOICES ─────────────────────────────────────────────────────────────

    public function listInvoices(Request $request)
    {
        $query = Invoice::with('customer:id,name')->whereNull('deletedAt');
        if ($search = $request->get('search')) {
            $query->where('invoiceNo', 'like', "%{$search}%");
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
        $dueDate = now()->addDays($customer->creditPeriod ?? 30);

        $invoice = Invoice::create([
            'invoiceNo' => $invoiceNo,
            'customerId' => $request->customerId,
            'saleOrderId' => $request->saleOrderId,
            'placeOfSupply' => $request->placeOfSupply,
            'ewayBillNo' => $request->ewayBillNo,
            'taxableValue' => round($taxableValue, 2),
            'cgstAmount' => round($cgstAmount, 2),
            'sgstAmount' => round($sgstAmount, 2),
            'igstAmount' => round($igstAmount, 2),
            'roundOff' => $roundOff,
            'grandTotal' => round($grandTotal + $roundOff, 2),
            'dueDate' => $dueDate,
            'createdBy' => $request->user()->id,
        ]);

        foreach ($processedItems as $item) {
            $invoice->items()->create([
                'productId' => $item['productId'],
                'quantity' => $item['quantity'],
                'rate' => $item['rate'],
                'cgst' => $item['cgst'],
                'sgst' => $item['sgst'],
                'igst' => $item['igst'],
                'total' => $item['total'],
            ]);
        }

        return $this->successResponse($invoice->load(['items', 'customer']), 'Invoice created', 201);
    }

    public function getInvoice(Request $request, $id)
    {
        $invoice = Invoice::with(['items.product', 'customer', 'reminders', 'communications', 'receipts'])->find($id);
        if (!$invoice)
            return $this->errorResponse('Invoice not found', 404);
        return $this->successResponse($invoice);
    }

    // ─── COLLECTIONS & REMINDERS ──────────────────────────────────────────────

    public function listCollections(Request $request)
    {
        $invoices = Invoice::with('customer:id,name,creditPeriod')
            ->whereNull('deletedAt')
            ->whereIn('status', ['Unpaid', 'Partial', 'Overdue'])
            ->latest()
            ->paginate(25);

        $now = now();
        $invoices->getCollection()->transform(function ($inv) use ($now) {
            $dueDate = $inv->dueDate ? \Carbon\Carbon::parse($inv->dueDate) : null;
            $daysUntilDue = $dueDate ? $now->diffInDays($dueDate, false) : null;

            if ($daysUntilDue === null) {
                $inv->reminderStatus = 'Unknown';
            } elseif ($daysUntilDue < 0) {
                $inv->reminderStatus = 'Overdue';
                $inv->daysOverdue = abs($daysUntilDue);
            } elseif ($daysUntilDue == 0) {
                $inv->reminderStatus = 'Due Today';
                $inv->daysOverdue = 0;
            } else {
                $inv->reminderStatus = 'Upcoming';
                $inv->daysOverdue = 0;
            }

            $inv->totalPaid = SalesReceiptVoucher::where('invoiceId', $inv->id)->sum('amount');
            $inv->outstanding = $inv->grandTotal - $inv->totalPaid;
            $inv->communications = CommunicationLog::where('invoiceId', $inv->id)->orderBy('sentAt', 'desc')->get();

            return $inv;
        });

        return $this->paginatedResponse($invoices);
    }

    public function createCommunicationLog(Request $request)
    {
        $log = CommunicationLog::create([
            'invoiceId' => $request->invoiceId,
            'channel' => $request->channel,
            'content' => $request->content,
            'status' => $request->status ?? 'Sent',
        ]);

        return $this->successResponse($log, 'Communication log created', 201);
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
                ['receiptNo' => $receiptNo, 'createdBy' => $request->user()->id]
            ));

            if ($request->invoiceId) {
                $invoice = Invoice::find($request->invoiceId);
                if ($invoice) {
                    $totalPaid = SalesReceiptVoucher::where('invoiceId', $request->invoiceId)->sum('amount');
                    $newStatus = $totalPaid >= $invoice->grandTotal ? 'Paid' : 'Partial';
                    $invoice->update(['status' => $newStatus]);
                }
            }

            return $receipt;
        });

        return $this->successResponse($receipt, 'Receipt Voucher created', 201);
    }

    public function getReceipt(Request $request, $id)
    {
        $receipt = SalesReceiptVoucher::find($id);
        if (!$receipt) {
            return $this->errorResponse('Receipt not found', 404);
        }

        $customer = Customer::find($receipt->customerId);
        $invoice = $receipt->invoiceId ? Invoice::find($receipt->invoiceId) : null;

        return $this->successResponse(array_merge(
            $receipt->toArray(),
            [
                'customer' => $customer ? ['id' => $customer->id, 'name' => $customer->name, 'address' => $customer->address, 'city' => $customer->city, 'state' => $customer->state, 'phone' => $customer->phone, 'gstin' => $customer->gstin] : null,
                'invoice' => $invoice ? ['id' => $invoice->id, 'invoiceNo' => $invoice->invoiceNo, 'invoiceDate' => $invoice->invoiceDate, 'grandTotal' => $invoice->grandTotal] : null,
            ]
        ));
    }

    // ─── STOCK CHECK ──────────────────────────────────────────────────────────

    public function stockCheck(Request $request)
    {
        $results = [];
        foreach ($request->items ?? [] as $item) {
            $product = Product::find($item['productId']);
            if (!$product)
                continue;

            $netAvailable = $product->currentStock - $product->blockedStock;
            $deliveryDate = $netAvailable >= $item['quantity']
                ? now()->addDays(2)
                : now()->addDays($product->productionDays);

            $results[] = [
                'productId' => $product->id,
                'productName' => $product->name,
                'currentStock' => $product->currentStock,
                'blockedStock' => $product->blockedStock,
                'netAvailable' => $netAvailable,
                'requestedQty' => $item['quantity'],
                'available' => $netAvailable >= $item['quantity'],
                'deliveryDate' => $deliveryDate,
            ];
        }

        return $this->successResponse($results);
    }

    // ─── ENHANCED DASHBOARD ──────────────────────────────────────────────────

    public function dashboard()
    {
        // Basic stats
        $totalCustomers = Customer::where('isActive', true)->whereNull('deletedAt')->count();
        $totalInvoices = Invoice::whereNull('deletedAt')->count();
        $totalRevenue = Invoice::whereNull('deletedAt')->sum('grandTotal') ?? 0;

        // Overdue
        $overdueInvoices = Invoice::whereIn('status', ['Unpaid', 'Partial'])
            ->where('dueDate', '<', now())
            ->whereNull('deletedAt')
            ->get();
        $overdueCount = $overdueInvoices->count();
        $overdueAmount = $overdueInvoices->sum('grandTotal');

        // Inquiries by status (funnel)
        $inquiriesByStatus = Inquiry::selectRaw('status, count(*) as _count')
            ->whereNull('deletedAt')
            ->groupBy('status')
            ->get();

        // Quotation to PO conversion
        $totalQuotations = Quotation::whereNull('deletedAt')->count();
        $acceptedQuotations = Quotation::whereNull('deletedAt')->where('status', 'Accepted')->count();
        $conversionRate = $totalQuotations > 0 ? round(($acceptedQuotations / $totalQuotations) * 100, 1) : 0;

        // Sale Orders by status
        $soByStatus = SaleOrder::selectRaw('status, count(*) as _count')
            ->whereNull('deletedAt')
            ->groupBy('status')
            ->get();

        // Invoice vs Collected vs Outstanding
        $totalInvoiceValue = Invoice::whereNull('deletedAt')->sum('grandTotal') ?? 0;
        $totalCollected = SalesReceiptVoucher::sum('amount') ?? 0;
        $totalOutstanding = $totalInvoiceValue - $totalCollected;

        // Monthly revenue trend (last 6 months)
        $monthlyRevenue = [];
        for ($i = 5; $i >= 0; $i--) {
            $start = now()->subMonths($i)->startOfMonth();
            $end = now()->subMonths($i)->endOfMonth();
            $revenue = Invoice::whereNull('deletedAt')
                ->whereBetween('createdAt', [$start, $end])
                ->sum('grandTotal');
            $monthlyRevenue[] = [
                'month' => $start->format('M Y'),
                'revenue' => round($revenue, 2),
            ];
        }

        // Top 5 customers by billed amount
        $topCustomers = Invoice::selectRaw('customerId, sum(grandTotal) as totalBilled')
            ->whereNull('deletedAt')
            ->groupBy('customerId')
            ->orderByDesc('totalBilled')
            ->limit(5)
            ->get()
            ->map(function ($row) {
                $customer = Customer::find($row->customerId);
                return [
                    'customerId' => $row->customerId,
                    'name' => $customer->name ?? 'Unknown',
                    'totalBilled' => round($row->totalBilled, 2),
                ];
            });

        // Recent invoices
        $recentInvoices = Invoice::with('customer:id,name')
            ->latest()
            ->limit(10)
            ->get();

        return $this->successResponse([
            'stats' => [
                'totalCustomers' => $totalCustomers,
                'totalInvoices' => $totalInvoices,
                'totalRevenue' => $totalRevenue,
                'overdueCount' => $overdueCount,
                'overdueAmount' => $overdueAmount,
                'totalQuotations' => $totalQuotations,
                'acceptedQuotations' => $acceptedQuotations,
                'conversionRate' => $conversionRate,
                'totalInvoiceValue' => $totalInvoiceValue,
                'totalCollected' => $totalCollected,
                'totalOutstanding' => $totalOutstanding,
            ],
            'inquiriesByStatus' => $inquiriesByStatus,
            'soByStatus' => $soByStatus,
            'monthlyRevenue' => $monthlyRevenue,
            'topCustomers' => $topCustomers,
            'recentInvoices' => $recentInvoices,
        ]);
    }

    public function stats()
    {
        $startThis = now()->startOfMonth();
        $startNext = now()->addMonth()->startOfMonth();
        $startPrev = now()->subMonth()->startOfMonth();

        $thisCount = Invoice::whereBetween('createdAt', [$startThis, $startNext])->count();
        $prevCount = Invoice::whereBetween('createdAt', [$startPrev, $startThis])->count();
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
