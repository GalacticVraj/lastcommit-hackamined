<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterialIssue extends Model
{
    
    protected $table = 'MaterialIssue';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
