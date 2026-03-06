<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

$email = 'admin@erp.com';
$password = 'password';

$user = User::where('email', $email)->first();
if (!$user) {
    echo "User not found at all!\n";
} else {
    echo "User found: " . $user->email . "\n";
    echo "password hash: " . $user->password . "\n";
    echo "is_active: " . $user->is_active . " (type: " . gettype($user->is_active) . ")\n";
    echo "deleted_at: " . $user->deleted_at . "\n";

    if (Hash::check($password, $user->password)) {
        echo "Hash password MATCHES\n";
    } else {
        echo "Hash password DOES NOT MATCH\n";
    }
}

// Check with conditions
$userWithConditions = User::where('email', $email)
    ->where('is_active', true)
    ->whereNull('deleted_at')
    ->first();

if (!$userWithConditions) {
    echo "User not found WITH conditions!\n";
} else {
    echo "User found WITH conditions!\n";
}

// Also check all users just in case
$all = User::all();
echo "\nTotal users in table: " . count($all) . "\n";
foreach ($all as $u) {
    echo "- " . $u->email . " | is_active=" . $u->is_active . " | deleted_at=" . $u->deleted_at . "\n";
}
