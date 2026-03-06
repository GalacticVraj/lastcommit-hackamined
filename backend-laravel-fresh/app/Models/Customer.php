<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    
    protected $table = 'Customer';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    public function inquiries()
    {
        return $this->hasMany(Inquiry::class, 'customerId', 'id');
    }

    public function quotations()
    {
        return $this->hasMany(Quotation::class, 'customerId', 'id');
    }

    public function saleOrders()
    {
        return $this->hasMany(SaleOrder::class, 'customerId', 'id');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'customerId', 'id');
    }

    public function receipts()
    {
        return $this->hasMany(SalesReceiptVoucher::class, 'customerId', 'id');
    }
}
