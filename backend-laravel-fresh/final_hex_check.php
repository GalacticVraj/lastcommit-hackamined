<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$row = (array)Illuminate\Support\Facades\DB::table('products')->first();
if (!$row) {
    echo "NO DATA IN PRODUCTS. Inserting one...\n";
    Illuminate\Support\Facades\DB::table('products')->insert(['code'=>'TEMP']);
    $row = (array)Illuminate\Support\Facades\DB::table('products')->first();
}

foreach($row as $k => $v) {
    echo "KEY: [$k] | HEX: " . bin2hex($k) . "\n";
}
