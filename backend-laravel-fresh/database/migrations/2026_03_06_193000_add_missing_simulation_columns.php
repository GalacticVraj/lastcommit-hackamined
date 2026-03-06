<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bom_items', function (Blueprint $table) {
            if (!Schema::hasColumn('bom_items', 'unit')) {
                $table->string('unit')->default('Pcs');
            }
        });

        Schema::table('routing_tables', function (Blueprint $table) {
            if (!Schema::hasColumn('routing_tables', 'product_id')) {
                $table->unsignedBigInteger('product_id')->nullable();
            }
            if (!Schema::hasColumn('routing_tables', 'process_name')) {
                $table->string('process_name')->nullable();
            }
            if (!Schema::hasColumn('routing_tables', 'sequence_no')) {
                $table->integer('sequence_no')->default(1);
            }
        });

        Schema::table('simulation_results', function (Blueprint $table) {
            if (!Schema::hasColumn('simulation_results', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable();
            }
        });
    }

    public function down(): void
    {
        // Add drop column definitions here if rollback is needed
    }
};
