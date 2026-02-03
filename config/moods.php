<?php

$colorsPath = resource_path('js/moods/colors.json');

$colors = [];

if (is_file($colorsPath)) {
    $decoded = json_decode(file_get_contents($colorsPath), true);
    if (is_array($decoded)) {
        $colors = $decoded;
    }
}

return [
    'colors' => $colors,
    'default_color' => 'gray',
];
