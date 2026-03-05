<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class StatutoryController extends Controller
{
    public function dashboard() { return $this->successResponse(['stats' => ['totalGstEntries' => 0]]); }
    public function listGstMaster(Request $r) { return $this->successResponse([]); }
    public function createGstMaster(Request $r) { return $this->successResponse(null, 'Created', 201); }
    public function getGstMaster($id) { return $this->successResponse(null); }
    public function updateGstMaster(Request $r, $id) { return $this->successResponse(null, 'Updated'); }
    public function deleteGstMaster($id) { return $this->successResponse(null, 'Deleted'); }
    public function listGstr1(Request $r) { return $this->successResponse([]); }
    public function listTds(Request $r) { return $this->successResponse([]); }
    public function listChallans(Request $r) { return $this->successResponse([]); }
    public function listChequeBooks(Request $r) { return $this->successResponse([]); }
}
