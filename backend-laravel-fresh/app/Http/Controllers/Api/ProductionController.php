<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\BOMHeader;
use App\Models\ProductionRouteCard;
use App\Models\ProductionReport;
use App\Models\JobOrder;
use Illuminate\Http\Request;

class ProductionController extends Controller
{
    public function dashboard(Request $request)
    {
        $totalProducts = Product::whereNull('deletedAt')->count();
        $finishedGoods = Product::where('category', 'Finished Good')->count();
        $rawMaterials = Product::where('category', 'Raw Material')->count();
        $lowStock = Product::whereRaw('currentStock <= reorderLevel')->count();

        return $this->successResponse(['stats' => compact('totalProducts', 'finishedGoods', 'rawMaterials', 'lowStock')]);
    }

    public function listProducts(Request $request)
    {
        $query = Product::whereNull('deleted_at');
        if ($search = $request->get('search'))
            $query->where('name', 'like', "%{$search}%");
        if ($request->has('category'))
            $query->where('category', $request->category);
        return $this->paginatedResponse($query->orderBy($request->get('sort_by', 'created_at'), $request->get('sort_order', 'desc'))->paginate((int) $request->get('per_page', 100)));
    }

    public function createProduct(Request $request)
    {
        $product = Product::create(array_merge($request->only(['code', 'name', 'category', 'unit', 'hsnCode', 'gstPercent', 'currentStock', 'reorderLevel', 'manHoursPerUnit', 'machineHoursPerUnit']), ['createdBy' => $request->user()->id]));
        return $this->successResponse($product, 'Product created', 201);
    }

    public function getProduct($id)
    {
        return $this->successResponse(Product::findOrFail($id));
    }
    public function updateProduct(Request $request, $id)
    {
        $p = Product::findOrFail($id);
        $p->update(array_merge($request->all(), ['updatedBy' => $request->user()->id]));
        return $this->successResponse($p, 'Product updated');
    }
    public function deleteProduct($id)
    {
        Product::where('id', $id)->update(['deletedAt' => now()]);
        return $this->successResponse(null, 'Product deleted');
    }
    public function listBom(Request $request)
    {
        return $this->successResponse(BOMHeader::with('product:id,name')->latest()->get());
    }
    public function listRouteCards(Request $request)
    {
        return $this->successResponse(ProductionRouteCard::with('product:id,name')->latest()->get());
    }
    public function listReports(Request $request)
    {
        return $this->successResponse(ProductionReport::with('product:id,name')->latest()->get());
    }
    public function listJobOrders(Request $request)
    {
        return $this->successResponse(JobOrder::latest()->get());
    }
}
