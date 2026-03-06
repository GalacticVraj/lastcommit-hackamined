<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SimulationProduct extends Model
{
    
    protected $table = 'SimulationProduct';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
