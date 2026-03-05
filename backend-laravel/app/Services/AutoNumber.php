<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * Auto Number Generator — port of Node.js autoNumber.js
 */
class AutoNumber
{
    /**
     * Generate a unique document number with prefix and running serial.
     * e.g. INQ-000001, QT-000042, INV-000123
     */
    public static function generate(string $prefix, string $counterKey): string
    {
        // Use a simple counter table or derive from existing records
        $counter = DB::table('auto_counters')->where('key', $counterKey)->first();

        if ($counter) {
            $nextVal = $counter->value + 1;
            DB::table('auto_counters')->where('key', $counterKey)->update(['value' => $nextVal]);
        } else {
            $nextVal = 1;
            DB::table('auto_counters')->insert(['key' => $counterKey, 'value' => 1]);
        }

        return $prefix . '-' . str_pad($nextVal, 6, '0', STR_PAD_LEFT);
    }
}
