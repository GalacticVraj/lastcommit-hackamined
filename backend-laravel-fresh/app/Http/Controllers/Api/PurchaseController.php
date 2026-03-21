<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Vendor;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\GRN;
use App\Models\GRNItem;
use App\Models\PurchaseBill;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PurchaseController extends Controller
{
    private function filterExistingColumns(string $table, array $payload): array
    {
        return collect($payload)
            ->filter(fn($value) => $value !== null)
            ->filter(fn($value, $column) => Schema::hasColumn($table, $column))
            ->toArray();
    }

    private function generateDocNo(string $docType, string $prefix): string
    {
        try {
            return \App\Services\AutoNumber::generate($docType, $prefix);
        } catch (\Throwable $e) {
            return sprintf('%s-%s-%04d', $prefix, now()->format('YmdHis'), random_int(0, 9999));
        }
    }

    public function dashboard()
    {
        $poTable = (new PurchaseOrder())->getTable();
        $vendorTable = (new Vendor())->getTable();
        $grnTable = (new GRN())->getTable();
        $billTable = (new PurchaseBill())->getTable();

        $statusMix = DB::table("{$poTable}")
            ->whereNull('deletedAt')
            ->selectRaw("COALESCE(status, 'Open') as name, COUNT(*) as value")
            ->groupBy('status')
            ->orderByDesc('value')
            ->get();

        $monthlyPo = DB::table("{$poTable}")
            ->whereNull('deletedAt')
            ->selectRaw("substr(COALESCE(createdAt, updatedAt), 1, 7) as name, COUNT(*) as value")
            ->groupBy(DB::raw("substr(COALESCE(createdAt, updatedAt), 1, 7)"))
            ->orderBy('name')
            ->get();

        $vendorSpend = DB::table("{$poTable} as po")
            ->leftJoin("{$vendorTable} as v", 'po.vendorId', '=', 'v.id')
            ->whereNull('po.deletedAt')
            ->selectRaw("COALESCE(v.name, 'Unknown') as name, SUM(COALESCE(po.totalAmount, 0)) as value")
            ->groupBy('v.name')
            ->orderByDesc('value')
            ->limit(6)
            ->get();

        $recent = collect()
            ->merge(
                DB::table("{$poTable} as po")
                    ->leftJoin("{$vendorTable} as v", 'po.vendorId', '=', 'v.id')
                    ->whereNull('po.deletedAt')
                    ->orderByDesc('po.id')
                    ->limit(3)
                    ->get(['po.id', 'po.poNo', 'po.createdAt', 'po.status', 'po.totalAmount', 'v.name as vendorName'])
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'PO',
                        'ref' => $row->poNo,
                        'party' => $row->vendorName ?? 'Unknown Vendor',
                        'date' => $row->createdAt,
                        'status' => $row->status ?? 'Open',
                        'amount' => (float) ($row->totalAmount ?? 0),
                    ])
            )
            ->merge(
                DB::table("{$grnTable} as g")
                    ->leftJoin("{$vendorTable} as v", 'g.vendorId', '=', 'v.id')
                    ->whereNull('g.deletedAt')
                    ->orderByDesc('g.id')
                    ->limit(3)
                    ->get(['g.id', 'g.grnNo', 'g.grnDate', 'g.status', 'v.name as vendorName'])
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'GRN',
                        'ref' => $row->grnNo,
                        'party' => $row->vendorName ?? 'Unknown Vendor',
                        'date' => $row->grnDate,
                        'status' => $row->status ?? 'Pending',
                        'amount' => 0,
                    ])
            )
            ->merge(
                DB::table("{$billTable} as b")
                    ->leftJoin("{$vendorTable} as v", 'b.vendorId', '=', 'v.id')
                    ->whereNull('b.deletedAt')
                    ->orderByDesc('b.id')
                    ->limit(3)
                    ->get(['b.id', 'b.billNo', 'b.billDate', 'b.status', 'b.grandTotal', 'v.name as vendorName'])
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'Bill',
                        'ref' => $row->billNo,
                        'party' => $row->vendorName ?? 'Unknown Vendor',
                        'date' => $row->billDate,
                        'status' => $row->status ?? 'Unpaid',
                        'amount' => (float) ($row->grandTotal ?? 0),
                    ])
            )
            ->sortByDesc(fn($row) => $row['date'] ?? '')
            ->take(8)
            ->values();

        return $this->successResponse([
            'stats' => [
                'totalVendors' => Vendor::whereNull('deletedAt')->count(),
                'totalPOs' => PurchaseOrder::whereNull('deletedAt')->count(),
                'pendingGRNs' => PurchaseOrder::where('status', 'Open')->count(),
                'pendingBills' => GRN::where('status', 'Pending')->count(),
            ],
            'charts' => [
                [
                    'key' => 'purchase-status',
                    'title' => 'PO Status Mix',
                    'type' => 'pie',
                    'data' => $statusMix,
                ],
                [
                    'key' => 'purchase-monthly',
                    'title' => 'PO Trend by Month',
                    'type' => 'line',
                    'data' => $monthlyPo,
                ],
                [
                    'key' => 'purchase-vendor-spend',
                    'title' => 'Top Vendor Spend',
                    'type' => 'bar',
                    'data' => $vendorSpend,
                ],
            ],
            'recent' => $recent,
        ]);
    }

    public function listVendors(Request $request)
    {
        $query = Vendor::whereNull('deletedAt');
        if ($s = $request->get('search')) {
            $query->where('name', 'like', "%$s%");
        }
        return $this->paginatedResponse($query->orderByDesc('id')->paginate(25));
    }

    public function storeVendor(Request $request)
    {
        $v = Vendor::create($request->all() + ['createdBy' => $request->user()->id]);
        return $this->successResponse($v, 'Vendor created', 201);
    }

    public function getVendor($id)
    {
        $v = Vendor::findOrFail($id);
        return $this->successResponse($v);
    }

    public function updateVendor(Request $request, $id)
    {
        $vendor = Vendor::findOrFail($id);
        $vendorTable = $vendor->getTable();

        $payload = $this->filterExistingColumns($vendorTable, $request->only([
            'name',
            'contactPerson',
            'phone',
            'email',
            'address',
            'city',
            'state',
            'pincode',
            'gstin',
            'pan',
            'isActive',
        ]));

        if (Schema::hasColumn($vendorTable, 'updatedBy')) {
            $payload['updatedBy'] = $request->user()->id;
        } elseif (Schema::hasColumn($vendorTable, 'updated_by')) {
            $payload['updated_by'] = $request->user()->id;
        }

        if (!empty($payload)) {
            $vendor->update($payload);
        }

        return $this->successResponse($vendor, 'Vendor updated');
    }

    public function deleteVendor(Request $request, $id)
    {
        $vendor = Vendor::findOrFail($id);
        $vendorTable = $vendor->getTable();

        $payload = [];
        if (Schema::hasColumn($vendorTable, 'deletedAt')) {
            $payload['deletedAt'] = now();
        }
        if (Schema::hasColumn($vendorTable, 'isActive')) {
            $payload['isActive'] = false;
        }
        if (Schema::hasColumn($vendorTable, 'updatedBy')) {
            $payload['updatedBy'] = $request->user()->id;
        } elseif (Schema::hasColumn($vendorTable, 'updated_by')) {
            $payload['updated_by'] = $request->user()->id;
        }

        if (!empty($payload)) {
            $vendor->update($payload);
        } else {
            $vendor->delete();
        }

        return $this->successResponse(null, 'Vendor deleted');
    }

    public function getVendorProfile($id)
    {
        $vendor = Vendor::findOrFail($id);
        
        $purchaseOrders = PurchaseOrder::where('vendorId', $id)
            ->whereNull('deletedAt')
            ->orderByDesc('id')
            ->limit(5)
            ->get();
            
        $bills = PurchaseBill::where('vendorId', $id)
            ->whereNull('deletedAt')
            ->orderByDesc('id')
            ->limit(5)
            ->get();
            
        $payments = \App\Models\VoucherPaymentReceipt::where('partyName', $vendor->name)
            ->where('voucherType', 'Payment')
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        $totalPurchases = PurchaseBill::where('vendorId', $id)->sum('grandTotal');
        $outstanding = PurchaseBill::where('vendorId', $id)
            ->whereIn('status', ['Unpaid', 'Partial'])
            ->sum('grandTotal'); 
            
        $totalOrders = PurchaseOrder::where('vendorId', $id)->count();

        return $this->successResponse([
            'vendor' => $vendor,
            'metrics' => [
                'totalPurchases' => (float)$totalPurchases,
                'outstanding' => (float)$outstanding,
                'totalOrders' => $totalOrders,
            ],
            'purchaseOrders' => $purchaseOrders,
            'bills' => $bills,
            'payments' => $payments,
        ]);
    }

    public function listPurchaseOrders(Request $request)
    {
        $query = PurchaseOrder::with('vendor:id,name')->whereNull('deletedAt');
        return $this->paginatedResponse($query->orderByDesc('id')->paginate(25));
    }

    public function getPurchaseOrder($id)
    {
        $po = PurchaseOrder::findOrFail($id);
        $productTable = (new Product())->getTable();
        $items = DB::table((new PurchaseOrderItem())->getTable() . ' as poi')
            ->leftJoin("{$productTable} as p", 'poi.productId', '=', 'p.id')
            ->where('poi.purchaseOrderId', $po->id)
            ->get([
                'poi.id',
                'poi.productId',
                'poi.quantity',
                'poi.rate',
                'poi.gstPercent',
                'poi.total',
                'p.name as productName',
            ]);
        $vendor = Vendor::find($po->vendorId);

        return $this->successResponse(array_merge(
            $po->toArray(),
            [
                'items' => $items,
                'vendor' => $vendor ? ['id' => $vendor->id, 'name' => $vendor->name, 'address' => $vendor->address, 'city' => $vendor->city, 'state' => $vendor->state, 'phone' => $vendor->phone, 'gstin' => $vendor->gstin] : null,
            ]
        ));
    }

    public function createPurchaseOrder(Request $request)
    {
        $poNo = $this->generateDocNo('PO', 'PO');
        $po = PurchaseOrder::create([
            'poNo' => $poNo,
            'vendorId' => $request->vendorId,
            'totalAmount' => $request->totalAmount ?? 0,
            'status' => 'Open',
            'createdBy' => $request->user()->id,
        ]);

        if ($request->has('items')) {
            foreach ($request->items as $item) {
                $po->items()->create([
                    'productId' => $item['productId'],
                    'quantity' => $item['quantity'],
                    'rate' => $item['rate'],
                    'total' => $item['quantity'] * $item['rate'],
                ]);
            }
        }

        return $this->successResponse($po->load('items', 'vendor'), 'PO created', 201);
    }

    public function updatePurchaseOrder(Request $request, $id)
    {
        $po = PurchaseOrder::findOrFail($id);
        $poTable = $po->getTable();

        $payload = $this->filterExistingColumns($poTable, $request->only([
            'vendorId',
            'totalAmount',
            'status',
            'poDate',
            'remarks',
        ]));

        if (Schema::hasColumn($poTable, 'updatedBy')) {
            $payload['updatedBy'] = $request->user()->id;
        } elseif (Schema::hasColumn($poTable, 'updated_by')) {
            $payload['updated_by'] = $request->user()->id;
        }

        if (!empty($payload)) {
            $po->update($payload);
        }

        if ($request->has('items') && is_array($request->items)) {
            $po->items()->delete();
            $itemTable = (new PurchaseOrderItem())->getTable();

            foreach ($request->items as $item) {
                $itemPayload = $this->filterExistingColumns($itemTable, [
                    'productId' => $item['productId'] ?? null,
                    'quantity' => $item['quantity'] ?? 0,
                    'rate' => $item['rate'] ?? 0,
                    'gstPercent' => $item['gstPercent'] ?? null,
                    'total' => $item['total'] ?? (($item['quantity'] ?? 0) * ($item['rate'] ?? 0)),
                ]);

                $po->items()->create($itemPayload);
            }
        }

        return $this->successResponse($po->load('items', 'vendor'), 'PO updated');
    }

    public function createGrn(Request $request)
    {
        $grnNo = $this->generateDocNo('GRN', 'GRN');
        $grnTable = (new GRN())->getTable();

        $payload = $this->filterExistingColumns($grnTable, [
            'grnNo' => $grnNo,
            'vendorId' => $request->vendorId,
            'purchaseOrderId' => $request->purchaseOrderId,
            'grnDate' => $request->grnDate ?? now()->toDateString(),
            'status' => $request->status ?? 'Pending',
            'remarks' => $request->remarks,
        ]);

        if (Schema::hasColumn($grnTable, 'createdBy')) {
            $payload['createdBy'] = $request->user()->id;
        } elseif (Schema::hasColumn($grnTable, 'created_by')) {
            $payload['created_by'] = $request->user()->id;
        }

        $grn = GRN::create($payload);

        if ($request->has('items') && is_array($request->items)) {
            $itemTable = (new GRNItem())->getTable();
            foreach ($request->items as $item) {
                $itemPayload = $this->filterExistingColumns($itemTable, [
                    'grnId' => $grn->id,
                    'productId' => $item['productId'] ?? null,
                    'quantity' => $item['quantity'] ?? 0,
                    'acceptedQty' => $item['acceptedQty'] ?? ($item['quantity'] ?? 0),
                    'rejectedQty' => $item['rejectedQty'] ?? 0,
                ]);
                GRNItem::create($itemPayload);

                // Phase 2 Stock Sync: Auto-Add Stock on Receive
                $accepted = $item['acceptedQty'] ?? ($item['quantity'] ?? 0);
                if ($accepted > 0 && !empty($item['productId'])) {
                    Product::where('id', $item['productId'])->increment('currentStock', $accepted);
                }
            }
        }

        return $this->successResponse($grn->load('vendor'), 'GRN created', 201);
    }

    public function createBill(Request $request)
    {
        $billNo = $this->generateDocNo('BILL', 'BILL');
        $billTable = (new PurchaseBill())->getTable();

        $payload = $this->filterExistingColumns($billTable, [
            'billNo' => $billNo,
            'vendorId' => $request->vendorId,
            'purchaseOrderId' => $request->purchaseOrderId,
            'billDate' => $request->billDate ?? now()->toDateString(),
            'dueDate' => $request->dueDate,
            'taxableValue' => $request->taxableValue,
            'igstAmount' => $request->igstAmount,
            'cgstAmount' => $request->cgstAmount,
            'sgstAmount' => $request->sgstAmount,
            'grandTotal' => $request->grandTotal ?? $request->totalAmount ?? 0,
            'status' => $request->status ?? 'Unpaid',
            'remarks' => $request->remarks,
        ]);

        if (Schema::hasColumn($billTable, 'createdBy')) {
            $payload['createdBy'] = $request->user()->id;
        } elseif (Schema::hasColumn($billTable, 'created_by')) {
            $payload['created_by'] = $request->user()->id;
        }

        $bill = PurchaseBill::create($payload);
        return $this->successResponse($bill->load('vendor'), 'Bill created', 201);
    }

    public function listGrns(Request $request)
    {
        return $this->paginatedResponse(GRN::with('vendor:id,name')->orderByDesc('id')->paginate(25));
    }

    public function getGrn($id)
    {
        $grn = GRN::findOrFail($id);
        $productTable = (new Product())->getTable();
        $items = DB::table((new GRNItem())->getTable() . ' as gi')
            ->leftJoin("{$productTable} as p", 'gi.productId', '=', 'p.id')
            ->where('gi.grnId', $grn->id)
            ->get([
                'gi.id',
                'gi.productId',
                'gi.quantity',
                'gi.acceptedQty',
                'gi.rejectedQty',
                'p.name as productName',
            ]);
        $vendor = Vendor::find($grn->vendorId);

        return $this->successResponse(array_merge(
            $grn->toArray(),
            [
                'items' => $items,
                'vendor' => $vendor ? ['id' => $vendor->id, 'name' => $vendor->name, 'address' => $vendor->address, 'city' => $vendor->city, 'state' => $vendor->state, 'phone' => $vendor->phone, 'gstin' => $vendor->gstin] : null,
            ]
        ));
    }

    public function listBills(Request $request)
    {
        return $this->paginatedResponse(PurchaseBill::with('vendor:id,name')->orderByDesc('id')->paginate(25));
    }

    public function getBill($id)
    {
        $bill = PurchaseBill::findOrFail($id);
        $vendor = Vendor::find($bill->vendorId);
        $poItems = collect();

        if (!empty($bill->purchaseOrderId)) {
            $productTable = (new Product())->getTable();
            $poItems = DB::table((new PurchaseOrderItem())->getTable() . ' as poi')
                ->leftJoin("{$productTable} as p", 'poi.productId', '=', 'p.id')
                ->where('poi.purchaseOrderId', $bill->purchaseOrderId)
                ->get([
                    'poi.id',
                    'poi.productId',
                    'poi.quantity',
                    'poi.rate',
                    'poi.gstPercent',
                    'poi.total',
                    'p.name as productName',
                ]);
        }

        return $this->successResponse(array_merge(
            $bill->toArray(),
            [
                'items' => $poItems,
                'vendor' => $vendor ? ['id' => $vendor->id, 'name' => $vendor->name, 'address' => $vendor->address, 'city' => $vendor->city, 'state' => $vendor->state, 'phone' => $vendor->phone, 'gstin' => $vendor->gstin] : null,
            ]
        ));
    }

    public function updateGrn(Request $request, $id)
    {
        $grn = GRN::findOrFail($id);
        $grn->update($request->only(['status', 'remarks']));
        return $this->successResponse($grn, 'GRN updated');
    }

    public function deleteGrn($id)
    {
        $grn = GRN::findOrFail($id);
        
        // Reverse Stock Sync
        $items = GRNItem::where('grnId', $id)->get();
        foreach ($items as $item) {
            $accepted = $item->acceptedQty ?? $item->quantity ?? 0;
            if ($accepted > 0 && $item->productId) {
                Product::where('id', $item->productId)->decrement('currentStock', $accepted);
            }
        }
        
        $grn->update(['deletedAt' => now()]);
        return $this->successResponse(null, 'GRN deleted and stock reversed');
    }

    public function updateBill(Request $request, $id)
    {
        $bill = PurchaseBill::findOrFail($id);
        $bill->update($request->only(['dueDate', 'status', 'remarks']));
        return $this->successResponse($bill, 'Bill updated');
    }

    public function deleteBill($id)
    {
        PurchaseBill::where('id', $id)->update(['deletedAt' => now()]);
        return $this->successResponse(null, 'Bill deleted');
    }
}
