<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inquiry extends Model
{

    protected $table = 'Inquiry';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    public function items()
    {
        return $this->hasMany(InquiryItem::class, 'inquiryId', 'id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customerId', 'id');
    }

    public function quotations()
    {
        return $this->hasMany(Quotation::class, 'inquiryId', 'id');
    }
}
