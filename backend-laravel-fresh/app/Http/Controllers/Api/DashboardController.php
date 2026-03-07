<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

use App\Models\Invoice;
use App\Models\Customer;
use App\Models\Vendor;
use App\Models\Product;
use App\Models\Employee;
use App\Models\PurchaseOrder;
use App\Models\GRN;
use App\Models\PurchaseBill;
use App\Models\SaleOrder;
use App\Models\Inquiry;
use App\Models\Quotation;
use App\Models\SalesReceiptVoucher;
use App\Models\DispatchAdvice;
use App\Models\BOMHeader;
use App\Models\ProductionRouteCard;
use App\Models\ProductionReport;
use App\Models\JobOrder;
use App\Models\JournalVoucher;
use App\Models\BankReconciliation;
use App\Models\CreditCardStatement;
use App\Models\EmployeeAdvance;
use App\Models\EmployeeSalarySheet;
use App\Models\Transporter;
use App\Models\Warehouse;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Helper to count a table safely
        $safeCount = function (string $table, ?array $where = null) {
            if (!Schema::hasTable($table)) return 0;
            $q = DB::table($table);
            if (Schema::hasColumn($table, 'deletedAt')) {
                $q->whereNull('deletedAt');
            }
            if ($where) {
                $q->where($where);
            }
            return $q->count();
        };

        // ── Sales stats ──
        $totalRevenue     = Invoice::whereNull('deletedAt')->sum('grandTotal');
        $totalInvoices    = Invoice::whereNull('deletedAt')->count();
        $totalCustomers   = Customer::whereNull('deletedAt')->count();
        $overdueInvoices  = Invoice::whereIn('status', ['Unpaid', 'Partial', 'Overdue'])
            ->where('dueDate', '<', now())
            ->whereNull('deletedAt')
            ->count();
        $totalInquiries   = Inquiry::whereNull('deletedAt')->count();
        $totalQuotations  = Quotation::whereNull('deletedAt')->count();
        $totalSaleOrders  = SaleOrder::whereNull('deletedAt')->count();
        $totalReceipts    = SalesReceiptVoucher::whereNull('deletedAt')->count();
        $totalDispatches  = DispatchAdvice::whereNull('deletedAt')->count();

        // ── Purchase stats ──
        $totalVendors     = Vendor::whereNull('deletedAt')->count();
        $totalPOs         = PurchaseOrder::whereNull('deletedAt')->count();
        $pendingPOs       = PurchaseOrder::where('status', 'Pending')->whereNull('deletedAt')->count();
        $totalGRNs        = GRN::whereNull('deletedAt')->count();
        $totalBills       = PurchaseBill::whereNull('deletedAt')->count();
        $unpaidBills      = PurchaseBill::where('status', 'Unpaid')->whereNull('deletedAt')->count();

        // ── Production stats ──
        $totalProducts    = Product::whereNull('deletedAt')->count();
        $totalBOMs        = BOMHeader::count();
        $totalRouteCards  = ProductionRouteCard::whereNull('deletedAt')->count();
        $totalReports     = ProductionReport::count();
        $totalJobOrders   = JobOrder::whereNull('deletedAt')->count();

        // ── HR stats ──
        $totalEmployees   = Employee::whereNull('deletedAt')->count();
        $pendingAdvances  = EmployeeAdvance::where('status', 'Pending')->count();
        $totalSalarySheets = EmployeeSalarySheet::count();

        // ── Finance stats ──
        $totalVouchers           = $safeCount('VoucherJournal') + $safeCount('VoucherPaymentReceipt') + $safeCount('VoucherContra') + $safeCount('VoucherGST');
        $totalBankReconciliations = BankReconciliation::count();
        $totalCreditCards        = CreditCardStatement::count();

        // ── Quality stats ──
        $totalIQC  = $safeCount('IQCRecord');
        $totalMTS  = $safeCount('QualityMTS');
        $totalPQC  = $safeCount('QualityPQC');
        $totalPDI  = $safeCount('QualityPDI');
        $totalQRD  = $safeCount('QualityQRD');

        // ── Warehouse stats ──
        $totalWarehouses = Warehouse::whereNull('deletedAt')->count();
        $totalTransfers  = $safeCount('WarehouseStockTransfer');

        // ── Logistics stats ──
        $totalTransporters = Transporter::whereNull('deletedAt')->count();

        // ── Maintenance stats ──
        $totalTools         = $safeCount('ToolMaster');
        $scheduledMaint     = $safeCount('ToolMaintenanceChart');
        $totalCalibrations  = $safeCount('ToolCalibrationReport');
        $totalRectifications = $safeCount('ToolRectificationMemo');

        // ── Assets stats ──
        $totalAssets       = $safeCount('FixedAssetMaster');
        $totalDepreciation = $safeCount('AssetDepreciationVoucher');

        // ── Contractors stats ──
        $totalContractWorkers = $safeCount('ContractorWorker');
        $totalContractorSheets = $safeCount('ContractorSalarySheet');

        // ── Statutory stats ──
        $totalGSTMaster = $safeCount('gst_masters') ?: $safeCount('GstMaster');

        return $this->successResponse([
            'stats' => [
                // Sales
                'totalRevenue'       => $totalRevenue,
                'totalInvoices'      => $totalInvoices,
                'totalCustomers'     => $totalCustomers,
                'overdueInvoices'    => $overdueInvoices,
                'totalInquiries'     => $totalInquiries,
                'totalQuotations'    => $totalQuotations,
                'totalSaleOrders'    => $totalSaleOrders,
                'totalReceipts'      => $totalReceipts,
                'totalDispatches'    => $totalDispatches,
                // Purchase
                'totalVendors'       => $totalVendors,
                'totalPurchaseOrders' => $totalPOs,
                'pendingPOs'         => $pendingPOs,
                'totalGRNs'          => $totalGRNs,
                'totalBills'         => $totalBills,
                'unpaidBills'        => $unpaidBills,
                // Production
                'totalProducts'      => $totalProducts,
                'totalBOMs'          => $totalBOMs,
                'totalRouteCards'    => $totalRouteCards,
                'totalReports'       => $totalReports,
                'totalJobOrders'     => $totalJobOrders,
                // HR
                'totalEmployees'     => $totalEmployees,
                'pendingAdvances'    => $pendingAdvances,
                'totalSalarySheets'  => $totalSalarySheets,
                // Finance
                'totalVouchers'      => $totalVouchers,
                'totalBankReconciliations' => $totalBankReconciliations,
                'totalCreditCards'   => $totalCreditCards,
                // Quality
                'totalIQC'           => $totalIQC,
                'totalMTS'           => $totalMTS,
                'totalPQC'           => $totalPQC,
                'totalPDI'           => $totalPDI,
                'totalQRD'           => $totalQRD,
                // Warehouse
                'totalWarehouses'    => $totalWarehouses,
                'totalTransfers'     => $totalTransfers,
                // Logistics
                'totalTransporters'  => $totalTransporters,
                // Maintenance
                'totalTools'         => $totalTools,
                'scheduledMaintenance' => $scheduledMaint,
                'totalCalibrations'  => $totalCalibrations,
                'totalRectifications' => $totalRectifications,
                // Assets
                'totalAssets'        => $totalAssets,
                'totalDepreciation'  => $totalDepreciation,
                // Contractors
                'totalContractWorkers' => $totalContractWorkers,
                'totalContractorSheets' => $totalContractorSheets,
                // Statutory
                'totalGSTMaster'     => $totalGSTMaster,
            ],
            'invoicesByStatus' => Invoice::whereNull('deletedAt')
                ->selectRaw("status, count(*) as _count, sum(grandTotal) as total")
                ->groupBy('status')
                ->get(),
            'moduleSummary' => [
                ['name' => 'Sales', 'count' => $totalInvoices + $totalSaleOrders + $totalInquiries],
                ['name' => 'Purchase', 'count' => $totalPOs + $totalGRNs + $totalBills],
                ['name' => 'Production', 'count' => $totalBOMs + $totalRouteCards + $totalReports],
                ['name' => 'HR', 'count' => $totalEmployees],
                ['name' => 'Finance', 'count' => $totalVouchers],
                ['name' => 'Quality', 'count' => $totalIQC + $totalMTS + $totalPQC + $totalPDI + $totalQRD],
                ['name' => 'Warehouse', 'count' => $totalWarehouses + $totalTransfers],
                ['name' => 'Maintenance', 'count' => $totalTools + $scheduledMaint],
                ['name' => 'Assets', 'count' => $totalAssets + $totalDepreciation],
                ['name' => 'Contractors', 'count' => $totalContractWorkers + $totalContractorSheets],
                ['name' => 'Logistics', 'count' => $totalTransporters + $totalDispatches],
                ['name' => 'Statutory', 'count' => $totalGSTMaster],
            ],
            'modules' => [
                'sales' => ['label' => 'Sales', 'route' => '/sales'],
                'purchase' => ['label' => 'Purchase', 'route' => '/purchase'],
                'production' => ['label' => 'Production', 'route' => '/production'],
                'simulation' => ['label' => 'Simulation', 'route' => '/simulation'],
                'finance' => ['label' => 'Finance', 'route' => '/finance'],
                'hr' => ['label' => 'HR', 'route' => '/hr'],
                'quality' => ['label' => 'Quality', 'route' => '/quality'],
                'warehouse' => ['label' => 'Warehouse', 'route' => '/warehouse'],
                'statutory' => ['label' => 'Statutory/GST', 'route' => '/statutory'],
                'logistics' => ['label' => 'Logistics', 'route' => '/logistics'],
                'contractors' => ['label' => 'Contractors', 'route' => '/contractors'],
                'maintenance' => ['label' => 'Maintenance', 'route' => '/maintenance'],
                'assets' => ['label' => 'Assets', 'route' => '/assets'],
            ],
        ]);
    }
}
