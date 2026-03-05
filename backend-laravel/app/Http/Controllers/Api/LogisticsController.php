<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LogisticsController extends Controller
{
    public function dashboard() { return $this->successResponse(['stats' => ['totalTransporters' => 0]]); }
    public function listTransporters(Request $r) { return $this->successResponse([]); }
    public function createTransporter(Request $r) { return $this->successResponse(null, 'Created', 201); }
    public function getTransporter($id) { return $this->successResponse(null); }
    public function updateTransporter(Request $r, $id) { return $this->successResponse(null, 'Updated'); }
    public function listOrders(Request $r) { return $this->successResponse([]); }
    public function listFreightBills(Request $r) { return $this->successResponse([]); }
}
