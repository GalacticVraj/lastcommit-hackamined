<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    public function dashboard() { return $this->successResponse(['stats' => ['totalTools' => 0, 'pendingMaintenance' => 0]]); }
    public function listTools(Request $r) { return $this->successResponse([]); }
    public function createTool(Request $r) { return $this->successResponse(null, 'Created', 201); }
    public function getTool($id) { return $this->successResponse(null); }
    public function updateTool(Request $r, $id) { return $this->successResponse(null, 'Updated'); }
    public function listMaintenanceCharts(Request $r) { return $this->successResponse([]); }
    public function listCalibration(Request $r) { return $this->successResponse([]); }
}
