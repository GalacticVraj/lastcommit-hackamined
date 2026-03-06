<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Str;
use Carbon\Carbon;

class SimulationDemoSeeder extends Seeder
{
    public function run()
    {
        try {
            DB::beginTransaction();
            $now = Carbon::now();

            echo "RECREATING PRODUCTS TABLE FOR SAFETY...\n";
            Schema::dropIfExists('products');
            Schema::create('products', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->string('name');
                $table->string('unit')->default('Nos');
                $table->decimal('lastPurchasePrice', 15, 2)->default(0);
                $table->decimal('lastSalePrice', 15, 2)->default(0);
                $table->decimal('gstPercent', 5, 2)->default(18);
                $table->decimal('minStock', 15, 2)->default(0);
                $table->decimal('currentStock', 15, 2)->default(0);
                $table->boolean('isActive')->default(true);
                $table->timestamps();
            });

            // 1. Products
            $products = [
                ['code' => 'SF-001', 'name' => 'Steel Frame', 'unit' => 'Kg', 'price' => 85.00],
                ['code' => 'RS-002', 'name' => 'Rubber Seal', 'unit' => 'Pcs', 'price' => 12.00],
                ['code' => 'EG-003', 'name' => 'Engine Gasket', 'unit' => 'Pcs', 'price' => 340.00],
                ['code' => 'CA-004', 'name' => 'Chassis Assembly', 'unit' => 'Set', 'price' => 1200.00],
                ['code' => 'WH-005', 'name' => 'Wiring Harness', 'unit' => 'Pcs', 'price' => 780.00],
            ];

            $productIds = [];
            foreach ($products as $p) {
                $id = DB::table('products')->insertGetId([
                    'code' => $p['code'],
                    'name' => $p['name'],
                    'unit' => $p['unit'],
                    'lastPurchasePrice' => $p['price'],
                    'lastSalePrice' => $p['price'] * 1.5,
                    'gstPercent' => 18,
                    'isActive' => 1,
                    'created_at' => $now,
                    'updated_at' => $now
                ]);
                $productIds[$p['code']] = $id;
            }
            echo "Products seeded.\n";

            // 2. Warehouse
            Schema::dropIfExists('warehouse_stocks');
            Schema::dropIfExists('warehouses');
            Schema::create('warehouses', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->string('name');
                $table->boolean('isActive')->default(true);
                $table->timestamps();
            });
            $warehouseId = DB::table('warehouses')->insertGetId([
                'code' => 'WH-001',
                'name' => 'Main Warehouse',
                'isActive' => 1,
                'created_at' => $now,
                'updated_at' => $now
            ]);

