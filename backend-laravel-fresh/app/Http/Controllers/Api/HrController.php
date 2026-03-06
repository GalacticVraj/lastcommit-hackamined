<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeSalarySheet;
use Illuminate\Http\Request;

class HrController extends Controller
{
    public function dashboard()
    {
        return $this->successResponse([
            'stats' => [
                'totalEmployees' => Employee::whereNull('deletedAt')->count(),
                'activeEmployees' => Employee::where('isActive', true)->count(),
                'totalSalary' => EmployeeSalarySheet::sum('netPay'),
            ]
        ]);
    }

    public function listEmployees(Request $request)
    {
        $query = Employee::whereNull('deletedAt');
        return $this->paginatedResponse($query->latest()->paginate(25));
    }

    public function createEmployee(Request $request)
    {
        $emp = Employee::create($request->all() + ['createdBy' => $request->user()->id]);
        return $this->successResponse($emp, 'Employee created', 201);
    }

    public function getEmployee($id)
    {
        return $this->successResponse(Employee::findOrFail($id));
    }

    public function updateEmployee(Request $request, $id)
    {
        $emp = Employee::findOrFail($id);
        $emp->update($request->all() + ['updatedBy' => $request->user()->id]);
        return $this->successResponse($emp, 'Updated');
    }

    public function deleteEmployee($id)
    {
        Employee::where('id', $id)->update(['deletedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listSalarySheets(Request $request)
    {
        return $this->paginatedResponse(EmployeeSalarySheet::with('employee:id,name')->latest()->paginate(25));
    }
}
