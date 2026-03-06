<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\SimulationRun;
use App\Models\SimulationInput;
use App\Models\SimulationResult;
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
        $shiftHours = (float) $request->input('shiftHours', 10);
        $workerCount = (int) $request->input('workerCount', 50);

        $totalManHours = 0;
        $totalMachineHours = 0;
        $materialCost = 0;
        $materialsReady = 0;
        $totalProducts = count($mps);
        $productResults = [];

        foreach ($mps as $item) {
            $product = Product::find($item['productId']);
            if (!$product)
                continue;

            $qty = (float) $item['targetQty'];
            $manHrs = $product->manHoursPerUnit * $qty;
            $machineHrs = $product->machineHoursPerUnit * $qty;
            $matCost = $product->lastPurchasePrice * $qty;
            $netAvailable = $product->currentStock - $product->blockedStock;

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
            'shiftHours' => $shiftHours,
            'workerCount' => $workerCount,
            'totalManHours' => $totalManHours,
            'totalMachineHours' => $totalMachineHours,
            'daysRequired' => $daysRequired,
            'laborCost' => $laborCost,
            'electricityCost' => $electricityCost,
            'materialCost' => $materialCost,
            'totalCost' => $totalCost,
            'materialReadiness' => $materialReadinessPercent,
            'isSaved' => false,
            'createdBy' => collect([$request->user()->id])->first(),
        ]);

        foreach ($productResults as $pr) {
            // Save inputs
            SimulationInput::create([
                'simulationRunId' => $sim->id,
                'productId' => $pr['productId'],
                'targetQty' => $pr['targetQty'],
            ]);

            // Save results (shortfall estimation per item)
            SimulationResult::create([
                'simulationRunId' => $sim->id,
                'materialName' => $pr['productName'],
                'requiredQty' => $pr['targetQty'],
                'availableQty' => $pr['stockAvailable'],
                'shortfall' => $pr['shortfall'],
                'unitCost' => $pr['materialCost'] / max(1, $pr['targetQty']),
                'totalCost' => $pr['materialCost'],
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
        $sim->update(['isSaved' => true]);
        return $this->successResponse($sim, 'Simulation saved');
    }

    /**
     * GET /api/v1/simulation/history
     */
    public function listSimulations(Request $request)
    {
        $sims = SimulationRun::where('isSaved', true)
            ->orderBy('id', 'desc')
            ->paginate(25);

        return $this->paginatedResponse($sims);
    }

    /**
     * GET /api/v1/simulation/{id}
     */
    public function getSimulation(Request $request, $id)
    {
        $sim = SimulationRun::find($id);
        if (!$sim)
            return $this->errorResponse('Simulation not found', 404);

        $inputs = SimulationInput::where('simulationRunId', $sim->id)->get();
        $results = SimulationResult::where('simulationRunId', $sim->id)->get();

        return $this->successResponse([
            'simulation' => $sim,
            'inputs' => $inputs,
            'results' => $results,
        ]);
    }
}
