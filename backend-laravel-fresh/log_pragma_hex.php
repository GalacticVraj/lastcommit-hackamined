<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$rows = Illuminate\Support\Facades\DB::select("PRAGMA table_info(products)");
foreach($rows as $r) {
    echo "[" . $r->name . "]: " . bin2hex($r->name) . "\n";
}
