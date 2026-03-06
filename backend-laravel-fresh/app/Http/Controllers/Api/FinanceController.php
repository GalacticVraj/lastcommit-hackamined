<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\JournalVoucher;
use App\Models\BankReconciliation;
use App\Models\CreditCardStatement;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    public function dashboard()
    {
        return $this->successResponse([
            'stats' => [
                'totalVouchers' => JournalVoucher::count(),
                'totalAmount' => JournalVoucher::sum('amount'),
                'avgVoucher' => JournalVoucher::avg('amount') ?: 0,
            ]
        ]);
    }

    public function listVouchers(Request $request)
    {
        $query = JournalVoucher::latest();
        return $this->paginatedResponse($query->paginate(25));
    }

    public function createVoucher(Request $request)
    {
        $vNo = \App\Services\AutoNumber::generate('JV', 'JV');
        $v = JournalVoucher::create($request->all() + ['voucherNo' => $vNo, 'createdBy' => $request->user()->id]);
        return $this->successResponse($v, 'Voucher created', 201);
    }

    public function getVoucher($id)
    {
        return $this->successResponse(JournalVoucher::findOrFail($id));
    }

    public function updateVoucher(Request $request, $id)
    {
        $v = JournalVoucher::findOrFail($id);
        $v->update($request->all());
        return $this->successResponse($v, 'Updated');
    }

    public function deleteVoucher($id)
    {
        JournalVoucher::destroy($id);
        return $this->successResponse(null, 'Deleted');
    }

    public function listBankReconciliation(Request $request)
    {
        return $this->paginatedResponse(BankReconciliation::latest()->paginate(25));
    }

    public function listCreditCard(Request $request)
    {
        return $this->paginatedResponse(CreditCardStatement::latest()->paginate(25));
    }
}
