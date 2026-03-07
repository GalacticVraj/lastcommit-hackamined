<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$email = 'admin@erp.com';
$user = \App\Models\User::where('email', $email)->first();
echo json_encode([
    'password' => $user->password ?? null,
    'is_active' => $user->is_active ?? null,
    'deleted_at' => $user->deleted_at ?? null
], JSON_PRETTY_PRINT);
