<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$tables = ['products', 'bom_headers', 'bom_items', 'routing_tables', 'warehouse_stocks', 'resource_master', 'shift_master'];

foreach($tables as $table) {
    try {
        $rows = DB::select("PRAGMA table_info(\"$table\")");
        foreach($rows as $r) {
            $colName = $r->name;
            $trimmed = trim($colName, " \t\n\r\0\x0B");
            
            if ($colName !== $trimmed) {
                echo "Renaming '$table'.'$colName' (hex: ".bin2hex($colName).") to '$trimmed'...\n";
                // Using double quotes and raw statement to catch the weird name
                DB::statement("ALTER TABLE \"$table\" RENAME COLUMN \"$colName\" TO \"$trimmed\"");
            }
        }
    } catch (\Exception $e) {
        echo "Error checking table $table: " . $e->getMessage() . "\n";
    }
}
echo "Sanitization complete.\n";
