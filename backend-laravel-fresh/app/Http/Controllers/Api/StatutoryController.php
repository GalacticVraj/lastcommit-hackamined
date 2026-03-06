<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\GstMaster;

class StatutoryController extends Controller
{
    public function dashboard()
    {
        $count = GstMaster::where('isActive', true)->count();
        return $this->successResponse(['stats' => ['totalGstEntries' => $count]]);
    }

    public function listGstMaster(Request $r)
    {
        $query = GstMaster::where('isActive', true);
        if ($search = $r->get('search')) {
            $query->where('hsnCode', 'like', "%{$search}%")->orWhere('description', 'like', "%{$search}%");
        }
        return $this->paginatedResponse($query->latest()->paginate(25));
    }

    public function createGstMaster(Request $r)
    {
        $gst = GstMaster::create($r->only(['hsnCode', 'description', 'igstPercent', 'cgstPercent', 'sgstPercent']));
        return $this->successResponse($gst, 'Created', 201);
    }

    public function getGstMaster($id)
    {
        $gst = GstMaster::find($id);
        if (!$gst)
            return $this->errorResponse('Not found', 404);
        return $this->successResponse($gst);
    }

    public function updateGstMaster(Request $r, $id)
    {
        $gst = GstMaster::findOrFail($id);
        $gst->update($r->only(['hsnCode', 'description', 'igstPercent', 'cgstPercent', 'sgstPercent', 'isActive']));
        return $this->successResponse($gst, 'Updated');
    }

    public function deleteGstMaster($id)
    {
        GstMaster::where('id', $id)->update(['isActive' => false]);
        return $this->successResponse(null, 'Deleted');
    }

    public function listGstr1(Request $r)
    {
        return $this->successResponse([]);
    }
    public function listTds(Request $r)
    {
        return $this->successResponse([]);
    }
    public function listChallans(Request $r)
    {
        return $this->successResponse([]);
    }
    public function listChequeBooks(Request $r)
    {
        return $this->successResponse([]);
    }
}
