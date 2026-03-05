<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class HrController extends Controller
{
    public function dashboard() { return $this->successResponse(['stats' => ['totalEmployees' => 0, 'activeEmployees' => 0]]); }
    public function listEmployees(Request $r) { return $this->successResponse([]); }
    public function createEmployee(Request $r) { return $this->successResponse(null, 'Employee created', 201); }
    public function getEmployee($id) { return $this->successResponse(null); }
    public function updateEmployee(Request $r, $id) { return $this->successResponse(null, 'Updated'); }
    public function deleteEmployee($id) { return $this->successResponse(null, 'Deleted'); }
    public function listSalarySheets(Request $r) { return $this->successResponse([]); }
}
