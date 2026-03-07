<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Product;
use App\Models\BOMHeader;
use App\Models\RoutingTable;

$products = Product::whereHas('bomHeader')
    ->whereHas('routings')
    ->get(['id', 'code', 'name']);

echo "Products with BOM & Routing: " . $products->count() . "\n";
foreach($products as $p) {
    echo "- {$p->code}: {$p->name} (ID: {$p->id})\n";
}

$allProducts = Product::count();
echo "Total Products: $allProducts\n";

$boms = BOMHeader::count();
echo "Total BOMs: $boms\n";

$routings = RoutingTable::distinct('product_id')->count();
echo "Total Products with Routings: $routings\n";
