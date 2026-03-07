<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesReceiptVoucher extends Model
{
    
    protected $table = 'SalesReceiptVoucher';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customerId', 'id');
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'invoiceId', 'id');
    }
}
