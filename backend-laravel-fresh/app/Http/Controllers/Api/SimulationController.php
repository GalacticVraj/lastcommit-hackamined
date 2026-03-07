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
            'summary' => 'nullable|array',
            'crp_summary' => 'nullable|array',
            'material_breakdown' => 'nullable|array',
            'mrp_breakdown' => 'nullable|array',
            'resource_breakdown' => 'nullable|array',
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
        $sims->getCollection()->transform(fn ($sim) => $this->mapSimulationPayload($sim));
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

        return $this->successResponse($this->mapSimulationPayload($sim));
    }

    private function mapSimulationPayload(SimulationResult $sim): array
    {
        $mrp = $sim->mrp_breakdown;
        if (is_string($mrp)) {
            $mrp = json_decode($mrp, true);
        }

        $crp = $sim->crp_breakdown;
        if (is_string($crp)) {
            $crp = json_decode($crp, true);
        }

        $cost = $sim->cost_breakdown;
        if (is_string($cost)) {
            $cost = json_decode($cost, true);
        }

        $mrp = is_array($mrp) ? $mrp : [];
        $crp = is_array($crp) ? $crp : [];
        $cost = is_array($cost) ? $cost : [];

        return [
            'id' => $sim->id,
            'simulation_name' => $sim->simulation_name,
            'shift_hours' => $sim->shift_hours,
            'worker_count' => $sim->worker_count,
            'crp_summary' => [
                'total_man_hours' => (float) ($sim->total_man_hours ?? 0),
                'total_machine_hours' => (float) ($sim->total_machine_hours ?? 0),
                'days_required' => (float) ($sim->days_required ?? 0),
                'estimated_completion' => $sim->estimated_completion,
                'overload_alert' => (bool) ($sim->overload_alert ?? false),
                'crp_breakdown' => $crp,
            ],
            'summary' => [
                'total_man_hours' => (float) ($sim->total_man_hours ?? 0),
                'total_machine_hours' => (float) ($sim->total_machine_hours ?? 0),
                'days_required' => (float) ($sim->days_required ?? 0),
                'estimated_completion' => $sim->estimated_completion,
                'material_readiness_pct' => (float) ($sim->material_readiness_pct ?? 0),
                'overload_alert' => (bool) ($sim->overload_alert ?? false),
            ],
            'material_readiness_percent' => (float) ($sim->material_readiness_pct ?? 0),
            'material_readiness_pct' => (float) ($sim->material_readiness_pct ?? 0),
            'mrp_breakdown' => $mrp,
            'material_breakdown' => $mrp,
            'resource_breakdown' => $crp,
            'cost_breakdown' => [
                'labor_cost' => (float) ($sim->labor_cost ?? ($cost['labor_cost'] ?? 0)),
                'material_cost' => (float) ($sim->material_cost ?? ($cost['material_cost'] ?? 0)),
                'electricity_cost' => (float) ($sim->electricity_cost ?? ($cost['electricity_cost'] ?? 0)),
                'total_cost' => (float) ($sim->total_cost ?? ($cost['total_cost'] ?? 0)),
                'labor' => (float) ($sim->labor_cost ?? ($cost['labor'] ?? $cost['labor_cost'] ?? 0)),
                'material' => (float) ($sim->material_cost ?? ($cost['material'] ?? $cost['material_cost'] ?? 0)),
                'electricity' => (float) ($sim->electricity_cost ?? ($cost['electricity'] ?? $cost['electricity_cost'] ?? 0)),
                'total' => (float) ($sim->total_cost ?? ($cost['total'] ?? $cost['total_cost'] ?? 0)),
            ],
            'total_cost' => (float) ($sim->total_cost ?? 0),
            'days_required' => (float) ($sim->days_required ?? 0),
            'created_at' => $sim->created_at,
            'updated_at' => $sim->updated_at,
            'mps' => $sim->relationLoaded('mpsItems')
                ? $sim->mpsItems->map(fn ($mps) => [
                    'productId' => $mps->product_id,
                    'targetQty' => (float) $mps->target_qty,
                    'product' => $mps->product,
                ])->values()->all()
                : [],
        ];
    }
}

