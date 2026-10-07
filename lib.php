<?php
defined('MOODLE_INTERNAL') || die();

/**
 * Return Academic's variables after Boost's brand colour and Raw initial SCSS.
 *
 * Boost runs its callback with the child theme's settings. The !default values
 * in pre.scss therefore respect those settings and derive the matching palette.
 *
 * @param theme_config $theme Theme configuration.
 * @return string
 */
function theme_gflacso4academic_get_pre_scss($theme): string {
    return file_get_contents(__DIR__ . '/scss/pre.scss');
}

/**
 * Return the selected Boost preset followed by Academic's own styles.
 *
 * Compilation order: Boost pre callback (brandcolour + Raw initial SCSS),
 * Academic pre.scss, selected preset, Academic post.scss, Boost extra callback
 * (Raw SCSS + background rules). Raw settings are never appended a second time.
 *
 * @param theme_config $theme Theme configuration.
 * @return string
 */
function theme_gflacso4academic_get_main_scss_content($theme): string {
    global $CFG;

    $preset = $theme->settings->preset ?? 'default.scss';
    $scss = null;

    if (!in_array($preset, ['default.scss', 'plain.scss'], true) && !empty($preset)) {
        $fs = get_file_storage();
        $context = context_system::instance();
        $presetfile = $fs->get_file($context->id, 'theme_gflacso4academic', 'preset', 0, '/', $preset);
        if ($presetfile) {
            $scss = $presetfile->get_content();
        }
    }

    if ($scss === null) {
        // In Moodle 5.1+ dirroot already points to public; do not append public.
        $filename = $preset === 'plain.scss' ? 'plain.scss' : 'default.scss';
        $scss = file_get_contents($CFG->dirroot . '/theme/boost/scss/preset/' . $filename);
    }

    // Boost 5.3's plain preset omits MDS tokens used by Moodle's core SCSS.
    // Feature detection keeps this working on 5.1, which has no design system.
    if ($preset === 'plain.scss' && is_readable($CFG->dirroot . '/theme/boost/scss/design-system.scss')) {
        $scss = "@import \"design-system\";\n" . $scss;
    }

    return $scss . "\n" . file_get_contents(__DIR__ . '/scss/post.scss');
}
