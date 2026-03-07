<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * Auto Number Generator — uses AutoCounter table for running serials.
 */
class AutoNumber
{
    /**
     * Generate a unique document number with prefix and running serial.
     * e.g. INQ-000001, QT-000042, INV-000123
     */
    public static function generate(string $prefix, string $docType): string
    {
        $counter = DB::table('AutoCounter')->where('prefix', $docType)->first();

        if ($counter) {
            $nextVal = $counter->currentValue + 1;
            DB::table('AutoCounter')->where('id', $counter->id)->update(['currentValue' => $nextVal]);
        } else {
            $nextVal = 1;
            DB::table('AutoCounter')->insert([
                'prefix' => $docType,
                'currentValue' => 1,
            ]);
        }

        return $prefix . '-' . str_pad($nextVal, 6, '0', STR_PAD_LEFT);
    }
}