            // 3. Stocks (Recreate for fresh IDs)
            Schema::create('warehouse_stocks', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->unsignedBigInteger('warehouse_id');
                $table->unsignedBigInteger('product_id');
                $table->decimal('quantity', 15, 4)->default(0);
                $table->decimal('min_quantity', 15, 4)->default(0);
                $table->decimal('max_quantity', 15, 4)->default(10000);
                $table->string('created_by')->nullable();
                $table->string('updated_by')->nullable();
                $table->timestamps();
            });

            foreach (['SF-001' => 450, 'RS-002' => 80, 'EG-003' => 1200, 'CA-004' => 30, 'WH-005' => 220] as $code => $qty) {
                DB::table('warehouse_stocks')->insert([
                    'id' => (string)Str::uuid(),
                    'warehouse_id' => $warehouseId,
                    'product_id' => $productIds[$code],
                    'quantity' => $qty,
                    'created_at' => $now,
                    'updated_at' => $now
                ]);
            }
            echo "Warehouse & Stocks seeded.\n";

            // 4. BOMs (Recreate for fresh structure)
            Schema::dropIfExists('bom_items');
            Schema::dropIfExists('bom_headers');
            Schema::create('bom_headers', function (Blueprint $table) {
                $table->id();
                $table->string('bomNo')->unique();
                $table->unsignedBigInteger('productId');
                $table->string('version')->default('1.0');
                $table->timestamp('effectiveFrom')->useCurrent();
                $table->boolean('isActive')->default(true);
                $table->timestamps();
            });
            Schema::create('bom_items', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('bom_header_id');
                $table->unsignedBigInteger('raw_material_id');
                $table->decimal('qty_per_unit', 15, 4);
                $table->string('unit')->default('Pcs');
                $table->timestamps();
            });

            $bomConfigs = [
                'SF-001' => ['no' => 'BOM-SF001', 'items' => [['code' => 'RS-002', 'qty' => 2], ['code' => 'CA-004', 'qty' => 1]]],
                'EG-003' => ['no' => 'BOM-EG003', 'items' => [['code' => 'RS-002', 'qty' => 1], ['code' => 'WH-005', 'qty' => 0.5]]]
            ];

            foreach ($bomConfigs as $pCode => $config) {
                $bhId = DB::table('bom_headers')->insertGetId([
                    'productId' => $productIds[$pCode],
                    'bomNo' => $config['no'],
                    'isActive' => 1,
                    'created_at' => $now,
                    'updated_at' => $now
                ]);
                foreach ($config['items'] as $item) {
                    DB::table('bom_items')->insert([
                        'bom_header_id' => $bhId,
                        'raw_material_id' => $productIds[$item['code']],
                        'qty_per_unit' => $item['qty'],
                        'created_at' => $now,
                        'updated_at' => $now
                    ]);
                }
            }
            echo "BOMs seeded.\n";

            // 5. Routing (Recreate)
            Schema::dropIfExists('routing_tables');
            Schema::create('routing_tables', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('product_id');
                $table->integer('sequence_no');
                $table->string('process_name');
                $table->decimal('man_hours_per_unit', 10, 4)->default(0);
                $table->decimal('machine_hours_per_unit', 10, 4)->default(0);
                $table->decimal('setupTime', 10, 2)->default(0);
                $table->decimal('cycleTime', 10, 2)->default(0);
                $table->timestamps();
            });

            $routings = [
                ['code' => 'SF-001', 'seq' => 1, 'name' => 'Cutting', 'man' => 0.3, 'mach' => 0.2],
                ['code' => 'SF-001', 'seq' => 2, 'name' => 'Assembly', 'man' => 0.2, 'mach' => 0.1],
                ['code' => 'EG-003', 'seq' => 1, 'name' => 'Machining', 'man' => 0.5, 'mach' => 0.3],
                ['code' => 'EG-003', 'seq' => 1, 'name' => 'Quality Check', 'man' => 0.3, 'mach' => 0.2],
            ];
            foreach ($routings as $r) {
                DB::table('routing_tables')->insert([
                    'product_id' => $productIds[$r['code']],
                    'sequence_no' => $r['seq'],
                    'process_name' => $r['name'],
                    'man_hours_per_unit' => $r['man'],
                    'machine_hours_per_unit' => $r['mach'],
                    'created_at' => $now,
                    'updated_at' => $now
                ]);
            }
            echo "Routings seeded.\n";

            // 6. Resources & Shifts
            Schema::dropIfExists('resource_master');
            Schema::create('resource_master', function (Blueprint $table) {
                $table->id();
                $table->string('resource_type');
                $table->decimal('cost_per_hour', 10, 2)->default(0);
                $table->decimal('kwh_per_hour', 8, 4)->default(0);
                $table->decimal('energy_rate', 8, 4)->default(0);
                $table->timestamps();
            });
            DB::table('resource_master')->insert(['resource_type' => 'labor', 'cost_per_hour' => 70, 'created_at' => $now, 'updated_at' => $now]);
            DB::table('resource_master')->insert(['resource_type' => 'machine', 'kwh_per_hour' => 5, 'energy_rate' => 8, 'created_at' => $now, 'updated_at' => $now]);

            Schema::dropIfExists('shift_master');
            Schema::create('shift_master', function (Blueprint $table) {
                $table->id();
                $table->string('shift_name');
                $table->decimal('shift_hours', 5, 2);
                $table->boolean('is_default')->default(false);
                $table->timestamps();
            });
            DB::table('shift_master')->insert(['shift_name' => 'Day Shift', 'shift_hours' => 10, 'is_default' => 1, 'created_at' => $now, 'updated_at' => $now]);

            DB::commit();
            echo "ALL SIMULATION DATA RE-CREATED AND SEEDED SUCCESSFULLY!\n";

        } catch (\Exception $e) {
            DB::rollBack();
            echo "\n=== SEEDING FAILED ===\n";
            echo $e->getMessage() . "\n";
            echo "Line: " . $e->getLine() . "\n";
            echo "======================\n";
        }
    }
}
