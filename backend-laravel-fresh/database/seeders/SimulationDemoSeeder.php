<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Str;
use Carbon\Carbon;

class SimulationDemoSeeder extends Seeder
{
    public function run()
    {
        $now = Carbon::now();

        // 1. Ensure Tables Exist (Migration usually handles this, but we'll be safe)
        // Note: For simulation-specific demo, we use the standard tables.
        
        // 2. Products
        $products = [
            ['code' => 'SF-001', 'name' => 'Steel Frame', 'unit' => 'Kg', 'price' => 85.00],
            ['code' => 'RS-002', 'name' => 'Rubber Seal', 'unit' => 'Pcs', 'price' => 12.00],
            ['code' => 'EG-003', 'name' => 'Engine Gasket', 'unit' => 'Pcs', 'price' => 340.00],
            ['code' => 'CA-004', 'name' => 'Chassis Assembly', 'unit' => 'Set', 'price' => 1200.00],
            ['code' => 'WH-005', 'name' => 'Wiring Harness', 'unit' => 'Pcs', 'price' => 780.00],
            ['code' => 'EN-010', 'name' => 'Engine', 'unit' => 'Pcs', 'price' => 45000.00],
            ['code' => 'SG-020', 'name' => 'Steel Gauge', 'unit' => 'Pcs', 'price' => 2500.00],
        ];

        $productIds = [];
        foreach ($products as $p) {
            DB::table('products')->updateOrInsert(
                ['code' => $p['code']],
                [
                    'name' => $p['name'],
                    'unit' => $p['unit'],
                    'lastPurchasePrice' => $p['price'],
                    'lastSalePrice' => $p['price'] * 1.5,
                    'gstPercent' => 18,
                    'isActive' => 1,
                    'updated_at' => $now,
                    'created_at' => $now
                ]
            );
            $productIds[$p['code']] = DB::table('products')->where('code', $p['code'])->value('id');
        }
        echo "Products seeded.\n";

        // 3. Warehouse
        $warehouseId = DB::table('warehouses')->where('code', 'WH-001')->value('id');
        if (!$warehouseId) {
            $warehouseId = DB::table('warehouses')->insertGetId([
                'code' => 'WH-001',
                'name' => 'Main Warehouse',
                'isActive' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ]);
        }

        foreach ([
            'SF-001' => 450, 'RS-002' => 80, 'EG-003' => 1200, 
            'CA-004' => 30, 'WH-005' => 220, 'EN-010' => 5, 'SG-020' => 15
        ] as $code => $qty) {
            if (isset($productIds[$code])) {
                DB::table('warehouse_stocks')->updateOrInsert(
                    ['warehouse_id' => $warehouseId, 'product_id' => $productIds[$code]],
                    [
                        'quantity' => $qty,
                        'updated_at' => $now,
                        'created_at' => $now
                    ]
                );
            }
        }
        echo "Warehouse & Stocks seeded.\n";

        // 4. BOMs
        $bomConfigs = [
            'SF-001' => ['no' => 'BOM-SF001', 'items' => [['code' => 'RS-002', 'qty' => 2], ['code' => 'CA-004', 'qty' => 1]]],
            'EG-003' => ['no' => 'BOM-EG003', 'items' => [['code' => 'RS-002', 'qty' => 1], ['code' => 'WH-005', 'qty' => 0.5]]],
            'EN-010' => ['no' => 'BOM-EN010', 'items' => [['code' => 'EG-003', 'qty' => 1], ['code' => 'WH-005', 'qty' => 2]]],
            'SG-020' => ['no' => 'BOM-SG020', 'items' => [['code' => 'SF-001', 'qty' => 3]]],
        ];

        foreach ($bomConfigs as $pCode => $config) {
            if (isset($productIds[$pCode])) {
                DB::table('bom_headers')->updateOrInsert(
                    ['productId' => $productIds[$pCode]],
                    [
                        'bomNo' => $config['no'],
                        'isActive' => 1,
                        'updated_at' => $now,
                        'created_at' => $now
                    ]
                );
                $bhId = DB::table('bom_headers')->where('productId', $productIds[$pCode])->value('id');
                
                DB::table('bom_items')->where('bom_header_id', $bhId)->delete();
                foreach ($config['items'] as $item) {
                    if (isset($productIds[$item['code']])) {
                        DB::table('bom_items')->insert([
                            'bom_header_id' => $bhId,
                            'raw_material_id' => $productIds[$item['code']],
                            'qty_per_unit' => $item['qty'],
                            'created_at' => $now,
                            'updated_at' => $now
                        ]);
                    }
                }
            }
        }
        echo "BOMs seeded.\n";

        // 5. Routing
        $routings = [
            ['code' => 'SF-001', 'seq' => 1, 'name' => 'Cutting', 'man' => 0.3, 'mach' => 0.2],
            ['code' => 'SF-001', 'seq' => 2, 'name' => 'Assembly', 'man' => 0.2, 'mach' => 0.1],
            ['code' => 'EG-003', 'seq' => 1, 'name' => 'Machining', 'man' => 0.5, 'mach' => 0.3],
            ['code' => 'EG-003', 'seq' => 2, 'name' => 'Quality Check', 'man' => 0.3, 'mach' => 0.2],
            ['code' => 'EN-010', 'seq' => 1, 'name' => 'Engine Assembly', 'man' => 4.5, 'mach' => 2.0],
            ['code' => 'EN-010', 'seq' => 2, 'name' => 'Dyno Testing', 'man' => 1.5, 'mach' => 1.5],
            ['code' => 'SG-020', 'seq' => 1, 'name' => 'Gauge Calibration', 'man' => 1.0, 'mach' => 0.5],
            ['code' => 'SG-020', 'seq' => 2, 'name' => 'Precision Fitting', 'man' => 1.2, 'mach' => 0.8],
        ];
        
        foreach (array_unique(array_column($routings, 'code')) as $code) {
            if (isset($productIds[$code])) {
                DB::table('routing_tables')->where('product_id', $productIds[$code])->delete();
            }
        }

        foreach ($routings as $r) {
            if (isset($productIds[$r['code']])) {
                DB::table('routing_tables')->insert([
                    'product_id' => $productIds[$r['code']],
                    'sequence_no' => $r['seq'],
                    'process_name' => $r['name'],
                    'man_hours_per_unit' => $r['man'],
                    'machine_hours_per_unit' => $r['mach'],
                    'created_at' => $now,
                    'updated_at' => $now
                ]);
            }
        }
        echo "Routings seeded.\n";

        // 6. Resources & Shifts
        DB::table('resource_master')->updateOrInsert(['resource_type' => 'labor'], ['cost_per_hour' => 70, 'updated_at' => $now, 'created_at' => $now]);
        DB::table('resource_master')->updateOrInsert(['resource_type' => 'machine'], ['kwh_per_hour' => 5, 'energy_rate' => 8, 'updated_at' => $now, 'created_at' => $now]);

        DB::table('shift_master')->updateOrInsert(['shift_name' => 'Day Shift'], ['shift_hours' => 10, 'is_default' => 1, 'updated_at' => $now, 'created_at' => $now]);

        echo "ALL SIMULATION DATA SEEDED SUCCESSFULLY!\n";
    }
}
