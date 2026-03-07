<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseBill extends Model
{
    
    protected $table = 'PurchaseBill';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendorId');
    }
}
