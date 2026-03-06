<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QualityController extends Controller
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
            'totalIqc' => DB::table('IQCRecord')->whereNull('deletedAt')->count(),
            'totalMts' => DB::table('QualityMTS')->whereNull('deletedAt')->count(),
            'totalPqc' => DB::table('QualityPQC')->whereNull('deletedAt')->count(),
            'totalPdi' => DB::table('QualityPDI')->whereNull('deletedAt')->count(),
            'totalQrd' => DB::table('QualityQRD')->whereNull('deletedAt')->count(),
        ];

        $statusMix = DB::table('IQCRecord')
            ->whereNull('deletedAt')
            ->selectRaw("COALESCE(status, 'Unknown') as name, COUNT(*) as value")
            ->groupBy('status')
            ->orderByDesc('value')
            ->get();

        $monthlyIqc = DB::table('IQCRecord')
            ->whereNull('deletedAt')
            ->selectRaw("substr(COALESCE(inspectionDate, createdAt), 1, 7) as name, COUNT(*) as value")
            ->groupBy(DB::raw("substr(COALESCE(inspectionDate, createdAt), 1, 7)"))
            ->orderBy('name')
            ->get();

        $qrdActions = DB::table('QualityQRD')
            ->whereNull('deletedAt')
            ->selectRaw("COALESCE(action, 'Unknown') as name, COUNT(*) as value")
            ->groupBy('action')
            ->orderByDesc('value')
            ->get();

        $recent = collect()
            ->merge(
                DB::table('IQCRecord')
                    ->whereNull('deletedAt')
                    ->orderByDesc('id')
                    ->limit(3)
                    ->get()
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'IQC',
                        'ref' => $row->id ? ('IQC-' . $row->id) : null,
                        'date' => $row->inspectionDate ?? $row->createdAt,
                        'status' => $row->status ?? 'Open',
                        'amount' => (float) ($row->sampleQty ?? 0),
                    ])
            )
            ->merge(
                DB::table('QualityPQC')
                    ->whereNull('deletedAt')
                    ->orderByDesc('id')
                    ->limit(3)
                    ->get()
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'PQC',
                        'ref' => $row->routeCardRef ?? ('PQC-' . $row->id),
                        'date' => $row->createdAt,
                        'status' => $row->status ?? 'Open',
                        'amount' => 0,
                    ])
            )
            ->merge(
                DB::table('QualityPDI')
                    ->whereNull('deletedAt')
                    ->orderByDesc('id')
                    ->limit(3)
                    ->get()
                    ->map(fn($row) => [
                        'id' => $row->id,
                        'type' => 'PDI',
                        'ref' => $row->soRef ?? ('PDI-' . $row->id),
                        'date' => $row->createdAt,
                        'status' => $row->overallResult ?? 'Open',
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
                    'key' => 'quality-status',
                    'title' => 'Inspection Status Mix',
                    'type' => 'pie',
                    'data' => $statusMix,
                ],
                [
                    'key' => 'quality-monthly',
                    'title' => 'IQC Trend by Month',
                    'type' => 'bar',
                    'data' => $monthlyIqc,
                ],
                [
                    'key' => 'quality-qrd',
                    'title' => 'Rejection Action Split',
                    'type' => 'bar',
                    'data' => $qrdActions,
                ],
            ],
            'recent' => $recent,
        ]);
    }

    public function listIqc(Request $request)
    {
        $productTable = (new Product())->getTable();

        $query = DB::table('IQCRecord as i')
            ->leftJoin('GRN as g', 'i.grnId', '=', 'g.id')
            ->leftJoin("{$productTable} as p", 'i.productId', '=', 'p.id')
            ->whereNull('i.deletedAt')
            ->select('i.*', 'g.grnNo as grnRef', 'p.name as item');
        return $this->paginatedResponse($query->orderByDesc('i.id')->paginate($this->perPage($request)));
    }

    public function createIqc(Request $request)
    {
        $accepted = $request->acceptedQty ?? 0;
        $rejected = $request->rejectedQty ?? 0;
        $sampleQty = $request->sampleQty ?? ($accepted + $rejected);

        $id = DB::table('IQCRecord')->insertGetId([
            'grnId' => $request->grnId,
            'productId' => $request->productId,
            'sampleQty' => $sampleQty,
            'totalQty' => $sampleQty,
            'acceptedQty' => $accepted,
            'rejectedQty' => $rejected,
            'visualCheck' => $request->visualCheck,
            'dimensionCheck' => $request->dimensionCheck,
            'status' => $request->status ?? (($request->visualCheck === 'Pass' && $request->dimensionCheck === 'Pass') ? 'Pass' : 'Fail'),
            'remarks' => $request->remarks,
            'inspectorId' => $request->user()?->id,
            'inspectionDate' => $request->inspectionDate ?? now(),
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);

        return $this->getIqc($id);
    }

    public function getIqc($id)
    {
        $productTable = (new Product())->getTable();

        $record = DB::table('IQCRecord as i')
            ->leftJoin('GRN as g', 'i.grnId', '=', 'g.id')
            ->leftJoin("{$productTable} as p", 'i.productId', '=', 'p.id')
            ->where('i.id', $id)
            ->select('i.*', 'g.grnNo as grnRef', 'p.name as item')
            ->first();

        if (!$record) {
            return $this->errorResponse('IQC record not found', 404);
        }

        return $this->successResponse($record);
    }

    public function updateIqc(Request $request, $id)
    {
        $record = DB::table('IQCRecord')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('IQC record not found', 404);
        }

        DB::table('IQCRecord')->where('id', $id)->update([
            'grnId' => $request->grnId ?? $record->grnId,
            'productId' => $request->productId ?? $record->productId,
            'sampleQty' => $request->sampleQty ?? $record->sampleQty,
            'totalQty' => $request->sampleQty ?? $record->sampleQty,
            'visualCheck' => $request->visualCheck ?? $record->visualCheck,
            'dimensionCheck' => $request->dimensionCheck ?? $record->dimensionCheck,
            'acceptedQty' => $request->acceptedQty ?? $record->acceptedQty,
            'rejectedQty' => $request->rejectedQty ?? $record->rejectedQty,
            'status' => $request->status ?? $record->status,
            'remarks' => $request->remarks ?? $record->remarks,
            'updatedAt' => now(),
        ]);

        return $this->getIqc($id);
    }

    public function deleteIqc($id)
    {
        DB::table('IQCRecord')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listMts(Request $request)
    {
        $productTable = (new Product())->getTable();

        $query = DB::table('QualityMTS as m')
            ->leftJoin("{$productTable} as p", 'm.productId', '=', 'p.id')
            ->whereNull('m.deletedAt')
            ->select('m.*', 'p.name as item');
        return $this->paginatedResponse($query->orderByDesc('m.id')->paginate($this->perPage($request)));
    }

    public function createMts(Request $request)
    {
        $id = DB::table('QualityMTS')->insertGetId([
            'mtaRef' => $request->mtaRef ?: $this->ref('MTA'),
            'productId' => $request->productId,
            'qtyChecked' => $request->qtyChecked ?? 0,
            'status' => $request->status ?? 'OK',
            'remarks' => $request->remarks,
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);
        return $this->getMts($id);
    }

    public function getMts($id)
    {
        $productTable = (new Product())->getTable();

        $record = DB::table('QualityMTS as m')
            ->leftJoin("{$productTable} as p", 'm.productId', '=', 'p.id')
            ->where('m.id', $id)
            ->select('m.*', 'p.name as item')
            ->first();
        if (!$record) {
            return $this->errorResponse('MTS record not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updateMts(Request $request, $id)
    {
        $record = DB::table('QualityMTS')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('MTS record not found', 404);
        }

        DB::table('QualityMTS')->where('id', $id)->update([
            'mtaRef' => $request->mtaRef ?? $record->mtaRef,
            'productId' => $request->productId ?? $record->productId,
            'qtyChecked' => $request->qtyChecked ?? $record->qtyChecked,
            'status' => $request->status ?? $record->status,
            'remarks' => $request->remarks ?? $record->remarks,
            'updatedAt' => now(),
        ]);

        return $this->getMts($id);
    }

    public function deleteMts($id)
    {
        DB::table('QualityMTS')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listPqc(Request $request)
    {
        $query = DB::table('QualityPQC')->whereNull('deletedAt');
        return $this->paginatedResponse($query->orderByDesc('id')->paginate($this->perPage($request)));
    }

    public function createPqc(Request $request)
    {
        $id = DB::table('QualityPQC')->insertGetId([
            'routeCardRef' => $request->routeCardRef,
            'stageName' => $request->stageName,
            'operator' => $request->operator,
            'observations' => $request->observations,
            'status' => $request->status ?? 'Open',
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);
        return $this->getPqc($id);
    }

    public function getPqc($id)
    {
        $record = DB::table('QualityPQC')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('PQC record not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updatePqc(Request $request, $id)
    {
        $record = DB::table('QualityPQC')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('PQC record not found', 404);
        }

        DB::table('QualityPQC')->where('id', $id)->update([
            'routeCardRef' => $request->routeCardRef ?? $record->routeCardRef,
            'stageName' => $request->stageName ?? $record->stageName,
            'operator' => $request->operator ?? $record->operator,
            'observations' => $request->observations ?? $record->observations,
            'status' => $request->status ?? $record->status,
            'updatedAt' => now(),
        ]);

        return $this->getPqc($id);
    }

    public function deletePqc($id)
    {
        DB::table('QualityPQC')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listPdi(Request $request)
    {
        $query = DB::table('QualityPDI as p')
            ->leftJoin('SaleOrder as so', 'p.saleOrderId', '=', 'so.id')
            ->whereNull('p.deletedAt')
            ->select('p.*', DB::raw('COALESCE(p.soRef, so.soNo) as soRef'));
        return $this->paginatedResponse($query->orderByDesc('p.id')->paginate($this->perPage($request)));
    }

    public function createPdi(Request $request)
    {
        $id = DB::table('QualityPDI')->insertGetId([
            'saleOrderId' => $request->saleOrderId,
            'soRef' => $request->soRef,
            'boxNo' => $request->boxNo,
            'packagingCondition' => $request->packagingCondition,
            'labelAccuracy' => $request->labelAccuracy,
            'overallResult' => $request->overallResult ?? (($request->packagingCondition === 'Good' && $request->labelAccuracy === 'Accurate') ? 'Pass' : 'Fail'),
            'remarks' => $request->remarks,
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);
        return $this->getPdi($id);
    }

    public function getPdi($id)
    {
        $record = DB::table('QualityPDI as p')
            ->leftJoin('SaleOrder as so', 'p.saleOrderId', '=', 'so.id')
            ->where('p.id', $id)
            ->select('p.*', DB::raw('COALESCE(p.soRef, so.soNo) as soRef'))
            ->first();

        if (!$record) {
            return $this->errorResponse('PDI record not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updatePdi(Request $request, $id)
    {
        $record = DB::table('QualityPDI')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('PDI record not found', 404);
        }

        DB::table('QualityPDI')->where('id', $id)->update([
            'saleOrderId' => $request->saleOrderId ?? $record->saleOrderId,
            'soRef' => $request->soRef ?? $record->soRef,
            'boxNo' => $request->boxNo ?? $record->boxNo,
            'packagingCondition' => $request->packagingCondition ?? $record->packagingCondition,
            'labelAccuracy' => $request->labelAccuracy ?? $record->labelAccuracy,
            'overallResult' => $request->overallResult ?? $record->overallResult,
            'remarks' => $request->remarks ?? $record->remarks,
            'updatedAt' => now(),
        ]);

        return $this->getPdi($id);
    }

    public function deletePdi($id)
    {
        DB::table('QualityPDI')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listQrd(Request $request)
    {
        $productTable = (new Product())->getTable();

        $query = DB::table('QualityQRD as q')
            ->leftJoin("{$productTable} as p", 'q.productId', '=', 'p.id')
            ->whereNull('q.deletedAt')
            ->select('q.*', DB::raw('COALESCE(q.item, p.name) as item'));
        return $this->paginatedResponse($query->orderByDesc('q.id')->paginate($this->perPage($request)));
    }

    public function createQrd(Request $request)
    {
        $id = DB::table('QualityQRD')->insertGetId([
            'rejectionId' => $request->rejectionId ?: $this->ref('QRD'),
            'productId' => $request->productId,
            'item' => $request->item,
            'qty' => $request->qty ?? 0,
            'action' => $request->action,
            'remarks' => $request->remarks,
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);
        return $this->getQrd($id);
    }

    public function getQrd($id)
    {
        $productTable = (new Product())->getTable();

        $record = DB::table('QualityQRD as q')
            ->leftJoin("{$productTable} as p", 'q.productId', '=', 'p.id')
            ->where('q.id', $id)
            ->select('q.*', DB::raw('COALESCE(q.item, p.name) as item'))
            ->first();

        if (!$record) {
            return $this->errorResponse('QRD record not found', 404);
        }
        return $this->successResponse($record);
    }

    public function updateQrd(Request $request, $id)
    {
        $record = DB::table('QualityQRD')->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('QRD record not found', 404);
        }

        DB::table('QualityQRD')->where('id', $id)->update([
            'rejectionId' => $request->rejectionId ?? $record->rejectionId,
            'productId' => $request->productId ?? $record->productId,
            'item' => $request->item ?? $record->item,
            'qty' => $request->qty ?? $record->qty,
            'action' => $request->action ?? $record->action,
            'remarks' => $request->remarks ?? $record->remarks,
            'updatedAt' => now(),
        ]);

        return $this->getQrd($id);
    }

    public function deleteQrd($id)
    {
        DB::table('QualityQRD')->where('id', $id)->update(['deletedAt' => now(), 'updatedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }
}
