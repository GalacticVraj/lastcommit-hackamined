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
        // 1. BOM Headers
        if (Schema::hasTable('BOMHeader')) {
            Schema::rename('BOMHeader', 'bom_headers');
        }
        if (!Schema::hasTable('bom_headers')) {
            Schema::create('bom_headers', function (Blueprint $table) {
                $table->id();
                $table->string('bom_no')->unique();
                $table->unsignedBigInteger('product_id');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 2. BOM Items
        if (Schema::hasTable('BOMItem')) {
            Schema::rename('BOMItem', 'bom_items');
        }
        Schema::table('bom_items', function (Blueprint $table) {
            if (Schema::hasColumn('bom_items', 'bomHeaderId')) {
                $table->renameColumn('bomHeaderId', 'bom_header_id');
            }
            if (Schema::hasColumn('bom_items', 'componentId')) {
                $table->renameColumn('componentId', 'raw_material_id');
            }
            if (Schema::hasColumn('bom_items', 'quantity')) {
                $table->renameColumn('quantity', 'qty_per_unit');
            }
            if (!Schema::hasColumn('bom_items', 'process_stage')) {
                $table->string('process_stage')->nullable();
            }
        });

        // 3. Routing Tables
        if (Schema::hasTable('RoutingTable')) {
            Schema::rename('RoutingTable', 'routing_tables');
        }
        Schema::table('routing_tables', function (Blueprint $table) {
            if (Schema::hasColumn('routing_tables', 'bomHeaderId')) {
                $table->renameColumn('bomHeaderId', 'product_id'); // Aligning with requested schema
            }
            if (Schema::hasColumn('routing_tables', 'operationName')) {
                $table->renameColumn('operationName', 'process_name');
            }
            if (Schema::hasColumn('routing_tables', 'operationNo')) {
                $table->renameColumn('operationNo', 'sequence_no');
            }
            if (!Schema::hasColumn('routing_tables', 'man_hours_per_unit')) {
                $table->decimal('man_hours_per_unit', 8, 4)->default(0);
            }
            if (!Schema::hasColumn('routing_tables', 'machine_hours_per_unit')) {
                $table->decimal('machine_hours_per_unit', 8, 4)->default(0);
            }
        });

        // 4. Warehouse Stocks
        if (!Schema::hasTable('warehouse_stocks')) {
            Schema::create('warehouse_stocks', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('warehouse_id');
                $table->unsignedBigInteger('product_id');
                $table->decimal('quantity', 15, 4)->default(0);
                $table->timestamps();
            });
        }

        // 5. Resource Master
        if (!Schema::hasTable('resource_master')) {
            Schema::create('resource_master', function (Blueprint $table) {
                $table->id();
                $table->enum('resource_type', ['labor', 'machine']);
                $table->decimal('cost_per_hour', 10, 2)->default(0);
                $table->decimal('kwh_per_hour', 8, 4)->default(0);
                $table->decimal('energy_rate', 8, 4)->default(0);
                $table->timestamps();
            });
        }

        // 6. Simulation Results
        if (Schema::hasTable('SimulationResult')) {
             Schema::rename('SimulationResult', 'simulation_results_old');
        }
        if (!Schema::hasTable('simulation_results')) {
            Schema::create('simulation_results', function (Blueprint $table) {
                $table->id();
                $table->string('simulation_name')->nullable();
                $table->decimal('shift_hours', 5, 2);
                $table->integer('worker_count');
                $table->decimal('total_man_hours', 12, 2);
                $table->decimal('total_machine_hours', 12, 2);
                $table->decimal('days_required', 8, 2);
                $table->date('estimated_completion')->nullable();
                $table->decimal('labor_cost', 15, 2);
                $table->decimal('material_cost', 15, 2);
                $table->decimal('electricity_cost', 15, 2);
                $table->decimal('total_cost', 15, 2);
                $table->decimal('material_readiness_pct', 5, 2);
                $table->boolean('overload_alert')->default(false);
                $table->json('mrp_breakdown')->nullable();
                $table->json('crp_breakdown')->nullable();
                $table->json('cost_breakdown')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
            });
        }

        // 7. Simulation MPS Items (linking mps input to results)
        if (!Schema::hasTable('simulation_mps_items')) {
            Schema::create('simulation_mps_items', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('simulation_id');
                $table->unsignedBigInteger('product_id');
                $table->decimal('target_qty', 15, 2);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('simulation_mps_items');
        Schema::dropIfExists('simulation_results');
        Schema::dropIfExists('resource_master');
        Schema::dropIfExists('warehouse_stocks');
        // Not undoing renames for safety of existing data
    }

};
