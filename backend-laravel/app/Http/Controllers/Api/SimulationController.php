<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\SimulationRun;
use App\Models\SimulationProduct;
use Illuminate\Http\Request;

class SimulationController extends Controller
{
    /**
     * POST /api/v1/simulation/run
     * Run a production simulation (MRP + CRP + Cost estimation)
     */
    public function runSimulation(Request $request)
    {
        $mps = $request->input('mps', []);
        $shiftHours = (float) $request->input('shift_hours', 10);
        $workerCount = (int) $request->input('worker_count', 50);

        $totalManHours = 0;
        $totalMachineHours = 0;
        $materialCost = 0;
        $materialsReady = 0;
        $totalProducts = count($mps);
        $productResults = [];

        foreach ($mps as $item) {
            $product = Product::find($item['product_id']);
            if (!$product) continue;

            $qty = (float) $item['target_qty'];
            $manHrs = $product->man_hours_per_unit * $qty;
            $machineHrs = $product->machine_hours_per_unit * $qty;
            $matCost = $product->last_purchase_price * $qty;
            $netAvailable = $product->current_stock - $product->blocked_stock;

            $totalManHours += $manHrs;
            $totalMachineHours += $machineHrs;
            $materialCost += $matCost;

            if ($netAvailable >= $qty) {
                $materialsReady++;
            }

            $productResults[] = [
                'productId' => $product->id,
                'productName' => $product->name,
                'targetQty' => $qty,
                'manHours' => round($manHrs, 2),
                'machineHours' => round($machineHrs, 2),
                'materialCost' => round($matCost, 2),
                'stockAvailable' => $netAvailable,
                'shortfall' => max(0, $qty - $netAvailable),
            ];
        }

        $laborCost = round($totalManHours * 350, 2); // ₹350/hr
        $electricityCost = round($totalMachineHours * 25, 2); // ₹25/hr
        $totalCost = round($laborCost + $electricityCost + $materialCost, 2);

        $dailyCapacity = $workerCount * $shiftHours;
        $daysRequired = $dailyCapacity > 0 ? round($totalManHours / $dailyCapacity, 1) : 0;

        $materialReadinessPercent = $totalProducts > 0
            ? round(($materialsReady / $totalProducts) * 100, 1) : 0;

        // Persist simulation
        $sim = SimulationRun::create([
            'shift_hours' => $shiftHours,
            'worker_count' => $workerCount,
            'total_man_hours' => $totalManHours,
            'total_machine_hours' => $totalMachineHours,
            'days_required' => $daysRequired,
            'labor_cost' => $laborCost,
            'electricity_cost' => $electricityCost,
            'material_cost' => $materialCost,
            'total_cost' => $totalCost,
            'material_readiness' => $materialReadinessPercent,
            'created_by' => $request->user()->id,
        ]);

        foreach ($productResults as $pr) {
            SimulationProduct::create([
                'simulation_run_id' => $sim->id,
                'product_id' => $pr['productId'],
                'target_qty' => $pr['targetQty'],
                'man_hours' => $pr['manHours'],
                'machine_hours' => $pr['machineHours'],
                'material_cost' => $pr['materialCost'],
            ]);
        }

        return $this->successResponse([
            'simulationId' => $sim->id,
            'products' => $productResults,
            'crpSummary' => [
                'totalManHours' => round($totalManHours, 2),
                'totalMachineHours' => round($totalMachineHours, 2),
                'workerCount' => $workerCount,
                'shiftHours' => $shiftHours,
                'daysRequired' => $daysRequired,
            ],
            'costBreakdown' => [
                'laborCost' => $laborCost,
                'electricityCost' => $electricityCost,
                'materialCost' => round($materialCost, 2),
                'totalCost' => $totalCost,
            ],
            'materialReadinessPercent' => $materialReadinessPercent,
        ], 'Simulation completed');
    }

    /**
     * POST /api/v1/simulation/{id}/save
     */
    public function saveSimulation(Request $request, $id)
    {
        $sim = SimulationRun::findOrFail($id);
        $sim->update(['is_saved' => true]);
        return $this->successResponse($sim, 'Simulation saved');
    }

    /**
     * GET /api/v1/simulation/history
     */
    public function listSimulations(Request $request)
    {
        $sims = SimulationRun::where('is_saved', true)
            ->latest()
            ->paginate(25);

        return $this->paginatedResponse($sims);
    }

    /**
     * GET /api/v1/simulation/{id}
     */
    public function getSimulation(Request $request, $id)
    {
        $sim = SimulationRun::with('products.product')->find($id);
        if (!$sim) return $this->errorResponse('Simulation not found', 404);
        return $this->successResponse($sim);
    }
}
