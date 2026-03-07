<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchasePaymentVoucher extends Model
{
    
    protected $table = 'PurchasePaymentVoucher';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
