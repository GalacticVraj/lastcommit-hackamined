<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeSalaryStructure extends Model
{
    protected $table = 'EmployeeSalaryStructure';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employeeId');
    }
}
