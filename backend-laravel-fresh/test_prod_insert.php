<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $id = Illuminate\Support\Facades\DB::table('products')->insertGetId([
        'code' => 'TEST-' . time(),
        'name' => 'Test Product',
        'unit' => 'EA',
        'lastPurchasePrice' => 10,
        'isActive' => 1,
        'createdAt' => now(),
        'updatedAt' => now()
    ]);
    echo "SUCCESS with camelCase\n";
} catch (\Exception $e) {
    echo "FAIL with camelCase: " . $e->getMessage() . "\n";
    
    try {
        $id = Illuminate\Support\Facades\DB::table('products')->insertGetId([
            'code' => 'TEST2-' . time(),
            'name' => 'Test Product 2',
            'unit' => 'EA',
            'last_purchase_price' => 10,
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now()
        ]);
        echo "SUCCESS with snake_case\n";
    } catch (\Exception $e2) {
        echo "FAIL with snake_case: " . $e2->getMessage() . "\n";
    }
}
