<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalaryHead extends Model
{
    protected $table = 'SalaryHead';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
