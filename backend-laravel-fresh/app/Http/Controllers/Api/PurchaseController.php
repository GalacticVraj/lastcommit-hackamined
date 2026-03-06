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
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
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

    public function listPurchaseOrders(Request $request)
    {
        $query = PurchaseOrder::with('vendor:id,name')->whereNull('deletedAt');
        return $this->paginatedResponse($query->orderByDesc('id')->paginate(25));
    }

    public function getPurchaseOrder($id)
    {
        $po = PurchaseOrder::findOrFail($id);
        $items = PurchaseOrderItem::where('purchaseOrderId', $po->id)->get();
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
        $poNo = \App\Services\AutoNumber::generate('PO', 'PO');
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

    public function listGrns(Request $request)
    {
        return $this->paginatedResponse(GRN::with('vendor:id,name')->orderByDesc('id')->paginate(25));
    }

    public function getGrn($id)
    {
        $grn = GRN::findOrFail($id);
        $items = GRNItem::where('grnId', $grn->id)->get();
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
            $poItems = PurchaseOrderItem::where('purchaseOrderId', $bill->purchaseOrderId)->get();
        }

        return $this->successResponse(array_merge(
            $bill->toArray(),
            [
                'items' => $poItems,
                'vendor' => $vendor ? ['id' => $vendor->id, 'name' => $vendor->name, 'address' => $vendor->address, 'city' => $vendor->city, 'state' => $vendor->state, 'phone' => $vendor->phone, 'gstin' => $vendor->gstin] : null,
            ]
        ));
    }
}
