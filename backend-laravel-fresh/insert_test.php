<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$pA = \App\Models\Product::where('code', 'SF-001')->first();
$warehouseId = \Illuminate\Support\Facades\DB::table('warehouses')->where('code', 'WH-001')->value('id');

try {
    \Illuminate\Support\Facades\DB::table('warehouse_stocks')->insert([
        'product_id' => $pA->id,
        'warehouse_id' => $warehouseId,
        'quantity' => 45,
        'created_at' => now(),
        'updated_at' => now()
    ]);
    echo "STOCK INSERTED\n";
} catch (\Exception $e) {
    echo "STOCK FAILED\n";
    echo $e->getMessage() . "\n";
}
