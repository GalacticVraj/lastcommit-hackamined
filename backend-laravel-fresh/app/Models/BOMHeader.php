<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BOMHeader extends Model
{
    protected $table = 'bom_headers';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}

