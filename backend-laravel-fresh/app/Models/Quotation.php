<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Quotation extends Model
{

    protected $table = 'Quotation';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    public function items()
    {
        return $this->hasMany(QuotationItem::class, 'quotationId', 'id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customerId', 'id');
    }

    public function inquiry()
    {
        return $this->belongsTo(Inquiry::class, 'inquiryId', 'id');
    }
}
