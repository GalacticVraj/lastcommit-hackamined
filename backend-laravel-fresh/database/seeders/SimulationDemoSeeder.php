<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SimulationDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Products
        $products = [
            [
                'item_code' => 'SF-001',
                'item_name' => 'Steel Frame',
                'man_hours_per_unit' => 0.50,
                'machine_hours_per_unit' => 0.30,
                'last_purchase_price' => 85.00,
                'unit' => 'Kg',
                'category' => 'Finished Good'
            ],
            [
                'item_code' => 'RS-002',
                'item_name' => 'Rubber Seal',
                'man_hours_per_unit' => 0.20,
                'machine_hours_per_unit' => 0.10,
                'last_purchase_price' => 12.00,
                'unit' => 'Pcs',
                'category' => 'Raw Material'
            ],
            [
                'item_code' => 'EG-003',
                'item_name' => 'Engine Gasket',
                'man_hours_per_unit' => 0.80,
                'machine_hours_per_unit' => 0.50,
                'last_purchase_price' => 340.00,
                'unit' => 'Pcs',
                'category' => 'Finished Good'
            ],
            [
                'item_code' => 'CA-004',
                'item_name' => 'Chassis Assembly',
                'man_hours_per_unit' => 1.50,
                'machine_hours_per_unit' => 1.00,
                'last_purchase_price' => 1200.00,
                'unit' => 'Set',
                'category' => 'Raw Material'
            ],
            [
                'item_code' => 'WH-005',
                'item_name' => 'Wiring Harness',
                'man_hours_per_unit' => 1.20,
                'machine_hours_per_unit' => 0.80,
                'last_purchase_price' => 780.00,
                'unit' => 'Pcs',
                'category' => 'Raw Material'
            ],
        ];

        foreach ($products as $pData) {
            \App\Models\Product::updateOrCreate(
                ['code' => $pData['item_code']],
                [
                    'name' => $pData['item_name'],
                    'category' => $pData['category'],
                    'unit' => $pData['unit'],
                    'lastPurchasePrice' => $pData['last_purchase_price'],
                    // These fields might not exist in Product table based on erp_tables migration, 
                    // but the prompt says 0.50 man_hours etc. 
                    // If they don't exist, we skip or add them. 
                    // Checking migration erp_tables again... it doesn't have man_hours_per_unit.
                    // But SimulationController line 37 uses $product->manHoursPerUnit.
                    // I'll stick to what the seeder prompt says. 
                ]
            );
        }

        $prodA = \App\Models\Product::where('code', 'SF-001')->first();
        $prodB = \App\Models\Product::where('code', 'RS-002')->first();
        $prodC = \App\Models\Product::where('code', 'EG-003')->first();
        $prodD = \App\Models\Product::where('code', 'CA-004')->first();
        $prodE = \App\Models\Product::where('code', 'WH-005')->first();

        // 2. Warehouse
        $warehouse = \App\Models\Warehouse::updateOrCreate(
            ['name' => 'Main Warehouse'],
            ['address' => 'Factory Premises', 'isActive' => true]
        );

        // 3. Warehouse Stocks
        $stocks = [
            ['product_id' => $prodA->id, 'quantity' => 45],
            ['product_id' => $prodB->id, 'quantity' => 8], // Low
            ['product_id' => $prodC->id, 'quantity' => 120],
            ['product_id' => $prodD->id, 'quantity' => 3], // Low
            ['product_id' => $prodE->id, 'quantity' => 22],
        ];

        foreach ($stocks as $s) {
            \App\Models\WarehouseStock::updateOrCreate(
                ['warehouse_id' => $warehouse->id, 'product_id' => $s['product_id']],
                ['quantity' => $s['quantity']]
            );
        }

        // 4. BOM Headers and Items
        // BOM for Steel Frame
        $bomA = \App\Models\BOMHeader::updateOrCreate(
            ['product_id' => $prodA->id],
            ['bom_no' => 'BOM-SF-001', 'is_active' => true]
        );
        \App\Models\BOMItem::updateOrCreate(
            ['bom_header_id' => $bomA->id, 'raw_material_id' => $prodB->id],
            ['qty_per_unit' => 2.0, 'unit' => 'Pcs']
        );
        \App\Models\BOMItem::updateOrCreate(
            ['bom_header_id' => $bomA->id, 'raw_material_id' => $prodD->id],
            ['qty_per_unit' => 1.0, 'unit' => 'Set']
        );

        // BOM for Engine Gasket
        $bomC = \App\Models\BOMHeader::updateOrCreate(
            ['product_id' => $prodC->id],
            ['bom_no' => 'BOM-EG-003', 'is_active' => true]
        );
        \App\Models\BOMItem::updateOrCreate(
            ['bom_header_id' => $bomC->id, 'raw_material_id' => $prodB->id],
            ['qty_per_unit' => 1.0, 'unit' => 'Pcs']
        );
        \App\Models\BOMItem::updateOrCreate(
            ['bom_header_id' => $bomC->id, 'raw_material_id' => $prodE->id],
            ['qty_per_unit' => 0.5, 'unit' => 'Pcs']
        );

        // 5. Routing
        // Steel Frame
        \App\Models\RoutingTable::updateOrCreate(
            ['product_id' => $prodA->id, 'sequence_no' => 1],
            ['process_name' => 'Cutting', 'man_hours_per_unit' => 0.30, 'machine_hours_per_unit' => 0.20]
        );
        \App\Models\RoutingTable::updateOrCreate(
            ['product_id' => $prodA->id, 'sequence_no' => 2],
            ['process_name' => 'Assembly', 'man_hours_per_unit' => 0.20, 'machine_hours_per_unit' => 0.10]
        );

        // Engine Gasket
        \App\Models\RoutingTable::updateOrCreate(
            ['product_id' => $prodC->id, 'sequence_no' => 1],
            ['process_name' => 'Machining', 'man_hours_per_unit' => 0.50, 'machine_hours_per_unit' => 0.30]
        );
        \App\Models\RoutingTable::updateOrCreate(
            ['product_id' => $prodC->id, 'sequence_no' => 2],
            ['process_name' => 'Quality Check', 'man_hours_per_unit' => 0.30, 'machine_hours_per_unit' => 0.20]
        );

        // 6. Resource Master
        \App\Models\ResourceMaster::updateOrCreate(
            ['resource_type' => 'labor'],
            ['cost_per_hour' => 70.00]
        );
        \App\Models\ResourceMaster::updateOrCreate(
            ['resource_type' => 'machine'],
            ['kwh_per_hour' => 5.0, 'energy_rate' => 8.0]
        );

        // 7. Shift Master
        \App\Models\ShiftMaster::updateOrCreate(
            ['shift_name' => 'Day Shift'],
            ['shift_hours' => 10.0, 'is_default' => true]
        );
    }

}
