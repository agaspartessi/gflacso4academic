<?php
// Standalone integration check: uses Moodle's real theme callbacks and SCSS compiler.
// Usage: php tools/check_compatibility.php /absolute/path/to/moodle [css-output-directory]
// No Moodle configuration, database, session or campus credentials are loaded.
if (PHP_SAPI !== 'cli') {
    exit('CLI only');
}
if (empty($argv[1])) {
    fwrite(STDERR, "Usage: php tools/check_compatibility.php /path/to/moodle [css-output-directory]\n");
    exit(1);
}
define('MOODLE_INTERNAL', true);
// Compiler warnings can accompany syntactically broken output. Never accept it.
set_error_handler(function($severity, $message, $file, $line) {
    if ($severity & (E_WARNING | E_NOTICE | E_USER_WARNING | E_USER_NOTICE)) {
        throw new ErrorException($message, 0, $severity, $file, $line);
    }
    return false;
});
define('BLOCK_ADDBLOCK_POSITION_FLATNAV', 0);
define('MATURITY_BETA', 100);
$root = dirname(__DIR__);
$moodleroot = realpath($argv[1]);
if (is_dir($moodleroot . '/public/theme/boost')) {
    $moodleroot .= '/public';
}
if (!is_file($moodleroot . '/theme/boost/config.php')) {
    fwrite(STDERR, "Moodle's Boost theme was not found.\n");
    exit(1);
}
$versioninfo = file_get_contents($moodleroot . '/version.php');
if (!preg_match('/\$version\s*=\s*(\d+)/', $versioninfo, $matches) || (int)$matches[1] < 2026100500) {
    fwrite(STDERR, "This branch requires Moodle 5.3 or later.\n");
    exit(1);
}
$branch = basename(dirname($moodleroot));
$outputdir = $argv[2] ?? null;
if ($outputdir !== null && !is_dir($outputdir)) {
    mkdir($outputdir, 0777, true);
}
$CFG = (object)['dirroot' => $moodleroot, 'root' => dirname($moodleroot), 'pathtosassc' => ''];
class core_component {
    public static function get_plugin_types() {
        global $CFG;
        return ['theme' => $CFG->dirroot . '/theme'];
    }
}
spl_autoload_register(function($name) use ($moodleroot) {
    $prefix = 'ScssPhp\\ScssPhp\\';
    if (str_starts_with($name, $prefix)) {
        require $moodleroot . '/lib/scssphp/src/' . str_replace('\\', '/', substr($name, strlen($prefix))) . '.php';
    }
});
spl_autoload_register(function($name) use ($moodleroot) {
    $roots = [
        'MatthiasMullie\\Minify\\' => '/lib/minify/matthiasmullie-minify/src/',
        'MatthiasMullie\\PathConverter\\' => '/lib/minify/matthiasmullie-pathconverter/src/',
    ];
    foreach ($roots as $prefix => $directory) {
        if (str_starts_with($name, $prefix)) {
            require $moodleroot . $directory . str_replace('\\', '/', substr($name, strlen($prefix))) . '.php';
        }
    }
});
require "$moodleroot/lib/classes/minify.php";
class asset_url_stub {
    public function __toString() { return $this->out(false); }
    public function out($escaped = true) { return 'https://example.invalid/asset.svg'; }
}
require "$moodleroot/lib/classes/scss.php";
require "$moodleroot/lib/classes/output/theme_config.php";
require "$moodleroot/theme/boost/lib.php";
require "$root/lib.php";
class context_system {
    public static function instance() { return (object)['id' => 1]; }
}
class preset_file {
    public function get_content() {
        global $CFG;
        return file_get_contents($CFG->dirroot . '/theme/boost/scss/preset/default.scss') . "\n.uploaded-marker { color: red; }";
    }
}
function get_file_storage() {
    return new class {
        public function get_file($id, $component, $area, $item, $path, $file) {
            if ($component !== 'theme_gflacso4academic') { throw new Exception('Wrong preset component'); }
            return $file === 'uploaded.scss' ? new preset_file() : false;
        }
    };
}
function get_string($key, $component) { return 'AI generated image'; }
class theme_stub extends \core\output\theme_config {
    public function __construct($settings) {
        $this->settings = $settings;
        $this->dir = dirname(__DIR__);
        $this->parent_configs = ['boost' => (object)[
            'prescsscallback' => 'theme_boost_get_pre_scss',
            'extrascsscallback' => 'theme_boost_get_extra_scss',
        ]];
    }
    public function setting_file_url($name, $area) { return null; }
    public function font_url($name, $component = '') { return new asset_url_stub(); }
    public function image_url($name, $component = '', $svg = null) { return new asset_url_stub(); }
}
$cases = [
    'default' => (object)['preset' => 'default.scss'],
    'plain' => (object)['preset' => 'plain.scss'],
    'uploaded' => (object)['preset' => 'uploaded.scss'],
    'fallback' => (object)['preset' => 'missing.scss'],
    'configured' => (object)[
        'preset' => 'default.scss', 'brandcolor' => '#773344',
        'scsspre' => '$primary: #663399; .raw-pre-once { color: red; }',
        'scss' => '.raw-post-once { color: blue; } .navbar.bg-body { background: #123456 !important; }',
    ],
];
foreach ($cases as $name => $settings) {
    $THEME = new theme_stub($settings);
    require "$root/config.php";
    $pre = $THEME->get_pre_scss_code();
    $main = ($THEME->scss)($THEME);
    $extra = $THEME->get_extra_scss_code();
    $source = $pre . "\n" . $main . "\n" . $extra;
    if ($name === 'configured') {
        foreach (['raw-pre-once', 'raw-post-once'] as $marker) {
            if (substr_count($source, $marker) !== 1) { throw new Exception('Duplicated raw SCSS'); }
        }
        if (strpos($source, 'raw-post-once') < strpos($source, '/*#region*/// Navbar')) {
            throw new Exception('Raw SCSS must follow Academic styles');
        }
    }
    if ($name === 'uploaded' && !str_contains($source, 'uploaded-marker')) {
        throw new Exception('Uploaded preset was not loaded');
    }
    if ($name === 'configured' && strpos($source, '$primary: #663399') > strpos($source, '$primary: hsl')) {
        throw new Exception('Raw initial SCSS must precede default palette derivation');
    }
    $compiler = new core_scss();
    $compiler->setImportPaths(["$root/scss", "$moodleroot/theme/boost/scss"]);
    $css = $compiler->compile($source);
    if (strlen($css) < 100000) { throw new Exception('Incomplete CSS'); }
    $servedcss = core_minify::css($THEME->post_process($css));
    if (str_contains($servedcss, 'Problem detected during CSS minimisation')) {
        throw new Exception('Moodle minifier failed');
    }
    if (!str_contains($servedcss, '--gflacso-academic-build:2026101905')) {
        throw new Exception('Build marker missing from the served CSS');
    }
    if ($outputdir !== null) {
        file_put_contents($outputdir . "/$branch-$name.served.css", $servedcss);
        file_put_contents($outputdir . "/$branch-$name.css", $css);
    }
    echo "$branch $name: compiled " . strlen($css) . " bytes; post-processed/minified " . strlen($servedcss) . " bytes\n";
}
