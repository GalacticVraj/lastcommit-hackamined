<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ContractorsController extends Controller
{
    public function dashboard() { return $this->successResponse(['stats' => ['totalWorkers' => 0]]); }
    public function listWorkers(Request $r) { return $this->successResponse([]); }
    public function createWorker(Request $r) { return $this->successResponse(null, 'Created', 201); }
    public function getWorker($id) { return $this->successResponse(null); }
    public function updateWorker(Request $r, $id) { return $this->successResponse(null, 'Updated'); }
    public function listSalarySheets(Request $r) { return $this->successResponse([]); }
}
