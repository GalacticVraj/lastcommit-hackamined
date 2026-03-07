<?php
$data = json_decode(file_get_contents('all_cols.json'), true);
foreach($data as $table => $cols) {
    echo "TABLE: $table\n";
    if (is_array($cols)) {
        foreach($cols as $c) echo "  $c\n";
    } else {
        echo "  $cols\n";
    }
}
