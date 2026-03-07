<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BOMItem extends Model
{
    protected $table = 'bom_items';
    protected $guarded = [];
    public $timestamps = false;

    public function rawMaterial()
    {
        return $this->belongsTo(Product::class, 'raw_material_id');
    }
}


