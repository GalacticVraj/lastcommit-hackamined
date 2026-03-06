<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CollectionReminder extends Model
{
    
    protected $table = 'CollectionReminder';
    protected $guarded = [];
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
}
