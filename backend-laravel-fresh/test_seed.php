<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Manually test logic
try {
    $seeder = new \Database\Seeders\SimulationDemoSeeder();
    $seeder->run();
    echo "SUCCESS!\n";
} catch (\Exception $e) {
    echo "\n=== SQL ERROR ===\n";
    echo $e->getMessage() . "\n";
    echo "=================\n";
}
