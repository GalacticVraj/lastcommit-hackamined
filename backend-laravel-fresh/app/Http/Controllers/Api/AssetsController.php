<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AssetsController extends Controller
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
            'totalAssets' => DB::table('FixedAssetMaster')->whereNull('deletedAt')->count(),
            'assetAdditions' => DB::table('AssetAdditionMemo')->whereNull('deletedAt')->count(),
            'assetAllocations' => DB::table('AssetAllocationMaster')->whereNull('deletedAt')->count(),
            'assetSales' => DB::table('AssetSaleMemo')->whereNull('deletedAt')->count(),
            'depreciationVouchers' => DB::table('AssetDepreciationVoucher')->whereNull('deletedAt')->count(),
        ];

        $groupMix = DB::table('FixedAssetMaster')
            ->whereNull('deletedAt')
            ->selectRaw("COALESCE(assetGroup, 'Unknown') as name, COUNT(*) as value")
            ->groupBy('assetGroup')
            ->orderByDesc('value')
            ->get();

        $statusMix = DB::table('FixedAssetMaster')
            ->whereNull('deletedAt')
            ->selectRaw("COALESCE(status, 'Unknown') as name, COUNT(*) as value")
            ->groupBy('status')
            ->orderByDesc('value')
            ->get();

        $depByYear = DB::table('AssetDepreciationVoucher')
            ->whereNull('deletedAt')
            ->selectRaw('CAST(year as TEXT) as name, SUM(depreciationAmount) as value')
            ->groupBy('year')
            ->orderBy('year')
            ->get();

        $recent = collect()
            ->merge(
                DB::table('AssetAllocationMaster as m')
                    ->leftJoin('FixedAssetMaster as a', 'm.assetId', '=', 'a.id')
                    ->whereNull('m.deletedAt')
                    ->orderByDesc('m.id')
                    ->limit(3)
                    ->get(['m.id', 'm.dateAssigned', 'm.status', 'a.assetTag'])
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'Allocation',
                        'ref' => $row->assetTag ?? ('AL-' . $row->id),
                        'date' => $row->dateAssigned,
                        'status' => $row->status ?? 'Allocated',
                        'amount' => 0,
                    ])
            )
            ->merge(
                DB::table('AssetSaleMemo as m')
                    ->leftJoin('FixedAssetMaster as a', 'm.assetId', '=', 'a.id')
                    ->whereNull('m.deletedAt')
                    ->orderByDesc('m.id')
                    ->limit(3)
                    ->get(['m.id', 'm.saleDate', 'm.saleValue', 'a.assetTag'])
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'Sale Memo',
                        'ref' => $row->assetTag ?? ('SALE-' . $row->id),
                        'date' => $row->saleDate,
                        'status' => 'Sold',
                        'amount' => (float) ($row->saleValue ?? 0),
                    ])
            )
            ->merge(
                DB::table('AssetAdditionMemo as m')
                    ->leftJoin('FixedAssetMaster as a', 'm.assetId', '=', 'a.id')
                    ->whereNull('m.deletedAt')
                    ->orderByDesc('m.id')
                    ->limit(3)
                    ->get(['m.id', 'm.installationDate', 'm.depreciationRate', 'a.assetTag'])
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'Addition',
                        'ref' => $row->assetTag ?? ('ADD-' . $row->id),
                        'date' => $row->installationDate,
                        'status' => 'Posted',
                        'amount' => (float) ($row->depreciationRate ?? 0),
                    ])
            )
            ->sortByDesc(fn($row) => $row['date'] ?? '')
            ->take(6)
            ->values();

        return $this->successResponse([
            'stats' => $stats,
            'charts' => [
                [
                    'key' => 'assets-group',
                    'title' => 'Asset Group Mix',
                    'type' => 'pie',
                    'data' => $groupMix,
                ],
                [
                    'key' => 'assets-status',
                    'title' => 'Asset Status',
                    'type' => 'bar',
                    'data' => $statusMix,
                ],
                [
                    'key' => 'assets-dep',
                    'title' => 'Depreciation by Year',
                    'type' => 'line',
                    'data' => $depByYear,
                ],
            ],
            'recent' => $recent,
        ]);
    }

    public function listAssets(Request $request)
    {
        $query = DB::table('FixedAssetMaster')->whereNull('deletedAt');
        return $this->paginatedResponse($query->orderByDesc('id')->paginate($this->perPage($request)));
    }

    public function createAsset(Request $request)
    {
        $value = (float) ($request->value ?? 0);
        $id = DB::table('FixedAssetMaster')->insertGetId([
            'assetTag' => $request->assetTag ?: $this->ref('AST'),
            'name' => $request->name,
            'assetGroup' => $request->assetGroup ?? 'IT',
            'purchaseDate' => $request->purchaseDate,
            'value' => $value,
            'currentValue' => $request->currentValue ?? $value,
            'depreciationRate' => $request->depreciationRate ?? 0,
            'status' => $request->status ?? 'Active',
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);

        return $this->getAsset($id);
    }

    public function getAsset($id)
    {
        $asset = DB::table('FixedAssetMaster')->where('id', $id)->first();
        if (!$asset) {
            return $this->errorResponse('Asset not found', 404);
        }
        return $this->successResponse($asset);
    }

    public function updateAsset(Request $request, $id)
    {
        $asset = DB::table('FixedAssetMaster')->where('id', $id)->first();
        if (!$asset) {
            return $this->errorResponse('Asset not found', 404);
        }

        DB::table('FixedAssetMaster')->where('id', $id)->update([
            'assetTag' => $request->assetTag ?? $asset->assetTag,
            'name' => $request->name ?? $asset->name,
            'assetGroup' => $request->assetGroup ?? $asset->assetGroup,
            'purchaseDate' => $request->purchaseDate ?? $asset->purchaseDate,
            'value' => $request->value ?? $asset->value,
            'currentValue' => $request->currentValue ?? $asset->currentValue,
            'depreciationRate' => $request->depreciationRate ?? $asset->depreciationRate,
            'status' => $request->status ?? $asset->status,
            'updatedAt' => now(),
        ]);

        return $this->getAsset($id);
    }

    public function deleteAsset($id)
    {
        DB::table('FixedAssetMaster')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listAdditionMemos(Request $request)
    {
        $query = DB::table('AssetAdditionMemo as m')
            ->leftJoin('FixedAssetMaster as a', 'm.assetId', '=', 'a.id')
            ->whereNull('m.deletedAt')
            ->select('m.*', 'a.assetTag', 'a.name as assetName');
        return $this->paginatedResponse($query->orderByDesc('m.id')->paginate($this->perPage($request)));
    }

    public function createAdditionMemo(Request $request)
    {
        $id = DB::table('AssetAdditionMemo')->insertGetId([
            'assetId' => $request->assetId,
            'invoiceRef' => $request->invoiceRef,
            'installationDate' => $request->installationDate,
            'depreciationRate' => $request->depreciationRate ?? 0,
            'remarks' => $request->remarks,
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);

        DB::table('FixedAssetMaster')->where('id', $request->assetId)->update([
            'depreciationRate' => $request->depreciationRate ?? DB::raw('depreciationRate'),
            'updatedAt' => now(),
        ]);

        return $this->getAdditionMemo($id);
    }

    public function getAdditionMemo($id)
    {
        $record = DB::table('AssetAdditionMemo as m')
            ->leftJoin('FixedAssetMaster as a', 'm.assetId', '=', 'a.id')
            ->where('m.id', $id)
            ->select('m.*', 'a.assetTag', 'a.name as assetName')
            ->first();
        if (!$record) {
            return $this->errorResponse('Asset addition memo not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updateAdditionMemo(Request $request, $id)
    {
        $record = DB::table('AssetAdditionMemo')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Asset addition memo not found', 404);
        }

        DB::table('AssetAdditionMemo')->where('id', $id)->update([
            'assetId' => $request->assetId ?? $record->assetId,
            'invoiceRef' => $request->invoiceRef ?? $record->invoiceRef,
            'installationDate' => $request->installationDate ?? $record->installationDate,
            'depreciationRate' => $request->depreciationRate ?? $record->depreciationRate,
            'remarks' => $request->remarks ?? $record->remarks,
            'updatedAt' => now(),
        ]);

        return $this->getAdditionMemo($id);
    }

    public function deleteAdditionMemo($id)
    {
        DB::table('AssetAdditionMemo')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listAllocations(Request $request)
    {
        $query = DB::table('AssetAllocationMaster as m')
            ->leftJoin('FixedAssetMaster as a', 'm.assetId', '=', 'a.id')
            ->whereNull('m.deletedAt')
            ->select('m.*', 'a.assetTag', 'a.name as assetName');
        return $this->paginatedResponse($query->orderByDesc('m.id')->paginate($this->perPage($request)));
    }

    public function createAllocation(Request $request)
    {
        $id = DB::table('AssetAllocationMaster')->insertGetId([
            'assetId' => $request->assetId,
            'employeeId' => $request->employeeId,
            'employeeName' => $request->employeeName,
            'department' => $request->department,
            'dateAssigned' => $request->dateAssigned,
            'status' => $request->status ?? 'Allocated',
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);
        return $this->getAllocation($id);
    }

    public function getAllocation($id)
    {
        $record = DB::table('AssetAllocationMaster as m')
            ->leftJoin('FixedAssetMaster as a', 'm.assetId', '=', 'a.id')
            ->where('m.id', $id)
            ->select('m.*', 'a.assetTag', 'a.name as assetName')
            ->first();
        if (!$record) {
            return $this->errorResponse('Asset allocation not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updateAllocation(Request $request, $id)
    {
        $record = DB::table('AssetAllocationMaster')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Asset allocation not found', 404);
        }

        DB::table('AssetAllocationMaster')->where('id', $id)->update([
            'assetId' => $request->assetId ?? $record->assetId,
            'employeeId' => $request->employeeId ?? $record->employeeId,
            'employeeName' => $request->employeeName ?? $record->employeeName,
            'department' => $request->department ?? $record->department,
            'dateAssigned' => $request->dateAssigned ?? $record->dateAssigned,
            'status' => $request->status ?? $record->status,
            'updatedAt' => now(),
        ]);
        return $this->getAllocation($id);
    }

    public function deleteAllocation($id)
    {
        DB::table('AssetAllocationMaster')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listSaleMemos(Request $request)
    {
        $query = DB::table('AssetSaleMemo as m')
            ->leftJoin('FixedAssetMaster as a', 'm.assetId', '=', 'a.id')
            ->whereNull('m.deletedAt')
            ->select('m.*', 'a.assetTag', 'a.name as assetName');
        return $this->paginatedResponse($query->orderByDesc('m.id')->paginate($this->perPage($request)));
    }

    public function createSaleMemo(Request $request)
    {
        $id = DB::table('AssetSaleMemo')->insertGetId([
            'assetId' => $request->assetId,
            'saleDate' => $request->saleDate,
            'saleValue' => $request->saleValue ?? 0,
            'bookValue' => $request->bookValue ?? 0,
            'remarks' => $request->remarks,
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);

        DB::table('FixedAssetMaster')->where('id', $request->assetId)->update([
            'status' => 'Sold',
            'currentValue' => $request->bookValue ?? 0,
            'updatedAt' => now(),
        ]);

        return $this->getSaleMemo($id);
    }

    public function getSaleMemo($id)
    {
        $record = DB::table('AssetSaleMemo as m')
            ->leftJoin('FixedAssetMaster as a', 'm.assetId', '=', 'a.id')
            ->where('m.id', $id)
            ->select('m.*', 'a.assetTag', 'a.name as assetName')
            ->first();
        if (!$record) {
            return $this->errorResponse('Asset sale memo not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updateSaleMemo(Request $request, $id)
    {
        $record = DB::table('AssetSaleMemo')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Asset sale memo not found', 404);
        }

        DB::table('AssetSaleMemo')->where('id', $id)->update([
            'assetId' => $request->assetId ?? $record->assetId,
            'saleDate' => $request->saleDate ?? $record->saleDate,
            'saleValue' => $request->saleValue ?? $record->saleValue,
            'bookValue' => $request->bookValue ?? $record->bookValue,
            'remarks' => $request->remarks ?? $record->remarks,
            'updatedAt' => now(),
        ]);

        return $this->getSaleMemo($id);
    }

    public function deleteSaleMemo($id)
    {
        DB::table('AssetSaleMemo')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listDepreciationVouchers(Request $request)
    {
        $query = DB::table('AssetDepreciationVoucher as v')
            ->leftJoin('FixedAssetMaster as a', 'v.assetId', '=', 'a.id')
            ->whereNull('v.deletedAt')
            ->select('v.*', 'a.assetTag', 'a.name as assetName');
        return $this->paginatedResponse($query->orderByDesc('v.id')->paginate($this->perPage($request)));
    }

    public function createDepreciationVoucher(Request $request)
    {
        $opening = (float) ($request->openingBalance ?? 0);
        $depr = (float) ($request->depreciationAmount ?? 0);
        $closing = (float) ($request->closingBalance ?? ($opening - $depr));

        $id = DB::table('AssetDepreciationVoucher')->insertGetId([
            'year' => $request->year,
            'assetId' => $request->assetId,
            'openingBalance' => $opening,
            'depreciationAmount' => $depr,
            'closingBalance' => $closing,
            'remarks' => $request->remarks,
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);

        DB::table('FixedAssetMaster')->where('id', $request->assetId)->update([
            'currentValue' => $closing,
            'updatedAt' => now(),
        ]);

        return $this->getDepreciationVoucher($id);
    }

    public function getDepreciationVoucher($id)
    {
        $record = DB::table('AssetDepreciationVoucher as v')
            ->leftJoin('FixedAssetMaster as a', 'v.assetId', '=', 'a.id')
            ->where('v.id', $id)
            ->select('v.*', 'a.assetTag', 'a.name as assetName')
            ->first();
        if (!$record) {
            return $this->errorResponse('Asset depreciation voucher not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updateDepreciationVoucher(Request $request, $id)
    {
        $record = DB::table('AssetDepreciationVoucher')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Asset depreciation voucher not found', 404);
        }

        $opening = (float) ($request->openingBalance ?? $record->openingBalance);
        $depr = (float) ($request->depreciationAmount ?? $record->depreciationAmount);
        $closing = (float) ($request->closingBalance ?? ($opening - $depr));

        DB::table('AssetDepreciationVoucher')->where('id', $id)->update([
            'year' => $request->year ?? $record->year,
            'assetId' => $request->assetId ?? $record->assetId,
            'openingBalance' => $opening,
            'depreciationAmount' => $depr,
            'closingBalance' => $closing,
            'remarks' => $request->remarks ?? $record->remarks,
            'updatedAt' => now(),
        ]);

        return $this->getDepreciationVoucher($id);
    }

    public function deleteDepreciationVoucher($id)
    {
        DB::table('AssetDepreciationVoucher')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function getAssetsDropdown()
    {
        $rows = DB::table('FixedAssetMaster')
            ->whereNull('deletedAt')
            ->select('id', 'assetTag', 'name')
            ->orderBy('assetTag')
            ->get()
            ->map(fn($a) => ['id' => $a->id, 'label' => $a->assetTag . ' - ' . $a->name]);

        return $this->successResponse($rows);
    }
}
