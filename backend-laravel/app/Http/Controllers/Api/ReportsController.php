<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ReportsController extends Controller
{
    public function salesReport(Request $r) { return $this->successResponse(['report' => 'Sales report placeholder']); }
    public function purchaseReport(Request $r) { return $this->successResponse(['report' => 'Purchase report placeholder']); }
    public function productionReport(Request $r) { return $this->successResponse(['report' => 'Production report placeholder']); }
    public function financeReport(Request $r) { return $this->successResponse(['report' => 'Finance report placeholder']); }
}
