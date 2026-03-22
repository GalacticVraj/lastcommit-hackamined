<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Models\Product;
use App\Models\Barcode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WarehouseController extends Controller
{
    private function ref(string $prefix): string
    {
        return $prefix . '-' . now()->format('ymdHis') . '-' . random_int(100, 999);
    }

    private function perPage(Request $request): int
    {
        return (int) $request->get('per_page', 25);
    }

    public function dashboard()
    {
        $productTable = (new Product())->getTable();

        $stats = [
            'totalWarehouses' => Warehouse::count(),
            'totalItems' => Product::count(),
            'avgStockPerItem' => Product::avg('currentStock') ?: 0,
            'warehouseOpenings' => DB::table('WarehouseOpening')->whereNull('deletedAt')->count(),
            'dispatchSrvs' => DB::table('DispatchSRV')->whereNull('deletedAt')->count(),
            'stockTransfers' => DB::table('WarehouseStockTransfer')->whereNull('deletedAt')->count(),
            'materialReceipts' => DB::table('WarehouseMaterialReceipt')->whereNull('deletedAt')->count(),
        ];

        $movementMix = [
            ['name' => 'Openings', 'value' => $stats['warehouseOpenings']],
            ['name' => 'Dispatch', 'value' => $stats['dispatchSrvs']],
            ['name' => 'Transfers', 'value' => $stats['stockTransfers']],
            ['name' => 'Receipts', 'value' => $stats['materialReceipts']],
        ];

        $topStock = DB::table($productTable)
            ->whereNull('deletedAt')
            ->orderByDesc('currentStock')
            ->limit(8)
            ->get(['name', 'currentStock'])
            ->map(fn($row) => [
                'name' => $row->name ?? 'Unknown',
                'value' => (float) ($row->currentStock ?? 0),
            ]);

        $monthlyReceipts = DB::table('WarehouseMaterialReceipt')
            ->whereNull('deletedAt')
            ->selectRaw("substr(COALESCE(receiptDate, createdAt), 1, 7) as name, COUNT(*) as value")
            ->groupBy(DB::raw("substr(COALESCE(receiptDate, createdAt), 1, 7)"))
            ->orderBy('name')
            ->get();

        $recent = collect()
            ->merge(
                DB::table('DispatchSRV')
                    ->whereNull('deletedAt')
                    ->orderByDesc('id')
                    ->limit(3)
                    ->get()
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'Dispatch SRV',
                        'ref' => $row->srvNo ?? ('SRV-' . $row->id),
                        'date' => $row->date ?? $row->createdAt,
                        'status' => 'Posted',
                        'amount' => (float) ($row->qty ?? 0),
                    ])
            )
            ->merge(
                DB::table('WarehouseStockTransfer')
                    ->whereNull('deletedAt')
                    ->orderByDesc('id')
                    ->limit(3)
                    ->get()
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'Transfer',
                        'ref' => $row->transferId ?? ('WST-' . $row->id),
                        'date' => $row->createdAt,
                        'status' => $row->status ?? 'Transferred',
                        'amount' => (float) ($row->qty ?? 0),
                    ])
            )
            ->merge(
                DB::table('WarehouseMaterialReceipt')
                    ->whereNull('deletedAt')
                    ->orderByDesc('id')
                    ->limit(3)
                    ->get()
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'Receipt',
                        'ref' => $row->receiptId ?? ('WMR-' . $row->id),
                        'date' => $row->receiptDate ?? $row->createdAt,
                        'status' => 'Posted',
                        'amount' => (float) ($row->qtyReceived ?? 0),
                    ])
            )
            ->sortByDesc(fn($row) => $row['date'] ?? '')
            ->take(6)
            ->values();

        return $this->successResponse([
            'stats' => $stats,
            'charts' => [
                [
                    'key' => 'warehouse-movement',
                    'title' => 'Movement Type Mix',
                    'type' => 'pie',
                    'data' => $movementMix,
                ],
                [
                    'key' => 'warehouse-stock',
                    'title' => 'Top Stock Items',
                    'type' => 'bar-horizontal',
                    'data' => $topStock,
                ],
                [
                    'key' => 'warehouse-receipts',
                    'title' => 'Material Receipts by Month',
                    'type' => 'line',
                    'data' => $monthlyReceipts,
                ],
            ],
            'recent' => $recent,
        ]);
    }

    public function listWarehouses(Request $request)
    {
        return $this->paginatedResponse(Warehouse::latest()->paginate($this->perPage($request)));
    }

    public function createWarehouse(Request $request)
    {
        $w = Warehouse::create($request->all() + ['createdBy' => $request->user()->id]);
        return $this->successResponse($w, 'Created', 201);
    }

    public function getWarehouse($id)
    {
        return $this->successResponse(Warehouse::findOrFail($id));
    }

    public function updateWarehouse(Request $request, $id)
    {
        $w = Warehouse::findOrFail($id);
        $w->update($request->all());
        return $this->successResponse($w, 'Updated');
    }

    public function deleteWarehouse($id)
    {
        $w = Warehouse::findOrFail($id);
        $w->update(['deletedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listStocks(Request $request)
    {
        $query = Product::whereNull('deletedAt');
        if ($cat = $request->get('category'))
            $query->where('category', $cat);
        return $this->paginatedResponse($query->latest()->paginate(50));
    }

    public function createStock(Request $request)
    {
        $payload = $request->all();
        $payload['code'] = $payload['code'] ?? ('STK-' . time() . '-' . random_int(100, 999));
        $payload['name'] = $payload['name'] ?? 'Unnamed Stock Item';
        $payload['category'] = $payload['category'] ?? 'Raw Material';
        $payload['unit'] = $payload['unit'] ?? 'Nos';
        $payload['currentStock'] = $payload['currentStock'] ?? 0;
        $payload['minStock'] = $payload['minStock'] ?? 0;
        $payload['createdBy'] = $request->user()?->id ?? 1;

        $product = Product::create($payload);
        return $this->successResponse($product, 'Stock created', 201);
    }

    public function getStock($id)
    {
        $product = Product::find($id);
        if (!$product) return $this->errorResponse('Stock not found', 404);
        return $this->successResponse($product);
    }

    public function updateStock(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $product->update($request->all());
        return $this->successResponse($product, 'Stock updated');
    }

    public function deleteStock($id)
    {
        $product = Product::findOrFail($id);
        $product->update(['deletedAt' => now()]);
        return $this->successResponse(null, 'Stock deleted');
    }

    public function listOpenings(Request $request)
    {
        $warehouseTable = (new Warehouse())->getTable();
        $productTable = (new Product())->getTable();

        $query = DB::table('WarehouseOpening as o')
            ->leftJoin("{$warehouseTable} as w", 'o.warehouseId', '=', 'w.id')
            ->leftJoin("{$productTable} as p", 'o.productId', '=', 'p.id')
            ->whereNull('o.deletedAt')
            ->select('o.*', 'w.name as warehouseName', 'p.name as itemName');
        return $this->paginatedResponse($query->orderByDesc('o.id')->paginate($this->perPage($request)));
    }

    public function createOpening(Request $request)
    {
        $openingQty = (float) ($request->openingQty ?? 0);

        $id = DB::table('WarehouseOpening')->insertGetId([
            'warehouseId' => $request->warehouseId ?? 1,
            'productId' => $request->productId ?? 1,
            'openingQty' => $openingQty,
            'value' => $request->value ?? 0,
            'date' => $request->date ?? date('Y-m-d'),
            'createdBy' => $request->user()?->id ?? 1,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);

        if ($request->productId) {
            Product::where('id', $request->productId)->increment('currentStock', $openingQty);
        }

        return $this->getOpening($id);
    }

    public function getOpening($id)
    {
        $warehouseTable = (new Warehouse())->getTable();
        $productTable = (new Product())->getTable();

        $record = DB::table('WarehouseOpening as o')
            ->leftJoin("{$warehouseTable} as w", 'o.warehouseId', '=', 'w.id')
            ->leftJoin("{$productTable} as p", 'o.productId', '=', 'p.id')
            ->where('o.id', $id)
            ->select('o.*', 'w.name as warehouseName', 'p.name as itemName')
            ->first();

        if (!$record) {
            return $this->errorResponse('Warehouse opening not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updateOpening(Request $request, $id)
    {
        $record = DB::table('WarehouseOpening')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Warehouse opening not found', 404);
        }

        DB::table('WarehouseOpening')->where('id', $id)->update([
            'warehouseId' => $request->warehouseId ?? $record->warehouseId,
            'productId' => $request->productId ?? $record->productId,
            'openingQty' => $request->openingQty ?? $record->openingQty,
            'value' => $request->value ?? $record->value,
            'date' => $request->date ?? $record->date,
            'updatedAt' => now(),
        ]);

        return $this->getOpening($id);
    }

    public function deleteOpening($id)
    {
        DB::table('WarehouseOpening')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listDispatchSrv(Request $request)
    {
        $productTable = (new Product())->getTable();

        $query = DB::table('DispatchSRV as d')
            ->leftJoin("{$productTable} as p", 'd.productId', '=', 'p.id')
            ->whereNull('d.deletedAt')
            ->select('d.*', 'p.name as itemName');
        return $this->paginatedResponse($query->orderByDesc('d.id')->paginate($this->perPage($request)));
    }

    public function createDispatchSrv(Request $request)
    {
        $qty = (float) ($request->qty ?? 0);
        $id = DB::table('DispatchSRV')->insertGetId([
            'srvNo' => $request->srvNo ?: $this->ref('SRV'),
            'date' => $request->date ?? date('Y-m-d'),
            'partyName' => $request->partyName ?? 'Unknown',
            'productId' => $request->productId ?? 1,
            'qty' => $qty,
            'returnExpected' => (bool) ($request->returnExpected ?? false),
            'returnExpectedDate' => $request->returnExpectedDate ?? date('Y-m-d'),
            'createdBy' => $request->user()?->id ?? 1,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);

        if ($request->productId && $qty > 0) {
            Product::where('id', $request->productId)->decrement('currentStock', $qty);
        }

        return $this->getDispatchSrv($id);
    }

    public function getDispatchSrv($id)
    {
        $productTable = (new Product())->getTable();

        $record = DB::table('DispatchSRV as d')
            ->leftJoin("{$productTable} as p", 'd.productId', '=', 'p.id')
            ->where('d.id', $id)
            ->select('d.*', 'p.name as itemName')
            ->first();

        if (!$record) {
            return $this->errorResponse('Dispatch SRV not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updateDispatchSrv(Request $request, $id)
    {
        $record = DB::table('DispatchSRV')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Dispatch SRV not found', 404);
        }

        DB::table('DispatchSRV')->where('id', $id)->update([
            'srvNo' => $request->srvNo ?? $record->srvNo,
            'date' => $request->date ?? $record->date,
            'partyName' => $request->partyName ?? $record->partyName,
            'productId' => $request->productId ?? $record->productId,
            'qty' => $request->qty ?? $record->qty,
            'returnExpected' => $request->returnExpected ?? $record->returnExpected,
            'returnExpectedDate' => $request->returnExpectedDate ?? $record->returnExpectedDate,
            'updatedAt' => now(),
        ]);

        return $this->getDispatchSrv($id);
    }

    public function deleteDispatchSrv($id)
    {
        DB::table('DispatchSRV')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listTransfers(Request $request)
    {
        $warehouseTable = (new Warehouse())->getTable();
        $productTable = (new Product())->getTable();

        $query = DB::table('WarehouseStockTransfer as t')
            ->leftJoin("{$warehouseTable} as fw", 't.fromWarehouseId', '=', 'fw.id')
            ->leftJoin("{$warehouseTable} as tw", 't.toWarehouseId', '=', 'tw.id')
            ->leftJoin("{$productTable} as p", 't.productId', '=', 'p.id')
            ->whereNull('t.deletedAt')
            ->select('t.*', 'fw.name as fromWarehouse', 'tw.name as toWarehouse', 'p.name as itemName');
        return $this->paginatedResponse($query->orderByDesc('t.id')->paginate($this->perPage($request)));
    }

    public function createTransfer(Request $request)
    {
        $id = DB::table('WarehouseStockTransfer')->insertGetId([
            'transferId' => $request->transferId ?: $this->ref('WST'),
            'fromWarehouseId' => $request->fromWarehouseId ?? 1,
            'toWarehouseId' => $request->toWarehouseId ?? 1,
            'productId' => $request->productId ?? 1,
            'qty' => $request->qty ?? 0,
            'status' => $request->status ?? 'Transferred',
            'createdBy' => $request->user()?->id ?? 1,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);

        return $this->getTransfer($id);
    }

    public function getTransfer($id)
    {
        $warehouseTable = (new Warehouse())->getTable();
        $productTable = (new Product())->getTable();

        $record = DB::table('WarehouseStockTransfer as t')
            ->leftJoin("{$warehouseTable} as fw", 't.fromWarehouseId', '=', 'fw.id')
            ->leftJoin("{$warehouseTable} as tw", 't.toWarehouseId', '=', 'tw.id')
            ->leftJoin("{$productTable} as p", 't.productId', '=', 'p.id')
            ->where('t.id', $id)
            ->select('t.*', 'fw.name as fromWarehouse', 'tw.name as toWarehouse', 'p.name as itemName')
            ->first();

        if (!$record) {
            return $this->errorResponse('Stock transfer not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updateTransfer(Request $request, $id)
    {
        $record = DB::table('WarehouseStockTransfer')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Stock transfer not found', 404);
        }

        DB::table('WarehouseStockTransfer')->where('id', $id)->update([
            'transferId' => $request->transferId ?? $record->transferId,
            'fromWarehouseId' => $request->fromWarehouseId ?? $record->fromWarehouseId,
            'toWarehouseId' => $request->toWarehouseId ?? $record->toWarehouseId,
            'productId' => $request->productId ?? $record->productId,
            'qty' => $request->qty ?? $record->qty,
            'status' => $request->status ?? $record->status,
            'updatedAt' => now(),
        ]);

        return $this->getTransfer($id);
    }

    public function deleteTransfer($id)
    {
        DB::table('WarehouseStockTransfer')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listMaterialReceipts(Request $request)
    {
        $warehouseTable = (new Warehouse())->getTable();
        $productTable = (new Product())->getTable();

        $query = DB::table('WarehouseMaterialReceipt as r')
            ->leftJoin("{$warehouseTable} as w", 'r.warehouseId', '=', 'w.id')
            ->leftJoin("{$productTable} as p", 'r.productId', '=', 'p.id')
            ->whereNull('r.deletedAt')
            ->select('r.*', 'w.name as warehouseName', 'p.name as itemName');
        return $this->paginatedResponse($query->orderByDesc('r.id')->paginate($this->perPage($request)));
    }

    public function createMaterialReceipt(Request $request)
    {
        $qty = (float) ($request->qtyReceived ?? 0);
        $id = DB::table('WarehouseMaterialReceipt')->insertGetId([
            'receiptId' => $request->receiptId ?: $this->ref('WMR'),
            'sourceDocRef' => $request->sourceDocRef ?? 'N/A',
            'warehouseId' => $request->warehouseId ?? 1,
            'productId' => $request->productId ?? 1,
            'qtyReceived' => $qty,
            'receiptDate' => $request->receiptDate ?? date('Y-m-d'),
            'createdBy' => $request->user()?->id ?? 1,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);

        if ($request->productId && $qty > 0) {
            Product::where('id', $request->productId)->increment('currentStock', $qty);
        }

        return $this->getMaterialReceipt($id);
    }

    public function getMaterialReceipt($id)
    {
        $warehouseTable = (new Warehouse())->getTable();
        $productTable = (new Product())->getTable();

        $record = DB::table('WarehouseMaterialReceipt as r')
            ->leftJoin("{$warehouseTable} as w", 'r.warehouseId', '=', 'w.id')
            ->leftJoin("{$productTable} as p", 'r.productId', '=', 'p.id')
            ->where('r.id', $id)
            ->select('r.*', 'w.name as warehouseName', 'p.name as itemName')
            ->first();

        if (!$record) {
            return $this->errorResponse('Material receipt not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updateMaterialReceipt(Request $request, $id)
    {
        $record = DB::table('WarehouseMaterialReceipt')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Material receipt not found', 404);
        }

        DB::table('WarehouseMaterialReceipt')->where('id', $id)->update([
            'receiptId' => $request->receiptId ?? $record->receiptId,
            'sourceDocRef' => $request->sourceDocRef ?? $record->sourceDocRef,
            'warehouseId' => $request->warehouseId ?? $record->warehouseId,
            'productId' => $request->productId ?? $record->productId,
            'qtyReceived' => $request->qtyReceived ?? $record->qtyReceived,
            'receiptDate' => $request->receiptDate ?? $record->receiptDate,
            'updatedAt' => now(),
        ]);

        return $this->getMaterialReceipt($id);
    }

    public function deleteMaterialReceipt($id)
    {
        DB::table('WarehouseMaterialReceipt')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function getWarehousesDropdown()
    {
        $rows = DB::table('Warehouse')
            ->whereNull('deletedAt')
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn($w) => ['id' => $w->id, 'label' => $w->name]);
        return $this->successResponse($rows);
    }

    public function getProductsDropdown()
    {
        $rows = DB::table('Product')
            ->whereNull('deletedAt')
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn($p) => ['id' => $p->id, 'label' => $p->name]);
        return $this->successResponse($rows);
    }

    public function listBarcodes(Request $request)
    {
        $query = Barcode::with('product');
        return $this->paginatedResponse($query->latest()->paginate($this->perPage($request)));
    }

    public function createBarcode(Request $request)
    {
        $request->validate([
            'productId' => 'required|exists:Product,id',
            'qtyToGenerate' => 'required|numeric|min:1',
        ]);

        $barcode = Barcode::create([
            'code' => 'BC-' . strtoupper(bin2hex(random_bytes(4))),
            'productId' => $request->productId,
            'batchNo' => $request->batchNo ?? 'B' . now()->format('ymd'),
            'qty' => $request->qtyToGenerate,
            'createdBy' => $request->user()?->id,
        ]);

        return $this->successResponse($barcode->load('product'), 'Barcode Generated', 201);
    }
    public function getBarcode($id)
    {
        $barcode = Barcode::with('product')->find($id);
        if (!$barcode)
            return $this->errorResponse('Barcode not found', 404);
        return $this->successResponse($barcode);
    }
}
