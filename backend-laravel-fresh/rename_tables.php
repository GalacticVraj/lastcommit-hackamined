<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

try {
    if (Schema::hasTable('Product')) {
        echo "Renaming Product to products...\n";
        DB::statement('ALTER TABLE "Product" RENAME TO "products"');
        echo "Done.\n";
    } else {
        echo "Table Product does not exist.\n";
    }

    if (Schema::hasTable('Warehouse')) {
        echo "Renaming Warehouse to warehouses...\n";
        DB::statement('ALTER TABLE "Warehouse" RENAME TO "warehouses"');
        echo "Done.\n";
    } else {
        echo "Table Warehouse does not exist.\n";
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
