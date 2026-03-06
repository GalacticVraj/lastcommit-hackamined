<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IQCRecord extends Model
{
    
    protected $table = 'IQCRecord';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
