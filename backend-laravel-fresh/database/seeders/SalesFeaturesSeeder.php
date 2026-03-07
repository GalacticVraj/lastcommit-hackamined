<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Invoice;
use App\Models\CollectionReminder;
use App\Models\Barcode;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Vendor;
use App\Models\PurchaseBill;
use App\Models\SaleOrder;
use App\Models\PurchaseOrder;
use App\Models\SalesReceiptVoucher;
use App\Models\PurchasePaymentVoucher;
use Carbon\Carbon;

class SalesFeaturesSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Setup Base Data
        $products = [
            ['code' => 'P001', 'name' => 'Industrial Valve X1', 'currentStock' => 250, 'lastSalePrice' => 1200, 'lastPurchasePrice' => 800],
            ['code' => 'P002', 'name' => 'Hydraulic Pump HP-2', 'currentStock' => 120, 'lastSalePrice' => 4500, 'lastPurchasePrice' => 3100],
            ['code' => 'P003', 'name' => 'Pressure Gauge PG-100', 'currentStock' => 400, 'lastSalePrice' => 600, 'lastPurchasePrice' => 400],
        ];

        foreach ($products as $p) {
            Product::updateOrCreate(['code' => $p['code']], $p);
        }

        $customer = Customer::updateOrCreate(
            ['name' => 'Precision Engineering Ltd'],
            ['email' => 'ops@precisioneng.com', 'creditPeriod' => 30, 'city' => 'Mumbai', 'state' => 'Maharashtra']
        );

        $vendor = Vendor::updateOrCreate(
            ['name' => 'Prime Industrial Supplies'],
            ['email' => 'sales@primesupplies.com', 'city' => 'Pune', 'state' => 'Maharashtra']
        );

        // 2. Synchronized Sales Flow (Sale Order -> Invoice -> Receipt)
        for ($m = 1; $m <= 3; $m++) {
            $monthDate = Carbon::create(2026, $m, 15);
            $amount = 50000 * $m;

            // Sale Order
            $so = SaleOrder::updateOrCreate(
                ['soNo' => "SO-2026-00{$m}"],
                [
                    'customerId' => $customer->id,
                    'totalAmount' => $amount,
                    'status' => 'Invoiced',
                    'customerPoNo' => "PO-CUST-{$m}",
                    'createdAt' => $monthDate->copy()->subDays(5)
                ]
            );

            // Invoice
            $status = ($m < 3) ? 'Paid' : 'Unpaid';
            $invoice = Invoice::updateOrCreate(
                ['invoiceNo' => "INV-2026-00{$m}"],
                [
                    'saleOrderId' => $so->id,
                    'customerId' => $customer->id,
                    'grandTotal' => $amount,
                    'taxableValue' => $amount / 1.18,
                    'invoiceDate' => $monthDate,
                    'dueDate' => $monthDate->copy()->addDays(30),
                    'status' => $status,
                    'createdAt' => $monthDate
                ]
            );

            // Receipt (if paid)
            if ($status === 'Paid') {
                SalesReceiptVoucher::updateOrCreate(
                    ['receiptNo' => "RV-2026-00{$m}"],
                    [
                        'customerId' => $customer->id,
                        'invoiceId' => $invoice->id,
                        'amount' => $amount,
                        'receiptDate' => $monthDate->copy()->addDays(10),
                        'paymentMode' => 'Bank Transfer'
                    ]
                );
            }
        }

        // 3. Synchronized Purchase Flow (Purchase Order -> GRN -> Purchase Bill)
        for ($m = 1; $m <= 3; $m++) {
            $monthDate = Carbon::create(2026, $m, 12);
            $amount = 30000 * $m;

            // Purchase Order
            $po = PurchaseOrder::updateOrCreate(
                ['poNo' => "PO-2026-00{$m}"],
                [
                    'vendorId' => $vendor->id,
                    'totalAmount' => $amount,
                    'status' => 'Billed',
                    'poDate' => $monthDate->copy()->subDays(7),
                    'createdAt' => $monthDate->copy()->subDays(7)
                ]
            );

            // Purchase Bill
            PurchaseBill::updateOrCreate(
                ['billNo' => "PB-2026-00{$m}"],
                [
                    'purchaseOrderId' => $po->id,
                    'vendorId' => $vendor->id,
                    'grandTotal' => $amount,
                    'taxableValue' => $amount / 1.18,
                    'billDate' => $monthDate,
                    'status' => 'Paid',
                    'createdAt' => $monthDate
                ]
            );
        }

        // 4. Barcodes (Real-look codes)
        $allProducts = Product::all();
        foreach ($allProducts as $product) {
            for ($i = 1; $i <= 3; $i++) {
                Barcode::updateOrCreate(
                    ['code' => "PROD-" . str_pad($product->id, 3, '0', STR_PAD_LEFT) . "-" . str_pad($i, 4, '0', STR_PAD_LEFT)],
                    [
                        'productId' => $product->id,
                        'batchNo' => "BATCH-" . date('Ym'),
                        'qty' => rand(5, 50),
                        'createdAt' => now()
                    ]
                );
            }
        }

        // 5. Collection Reminders
        $unpaidInvoices = Invoice::where('status', 'Unpaid')->get();
        foreach ($unpaidInvoices as $inv) {
            DB::table('CollectionReminder')->updateOrInsert(
                ['invoiceId' => $inv->id, 'triggerType' => 'Manual'],
                [
                    'scheduledAt' => now()->addDays(5),
                    'status' => 'Pending',
                    'createdAt' => now()
                ]
            );
        }
    }
}
