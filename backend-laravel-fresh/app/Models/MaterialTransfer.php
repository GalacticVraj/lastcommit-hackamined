<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterialTransfer extends Model
{
    
    protected $table = 'MaterialTransfer';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
