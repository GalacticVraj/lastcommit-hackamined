<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionRouteCard extends Model
{
    
    protected $table = 'ProductionRouteCard';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
