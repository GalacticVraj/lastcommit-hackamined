<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SimulationMpsItem extends Model
{
    protected $table = 'simulation_mps_items';
    protected $guarded = [];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}

