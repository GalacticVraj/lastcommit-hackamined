<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $table = 'products';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';


    public function bomHeader()
    {
        return $this->hasOne(BOMHeader::class, 'product_id');
    }

    public function routings()
    {
        return $this->hasMany(RoutingTable::class, 'product_id');
    }

    public function stocks()
    {
        return $this->hasMany(WarehouseStock::class, 'product_id');
    }
}

