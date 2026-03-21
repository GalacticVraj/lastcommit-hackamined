<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\BOMHeader;
use App\Models\BOMItem;
use App\Models\ProductionRouteCard;
use App\Models\ProductionReport;
use App\Models\JobOrder;
use App\Models\JobOrderItem;
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
        $productTable = (new Product())->getTable();
        $hasDeletedAt = Schema::hasColumn($productTable, 'deletedAt');

        $query = Product::query();
        if ($hasDeletedAt) {
            $query->whereNull('deletedAt');
        }
        if ($search = $request->get('search'))
            $query->where('name', 'like', "%{$search}%");
        if ($request->has('category'))
            $query->where('category', $request->category);
        return $this->paginatedResponse($query->orderBy($request->get('sort_by', 'createdAt'), $request->get('sort_order', 'desc'))->paginate((int) $request->get('per_page', 100)));
    }

    public function getBom($id)
    {
        $record = DB::table((new BOMHeader())->getTable() . ' as b')
            ->leftJoin((new Product())->getTable() . ' as p', 'b.productId', '=', 'p.id')
            ->where('b.id', $id)
            ->select('b.*', 'p.name as productName', 'p.code as productCode')
            ->first();

        if (!$record) {
            return $this->errorResponse('BOM not found', 404);
        }

        return $this->successResponse($record);
    }

    public function getRouteCard($id)
    {
        $record = DB::table((new ProductionRouteCard())->getTable() . ' as rc')
            ->leftJoin((new Product())->getTable() . ' as p', 'rc.productId', '=', 'p.id')
            ->where('rc.id', $id)
            ->select('rc.*', 'p.name as productName', 'p.code as productCode')
            ->first();

        if (!$record) {
            return $this->errorResponse('Route card not found', 404);
        }

        return $this->successResponse($record);
    }

    public function getReport($id)
    {
        $record = DB::table((new ProductionReport())->getTable() . ' as pr')
            ->leftJoin((new Product())->getTable() . ' as p', 'pr.productId', '=', 'p.id')
            ->leftJoin((new ProductionRouteCard())->getTable() . ' as rc', 'pr.routeCardId', '=', 'rc.id')
            ->where('pr.id', $id)
            ->select('pr.*', 'p.name as productName', 'p.code as productCode', 'rc.routeCardNo')
            ->first();

        if (!$record) {
            return $this->errorResponse('Production report not found', 404);
        }

        return $this->successResponse($record);
    }

    public function getJobOrder($id)
    {
        $record = JobOrder::find($id);
        if (!$record) {
            return $this->errorResponse('Job order not found', 404);
        }

        return $this->successResponse($record);
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
        $productTable = $p->getTable();
        $payload = $request->only(['code', 'name', 'category', 'unit', 'hsnCode', 'gstPercent', 'currentStock', 'manHoursPerUnit', 'machineHoursPerUnit', 'description', 'maxStock', 'standardCost']);

        if (Schema::hasColumn($productTable, 'reorderLevel')) {
            $payload['reorderLevel'] = $request->get('reorderLevel', $request->get('minStock', $p->reorderLevel ?? 0));
        } elseif (Schema::hasColumn($productTable, 'minStock')) {
            $payload['minStock'] = $request->get('minStock', $request->get('reorderLevel', $p->minStock ?? 0));
        }

        $payload = collect($payload)
            ->filter(fn($value) => $value !== null)
            ->filter(fn($value, $column) => Schema::hasColumn($productTable, $column))
            ->toArray();

        if (Schema::hasColumn($productTable, 'updatedBy')) {
            $payload['updatedBy'] = $request->user()->id;
        } elseif (Schema::hasColumn($productTable, 'updated_by')) {
            $payload['updated_by'] = $request->user()->id;
        }

        if (!empty($payload)) {
            $p->update($payload);
        }

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

    // ==========================================
    // BOM Header & Items CRUD
    // ==========================================
    public function createBom(Request $request)
    {
        DB::beginTransaction();
        try {
            $bom = BOMHeader::create([
                'bomNo' => $request->bomNo ?? 'BOM-' . time(),
                'productId' => $request->productId,
                'version' => $request->version ?? '1.0',
                'effectiveFrom' => $request->effectiveFrom ?? now(),
                'createdBy' => $request->user()?->id
            ]);

            if ($request->has('items') && is_array($request->items)) {
                foreach ($request->items as $item) {
                    BOMItem::create([
                        'bom_header_id' => $bom->id,
                        'raw_material_id' => $item['raw_material_id'] ?? $item['componentId'] ?? $item['productId'],
                        'qty_per_unit' => $item['qty_per_unit'] ?? $item['quantity'],
                        'unit' => $item['unit'] ?? 'Nos',
                    ]);
                }
            }
            DB::commit();
            return $this->successResponse($bom, 'BOM created successfully', 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function updateBom(Request $request, $id)
    {
        $bom = BOMHeader::findOrFail($id);
        $bom->update($request->only(['version', 'effectiveFrom', 'isActive']));
        return $this->successResponse($bom, 'BOM updated');
    }

    public function deleteBom($id)
    {
        BOMHeader::where('id', $id)->delete();
        BOMItem::where('bomHeaderId', $id)->delete();
        return $this->successResponse(null, 'BOM deleted');
    }

    // ==========================================
    // Production Route Card CRUD
    // ==========================================
    public function createRouteCard(Request $request)
    {
        $payload = $request->only(['productId', 'bomHeaderId', 'batchNo', 'planQty', 'status']);
        $payload['routeCardNo'] = $request->routeCardNo ?? 'RC-' . time();
        $payload['createdBy'] = $request->user()?->id;

        $rc = ProductionRouteCard::create($payload);
        return $this->successResponse($rc, 'Route Card created', 201);
    }

    public function updateRouteCard(Request $request, $id)
    {
        $rc = ProductionRouteCard::findOrFail($id);
        $rc->update($request->only(['planQty', 'status', 'batchNo', 'isActive']));
        return $this->successResponse($rc, 'Route Card updated');
    }

    public function deleteRouteCard($id)
    {
        ProductionRouteCard::where('id', $id)->update(['deletedAt' => now()]);
        return $this->successResponse(null, 'Route Card deleted');
    }

    // ==========================================
    // Production Report (Stock Sync Engine)
    // ==========================================
    public function createReport(Request $request)
    {
        DB::beginTransaction();
        try {
            $report = ProductionReport::create([
                'routeCardId' => $request->routeCardId,
                'productId' => $request->productId,
                'reportDate' => $request->reportDate ?? now(),
                'productionQty' => $request->productionQty,
                'rejectionQty' => $request->rejectionQty ?? 0,
                'remarks' => $request->remarks,
                'createdBy' => $request->user()?->id
            ]);

            // Phase 2 Stock Sync: Auto-Add Finished Goods Stock
            Product::where('id', $request->productId)->increment('currentStock', $request->productionQty);

            // Phase 2 Stock Sync: Auto-Deduct Raw Materials via BOM
            if ($request->routeCardId) {
                $rc = ProductionRouteCard::find($request->routeCardId);
                if ($rc && $rc->bomHeaderId) {
                    $bomItems = BOMItem::where('bom_header_id', $rc->bomHeaderId)->get();
                    foreach ($bomItems as $item) {
                        $deductQty = $request->productionQty * ($item->qty_per_unit ?? $item->quantity ?? 0);
                        Product::where('id', $item->raw_material_id ?? $item->componentId)->decrement('currentStock', $deductQty);
                    }
                    
                    // Update Pipeline Progress Status
                    $rc->increment('actualQty', $request->productionQty);
                    if ($rc->actualQty >= $rc->planQty) {
                        $rc->update(['status' => 'Completed']);
                    } else {
                        $rc->update(['status' => 'WIP']);
                    }
                }
            }

            DB::commit();
            return $this->successResponse($report, 'Production report created and inventory stocks synced.', 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function updateReport(Request $request, $id)
    {
        $report = ProductionReport::findOrFail($id);
        $report->update($request->only(['remarks'])); // Usually qty shouldn't be mutable without stock reversal
        return $this->successResponse($report, 'Production report updated');
    }

    public function deleteReport($id)
    {
        // Ideally should reverse stock here too. Keeping it simple for now or mark as deleted.
        $report = ProductionReport::findOrFail($id);
        // Reverse Stock Logic:
        Product::where('id', $report->productId)->decrement('currentStock', $report->productionQty);
        if ($report->routeCardId) {
            $rc = ProductionRouteCard::find($report->routeCardId);
            if ($rc && $rc->bomHeaderId) {
                $bomItems = BOMItem::where('bomHeaderId', $rc->bomHeaderId)->get();
                foreach ($bomItems as $item) {
                    $addQty = $report->productionQty * $item->quantity;
                    Product::where('id', $item->componentId)->increment('currentStock', $addQty);
                }
                $rc->decrement('actualQty', $report->productionQty);
            }
        }
        $report->delete();
        return $this->successResponse(null, 'Production report deleted & stock reversed');
    }

    // ==========================================
    // Job Order CRUD
    // ==========================================
    public function createJobOrder(Request $request)
    {
        DB::beginTransaction();
        try {
            $jo = JobOrder::create([
                'jobOrderNo' => $request->jobOrderNo ?? 'JOB-' . time(),
                'contractorName' => $request->contractorName,
                'processRequired' => $request->processRequired,
                'status' => $request->status ?? 'Pending',
                'createdBy' => $request->user()?->id
            ]);

            if ($request->has('items') && is_array($request->items)) {
                foreach ($request->items as $item) {
                    JobOrderItem::create([
                        'jobOrderId' => $jo->id,
                        'productId' => $item['productId'],
                        'quantity' => $item['quantity'],
                        'rate' => $item['rate'] ?? 0,
                    ]);
                }
            }
            DB::commit();
            return $this->successResponse($jo, 'Job Order created', 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function updateJobOrder(Request $request, $id)
    {
        $jo = JobOrder::findOrFail($id);
        $jo->update($request->only(['status', 'processRequired', 'isActive']));
        return $this->successResponse($jo, 'Job Order updated');
    }

    public function deleteJobOrder($id)
    {
        JobOrder::where('id', $id)->update(['deletedAt' => now()]);
        return $this->successResponse(null, 'Job Order deleted');
    }
}
