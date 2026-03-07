<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Hash;

$user = \App\Models\User::where('email', 'admin@erp.com')->first();
if ($user) {
    $user->password = Hash::make('password');
    $user->save();
    echo "Password updated using Hash::make('password')\n";

    // Check it immediately
    if (Hash::check('password', $user->password)) {
        echo "Hash matches correctly!\n";
    } else {
        echo "Hash STILL FAILS!\n";
    }
}
