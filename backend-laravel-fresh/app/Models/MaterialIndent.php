<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterialIndent extends Model
{
    
    protected $table = 'MaterialIndent';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
