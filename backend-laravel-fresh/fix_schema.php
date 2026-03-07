<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

try {
    echo "Dropping flawed products and warehouses tables...\n";
    Schema::dropIfExists('products');
    Schema::dropIfExists('warehouses');

    echo "Recreating products table correctly...\n";
    Schema::create('products', function (Blueprint $table) {
        $table->id();
        $table->string('code')->unique();
        $table->string('name');
        $table->string('category')->nullable();
        $table->string('subCategory')->nullable();
        $table->string('unit')->default('Nos');
        $table->string('hsnCode')->nullable();
        $table->decimal('gstPercent', 5, 2)->default(18);
        $table->decimal('minStock', 15, 2)->default(0);
        $table->decimal('currentStock', 15, 2)->default(0);
        $table->decimal('lastPurchasePrice', 15, 2)->default(0);
        $table->decimal('lastSalePrice', 15, 2)->default(0);
        $table->boolean('isActive')->default(true);
        $table->unsignedBigInteger('createdBy')->nullable();
        $table->unsignedBigInteger('updatedBy')->nullable();
        $table->timestamp('createdAt')->useCurrent();
        $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        $table->timestamp('deletedAt')->nullable();
    });

    echo "Recreating warehouses table correctly...\n";
    Schema::create('warehouses', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->text('address')->nullable();
        $table->string('managerName')->nullable();
        $table->boolean('isActive')->default(true);
        $table->unsignedBigInteger('createdBy')->nullable();
        $table->timestamp('createdAt')->useCurrent();
        $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        $table->timestamp('deletedAt')->nullable();
    });

    echo "Tables recreated successfully.\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
