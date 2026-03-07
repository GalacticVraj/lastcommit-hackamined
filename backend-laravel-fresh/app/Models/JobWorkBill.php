<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobWorkBill extends Model
{
    
    protected $table = 'JobWorkBill';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
