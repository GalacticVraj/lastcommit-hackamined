<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

$now = Carbon::now();

try {
    DB::beginTransaction();
    echo "Starting final seeding script...\n";

    // 1. Products
    $products = [
        ['code' => 'SF-001', 'name' => 'Steel Frame', 'unit' => 'Kg', 'price' => 85.00],
        ['code' => 'RS-002', 'name' => 'Rubber Seal', 'unit' => 'Pcs', 'price' => 12.00],
        ['code' => 'EG-003', 'name' => 'Engine Gasket', 'unit' => 'Pcs', 'price' => 340.00],
        ['code' => 'CA-004', 'name' => 'Chassis Assembly', 'unit' => 'Set', 'price' => 1200.00],
        ['code' => 'WH-005', 'name' => 'Wiring Harness', 'unit' => 'Pcs', 'price' => 780.00],
    ];

    $productIds = [];
    foreach ($products as $p) {
        $id = DB::table('products')->where('code', $p['code'])->value('id');
        if (!$id) {
            $id = DB::table('products')->insertGetId([
                'code' => $p['code'],
                'name' => $p['name'],
                'unit' => $p['unit'],
                'isActive' => 1,
                'createdAt' => $now,
                'updatedAt' => $now
            ]);
        }
        // Update columns that might be causing issues separately
        DB::table('products')->where('id', $id)->update([
            'lastPurchasePrice' => $p['price'],
            'lastSalePrice' => $p['price'] * 1.5,
            'gstPercent' => 18,
            'minStock' => 0,
            'currentStock' => 500 // Give some initial stock for testing
        ]);
        $productIds[$p['code']] = $id;
        echo "Product indexed: " . $p['code'] . " (ID: $id)\n";
    }

    // 2. Warehouse
    $warehouseId = DB::table('warehouses')->where('code', 'WH-001')->value('id');
    if (!$warehouseId) {
        $warehouseId = DB::table('warehouses')->insertGetId([
            'code' => 'WH-001',
            'name' => 'Main Warehouse',
            'isActive' => 1,
            'createdAt' => $now,
            'updatedAt' => $now
        ]);
    }
    echo "Warehouse ready: ID $warehouseId\n";

    // 3. Stocks
    foreach (['SF-001' => 450, 'RS-002' => 80, 'EG-003' => 1200, 'CA-004' => 30, 'WH-005' => 220] as $code => $qty) {
        DB::table('warehouse_stocks')->updateOrInsert(
            ['product_id' => (string)$productIds[$code], 'warehouse_id' => (string)$warehouseId],
            [
                'id' => (string)Str::uuid(),
                'quantity' => $qty,
                'min_quantity' => 0,
                'max_quantity' => 10000,
                'created_by' => '1',
                'updated_by' => '1',
                'created_at' => $now,
                'updated_at' => $now
            ]
        );
    }
    echo "Stocks updated.\n";

    // 4. BOMs
    $bomConfigs = [
        'SF-001' => [
            'no' => 'BOM-SF001',
            'items' => [['code' => 'RS-002', 'qty' => 2], ['code' => 'CA-004', 'qty' => 1]]
        ],
        'EG-003' => [
            'no' => 'BOM-EG003',
            'items' => [['code' => 'RS-002', 'qty' => 1], ['code' => 'WH-005', 'qty' => 0.5]]
        ]
    ];

    foreach ($bomConfigs as $pCode => $config) {
        $pId = $productIds[$pCode];
        $bhId = DB::table('bom_headers')->where('productId', $pId)->value('id');
        if (!$bhId) {
            $bhId = DB::table('bom_headers')->insertGetId([
                'productId' => $pId,
                'bomNo' => $config['no'],
                'isActive' => 1,
                'version' => '1.0',
                'effectiveFrom' => $now,
                'createdAt' => $now,
                'updatedAt' => $now
            ]);
        }
        foreach ($config['items'] as $item) {
            DB::table('bom_items')->updateOrInsert(
                ['bom_header_id' => $bhId, 'raw_material_id' => $productIds[$item['code']]],
                ['qty_per_unit' => $item['qty'], 'unit' => 'Pcs', 'createdAt' => $now]
            );
        }
        echo "BOM ready for $pCode\n";
    }

    // 5. Routing
    $routings = [
        ['code' => 'SF-001', 'seq' => 1, 'name' => 'Cutting', 'man' => 0.3, 'mach' => 0.2],
        ['code' => 'SF-001', 'seq' => 2, 'name' => 'Assembly', 'man' => 0.2, 'mach' => 0.1],
        ['code' => 'EG-003', 'seq' => 1, 'name' => 'Machining', 'man' => 0.5, 'mach' => 0.3],
        ['code' => 'EG-003', 'seq' => 2, 'name' => 'Quality Check', 'man' => 0.3, 'mach' => 0.2],
    ];
    foreach ($routings as $r) {
        DB::table('routing_tables')->updateOrInsert(
            ['product_id' => $productIds[$r['code']], 'sequence_no' => $r['seq']],
            [
                'process_name' => $r['name'],
                'man_hours_per_unit' => $r['man'],
                'machine_hours_per_unit' => $r['mach'],
                'setupTime' => 0,
                'cycleTime' => 0,
                'createdAt' => $now
            ]
        );
    }
    echo "Routings ready.\n";

    // 6. Resource & Shift
    DB::table('resource_master')->updateOrInsert(['resource_type' => 'labor'], ['cost_per_hour' => 70.00, 'kwh_per_hour' => 0, 'energy_rate' => 0, 'created_at' => $now, 'updated_at' => $now]);
    DB::table('resource_master')->updateOrInsert(['resource_type' => 'machine'], ['kwh_per_hour' => 5.0, 'energy_rate' => 8.0, 'cost_per_hour' => 0, 'created_at' => $now, 'updated_at' => $now]);
    DB::table('shift_master')->updateOrInsert(['shift_name' => 'Day Shift'], ['shift_hours' => 10.0, 'is_default' => 1, 'created_at' => $now, 'updated_at' => $now]);

    DB::commit();
    echo "FINAL SEEDING SUCCESSFUL!\n";

} catch (\Exception $e) {
    DB::rollBack();
    echo "SEEDING FAILED: " . $e->getMessage() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}
