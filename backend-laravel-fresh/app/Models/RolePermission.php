<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RolePermission extends Model
{
    protected $table = 'RolePermission';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    public function permission()
    {
        return $this->belongsTo(Permission::class, 'permissionId', 'id');
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'roleId', 'id');
    }
}
