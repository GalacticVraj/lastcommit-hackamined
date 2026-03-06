<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeSalarySheet;
use App\Models\SalaryHead;
use App\Models\EmployeeSalaryStructure;
use App\Models\EmployeeAdvance;
use Illuminate\Http\Request;

class HrController extends Controller
{
    // ─── HELPER METHODS ───────────────────────────────────────────────────────
    private function applySorting($query, Request $request, $defaultColumn = 'createdAt')
    {
        $sortBy = $request->get('sort_by', $defaultColumn);
        $sortOrder = $request->get('sort_order', 'desc');
        $sortOrder = in_array(strtolower($sortOrder), ['asc', 'desc']) ? strtolower($sortOrder) : 'desc';
        return $query->orderBy($sortBy, $sortOrder);
    }

    public function dashboard()
    {
        // Basic stats
        $totalEmployees = Employee::whereNull('deletedAt')->count();
        $activeEmployees = Employee::where('isActive', true)->whereNull('deletedAt')->count();
        $totalSalaryHeads = SalaryHead::whereNull('deletedAt')->count();
        $pendingAdvances = EmployeeAdvance::where('status', 'Pending')->whereNull('deletedAt')->count();
        $totalAdvanceAmount = EmployeeAdvance::whereNull('deletedAt')->sum('amount');
        $totalNetPay = EmployeeSalarySheet::whereNull('deletedAt')->sum('netPay');
        
        // Department-wise headcount
        $departmentHeadcount = Employee::whereNull('deletedAt')
            ->selectRaw('department, COUNT(*) as count')
            ->groupBy('department')
            ->get()
            ->map(fn($r) => ['name' => $r->department ?? 'Unassigned', 'count' => $r->count]);
        
        // Designation-wise headcount
        $designationHeadcount = Employee::whereNull('deletedAt')
            ->selectRaw('designation, COUNT(*) as count')
            ->groupBy('designation')
            ->get()
            ->map(fn($r) => ['name' => $r->designation ?? 'Unassigned', 'count' => $r->count]);
        
        // Monthly Net Pay trend (last 6 months)
        $monthlyNetPay = EmployeeSalarySheet::whereNull('deletedAt')
            ->selectRaw('month, year, SUM(netPay) as totalNetPay, SUM(grossSalary) as totalGross')
            ->groupBy('month', 'year')
            ->orderBy('year', 'asc')
            ->orderByRaw("CASE month 
                WHEN 'January' THEN 1 WHEN 'February' THEN 2 WHEN 'March' THEN 3
                WHEN 'April' THEN 4 WHEN 'May' THEN 5 WHEN 'June' THEN 6
                WHEN 'July' THEN 7 WHEN 'August' THEN 8 WHEN 'September' THEN 9
                WHEN 'October' THEN 10 WHEN 'November' THEN 11 WHEN 'December' THEN 12
            END")
            ->get()
            ->map(fn($r) => [
                'month' => substr($r->month, 0, 3) . ' ' . $r->year,
                'netPay' => (float)$r->totalNetPay,
                'grossPay' => (float)$r->totalGross
            ]);
        
        // Earning vs Deduction split
        $totalGross = EmployeeSalarySheet::whereNull('deletedAt')->sum('grossSalary');
        $totalDeductions = EmployeeSalarySheet::whereNull('deletedAt')
            ->selectRaw('SUM(pfDeduction + esicDeduction + tdsDeduction + otherDeductions) as total')
            ->value('total') ?? 0;
        
        $earningDeductionSplit = [
            ['name' => 'Earnings', 'value' => (float)$totalGross],
            ['name' => 'Deductions', 'value' => (float)$totalDeductions]
        ];
        
        // Advance recovery status
        $advanceStatus = EmployeeAdvance::whereNull('deletedAt')
            ->selectRaw('status, COUNT(*) as count, SUM(amount) as totalAmount')
            ->groupBy('status')
            ->get()
            ->map(fn($r) => ['name' => $r->status, 'count' => $r->count, 'amount' => (float)$r->totalAmount]);
        
        // Recovery amounts
        $totalRecovered = EmployeeAdvance::whereNull('deletedAt')->sum('recoveredAmount');
        $totalBalance = EmployeeAdvance::whereNull('deletedAt')->sum('balanceAmount');
        $advanceRecovery = [
            ['name' => 'Recovered', 'value' => (float)$totalRecovered],
            ['name' => 'Pending', 'value' => (float)$totalBalance]
        ];
        
        // Salary Structure coverage
        $employeesWithStructure = EmployeeSalaryStructure::whereNull('deletedAt')
            ->distinct('employeeId')
            ->count('employeeId');
        $employeesWithoutStructure = $totalEmployees - $employeesWithStructure;
        
        $structureCoverage = [
            ['name' => 'With Structure', 'value' => $employeesWithStructure],
            ['name' => 'Without Structure', 'value' => max(0, $employeesWithoutStructure)]
        ];
        
        // Salary heads by type
        $salaryHeadsByType = SalaryHead::whereNull('deletedAt')
            ->selectRaw('headType, COUNT(*) as count')
            ->groupBy('headType')
            ->get()
            ->map(fn($r) => ['name' => $r->headType, 'count' => $r->count]);

        return $this->successResponse([
            'stats' => [
                'totalEmployees' => $totalEmployees,
                'activeEmployees' => $activeEmployees,
                'totalSalaryHeads' => $totalSalaryHeads,
                'pendingAdvances' => $pendingAdvances,
                'totalAdvanceAmount' => (float)$totalAdvanceAmount,
                'totalNetPay' => (float)$totalNetPay,
            ],
            'charts' => [
                'departmentHeadcount' => $departmentHeadcount,
                'designationHeadcount' => $designationHeadcount,
                'monthlyNetPay' => $monthlyNetPay,
                'earningDeductionSplit' => $earningDeductionSplit,
                'advanceStatus' => $advanceStatus,
                'advanceRecovery' => $advanceRecovery,
                'structureCoverage' => $structureCoverage,
                'salaryHeadsByType' => $salaryHeadsByType,
            ]
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EMPLOYEE MASTER (5.1)
    // ═══════════════════════════════════════════════════════════════════════════

    public function listEmployees(Request $request)
    {
        $query = Employee::whereNull('deletedAt');
        $query = $this->applySorting($query, $request, 'createdAt');
        return $this->paginatedResponse($query->paginate($request->get('per_page', 25)));
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

    // ═══════════════════════════════════════════════════════════════════════════
    // SALARY HEAD MASTER (5.2)
    // ═══════════════════════════════════════════════════════════════════════════

    public function listSalaryHeads(Request $request)
    {
        $query = SalaryHead::whereNull('deletedAt');
        $query = $this->applySorting($query, $request, 'createdAt');
        return $this->paginatedResponse($query->paginate($request->get('per_page', 25)));
    }

    public function createSalaryHead(Request $request)
    {
        $head = SalaryHead::create($request->all() + ['createdBy' => $request->user()->id]);
        return $this->successResponse($head, 'Salary Head created', 201);
    }

    public function getSalaryHead($id)
    {
        return $this->successResponse(SalaryHead::findOrFail($id));
    }

    public function updateSalaryHead(Request $request, $id)
    {
        $head = SalaryHead::findOrFail($id);
        $head->update($request->all());
        return $this->successResponse($head, 'Updated');
    }

    public function deleteSalaryHead($id)
    {
        SalaryHead::where('id', $id)->update(['deletedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EMPLOYEE SALARY STRUCTURE (5.3)
    // ═══════════════════════════════════════════════════════════════════════════

    public function listSalaryStructures(Request $request)
    {
        $query = EmployeeSalaryStructure::with('employee:id,name,empCode')->whereNull('deletedAt');
        $query = $this->applySorting($query, $request, 'effectiveDate');
        return $this->paginatedResponse($query->paginate($request->get('per_page', 25)));
    }

    public function createSalaryStructure(Request $request)
    {
        $structure = EmployeeSalaryStructure::create($request->all() + ['createdBy' => $request->user()->id]);
        return $this->successResponse($structure->load('employee:id,name,empCode'), 'Salary Structure created', 201);
    }

    public function getSalaryStructure($id)
    {
        return $this->successResponse(EmployeeSalaryStructure::with('employee:id,name,empCode')->findOrFail($id));
    }

    public function updateSalaryStructure(Request $request, $id)
    {
        $structure = EmployeeSalaryStructure::findOrFail($id);
        $structure->update($request->all());
        return $this->successResponse($structure->load('employee:id,name,empCode'), 'Updated');
    }

    public function deleteSalaryStructure($id)
    {
        EmployeeSalaryStructure::where('id', $id)->update(['deletedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EMPLOYEE SALARY SHEET (5.4)
    // ═══════════════════════════════════════════════════════════════════════════

    public function listSalarySheets(Request $request)
    {
        $query = EmployeeSalarySheet::with('employee:id,name,empCode')->whereNull('deletedAt');
        $query = $this->applySorting($query, $request, 'createdAt');
        return $this->paginatedResponse($query->paginate($request->get('per_page', 25)));
    }

    public function createSalarySheet(Request $request)
    {
        $sheet = EmployeeSalarySheet::create($request->all() + ['createdBy' => $request->user()->id]);
        return $this->successResponse($sheet->load('employee:id,name,empCode'), 'Salary Sheet created', 201);
    }

    public function getSalarySheet($id)
    {
        return $this->successResponse(EmployeeSalarySheet::with('employee:id,name,empCode')->findOrFail($id));
    }

    public function updateSalarySheet(Request $request, $id)
    {
        $sheet = EmployeeSalarySheet::findOrFail($id);
        $sheet->update($request->all());
        return $this->successResponse($sheet->load('employee:id,name,empCode'), 'Updated');
    }

    public function deleteSalarySheet($id)
    {
        EmployeeSalarySheet::where('id', $id)->update(['deletedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EMPLOYEE ADVANCE MEMO (5.5)
    // ═══════════════════════════════════════════════════════════════════════════

    public function listAdvances(Request $request)
    {
        $query = EmployeeAdvance::with('employee:id,name,empCode')->whereNull('deletedAt');
        $query = $this->applySorting($query, $request, 'advanceDate');
        return $this->paginatedResponse($query->paginate($request->get('per_page', 25)));
    }

    public function createAdvance(Request $request)
    {
        $data = $request->all() + ['createdBy' => $request->user()->id];
        
        // Calculate balance amount
        $data['balanceAmount'] = $data['amount'] - ($data['recoveredAmount'] ?? 0);
        
        // Calculate monthly deduction if recovery months provided
        if (!empty($data['recoveryMonths']) && $data['recoveryMonths'] > 0) {
            $data['monthlyDeduction'] = $data['amount'] / $data['recoveryMonths'];
        }
        
        $advance = EmployeeAdvance::create($data);
        return $this->successResponse($advance->load('employee:id,name,empCode'), 'Advance created', 201);
    }

    public function getAdvance($id)
    {
        return $this->successResponse(EmployeeAdvance::with('employee:id,name,empCode')->findOrFail($id));
    }

    public function updateAdvance(Request $request, $id)
    {
        $advance = EmployeeAdvance::findOrFail($id);
        $data = $request->all();
        
        // Recalculate balance
        if (isset($data['recoveredAmount'])) {
            $data['balanceAmount'] = $advance->amount - $data['recoveredAmount'];
            if ($data['balanceAmount'] <= 0) {
                $data['status'] = 'Fully Recovered';
            } elseif ($data['recoveredAmount'] > 0) {
                $data['status'] = 'Partially Recovered';
            }
        }
        
        $advance->update($data);
        return $this->successResponse($advance->load('employee:id,name,empCode'), 'Updated');
    }

    public function deleteAdvance($id)
    {
        EmployeeAdvance::where('id', $id)->update(['deletedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function approveAdvance(Request $request, $id)
    {
        $advance = EmployeeAdvance::findOrFail($id);
        $advance->update([
            'status' => 'Approved',
            'approvedBy' => $request->user()->id
        ]);
        return $this->successResponse($advance->load('employee:id,name,empCode'), 'Advance approved');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DROPDOWN & LOOKUP ENDPOINTS (Referential Integrity)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get all active employees for dropdown (referential integrity)
     */
    public function getEmployeesDropdown()
    {
        $employees = Employee::where('isActive', true)
            ->whereNull('deletedAt')
            ->select('id', 'empCode', 'name', 'designation', 'department', 'basicSalary')
            ->orderBy('name')
            ->get()
            ->map(fn($e) => [
                'id' => $e->id,
                'label' => "{$e->empCode} - {$e->name}",
                'empCode' => $e->empCode,
                'name' => $e->name,
                'designation' => $e->designation,
                'department' => $e->department,
                'basicSalary' => $e->basicSalary,
            ]);
        
        return $this->successResponse($employees);
    }

    /**
     * Get salary heads for dropdown
     */
    public function getSalaryHeadsDropdown()
    {
        $heads = SalaryHead::where('isActive', true)
            ->whereNull('deletedAt')
            ->select('id', 'headCode', 'headName', 'headType')
            ->orderBy('headType')
            ->orderBy('headName')
            ->get();
        
        return $this->successResponse($heads);
    }

    /**
     * Get active salary structure for an employee (for auto-calculation)
     */
    public function getEmployeeSalaryStructure($employeeId)
    {
        $structure = EmployeeSalaryStructure::where('employeeId', $employeeId)
            ->where('isActive', true)
            ->whereNull('deletedAt')
            ->orderBy('effectiveDate', 'desc')
            ->first();
        
        if (!$structure) {
            return $this->successResponse(null, 'No active salary structure found');
        }
        
        // Calculate gross and deductions
        $gross = $structure->basic + $structure->hra + $structure->da + $structure->otherAllowances;
        $pf = $structure->basic * ($structure->pfPercent / 100);
        $esic = $gross * ($structure->esicPercent / 100);
        $deductions = $pf + $esic;
        $netPay = $gross - $deductions;
        
        return $this->successResponse([
            'structure' => $structure,
            'calculated' => [
                'grossSalary' => round($gross, 2),
                'pfDeduction' => round($pf, 2),
                'esicDeduction' => round($esic, 2),
                'totalDeductions' => round($deductions, 2),
                'netPay' => round($netPay, 2),
            ]
        ]);
    }

    /**
     * Get employees with their structures for Salary Sheet creation
     */
    public function getEmployeesWithStructures()
    {
        $employees = Employee::where('isActive', true)
            ->whereNull('deletedAt')
            ->with(['salaryStructures' => function($q) {
                $q->where('isActive', true)
                  ->whereNull('deletedAt')
                  ->orderBy('effectiveDate', 'desc')
                  ->limit(1);
            }])
            ->get()
            ->map(function($emp) {
                $structure = $emp->salaryStructures->first();
                $hasStructure = $structure !== null;
                
                $calculated = null;
                if ($hasStructure) {
                    $gross = $structure->basic + $structure->hra + $structure->da + $structure->otherAllowances;
                    $pf = $structure->basic * ($structure->pfPercent / 100);
                    $esic = $gross * ($structure->esicPercent / 100);
                    $calculated = [
                        'grossSalary' => round($gross, 2),
                        'pfDeduction' => round($pf, 2),
                        'esicDeduction' => round($esic, 2),
                        'netPay' => round($gross - $pf - $esic, 2),
                    ];
                }
                
                return [
                    'id' => $emp->id,
                    'label' => "{$emp->empCode} - {$emp->name}" . ($hasStructure ? '' : ' (No Structure)'),
                    'empCode' => $emp->empCode,
                    'name' => $emp->name,
                    'department' => $emp->department,
                    'hasStructure' => $hasStructure,
                    'structure' => $structure,
                    'calculated' => $calculated,
                ];
            });
        
        return $this->successResponse($employees);
    }
}
