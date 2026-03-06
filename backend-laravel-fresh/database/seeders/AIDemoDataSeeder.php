<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AIDemoDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Cleanup existing data
        DB::table('SaleOrderItem')->delete();
        DB::table('SaleOrder')->delete();
        DB::table('Invoice')->delete();
        DB::table('PurchaseOrder')->delete();
        DB::table('ProductionRouteCard')->delete();
        DB::table('products')->delete();
        DB::table('Customer')->delete();
        DB::table('Vendor')->delete();
        DB::table('Employee')->delete();

        // 1. Customers
        $custId = DB::table('Customer')->insertGetId([
            'name' => 'TechMicra Global Corp',
            'gstin' => '24AAAAA0000A1Z5',
            'isActive' => true,
            'createdAt' => now(),
            'updatedAt' => now()
        ]);

        // 2. Vendors
        $vendId = DB::table('Vendor')->insertGetId([
            'name' => 'Solar Systems Ltd',
            'isActive' => true,
            'createdAt' => now(),
            'updatedAt' => now()
        ]);

        // 3. Products
        $p1 = DB::table('products')->insertGetId([
            'code' => 'PROD-01',
            'name' => 'Industrial Generator X1',
            'category' => 'Engineering',
            'unit' => 'Nos',
            'minStock' => 50,
            'currentStock' => 5, // Low stock trigger
            'isActive' => true,
            'createdAt' => now()
        ]);
        $p2 = DB::table('products')->insertGetId([
            'code' => 'PROD-02',
            'name' => 'Solar Panel Kit Y2',
            'category' => 'Renewables',
            'unit' => 'Nos',
            'minStock' => 20,
            'currentStock' => 45,
            'isActive' => true,
            'createdAt' => now()
        ]);

        // 4. Employees (Workforce Outlook)
        for ($i = 1; $i <= 45; $i++) {
            DB::table('Employee')->insert([
                'empCode' => "E" . str_pad($i, 3, '0', STR_PAD_LEFT),
                'name' => "Specialist $i",
                'isActive' => true,
                'createdAt' => now()
            ]);
        }

        // 5. Invoices (Insights - Overdue)
        DB::table('Invoice')->insert([
            ['invoiceNo' => 'INV/24/001', 'customerId' => $custId, 'invoiceDate' => Carbon::now()->subDays(45), 'dueDate' => Carbon::now()->subDays(15), 'grandTotal' => 125000, 'status' => 'Unpaid', 'createdAt' => Carbon::now()->subDays(45)],
            ['invoiceNo' => 'INV/24/002', 'customerId' => $custId, 'invoiceDate' => Carbon::now()->subDays(40), 'dueDate' => Carbon::now()->subDays(10), 'grandTotal' => 85000, 'status' => 'Unpaid', 'createdAt' => Carbon::now()->subDays(40)]
        ]);

        // 6. Purchase Orders (Insights - Delayed)
        DB::table('PurchaseOrder')->insert([
            ['poNo' => 'PO/24/101', 'vendorId' => $vendId, 'poDate' => Carbon::now()->subDays(20), 'expectedDelivery' => Carbon::now()->subDays(5), 'totalAmount' => 50000, 'status' => 'Pending', 'createdAt' => Carbon::now()->subDays(20)]
        ]);

        // 7. Sales History (Projection tab)
        for ($month = 1; $month <= 12; $month++) {
            $date = Carbon::now()->subMonths(12 - $month)->startOfMonth();
            $revenue = 500000 + ($month * 50000) + rand(-20000, 20000);
            
            $soId = DB::table('SaleOrder')->insertGetId([
                'soNo' => "SO/HIST/$month",
                'customerId' => $custId,
                'totalAmount' => $revenue,
                'status' => 'Completed',
                'createdAt' => $date
            ]);

            DB::table('Invoice')->insert([
                'invoiceNo' => "INV/HIST/$month",
                'saleOrderId' => $soId,
                'customerId' => $custId,
                'invoiceDate' => $date,
                'dueDate' => $date->copy()->addDays(30),
                'grandTotal' => $revenue,
                'status' => 'Paid',
                'createdAt' => $date
            ]);

            DB::table('SaleOrderItem')->insert([
                'saleOrderId' => $soId,
                'productId' => $p1,
                'quantity' => 10,
                'rate' => $revenue / 10,
                'total' => $revenue,
                'createdAt' => $date
            ]);
        }

        // 8. Production (Workforce tab)
        for ($i = 0; $i < 20; $i++) {
            DB::table('ProductionRouteCard')->insert([
                'routeCardNo' => "RC-AI-$i",
                'productId' => $p1,
                'planQty' => 100,
                'status' => 'Planned',
                'createdAt' => now()->subDays(2)
            ]);
        }

        $this->command->info('Dev-aligned AI Demo Data seeded successfully!');
    }
}
