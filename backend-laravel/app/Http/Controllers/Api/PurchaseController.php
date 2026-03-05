<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PurchaseController extends Controller
{
    public function dashboard() { return $this->successResponse(['stats' => ['totalVendors' => 0, 'totalPOs' => 0, 'pendingGRNs' => 0]]); }
    public function index(Request $r) { return $this->successResponse([]); }
    public function store(Request $r) { return $this->successResponse(null, 'Created', 201); }
    public function show($id) { return $this->successResponse(null); }
    public function update(Request $r, $id) { return $this->successResponse(null, 'Updated'); }
    public function destroy($id) { return $this->successResponse(null, 'Deleted'); }
    public function listPurchaseOrders(Request $r) { return $this->successResponse([]); }
    public function createPurchaseOrder(Request $r) { return $this->successResponse(null, 'PO created', 201); }
    public function getPurchaseOrder($id) { return $this->successResponse(null); }
    public function updatePurchaseOrder(Request $r, $id) { return $this->successResponse(null, 'Updated'); }
    public function listGrns(Request $r) { return $this->successResponse([]); }
    public function createGrn(Request $r) { return $this->successResponse(null, 'GRN created', 201); }
    public function listBills(Request $r) { return $this->successResponse([]); }
    public function createBill(Request $r) { return $this->successResponse(null, 'Bill created', 201); }
}
