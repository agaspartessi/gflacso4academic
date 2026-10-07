<?php
defined('MOODLE_INTERNAL') || die();

$plugin->version = 2026100700;
$plugin->requires = 2025100600; // Moodle 5.1 or later, including 5.3.
$plugin->component = 'theme_gflacso4academic';
$plugin->dependencies = [
    'theme_boost' => 2025100600,
];
$plugin->maturity = MATURITY_BETA;
$plugin->release = '2.0.0-beta1';
