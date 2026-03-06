<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{

    protected $table = 'Invoice';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    public function items()
    {
        return $this->hasMany(InvoiceItem::class, 'invoiceId', 'id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customerId', 'id');
    }

    public function saleOrder()
    {
        return $this->belongsTo(SaleOrder::class, 'saleOrderId', 'id');
    }
}
