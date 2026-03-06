<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$u = App\Models\User::first();
if ($u) {
    // Hashes 'password'
    $u->password = '$2y$12$t2x6mQ9fOKvLhVb2A.7y/e06Yj4G1U72Z.f/x/GZ1M31GXXI1qF2e';
    $u->save();
    echo "Successfully updated " . $u->email . " password.\n";
} else {
    echo "User not found\n";
}
