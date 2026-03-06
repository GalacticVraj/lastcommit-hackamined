<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    
    protected $table = 'Employee';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    public function salaryStructures()
    {
        return $this->hasMany(EmployeeSalaryStructure::class, 'employeeId');
    }

    public function salarySheets()
    {
        return $this->hasMany(EmployeeSalarySheet::class, 'employeeId');
    }

    public function advances()
    {
        return $this->hasMany(EmployeeAdvance::class, 'employeeId');
    }
}
