<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DispatchAdvice extends Model
{
    
    protected $table = 'DispatchAdvice';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    public function saleOrder()
    {
        return $this->belongsTo(SaleOrder::class, 'saleOrderId', 'id');
    }

    public function transporter()
    {
        return $this->belongsTo(Transporter::class, 'transporterId', 'id');
    }
}
