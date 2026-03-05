<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class QualityController extends Controller
{
    public function dashboard() { return $this->successResponse(['stats' => ['totalIqc' => 0, 'totalPqc' => 0, 'totalPdi' => 0]]); }
    public function listIqc(Request $r) { return $this->successResponse([]); }
    public function listPqc(Request $r) { return $this->successResponse([]); }
    public function listPdi(Request $r) { return $this->successResponse([]); }
    public function listQrd(Request $r) { return $this->successResponse([]); }
}
