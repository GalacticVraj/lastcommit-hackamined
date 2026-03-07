<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$sql = Illuminate\Support\Facades\DB::select("SELECT sql FROM sqlite_master WHERE type='table' AND name='products'")[0]->sql;
echo "SQL:\n$sql\n";
