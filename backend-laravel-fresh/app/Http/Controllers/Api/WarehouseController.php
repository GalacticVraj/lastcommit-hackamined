<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Models\Product;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function dashboard()
    {
        return $this->successResponse([
            'stats' => [
                'totalWarehouses' => Warehouse::count(),
                'totalItems' => Product::count(),
                'avgStockPerItem' => Product::avg('currentStock') ?: 0,
            ]
        ]);
    }

    public function listWarehouses(Request $request)
    {
        return $this->paginatedResponse(Warehouse::latest()->paginate(25));
    }

    public function createWarehouse(Request $request)
    {
        $w = Warehouse::create($request->all() + ['createdBy' => $request->user()->id]);
        return $this->successResponse($w, 'Created', 201);
    }

    public function getWarehouse($id)
    {
        return $this->successResponse(Warehouse::findOrFail($id));
    }

    public function updateWarehouse(Request $request, $id)
    {
        $w = Warehouse::findOrFail($id);
        $w->update($request->all());
        return $this->successResponse($w, 'Updated');
    }

    public function listStocks(Request $request)
    {
        $query = Product::whereNull('deletedAt');
        if ($cat = $request->get('category'))
            $query->where('category', $cat);
        return $this->paginatedResponse($query->latest()->paginate(50));
    }
}
