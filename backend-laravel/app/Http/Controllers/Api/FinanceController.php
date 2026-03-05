<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    public function dashboard() { return $this->successResponse(['stats' => ['totalVouchers' => 0, 'totalAmount' => 0]]); }
    public function listVouchers(Request $r) { return $this->successResponse([]); }
    public function createVoucher(Request $r) { return $this->successResponse(null, 'Voucher created', 201); }
    public function getVoucher($id) { return $this->successResponse(null); }
    public function updateVoucher(Request $r, $id) { return $this->successResponse(null, 'Updated'); }
    public function deleteVoucher($id) { return $this->successResponse(null, 'Deleted'); }
    public function listBankReconciliation(Request $r) { return $this->successResponse([]); }
    public function listCreditCard(Request $r) { return $this->successResponse([]); }
}
