<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LogisticsController extends Controller
{
    private function perPage(Request $request): int
    {
        return (int) $request->get('per_page', 25);
    }

    public function dashboard()
    {
        $dispatchRows = DB::table('DispatchAdvice as d')
            ->leftJoin('Transporter as t', 'd.transporterId', '=', 't.id')
            ->leftJoin('SaleOrder as so', 'd.saleOrderId', '=', 'so.id')
            ->leftJoin('Customer as c', 'so.customerId', '=', 'c.id')
            ->whereNull('d.deletedAt')
            ->select(
                'd.id',
                'd.dispatchNo',
                'd.dispatchDate',
                'd.status',
                't.name as transporterName',
                'c.city as city',
                'so.totalAmount'
            )
            ->orderByDesc('d.id')
            ->get();

        $monthNow = now()->format('Y-m');

        $estimatedFreight = fn($total) => round(((float) ($total ?? 0)) * 0.035, 2);

        $stats = [
            'totalTransporters' => DB::table('Transporter')->whereNull('deletedAt')->count(),
            'activeTransporters' => DB::table('Transporter')->whereNull('deletedAt')->where('isActive', true)->count(),
            'totalDispatches' => $dispatchRows->count(),
            'inTransitDispatches' => $dispatchRows->where('status', 'In Transit')->count(),
            'deliveredDispatches' => $dispatchRows->where('status', 'Delivered')->count(),
            'pendingDispatches' => $dispatchRows->where('status', 'Pending')->count(),
            'monthlyFreight' => $dispatchRows
                ->filter(fn($row) => !empty($row->dispatchDate) && str_starts_with((string) $row->dispatchDate, $monthNow))
                ->sum(fn($row) => $estimatedFreight($row->totalAmount)),
        ];

        $statusMix = $dispatchRows
            ->groupBy(fn($row) => $row->status ?: 'Pending')
            ->map(fn($rows, $status) => ['name' => $status, 'value' => $rows->count()])
            ->values();

        $transporterMix = $dispatchRows
            ->groupBy(fn($row) => $row->transporterName ?: 'Unassigned')
            ->map(fn($rows, $name) => ['name' => $name, 'value' => $rows->count()])
            ->sortByDesc('value')
            ->take(6)
            ->values();

        $monthlyFreight = $dispatchRows
            ->groupBy(function ($row) {
                if (empty($row->dispatchDate)) {
                    return now()->format('M Y');
                }
                return \Carbon\Carbon::parse($row->dispatchDate)->format('M Y');
            })
            ->map(fn($rows, $month) => ['name' => $month, 'value' => round($rows->sum(fn($row) => $estimatedFreight($row->totalAmount)), 2)])
            ->values();

        $destinationMix = $dispatchRows
            ->groupBy(fn($row) => $row->city ?: 'Unspecified')
            ->map(fn($rows, $name) => ['name' => $name, 'value' => $rows->count()])
            ->sortByDesc('value')
            ->take(6)
            ->values();

        $recent = $dispatchRows
            ->take(8)
            ->map(fn($row) => [
                'id' => $row->id,
                'type' => 'Dispatch',
                'ref' => $row->dispatchNo,
                'date' => $row->dispatchDate,
                'status' => $row->status ?: 'Pending',
                'amount' => $estimatedFreight($row->totalAmount),
                'transporter' => $row->transporterName ?: 'Unassigned',
                'destination' => $row->city ?: 'Unspecified',
            ])
            ->values();

        return $this->successResponse([
            'stats' => $stats,
            'charts' => [
                [
                    'key' => 'logistics-status',
                    'title' => 'Dispatch Status Mix',
                    'type' => 'pie',
                    'data' => $statusMix,
                ],
                [
                    'key' => 'logistics-transporter',
                    'title' => 'Top Transporters by Dispatches',
                    'type' => 'bar-horizontal',
                    'data' => $transporterMix,
                ],
                [
                    'key' => 'logistics-monthly-freight',
                    'title' => 'Monthly Freight Trend',
                    'type' => 'line',
                    'data' => $monthlyFreight,
                ],
            ],
            'highlights' => [
                'destinations' => $destinationMix,
            ],
            'recent' => $recent,
        ]);
    }

    public function listTransporters(Request $request)
    {
        $query = DB::table('Transporter')->whereNull('deletedAt');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('ownerName', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%")
                    ->orWhere('gstin', 'like', "%{$search}%");
            });
        }

        $sortBy = $request->get('sort_by', 'createdAt');
        $sortOrder = strtolower($request->get('sort_order', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSort = ['id', 'name', 'ownerName', 'mobile', 'gstin', 'createdAt'];
        if (!in_array($sortBy, $allowedSort, true)) {
            $sortBy = 'createdAt';
        }

        return $this->paginatedResponse($query->orderBy($sortBy, $sortOrder)->paginate($this->perPage($request)));
    }

    public function createTransporter(Request $request)
    {
        $id = DB::table('Transporter')->insertGetId([
            'name' => $request->name,
            'ownerName' => $request->ownerName,
            'mobile' => $request->mobile,
            'gstin' => $request->gstin,
            'isActive' => true,
            'createdBy' => $request->user()?->id,
            'createdAt' => now(),
            'updatedAt' => now(),
            'deletedAt' => null,
        ]);

        return $this->getTransporter($id);
    }

    public function getTransporter($id)
    {
        $row = DB::table('Transporter')->where('id', $id)->whereNull('deletedAt')->first();
        if (!$row) {
            return $this->errorResponse('Transporter not found', 404);
        }
        return $this->successResponse($row);
    }

    public function updateTransporter(Request $request, $id)
    {
        $row = DB::table('Transporter')->where('id', $id)->whereNull('deletedAt')->first();
        if (!$row) {
            return $this->errorResponse('Transporter not found', 404);
        }

        DB::table('Transporter')->where('id', $id)->update([
            'name' => $request->name ?? $row->name,
            'ownerName' => $request->ownerName ?? $row->ownerName,
            'mobile' => $request->mobile ?? $row->mobile,
            'gstin' => $request->gstin ?? $row->gstin,
            'updatedAt' => now(),
        ]);

        return $this->getTransporter($id);
    }

    public function deleteTransporter($id)
    {
        DB::table('Transporter')->where('id', $id)->update(['deletedAt' => now()]);
        return $this->successResponse(null, 'Transporter deleted');
    }

    public function listOrders(Request $request)
    {
        $query = DB::table('DispatchAdvice as d')
            ->leftJoin('Transporter as t', 'd.transporterId', '=', 't.id')
            ->leftJoin('SaleOrder as so', 'd.saleOrderId', '=', 'so.id')
            ->leftJoin('Customer as c', 'so.customerId', '=', 'c.id')
            ->whereNull('d.deletedAt')
            ->select(
                'd.id',
                'd.dispatchNo',
                'd.dispatchDate',
                'd.status',
                'so.soNo as orderNo',
                'c.city as destination',
                't.id as transporterId',
                't.name as transporterName'
            );

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('so.soNo', 'like', "%{$search}%")
                    ->orWhere('d.dispatchNo', 'like', "%{$search}%")
                    ->orWhere('t.name', 'like', "%{$search}%")
                    ->orWhere('c.city', 'like', "%{$search}%")
                    ->orWhere('d.status', 'like', "%{$search}%");
            });
        }

        $sortBy = $request->get('sort_by', 'd.createdAt');
        $sortOrder = strtolower($request->get('sort_order', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSort = [
            'd.createdAt',
            'd.dispatchDate',
            'd.status',
            'so.soNo',
            'c.city',
            't.name',
        ];
        if (!in_array($sortBy, $allowedSort, true)) {
            $sortBy = 'd.createdAt';
        }

        $paginator = $query->orderBy($sortBy, $sortOrder)->paginate($this->perPage($request));
        $paginator->setCollection($paginator->getCollection()->map(function ($row) {
            return [
                'id' => $row->id,
                'orderNo' => $row->orderNo ?? ('SO-' . $row->id),
                'destination' => $row->destination ?: 'Unspecified',
                'status' => $row->status ?: 'Pending',
                'dispatchNo' => $row->dispatchNo,
                'dispatchDate' => $row->dispatchDate,
                'transporter' => [
                    'id' => $row->transporterId,
                    'name' => $row->transporterName ?: 'Unassigned',
                ],
            ];
        }));

        return $this->paginatedResponse($paginator);
    }

    public function listFreightBills(Request $request)
    {
        $query = DB::table('DispatchAdvice as d')
            ->leftJoin('SaleOrder as so', 'd.saleOrderId', '=', 'so.id')
            ->whereNull('d.deletedAt')
            ->select(
                'd.id',
                'd.dispatchNo',
                'd.dispatchDate',
                'd.status as dispatchStatus',
                'so.totalAmount'
            );

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('d.dispatchNo', 'like', "%{$search}%")
                    ->orWhere('d.status', 'like', "%{$search}%");
            });
        }

        $sortBy = $request->get('sort_by', 'd.createdAt');
        $sortOrder = strtolower($request->get('sort_order', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSort = ['d.createdAt', 'd.dispatchDate', 'd.status'];
        if (!in_array($sortBy, $allowedSort, true)) {
            $sortBy = 'd.createdAt';
        }

        $paginator = $query->orderBy($sortBy, $sortOrder)->paginate($this->perPage($request));
        $paginator->setCollection($paginator->getCollection()->map(function ($row) {
            $freightAmount = round(((float) ($row->totalAmount ?? 0)) * 0.035, 2);
            $status = in_array($row->dispatchStatus, ['Delivered', 'Completed'], true) ? 'Billed' : 'Pending';

            return [
                'id' => $row->id,
                'billNo' => 'FB-' . ($row->dispatchNo ?: $row->id),
                'lrNo' => $row->dispatchNo ?: ('LR-' . $row->id),
                'freightAmount' => $freightAmount,
                'status' => $status,
                'billDate' => $row->dispatchDate,
            ];
        }));

        return $this->paginatedResponse($paginator);
    }

    public function createOrder(Request $request)
    {
        $id = DB::table('DispatchAdvice')->insertGetId([
            'dispatchNo' => $request->dispatchNo ?? ('DA-' . now()->format('YmdHis')),
            'dispatchDate' => $request->dispatchDate ?? date('Y-m-d'),
            'saleOrderId' => $request->saleOrderId ?? 1,
            'transporterId' => $request->transporterId ?? null,
            'status' => $request->status ?? 'Pending',
            'createdBy' => $request->user()?->id ?? 1,
            'createdAt' => now(),
            'updatedAt' => now(),
        ]);
        return $this->getOrder($id);
    }

    public function getOrder($id)
    {
        $row = DB::table('DispatchAdvice as d')
            ->leftJoin('Transporter as t', 'd.transporterId', '=', 't.id')
            ->leftJoin('SaleOrder as so', 'd.saleOrderId', '=', 'so.id')
            ->leftJoin('Customer as c', 'so.customerId', '=', 'c.id')
            ->where('d.id', $id)
            ->select('d.*', 'so.soNo as orderNo', 'c.city as destination', 't.name as transporterName')
            ->first();
        if (!$row) return $this->errorResponse('Order not found', 404);
        
        $row->id = $row->id;
        $row->orderNo = $row->orderNo ?? ('SO-' . $row->id);
        $row->destination = $row->destination ?: 'Unspecified';
        $row->status = $row->status ?: 'Pending';
        $row->transporter = [
            'id' => $row->transporterId,
            'name' => $row->transporterName ?: 'Unassigned',
        ];
        return $this->successResponse($row);
    }

    public function updateOrder(Request $request, $id)
    {
        $row = DB::table('DispatchAdvice')->where('id', $id)->first();
        if (!$row) return $this->errorResponse('Order not found', 404);

        DB::table('DispatchAdvice')->where('id', $id)->update([
            'dispatchNo' => $request->dispatchNo ?? $row->dispatchNo,
            'dispatchDate' => $request->dispatchDate ?? $row->dispatchDate,
            'transporterId' => $request->transporterId ?? $row->transporterId,
            'status' => $request->status ?? $row->status,
            'updatedAt' => now(),
        ]);
        return $this->getOrder($id);
    }

    public function deleteOrder($id)
    {
        DB::table('DispatchAdvice')->where('id', $id)->update(['deletedAt' => now()]);
        return $this->successResponse(null, 'Deleted');
    }

    public function createFreightBill(Request $request)
    {
        return $this->createOrder($request);
    }

    public function getFreightBill($id)
    {
        $row = DB::table('DispatchAdvice as d')
            ->leftJoin('SaleOrder as so', 'd.saleOrderId', '=', 'so.id')
            ->where('d.id', $id)
            ->select('d.*', 'so.totalAmount')
            ->first();
        if (!$row) return $this->errorResponse('Freight Bill not found', 404);

        $freightAmount = round(((float) ($row->totalAmount ?? 0)) * 0.035, 2);
        $status = in_array($row->status, ['Delivered', 'Completed'], true) ? 'Billed' : 'Pending';

        $billRow = [
            'id' => $row->id,
            'billNo' => 'FB-' . ($row->dispatchNo ?: $row->id),
            'lrNo' => $row->dispatchNo ?: ('LR-' . $row->id),
            'freightAmount' => $freightAmount,
            'status' => $status,
            'billDate' => $row->dispatchDate,
        ];

        return $this->successResponse($billRow);
    }

    public function updateFreightBill(Request $request, $id)
    {
        $row = DB::table('DispatchAdvice')->where('id', $id)->first();
        if (!$row) return $this->errorResponse('Freight Bill not found', 404);

        DB::table('DispatchAdvice')->where('id', $id)->update([
            'dispatchNo' => $request->lrNo ?? $row->dispatchNo,
            'dispatchDate' => $request->billDate ?? $row->dispatchDate,
            'status' => $request->status ?? $row->status,
            'updatedAt' => now(),
        ]);
        return $this->getFreightBill($id);
    }

    public function deleteFreightBill($id)
    {
        return $this->deleteOrder($id);
    }
}
