<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AutoCounter extends Model
{
    
    protected $table = 'AutoCounter';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
