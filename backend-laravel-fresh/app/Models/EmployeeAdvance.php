<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeAdvance extends Model
{
    protected $table = 'EmployeeAdvance';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employeeId');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approvedBy');
    }
}
