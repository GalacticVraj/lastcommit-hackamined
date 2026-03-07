<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MaintenanceController extends Controller
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
        $maintenanceRows = DB::table('ToolMaintenanceChart')->whereNull('deletedAt')->get(['id', 'status', 'scheduledDate', 'toolId']);
        $calibrationRows = DB::table('ToolCalibrationReport')->whereNull('deletedAt')->get(['id', 'result', 'calibrationDate']);
        $rectificationRows = DB::table('ToolRectificationMemo')->whereNull('deletedAt')->get(['id', 'status', 'cost', 'createdAt', 'toolId', 'jobId']);

        $stats = [
            'totalTools' => DB::table('ToolMaster')->whereNull('deletedAt')->count(),
            'scheduledMaintenance' => $maintenanceRows->count(),
            'completedMaintenance' => $maintenanceRows->where('status', 'Completed')->count(),
            'calibrationReports' => $calibrationRows->count(),
            'failedCalibrations' => $calibrationRows->where('result', 'Fail')->count(),
            'rectificationMemos' => $rectificationRows->count(),
            'openRectifications' => $rectificationRows->where('status', 'Open')->count(),
            'avgRectificationCost' => round($rectificationRows->avg('cost') ?? 0, 2),
        ];

        $locationMix = DB::table('ToolMaster')
            ->whereNull('deletedAt')
            ->selectRaw("COALESCE(location, 'Unassigned') as name, COUNT(*) as value")
            ->groupBy('location')
            ->orderByDesc('value')
            ->get();

        $maintenanceStatus = DB::table('ToolMaintenanceChart')
            ->whereNull('deletedAt')
            ->selectRaw("COALESCE(status, 'Scheduled') as name, COUNT(*) as value")
            ->groupBy('status')
            ->orderByDesc('value')
            ->get();

        $calibrationResult = DB::table('ToolCalibrationReport')
            ->whereNull('deletedAt')
            ->selectRaw("COALESCE(result, 'Pending') as name, COUNT(*) as value")
            ->groupBy('result')
            ->orderByDesc('value')
            ->get();

        $monthlyRepairCost = $rectificationRows
            ->groupBy(function ($row) {
                if (empty($row->createdAt)) {
                    return now()->format('M Y');
                }
                return \Carbon\Carbon::parse($row->createdAt)->format('M Y');
            })
            ->map(fn($rows, $month) => ['name' => $month, 'value' => round($rows->sum('cost'), 2)])
            ->values();

        $maintenanceByTool = DB::table('ToolMaintenanceChart as m')
            ->leftJoin('ToolMaster as t', 'm.toolId', '=', 't.id')
            ->whereNull('m.deletedAt')
            ->selectRaw("COALESCE(t.toolName, 'Unknown Tool') as name, COUNT(*) as value")
            ->groupBy('t.toolName')
            ->orderByDesc('value')
            ->limit(5)
            ->get();

        $upcoming = DB::table('ToolMaintenanceChart as m')
            ->leftJoin('ToolMaster as t', 'm.toolId', '=', 't.id')
            ->whereNull('m.deletedAt')
            ->whereDate('m.scheduledDate', '>=', now()->toDateString())
            ->where('m.status', '!=', 'Completed')
            ->orderBy('m.scheduledDate')
            ->limit(6)
            ->get([
                'm.id',
                'm.scheduledDate',
                'm.status',
                't.toolName',
                't.assetCode',
            ]);

        $topRepairs = DB::table('ToolRectificationMemo as r')
            ->leftJoin('ToolMaster as t', 'r.toolId', '=', 't.id')
            ->whereNull('r.deletedAt')
            ->orderByDesc('r.cost')
            ->limit(6)
            ->get([
                'r.id',
                'r.jobId',
                'r.cost',
                'r.status',
                'r.createdAt',
                't.toolName',
                't.assetCode',
            ]);

        $recent = collect()
            ->merge(
                DB::table('ToolRectificationMemo')
                    ->whereNull('deletedAt')
                    ->orderByDesc('id')
                    ->limit(4)
                    ->get()
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'Rectification',
                        'ref' => $row->jobId ?? ('JOB-' . $row->id),
                        'date' => $row->createdAt,
                        'status' => $row->status ?? 'Open',
                        'amount' => (float) ($row->cost ?? 0),
                    ])
            )
            ->merge(
                DB::table('ToolCalibrationReport')
                    ->whereNull('deletedAt')
                    ->orderByDesc('id')
                    ->limit(4)
                    ->get()
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'Calibration',
                        'ref' => 'CAL-' . $row->id,
                        'date' => $row->calibrationDate ?? $row->createdAt,
                        'status' => $row->result ?? 'Pending',
                        'amount' => 0,
                    ])
            )
            ->sortByDesc(fn($row) => $row['date'] ?? '')
            ->take(6)
            ->values();

        return $this->successResponse([
            'stats' => $stats,
            'charts' => [
                [
                    'key' => 'maintenance-location',
                    'title' => 'Tools by Location',
                    'type' => 'bar',
                    'data' => $locationMix,
                ],
                [
                    'key' => 'maintenance-status',
                    'title' => 'Scheduled vs Completed',
                    'type' => 'pie',
                    'data' => $maintenanceStatus,
                ],
                [
                    'key' => 'maintenance-calibration',
                    'title' => 'Calibration Result Mix',
                    'type' => 'bar',
                    'data' => $calibrationResult,
                ],
                [
                    'key' => 'maintenance-monthly-cost',
                    'title' => 'Monthly Rectification Cost',
                    'type' => 'line',
                    'data' => $monthlyRepairCost,
                ],
                [
                    'key' => 'maintenance-top-tools',
                    'title' => 'Top Tools by Maintenance Load',
                    'type' => 'bar-horizontal',
                    'data' => $maintenanceByTool,
                ],
            ],
            'highlights' => [
                'upcomingMaintenance' => $upcoming,
                'topRepairs' => $topRepairs,
            ],
            'recent' => $recent,
        ]);
    }

    public function listTools(Request $request)
    {
        $query = DB::table('ToolMaster')->whereNull('deletedAt');
        return $this->paginatedResponse($query->orderByDesc('id')->paginate($this->perPage($request)));
    }

    public function createTool(Request $request)
    {
        $id = DB::table('ToolMaster')->insertGetId([
            'assetCode' => $request->assetCode ?: $this->ref('TOOL'),
            'toolName' => $request->toolName,
            'location' => $request->location,
            'maintenanceIntervalDays' => $request->maintenanceIntervalDays ?? 30,
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);
        return $this->getTool($id);
    }

    public function getTool($id)
    {
        $tool = DB::table('ToolMaster')->where('id', $id)->first();
        if (!$tool) {
            return $this->errorResponse('Tool not found', 404);
        }
        return $this->successResponse($tool);
    }

    public function updateTool(Request $request, $id)
    {
        $tool = DB::table('ToolMaster')->where('id', $id)->first();
        if (!$tool) {
            return $this->errorResponse('Tool not found', 404);
        }

        DB::table('ToolMaster')->where('id', $id)->update([
            'assetCode' => $request->assetCode ?? $tool->assetCode,
            'toolName' => $request->toolName ?? $tool->toolName,
            'location' => $request->location ?? $tool->location,
            'maintenanceIntervalDays' => $request->maintenanceIntervalDays ?? $tool->maintenanceIntervalDays,
            'updatedAt' => now(),
        ]);

        return $this->getTool($id);
    }

    public function deleteTool($id)
    {
        DB::table('ToolMaster')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listMaintenanceCharts(Request $request)
    {
        $query = DB::table('ToolMaintenanceChart as m')
            ->leftJoin('ToolMaster as t', 'm.toolId', '=', 't.id')
            ->whereNull('m.deletedAt')
            ->select('m.*', 't.toolName', 't.assetCode');
        return $this->paginatedResponse($query->orderByDesc('m.id')->paginate($this->perPage($request)));
    }

    public function createMaintenanceChart(Request $request)
    {
        $id = DB::table('ToolMaintenanceChart')->insertGetId([
            'toolId' => $request->toolId,
            'scheduledDate' => $request->scheduledDate,
            'taskList' => $request->taskList,
            'status' => $request->status ?? 'Scheduled',
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);
        return $this->getMaintenanceChart($id);
    }

    public function getMaintenanceChart($id)
    {
        $record = DB::table('ToolMaintenanceChart as m')
            ->leftJoin('ToolMaster as t', 'm.toolId', '=', 't.id')
            ->where('m.id', $id)
            ->select('m.*', 't.toolName', 't.assetCode')
            ->first();
        if (!$record) {
            return $this->errorResponse('Maintenance chart not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updateMaintenanceChart(Request $request, $id)
    {
        $record = DB::table('ToolMaintenanceChart')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Maintenance chart not found', 404);
        }

        DB::table('ToolMaintenanceChart')->where('id', $id)->update([
            'toolId' => $request->toolId ?? $record->toolId,
            'scheduledDate' => $request->scheduledDate ?? $record->scheduledDate,
            'taskList' => $request->taskList ?? $record->taskList,
            'status' => $request->status ?? $record->status,
            'updatedAt' => now(),
        ]);

        return $this->getMaintenanceChart($id);
    }

    public function deleteMaintenanceChart($id)
    {
        DB::table('ToolMaintenanceChart')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listCalibration(Request $request)
    {
        $query = DB::table('ToolCalibrationReport as c')
            ->leftJoin('ToolMaster as t', 'c.toolId', '=', 't.id')
            ->whereNull('c.deletedAt')
            ->select('c.*', 't.toolName', 't.assetCode');
        return $this->paginatedResponse($query->orderByDesc('c.id')->paginate($this->perPage($request)));
    }

    public function createCalibration(Request $request)
    {
        $id = DB::table('ToolCalibrationReport')->insertGetId([
            'toolId' => $request->toolId,
            'calibrationDate' => $request->calibrationDate,
            'standardValue' => $request->standardValue ?? 0,
            'actualValue' => $request->actualValue ?? 0,
            'result' => $request->result ?? 'Pass',
            'remarks' => $request->remarks,
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);
        return $this->getCalibration($id);
    }

    public function getCalibration($id)
    {
        $record = DB::table('ToolCalibrationReport as c')
            ->leftJoin('ToolMaster as t', 'c.toolId', '=', 't.id')
            ->where('c.id', $id)
            ->select('c.*', 't.toolName', 't.assetCode')
            ->first();
        if (!$record) {
            return $this->errorResponse('Calibration report not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updateCalibration(Request $request, $id)
    {
        $record = DB::table('ToolCalibrationReport')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Calibration report not found', 404);
        }

        DB::table('ToolCalibrationReport')->where('id', $id)->update([
            'toolId' => $request->toolId ?? $record->toolId,
            'calibrationDate' => $request->calibrationDate ?? $record->calibrationDate,
            'standardValue' => $request->standardValue ?? $record->standardValue,
            'actualValue' => $request->actualValue ?? $record->actualValue,
            'result' => $request->result ?? $record->result,
            'remarks' => $request->remarks ?? $record->remarks,
            'updatedAt' => now(),
        ]);

        return $this->getCalibration($id);
    }

    public function deleteCalibration($id)
    {
        DB::table('ToolCalibrationReport')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listRectification(Request $request)
    {
        $query = DB::table('ToolRectificationMemo as r')
            ->leftJoin('ToolMaster as t', 'r.toolId', '=', 't.id')
            ->whereNull('r.deletedAt')
            ->select('r.*', 't.toolName', 't.assetCode');
        return $this->paginatedResponse($query->orderByDesc('r.id')->paginate($this->perPage($request)));
    }

    public function createRectification(Request $request)
    {
        $id = DB::table('ToolRectificationMemo')->insertGetId([
            'jobId' => $request->jobId ?: $this->ref('JOB'),
            'toolId' => $request->toolId,
            'issue' => $request->issue,
            'sparesUsed' => $request->sparesUsed,
            'cost' => $request->cost ?? 0,
            'technician' => $request->technician,
            'status' => $request->status ?? 'Open',
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);
        return $this->getRectification($id);
    }

    public function getRectification($id)
    {
        $record = DB::table('ToolRectificationMemo as r')
            ->leftJoin('ToolMaster as t', 'r.toolId', '=', 't.id')
            ->where('r.id', $id)
            ->select('r.*', 't.toolName', 't.assetCode')
            ->first();
        if (!$record) {
            return $this->errorResponse('Rectification memo not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updateRectification(Request $request, $id)
    {
        $record = DB::table('ToolRectificationMemo')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Rectification memo not found', 404);
        }

        DB::table('ToolRectificationMemo')->where('id', $id)->update([
            'jobId' => $request->jobId ?? $record->jobId,
            'toolId' => $request->toolId ?? $record->toolId,
            'issue' => $request->issue ?? $record->issue,
            'sparesUsed' => $request->sparesUsed ?? $record->sparesUsed,
            'cost' => $request->cost ?? $record->cost,
            'technician' => $request->technician ?? $record->technician,
            'status' => $request->status ?? $record->status,
            'updatedAt' => now(),
        ]);

        return $this->getRectification($id);
    }

    public function deleteRectification($id)
    {
        DB::table('ToolRectificationMemo')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function getToolsDropdown()
    {
        $tools = DB::table('ToolMaster')
            ->whereNull('deletedAt')
            ->select('id', 'toolName', 'assetCode')
            ->orderBy('toolName')
            ->get()
            ->map(fn($t) => ['id' => $t->id, 'label' => $t->assetCode . ' - ' . $t->toolName]);
        return $this->successResponse($tools);
    }
}
