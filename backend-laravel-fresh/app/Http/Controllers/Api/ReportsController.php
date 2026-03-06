<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Invoice;
use App\Models\PurchaseOrder;
use App\Models\ProductionReport;
use App\Models\Inquiry;

class ReportsController extends Controller
{
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
}
