<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tables = ['bom_headers', 'bom_items', 'routing_tables', 'warehouse_stocks', 'resource_master', 'shift_master'];
$results = [];
foreach($tables as $t) {
    if (Illuminate\Support\Facades\Schema::hasTable($t)) {
        $results[$t] = Illuminate\Support\Facades\Schema::getColumnListing($t);
    } else {
        $results[$t] = "MISSING";
    }
}
file_put_contents('all_cols.json', json_encode($results, JSON_PRETTY_PRINT));
echo "Dumped to all_cols.json\n";
