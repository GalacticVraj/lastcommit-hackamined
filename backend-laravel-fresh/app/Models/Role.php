<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $table = 'Role';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    public function permissions()
    {
        return $this->hasMany(RolePermission::class, 'roleId', 'id');
    }

    public function users()
    {
        return $this->hasMany(UserRole::class, 'roleId', 'id');
    }
}
