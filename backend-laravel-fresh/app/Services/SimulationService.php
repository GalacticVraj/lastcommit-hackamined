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

        // 1. MRP & CRP Calculation
        foreach ($mps as $item) {
            $product = Product::find($item['productId']);
            if (!$product) continue;

            $qty = $item['targetQty'];
            $materialsChecked++;

            // a. Material Requirements (BOM)
            $bom = BOMHeader::where('product_id', $product->id)->where('is_active', true)->first();
            if ($bom) {
                $components = BOMItem::where('bom_header_id', $bom->id)->with('rawMaterial')->get();
                foreach ($components as $comp) {
                    $reqQty = $comp->qty_per_unit * $qty;
                    $compProduct = $comp->rawMaterial;
                    
                    if (!$compProduct) continue;

                    // Get available stock
                    $available = WarehouseStock::where('product_id', $compProduct->id)->sum('quantity');
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
            $routings = RoutingTable::where('product_id', $product->id)->orderBy('sequence_no')->get();
            foreach ($routings as $route) {
                $manHrs = $route->man_hours_per_unit * $qty;
                $macHrs = $route->machine_hours_per_unit * $qty;

                $totalManHours += $manHrs;
                $totalMachineHours += $macHrs;

                $resourceBreakdown[] = [
                    'product_name' => $product->name,
                    'process_name' => $route->process_name,
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
                $prodShortfalls = collect($materialBreakdown)->where('parent_name', Product::find($item['productId'])->name)->where('status', 'Shortfall')->count();
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
            $result = SimulationResult::create([
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
                'mrp_breakdown' => $data['material_breakdown'],
                'crp_breakdown' => $data['resource_breakdown'],
                'cost_breakdown' => $data['cost_breakdown'],
                'created_by' => auth()->id(),
            ]);

            foreach ($mps as $item) {
                SimulationMpsItem::create([
                    'simulation_id' => $result->id,
                    'product_id' => $item['productId'],
                    'target_qty' => $item['targetQty'],
                ]);
            }

            return $result;
        });
    }
}
