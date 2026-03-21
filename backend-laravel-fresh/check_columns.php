<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$table = $argv[1] ?? 'bom_items';
$columns = Illuminate\Support\Facades\Schema::getColumnListing($table);
echo "Columns for $table:\n";
print_r($columns);
