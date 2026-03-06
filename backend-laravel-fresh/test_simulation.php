<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::create('/api/v1/simulation/products-with-bom', 'GET')
);
echo "Products with BOM:\n";
echo $response->getContent() . "\n\n";

$mps = [
    ['productId' => 6, 'targetQty' => 20], // Assuming Steel Frame ID is 6 from previous tinker list
];
$response = $kernel->handle(
    $request = Illuminate\Http\Request::create('/api/v1/simulation/run', 'POST', [
        'mps' => $mps,
        'shiftHours' => 10,
        'workerCount' => 50
    ])
);
echo "Simulation Run Result:\n";
echo $response->getContent() . "\n";
