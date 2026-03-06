<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Product;
use Illuminate\Support\Facades\DB;

try {
    echo "Testing direct query...\n";
    $p = DB::select("SELECT * FROM Product LIMIT 1");
    print_r($p);

    echo "\nTesting join query with exists...\n";
    // This is what whereHas generates
    $q = "select * from \"products\" where exists (select * from \"bom_headers\" where \"products\".\"id\" = \"bom_headers\".\"product_id\")";
    echo "Running: $q\n";
    $res = DB::select($q);

    print_r($res);

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
