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
            $product = Product::find($item['productId']);
            if (!$product) continue;

            $qty = $item['targetQty'];
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
                    $qtyPerUnit = $bomItemQtyCol ? (float) ($comp->{$bomItemQtyCol} ?? 0) : 0;
                    $reqQty = $qtyPerUnit * $qty;
                    $compProduct = $rawMaterialId ? Product::find($rawMaterialId) : null;
                    
                    if (!$compProduct) continue;

                    // Get available stock
                    $available = 0;
                    if ($stockProductCol && $stockQtyCol) {
                        $available = (float) WarehouseStock::where($stockProductCol, $compProduct->id)->sum($stockQtyCol);
                    }
                    $shortfall = max(0, $reqQty - $available);

                    $materialBreakdown[] = [
                        'parent_name' => $product->name,
                        'material_id' => $compProduct->id,
                        'material_name' => $compProduct->name,
                        'required_qty' => $reqQty,
                        'available_qty' => $available,
                        'shortfall' => $shortfall,
                        'unit' => $comp->unit ?? $compProduct->unit,
                        'status' => $shortfall > 0 ? 'Shortfall' : 'Available',
                    ];

                    // Cost estimation (Material)
                    $costBreakdown['material'] += $reqQty * ($compProduct->lastPurchasePrice ?? 0);
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
            foreach ($routings as $route) {
                $manHrs = (float) ($routingManHrsCol ? ($route->{$routingManHrsCol} ?? 0) : 0) * $qty;
                $macHrs = (float) ($routingMacHrsCol ? ($route->{$routingMacHrsCol} ?? 0) : 0) * $qty;

                $totalManHours += $manHrs;
                $totalMachineHours += $macHrs;

                $resourceBreakdown[] = [
                    'product_name' => $product->name,
                    'process_name' => $routingProcessCol ? ($route->{$routingProcessCol} ?? 'Process') : 'Process',
                    'man_hours' => $manHrs,
                    'machine_hours' => $macHrs,
                ];
            }
        }

        // c. Check if all material is ready for the parent items (simplified check)
        // In a real MRP, this would be more complex, but here we just check if any needed material has shortfall.
        $hasShortfallGlobal = collect($materialBreakdown)->contains('status', 'Shortfall');
        $materialReadinessPct = 0;
        if ($materialsChecked > 0) {
            $itemsWithNoShortfall = 0;
            foreach($mps as $item) {
                $productName = optional(Product::find($item['productId']))->name;
                if (!$productName) {
                    continue;
                }
                $prodShortfalls = collect($materialBreakdown)->where('parent_name', $productName)->where('status', 'Shortfall')->count();
                if ($prodShortfalls === 0) $itemsWithNoShortfall++;
            }
            $materialReadinessPct = round(($itemsWithNoShortfall / $materialsChecked) * 100, 2);
        }

        // 2. Resource Costs
        $laborRate = ResourceMaster::where('resource_type', 'labor')->value('cost_per_hour') ?? 70.00;
        $machineResource = ResourceMaster::where('resource_type', 'machine')->first();
        $kwhPerHr = $machineResource->kwh_per_hour ?? 5.0;
        $energyRate = $machineResource->energy_rate ?? 8.0;

        $costBreakdown['labor'] = round($totalManHours * $laborRate, 2);
        $costBreakdown['electricity'] = round($totalMachineHours * $kwhPerHr * $energyRate, 2);
        $costBreakdown['total'] = round($costBreakdown['material'] + $costBreakdown['labor'] + $costBreakdown['electricity'], 2);

        // 3. Time Estimation
        $dailyCapacity = $workerCount * $shiftHours;
        $daysRequired = $dailyCapacity > 0 ? ceil($totalManHours / $dailyCapacity) : 0;
        $estimatedCompletion = Carbon::now()->addDays($daysRequired);

        // 4. Alerts
        $overloadAlert = ($daysRequired > 30); // Dynamic threshold example

        return [
            'summary' => [
                'total_man_hours' => round($totalManHours, 2),
                'total_machine_hours' => round($totalMachineHours, 2),
                'days_required' => $daysRequired,
                'estimated_completion' => $estimatedCompletion->toDateString(),
                'material_readiness_pct' => $materialReadinessPct,
                'overload_alert' => $overloadAlert,
            ],
            'material_breakdown' => $materialBreakdown,
            'resource_breakdown' => $resourceBreakdown,
            'cost_breakdown' => $costBreakdown,
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
