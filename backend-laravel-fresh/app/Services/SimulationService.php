<?php

namespace App\Services;

use App\Models\Product;
use App\Models\BOMHeader;
use App\Models\BOMItem;
use App\Models\RoutingTable;
use App\Models\WarehouseStock;
use App\Models\ResourceMaster;
use App\Models\ShiftMaster;
use App\Models\SimulationResult;
use App\Models\SimulationMpsItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class SimulationService
{
    /**
     * Run the simulation based on MPS and parameters
     */
    public function run(array $mps, float $shiftHours, int $workerCount)
    {
        $materialBreakdown = [];
        $resourceBreakdown = [];
        $costBreakdown = [
            'material' => 0,
            'labor' => 0,
            'electricity' => 0,
            'total' => 0
        ];

        $totalManHours = 0;
        $totalMachineHours = 0;
        $materialsChecked = 0;
        $materialsAvailableCount = 0;

        $bomProductCol = $this->resolveColumn('bom_headers', ['productId', 'product_id']);
        $bomActiveCol = $this->resolveColumn('bom_headers', ['isActive', 'is_active']);
        $bomItemBomCol = $this->resolveColumn('bom_items', ['bom_header_id', 'bomHeaderId']);
        $bomItemRawCol = $this->resolveColumn('bom_items', ['raw_material_id', 'rawMaterialId', 'componentId']);
        $bomItemQtyCol = $this->resolveColumn('bom_items', ['qty_per_unit', 'qtyPerUnit', 'quantity']);
        $routingProductCol = $this->resolveColumn('routing_tables', ['product_id', 'productId', 'bomHeaderId']);
        $routingSeqCol = $this->resolveColumn('routing_tables', ['sequence_no', 'sequenceNo', 'operationNo']);
        $routingProcessCol = $this->resolveColumn('routing_tables', ['process_name', 'processName', 'operationName']);
        $routingManHrsCol = $this->resolveColumn('routing_tables', ['man_hours_per_unit', 'manHours']);
        $routingMacHrsCol = $this->resolveColumn('routing_tables', ['machine_hours_per_unit', 'machineHours']);
        $stockProductCol = $this->resolveColumn('warehouse_stocks', ['product_id', 'productId']);
        $stockQtyCol = $this->resolveColumn('warehouse_stocks', ['quantity', 'currentStock']);

        // 1. MRP & CRP Calculation
        foreach ($mps as $item) {
            $productId = $item['productId'] ?? $item['product_id'] ?? null;
            $product = Product::find($productId);
            if (!$product) continue;

            $targetQty = floatval($item['targetQty'] ?? $item['target_qty'] ?? 1);
            $materialsChecked++;

            // a. Material Requirements (BOM)
            $bomQuery = BOMHeader::query();
            if ($bomProductCol) {
                $bomQuery->where($bomProductCol, $product->id);
            }
            if ($bomActiveCol) {
                $bomQuery->where($bomActiveCol, true);
            }
            $bom = $bomQuery->first();
            if ($bom) {
                $componentsQuery = BOMItem::query();
                if ($bomItemBomCol) {
                    $componentsQuery->where($bomItemBomCol, $bom->id);
                }
                $components = $componentsQuery->get();
                foreach ($components as $comp) {
                    $rawMaterialId = $bomItemRawCol ? ($comp->{$bomItemRawCol} ?? null) : null;
                    $qtyPerUnit = floatval($bomItemQtyCol ? ($comp->{$bomItemQtyCol} ?? 0) : 0);
                    if ($qtyPerUnit <= 0) $qtyPerUnit = 1.0; // Default if zero

                    $reqQty = $qtyPerUnit * $targetQty;
                    $compProduct = $rawMaterialId ? Product::find($rawMaterialId) : null;
                    
                    if (!$compProduct) continue;

                    // Get available stock
                    $available = 0;
                    if ($stockProductCol && $stockQtyCol) {
                        $available = floatval(WarehouseStock::where($stockProductCol, $compProduct->id)->sum($stockQtyCol) ?? 0);
                    }
                    $shortfall = max(0, $reqQty - $available);

                    $materialPrice = floatval($compProduct->lastPurchasePrice ?? $compProduct->last_purchase_price ?? 0);
                    if ($materialPrice <= 0) $materialPrice = 50.0; // Default price

                    $matCost = $reqQty * $materialPrice;
                    $costBreakdown['material'] += $matCost;

                    $materialBreakdown[] = [
                        'item_id' => $compProduct->id,
                        'item_code' => $compProduct->code,
                        'item_name' => $compProduct->name,
                        'parent_name' => $product->name,
                        'required_qty' => $reqQty,
                        'current_stock' => $available,
                        'available_qty' => $available, // For safety
                        'shortfall' => $shortfall,
                        'unit' => $comp->unit ?? $compProduct->unit ?? 'Pcs',
                        'unit_price' => $materialPrice,
                        'material_cost' => $matCost,
                        'status' => $shortfall > 0 ? 'SHORTAGE' : 'READY',
                    ];
                }
            }

            // b. Capacity Requirements (Routing)
            $routingsQuery = RoutingTable::query();
            if ($routingProductCol) {
                $routingsQuery->where($routingProductCol, $product->id);
            } else {
                $routingsQuery->whereRaw('1 = 0');
            }
            if ($routingSeqCol) {
                $routingsQuery->orderBy($routingSeqCol);
            }
            $routings = $routingsQuery->get();
            
            $prodManHours = 0;
            $prodMacHours = 0;

            foreach ($routings as $route) {
                $manHrsPerUnit = floatval($routingManHrsCol ? ($route->{$routingManHrsCol} ?? 0) : 0);
                if ($manHrsPerUnit <= 0) $manHrsPerUnit = 0.5; // Default

                $macHrsPerUnit = floatval($routingMacHrsCol ? ($route->{$routingMacHrsCol} ?? 0) : 0);
                if ($macHrsPerUnit <= 0) $macHrsPerUnit = 0.3; // Default

                $manHrs = $manHrsPerUnit * $targetQty;
                $macHrs = $macHrsPerUnit * $targetQty;

                $totalManHours += $manHrs;
                $totalMachineHours += $macHrs;
                $prodManHours += $manHrs;
                $prodMacHours += $macHrs;
            }

            $resourceBreakdown[] = [
                'product_name' => $product->name,
                'target_qty' => $targetQty,
                'man_hours_needed' => round($prodManHours, 2),
                'machine_hours_needed' => round($prodMacHours, 2),
            ];
        }

        // c. Readiness Percentage
        $materialReadinessPct = 0;
        if ($materialsChecked > 0) {
            $itemsWithNoShortfall = 0;
            $parentItems = collect($mps)->pluck('productId')->unique();
            foreach($parentItems as $pId) {
                $pName = optional(Product::find($pId))->name;
                if (!$pName) continue;
                $hasShortage = collect($materialBreakdown)->where('parent_name', $pName)->where('status', 'SHORTAGE')->count() > 0;
                if (!$hasShortage) $itemsWithNoShortfall++;
            }
            $materialReadinessPct = round(($itemsWithNoShortfall / count($parentItems)) * 100, 2);
        }

        // 2. Resource Costs
        $laborResource = ResourceMaster::where('resource_type', 'labor')->first();
        $laborRate = $laborResource ? floatval($laborResource->cost_per_hour) : 70.00;
        
        $machineResource = ResourceMaster::where('resource_type', 'machine')->first();
        $kwhPerHr = $machineResource ? floatval($machineResource->kwh_per_hour) : 5.0;
        $energyRate = $machineResource ? floatval($machineResource->energy_rate) : 8.0;

        $costBreakdown['labor'] = round($totalManHours * $laborRate, 2);
        $costBreakdown['electricity'] = round($totalMachineHours * $kwhPerHr * $energyRate, 2);
        $costBreakdown['total'] = round($costBreakdown['material'] + $costBreakdown['labor'] + $costBreakdown['electricity'], 2);

        // 3. Percentages for Chart
        $totalCost = max(1, $costBreakdown['total']);
        $costBreakdown['labor_pct'] = round(($costBreakdown['labor'] / $totalCost) * 100, 1);
        $costBreakdown['material_pct'] = round(($costBreakdown['material'] / $totalCost) * 100, 1);
        $costBreakdown['electricity_pct'] = round(($costBreakdown['electricity'] / $totalCost) * 100, 1);

        // 4. Time Estimation
        $workerCount = max(1, intval($workerCount));
        $shiftHours = max(1, floatval($shiftHours));
        $dailyCapacity = $workerCount * $shiftHours;
        $daysRequired = $dailyCapacity > 0 ? ceil($totalManHours / $dailyCapacity) : 0;
        if ($daysRequired <= 0 && $totalManHours > 0) $daysRequired = 1;

        $estimatedCompletion = Carbon::now()->addDays($daysRequired);
        $overloadAlert = ($daysRequired > 30);

        // Debug Log
        \Log::info('Simulation calc', [
            'totalManHours' => $totalManHours,
            'totalMachineHours' => $totalMachineHours,
            'workerCount' => $workerCount,
            'shiftHours' => $shiftHours,
            'daysRequired' => $daysRequired,
            'laborCost' => $costBreakdown['labor'],
            'materialCost' => $costBreakdown['material'],
            'electricityCost' => $costBreakdown['electricity'],
            'totalCost' => $costBreakdown['total'],
            'materialsCount' => count($materialBreakdown),
        ]);

        return [
            'mrp_breakdown' => $materialBreakdown,
            'crp_summary' => [
                'total_man_hours' => round($totalManHours, 2),
                'total_machine_hours' => round($totalMachineHours, 2),
                'days_required' => $daysRequired,
                'estimated_completion' => $estimatedCompletion->toDateString(),
                'overload_alert' => $overloadAlert,
                'crp_breakdown' => $resourceBreakdown,
            ],
            'cost_breakdown' => [
                'labor_cost' => $costBreakdown['labor'],
                'material_cost' => $costBreakdown['material'],
                'electricity_cost' => $costBreakdown['electricity'],
                'total_cost' => $costBreakdown['total'],
                'labor' => $costBreakdown['labor'], // Duplicate for frontend compatibility
                'material' => $costBreakdown['material'],
                'electricity' => $costBreakdown['electricity'],
                'total' => $costBreakdown['total'],
                'labor_pct' => $costBreakdown['labor_pct'],
                'material_pct' => $costBreakdown['material_pct'],
                'electricity_pct' => $costBreakdown['electricity_pct'],
            ],
            'summary' => [ // Legacy/Compatibility summary
                'total_man_hours' => round($totalManHours, 2),
                'total_machine_hours' => round($totalMachineHours, 2),
                'days_required' => $daysRequired,
                'estimated_completion' => $estimatedCompletion->toDateString(),
                'material_readiness_pct' => $materialReadinessPct,
                'overload_alert' => $overloadAlert,
            ],
            'resource_breakdown' => $resourceBreakdown, // Duplicated for compatibility
            'material_readiness_percent' => $materialReadinessPct,
            'material_breakdown' => $materialBreakdown, // Duplicated for compatibility
        ];
    }

    /**
     * Save simulation run
     */
    public function save(array $data, array $mps)
    {
        return DB::transaction(function() use ($data, $mps) {
            $resultPayload = [
                'simulation_name' => $data['simulation_name'] ?? 'Simulation_' . now()->timestamp,
                'shift_hours' => $data['shift_hours'],
                'worker_count' => $data['worker_count'],
                'total_man_hours' => $data['summary']['total_man_hours'],
                'total_machine_hours' => $data['summary']['total_machine_hours'],
                'days_required' => $data['summary']['days_required'],
                'estimated_completion' => $data['summary']['estimated_completion'],
                'labor_cost' => $data['cost_breakdown']['labor'],
                'material_cost' => $data['cost_breakdown']['material'],
                'electricity_cost' => $data['cost_breakdown']['electricity'],
                'total_cost' => $data['cost_breakdown']['total'],
                'material_readiness_pct' => $data['summary']['material_readiness_pct'],
                'overload_alert' => $data['summary']['overload_alert'],
                'material_breakdown' => json_encode($data['material_breakdown']),
                'resource_breakdown' => json_encode($data['resource_breakdown']),
                'cost_breakdown' => json_encode($data['cost_breakdown']),
            ];

            $createdByCol = $this->resolveColumn('simulation_results', ['created_by', 'createdBy']);
            if ($createdByCol) {
                $resultPayload[$createdByCol] = auth()->id() ?? 1;
            }
            if (Schema::hasColumn('simulation_results', 'created_at')) {
                $resultPayload['created_at'] = now();
            }
            if (Schema::hasColumn('simulation_results', 'updated_at')) {
                $resultPayload['updated_at'] = now();
            }
            if (Schema::hasColumn('simulation_results', 'createdAt')) {
                $resultPayload['createdAt'] = now();
            }
            if (Schema::hasColumn('simulation_results', 'updatedAt')) {
                $resultPayload['updatedAt'] = now();
            }

            $resultId = DB::table('simulation_results')->insertGetId($resultPayload);

            $mpsSimulationCol = $this->resolveColumn('simulation_mps_items', ['simulation_id', 'simulationId']);
            $mpsProductCol = $this->resolveColumn('simulation_mps_items', ['product_id', 'productId']);
            $mpsQtyCol = $this->resolveColumn('simulation_mps_items', ['target_qty', 'targetQty']);

            foreach ($mps as $item) {
                $payload = [];
                $payload[$mpsSimulationCol ?? 'simulation_id'] = $resultId;
                $payload[$mpsProductCol ?? 'product_id'] = $item['productId'];
                $payload[$mpsQtyCol ?? 'target_qty'] = $item['targetQty'];
                if (Schema::hasColumn('simulation_mps_items', 'created_at')) {
                    $payload['created_at'] = now();
                }
                if (Schema::hasColumn('simulation_mps_items', 'updated_at')) {
                    $payload['updated_at'] = now();
                }
                if (Schema::hasColumn('simulation_mps_items', 'createdAt')) {
                    $payload['createdAt'] = now();
                }
                if (Schema::hasColumn('simulation_mps_items', 'updatedAt')) {
                    $payload['updatedAt'] = now();
                }
                DB::table('simulation_mps_items')->insert($payload);
            }

            return SimulationResult::find($resultId) ?? ['id' => $resultId];
        });
    }

    private function resolveColumn(string $table, array $candidates): ?string
    {
        if (!Schema::hasTable($table)) {
            return null;
        }

        foreach ($candidates as $column) {
            if (Schema::hasColumn($table, $column)) {
                return $column;
            }
        }

        return null;
    }
}
