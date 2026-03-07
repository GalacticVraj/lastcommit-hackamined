<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

$tables = ['products', 'bom_headers', 'bom_items', 'routing_tables', 'warehouse_stocks', 'resource_master', 'shift_master'];

foreach($tables as $table) {
    if (!Schema::hasTable($table)) continue;
    
    $cols = Schema::getColumnListing($table);
    foreach($cols as $col) {
        $trimmed = trim($col);
        if ($col !== $trimmed) {
            echo "Renaming '$table'.'$col' to '$trimmed'...\n";
            try {
                // SQLite rename column syntax (requires 3.25.0+)
                DB::statement("ALTER TABLE \"$table\" RENAME COLUMN \"$col\" TO \"$trimmed\"");
            } catch (\Exception $e) {
                echo "Failed to rename '$col': " . $e->getMessage() . "\n";
            }
        }
    }
}
echo "Cleanup complete.\n";
