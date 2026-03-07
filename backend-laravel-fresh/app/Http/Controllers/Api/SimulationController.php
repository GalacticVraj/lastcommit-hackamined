<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\BOMHeader;
use App\Models\SimulationResult;
use App\Services\SimulationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class SimulationController extends Controller
{
    protected $simulationService;

    public function __construct(SimulationService $simulationService)
    {
        $this->simulationService = $simulationService;
    }

    /**
     * GET /api/v1/simulation/products-with-bom
     * Fetch products that have BOM and Routing
     */
    public function productsWithBom()
    {
        try {
            $query = Product::query()->select(['id', 'code', 'name', 'unit', 'lastPurchasePrice']);

            if (Schema::hasColumn('products', 'isActive')) {
                $query->where('isActive', true);
            } elseif (Schema::hasColumn('products', 'is_active')) {
                $query->where('is_active', true);
            }

            $products = $query->orderBy('name')->limit(500)->get();
            return $this->successResponse($products, 'Products fetched for simulation');
        } catch (\Throwable $e) {
            Log::error('Simulation products fetch error: ' . $e->getMessage());
            return $this->successResponse([], 'No products available for simulation');
        }
    }

    /**
     * POST /api/v1/simulation/run
     * Run simulation and return results (unsaved)
     */
    public function runSimulation(Request $request)
    {
        $request->validate([
            'mps' => 'required|array',
            'mps.*.productId' => 'required|exists:products,id',
            'mps.*.targetQty' => 'required|numeric|min:0.1',
            'shiftHours' => 'required|numeric|min:1',
            'workerCount' => 'required|integer|min:1',
        ]);

        try {
            $results = $this->simulationService->run(
                $request->input('mps'),
                (float) $request->input('shiftHours'),
                (int) $request->input('workerCount')
            );

            return $this->successResponse($results, 'Simulation completed');
        } catch (\Exception $e) {
            Log::error('Simulation Error: ' . $e->getMessage());
            return $this->errorResponse('Simulation failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/v1/simulation/save
     * Save the simulation results to history
     */
    public function saveSimulation(Request $request)
    {
        $request->validate([
            'simulation_name' => 'nullable|string|max:255',
            'shift_hours' => 'required|numeric',
            'worker_count' => 'required|integer',
            'summary' => 'required|array',
            'material_breakdown' => 'present|array',
            'resource_breakdown' => 'present|array',
            'cost_breakdown' => 'required|array',
            'mps' => 'required|array',
        ]);

        try {
            $saved = $this->simulationService->save($request->all(), $request->input('mps'));
            return $this->successResponse($saved, 'Simulation history saved');
        } catch (\Exception $e) {
            Log::error('Simulation Save Error: ' . $e->getMessage());
            return $this->errorResponse('Failed to save simulation: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/v1/simulation/history
     */
    public function listSimulations(Request $request)
    {
        $sims = SimulationResult::orderBy('id', 'desc')->paginate(25);
        return $this->paginatedResponse($sims);
    }

    /**
     * GET /api/v1/simulation/{id}
     */
    public function getSimulation($id)
    {
        $sim = SimulationResult::with('mpsItems.product')->find($id);
        if (!$sim) {
            return $this->errorResponse('Simulation not found', 404);
        }

        return $this->successResponse($sim);
    }
}

