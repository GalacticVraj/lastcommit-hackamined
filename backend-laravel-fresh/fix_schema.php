<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

echo "Checking columns for products...\n";
if (!Schema::hasColumn('products', 'blockedStock')) {
    echo "Adding blockedStock to products...\n";
    Schema::table('products', function (Blueprint $table) {
        $table->decimal('blockedStock', 15, 2)->default(0)->after('currentStock');
    });
}

if (!Schema::hasColumn('products', 'productionDays')) {
    echo "Adding productionDays to products...\n";
    Schema::table('products', function (Blueprint $table) {
        $table->integer('productionDays')->default(0)->after('blockedStock');
    });
}

echo "Done.\n";
