<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$row = (array)Illuminate\Support\Facades\DB::table('products')->first();
echo "KEYS:\n";
print_r(array_keys($row));
