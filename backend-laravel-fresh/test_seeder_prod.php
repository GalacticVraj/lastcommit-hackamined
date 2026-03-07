<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

$now = Carbon::now();
$p = ['code' => 'SF-TEST-1', 'name' => 'Steel Frame Test', 'unit' => 'Kg', 'lastPurchasePrice' => 85.00];

try {
    $id = DB::table('products')->insertGetId(array_merge($p, [
        'isActive' => 1,
        'gstPercent' => 18,
        'minStock' => 0,
        'currentStock' => 0,
        'lastSalePrice' => $p['lastPurchasePrice'] * 1.5,
        'createdAt' => $now,
        'updatedAt' => $now
    ]));
    echo "SUCCESS: Product ID $id\n";
} catch (\Exception $e) {
    echo "FAIL: " . $e->getMessage() . "\n";
}
