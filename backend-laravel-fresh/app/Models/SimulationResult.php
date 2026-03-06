<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SimulationResult extends Model
{
    protected $table = 'simulation_results';
    protected $guarded = [];
    
    protected $casts = [
        'mrp_breakdown' => 'array',
        'crp_breakdown' => 'array',
        'cost_breakdown' => 'array',
    ];

    public function mpsItems()
    {
        return $this->hasMany(SimulationMpsItem::class, 'simulation_id');
    }
}


