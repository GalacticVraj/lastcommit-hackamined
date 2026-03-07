<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AutoCounter extends Model
{
    
    protected $table = 'AutoCounter';
    protected $guarded = [];
    public $timestamps = false;  // Table only has updatedAt, handled by DB
}
