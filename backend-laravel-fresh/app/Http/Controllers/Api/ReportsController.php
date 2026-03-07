<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

use App\Models\Invoice;
use App\Models\PurchaseOrder;
use App\Models\PurchaseBill;
use App\Models\ProductionReport;
use App\Models\Inquiry;
use App\Models\SalesReceiptVoucher;
use App\Models\Product;
use App\Models\EmployeeSalarySheet;
use App\Models\BankReconciliation;
use App\Models\VoucherPaymentReceipt;
use App\Models\SimulationRun;
use App\Models\CommunicationLog;

class ReportsController extends Controller
{
    private function dateBounds(Request $request): array
    {
        $from = $request->get('from');
        $to = $request->get('to');
        return [$from, $to];
    }

    private function applyDateFilter($query, ?string $column, ?string $from, ?string $to)
    {
        if (!$column) {
            return $query;
        }
        if ($from) {
            $query->whereDate($column, '>=', $from);
        }
        if ($to) {
            $query->whereDate($column, '<=', $to);
        }
        return $query;
    }

    private function balanceSheetData(?string $asOnDate = null): array
    {
        $invoiceTable = (new Invoice())->getTable();
        $purchaseBillTable = (new PurchaseBill())->getTable();
        $assetTable = 'FixedAssetMaster';

        $totalSales = (float) DB::table($invoiceTable)->sum('grandTotal');
        $totalPurchases = (float) DB::table($purchaseBillTable)->sum('grandTotal');
        $bankBalance = (float) BankReconciliation::query()->sum('bankBalance');
        $fixedAssets = Schema::hasTable($assetTable) ? (float) DB::table($assetTable)->sum('currentValue') : 0.0;

        $capitalAccount = round($fixedAssets + max(0, $totalSales - $totalPurchases) * 0.4, 2);
        $currentAssets = round($bankBalance + max(0, $totalSales - ($totalPurchases * 0.6)), 2);
        $assetsTotal = round($fixedAssets + $currentAssets, 2);
        $liabilitiesTotal = round(max(0, $totalPurchases * 0.85), 2);

        return [
            'asOnDate' => $asOnDate ?: now()->toDateString(),
            'assetsTotal' => $assetsTotal,
            'liabilitiesTotal' => $liabilitiesTotal,
            'capitalAccount' => $capitalAccount,
            'currentAssets' => $currentAssets,
        ];
    }

    public function salesReport(Request $request)
    {
        $monthlyRevenue = Invoice::selectRaw("strftime('%Y-%m', invoiceDate) as month, SUM(grandTotal) as revenue")
            ->groupBy('month')->orderBy('month', 'desc')->get();
        $topCustomers = Invoice::selectRaw("customerId, SUM(grandTotal) as total")->with('customer:id,name')
            ->groupBy('customerId')->orderBy('total', 'desc')->limit(5)->get();
        return $this->successResponse(['monthlyRevenue' => $monthlyRevenue, 'topCustomers' => $topCustomers]);
    }
    public function purchaseReport(Request $request)
    {
        $monthlyPurchase = PurchaseOrder::selectRaw("strftime('%Y-%m', poDate) as month, SUM(totalAmount) as total")
            ->groupBy('month')->orderBy('month', 'desc')->get();
        return $this->successResponse(['monthlyPurchase' => $monthlyPurchase]);
    }
    public function productionReport(Request $request)
    {
        $productionSummary = ProductionReport::selectRaw("productId, SUM(productionQty) as total")
            ->with('product:id,name')->groupBy('productId')->get();
        return $this->successResponse(['summary' => $productionSummary]);
    }
    public function financeReport(Request $request)
    {
        return $this->successResponse(['report' => 'Finance report processed']);
    }

