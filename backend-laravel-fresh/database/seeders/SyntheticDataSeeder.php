<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;
use App\Models\Vendor;
use App\Models\Product;
use App\Models\Inquiry;
use App\Models\InquiryItem;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\SaleOrder;
use App\Models\SaleOrderItem;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Services\AutoNumber;

class SyntheticDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ensure at least one customer
        $customer = Customer::firstOrCreate(
            ['name' => 'Tata Motors Ltd'],
            [
                'gstin' => '27AAACT2727Q1ZZ',
                'address' => 'Pimpri, Pune',
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'contactPerson' => 'Rajesh Kumar',
                'phone' => '9876543210',
                'isActive' => true
            ]
        );

        // 2. Ensure some products
        $p1 = Product::firstOrCreate(['code' => 'FG-ALTO-001'], ['name' => 'Alto Assembly Unit', 'category' => 'Finished Good', 'unit' => 'PCS', 'gstPercent' => 28, 'currentStock' => 10]);
        $p2 = Product::firstOrCreate(['code' => 'FG-SWIFT-001'], ['name' => 'Swift Assembly Unit', 'category' => 'Finished Good', 'unit' => 'PCS', 'gstPercent' => 28, 'currentStock' => 5]);

        // 3. Create a complete Sales Cycle (Inquiry -> Quotation -> SO -> Invoice)

        // Inquiry
        $inq = Inquiry::create([
            'inquiryNo' => AutoNumber::generate('INQ', 'INQ'),
            'customerId' => $customer->id,
            'salesPerson' => 'Admin User',
            'status' => 'Quoted',
            'createdBy' => 1,
            'createdAt' => now(),
            'updatedAt' => now()
        ]);
        InquiryItem::create(['inquiryId' => $inq->id, 'productId' => $p1->id, 'quantity' => 2]);

        // Quotation
        $qty = 2;
        $rate = 450000;
        $total = $qty * $rate * 1.28;
        $qt = Quotation::create([
            'quoteNo' => AutoNumber::generate('QT', 'QT'),
            'customerId' => $customer->id,
            'inquiryId' => $inq->id,
            'status' => 'Accepted',
            'totalAmount' => $total,
            'createdBy' => 1,
            'validUntil' => now()->addDays(30),
            'createdAt' => now(),
            'updatedAt' => now()
        ]);
        QuotationItem::create([
            'quotationId' => $qt->id,
            'productId' => $p1->id,
            'quantity' => $qty,
            'rate' => $rate,
            'gstPercent' => 28,
            'total' => $total
        ]);

        // Sale Order
        $so = SaleOrder::create([
            'soNo' => AutoNumber::generate('SO', 'SO'),
            'customerId' => $customer->id,
            'quotationId' => $qt->id,
            'status' => 'Pending',
            'totalAmount' => $total,
            'createdBy' => 1,
            'createdAt' => now(),
            'updatedAt' => now()
        ]);
        SaleOrderItem::create([
            'saleOrderId' => $so->id,
            'productId' => $p1->id,
            'quantity' => $qty,
            'rate' => $rate,
            'gstPercent' => 28,
            'total' => $total
        ]);

        // Invoice
        $taxable = $qty * $rate;
        $gst = $taxable * 0.28;
        $invoice = Invoice::create([
            'invoiceNo' => AutoNumber::generate('INV', 'INV'),
            'customerId' => $customer->id,
            'saleOrderId' => $so->id,
            'invoiceDate' => now(),
            'dueDate' => now()->addDays(30),
            'taxableValue' => $taxable,
            'igstAmount' => $gst,
            'grandTotal' => $taxable + $gst,
            'status' => 'Unpaid',
            'createdBy' => 1,
            'createdAt' => now(),
            'updatedAt' => now()
        ]);
        InvoiceItem::create([
            'invoiceId' => $invoice->id,
            'productId' => $p1->id,
            'quantity' => $qty,
            'rate' => $rate,
            'gstPercent' => 28,
            'igst' => $gst,
            'total' => $taxable + $gst
        ]);

        echo "✅ Synthetic sales data created for Tata Motors\n";
    }
}
