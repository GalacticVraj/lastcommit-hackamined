<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SalesSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // ─── TRANSPORTERS ────────────────────────────────────────────────
        $transporters = [
            ['name' => 'Shree Maruti Courier', 'ownerName' => 'Rajesh Patel', 'mobile' => '9876543210', 'gstin' => '24AABCS1234A1Z5', 'isActive' => true, 'createdAt' => $now, 'updatedAt' => $now],
            ['name' => 'Blue Dart Express', 'ownerName' => 'Sunil Sharma', 'mobile' => '9876543211', 'gstin' => '27AABCB5678D1Z3', 'isActive' => true, 'createdAt' => $now, 'updatedAt' => $now],
            ['name' => 'VRL Logistics', 'ownerName' => 'Mohan Kumar', 'mobile' => '9876543212', 'gstin' => '29AABCV9012G1Z1', 'isActive' => true, 'createdAt' => $now, 'updatedAt' => $now],
        ];
        DB::table('Transporter')->insert($transporters);

        // ─── PRODUCTS ────────────────────────────────────────────────────
        $products = [
            ['code' => 'PRD-001', 'name' => 'CNC Machined Shaft', 'category' => 'Machine Parts', 'unit' => 'Nos', 'hsnCode' => '8483', 'gstPercent' => 18, 'currentStock' => 150, 'lastSalePrice' => 2500, 'isActive' => true, 'createdAt' => $now, 'updatedAt' => $now],
            ['code' => 'PRD-002', 'name' => 'Precision Bearing Assembly', 'category' => 'Bearings', 'unit' => 'Nos', 'hsnCode' => '8482', 'gstPercent' => 18, 'currentStock' => 200, 'lastSalePrice' => 1800, 'isActive' => true, 'createdAt' => $now, 'updatedAt' => $now],
            ['code' => 'PRD-003', 'name' => 'Industrial Gear Box', 'category' => 'Gear Systems', 'unit' => 'Nos', 'hsnCode' => '8483', 'gstPercent' => 18, 'currentStock' => 50, 'lastSalePrice' => 45000, 'isActive' => true, 'createdAt' => $now, 'updatedAt' => $now],
            ['code' => 'PRD-004', 'name' => 'Hydraulic Cylinder 100mm', 'category' => 'Hydraulics', 'unit' => 'Nos', 'hsnCode' => '8412', 'gstPercent' => 18, 'currentStock' => 80, 'lastSalePrice' => 12000, 'isActive' => true, 'createdAt' => $now, 'updatedAt' => $now],
            ['code' => 'PRD-005', 'name' => 'SS Flange DN50', 'category' => 'Flanges', 'unit' => 'Nos', 'hsnCode' => '7307', 'gstPercent' => 18, 'currentStock' => 500, 'lastSalePrice' => 850, 'isActive' => true, 'createdAt' => $now, 'updatedAt' => $now],
        ];
        DB::table('Product')->insert($products);
        $productIds = DB::table('Product')->pluck('id')->toArray();

        // ─── CUSTOMERS ───────────────────────────────────────────────────
        $customers = [
            ['name' => 'Tata Motors Ltd.', 'gstin' => '27AAACT1234P1ZP', 'stateCode' => '27', 'address' => 'Pimpri-Chinchwad, Pune', 'city' => 'Pune', 'state' => 'Maharashtra', 'pincode' => '411018', 'contactPerson' => 'Ramesh Iyer', 'phone' => '9820011001', 'email' => 'procurement@tatamotors.com', 'creditPeriod' => 45, 'isActive' => true, 'createdAt' => $now, 'updatedAt' => $now],
            ['name' => 'Larsen & Toubro Ltd.', 'gstin' => '27AAACL5678Q1ZQ', 'stateCode' => '27', 'address' => 'Powai, Mumbai', 'city' => 'Mumbai', 'state' => 'Maharashtra', 'pincode' => '400076', 'contactPerson' => 'Suresh Menon', 'phone' => '9820022002', 'email' => 'purchase@lnt.com', 'creditPeriod' => 60, 'isActive' => true, 'createdAt' => $now, 'updatedAt' => $now],
            ['name' => 'Bharat Heavy Electricals', 'gstin' => '09AAACB9012R1ZR', 'stateCode' => '09', 'address' => 'Sector 17, Noida', 'city' => 'Noida', 'state' => 'Uttar Pradesh', 'pincode' => '201301', 'contactPerson' => 'Anil Gupta', 'phone' => '9820033003', 'email' => 'vendor@bhel.in', 'creditPeriod' => 30, 'isActive' => true, 'createdAt' => $now, 'updatedAt' => $now],
            ['name' => 'Mahindra & Mahindra', 'gstin' => '27AAACM3456S1ZS', 'stateCode' => '27', 'address' => 'Kandivali East, Mumbai', 'city' => 'Mumbai', 'state' => 'Maharashtra', 'pincode' => '400101', 'contactPerson' => 'Vijay Kulkarni', 'phone' => '9820044004', 'email' => 'supply@mahindra.com', 'creditPeriod' => 45, 'isActive' => true, 'createdAt' => $now, 'updatedAt' => $now],
            ['name' => 'Godrej & Boyce Mfg.', 'gstin' => '27AAACG7890T1ZT', 'stateCode' => '27', 'address' => 'Vikhroli East, Mumbai', 'city' => 'Mumbai', 'state' => 'Maharashtra', 'pincode' => '400079', 'contactPerson' => 'Priya Joshi', 'phone' => '9820055005', 'email' => 'sourcing@godrej.com', 'creditPeriod' => 30, 'isActive' => true, 'createdAt' => $now, 'updatedAt' => $now],
            ['name' => 'Kirloskar Brothers', 'gstin' => '27AAACK1234U1ZU', 'stateCode' => '27', 'address' => 'Udyamnagar, Pune', 'city' => 'Pune', 'state' => 'Maharashtra', 'pincode' => '411041', 'contactPerson' => 'Deepak More', 'phone' => '9820066006', 'email' => 'purchase@kirloskar.com', 'creditPeriod' => 45, 'isActive' => true, 'createdAt' => $now, 'updatedAt' => $now],
            ['name' => 'Thermax Limited', 'gstin' => '27AAACT5678V1ZV', 'stateCode' => '27', 'address' => 'Chinchwad, Pune', 'city' => 'Pune', 'state' => 'Maharashtra', 'pincode' => '411019', 'contactPerson' => 'Sachin Deshpande', 'phone' => '9820077007', 'email' => 'procurement@thermaxglobal.com', 'creditPeriod' => 60, 'isActive' => true, 'createdAt' => $now, 'updatedAt' => $now],
            ['name' => 'Ashok Leyland', 'gstin' => '33AAACA9012W1ZW', 'stateCode' => '33', 'address' => 'Ennore, Chennai', 'city' => 'Chennai', 'state' => 'Tamil Nadu', 'pincode' => '600057', 'contactPerson' => 'Karthik Rajan', 'phone' => '9820088008', 'email' => 'vendor@ashokleyland.com', 'creditPeriod' => 30, 'isActive' => true, 'createdAt' => $now, 'updatedAt' => $now],
        ];
        DB::table('Customer')->insert($customers);
        $customerIds = DB::table('Customer')->pluck('id')->toArray();

        // ─── AUTO COUNTERS ───────────────────────────────────────────────
        DB::table('AutoCounter')->updateOrInsert(['prefix' => 'INQ'], ['currentValue' => 12]);
        DB::table('AutoCounter')->updateOrInsert(['prefix' => 'QT'], ['currentValue' => 8]);
        DB::table('AutoCounter')->updateOrInsert(['prefix' => 'SO'], ['currentValue' => 6]);
        DB::table('AutoCounter')->updateOrInsert(['prefix' => 'DA'], ['currentValue' => 4]);
        DB::table('AutoCounter')->updateOrInsert(['prefix' => 'INV'], ['currentValue' => 8]);
        DB::table('AutoCounter')->updateOrInsert(['prefix' => 'RV'], ['currentValue' => 5]);

        // ─── INQUIRIES ───────────────────────────────────────────────────
        $inquiries = [];
        $statuses = ['New', 'New', 'Processing', 'Processing', 'Quoted', 'Quoted', 'Quoted', 'Quoted', 'Quoted', 'Lost', 'Lost', 'New'];
        for ($i = 1; $i <= 12; $i++) {
            $inquiries[] = [
                'inquiryNo' => 'INQ-' . str_pad($i, 5, '0', STR_PAD_LEFT),
                'customerId' => $customerIds[($i - 1) % count($customerIds)],
                'inquiryDate' => $now->copy()->subDays(60 - $i * 4),
                'salesPerson' => ['Rajesh Kumar', 'Priya Sharma', 'Amit Patel'][$i % 3],
                'status' => $statuses[$i - 1],
                'remarks' => 'Inquiry for industrial components - batch ' . $i,
                'isActive' => true,
                'createdAt' => $now->copy()->subDays(60 - $i * 4),
                'updatedAt' => $now,
            ];
        }
        DB::table('Inquiry')->insert($inquiries);
        $inquiryIds = DB::table('Inquiry')->pluck('id')->toArray();

        // Inquiry Items
        $inquiryItems = [];
        foreach ($inquiryIds as $idx => $id) {
            $numItems = ($idx % 3) + 1;
            for ($j = 0; $j < $numItems; $j++) {
                $inquiryItems[] = [
                    'inquiryId' => $id,
                    'productId' => $productIds[$j % count($productIds)],
                    'quantity' => rand(5, 50),
                ];
            }
        }
        DB::table('InquiryItem')->insert($inquiryItems);

        // ─── QUOTATIONS ──────────────────────────────────────────────────
        $quotedInquiryIds = DB::table('Inquiry')->where('status', 'Quoted')->pluck('id', 'customerId')->toArray();
        $quotations = [];
        $qStatuses = ['Draft', 'Sent', 'Accepted', 'Accepted', 'Accepted', 'Sent', 'Rejected', 'Accepted'];
        $qi = 0;
        foreach ($quotedInquiryIds as $custId => $inqId) {
            $qi++;
            if ($qi > 8) break;
            $quotations[] = [
                'quoteNo' => 'QT-' . str_pad($qi, 5, '0', STR_PAD_LEFT),
                'inquiryId' => $inqId,
                'customerId' => $custId,
                'quoteDate' => $now->copy()->subDays(45 - $qi * 4),
                'validUntil' => $now->copy()->addDays(30),
                'paymentTerms' => ['Net 30', 'Net 45', 'Net 60', 'Advance 50%'][$qi % 4],
                'totalAmount' => 0,
                'status' => $qStatuses[$qi - 1],
                'isActive' => true,
                'createdAt' => $now->copy()->subDays(45 - $qi * 4),
                'updatedAt' => $now,
            ];
        }
        // Ensure we have exactly 8 quotations
        while (count($quotations) < 8) {
            $qi++;
            $quotations[] = [
                'quoteNo' => 'QT-' . str_pad($qi, 5, '0', STR_PAD_LEFT),
                'inquiryId' => null,
                'customerId' => $customerIds[($qi - 1) % count($customerIds)],
                'quoteDate' => $now->copy()->subDays(30 - $qi * 2),
                'validUntil' => $now->copy()->addDays(30),
                'paymentTerms' => 'Net 30',
                'totalAmount' => 0,
                'status' => $qStatuses[min($qi - 1, 7)],
                'isActive' => true,
                'createdAt' => $now->copy()->subDays(30 - $qi * 2),
                'updatedAt' => $now,
            ];
        }
        DB::table('Quotation')->insert($quotations);
        $quotationIds = DB::table('Quotation')->pluck('id')->toArray();

        // Quotation Items + update totals
        foreach ($quotationIds as $idx => $qid) {
            $totalAmount = 0;
            $numItems = ($idx % 3) + 1;
            for ($j = 0; $j < $numItems; $j++) {
                $qty = rand(5, 30);
                $rate = [2500, 1800, 45000, 12000, 850][$j % 5];
                $gst = 18;
                $total = round($qty * $rate * (1 + $gst / 100), 2);
                $totalAmount += $total;
                DB::table('QuotationItem')->insert([
                    'quotationId' => $qid,
                    'productId' => $productIds[$j % count($productIds)],
                    'quantity' => $qty,
                    'rate' => $rate,
                    'gstPercent' => $gst,
                    'total' => $total,
                    'createdAt' => $now,
                ]);
            }
            DB::table('Quotation')->where('id', $qid)->update(['totalAmount' => round($totalAmount, 2)]);
        }

        // ─── SALE ORDERS ─────────────────────────────────────────────────
        $acceptedQuotations = DB::table('Quotation')->where('status', 'Accepted')->get();
        $soStatuses = ['Pending', 'Pending', 'Dispatched', 'Dispatched', 'Closed', 'Pending'];
        $soIdx = 0;
        foreach ($acceptedQuotations as $qt) {
            $soIdx++;
            if ($soIdx > 6) break;
            $customer = DB::table('Customer')->find($qt->customerId);
            $so = DB::table('SaleOrder')->insertGetId([
                'soNo' => 'SO-' . str_pad($soIdx, 5, '0', STR_PAD_LEFT),
                'quotationId' => $qt->id,
                'customerId' => $qt->customerId,
                'customerPoNo' => 'PO/' . $customer->name . '/' . str_pad($soIdx, 3, '0', STR_PAD_LEFT),
                'customerPoDate' => $now->copy()->subDays(20 - $soIdx * 2),
                'billingAddress' => $customer->address . ', ' . $customer->city . ', ' . $customer->state . ' - ' . $customer->pincode,
                'shippingAddress' => $customer->address . ', ' . $customer->city . ', ' . $customer->state . ' - ' . $customer->pincode,
                'totalAmount' => $qt->totalAmount,
                'status' => $soStatuses[$soIdx - 1],
                'isActive' => true,
                'createdAt' => $now->copy()->subDays(20 - $soIdx * 2),
                'updatedAt' => $now,
            ]);

            // Copy quotation items to SO items
            $qItems = DB::table('QuotationItem')->where('quotationId', $qt->id)->get();
            foreach ($qItems as $qi) {
                DB::table('SaleOrderItem')->insert([
                    'saleOrderId' => $so,
                    'productId' => $qi->productId,
                    'quantity' => $qi->quantity,
                    'rate' => $qi->rate,
                    'gstPercent' => $qi->gstPercent,
                    'total' => $qi->total,
                    'status' => $soStatuses[$soIdx - 1] === 'Closed' ? 'Closed' : 'Pending',
                    'createdAt' => $now,
                ]);
            }
        }
        $saleOrderIds = DB::table('SaleOrder')->pluck('id')->toArray();

        // ─── DISPATCH ADVICES ────────────────────────────────────────────
        $dispatchedSOs = DB::table('SaleOrder')->whereIn('status', ['Dispatched', 'Closed'])->get();
        $daIdx = 0;
        $transporterIds = DB::table('Transporter')->pluck('id')->toArray();
        foreach ($dispatchedSOs as $so) {
            $daIdx++;
            DB::table('DispatchAdvice')->insert([
                'dispatchNo' => 'DA-' . str_pad($daIdx, 5, '0', STR_PAD_LEFT),
                'saleOrderId' => $so->id,
                'transporterId' => $transporterIds[$daIdx % count($transporterIds)],
                'vehicleNo' => 'MH-12-AB-' . str_pad($daIdx * 1234, 4, '0', STR_PAD_LEFT),
                'driverName' => ['Ravi Kumar', 'Santosh Yadav', 'Manoj Singh', 'Dilip Patil'][$daIdx % 4],
                'dispatchDate' => $now->copy()->subDays(10 - $daIdx),
                'status' => 'Dispatched',
                'isActive' => true,
                'createdAt' => $now->copy()->subDays(10 - $daIdx),
                'updatedAt' => $now,
            ]);
        }

        // ─── INVOICES ────────────────────────────────────────────────────
        $invoiceableSOs = DB::table('SaleOrder')->whereIn('status', ['Dispatched', 'Closed'])->get();
        $invStatuses = ['Unpaid', 'Partial', 'Paid', 'Overdue', 'Unpaid', 'Paid', 'Partial', 'Overdue'];
        $invIdx = 0;
        foreach ($invoiceableSOs as $so) {
            $invIdx++;
            $customer = DB::table('Customer')->find($so->customerId);
            $creditPeriod = $customer->creditPeriod ?? 30;
            $invoiceDate = $now->copy()->subDays(max(5, 50 - $invIdx * 8));
            $dueDate = $invoiceDate->copy()->addDays($creditPeriod);

            $soItems = DB::table('SaleOrderItem')->where('saleOrderId', $so->id)->get();
            $taxableValue = 0;
            foreach ($soItems as $item) {
                $taxableValue += $item->quantity * $item->rate;
            }
            $cgst = round($taxableValue * 0.09, 2);
            $sgst = round($taxableValue * 0.09, 2);
            $igst = 0;
            // If different state (UP/TN vs MH), use IGST
            if (in_array($customer->stateCode, ['09', '33'])) {
                $igst = round($taxableValue * 0.18, 2);
                $cgst = 0;
                $sgst = 0;
            }
            $grandTotal = round($taxableValue + $cgst + $sgst + $igst, 2);

            $status = $invStatuses[($invIdx - 1) % count($invStatuses)];
            // Ensure overdue invoices have past due dates
            if ($status === 'Overdue') {
                $dueDate = $now->copy()->subDays(rand(5, 30));
                $invoiceDate = $dueDate->copy()->subDays($creditPeriod);
            }

            $invoiceId = DB::table('Invoice')->insertGetId([
                'invoiceNo' => 'INV-' . str_pad($invIdx, 5, '0', STR_PAD_LEFT),
                'saleOrderId' => $so->id,
                'customerId' => $so->customerId,
                'invoiceDate' => $invoiceDate,
                'dueDate' => $dueDate,
                'placeOfSupply' => $customer->state,
                'taxableValue' => round($taxableValue, 2),
                'cgstAmount' => $cgst,
                'sgstAmount' => $sgst,
                'igstAmount' => $igst,
                'roundOff' => 0,
                'grandTotal' => $grandTotal,
                'status' => $status,
                'isActive' => true,
                'createdAt' => $invoiceDate,
                'updatedAt' => $now,
            ]);

            foreach ($soItems as $item) {
                $lineTaxable = $item->quantity * $item->rate;
                $lineCgst = in_array($customer->stateCode, ['09', '33']) ? 0 : round($lineTaxable * 0.09, 2);
                $lineSgst = in_array($customer->stateCode, ['09', '33']) ? 0 : round($lineTaxable * 0.09, 2);
                $lineIgst = in_array($customer->stateCode, ['09', '33']) ? round($lineTaxable * 0.18, 2) : 0;

                DB::table('InvoiceItem')->insert([
                    'invoiceId' => $invoiceId,
                    'productId' => $item->productId,
                    'quantity' => $item->quantity,
                    'rate' => $item->rate,
                    'gstPercent' => $item->gstPercent,
                    'cgst' => $lineCgst,
                    'sgst' => $lineSgst,
                    'igst' => $lineIgst,
                    'total' => round($lineTaxable + $lineCgst + $lineSgst + $lineIgst, 2),
                    'createdAt' => $now,
                ]);
            }

            // Create collection reminders for unpaid/overdue invoices
            if (in_array($status, ['Unpaid', 'Overdue', 'Partial'])) {
                DB::table('CollectionReminder')->insert([
                    'invoiceId' => $invoiceId,
                    'triggerType' => $status === 'Overdue' ? 'Overdue' : 'Upcoming',
                    'scheduledAt' => $dueDate->copy()->subDays(3),
                    'sentAt' => $status === 'Overdue' ? $dueDate : null,
                    'status' => $status === 'Overdue' ? 'Sent' : 'Pending',
                    'createdAt' => $now,
                ]);
            }

            // Communication logs for overdue invoices
            if ($status === 'Overdue') {
                DB::table('CommunicationLog')->insert([
                    'invoiceId' => $invoiceId,
                    'channel' => 'Email',
                    'content' => 'Payment reminder for Invoice INV-' . str_pad($invIdx, 5, '0', STR_PAD_LEFT) . '. Amount due: ₹' . number_format($grandTotal, 2),
                    'status' => 'Sent',
                    'sentAt' => $dueDate->copy()->addDays(1),
                ]);
                DB::table('CommunicationLog')->insert([
                    'invoiceId' => $invoiceId,
                    'channel' => 'Phone',
                    'content' => 'Follow-up call regarding overdue payment.',
                    'status' => 'Sent',
                    'sentAt' => $dueDate->copy()->addDays(5),
                ]);
            }
        }

        // ─── RECEIPT VOUCHERS ────────────────────────────────────────────
        // Pay some invoices partially or fully
        $paidInvoices = DB::table('Invoice')->whereIn('status', ['Paid', 'Partial'])->get();
        $rvIdx = 0;
        foreach ($paidInvoices as $inv) {
            $rvIdx++;
            $payAmount = $inv->status === 'Paid' ? $inv->grandTotal : round($inv->grandTotal * 0.6, 2);
            DB::table('SalesReceiptVoucher')->insert([
                'receiptNo' => 'RV-' . str_pad($rvIdx, 5, '0', STR_PAD_LEFT),
                'customerId' => $inv->customerId,
                'invoiceId' => $inv->id,
                'receiptDate' => Carbon::parse($inv->invoiceDate)->addDays(rand(5, 25)),
                'amount' => $payAmount,
                'paymentMode' => ['NEFT', 'RTGS', 'Cheque', 'Cash', 'UPI'][$rvIdx % 5],
                'chequeNo' => $rvIdx % 5 == 2 ? 'CHQ-' . rand(100000, 999999) : null,
                'remarks' => 'Payment received for ' . $inv->invoiceNo,
                'isActive' => true,
                'createdAt' => $now,
                'updatedAt' => $now,
            ]);
        }

        // Also add some extra invoices with different dates for monthly trend
        for ($m = 1; $m <= 4; $m++) {
            $invIdx++;
            $invoiceDate = $now->copy()->subMonths($m)->addDays(rand(1, 15));
            $custIdx = $m % count($customerIds);
            $customer = DB::table('Customer')->find($customerIds[$custIdx]);
            $creditPeriod = $customer->creditPeriod ?? 30;

            $taxable = rand(50000, 300000);
            $cgst = round($taxable * 0.09, 2);
            $sgst = round($taxable * 0.09, 2);
            $grand = round($taxable + $cgst + $sgst, 2);

            $iid = DB::table('Invoice')->insertGetId([
                'invoiceNo' => 'INV-' . str_pad($invIdx, 5, '0', STR_PAD_LEFT),
                'customerId' => $customerIds[$custIdx],
                'invoiceDate' => $invoiceDate,
                'dueDate' => $invoiceDate->copy()->addDays($creditPeriod),
                'placeOfSupply' => $customer->state,
                'taxableValue' => $taxable,
                'cgstAmount' => $cgst,
                'sgstAmount' => $sgst,
                'igstAmount' => 0,
                'roundOff' => 0,
                'grandTotal' => $grand,
                'status' => 'Paid',
                'isActive' => true,
                'createdAt' => $invoiceDate,
                'updatedAt' => $now,
            ]);

            // Receipt for these paid invoices
            $rvIdx++;
            DB::table('SalesReceiptVoucher')->insert([
                'receiptNo' => 'RV-' . str_pad($rvIdx, 5, '0', STR_PAD_LEFT),
                'customerId' => $customerIds[$custIdx],
                'invoiceId' => $iid,
                'receiptDate' => $invoiceDate->copy()->addDays(rand(10, 25)),
                'amount' => $grand,
                'paymentMode' => 'NEFT',
                'remarks' => 'Full payment',
                'isActive' => true,
                'createdAt' => $now,
                'updatedAt' => $now,
            ]);
        }

        // Update counters
        DB::table('AutoCounter')->updateOrInsert(['prefix' => 'INQ'], ['currentValue' => 12]);
        DB::table('AutoCounter')->updateOrInsert(['prefix' => 'QT'], ['currentValue' => max(8, count($quotationIds))]);
        DB::table('AutoCounter')->updateOrInsert(['prefix' => 'SO'], ['currentValue' => count($saleOrderIds)]);
        DB::table('AutoCounter')->updateOrInsert(['prefix' => 'DA'], ['currentValue' => $daIdx]);
        DB::table('AutoCounter')->updateOrInsert(['prefix' => 'INV'], ['currentValue' => $invIdx]);
        DB::table('AutoCounter')->updateOrInsert(['prefix' => 'RV'], ['currentValue' => $rvIdx]);
    }
}
