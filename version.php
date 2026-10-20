<?php
defined('MOODLE_INTERNAL') || die();

$plugin->version = 2026102000;
$plugin->requires = 2026100500; // Moodle 5.3 or later.
$plugin->component = 'theme_gflacso4academic';
$plugin->dependencies = [
    'theme_boost' => 2026100500,
];
$plugin->maturity = MATURITY_BETA;
$plugin->release = '2.0.0-beta10';
