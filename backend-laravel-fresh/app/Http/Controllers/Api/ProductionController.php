<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\BOMHeader;
use App\Models\ProductionRouteCard;
use App\Models\ProductionReport;
use App\Models\JobOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProductionController extends Controller
{
    public function dashboard(Request $request)
    {
        $productTable = (new Product())->getTable();
        $bomTable = (new BOMHeader())->getTable();
        $routeTable = (new ProductionRouteCard())->getTable();
        $reportTable = (new ProductionReport())->getTable();
        $jobTable = (new JobOrder())->getTable();
        $productHasDeletedAt = Schema::hasColumn($productTable, 'deletedAt');
        $bomHasDeletedAt = Schema::hasColumn($bomTable, 'deletedAt');
        $routeHasDeletedAt = Schema::hasColumn($routeTable, 'deletedAt');
        $reportHasDeletedAt = Schema::hasColumn($reportTable, 'deletedAt');
        $jobHasDeletedAt = Schema::hasColumn($jobTable, 'deletedAt');

        $totalProducts = Product::when($productHasDeletedAt, fn($query) => $query->whereNull('deletedAt'))->count();
        $finishedGoods = Product::where('category', 'Finished Good')->count();
        $rawMaterials = Product::where('category', 'Raw Material')->count();
        $thresholdColumn = null;
        if (Schema::hasColumn($productTable, 'reorderLevel')) {
            $thresholdColumn = 'reorderLevel';
        } elseif (Schema::hasColumn($productTable, 'minStock')) {
            $thresholdColumn = 'minStock';
        }

        $lowStockQuery = Product::query();
        if ($productHasDeletedAt) {
            $lowStockQuery->whereNull('deletedAt');
        }
        if ($thresholdColumn) {
            $lowStockQuery->whereColumn('currentStock', '<=', $thresholdColumn);
        }
        $lowStock = $lowStockQuery->count();

        $activeBomsQuery = DB::table($bomTable);
        if ($bomHasDeletedAt) {
            $activeBomsQuery->whereNull('deletedAt');
        }
        $activeBoms = $activeBomsQuery->count();

        $openRoutesQuery = DB::table($routeTable)->where('status', '!=', 'Completed');
        if ($routeHasDeletedAt) {
            $openRoutesQuery->whereNull('deletedAt');
        }
        $openRoutes = $openRoutesQuery->count();

        $categoryMixQuery = DB::table($productTable)
            ->selectRaw("COALESCE(category, 'Other') as name, COUNT(*) as value")
            ->groupBy('category')
            ->orderByDesc('value');
        if ($productHasDeletedAt) {
            $categoryMixQuery->whereNull('deletedAt');
        }
        $categoryMix = $categoryMixQuery->get();

        $routeStatusQuery = DB::table($routeTable)
            ->selectRaw("COALESCE(status, 'Open') as name, COUNT(*) as value")
            ->groupBy('status')
            ->orderByDesc('value');
        if ($routeHasDeletedAt) {
            $routeStatusQuery->whereNull('deletedAt');
        }
        $routeStatus = $routeStatusQuery->get();

        $monthlyOutputQuery = DB::table("{$reportTable} as r")
            ->selectRaw("substr(COALESCE(r.reportDate, r.createdAt), 1, 7) as name, SUM(COALESCE(r.productionQty, 0)) as value")
            ->groupBy(DB::raw("substr(COALESCE(r.reportDate, r.createdAt), 1, 7)"))
            ->orderBy('name');
        if ($reportHasDeletedAt) {
            $monthlyOutputQuery->whereNull('r.deletedAt');
        }
        $monthlyOutput = $monthlyOutputQuery->get();

        $recent = collect()
            ->merge(
                DB::table("{$routeTable} as rc")
                    ->leftJoin("{$productTable} as p", 'rc.productId', '=', 'p.id')
                    ->when($routeHasDeletedAt, fn($query) => $query->whereNull('rc.deletedAt'))
                    ->orderByDesc('rc.id')
                    ->limit(3)
                    ->get(['rc.id', 'rc.routeCardNo', 'rc.createdAt', 'rc.status', 'rc.planQty', 'p.name as productName'])
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'Route Card',
                        'ref' => $row->routeCardNo ?? ('RC-' . $row->id),
                        'item' => $row->productName ?? 'Unknown Product',
                        'date' => $row->createdAt,
                        'status' => $row->status ?? 'Open',
                        'amount' => (float) ($row->planQty ?? 0),
                    ])
            )
            ->merge(
                DB::table("{$reportTable} as pr")
                    ->leftJoin("{$productTable} as p", 'pr.productId', '=', 'p.id')
                    ->when($reportHasDeletedAt, fn($query) => $query->whereNull('pr.deletedAt'))
                    ->orderByDesc('pr.id')
                    ->limit(3)
                    ->get(['pr.id', 'pr.reportDate', 'pr.createdAt', 'pr.productionQty', 'pr.rejectionQty', 'p.name as productName'])
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'Report',
                        'ref' => 'PR-' . $row->id,
                        'item' => $row->productName ?? 'Unknown Product',
                        'date' => $row->reportDate ?? $row->createdAt,
                        'status' => ((float) ($row->rejectionQty ?? 0)) > 0 ? 'With Rejection' : 'OK',
                        'amount' => (float) ($row->productionQty ?? 0),
                    ])
            )
            ->merge(
                DB::table($jobTable)
                    ->when($jobHasDeletedAt, fn($query) => $query->whereNull('deletedAt'))
                    ->orderByDesc('id')
                    ->limit(3)
                    ->get(['id', 'jobOrderNo', 'createdAt', 'status'])
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'Job Order',
                        'ref' => $row->jobOrderNo ?? ('JOB-' . $row->id),
                        'item' => '-',
                        'date' => $row->createdAt,
                        'status' => $row->status ?? 'Open',
                        'amount' => 0,
                    ])
            )
            ->sortByDesc(fn($row) => $row['date'] ?? '')
            ->take(8)
            ->values();

        return $this->successResponse([
            'stats' => compact('totalProducts', 'finishedGoods', 'rawMaterials', 'lowStock', 'activeBoms', 'openRoutes'),
            'charts' => [
                [
                    'key' => 'production-category',
                    'title' => 'Product Category Mix',
                    'type' => 'pie',
                    'data' => $categoryMix,
                ],
                [
                    'key' => 'production-route-status',
                    'title' => 'Route Card Status',
                    'type' => 'bar',
                    'data' => $routeStatus,
                ],
                [
                    'key' => 'production-monthly-output',
                    'title' => 'Monthly Production Output',
                    'type' => 'line',
                    'data' => $monthlyOutput,
                ],
            ],
            'recent' => $recent,
        ]);
    }

    public function listProducts(Request $request)
    {
        $query = Product::whereNull('deletedAt');
        if ($search = $request->get('search'))
            $query->where('name', 'like', "%{$search}%");
        if ($request->has('category'))
            $query->where('category', $request->category);
        return $this->paginatedResponse($query->orderBy($request->get('sort_by', 'createdAt'), $request->get('sort_order', 'desc'))->paginate((int) $request->get('per_page', 100)));
    }

    public function createProduct(Request $request)
    {
        $productTable = (new Product())->getTable();
        $payload = $request->only(['code', 'name', 'category', 'unit', 'hsnCode', 'gstPercent', 'currentStock', 'manHoursPerUnit', 'machineHoursPerUnit']);

        if (Schema::hasColumn($productTable, 'reorderLevel')) {
            $payload['reorderLevel'] = $request->get('reorderLevel', $request->get('minStock', 0));
        } elseif (Schema::hasColumn($productTable, 'minStock')) {
            $payload['minStock'] = $request->get('minStock', $request->get('reorderLevel', 0));
        }

        $product = Product::create(array_merge($payload, ['createdBy' => $request->user()->id]));
        return $this->successResponse($product, 'Product created', 201);
    }

    public function getProduct($id)
    {
        return $this->successResponse(Product::findOrFail($id));
    }
    public function updateProduct(Request $request, $id)
    {
        $p = Product::findOrFail($id);
        $p->update(array_merge($request->all(), ['updatedBy' => $request->user()->id]));
        return $this->successResponse($p, 'Product updated');
    }
    public function deleteProduct($id)
    {
        Product::where('id', $id)->update(['deletedAt' => now()]);
        return $this->successResponse(null, 'Product deleted');
    }
    public function listBom(Request $request)
    {
        return $this->successResponse(BOMHeader::with('product:id,name')->orderByDesc('id')->get());
    }
    public function listRouteCards(Request $request)
    {
        return $this->successResponse(ProductionRouteCard::with('product:id,name')->orderByDesc('id')->get());
    }
    public function listReports(Request $request)
    {
        return $this->successResponse(ProductionReport::with('product:id,name')->orderByDesc('id')->get());
    }
    public function listJobOrders(Request $request)
    {
        return $this->successResponse(JobOrder::orderByDesc('id')->get());
    }
}
