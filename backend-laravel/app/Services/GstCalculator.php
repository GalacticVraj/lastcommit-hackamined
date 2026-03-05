<?php

namespace App\Services;

/**
 * GST Calculator — port of Node.js gstCalculator.js
 */
class GstCalculator
{
    public static function getStateCode(?string $gstin): ?string
    {
        if (!$gstin || strlen($gstin) < 2) return null;
        return substr($gstin, 0, 2);
    }

    public static function calculate(float $taxableValue, float $gstPercent, ?string $sellerGSTIN, ?string $buyerGSTIN): array
    {
        $sellerState = self::getStateCode($sellerGSTIN);
        $buyerState = self::getStateCode($buyerGSTIN);
        $isInterstate = $sellerState !== $buyerState || !$sellerState || !$buyerState;

        if ($isInterstate) {
            return [
                'type' => 'IGST',
                'igst' => round($taxableValue * $gstPercent / 100, 2),
                'cgst' => 0,
                'sgst' => 0,
                'total' => round($taxableValue * (1 + $gstPercent / 100), 2),
            ];
        }

        $halfRate = $gstPercent / 2;
        return [
            'type' => 'CGST+SGST',
            'igst' => 0,
            'cgst' => round($taxableValue * $halfRate / 100, 2),
            'sgst' => round($taxableValue * $halfRate / 100, 2),
            'total' => round($taxableValue * (1 + $gstPercent / 100), 2),
        ];
    }
}
