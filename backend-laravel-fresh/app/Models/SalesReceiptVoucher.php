<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesReceiptVoucher extends Model
{
    
    protected $table = 'SalesReceiptVoucher';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
