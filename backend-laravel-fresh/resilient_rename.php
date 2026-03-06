<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

try {
    echo "Attempting to copy Product to products...\n";
    DB::statement('CREATE TABLE products AS SELECT * FROM "Product"');
    echo "Done copying Product.\n";
    
    echo "Attempting to copy Warehouse to warehouses...\n";
    DB::statement('CREATE TABLE warehouses AS SELECT * FROM "Warehouse"');
    echo "Done copying Warehouse.\n";

    echo "Attempting to DROP old tables...\n";
    DB::statement('DROP TABLE "Product"');
    DB::statement('DROP TABLE "Warehouse"');
    echo "Done dropping old tables.\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