    public function generate(Request $request, string $type)
    {
        [$from, $to] = $this->dateBounds($request);

        switch ($type) {
            case 'sales-register':
                $rows = Invoice::query()
                    ->leftJoin('Customer as c', 'Invoice.customerId', '=', 'c.id')
                    ->select('Invoice.id', 'Invoice.invoiceNo', 'Invoice.invoiceDate', 'c.name as customerName', 'Invoice.taxableValue', 'Invoice.grandTotal', 'Invoice.status')
                    ->orderByDesc('Invoice.id');
                $this->applyDateFilter($rows, 'Invoice.invoiceDate', $from, $to);
                return $this->successResponse($rows->limit(500)->get());

            case 'purchase-register':
                $rows = PurchaseOrder::query()
                    ->leftJoin('Vendor as v', 'PurchaseOrder.vendorId', '=', 'v.id')
                    ->select('PurchaseOrder.id', 'PurchaseOrder.poNo', 'PurchaseOrder.poDate', 'v.name as vendorName', 'PurchaseOrder.totalAmount', 'PurchaseOrder.status')
                    ->orderByDesc('PurchaseOrder.id');
                $this->applyDateFilter($rows, 'PurchaseOrder.poDate', $from, $to);
                return $this->successResponse($rows->limit(500)->get());

            case 'stock-ledger':
            case 'inventory-valuation':
                $rows = Product::query()
                    ->select('id', 'code', 'name', 'category', 'unit', 'currentStock', 'standardCost')
                    ->orderBy('name')
                    ->get()
                    ->map(function ($row) {
                        $cost = (float) ($row->standardCost ?? 0);
                        return [
                            'id' => $row->id,
                            'code' => $row->code,
                            'name' => $row->name,
                            'category' => $row->category,
                            'currentStock' => (float) ($row->currentStock ?? 0),
                            'unitCost' => $cost,
                            'stockValue' => round(((float) ($row->currentStock ?? 0)) * $cost, 2),
                        ];
                    });
                return $this->successResponse($rows);

            case 'outstanding-receivables':
                $rows = Invoice::query()
                    ->leftJoin('Customer as c', 'Invoice.customerId', '=', 'c.id')
                    ->whereNotIn('Invoice.status', ['Paid'])
                    ->select('Invoice.id', 'Invoice.invoiceNo', 'Invoice.invoiceDate', 'Invoice.dueDate', 'c.name as customerName', 'Invoice.grandTotal as outstandingAmount', 'Invoice.status')
                    ->orderByDesc('Invoice.id');
                $this->applyDateFilter($rows, 'Invoice.invoiceDate', $from, $to);
                return $this->successResponse($rows->limit(500)->get());

            case 'outstanding-payables':
                $rows = PurchaseBill::query()
                    ->leftJoin('Vendor as v', 'PurchaseBill.vendorId', '=', 'v.id')
                    ->whereNotIn('PurchaseBill.status', ['Paid'])
                    ->select('PurchaseBill.id', 'PurchaseBill.billNo', 'PurchaseBill.billDate', 'PurchaseBill.dueDate', 'v.name as vendorName', 'PurchaseBill.grandTotal as outstandingAmount', 'PurchaseBill.status')
                    ->orderByDesc('PurchaseBill.id');
                $this->applyDateFilter($rows, 'PurchaseBill.billDate', $from, $to);
                return $this->successResponse($rows->limit(500)->get());

            case 'daily-production':
                $rows = ProductionReport::query()
                    ->leftJoin('products as p', 'ProductionReport.productId', '=', 'p.id')
                    ->select('ProductionReport.id', 'ProductionReport.reportDate', 'p.name as productName', 'ProductionReport.productionQty', 'ProductionReport.rejectionQty', 'ProductionReport.remarks')
                    ->orderByDesc('ProductionReport.id');
                $this->applyDateFilter($rows, 'ProductionReport.reportDate', $from, $to);
                return $this->successResponse($rows->limit(500)->get());

            case 'material-consumption':
                if (!Schema::hasTable('BOMItem')) {
                    return $this->successResponse([]);
                }
                $rows = DB::table('BOMItem as bi')
                    ->leftJoin('products as p', 'bi.productId', '=', 'p.id')
                    ->select('bi.id', 'bi.bomId', 'p.code as productCode', 'p.name as materialName', 'bi.quantity')
                    ->orderByDesc('bi.id')
                    ->limit(500)
                    ->get();
                return $this->successResponse($rows);

            case 'gst-summary':
                $output = (float) Invoice::query()->selectRaw('SUM(COALESCE(igstAmount,0)+COALESCE(cgstAmount,0)+COALESCE(sgstAmount,0)) as total')->value('total');
                $input = (float) PurchaseBill::query()->selectRaw('SUM(COALESCE(igstAmount,0)+COALESCE(cgstAmount,0)+COALESCE(sgstAmount,0)) as total')->value('total');
                return $this->successResponse([
                    'outputTax' => $output,
                    'inputTaxCredit' => $input,
                    'netLiability' => round($output - $input, 2),
                ]);

            case 'payroll-summary':
                $rows = EmployeeSalarySheet::query()
                    ->leftJoin('Employee as e', 'EmployeeSalarySheet.employeeId', '=', 'e.id')
                    ->select('EmployeeSalarySheet.id', 'EmployeeSalarySheet.month', 'EmployeeSalarySheet.year', 'e.name as employeeName', 'EmployeeSalarySheet.grossSalary', 'EmployeeSalarySheet.netPay as netSalary')
                    ->orderByDesc('EmployeeSalarySheet.id');
                return $this->successResponse($rows->limit(500)->get());

            case 'collection-efficiency':
                $invoiced = (float) Invoice::sum('grandTotal');
                $received = (float) SalesReceiptVoucher::sum('amount');
                $efficiency = $invoiced > 0 ? round(($received / $invoiced) * 100, 2) : 0;
                return $this->successResponse([
                    'totalInvoiced' => $invoiced,
                    'totalReceived' => $received,
                    'efficiencyPercent' => $efficiency,
                ]);

            case 'vendor-performance':
                $rows = PurchaseOrder::query()
                    ->leftJoin('Vendor as v', 'PurchaseOrder.vendorId', '=', 'v.id')
                    ->selectRaw('v.id as vendorId, COALESCE(v.name, "Unknown") as vendorName, COUNT(PurchaseOrder.id) as totalOrders, SUM(COALESCE(PurchaseOrder.totalAmount,0)) as totalValue')
                    ->groupBy('v.id', 'v.name')
                    ->orderByDesc('totalValue')
                    ->limit(50)
                    ->get();
                return $this->successResponse($rows);

            case 'job-work-summary':
                if (!Schema::hasTable('JobOrder')) {
                    return $this->successResponse([]);
                }
                $rows = DB::table('JobOrder')
                    ->select('id', 'jobOrderNo', 'contractorName', 'processRequired', 'status', 'createdAt')
                    ->orderByDesc('id')
                    ->limit(500)
                    ->get();
                return $this->successResponse($rows);

            case 'asset-depreciation':
                if (!Schema::hasTable('AssetDepreciationVoucher') || !Schema::hasTable('FixedAssetMaster')) {
                    return $this->successResponse([]);
                }
                $rows = DB::table('AssetDepreciationVoucher as v')
                    ->leftJoin('FixedAssetMaster as a', 'v.assetId', '=', 'a.id')
                    ->select('v.id', 'v.year', 'a.assetTag', 'a.name as assetName', 'v.openingBalance', 'v.depreciationAmount', 'v.closingBalance')
                    ->orderByDesc('v.id')
                    ->limit(500)
                    ->get();
                return $this->successResponse($rows);

            case 'pnl':
                $revenue = (float) Invoice::sum('grandTotal');
                $cost = (float) PurchaseBill::sum('grandTotal');
                $grossProfit = round($revenue - $cost, 2);
                return $this->successResponse([
                    'totalRevenue' => $revenue,
                    'totalCost' => $cost,
                    'grossProfit' => $grossProfit,
                    'netMarginPercent' => $revenue > 0 ? round(($grossProfit / $revenue) * 100, 2) : 0,
                ]);

            case 'balance-sheet':
                return $this->successResponse($this->balanceSheetData($request->get('to')));

            case 'bank-reconciliation':
                $rows = BankReconciliation::query()
                    ->select('id', 'bankAccount', 'statementDate', 'systemBalance', 'bankBalance', 'status')
                    ->orderByDesc('id')
                    ->limit(500)
                    ->get();
                return $this->successResponse($rows);

            case 'tds-tcs':
                $tds = VoucherPaymentReceipt::query()->sum(DB::raw('COALESCE(amount,0) * 0.01'));
                $tcs = Invoice::query()->sum(DB::raw('COALESCE(grandTotal,0) * 0.001'));
                return $this->successResponse([
                    'totalTds' => round((float) $tds, 2),
                    'totalTcs' => round((float) $tcs, 2),
                    'netTax' => round((float) $tds + (float) $tcs, 2),
                ]);

            case 'simulation-result':
                if (!Schema::hasTable('SimulationRun')) {
                    return $this->successResponse([]);
                }
                $rows = SimulationRun::query()->orderByDesc('id')->limit(100)->get();
                return $this->successResponse($rows);

            case 'communication-log':
                if (!Schema::hasTable('CommunicationLog')) {
                    return $this->successResponse([]);
                }
                $rows = CommunicationLog::query()->orderByDesc('id')->limit(500)->get();
                return $this->successResponse($rows);

            default:
                return $this->errorResponse('Unsupported report type', 404);
        }
    }
}
