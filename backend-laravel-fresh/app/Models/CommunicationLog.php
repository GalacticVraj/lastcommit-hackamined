<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommunicationLog extends Model
{
    
    protected $table = 'CommunicationLog';
    protected $guarded = [];
    const CREATED_AT = null;
    const UPDATED_AT = null;

    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'invoiceId', 'id');
    }
}
