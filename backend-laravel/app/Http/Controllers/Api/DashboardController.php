<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        return $this->successResponse([
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
