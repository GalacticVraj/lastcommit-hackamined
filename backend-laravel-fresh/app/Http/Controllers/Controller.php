<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    protected function successResponse($data, $message = 'Success', $statusCode = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }

    protected function errorResponse($message, $statusCode = 400)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], $statusCode);
    }

    protected function paginatedResponse($paginator)
    {
        return response()->json([
            'success' => true,
            'data' => $paginator->items(),
            'pagination' => [
                'page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'total_pages' => $paginator->lastPage(),
            ],
        ]);
    }

    protected function applySorting($query, \Illuminate\Http\Request $request, $defaultColumn = 'createdAt', $defaultOrder = 'desc')
    {
        $sortBy = $request->get('sort_by', $defaultColumn);
        $sortOrder = $request->get('sort_order', $defaultOrder);

        // Validate sort order
        $sortOrder = in_array(strtolower($sortOrder), ['asc', 'desc']) ? strtolower($sortOrder) : 'desc';

        // Check if column exists to avoid SQL errors
        return $query->orderBy($sortBy, $sortOrder);
    }
}
