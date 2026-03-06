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

class PurchaseController extends Controller
{
    public function dashboard()
    {
        return $this->successResponse([
            'stats' => [
                'totalVendors' => Vendor::whereNull('deletedAt')->count(),
                'totalPOs' => PurchaseOrder::whereNull('deletedAt')->count(),
                'pendingGRNs' => PurchaseOrder::where('status', 'Open')->count(),
                'pendingBills' => GRN::where('status', 'Pending')->count(),
            ]
        ]);
    }

    public function listVendors(Request $request)
    {
        $query = Vendor::whereNull('deletedAt');
        if ($s = $request->get('search')) {
            $query->where('name', 'like', "%$s%");
        }
        return $this->paginatedResponse($query->latest()->paginate(25));
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
        return $this->paginatedResponse($query->latest()->paginate(25));
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
        return $this->paginatedResponse(GRN::with('vendor:id,name')->latest()->paginate(25));
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
        return $this->paginatedResponse(PurchaseBill::with('vendor:id,name')->latest()->paginate(25));
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
