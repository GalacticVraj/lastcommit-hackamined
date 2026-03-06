<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContractorsController extends Controller
{
    private function ref(string $prefix): string
    {
        return $prefix . '-' . now()->format('ymdHis') . '-' . random_int(100, 999);
    }

    private function perPage(Request $request): int
    {
        return (int) $request->get('per_page', 25);
    }

    public function dashboard()
    {
        $stats = [
            'totalWorkers' => DB::table('ContractorWorker')->whereNull('deletedAt')->count(),
            'salaryHeads' => DB::table('ContractorSalaryHead')->whereNull('deletedAt')->count(),
            'salarySheets' => DB::table('ContractorSalarySheet')->whereNull('deletedAt')->count(),
            'totalPayable' => (float) DB::table('ContractorSalarySheet')->whereNull('deletedAt')->sum('totalPayable'),
            'totalAdvances' => (float) DB::table('ContractorAdvance')->whereNull('deletedAt')->sum('amount'),
        ];

        $monthlyPayable = DB::table('ContractorSalarySheet')
            ->whereNull('deletedAt')
            ->selectRaw("CAST(year as TEXT) as yearLabel, month, SUM(totalPayable) as value")
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get()
            ->map(fn($row) => [
                'name' => trim(($row->month ?? 'N/A') . '-' . ($row->yearLabel ?? '')),
                'value' => (float) ($row->value ?? 0),
            ]);

        $skillMix = DB::table('ContractorWorker')
            ->whereNull('deletedAt')
            ->selectRaw("COALESCE(skillLevel, 'Unknown') as name, COUNT(*) as value")
            ->groupBy('skillLevel')
            ->orderByDesc('value')
            ->get();

        $cashFlow = [
            [
                'name' => 'Advances',
                'value' => (float) DB::table('ContractorAdvance')->whereNull('deletedAt')->sum('amount'),
            ],
            [
                'name' => 'Payout',
                'value' => (float) DB::table('ContractorVoucherPayment')->whereNull('deletedAt')->sum('netAmountPaid'),
            ],
        ];

        $recent = collect()
            ->merge(
                DB::table('ContractorSalarySheet')
                    ->whereNull('deletedAt')
                    ->orderByDesc('id')
                    ->limit(4)
                    ->get()
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'Salary Sheet',
                        'ref' => trim(($row->month ?? '') . '/' . ($row->year ?? '')),
                        'date' => $row->createdAt,
                        'status' => $row->status ?? 'Processed',
                        'amount' => (float) ($row->totalPayable ?? 0),
                    ])
            )
            ->merge(
                DB::table('ContractorVoucherPayment')
                    ->whereNull('deletedAt')
                    ->orderByDesc('id')
                    ->limit(4)
                    ->get()
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'Voucher',
                        'ref' => $row->voucherNo ?? ('CVP-' . $row->id),
                        'date' => $row->paymentDate ?? $row->createdAt,
                        'status' => 'Paid',
                        'amount' => (float) ($row->netAmountPaid ?? 0),
                    ])
            )
            ->sortByDesc(fn($row) => $row['date'] ?? '')
            ->take(6)
            ->values();

        return $this->successResponse([
            'stats' => $stats,
            'charts' => [
                [
                    'key' => 'contractors-payable',
                    'title' => 'Monthly Payable Trend',
                    'type' => 'line',
                    'data' => $monthlyPayable,
                ],
                [
                    'key' => 'contractors-skill',
                    'title' => 'Worker Skill Mix',
                    'type' => 'pie',
                    'data' => $skillMix,
                ],
                [
                    'key' => 'contractors-cashflow',
                    'title' => 'Advance vs Voucher Payout',
                    'type' => 'bar',
                    'data' => $cashFlow,
                ],
            ],
            'recent' => $recent,
        ]);
    }

    public function listWorkers(Request $request)
    {
        $query = DB::table('ContractorWorker as w')
            ->leftJoin('Vendor as v', 'w.vendorId', '=', 'v.id')
            ->whereNull('w.deletedAt')
            ->select('w.*', 'v.name as contractorFirmName');
        return $this->paginatedResponse($query->orderByDesc('w.id')->paginate($this->perPage($request)));
    }

    public function createWorker(Request $request)
    {
        $id = DB::table('ContractorWorker')->insertGetId([
            'workerId' => $request->workerId ?: $this->ref('CW'),
            'vendorId' => $request->vendorId,
            'workerName' => $request->workerName,
            'skillLevel' => $request->skillLevel ?? 'Unskilled',
            'aadharNo' => $request->aadharNo,
            'isActive' => true,
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);
        return $this->getWorker($id);
    }

    public function getWorker($id)
    {
        $worker = DB::table('ContractorWorker as w')
            ->leftJoin('Vendor as v', 'w.vendorId', '=', 'v.id')
            ->where('w.id', $id)
            ->select('w.*', 'v.name as contractorFirmName')
            ->first();

        if (!$worker) {
            return $this->errorResponse('Worker not found', 404);
        }
        return $this->successResponse($worker);
    }

    public function updateWorker(Request $request, $id)
    {
        $worker = DB::table('ContractorWorker')->where('id', $id)->first();
        if (!$worker) {
            return $this->errorResponse('Worker not found', 404);
        }

        DB::table('ContractorWorker')->where('id', $id)->update([
            'workerId' => $request->workerId ?? $worker->workerId,
            'vendorId' => $request->vendorId ?? $worker->vendorId,
            'workerName' => $request->workerName ?? $worker->workerName,
            'skillLevel' => $request->skillLevel ?? $worker->skillLevel,
            'aadharNo' => $request->aadharNo ?? $worker->aadharNo,
            'updatedAt' => now(),
        ]);

        return $this->getWorker($id);
    }

    public function deleteWorker($id)
    {
        DB::table('ContractorWorker')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listSalaryHeads(Request $request)
    {
        $query = DB::table('ContractorSalaryHead')->whereNull('deletedAt');
        return $this->paginatedResponse($query->orderByDesc('id')->paginate($this->perPage($request)));
    }

    public function createSalaryHead(Request $request)
    {
        $id = DB::table('ContractorSalaryHead')->insertGetId([
            'role' => $request->role,
            'dailyRate' => $request->dailyRate ?? 0,
            'overtimeRate' => $request->overtimeRate ?? 0,
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);
        return $this->getSalaryHead($id);
    }

    public function getSalaryHead($id)
    {
        $record = DB::table('ContractorSalaryHead')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Salary head not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updateSalaryHead(Request $request, $id)
    {
        $record = DB::table('ContractorSalaryHead')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Salary head not found', 404);
        }

        DB::table('ContractorSalaryHead')->where('id', $id)->update([
            'role' => $request->role ?? $record->role,
            'dailyRate' => $request->dailyRate ?? $record->dailyRate,
            'overtimeRate' => $request->overtimeRate ?? $record->overtimeRate,
            'updatedAt' => now(),
        ]);

        return $this->getSalaryHead($id);
    }

    public function deleteSalaryHead($id)
    {
        DB::table('ContractorSalaryHead')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listSalaryStructures(Request $request)
    {
        $query = DB::table('ContractorSalaryStructure as s')
            ->leftJoin('ContractorWorker as w', 's.workerId', '=', 'w.id')
            ->whereNull('s.deletedAt')
            ->select('s.*', 'w.workerName');
        return $this->paginatedResponse($query->orderByDesc('s.id')->paginate($this->perPage($request)));
    }

    public function createSalaryStructure(Request $request)
    {
        $id = DB::table('ContractorSalaryStructure')->insertGetId([
            'workerId' => $request->workerId,
            'role' => $request->role,
            'applicableDailyRate' => $request->applicableDailyRate ?? 0,
            'overtimeRate' => $request->overtimeRate ?? 0,
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);
        return $this->getSalaryStructure($id);
    }

    public function getSalaryStructure($id)
    {
        $record = DB::table('ContractorSalaryStructure as s')
            ->leftJoin('ContractorWorker as w', 's.workerId', '=', 'w.id')
            ->where('s.id', $id)
            ->select('s.*', 'w.workerName')
            ->first();
        if (!$record) {
            return $this->errorResponse('Salary structure not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updateSalaryStructure(Request $request, $id)
    {
        $record = DB::table('ContractorSalaryStructure')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Salary structure not found', 404);
        }

        DB::table('ContractorSalaryStructure')->where('id', $id)->update([
            'workerId' => $request->workerId ?? $record->workerId,
            'role' => $request->role ?? $record->role,
            'applicableDailyRate' => $request->applicableDailyRate ?? $record->applicableDailyRate,
            'overtimeRate' => $request->overtimeRate ?? $record->overtimeRate,
            'updatedAt' => now(),
        ]);

        return $this->getSalaryStructure($id);
    }

    public function deleteSalaryStructure($id)
    {
        DB::table('ContractorSalaryStructure')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listSalarySheets(Request $request)
    {
        $query = DB::table('ContractorSalarySheet as s')
            ->leftJoin('ContractorWorker as w', 's.workerId', '=', 'w.id')
            ->leftJoin('Vendor as v', 's.vendorId', '=', 'v.id')
            ->whereNull('s.deletedAt')
            ->select('s.*', 'w.workerName', 'v.name as contractorName');
        return $this->paginatedResponse($query->orderByDesc('s.id')->paginate($this->perPage($request)));
    }

    public function createSalarySheet(Request $request)
    {
        $worker = DB::table('ContractorWorker')->where('id', $request->workerId)->first();
        $structure = DB::table('ContractorSalaryStructure')
            ->where('workerId', $request->workerId)
            ->whereNull('deletedAt')
            ->orderByDesc('id')
            ->first();

        $days = (float) ($request->daysWorked ?? 0);
        $otHours = (float) ($request->overtimeHours ?? 0);
        $dailyRate = (float) ($request->dailyRate ?? ($structure->applicableDailyRate ?? 0));
        $otRate = (float) ($request->overtimeRate ?? ($structure->overtimeRate ?? 0));
        $totalPayable = ($days * $dailyRate) + ($otHours * $otRate);

        $id = DB::table('ContractorSalarySheet')->insertGetId([
            'workerId' => $request->workerId,
            'vendorId' => $request->vendorId ?? ($worker->vendorId ?? null),
            'month' => $request->month,
            'year' => $request->year,
            'daysWorked' => $days,
            'overtimeHours' => $otHours,
            'dailyRate' => $dailyRate,
            'overtimeRate' => $otRate,
            'totalPayable' => $totalPayable,
            'status' => $request->status ?? 'Draft',
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);

        return $this->getSalarySheet($id);
    }

    public function getSalarySheet($id)
    {
        $record = DB::table('ContractorSalarySheet as s')
            ->leftJoin('ContractorWorker as w', 's.workerId', '=', 'w.id')
            ->leftJoin('Vendor as v', 's.vendorId', '=', 'v.id')
            ->where('s.id', $id)
            ->select('s.*', 'w.workerName', 'v.name as contractorName')
            ->first();

        if (!$record) {
            return $this->errorResponse('Salary sheet not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updateSalarySheet(Request $request, $id)
    {
        $record = DB::table('ContractorSalarySheet')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Salary sheet not found', 404);
        }

        $days = (float) ($request->daysWorked ?? $record->daysWorked);
        $otHours = (float) ($request->overtimeHours ?? $record->overtimeHours);
        $dailyRate = (float) ($request->dailyRate ?? $record->dailyRate);
        $otRate = (float) ($request->overtimeRate ?? $record->overtimeRate);

        DB::table('ContractorSalarySheet')->where('id', $id)->update([
            'workerId' => $request->workerId ?? $record->workerId,
            'vendorId' => $request->vendorId ?? $record->vendorId,
            'month' => $request->month ?? $record->month,
            'year' => $request->year ?? $record->year,
            'daysWorked' => $days,
            'overtimeHours' => $otHours,
            'dailyRate' => $dailyRate,
            'overtimeRate' => $otRate,
            'totalPayable' => ($days * $dailyRate) + ($otHours * $otRate),
            'status' => $request->status ?? $record->status,
            'updatedAt' => now(),
        ]);

        return $this->getSalarySheet($id);
    }

    public function deleteSalarySheet($id)
    {
        DB::table('ContractorSalarySheet')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listAdvances(Request $request)
    {
        $query = DB::table('ContractorAdvance as a')
            ->leftJoin('Vendor as v', 'a.vendorId', '=', 'v.id')
            ->whereNull('a.deletedAt')
            ->select('a.*', 'v.name as contractorName');
        return $this->paginatedResponse($query->orderByDesc('a.id')->paginate($this->perPage($request)));
    }

    public function createAdvance(Request $request)
    {
        $id = DB::table('ContractorAdvance')->insertGetId([
            'vendorId' => $request->vendorId,
            'date' => $request->date,
            'amount' => $request->amount ?? 0,
            'remarks' => $request->remarks,
            'status' => $request->status ?? 'Issued',
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);
        return $this->getAdvance($id);
    }

    public function getAdvance($id)
    {
        $record = DB::table('ContractorAdvance as a')
            ->leftJoin('Vendor as v', 'a.vendorId', '=', 'v.id')
            ->where('a.id', $id)
            ->select('a.*', 'v.name as contractorName')
            ->first();
        if (!$record) {
            return $this->errorResponse('Advance memo not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updateAdvance(Request $request, $id)
    {
        $record = DB::table('ContractorAdvance')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Advance memo not found', 404);
        }

        DB::table('ContractorAdvance')->where('id', $id)->update([
            'vendorId' => $request->vendorId ?? $record->vendorId,
            'date' => $request->date ?? $record->date,
            'amount' => $request->amount ?? $record->amount,
            'remarks' => $request->remarks ?? $record->remarks,
            'status' => $request->status ?? $record->status,
            'updatedAt' => now(),
        ]);

        return $this->getAdvance($id);
    }

    public function deleteAdvance($id)
    {
        DB::table('ContractorAdvance')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listVoucherPayments(Request $request)
    {
        $query = DB::table('ContractorVoucherPayment as p')
            ->leftJoin('Vendor as v', 'p.vendorId', '=', 'v.id')
            ->leftJoin('ContractorSalarySheet as s', 'p.salarySheetId', '=', 's.id')
            ->whereNull('p.deletedAt')
            ->select('p.*', 'v.name as contractorName', 's.month', 's.year', 's.totalPayable');
        return $this->paginatedResponse($query->orderByDesc('p.id')->paginate($this->perPage($request)));
    }

    public function createVoucherPayment(Request $request)
    {
        $id = DB::table('ContractorVoucherPayment')->insertGetId([
            'voucherNo' => $request->voucherNo ?: $this->ref('CVP'),
            'vendorId' => $request->vendorId,
            'salarySheetId' => $request->salarySheetId,
            'netAmountPaid' => $request->netAmountPaid ?? 0,
            'tdsDeducted' => $request->tdsDeducted ?? 0,
            'paymentDate' => $request->paymentDate,
            'remarks' => $request->remarks,
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);
        return $this->getVoucherPayment($id);
    }

    public function getVoucherPayment($id)
    {
        $record = DB::table('ContractorVoucherPayment as p')
            ->leftJoin('Vendor as v', 'p.vendorId', '=', 'v.id')
            ->leftJoin('ContractorSalarySheet as s', 'p.salarySheetId', '=', 's.id')
            ->where('p.id', $id)
            ->select('p.*', 'v.name as contractorName', 's.month', 's.year', 's.totalPayable')
            ->first();
        if (!$record) {
            return $this->errorResponse('Voucher payment not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updateVoucherPayment(Request $request, $id)
    {
        $record = DB::table('ContractorVoucherPayment')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Voucher payment not found', 404);
        }

        DB::table('ContractorVoucherPayment')->where('id', $id)->update([
            'voucherNo' => $request->voucherNo ?? $record->voucherNo,
            'vendorId' => $request->vendorId ?? $record->vendorId,
            'salarySheetId' => $request->salarySheetId ?? $record->salarySheetId,
            'netAmountPaid' => $request->netAmountPaid ?? $record->netAmountPaid,
            'tdsDeducted' => $request->tdsDeducted ?? $record->tdsDeducted,
            'paymentDate' => $request->paymentDate ?? $record->paymentDate,
            'remarks' => $request->remarks ?? $record->remarks,
            'updatedAt' => now(),
        ]);

        return $this->getVoucherPayment($id);
    }

    public function deleteVoucherPayment($id)
    {
        DB::table('ContractorVoucherPayment')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function getWorkersDropdown()
    {
        $workers = DB::table('ContractorWorker')
            ->whereNull('deletedAt')
            ->select('id', 'workerName')
            ->orderBy('workerName')
            ->get()
            ->map(fn($w) => ['id' => $w->id, 'label' => $w->workerName]);

        return $this->successResponse($workers);
    }

    public function getVendorsDropdown()
    {
        $vendors = DB::table('Vendor')
            ->whereNull('deletedAt')
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn($v) => ['id' => $v->id, 'label' => $v->name]);

        return $this->successResponse($vendors);
    }
}
