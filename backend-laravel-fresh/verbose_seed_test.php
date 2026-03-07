<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

$now = Carbon::now();

function log_step($msg) {
    echo "[STEP] $msg\n";
}

try {
    DB::beginTransaction();

    log_step("Inserting Products...");
    $products = [
        ['code' => 'SF-001', 'name' => 'Steel Frame', 'unit' => 'Kg', 'lastPurchasePrice' => 85.00],
    ];
    foreach ($products as $p) {
        log_step("Checking product " . $p['code']);
        $productIds[$p['code']] = DB::table('products')->insertGetId(array_merge($p, [
            'isActive' => 1,
            'gstPercent' => 18,
            'minStock' => 0,
            'currentStock' => 0,
            'lastSalePrice' => $p['lastPurchasePrice'] * 1.5,
            'createdAt' => $now,
            'updatedAt' => $now
        ]));
    }
    log_step("Products inserted.");

    log_step("Inserting Warehouse...");
    $warehouseId = DB::table('warehouses')->insertGetId([
        'code' => 'WH-001-TEST',
        'name' => 'Main Warehouse',
        'isActive' => 1,
        'createdAt' => $now,
        'updatedAt' => $now
    ]);
    log_step("Warehouse inserted ID: $warehouseId");

    log_step("Inserting BOM Header...");
    $bomAId = DB::table('bom_headers')->insertGetId([
        'productId' => $productIds['SF-001'],
        'bomNo' => 'BOM-SF001-TEST',
        'isActive' => 1,
        'version' => '1.0',
        'effectiveFrom' => $now,
        'createdAt' => $now,
        'updatedAt' => $now
    ]);
    log_step("BOM Header inserted ID: $bomAId");

    DB::commit();
    echo "VERIFIED SUCCESS UP TO THIS POINT\n";

} catch (\Exception $e) {
    DB::rollBack();
    echo "VERIFIED FAIL: " . $e->getMessage() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}
