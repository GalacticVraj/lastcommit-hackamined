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

foreach ($tables as $t) {
    if (Illuminate\Support\Facades\Schema::hasTable($t)) {
        echo "$t: " . implode(', ', Illuminate\Support\Facades\Schema::getColumnListing($t)) . "\n";
    }
}
