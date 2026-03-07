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
    public static function generate(string $prefix, string $docType): string
    {
        // Use DocSequence table from Prisma schema
        $seq = DB::table('DocSequence')->where('docType', $docType)->first();

        if ($seq) {
            $nextVal = $seq->lastNo + 1;
            DB::table('DocSequence')->where('id', $seq->id)->update(['lastNo' => $nextVal]);
        } else {
            $nextVal = 1;
            DB::table('DocSequence')->insert([
                'docType' => $docType,
                'prefix' => $prefix,
                'year' => (int) date('Y'),
                'lastNo' => 1
            ]);
        }

        return $prefix . '-' . str_pad($nextVal, 6, '0', STR_PAD_LEFT);
    }
}
