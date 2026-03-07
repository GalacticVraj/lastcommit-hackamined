<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$rows = Illuminate\Support\Facades\DB::select("PRAGMA table_info(products)");
$expected = "lastPurchasePrice";
echo "EXPECTED: $expected | HEX: " . bin2hex($expected) . "\n";

foreach($rows as $r) {
    if (stripos($r->name, "lastPurchase") !== false) {
        echo "FOUND   : " . $r->name . " | HEX: " . bin2hex($r->name) . "\n";
    }
}
