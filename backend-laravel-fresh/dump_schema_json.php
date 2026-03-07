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
    'shift_master',
    'simulation_results',
    'simulation_mps_items'
];

$schema = [];
foreach ($tables as $t) {
    if (Illuminate\Support\Facades\Schema::hasTable($t)) {
        $columns = Illuminate\Support\Facades\DB::select("PRAGMA table_info($t)");
        $schema[$t] = $columns;
    } else {
        $schema[$t] = "MISSING";
    }
}

file_put_contents('schema_dump.json', json_encode($schema, JSON_PRETTY_PRINT));
echo "Schema dumped to schema_dump.json\n";
