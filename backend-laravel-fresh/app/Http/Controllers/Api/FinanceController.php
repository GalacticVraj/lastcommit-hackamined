<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\JournalVoucher;
use App\Models\BankReconciliation;
use App\Models\CreditCardStatement;
use App\Models\VoucherJournal;
use App\Models\VoucherPaymentReceipt;
use App\Models\VoucherContra;
use App\Models\VoucherGST;
use App\Models\CollectionReminder;
use App\Models\Invoice;
use App\Models\PurchaseBill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    /**
     * Comprehensive Dashboard API with all aggregations for charts
     */
    public function dashboard()
    {
        // ─── KPI COUNTS ───────────────────────────────────────────────────────
        $totalJournalVouchers = VoucherJournal::count();
        $totalPaymentReceipts = VoucherPaymentReceipt::count();
        $totalContraVouchers = VoucherContra::count();
        $totalGSTVouchers = VoucherGST::count();
        $totalBankReconciliations = BankReconciliation::count();
        $totalCreditCardStatements = CreditCardStatement::count();

        // ─── AMOUNT SUMMARIES ─────────────────────────────────────────────────
        $totalJournalAmount = VoucherJournal::sum('amount') ?: 0;
        $totalPaymentAmount = VoucherPaymentReceipt::where('voucherType', 'Payment')->sum('amount') ?: 0;
        $totalReceiptAmount = VoucherPaymentReceipt::where('voucherType', 'Receipt')->sum('amount') ?: 0;
        $totalContraAmount = VoucherContra::sum('amount') ?: 0;
        $totalGSTAmount = VoucherGST::sum('amount') ?: 0;
        $totalCreditCardSpend = CreditCardStatement::sum('amount') ?: 0;

        // ─── MONTHLY TRANSACTION TRENDS (Last 6 months) ──────────────────────
        $monthlyTrends = $this->getMonthlyTransactionTrends();

        // ─── PAYMENT MODES BREAKDOWN ──────────────────────────────────────────
        $paymentModes = VoucherPaymentReceipt::select('mode', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('mode')
            ->get()
            ->map(fn($item) => [
                'name' => $item->mode,
                'value' => (float) $item->total,
                'count' => (int) $item->count,
            ]);

        // ─── GST INPUT VS OUTPUT ──────────────────────────────────────────────
        $gstInputTotal = VoucherGST::where('gstLedger', 'Input')->sum('amount') ?: 0;
        $gstOutputTotal = VoucherGST::where('gstLedger', 'Output')->sum('amount') ?: 0;
        $gstBreakdown = [
            ['name' => 'Input GST', 'value' => (float) $gstInputTotal],
            ['name' => 'Output GST', 'value' => (float) $gstOutputTotal],
        ];

        // ─── BANK RECONCILIATION STATUS ───────────────────────────────────────
        $bankReconciledCount = BankReconciliation::where('status', 'Reconciled')->count();
        $bankPendingCount = BankReconciliation::where('status', 'Pending')->count();
        $bankReconciledAmount = BankReconciliation::where('status', 'Reconciled')->sum('bankBalance') ?: 0;
        $bankPendingAmount = BankReconciliation::where('status', 'Pending')->sum('bankBalance') ?: 0;
        $bankReconciliationStatus = [
            ['name' => 'Reconciled', 'count' => $bankReconciledCount, 'amount' => (float) $bankReconciledAmount],
            ['name' => 'Pending', 'count' => $bankPendingCount, 'amount' => (float) $bankPendingAmount],
        ];

        // ─── CREDIT CARD SPEND BY EXPENSE HEAD ────────────────────────────────
        $creditCardByExpenseHead = CreditCardStatement::select('expenseHead', DB::raw('SUM(amount) as total'))
            ->whereNotNull('expenseHead')
            ->groupBy('expenseHead')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->expenseHead,
                    'value' => (float) $item->total,
                ];
            });

        // ─── RECENT TRANSACTIONS ──────────────────────────────────────────────
        $recentTransactions = $this->getRecentTransactions(10);

        // ─── VOUCHER TYPE DISTRIBUTION ────────────────────────────────────────
        $voucherTypeDistribution = [
            ['name' => 'Journal', 'value' => $totalJournalVouchers, 'amount' => (float) $totalJournalAmount],
            ['name' => 'Payment', 'value' => VoucherPaymentReceipt::where('voucherType', 'Payment')->count(), 'amount' => (float) $totalPaymentAmount],
            ['name' => 'Receipt', 'value' => VoucherPaymentReceipt::where('voucherType', 'Receipt')->count(), 'amount' => (float) $totalReceiptAmount],
            ['name' => 'Contra', 'value' => $totalContraVouchers, 'amount' => (float) $totalContraAmount],
            ['name' => 'GST', 'value' => $totalGSTVouchers, 'amount' => (float) $totalGSTAmount],
        ];

        return $this->successResponse([
            'stats' => [
                'totalJournalVouchers' => $totalJournalVouchers,
                'totalPaymentReceipts' => $totalPaymentReceipts,
                'totalContraVouchers' => $totalContraVouchers,
                'totalGSTVouchers' => $totalGSTVouchers,
                'totalBankReconciliations' => $totalBankReconciliations,
                'totalCreditCardStatements' => $totalCreditCardStatements,
                'totalJournalAmount' => (float) $totalJournalAmount,
                'totalPaymentAmount' => (float) $totalPaymentAmount,
                'totalReceiptAmount' => (float) $totalReceiptAmount,
                'totalContraAmount' => (float) $totalContraAmount,
                'totalGSTAmount' => (float) $totalGSTAmount,
                'totalCreditCardSpend' => (float) $totalCreditCardSpend,
            ],
            'charts' => [
                'monthlyTrends' => $monthlyTrends,
                'paymentModes' => $paymentModes,
                'gstBreakdown' => $gstBreakdown,
                'bankReconciliationStatus' => $bankReconciliationStatus,
                'creditCardByExpenseHead' => $creditCardByExpenseHead,
                'voucherTypeDistribution' => $voucherTypeDistribution,
            ],
            'recentTransactions' => $recentTransactions,
        ]);
    }

    /**
     * Get monthly transaction trends for the last 6 months
     */
    private function getMonthlyTransactionTrends()
    {
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $monthKey = $date->format('Y-m');
            $monthLabel = $date->format('M Y');

            $journalTotal = VoucherJournal::whereYear('date', $date->year)
                ->whereMonth('date', $date->month)
                ->sum('amount') ?: 0;

            $paymentTotal = VoucherPaymentReceipt::where('voucherType', 'Payment')
                ->whereYear('date', $date->year)
                ->whereMonth('date', $date->month)
                ->sum('amount') ?: 0;

            $receiptTotal = VoucherPaymentReceipt::where('voucherType', 'Receipt')
                ->whereYear('date', $date->year)
                ->whereMonth('date', $date->month)
                ->sum('amount') ?: 0;

            $contraTotal = VoucherContra::whereYear('date', $date->year)
                ->whereMonth('date', $date->month)
                ->sum('amount') ?: 0;

            $gstTotal = VoucherGST::whereYear('date', $date->year)
                ->whereMonth('date', $date->month)
                ->sum('amount') ?: 0;

            $months[] = [
                'month' => $monthLabel,
                'journal' => (float) $journalTotal,
                'payment' => (float) $paymentTotal,
                'receipt' => (float) $receiptTotal,
                'contra' => (float) $contraTotal,
                'gst' => (float) $gstTotal,
                'total' => (float) ($journalTotal + $paymentTotal + $receiptTotal + $contraTotal + $gstTotal),
            ];
        }
        return $months;
    }

    /**
     * Get recent transactions across all voucher types
     */
    private function getRecentTransactions($limit = 10)
    {
        $transactions = collect();

        // Journal Vouchers
        VoucherJournal::latest('createdAt')->limit($limit)->get()->each(function ($v) use (&$transactions) {
            $transactions->push([
                'id' => $v->id,
                'type' => 'Journal',
                'voucherNo' => $v->journalNo,
                'date' => $v->date,
                'amount' => (float) $v->amount,
                'description' => $v->narration,
                'createdAt' => $v->createdAt,
            ]);
        });

        // Payment/Receipt Vouchers
        VoucherPaymentReceipt::latest('createdAt')->limit($limit)->get()->each(function ($v) use (&$transactions) {
            $transactions->push([
                'id' => $v->id,
                'type' => $v->voucherType,
                'voucherNo' => $v->voucherNo,
                'date' => $v->date,
                'amount' => (float) $v->amount,
                'description' => $v->partyName . ' (' . $v->mode . ')',
                'createdAt' => $v->createdAt,
            ]);
        });

        // Contra Vouchers
        VoucherContra::latest('createdAt')->limit($limit)->get()->each(function ($v) use (&$transactions) {
            $transactions->push([
                'id' => $v->id,
                'type' => 'Contra',
                'voucherNo' => $v->voucherNo,
                'date' => $v->date,
                'amount' => (float) $v->amount,
                'description' => $v->fromAccount . ' → ' . $v->toAccount,
                'createdAt' => $v->createdAt,
            ]);
        });

        // GST Vouchers
        VoucherGST::latest('createdAt')->limit($limit)->get()->each(function ($v) use (&$transactions) {
            $transactions->push([
                'id' => $v->id,
                'type' => 'GST',
                'voucherNo' => $v->voucherNo,
                'date' => $v->date,
                'amount' => (float) $v->amount,
                'description' => $v->gstLedger . ' - ' . $v->adjustmentType,
                'createdAt' => $v->createdAt,
            ]);
        });

        return $transactions->sortByDesc('createdAt')->take($limit)->values();
    }

    // ─── VOUCHER JOURNAL (4.1) ────────────────────────────────────────────────
    public function listVoucherJournals(Request $request)
    {
        $query = VoucherJournal::query();
        $query = $this->applySorting($query, $request, 'createdAt');
        return $this->paginatedResponse($query->paginate($request->get('per_page', 25)));
    }

    public function createVoucherJournal(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'debitAccount' => 'required|string',
            'creditAccount' => 'required|string',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $journalNo = $this->generateVoucherNo('JV');
        $voucher = VoucherJournal::create([
            'journalNo' => $journalNo,
            'date' => $request->date,
            'debitAccount' => $request->debitAccount,
            'creditAccount' => $request->creditAccount,
            'amount' => $request->amount,
            'narration' => $request->narration,
            'createdBy' => $request->user()->id,
        ]);
        return $this->successResponse($voucher, 'Journal Voucher created', 201);
    }

    public function getVoucherJournal($id)
    {
        return $this->successResponse(VoucherJournal::findOrFail($id));
    }

    public function updateVoucherJournal(Request $request, $id)
    {
        $voucher = VoucherJournal::findOrFail($id);
        $voucher->update($request->only(['date', 'debitAccount', 'creditAccount', 'amount', 'narration']));
        return $this->successResponse($voucher, 'Journal Voucher updated');
    }

    public function deleteVoucherJournal($id)
    {
        VoucherJournal::findOrFail($id)->delete();
        return $this->successResponse(null, 'Journal Voucher deleted');
    }

    // ─── VOUCHER PAYMENT & RECEIPT (4.2) ──────────────────────────────────────
    public function listVoucherPaymentReceipts(Request $request)
    {
        $query = VoucherPaymentReceipt::query();
        if ($request->has('type')) {
            $query->where('voucherType', $request->type);
        }
        $query = $this->applySorting($query, $request, 'createdAt');
        return $this->paginatedResponse($query->paginate($request->get('per_page', 25)));
    }

    public function createVoucherPaymentReceipt(Request $request)
    {
        $request->validate([
            'voucherType' => 'required|in:Payment,Receipt',
            'date' => 'required|date',
            'partyName' => 'required|string',
            'amount' => 'required|numeric|min:0.01',
            'mode' => 'required|in:Cash,Bank,Cheque,Online,UPI,Card',
        ]);

        $prefix = $request->voucherType === 'Payment' ? 'PV' : 'RV';
        $voucherNo = $this->generateVoucherNo($prefix);
        $voucher = VoucherPaymentReceipt::create([
            'voucherNo' => $voucherNo,
            'voucherType' => $request->voucherType,
            'date' => $request->date,
            'partyName' => $request->partyName,
            'amount' => $request->amount,
            'mode' => $request->mode,
            'referenceNo' => $request->referenceNo,
            'remarks' => $request->remarks,
            'createdBy' => $request->user()->id,
        ]);
        return $this->successResponse($voucher, 'Payment/Receipt Voucher created', 201);
    }

    public function getVoucherPaymentReceipt($id)
    {
        return $this->successResponse(VoucherPaymentReceipt::findOrFail($id));
    }

    public function updateVoucherPaymentReceipt(Request $request, $id)
    {
        $voucher = VoucherPaymentReceipt::findOrFail($id);
        $voucher->update($request->only(['voucherType', 'date', 'partyName', 'amount', 'mode', 'referenceNo', 'remarks']));
        return $this->successResponse($voucher, 'Payment/Receipt Voucher updated');
    }

    public function deleteVoucherPaymentReceipt($id)
    {
        VoucherPaymentReceipt::findOrFail($id)->delete();
        return $this->successResponse(null, 'Payment/Receipt Voucher deleted');
    }

    // ─── VOUCHER CONTRA (4.3) ─────────────────────────────────────────────────
    public function listVoucherContras(Request $request)
    {
        $query = VoucherContra::query();
        $query = $this->applySorting($query, $request, 'createdAt');
        return $this->paginatedResponse($query->paginate($request->get('per_page', 25)));
    }

    public function createVoucherContra(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'fromAccount' => 'required|string',
            'toAccount' => 'required|string',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $voucherNo = $this->generateVoucherNo('CV');
        $voucher = VoucherContra::create([
            'voucherNo' => $voucherNo,
            'date' => $request->date,
            'fromAccount' => $request->fromAccount,
            'toAccount' => $request->toAccount,
            'amount' => $request->amount,
            'remarks' => $request->remarks,
            'createdBy' => $request->user()->id,
        ]);
        return $this->successResponse($voucher, 'Contra Voucher created', 201);
    }

    public function getVoucherContra($id)
    {
        return $this->successResponse(VoucherContra::findOrFail($id));
    }

    public function updateVoucherContra(Request $request, $id)
    {
        $voucher = VoucherContra::findOrFail($id);
        $voucher->update($request->only(['date', 'fromAccount', 'toAccount', 'amount', 'remarks']));
        return $this->successResponse($voucher, 'Contra Voucher updated');
    }

    public function deleteVoucherContra($id)
    {
        VoucherContra::findOrFail($id)->delete();
        return $this->successResponse(null, 'Contra Voucher deleted');
    }

    // ─── JOURNAL VOUCHER GST (4.4) ────────────────────────────────────────────
    public function listVoucherGSTs(Request $request)
    {
        $query = VoucherGST::query();
        if ($request->has('ledger')) {
            $query->where('gstLedger', $request->ledger);
        }
        $query = $this->applySorting($query, $request, 'createdAt');
        return $this->paginatedResponse($query->paginate($request->get('per_page', 25)));
    }

    public function createVoucherGST(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'gstLedger' => 'required|in:Input,Output',
            'adjustmentType' => 'required|in:Reversal,Adjustment,Correction,Refund',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $voucherNo = $this->generateVoucherNo('GV');
        $voucher = VoucherGST::create([
            'voucherNo' => $voucherNo,
            'date' => $request->date,
            'gstLedger' => $request->gstLedger,
            'adjustmentType' => $request->adjustmentType,
            'amount' => $request->amount,
            'remarks' => $request->remarks,
            'createdBy' => $request->user()->id,
        ]);
        return $this->successResponse($voucher, 'GST Voucher created', 201);
    }

    public function getVoucherGST($id)
    {
        return $this->successResponse(VoucherGST::findOrFail($id));
    }

    public function updateVoucherGST(Request $request, $id)
    {
        $voucher = VoucherGST::findOrFail($id);
        $voucher->update($request->only(['date', 'gstLedger', 'adjustmentType', 'amount', 'remarks']));
        return $this->successResponse($voucher, 'GST Voucher updated');
    }

    public function deleteVoucherGST($id)
    {
        VoucherGST::findOrFail($id)->delete();
        return $this->successResponse(null, 'GST Voucher deleted');
    }

    // ─── LEGACY METHODS (keeping for backward compatibility) ─────────────────
    public function listVouchers(Request $request)
    {
        $query = JournalVoucher::latest();
        return $this->paginatedResponse($query->paginate(25));
    }

    public function createVoucher(Request $request)
    {
        $vNo = $this->generateVoucherNo('JV');
        $v = JournalVoucher::create($request->all() + ['voucherNo' => $vNo, 'createdBy' => $request->user()->id]);
        return $this->successResponse($v, 'Voucher created', 201);
    }

    public function getVoucher($id)
    {
        return $this->successResponse(JournalVoucher::findOrFail($id));
    }

    public function updateVoucher(Request $request, $id)
    {
        $v = JournalVoucher::findOrFail($id);
        $v->update($request->all());
        return $this->successResponse($v, 'Updated');
    }

    public function deleteVoucher($id)
    {
        JournalVoucher::destroy($id);
        return $this->successResponse(null, 'Deleted');
    }

    // ─── 4.5 BANK RECONCILIATION ──────────────────────────────────────────────
    public function listBankReconciliations(Request $request)
    {
        $query = BankReconciliation::query();
        if ($request->has('bankAccount')) {
            $query->where('bankAccount', $request->bankAccount);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        $query = $this->applySorting($query, $request, 'createdAt');
        return $this->paginatedResponse($query->paginate($request->get('per_page', 25)));
    }

    public function createBankReconciliation(Request $request)
    {
        $request->validate([
            'bankAccount' => 'required|string',
            'statementDate' => 'required|date',
            'systemBalance' => 'required|numeric',
            'bankBalance' => 'required|numeric',
        ]);

        $unreconciledAmt = abs($request->bankBalance - $request->systemBalance);

        $reconciliation = BankReconciliation::create([
            'bankAccount' => $request->bankAccount,
            'statementDate' => $request->statementDate,
            'systemBalance' => $request->systemBalance,
            'bankBalance' => $request->bankBalance,
            'unreconciledAmt' => $unreconciledAmt,
            'status' => $unreconciledAmt == 0 ? 'Reconciled' : 'Pending',
            'isActive' => true,
            'createdBy' => $request->user()->id,
        ]);
        return $this->successResponse($reconciliation, 'Bank Reconciliation created', 201);
    }

    public function getBankReconciliation($id)
    {
        return $this->successResponse(BankReconciliation::findOrFail($id));
    }

    public function updateBankReconciliation(Request $request, $id)
    {
        $reconciliation = BankReconciliation::findOrFail($id);
        $data = $request->only(['bankAccount', 'statementDate', 'systemBalance', 'bankBalance', 'status']);

        if (isset($data['systemBalance']) && isset($data['bankBalance'])) {
            $data['unreconciledAmt'] = abs($data['bankBalance'] - $data['systemBalance']);
        }

        $reconciliation->update($data);
        return $this->successResponse($reconciliation, 'Bank Reconciliation updated');
    }

    public function deleteBankReconciliation($id)
    {
        BankReconciliation::destroy($id);
        return $this->successResponse(null, 'Bank Reconciliation deleted');
    }

    public function matchBankReconciliation(Request $request, $id)
    {
        $reconciliation = BankReconciliation::findOrFail($id);
        $reconciliation->update([
            'status' => 'Reconciled',
            'unreconciledAmt' => 0,
        ]);
        return $this->successResponse($reconciliation, 'Bank matched successfully');
    }

    // ─── 4.6 CREDIT CARD STATEMENT ────────────────────────────────────────────
    public function listCreditCardStatements(Request $request)
    {
        $query = CreditCardStatement::query();
        if ($request->has('cardNo')) {
            $query->where('cardNo', $request->cardNo);
        }
        if ($request->has('statementMonth')) {
            $query->where('statementMonth', $request->statementMonth);
        }
        $query = $this->applySorting($query, $request, 'createdAt');
        return $this->paginatedResponse($query->paginate($request->get('per_page', 25)));
    }

    public function createCreditCardStatement(Request $request)
    {
        $request->validate([
            'cardNo' => 'required|string',
            'statementMonth' => 'required|string',
            'transactionDate' => 'required|date',
            'merchant' => 'required|string',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $statement = CreditCardStatement::create([
            'cardNo' => $request->cardNo,
            'statementMonth' => $request->statementMonth,
            'transactionDate' => $request->transactionDate,
            'merchant' => $request->merchant,
            'amount' => $request->amount,
            'description' => $request->description ?? $request->expenseHead ?? '',
            'createdBy' => $request->user()->id,
        ]);
        return $this->successResponse($statement, 'Credit Card Statement created', 201);
    }

    public function getCreditCardStatement($id)
    {
        return $this->successResponse(CreditCardStatement::findOrFail($id));
    }

    public function updateCreditCardStatement(Request $request, $id)
    {
        $statement = CreditCardStatement::findOrFail($id);
        $statement->update($request->only(['cardNo', 'statementMonth', 'transactionDate', 'merchant', 'amount', 'description']));
        return $this->successResponse($statement, 'Credit Card Statement updated');
    }

    public function deleteCreditCardStatement($id)
    {
        CreditCardStatement::destroy($id);
        return $this->successResponse(null, 'Credit Card Statement deleted');
    }

    public function listBankReconciliation(Request $request)
    {
        return $this->listBankReconciliations($request);
    }

    public function listCreditCard(Request $request)
    {
        return $this->listCreditCardStatements($request);
    }

    // ─── HELPER METHODS ───────────────────────────────────────────────────────

    public function listReminders(Request $request)
    {
        $query = CollectionReminder::with('invoice.customer');
        $query = $this->applySorting($query, $request, 'createdAt');
        return $this->paginatedResponse($query->paginate($request->get('per_page', 25)));
    }

    public function createReminder(Request $request)
    {
        $request->validate([
            'invoiceId' => 'required|exists:Invoice,id',
            'triggerType' => 'required|string',
            'scheduledAt' => 'required|date',
        ]);

        $reminder = CollectionReminder::create([
            'invoiceId' => $request->invoiceId,
            'triggerType' => $request->triggerType,
            'scheduledAt' => $request->scheduledAt,
            'status' => 'Pending',
        ]);

        return $this->successResponse($reminder, 'Reminder Created', 201);
    }

    public function profitLoss(Request $request)
    {
        $year = $request->get('year', date('Y'));

        // Simplified P&L data extraction
        // Sales = Invoices grand total
        // Expenses = PurchaseBills grand total + VoucherPaymentReceipt (Payment)

        $salesByMonth = DB::table('Invoice')
            ->whereNull('deletedAt')
            ->whereRaw("strftime('%Y', invoiceDate) = ?", [$year])
            ->selectRaw("strftime('%m', invoiceDate) as month, SUM(grandTotal) as total")
            ->groupBy('month')
            ->pluck('total', 'month');

        $purchaseByMonth = DB::table('PurchaseBill')
            ->whereNull('deletedAt')
            ->whereRaw("strftime('%Y', billDate) = ?", [$year])
            ->selectRaw("strftime('%m', billDate) as month, SUM(grandTotal) as total")
            ->groupBy('month')
            ->pluck('total', 'month');

        $reports = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthStr = str_pad($m, 2, '0', STR_PAD_LEFT);
            $sales = (float) ($salesByMonth[$monthStr] ?? 0);
            $purchase = (float) ($purchaseByMonth[$monthStr] ?? 0);

            // Only add to report if there's activity or if it's the current year's months up to now
            if ($sales > 0 || $purchase > 0 || ($year == date('Y') && $m <= date('n'))) {
                $reports[] = [
                    'id' => $m,
                    'period' => date('F Y', mktime(0, 0, 0, $m, 1, $year)),
                    'salesTotal' => $sales,
                    'cogs' => round($purchase * 0.7, 2),
                    'expenses' => round($purchase * 0.2, 2),
                    'netProfit' => round($sales - ($purchase * 0.9), 2),
                ];
            }
        }

        return $this->successResponse([
            'year' => $year,
            'reports' => $reports
        ]);
    }


    private function generateVoucherNo($prefix)
    {
        $year = date('Y');
        $month = date('m');

        $models = [
            'JV' => VoucherJournal::class,
            'PV' => VoucherPaymentReceipt::class,
            'RV' => VoucherPaymentReceipt::class,
            'CV' => VoucherContra::class,
            'GV' => VoucherGST::class,
        ];

        $model = $models[$prefix] ?? VoucherJournal::class;
        $column = $prefix === 'JV' ? 'journalNo' : 'voucherNo';

        $lastVoucher = $model::where($column, 'like', "{$prefix}-{$year}{$month}-%")
            ->orderBy('id', 'desc')
            ->first();

        if ($lastVoucher) {
            $lastNo = (int) substr($lastVoucher->$column, -4);
            $newNo = str_pad($lastNo + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNo = '0001';
        }

        return "{$prefix}-{$year}{$month}-{$newNo}";
    }
}
