<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tables = [
    'products',
    'warehouses',
    'warehouse_stocks',
    'bom_headers',
    'bom_items',
    'routing_tables',
    'resource_master',
    'shift_master'
];

foreach ($tables as $t) {
    echo "\n=== TABLE: $t ===\n";
    $columns = Illuminate\Support\Facades\DB::select("PRAGMA table_info($t)");
    foreach ($columns as $c) {
        $notnull = $c->notnull ? 'NOT NULL' : 'NULL';
        echo "{$c->name} ({$c->type}) $notnull default:{$c->dflt_value}\n";
    }
}
