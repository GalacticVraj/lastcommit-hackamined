<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function dashboard() { return $this->successResponse(['stats' => ['totalWarehouses' => 0, 'totalStock' => 0]]); }
    public function listWarehouses(Request $r) { return $this->successResponse([]); }
    public function createWarehouse(Request $r) { return $this->successResponse(null, 'Created', 201); }
    public function getWarehouse($id) { return $this->successResponse(null); }
    public function updateWarehouse(Request $r, $id) { return $this->successResponse(null, 'Updated'); }
    public function listStocks(Request $r) { return $this->successResponse([]); }
}
