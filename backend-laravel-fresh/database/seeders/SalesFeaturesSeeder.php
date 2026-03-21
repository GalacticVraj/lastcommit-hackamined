<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Vendor;
use App\Models\Inquiry;
use App\Models\InquiryItem;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\SaleOrder;
use App\Models\SaleOrderItem;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\PurchaseBill;
use App\Models\SalesReceiptVoucher;
use App\Models\Barcode;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SalesFeaturesSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Barcodes for all products
        $products = Product::all();
        if ($products->isEmpty()) {
            echo "⚠️ No products found. Seed products first.\n";
            return;
        }

        foreach ($products as $idx => $p) {
            // Ensure at least one barcode per product
            Barcode::updateOrCreate(
                ['productId' => $p->id, 'code' => '890' . str_pad($p->id, 10, '0', STR_PAD_LEFT)],
                ['batchNo' => 'B-' . str_pad($idx+1, 3, '0', STR_PAD_LEFT), 'qty' => rand(100, 500), 'createdBy' => 1]
            );
        }
        echo "✅ Barcodes seeded for " . $products->count() . " products\n";

        // 2. Seed Sales Flow for Jan, Feb, Mar 2026 to ensure P&L data
        $months = [1, 2, 3];
        $year = 2026;
        $customers = Customer::limit(3)->get();
        if ($customers->isEmpty()) {
            echo "⚠️ No customers found.\n";
            return;
        }

        foreach ($months as $month) {
            $monthName = Carbon::create($year, $month, 1)->format('F');
            echo "Seeding Sales for {$monthName} {$year}...\n";

            foreach ($customers as $idx => $customer) {
                $baseDate = Carbon::create($year, $month, 1 + ($idx * 5));
                
                // Inquiry
                $inq = Inquiry::create([
                    'inquiryNo' => "INQ-{$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-" . ($idx + 1),
                    'customerId' => $customer->id,
                    'inquiryDate' => $baseDate->toDateString(),
                    'status' => 'Quoted',
                    'salesPerson' => 'Deepak Verma',
                    'createdBy' => 1
                ]);

                // Inquiry Items
                $itemsCount = rand(1, 3);
                $selectedProducts = $products->random($itemsCount);
                foreach ($selectedProducts as $p) {
                    InquiryItem::create(['inquiryId' => $inq->id, 'productId' => $p->id, 'quantity' => rand(10, 50)]);
                }

                // Quotation
                $qt = Quotation::create([
                    'quoteNo' => "QT-{$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-" . ($idx + 1),
                    'inquiryId' => $inq->id,
                    'customerId' => $customer->id,
                    'status' => 'Accepted',
                    'totalAmount' => 0,
                    'validUntil' => $baseDate->copy()->addDays(15)->toDateString(),
                    'createdBy' => 1
                ]);

                $totalAmount = 0;
                foreach ($selectedProducts as $p) {
                    $qty = rand(5, 20);
                    $rate = rand(1000, 5000);
                    $total = $qty * $rate;
                    QuotationItem::create([
                        'quotationId' => $qt->id,
                        'productId' => $p->id,
                        'quantity' => $qty,
                        'rate' => $rate,
                        'gstPercent' => 18,
                        'total' => $total * 1.18
                    ]);
                    $totalAmount += $total * 1.18;
                }
                $qt->update(['totalAmount' => $totalAmount]);

                // Sale Order
                $so = SaleOrder::create([
                    'soNo' => "SO-{$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-" . ($idx + 1),
                    'quotationId' => $qt->id,
                    'customerId' => $customer->id,
                    'status' => 'Dispatched',
                    'totalAmount' => $totalAmount,
                    'createdBy' => 1
                ]);

                foreach ($selectedProducts as $p) {
                    $qty = rand(5, 20);
                    $rate = rand(1000, 5000);
                    SaleOrderItem::create([
                        'saleOrderId' => $so->id,
                        'productId' => $p->id,
                        'quantity' => $qty,
                        'rate' => $rate,
                        'gstPercent' => 18,
                        'total' => $qty * $rate * 1.18
                    ]);
                }

                // Invoice
                $invoiceStatus = ($month === 3 && $idx < 3) ? 'Unpaid' : 'Paid';
                
                $invoice = Invoice::create([
                    'invoiceNo' => "INV-{$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-" . ($idx + 1),
                    'saleOrderId' => $so->id,
                    'customerId' => $customer->id,
                    'invoiceDate' => $baseDate->copy()->addDays(5)->toDateString(),
                    'dueDate' => $baseDate->copy()->addDays(20)->toDateString(),
                    'taxableValue' => $totalAmount / 1.18,
                    'igstAmount' => $totalAmount - ($totalAmount / 1.18),
                    'grandTotal' => $totalAmount,
                    'status' => $invoiceStatus,
                    'createdBy' => 1,
                    'createdAt' => $baseDate->copy()->addDays(5),
                    'updatedAt' => $baseDate->copy()->addDays(5)
                ]);

                foreach ($selectedProducts as $p) {
                    $qty = rand(5, 20);
                    $rate = rand(1000, 5000);
                    InvoiceItem::create([
                        'invoiceId' => $invoice->id,
                        'productId' => $p->id,
                        'quantity' => $qty,
                        'rate' => $rate,
                        'gstPercent' => 18,
                        'igst' => ($qty * $rate) * 0.18,
                        'total' => $qty * $rate * 1.18
                    ]);
                }

                // Receipt
                SalesReceiptVoucher::create([
                    'receiptNo' => "RV-{$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-" . ($idx + 1),
                    'invoiceId' => $invoice->id,
                    'customerId' => $customer->id,
                    'receiptDate' => $baseDate->copy()->addDays(7)->toDateString(),
                    'amount' => $totalAmount,
                    'paymentMode' => 'Bank',
                    'createdBy' => 1
                ]);
            }
        }

        // 3. Seed Purchase Bills for Expenses to balance P&L
        $vendors = Vendor::limit(2)->get();
        if ($vendors->isEmpty()) {
            echo "⚠️ No vendors found.\n";
            return;
        }

        foreach ($months as $month) {
            foreach ($vendors as $vIdx => $vendor) {
                $taxable = rand(50000, 150000);
                PurchaseBill::create([
                    'billNo' => "PB-{$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-" . ($vIdx + 1),
                    'vendorId' => $vendor->id,
                    'vendorInvoiceNo' => "V-INV-{$month}-{$vIdx}",
                    'billDate' => Carbon::create($year, $month, 10)->toDateString(),
                    'dueDate' => Carbon::create($year, $month, 25)->toDateString(),
                    'taxableValue' => $taxable,
                    'cgstAmount' => $taxable * 0.09,
                    'sgstAmount' => $taxable * 0.09,
                    'igstAmount' => 0,
                    'grandTotal' => $taxable * 1.18,
                    'status' => 'Paid',
                    'createdBy' => 1,
                    'createdAt' => Carbon::create($year, $month, 10),
                    'updatedAt' => Carbon::create($year, $month, 10)
                ]);
            }
        }

        echo "✅ Profit and Loss data (Sales & Purchases) seeded for Q1 2026\n";
    }
}
