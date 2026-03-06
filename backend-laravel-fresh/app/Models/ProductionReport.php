<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionReport extends Model
{
    
    protected $table = 'ProductionReport';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
