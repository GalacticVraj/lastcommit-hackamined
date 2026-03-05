<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AssetsController extends Controller
{
    public function listAssets(Request $r) { return $this->successResponse([]); }
    public function createAsset(Request $r) { return $this->successResponse(null, 'Created', 201); }
    public function getAsset($id) { return $this->successResponse(null); }
    public function updateAsset(Request $r, $id) { return $this->successResponse(null, 'Updated'); }
    public function deleteAsset($id) { return $this->successResponse(null, 'Deleted'); }
}
