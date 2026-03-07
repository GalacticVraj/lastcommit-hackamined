<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserRole extends Model
{
    protected $table = 'UserRole';
    protected $guarded = [];
    public $timestamps = false;

    public function role()
    {
        return $this->belongsTo(Role::class, 'roleId', 'id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'userId', 'id');
    }
}
