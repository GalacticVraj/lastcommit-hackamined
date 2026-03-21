<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $r = \Illuminate\Http\Request::create('/api/v1/statutory/tds', 'POST', [
        'partyName' => 'Test', 'amount' => 100, 'date' => '2026-03-22'
    ]);
    $ctrl = app(\App\Http\Controllers\Api\StatutoryController::class);
    $res = $ctrl->createTds($r);
    echo "CREATE Response: " . json_encode($res->getData()) . "\n";
    $id = $res->getData()->data->id;
    echo "Created ID: $id\n";

    $res2 = $ctrl->deleteTds($id);
    echo "DELETE Response: " . json_encode($res2->getData()) . "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
