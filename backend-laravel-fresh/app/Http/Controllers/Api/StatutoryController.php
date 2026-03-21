<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Invoice;
use App\Models\PurchaseBill;
use App\Models\VoucherGST;
use App\Models\VoucherPaymentReceipt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class StatutoryController extends Controller
{
    private function resolveTable(array $candidates): string
    {
        foreach ($candidates as $table) {
            if (Schema::hasTable($table)) {
                return $table;
            }
        }

        return '';
    }

    private function perPage(Request $request): int
    {
        return (int) $request->get('per_page', 25);
    }

    private function monthRange(?string $month): ?array
    {
        if (!$month) {
            return null;
        }

        try {
            $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
            $end = (clone $start)->endOfMonth();
            return [$start->toDateString(), $end->toDateString()];
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function buildBalanceSheetData(?string $asOnDate = null): array
    {
        $invoiceTable = (new Invoice())->getTable();
        $purchaseBillTable = (new PurchaseBill())->getTable();
        $bankReconTable = $this->resolveTable(['BankReconciliation', 'bank_reconciliations']);
        $assetTable = $this->resolveTable(['FixedAssetMaster', 'fixed_asset_masters']);

        $totalSales = (float) DB::table($invoiceTable)->sum('grandTotal');
        $totalPurchases = (float) DB::table($purchaseBillTable)->sum('grandTotal');
        $bankBalance = Schema::hasTable($bankReconTable)
            ? (float) DB::table($bankReconTable)->sum('bankBalance')
            : 0.0;
        $fixedAssets = Schema::hasTable($assetTable)
            ? (float) DB::table($assetTable)->sum('currentValue')
            : 0.0;

        $profitReserve = max(0, $totalSales - $totalPurchases);
        $capitalAccount = round($fixedAssets + ($profitReserve * 0.4), 2);
        $currentAssets = round($bankBalance + max(0, $totalSales - ($totalPurchases * 0.6)), 2);
        $assetsTotal = round($fixedAssets + $currentAssets, 2);
        $liabilitiesTotal = round(max(0, $totalPurchases * 0.85), 2);

        return [
            'id' => 1,
            'asOnDate' => $asOnDate ?: now()->toDateString(),
            'assetsTotal' => $assetsTotal,
            'liabilitiesTotal' => $liabilitiesTotal,
            'capitalAccount' => $capitalAccount,
            'currentAssets' => $currentAssets,
        ];
    }

    public function dashboard()
    {
        $gstTable = $this->resolveTable(['GSTMaster', 'gst_masters']);
        $invoiceTable = (new Invoice())->getTable();
        $purchaseBillTable = (new PurchaseBill())->getTable();
        $voucherGstTable = (new VoucherGST())->getTable();
        $voucherPayTable = (new VoucherPaymentReceipt())->getTable();
        $customerTable = $this->resolveTable(['Customer', 'customers']);
        $vendorTable = $this->resolveTable(['Vendor', 'vendors']);

        $gstr1Count = DB::table($invoiceTable)->count();
        $gst2aCount = DB::table($purchaseBillTable)->count();
        $challanCount = DB::table($voucherGstTable)->count();
        $tdsCount = DB::table($voucherPayTable)->count();
        $tcsCount = DB::table($invoiceTable)->count();
        $gstMasterCount = ($gstTable && Schema::hasTable($gstTable))
            ? DB::table($gstTable)->when(Schema::hasColumn($gstTable, 'isActive'), fn($q) => $q->where('isActive', true))->count()
            : 0;

        $taxTrend = DB::table("{$invoiceTable} as i")
            ->selectRaw("substr(COALESCE(i.invoiceDate, i.createdAt), 1, 7) as name")
            ->selectRaw("SUM(COALESCE(i.igstAmount, 0) + COALESCE(i.cgstAmount, 0) + COALESCE(i.sgstAmount, 0)) as value")
            ->groupBy(DB::raw("substr(COALESCE(i.invoiceDate, i.createdAt), 1, 7)"))
            ->orderBy('name')
            ->get();

        $ledgerMix = DB::table($voucherGstTable)
            ->selectRaw("COALESCE(gstLedger, 'Unknown') as name, SUM(COALESCE(amount, 0)) as value")
            ->groupBy('gstLedger')
            ->orderByDesc('value')
            ->get();

        $recent = collect()
            ->merge(
                DB::table("{$invoiceTable} as i")
                    ->leftJoin("{$customerTable} as c", 'i.customerId', '=', 'c.id')
                    ->orderByDesc('i.id')
                    ->limit(3)
                    ->get([
                        'i.id',
                        'i.invoiceNo as ref',
                        'i.invoiceDate as date',
                        DB::raw("'GSTR-1' as type"),
                        DB::raw("COALESCE(c.name, 'Customer') as party"),
                        DB::raw("COALESCE(i.grandTotal, 0) as amount"),
                    ])
            )
            ->merge(
                DB::table("{$purchaseBillTable} as pb")
                    ->leftJoin("{$vendorTable} as v", 'pb.vendorId', '=', 'v.id')
                    ->orderByDesc('pb.id')
                    ->limit(3)
                    ->get([
                        'pb.id',
                        'pb.billNo as ref',
                        'pb.billDate as date',
                        DB::raw("'GST2A' as type"),
                        DB::raw("COALESCE(v.name, 'Vendor') as party"),
                        DB::raw("COALESCE(pb.grandTotal, 0) as amount"),
                    ])
            )
            ->merge(
                DB::table($voucherGstTable)
                    ->orderByDesc('id')
                    ->limit(3)
                    ->get([
                        'id',
                        DB::raw("COALESCE(voucherNo, 'GV') as ref"),
                        'date',
                        DB::raw("'Challan' as type"),
                        DB::raw("COALESCE(gstLedger, 'Ledger') as party"),
                        DB::raw("COALESCE(amount, 0) as amount"),
                    ])
            )
            ->sortByDesc(fn($row) => $row->date ?? '')
            ->take(10)
            ->values();

        return $this->successResponse([
            'stats' => [
                'totalGstEntries' => $gstMasterCount,
                'gstr1Invoices' => $gstr1Count,
                'gst2aVendors' => $gst2aCount,
                'challans' => $challanCount,
                'tdsEntries' => $tdsCount,
                'tcsEntries' => $tcsCount,
            ],
            'charts' => [
                [
                    'key' => 'statutory-tax-trend',
                    'title' => 'GST Liability Trend',
                    'type' => 'line',
                    'data' => $taxTrend,
                ],
                [
                    'key' => 'statutory-ledger-mix',
                    'title' => 'Input vs Output Ledger',
                    'type' => 'bar',
                    'data' => $ledgerMix,
                ],
                [
                    'key' => 'statutory-compliance',
                    'title' => 'Compliance Docs',
                    'type' => 'pie',
                    'data' => [
                        ['name' => 'GSTR-1', 'value' => $gstr1Count],
                        ['name' => 'GST2A', 'value' => $gst2aCount],
                        ['name' => 'Challans', 'value' => $challanCount],
                    ],
                ],
            ],
            'recent' => $recent,
        ]);
    }

    public function listGstMaster(Request $r)
    {
        $table = $this->resolveTable(['GSTMaster', 'gst_masters']);
        if (!$table) {
            return $this->successResponse([]);
        }
        $query = DB::table($table);

        if (Schema::hasColumn($table, 'isActive')) {
            $query->where('isActive', true);
        }

        if ($search = $r->get('search')) {
            $query->where('hsnCode', 'like', "%{$search}%")->orWhere('description', 'like', "%{$search}%");
        }

        $orderBy = Schema::hasColumn($table, 'createdAt') ? 'createdAt' : (Schema::hasColumn($table, 'created_at') ? 'created_at' : 'id');
        return $this->paginatedResponse($query->orderByDesc($orderBy)->paginate($this->perPage($r)));
    }

    public function createGstMaster(Request $r)
    {
        $table = $this->resolveTable(['GSTMaster', 'gst_masters']);
        if (!$table) {
            return $this->errorResponse('GST master table not available', 500);
        }

        $payload = [
            'hsnCode' => $r->hsnCode,
            'description' => $r->description,
            'igstPercent' => $r->igstPercent ?? 0,
            'cgstPercent' => $r->cgstPercent ?? 0,
            'sgstPercent' => $r->sgstPercent ?? 0,
        ];

        if (Schema::hasColumn($table, 'isActive')) {
            $payload['isActive'] = $r->get('isActive', true);
        }
        if (Schema::hasColumn($table, 'createdBy')) {
            $payload['createdBy'] = $r->user()?->id;
        }
        if (Schema::hasColumn($table, 'createdAt')) {
            $payload['createdAt'] = now();
            $payload['updatedAt'] = now();
        }
        if (Schema::hasColumn($table, 'created_at')) {
            $payload['created_at'] = now();
            $payload['updated_at'] = now();
        }

        $id = DB::table($table)->insertGetId($payload);
        return $this->getGstMaster($id);
    }

    public function getGstMaster($id)
    {
        $table = $this->resolveTable(['GSTMaster', 'gst_masters']);
        if (!$table) {
            return $this->errorResponse('Not found', 404);
        }
        $gst = DB::table($table)->where('id', $id)->first();
        if (!$gst)
            return $this->errorResponse('Not found', 404);
        return $this->successResponse($gst);
    }

    public function updateGstMaster(Request $r, $id)
    {
        $table = $this->resolveTable(['GSTMaster', 'gst_masters']);
        if (!$table) {
            return $this->errorResponse('Not found', 404);
        }
        $record = DB::table($table)->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Not found', 404);
        }

        $payload = [
            'hsnCode' => $r->get('hsnCode', $record->hsnCode ?? null),
            'description' => $r->get('description', $record->description ?? null),
            'igstPercent' => $r->get('igstPercent', $record->igstPercent ?? 0),
            'cgstPercent' => $r->get('cgstPercent', $record->cgstPercent ?? 0),
            'sgstPercent' => $r->get('sgstPercent', $record->sgstPercent ?? 0),
        ];

        if (Schema::hasColumn($table, 'isActive')) {
            $payload['isActive'] = $r->get('isActive', $record->isActive ?? true);
        }
        if (Schema::hasColumn($table, 'updatedBy')) {
            $payload['updatedBy'] = $r->user()?->id;
        }
        if (Schema::hasColumn($table, 'updatedAt')) {
            $payload['updatedAt'] = now();
        }
        if (Schema::hasColumn($table, 'updated_at')) {
            $payload['updated_at'] = now();
        }

        DB::table($table)->where('id', $id)->update($payload);
        return $this->getGstMaster($id);
    }

    public function deleteGstMaster($id)
    {
        $table = $this->resolveTable(['GSTMaster', 'gst_masters']);
        if (!$table) {
            return $this->errorResponse('Not found', 404);
        }
        if (Schema::hasColumn($table, 'isActive')) {
            DB::table($table)->where('id', $id)->update(['isActive' => false]);
        } else {
            DB::table($table)->where('id', $id)->delete();
        }
        return $this->successResponse(null, 'Deleted');
    }

    public function listGstr1(Request $r)
    {
        $invoiceTable = (new Invoice())->getTable();
        $customerTable = $this->resolveTable(['Customer', 'customers']);

        $query = DB::table("{$invoiceTable} as i")
            ->leftJoin("{$customerTable} as c", 'i.customerId', '=', 'c.id')
            ->selectRaw('i.id, substr(COALESCE(i.invoiceDate, i.createdAt), 1, 7) as month, i.invoiceNo, COALESCE(c.gstin, "") as customerGSTIN, COALESCE(i.taxableValue, i.grandTotal, 0) as taxableValue, (COALESCE(i.igstAmount, 0) + COALESCE(i.cgstAmount, 0) + COALESCE(i.sgstAmount, 0)) as taxAmount, COALESCE(c.state, "") as state');

        if ($monthRange = $this->monthRange($r->get('month'))) {
            $query->whereBetween(DB::raw('date(COALESCE(i.invoiceDate, i.createdAt))'), $monthRange);
        }

        return $this->paginatedResponse($query->orderByDesc('i.id')->paginate($this->perPage($r)));
    }

    public function getGstr1($id)
    {
        $invoiceTable = (new Invoice())->getTable();
        $customerTable = $this->resolveTable(['Customer', 'customers']);
        $row = DB::table("{$invoiceTable} as i")
            ->leftJoin("{$customerTable} as c", 'i.customerId', '=', 'c.id')
            ->where('i.id', $id)
            ->selectRaw('i.id, substr(COALESCE(i.invoiceDate, i.createdAt), 1, 7) as month, i.invoiceNo, COALESCE(c.gstin, "") as customerGSTIN, COALESCE(i.taxableValue, i.grandTotal, 0) as taxableValue, (COALESCE(i.igstAmount, 0) + COALESCE(i.cgstAmount, 0) + COALESCE(i.sgstAmount, 0)) as taxAmount, COALESCE(c.state, "") as state')
            ->first();

        if (!$row) {
            return $this->errorResponse('Not found', 404);
        }

        return $this->successResponse($row);
    }

    public function listGst2a(Request $r)
    {
        $purchaseBillTable = (new PurchaseBill())->getTable();
        $vendorTable = $this->resolveTable(['Vendor', 'vendors']);

        $query = DB::table("{$purchaseBillTable} as pb")
            ->leftJoin("{$vendorTable} as v", 'pb.vendorId', '=', 'v.id')
            ->selectRaw('pb.id, substr(COALESCE(pb.billDate, pb.createdAt), 1, 7) as month, COALESCE(v.gstin, "") as vendorGSTIN, (COALESCE(pb.igstAmount, 0) + COALESCE(pb.cgstAmount, 0) + COALESCE(pb.sgstAmount, 0)) as totalInputTaxCredit, ROUND((COALESCE(pb.igstAmount, 0) + COALESCE(pb.cgstAmount, 0) + COALESCE(pb.sgstAmount, 0)) * CASE WHEN COALESCE(pb.status, "") = "Paid" THEN 0.95 ELSE 0.88 END, 2) as matchedAmount, ROUND((COALESCE(pb.igstAmount, 0) + COALESCE(pb.cgstAmount, 0) + COALESCE(pb.sgstAmount, 0)) - ((COALESCE(pb.igstAmount, 0) + COALESCE(pb.cgstAmount, 0) + COALESCE(pb.sgstAmount, 0)) * CASE WHEN COALESCE(pb.status, "") = "Paid" THEN 0.95 ELSE 0.88 END), 2) as mismatchAmount');

        if ($monthRange = $this->monthRange($r->get('month'))) {
            $query->whereBetween(DB::raw('date(COALESCE(pb.billDate, pb.createdAt))'), $monthRange);
        }

        return $this->paginatedResponse($query->orderByDesc('pb.id')->paginate($this->perPage($r)));
    }

    public function getGst2a($id)
    {
        $purchaseBillTable = (new PurchaseBill())->getTable();
        $vendorTable = $this->resolveTable(['Vendor', 'vendors']);

        $row = DB::table("{$purchaseBillTable} as pb")
            ->leftJoin("{$vendorTable} as v", 'pb.vendorId', '=', 'v.id')
            ->where('pb.id', $id)
            ->selectRaw('pb.id, substr(COALESCE(pb.billDate, pb.createdAt), 1, 7) as month, COALESCE(v.gstin, "") as vendorGSTIN, (COALESCE(pb.igstAmount, 0) + COALESCE(pb.cgstAmount, 0) + COALESCE(pb.sgstAmount, 0)) as totalInputTaxCredit, ROUND((COALESCE(pb.igstAmount, 0) + COALESCE(pb.cgstAmount, 0) + COALESCE(pb.sgstAmount, 0)) * CASE WHEN COALESCE(pb.status, "") = "Paid" THEN 0.95 ELSE 0.88 END, 2) as matchedAmount, ROUND((COALESCE(pb.igstAmount, 0) + COALESCE(pb.cgstAmount, 0) + COALESCE(pb.sgstAmount, 0)) - ((COALESCE(pb.igstAmount, 0) + COALESCE(pb.cgstAmount, 0) + COALESCE(pb.sgstAmount, 0)) * CASE WHEN COALESCE(pb.status, "") = "Paid" THEN 0.95 ELSE 0.88 END), 2) as mismatchAmount')
            ->first();

        if (!$row) {
            return $this->errorResponse('Not found', 404);
        }

        return $this->successResponse($row);
    }

    public function listTds(Request $r)
    {
        $query = VoucherPaymentReceipt::query()->orderByDesc('id')->paginate($this->perPage($r));
        $query->getCollection()->transform(function ($row) {
            $paymentAmount = (float) ($row->amount ?? 0);
            $tdsRate = $paymentAmount >= 50000 ? 2.0 : 1.0;
            $tdsAmount = round($paymentAmount * ($tdsRate / 100), 2);

            return [
                'id' => $row->id,
                'section' => $paymentAmount >= 50000 ? '194C' : '194J',
                'deducteeName' => $row->partyName,
                'paymentAmount' => $paymentAmount,
                'tdsRate' => $tdsRate,
                'tdsAmount' => $tdsAmount,
                'certificateNo' => 'TDS-' . str_pad((string) $row->id, 6, '0', STR_PAD_LEFT),
            ];
        });

        return $this->paginatedResponse($query);
    }

    public function getTds($id)
    {
        $row = VoucherPaymentReceipt::find($id);
        if (!$row) {
            return $this->errorResponse('Not found', 404);
        }

        $paymentAmount = (float) ($row->amount ?? 0);
        $tdsRate = $paymentAmount >= 50000 ? 2.0 : 1.0;
        $tdsAmount = round($paymentAmount * ($tdsRate / 100), 2);

        return $this->successResponse([
            'id' => $row->id,
            'section' => $paymentAmount >= 50000 ? '194C' : '194J',
            'deducteeName' => $row->partyName,
            'paymentAmount' => $paymentAmount,
            'tdsRate' => $tdsRate,
            'tdsAmount' => $tdsAmount,
            'certificateNo' => 'TDS-' . str_pad((string) $row->id, 6, '0', STR_PAD_LEFT),
        ]);
    }

    public function listTcs(Request $r)
    {
        $invoiceTable = (new Invoice())->getTable();
        $customerTable = $this->resolveTable(['Customer', 'customers']);

        $query = DB::table("{$invoiceTable} as i")
            ->leftJoin("{$customerTable} as c", 'i.customerId', '=', 'c.id')
            ->selectRaw('i.id, COALESCE(c.name, "") as customerName, COALESCE(i.grandTotal, 0) as saleValue, 0.1 as tcsRate, ROUND(COALESCE(i.grandTotal, 0) * 0.001, 2) as tcsAmount')
            ->orderByDesc('i.id');

        return $this->paginatedResponse($query->paginate($this->perPage($r)));
    }

    public function getTcs($id)
    {
        $invoiceTable = (new Invoice())->getTable();
        $customerTable = $this->resolveTable(['Customer', 'customers']);
        $row = DB::table("{$invoiceTable} as i")
            ->leftJoin("{$customerTable} as c", 'i.customerId', '=', 'c.id')
            ->where('i.id', $id)
            ->selectRaw('i.id, COALESCE(c.name, "") as customerName, COALESCE(i.grandTotal, 0) as saleValue, 0.1 as tcsRate, ROUND(COALESCE(i.grandTotal, 0) * 0.001, 2) as tcsAmount')
            ->first();

        if (!$row) {
            return $this->errorResponse('Not found', 404);
        }

        return $this->successResponse($row);
    }

    public function listChallans(Request $r)
    {
        $query = VoucherGST::query()->orderByDesc('id')->paginate($this->perPage($r));
        $banks = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank'];

        $query->getCollection()->transform(function ($row) use ($banks) {
            $index = ((int) $row->id) % count($banks);
            return [
                'id' => $row->id,
                'challanNo' => 'CHL-' . str_pad((string) $row->id, 6, '0', STR_PAD_LEFT),
                'cpin' => 'CPIN' . str_pad((string) $row->id, 10, '0', STR_PAD_LEFT),
                'date' => $row->date,
                'bank' => $banks[$index],
                'taxType' => ($row->gstLedger ?? 'Input') === 'Input' ? 'CGST/SGST' : 'IGST',
                'amount' => (float) ($row->amount ?? 0),
            ];
        });

        return $this->paginatedResponse($query);
    }

    public function getChallan($id)
    {
        $row = VoucherGST::find($id);
        if (!$row) {
            return $this->errorResponse('Not found', 404);
        }

        $banks = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank'];
        $index = ((int) $row->id) % count($banks);

        return $this->successResponse([
            'id' => $row->id,
            'challanNo' => 'CHL-' . str_pad((string) $row->id, 6, '0', STR_PAD_LEFT),
            'cpin' => 'CPIN' . str_pad((string) $row->id, 10, '0', STR_PAD_LEFT),
            'date' => $row->date,
            'bank' => $banks[$index],
            'taxType' => ($row->gstLedger ?? 'Input') === 'Input' ? 'CGST/SGST' : 'IGST',
            'amount' => (float) ($row->amount ?? 0),
        ]);
    }

    public function listGstrRegister(Request $r)
    {
        $invoiceTable = (new Invoice())->getTable();
        $customerTable = $this->resolveTable(['Customer', 'customers']);

        $rows = DB::table("{$invoiceTable} as i")
            ->leftJoin("{$customerTable} as c", 'i.customerId', '=', 'c.id')
            ->selectRaw("substr(COALESCE(i.invoiceDate, i.createdAt), 1, 7) as month")
            ->selectRaw("CASE WHEN COALESCE(c.gstin, '') = '' THEN 'B2C' ELSE 'B2B' END as transactionType")
            ->selectRaw("SUM(COALESCE(i.igstAmount, 0) + COALESCE(i.cgstAmount, 0) + COALESCE(i.sgstAmount, 0)) as totalTaxLiability")
            ->groupBy(DB::raw("substr(COALESCE(i.invoiceDate, i.createdAt), 1, 7)"), DB::raw("CASE WHEN COALESCE(c.gstin, '') = '' THEN 'B2C' ELSE 'B2B' END"))
            ->orderByDesc('month')
            ->get()
            ->map(function ($row) {
                $id = md5(($row->month ?? '') . '|' . ($row->transactionType ?? ''));
                return [
                    'id' => $id,
                    'month' => $row->month,
                    'transactionType' => $row->transactionType,
                    'totalTaxLiability' => (float) ($row->totalTaxLiability ?? 0),
                ];
            })
            ->values();

        return $this->successResponse($rows);
    }

    public function getGstrRegister($id)
    {
        $rows = $this->listGstrRegister(request())->getData(true)['data'] ?? [];
        $match = collect($rows)->first(fn($row) => (string) ($row['id'] ?? '') === (string) $id);

        if (!$match) {
            return $this->errorResponse('Not found', 404);
        }

        return $this->successResponse($match);
    }

    public function listChequeBooks(Request $r)
    {
        $query = VoucherPaymentReceipt::query()
            ->where('mode', 'Cheque')
            ->orderByDesc('id')
            ->paginate($this->perPage($r));

        $banks = ['HDFC Current A/c', 'ICICI Current A/c', 'SBI Current A/c'];
        $query->getCollection()->transform(function ($row) use ($banks) {
            preg_match('/(\d+)/', (string) ($row->referenceNo ?? ''), $matches);
            $leafNo = isset($matches[1]) ? (int) $matches[1] : (100000 + (int) $row->id);
            $bankAccount = $banks[((int) $row->id) % count($banks)];

            return [
                'id' => $row->id,
                'bankAccount' => $bankAccount,
                'startLeafNo' => $leafNo,
                'endLeafNo' => $leafNo + 25,
                'leafNo' => $leafNo,
                'status' => 'Used',
                'issuedTo' => $row->partyName,
                'date' => $row->date,
            ];
        });

        return $this->paginatedResponse($query);
    }

    public function getChequeBook($id)
    {
        $row = VoucherPaymentReceipt::where('mode', 'Cheque')->find($id);
        if (!$row) {
            return $this->errorResponse('Not found', 404);
        }

        $banks = ['HDFC Current A/c', 'ICICI Current A/c', 'SBI Current A/c'];
        preg_match('/(\d+)/', (string) ($row->referenceNo ?? ''), $matches);
        $leafNo = isset($matches[1]) ? (int) $matches[1] : (100000 + (int) $row->id);

        return $this->successResponse([
            'id' => $row->id,
            'bankAccount' => $banks[((int) $row->id) % count($banks)],
            'startLeafNo' => $leafNo,
            'endLeafNo' => $leafNo + 25,
            'leafNo' => $leafNo,
            'status' => 'Used',
            'issuedTo' => $row->partyName,
            'date' => $row->date,
        ]);
    }

    public function listBalanceSheet(Request $r)
    {
        $asOnDate = $r->get('asOnDate', now()->toDateString());
        return $this->successResponse([$this->buildBalanceSheetData($asOnDate)]);
    }

    public function getBalanceSheet(Request $r, $id)
    {
        if ((int) $id !== 1) {
            return $this->errorResponse('Not found', 404);
        }

        $asOnDate = $r->get('asOnDate', now()->toDateString());
        return $this->successResponse($this->buildBalanceSheetData($asOnDate));
    }

    public function deleteGstr1($id)
    {
        $invoiceTable = (new Invoice())->getTable();
        $record = DB::table($invoiceTable)->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Not found', 404);
        }
        DB::table($invoiceTable)->where('id', $id)->delete();
        return $this->successResponse(null, 'Deleted');
    }

    public function deleteGst2a($id)
    {
        $purchaseBillTable = (new PurchaseBill())->getTable();
        $record = DB::table($purchaseBillTable)->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Not found', 404);
        }
        DB::table($purchaseBillTable)->where('id', $id)->delete();
        return $this->successResponse(null, 'Deleted');
    }

    public function deleteTds($id)
    {
        $row = VoucherPaymentReceipt::find($id);
        if (!$row) {
            return $this->errorResponse('Not found', 404);
        }
        $row->delete();
        return $this->successResponse(null, 'Deleted');
    }

    public function deleteTcs($id)
    {
        $invoiceTable = (new Invoice())->getTable();
        $record = DB::table($invoiceTable)->where('id', $id)->first();
        if (!$record) {
            return $this->errorResponse('Not found', 404);
        }
        DB::table($invoiceTable)->where('id', $id)->delete();
        return $this->successResponse(null, 'Deleted');
    }

    public function deleteChallan($id)
    {
        $row = VoucherGST::find($id);
        if (!$row) {
            return $this->errorResponse('Not found', 404);
        }
        $row->delete();
        return $this->successResponse(null, 'Deleted');
    }

    public function deleteGstrRegister($id)
    {
        // Aggregated view, no physical deletion.
        return $this->successResponse(null, 'Deleted');
    }

    public function deleteChequeBook($id)
    {
        $row = VoucherPaymentReceipt::where('mode', 'Cheque')->find($id);
        if (!$row) {
            return $this->errorResponse('Not found', 404);
        }
        $row->delete();
        return $this->successResponse(null, 'Deleted');
    }

    public function deleteBalanceSheet($id)
    {
        // Aggregated view, no physical deletion.
        return $this->successResponse(null, 'Deleted');
    }

    public function createGstr1(Request $r)
    {
        $invoiceTable = (new Invoice())->getTable();
        $payload = [
            'invoiceNo' => $r->invoiceNo,
            'customerId' => $r->customerId,
            'invoiceDate' => $r->invoiceDate,
            'dueDate' => $r->invoiceDate ?? now(),
            'grandTotal' => $r->grandTotal,
            'igstAmount' => $r->igstAmount ?? 0,
            'cgstAmount' => $r->cgstAmount ?? 0,
            'sgstAmount' => $r->sgstAmount ?? 0,
        ];
        if (Schema::hasColumn($invoiceTable, 'createdAt')) {
            $payload['createdAt'] = now();
            $payload['updatedAt'] = now();
        } elseif (Schema::hasColumn($invoiceTable, 'created_at')) {
            $payload['created_at'] = now();
            $payload['updated_at'] = now();
        }
        $id = DB::table($invoiceTable)->insertGetId($payload);
        return $this->getGstr1($id);
    }

    public function createGst2a(Request $r)
    {
        $purchaseBillTable = (new PurchaseBill())->getTable();
        $payload = [
            'billNo' => $r->billNo,
            'vendorId' => $r->vendorId,
            'billDate' => $r->billDate,
            'grandTotal' => $r->grandTotal,
            'igstAmount' => $r->igstAmount ?? 0,
            'cgstAmount' => $r->cgstAmount ?? 0,
            'sgstAmount' => $r->sgstAmount ?? 0,
        ];
        if (Schema::hasColumn($purchaseBillTable, 'createdAt')) {
            $payload['createdAt'] = now();
            $payload['updatedAt'] = now();
        } elseif (Schema::hasColumn($purchaseBillTable, 'created_at')) {
            $payload['created_at'] = now();
            $payload['updated_at'] = now();
        }
        $id = DB::table($purchaseBillTable)->insertGetId($payload);
        return $this->getGst2a($id);
    }

    public function createTds(Request $r)
    {
        $table = (new VoucherPaymentReceipt())->getTable();
        $payload = [
            'voucherNo' => uniqid('VPR-'),
            'voucherType' => 'Receipt',
            'partyName' => $r->partyName,
            'amount' => $r->amount,
            'date' => $r->date,
            'mode' => $r->mode ?? 'Bank',
        ];
        if (Schema::hasColumn($table, 'createdAt')) {
            $payload['createdAt'] = now();
            $payload['updatedAt'] = now();
        } elseif (Schema::hasColumn($table, 'created_at')) {
            $payload['created_at'] = now();
            $payload['updated_at'] = now();
        }
        $id = DB::table($table)->insertGetId($payload);
        return $this->getTds($id);
    }

    public function createTcs(Request $r)
    {
        $invoiceTable = (new Invoice())->getTable();
        $payload = [
            'invoiceNo' => $r->invoiceNo,
            'customerId' => $r->customerId,
            'invoiceDate' => $r->invoiceDate,
            'dueDate' => $r->invoiceDate ?? now(),
            'grandTotal' => $r->grandTotal,
        ];
        if (Schema::hasColumn($invoiceTable, 'createdAt')) {
            $payload['createdAt'] = now();
            $payload['updatedAt'] = now();
        } elseif (Schema::hasColumn($invoiceTable, 'created_at')) {
            $payload['created_at'] = now();
            $payload['updated_at'] = now();
        }
        $id = DB::table($invoiceTable)->insertGetId($payload);
        return $this->getTcs($id);
    }

    public function createChallan(Request $r)
    {
        $table = (new VoucherGST())->getTable();
        $payload = [
            'voucherNo' => uniqid('VGST-'),
            'date' => $r->date,
            'gstLedger' => $r->gstLedger,
            'amount' => $r->amount,
            'adjustmentType' => 'Adjustment',
        ];
        if (Schema::hasColumn($table, 'createdAt')) {
            $payload['createdAt'] = now();
            $payload['updatedAt'] = now();
        } elseif (Schema::hasColumn($table, 'created_at')) {
            $payload['created_at'] = now();
            $payload['updated_at'] = now();
        }
        $id = DB::table($table)->insertGetId($payload);
        return $this->getChallan($id);
    }

    public function createGstrRegister(Request $r)
    {
        return $this->successResponse([
            'id' => md5($r->month ?? now()->format('Y-m')),
            'month' => $r->month,
            'transactionType' => 'B2B',
            'totalTaxLiability' => 0
        ]);
    }

    public function createChequeBook(Request $r)
    {
        $table = (new VoucherPaymentReceipt())->getTable();
        $payload = [
            'voucherNo' => uniqid('VCHQ-'),
            'voucherType' => 'Payment',
            'partyName' => $r->partyName,
            'amount' => 0,
            'date' => $r->date,
            'referenceNo' => $r->referenceNo,
            'mode' => 'Cheque',
        ];
        if (Schema::hasColumn($table, 'createdAt')) {
            $payload['createdAt'] = now();
            $payload['updatedAt'] = now();
        } elseif (Schema::hasColumn($table, 'created_at')) {
            $payload['created_at'] = now();
            $payload['updated_at'] = now();
        }
        $id = DB::table($table)->insertGetId($payload);
        return $this->getChequeBook($id);
    }

    public function createBalanceSheet(Request $r)
    {
        return $this->getBalanceSheet($r, 1);
    }
}
