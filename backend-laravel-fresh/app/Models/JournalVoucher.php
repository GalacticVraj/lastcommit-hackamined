<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class JournalVoucher extends Model
{
    protected $table = 'JournalVoucher';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
