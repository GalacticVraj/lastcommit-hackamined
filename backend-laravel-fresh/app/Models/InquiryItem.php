<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InquiryItem extends Model
{

    protected $table = 'InquiryItem';
    protected $guarded = [];
    public $timestamps = false;

    public function product()
    {
        return $this->belongsTo(Product::class, 'productId', 'id');
    }
}

