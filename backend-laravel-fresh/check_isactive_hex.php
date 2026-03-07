<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$rows = Illuminate\Support\Facades\DB::select("PRAGMA table_info(products)");
foreach($rows as $r) {
    if (strpos($r->name, "isActive") !== false) {
        $hex = bin2hex($r->name);
        echo "COL: [" . $r->name . "] | HEX: $hex\n";
    }
}
