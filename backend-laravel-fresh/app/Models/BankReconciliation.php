<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class BankReconciliation extends Model
{
    protected $table = 'BankReconciliation';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
