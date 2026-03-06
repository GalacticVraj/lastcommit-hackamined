<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseSchedule extends Model
{
    
    protected $table = 'PurchaseSchedule';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
