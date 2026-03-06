<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleOrder extends Model
{

    protected $table = 'SaleOrder';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    public function items()
    {
        return $this->hasMany(SaleOrderItem::class, 'saleOrderId', 'id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customerId', 'id');
    }

    public function quotation()
    {
        return $this->belongsTo(Quotation::class, 'quotationId', 'id');
    }
}
