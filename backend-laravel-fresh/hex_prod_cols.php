<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$cols = Illuminate\Support\Facades\Schema::getColumnListing('products');
foreach($cols as $c) {
    echo "[$c]: " . bin2hex($c) . "\n";
}
