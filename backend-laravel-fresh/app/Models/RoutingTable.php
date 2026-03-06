<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoutingTable extends Model
{
    protected $table = 'routing_tables';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = null;
}

