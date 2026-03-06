<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SimulationInput extends Model
{
    protected $table = 'SimulationInput';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
