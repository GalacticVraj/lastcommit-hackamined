<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Invoice;
use App\Models\Customer;
use App\Models\Vendor;
use App\Models\Product;
use App\Models\Employee;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        return $this->successResponse([
            'stats' => [
                'totalRevenue' => Invoice::whereNull('deletedAt')->sum('grandTotal'),
                'totalInvoices' => Invoice::whereNull('deletedAt')->count(),
                'totalCustomers' => Customer::whereNull('deletedAt')->count(),
                'overdueInvoices' => Invoice::where('status', 'Overdue')->whereNull('deletedAt')->count(),
                'totalVendors' => Vendor::whereNull('deletedAt')->count(),
                'totalProducts' => Product::whereNull('deletedAt')->count(),
                'totalEmployees' => Employee::whereNull('deletedAt')->count(),
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
