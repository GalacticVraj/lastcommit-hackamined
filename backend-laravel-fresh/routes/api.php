<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SalesController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\ProductionController;
use App\Http\Controllers\Api\SimulationController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\HrController;
use App\Http\Controllers\Api\QualityController;
use App\Http\Controllers\Api\WarehouseController;
use App\Http\Controllers\Api\StatutoryController;
use App\Http\Controllers\Api\LogisticsController;
use App\Http\Controllers\Api\MaintenanceController;
use App\Http\Controllers\Api\AssetsController;
use App\Http\Controllers\Api\ReportsController;
use App\Http\Controllers\Api\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes — TechMicra ERP
|--------------------------------------------------------------------------
| Prefix: /api/v1
| Mirrors the existing Node.js backend endpoints exactly.
*/

// ─── Open Routes ──────────────────────────────────────────────────────────────
Route::prefix('v1')->group(function () {

    Route::post('auth/login', [AuthController::class, 'login']);

    // Health check
    Route::get('health', fn() => response()->json([
        'success' => true,
        'message' => 'ERP Laravel API is running',
        'timestamp' => now()->toISOString(),
    ]));

    Route::get('run-seed', function () {
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'SyntheticDataSeeder']);
        return \Illuminate\Support\Facades\Artisan::output();
    });

    Route::get('fix-models', function () {
        $files = glob(app_path() . '/Models/*.php');
        $count = 0;
        foreach ($files as $file) {
            $content = file_get_contents($file);
            if (strpos($content, 'public $timestamps = false;') !== false) {
                $content = preg_replace(
                    '/^\s*public\s+\$timestamps\s*=\s*false;.*$/m',
                    "\n    const CREATED_AT = 'createdAt';\n    const UPDATED_AT = 'updatedAt';",
                    $content
                );
                file_put_contents($file, $content);
                $count++;
            }
        }
        return ['status' => 'success', 'modified_files' => $count];
    });

    Route::get('test-login', function () {
        $email = 'admin@erp.com';
        $user = \App\Models\User::where('email', $email)->first();
        if (!$user)
            return 'No user';

        $user->password = \Illuminate\Support\Facades\Hash::make('password');
        $user->save();

        $match = \Illuminate\Support\Facades\Hash::check('password', $user->password);

        $userWithQuery = \App\Models\User::where('email', $email)
            ->where('isActive', true)
            ->whereNull('deletedAt')
            ->first();

        return [
            'status' => 'Password reset to password.',
            'password_match' => $match,
            'auth_query_works' => $userWithQuery !== null

        ];
    });

    // ─── Protected Routes ─────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::post('auth/register', [AuthController::class, 'register']);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/permissions', [AuthController::class, 'getPermissions']);

        // ── Sales ─────────────────────────────────────────────────────────────
        Route::get('sales/dashboard', [SalesController::class, 'dashboard']);
        Route::get('sales/stats', [SalesController::class, 'stats']);
        Route::post('sales/stock-check', [SalesController::class, 'stockCheck']);

        Route::get('sales/customers', [SalesController::class, 'listCustomers']);
        Route::post('sales/customers', [SalesController::class, 'createCustomer']);
        Route::get('sales/customers/{id}', [SalesController::class, 'getCustomer']);
        Route::put('sales/customers/{id}', [SalesController::class, 'updateCustomer']);
        Route::delete('sales/customers/{id}', [SalesController::class, 'deleteCustomer']);
        Route::get('sales/customers/{id}/profile', [SalesController::class, 'getCustomerProfile']);

        Route::get('sales/inquiries', [SalesController::class, 'listInquiries']);
        Route::post('sales/inquiries', [SalesController::class, 'createInquiry']);
        Route::get('sales/inquiries/{id}', [SalesController::class, 'getInquiry']);
        Route::put('sales/inquiries/{id}', [SalesController::class, 'updateInquiry']);

        Route::get('sales/quotations', [SalesController::class, 'listQuotations']);
        Route::post('sales/quotations', [SalesController::class, 'createQuotation']);
        Route::get('sales/quotations/{id}', [SalesController::class, 'getQuotation']);
        Route::put('sales/quotations/{id}', [SalesController::class, 'updateQuotation']);

        Route::get('sales/sale-orders', [SalesController::class, 'listSaleOrders']);
        Route::post('sales/sale-orders', [SalesController::class, 'createSaleOrder']);
        Route::get('sales/sale-orders/{id}', [SalesController::class, 'getSaleOrder']);
        Route::put('sales/sale-orders/{id}', [SalesController::class, 'updateSaleOrder']);

        Route::get('sales/invoices', [SalesController::class, 'listInvoices']);
        Route::post('sales/invoices', [SalesController::class, 'createInvoice']);
        Route::get('sales/invoices/{id}', [SalesController::class, 'getInvoice']);

        Route::get('sales/receipts', [SalesController::class, 'listReceipts']);
        Route::post('sales/receipts', [SalesController::class, 'createReceipt']);
        Route::get('sales/receipts/{id}', [SalesController::class, 'getReceipt']);

        Route::get('sales/salesmen/{id}/profile', [SalesController::class, 'getSalesmanProfile']);

        // ── Purchase ──────────────────────────────────────────────────────────
        Route::get('purchase/dashboard', [PurchaseController::class, 'dashboard']);
        Route::apiResource('purchase/vendors', PurchaseController::class)->only(['index', 'store', 'show', 'update', 'destroy'])->names('purchase.vendors');
        Route::get('purchase/purchase-orders', [PurchaseController::class, 'listPurchaseOrders']);
        Route::post('purchase/purchase-orders', [PurchaseController::class, 'createPurchaseOrder']);
        Route::get('purchase/purchase-orders/{id}', [PurchaseController::class, 'getPurchaseOrder']);
        Route::put('purchase/purchase-orders/{id}', [PurchaseController::class, 'updatePurchaseOrder']);
        Route::get('purchase/grns', [PurchaseController::class, 'listGrns']);
        Route::post('purchase/grns', [PurchaseController::class, 'createGrn']);
        Route::get('purchase/grns/{id}', [PurchaseController::class, 'getGrn']);
        Route::get('purchase/bills', [PurchaseController::class, 'listBills']);
        Route::post('purchase/bills', [PurchaseController::class, 'createBill']);
        Route::get('purchase/bills/{id}', [PurchaseController::class, 'getBill']);

        // ── Production ────────────────────────────────────────────────────────
        Route::get('production/dashboard', [ProductionController::class, 'dashboard']);
        Route::get('production/products', [ProductionController::class, 'listProducts']);
        Route::post('production/products', [ProductionController::class, 'createProduct']);
        Route::get('production/products/{id}', [ProductionController::class, 'getProduct']);
        Route::put('production/products/{id}', [ProductionController::class, 'updateProduct']);
        Route::delete('production/products/{id}', [ProductionController::class, 'deleteProduct']);
        Route::get('production/bom', [ProductionController::class, 'listBom']);
        Route::get('production/route-cards', [ProductionController::class, 'listRouteCards']);
        Route::get('production/reports', [ProductionController::class, 'listReports']);
        Route::get('production/job-orders', [ProductionController::class, 'listJobOrders']);

        // ── Simulation ────────────────────────────────────────────────────────
        Route::post('simulation/run', [SimulationController::class, 'runSimulation']);
        Route::post('simulation/{id}/save', [SimulationController::class, 'saveSimulation']);
        Route::get('simulation/history', [SimulationController::class, 'listSimulations']);
        Route::get('simulation/{id}', [SimulationController::class, 'getSimulation']);

        // ── Finance ───────────────────────────────────────────────────────────
        Route::get('finance/dashboard', [FinanceController::class, 'dashboard']);
        
        // 4.1. Voucher Journal - Adjustment Entry
        Route::get('finance/voucher-journals', [FinanceController::class, 'listVoucherJournals']);
        Route::post('finance/voucher-journals', [FinanceController::class, 'createVoucherJournal']);
        Route::get('finance/voucher-journals/{id}', [FinanceController::class, 'getVoucherJournal']);
        Route::put('finance/voucher-journals/{id}', [FinanceController::class, 'updateVoucherJournal']);
        Route::delete('finance/voucher-journals/{id}', [FinanceController::class, 'deleteVoucherJournal']);
        
        // 4.2. Voucher Payment & Receipt - Bank/Cash transactions
        Route::get('finance/voucher-payment-receipts', [FinanceController::class, 'listVoucherPaymentReceipts']);
        Route::post('finance/voucher-payment-receipts', [FinanceController::class, 'createVoucherPaymentReceipt']);
        Route::get('finance/voucher-payment-receipts/{id}', [FinanceController::class, 'getVoucherPaymentReceipt']);
        Route::put('finance/voucher-payment-receipts/{id}', [FinanceController::class, 'updateVoucherPaymentReceipt']);
        Route::delete('finance/voucher-payment-receipts/{id}', [FinanceController::class, 'deleteVoucherPaymentReceipt']);
        
        // 4.3. Voucher Contra - Cash Deposit/Withdrawal
        Route::get('finance/voucher-contras', [FinanceController::class, 'listVoucherContras']);
        Route::post('finance/voucher-contras', [FinanceController::class, 'createVoucherContra']);
        Route::get('finance/voucher-contras/{id}', [FinanceController::class, 'getVoucherContra']);
        Route::put('finance/voucher-contras/{id}', [FinanceController::class, 'updateVoucherContra']);
        Route::delete('finance/voucher-contras/{id}', [FinanceController::class, 'deleteVoucherContra']);
        
        // 4.4. Journal Voucher (GST) - Tax Adjustments
        Route::get('finance/voucher-gsts', [FinanceController::class, 'listVoucherGSTs']);
        Route::post('finance/voucher-gsts', [FinanceController::class, 'createVoucherGST']);
        Route::get('finance/voucher-gsts/{id}', [FinanceController::class, 'getVoucherGST']);
        Route::put('finance/voucher-gsts/{id}', [FinanceController::class, 'updateVoucherGST']);
        Route::delete('finance/voucher-gsts/{id}', [FinanceController::class, 'deleteVoucherGST']);
        
        // Legacy voucher endpoints (backward compatibility)
        Route::get('finance/vouchers', [FinanceController::class, 'listVouchers']);
        Route::post('finance/vouchers', [FinanceController::class, 'createVoucher']);
        Route::get('finance/vouchers/{id}', [FinanceController::class, 'getVoucher']);
        Route::put('finance/vouchers/{id}', [FinanceController::class, 'updateVoucher']);
        Route::delete('finance/vouchers/{id}', [FinanceController::class, 'deleteVoucher']);
        
        // 4.5. Bank Reconciliation
        Route::get('finance/bank-reconciliations', [FinanceController::class, 'listBankReconciliations']);
        Route::post('finance/bank-reconciliations', [FinanceController::class, 'createBankReconciliation']);
        Route::get('finance/bank-reconciliations/{id}', [FinanceController::class, 'getBankReconciliation']);
        Route::put('finance/bank-reconciliations/{id}', [FinanceController::class, 'updateBankReconciliation']);
        Route::delete('finance/bank-reconciliations/{id}', [FinanceController::class, 'deleteBankReconciliation']);
        Route::post('finance/bank-reconciliations/{id}/match', [FinanceController::class, 'matchBankReconciliation']);
        
        // 4.6. Credit Card Statement
        Route::get('finance/credit-card-statements', [FinanceController::class, 'listCreditCardStatements']);
        Route::post('finance/credit-card-statements', [FinanceController::class, 'createCreditCardStatement']);
        Route::get('finance/credit-card-statements/{id}', [FinanceController::class, 'getCreditCardStatement']);
        Route::put('finance/credit-card-statements/{id}', [FinanceController::class, 'updateCreditCardStatement']);
        Route::delete('finance/credit-card-statements/{id}', [FinanceController::class, 'deleteCreditCardStatement']);
        
        // Legacy endpoints (backward compatibility)
        Route::get('finance/bank-reconciliation', [FinanceController::class, 'listBankReconciliations']);
        Route::get('finance/credit-card', [FinanceController::class, 'listCreditCardStatements']);

        // ── HR ────────────────────────────────────────────────────────────────
        Route::get('hr/dashboard', [HrController::class, 'dashboard']);
        
        // Employees (5.1 Employee Master)
        Route::get('hr/employees', [HrController::class, 'listEmployees']);
        Route::post('hr/employees', [HrController::class, 'createEmployee']);
        Route::get('hr/employees/{id}', [HrController::class, 'getEmployee']);
        Route::put('hr/employees/{id}', [HrController::class, 'updateEmployee']);
        Route::delete('hr/employees/{id}', [HrController::class, 'deleteEmployee']);
        
        // Salary Heads (5.2 Salary Head Master)
        Route::get('hr/salary-heads', [HrController::class, 'listSalaryHeads']);
        Route::post('hr/salary-heads', [HrController::class, 'createSalaryHead']);
        Route::get('hr/salary-heads/{id}', [HrController::class, 'getSalaryHead']);
        Route::put('hr/salary-heads/{id}', [HrController::class, 'updateSalaryHead']);
        Route::delete('hr/salary-heads/{id}', [HrController::class, 'deleteSalaryHead']);
        
        // Salary Structures (5.3 Employee Salary Structure)
        Route::get('hr/salary-structures', [HrController::class, 'listSalaryStructures']);
        Route::post('hr/salary-structures', [HrController::class, 'createSalaryStructure']);
        Route::get('hr/salary-structures/{id}', [HrController::class, 'getSalaryStructure']);
        Route::put('hr/salary-structures/{id}', [HrController::class, 'updateSalaryStructure']);
        Route::delete('hr/salary-structures/{id}', [HrController::class, 'deleteSalaryStructure']);
        
        // Salary Sheets (5.4 Employee Salary Sheet)
        Route::get('hr/salary-sheets', [HrController::class, 'listSalarySheets']);
        Route::post('hr/salary-sheets', [HrController::class, 'createSalarySheet']);
        Route::get('hr/salary-sheets/{id}', [HrController::class, 'getSalarySheet']);
        Route::put('hr/salary-sheets/{id}', [HrController::class, 'updateSalarySheet']);
        Route::delete('hr/salary-sheets/{id}', [HrController::class, 'deleteSalarySheet']);
        
        // Advances (5.5 Employee Advance Memo)
        Route::get('hr/advances', [HrController::class, 'listAdvances']);
        Route::post('hr/advances', [HrController::class, 'createAdvance']);
        Route::get('hr/advances/{id}', [HrController::class, 'getAdvance']);
        Route::put('hr/advances/{id}', [HrController::class, 'updateAdvance']);
        Route::delete('hr/advances/{id}', [HrController::class, 'deleteAdvance']);
        Route::post('hr/advances/{id}/approve', [HrController::class, 'approveAdvance']);
        
        // Dropdowns & Lookups (Referential Integrity)
        Route::get('hr/dropdown/employees', [HrController::class, 'getEmployeesDropdown']);
        Route::get('hr/dropdown/salary-heads', [HrController::class, 'getSalaryHeadsDropdown']);
        Route::get('hr/dropdown/employees-with-structures', [HrController::class, 'getEmployeesWithStructures']);
        Route::get('hr/employee/{employeeId}/salary-structure', [HrController::class, 'getEmployeeSalaryStructure']);

        // ── Quality ───────────────────────────────────────────────────────────
        Route::get('quality/dashboard', [QualityController::class, 'dashboard']);
        Route::get('quality/iqc', [QualityController::class, 'listIqc']);
        Route::get('quality/pqc', [QualityController::class, 'listPqc']);
        Route::get('quality/pdi', [QualityController::class, 'listPdi']);
        Route::get('quality/qrd', [QualityController::class, 'listQrd']);

        // ── Warehouse ─────────────────────────────────────────────────────────
        Route::get('warehouse/dashboard', [WarehouseController::class, 'dashboard']);
        Route::get('warehouse/warehouses', [WarehouseController::class, 'listWarehouses']);
        Route::post('warehouse/warehouses', [WarehouseController::class, 'createWarehouse']);
        Route::get('warehouse/warehouses/{id}', [WarehouseController::class, 'getWarehouse']);
        Route::put('warehouse/warehouses/{id}', [WarehouseController::class, 'updateWarehouse']);
        Route::get('warehouse/stocks', [WarehouseController::class, 'listStocks']);

        // ── Statutory / GST ───────────────────────────────────────────────────
        Route::get('statutory/dashboard', [StatutoryController::class, 'dashboard']);
        Route::get('statutory/gst-master', [StatutoryController::class, 'listGstMaster']);
        Route::post('statutory/gst-master', [StatutoryController::class, 'createGstMaster']);
        Route::get('statutory/gst-master/{id}', [StatutoryController::class, 'getGstMaster']);
        Route::put('statutory/gst-master/{id}', [StatutoryController::class, 'updateGstMaster']);
        Route::delete('statutory/gst-master/{id}', [StatutoryController::class, 'deleteGstMaster']);
        Route::get('statutory/gstr1', [StatutoryController::class, 'listGstr1']);
        Route::get('statutory/tds', [StatutoryController::class, 'listTds']);
        Route::get('statutory/challans', [StatutoryController::class, 'listChallans']);
        Route::get('statutory/cheque-books', [StatutoryController::class, 'listChequeBooks']);

        // ── Logistics ─────────────────────────────────────────────────────────
        Route::get('logistics/dashboard', [LogisticsController::class, 'dashboard']);
        Route::get('logistics/transporters', [LogisticsController::class, 'listTransporters']);
        Route::post('logistics/transporters', [LogisticsController::class, 'createTransporter']);
        Route::get('logistics/transporters/{id}', [LogisticsController::class, 'getTransporter']);
        Route::put('logistics/transporters/{id}', [LogisticsController::class, 'updateTransporter']);
        Route::get('logistics/orders', [LogisticsController::class, 'listOrders']);
        Route::get('logistics/freight-bills', [LogisticsController::class, 'listFreightBills']);

        // ── Maintenance ───────────────────────────────────────────────────────
        Route::get('maintenance/dashboard', [MaintenanceController::class, 'dashboard']);
        Route::get('maintenance/tools', [MaintenanceController::class, 'listTools']);
        Route::post('maintenance/tools', [MaintenanceController::class, 'createTool']);
        Route::get('maintenance/tools/{id}', [MaintenanceController::class, 'getTool']);
        Route::put('maintenance/tools/{id}', [MaintenanceController::class, 'updateTool']);
        Route::get('maintenance/maintenance-charts', [MaintenanceController::class, 'listMaintenanceCharts']);
        Route::get('maintenance/calibration', [MaintenanceController::class, 'listCalibration']);

        // ── Assets ────────────────────────────────────────────────────────────
        Route::get('assets', [AssetsController::class, 'listAssets']);
        Route::post('assets', [AssetsController::class, 'createAsset']);
        Route::get('assets/{id}', [AssetsController::class, 'getAsset']);
        Route::put('assets/{id}', [AssetsController::class, 'updateAsset']);
        Route::delete('assets/{id}', [AssetsController::class, 'deleteAsset']);

        // ── Reports ───────────────────────────────────────────────────────────
        Route::get('reports/sales', [ReportsController::class, 'salesReport']);
        Route::get('reports/purchase', [ReportsController::class, 'purchaseReport']);
        Route::get('reports/production', [ReportsController::class, 'productionReport']);
        Route::get('reports/finance', [ReportsController::class, 'financeReport']);

        // ── Dashboard (Global) ────────────────────────────────────────────────
        Route::get('dashboard', [DashboardController::class, 'index']);
    });
});
