<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommunicationLog extends Model
{
    
    protected $table = 'CommunicationLog';
    protected $guarded = [];
    public $timestamps = false;  // Only has sentAt, no created/updated
}
