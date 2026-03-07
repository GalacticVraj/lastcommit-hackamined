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
        Schema::table('simulation_results', function (Blueprint $table) {
            if (Schema::hasColumn('simulation_results', 'mrp_breakdown') && !Schema::hasColumn('simulation_results', 'material_breakdown')) {
                $table->renameColumn('mrp_breakdown', 'material_breakdown');
            }
            if (Schema::hasColumn('simulation_results', 'crp_breakdown') && !Schema::hasColumn('simulation_results', 'resource_breakdown')) {
                $table->renameColumn('crp_breakdown', 'resource_breakdown');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('simulation_results', function (Blueprint $table) {
            if (Schema::hasColumn('simulation_results', 'material_breakdown')) {
                $table->renameColumn('material_breakdown', 'mrp_breakdown');
            }
            if (Schema::hasColumn('simulation_results', 'resource_breakdown')) {
                $table->renameColumn('resource_breakdown', 'crp_breakdown');
            }
        });
    }
};
