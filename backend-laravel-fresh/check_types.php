<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$t = 'warehouse_stocks';
echo "\nTABLE: $t\n";
$cols = \Illuminate\Support\Facades\Schema::getColumnListing($t);
foreach($cols as $c) {
    try {
        $type = \Illuminate\Support\Facades\Schema::getColumnType($t, $c);
        echo "- $c ($type)\n";
    } catch(\Exception $e) {
        echo "- $c\n";
    }
}
