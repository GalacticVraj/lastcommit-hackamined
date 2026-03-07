<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('Product') && !Schema::hasTable('products')) {
            Schema::rename('Product', 'products');
        }
        if (Schema::hasTable('Warehouse') && !Schema::hasTable('warehouses')) {
            Schema::rename('Warehouse', 'warehouses');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('products')) {
            Schema::rename('products', 'Product');
        }
        if (Schema::hasTable('warehouses')) {
            Schema::rename('warehouses', 'Warehouse');
        }
    }

};
