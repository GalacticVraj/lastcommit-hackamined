<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$t = 'warehouse_stocks';
$columns = Illuminate\Support\Facades\DB::select("PRAGMA table_info($t)");
foreach ($columns as $c) {
    echo "COL: {$c->name} | TYPE: {$c->type} | NOTNULL: {$c->notnull} | DEFAULT: {$c->dflt_value}\n";
}
