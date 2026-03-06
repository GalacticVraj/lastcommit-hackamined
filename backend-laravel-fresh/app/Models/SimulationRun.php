<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SimulationRun extends Model
{
    
    protected $table = 'SimulationRun';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
