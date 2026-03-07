<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionReport extends Model
{
    
    protected $table = 'ProductionReport';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'productId');
    }
}
