// Minimal fixtures based on DOM inspected in Virtual Test on 19 October 2026.
// Do not move Onetopic under .course-content: the live plugin uses course-content-header.
// node tools/check_content.cjs /path/to/moodle /path/to/compiled.css /path/to/onetopic [output]
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const Mustache = require('mustache');
const {chromium} = require('playwright');
let root = path.resolve(process.argv[2]);
if (fs.existsSync(path.join(root, 'public'))) root = path.join(root, 'public');
const output = path.resolve(process.argv[5] || '/tmp/academic-content');
fs.mkdirSync(output, {recursive: true});
fs.copyFileSync(process.argv[3], path.join(output, 'theme.css'));
fs.copyFileSync(path.join(process.argv[4], 'styles.css'), path.join(output, 'onetopic.css'));
const template = fs.readFileSync(path.join(root, 'lib/templates/activity_header.mustache'), 'utf8');
const intro = '<div class="activity-information"><div class="activity-details"><div id="intro" class="activity-description"><div class="no-overflow"><p>Descripción de la actividad.</p></div></div></div></div>';
const empty = '<div class="activity-information"><div class="activity-details"></div></div>';
const renderHeader = completion => Mustache.render(template, {title: 'Grabación de clase', completion});
const title = 'Maestría en Derecho y Economía del Cambio Climático Cohorte 2026-2027 - Materias obligatorias';
const header = `<header id="page-header"><div class="page-context-header d-flex"><div class="page-header-headings"><h1 class="h2 mb-0">${title}</h1></div></div></header>`;
const tabs = ['Cartelera', 'Derecho Internacional', 'Economía Ambiental', 'Ciencia del CC'].map((t, i) => `<li class="nav-item"><a href="#" class="nav-link${i ? '' : ' active'}">${t}</a></li>`).join('');
const course = `<div class="secondary-navigation"><div class="navigation secondarynav-tabbar"><a class="mds-nav-pill mds-nav-pill--selected" href="#">Curso</a></div></div><div class="course-content-header"><div class="verticaltabs hastopictabs"><div class="tabs-wrapper"><input type="checkbox" id="tabs-menu-fixture" class="tabs-menu-toggle" aria-label="Activar/desactivar menú"><label class="tabs-menu-overlay" for="tabs-menu-fixture"><span class="tabs-menu-expand-title">Tópicos</span></label><ul class="nav nav-tabs format_onetopic-tabs">${tabs}</ul></div><div class="onetopic-tab-body"><div class="course-content"><ul class="section"><li class="activity label modtype_label hasinfo"><div class="activity-item focus-control activityinline" data-region="activity-card"><div id="authored-panel" style="background:#eee;border-left:8px solid #999;padding:1rem">Documentación de la Maestría</div><a href="#">Presentación</a><div class="completion-info"><button>Marcar como hecha</button></div></div></li><li class="activity label modtype_label"><div id="noninline-label" class="activity-item focus-control hiddenactivity">Etiqueta sin activityinline</div></li><li class="activity resource modtype_resource"><div id="resource-card" class="activity-item focus-control">Archivo PDF</div></li></ul></div></div></div></div>`;
function html(kind) {
 const activity = kind !== 'course';
 const main = kind === 'course' ? course : renderHeader(kind === 'board' ? intro : empty) + '<div role="main"><div class="box generalbox"><p>Contenido de la actividad</p></div></div>';
 return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="theme.css"><link rel="stylesheet" href="onetopic.css"></head><body id="${activity ? 'page-mod-' + kind + '-view' : 'page-course-view-onetopic'}" class="uses-drawers limitedwidth category-3121 ${activity ? 'path-mod pagelayout-incourse' : 'path-course-view format-onetopic pagelayout-course'}"><div id="page" class="drawers"><div class="main-inner">${header}<div id="page-content"><div id="region-main">${main}</div></div></div></div></body></html>`;
}
(async () => {
 const browser = await chromium.launch({headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {}), args: ['--no-sandbox']});
 const page = await browser.newPage();
 await page.route(/^https?:/, r => r.abort());
 for (const kind of ['course', 'board', 'page']) {
  fs.writeFileSync(path.join(output, kind + '.html'), html(kind));
  for (const width of [390, 768, 1440, 1920]) {
   await page.setViewportSize({width, height: 900});
   await page.goto('file://' + output + '/' + kind + '.html');
   assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), kind + ' overflow ' + width);
   assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--gflacso-academic-build').trim()), '2026101905', 'browser must parse complete stylesheet tail');
   if (kind === 'course') {
    for (const selector of ['.secondarynav-tabbar', '.activityinline', '#noninline-label', '#resource-card']) {
     assert((await page.locator(selector).evaluate(e => getComputedStyle(e).backgroundColor)).endsWith(', 0)'), selector + ' has no gray surface');
    }
    assert.equal(await page.locator('.activityinline').evaluate(e => getComputedStyle(e).borderTopWidth), '0px', 'no outer label card border');
    assert.equal(await page.locator('#authored-panel').evaluate(e => getComputedStyle(e).borderLeftWidth), '8px', 'authored decoration preserved');
    assert(await page.locator('.completion-info button').isVisible(), 'label completion retained');
    assert.equal(await page.locator('.course-content .verticaltabs').count(), 0, 'match the real Onetopic hierarchy');
    if (width <= 600) {
     assert(!(await page.locator('.format_onetopic-tabs').isVisible()), 'mobile menu initially collapsed');
     await page.locator('label[for="tabs-menu-fixture"]').click();
     assert(await page.locator('.format_onetopic-tabs').isVisible(), 'native checkbox opens mobile menu');
    }

    assert((await page.locator('h1').evaluate(e => getComputedStyle(e).backgroundColor)).endsWith(', 0)'), 'course title background is transparent');
    assert.equal(await page.locator('.nav-link').first().evaluate(e => getComputedStyle(e).borderRadius), '32px');
    assert.equal(await page.locator('.nav-link.active').evaluate(e => getComputedStyle(e).color), 'rgb(255, 255, 255)');
    const inactive = page.locator('.nav-link:not(.active)').first();
    await inactive.hover();
    assert.equal(await inactive.evaluate(e => getComputedStyle(e).color), 'rgb(0, 0, 0)', 'hover retains readable text');
    await inactive.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await inactive.evaluate(e => getComputedStyle(e).outlineStyle), 'solid', 'keyboard focus is visible');
   } else {
    assert(!(await page.locator('#page-header .page-header-headings').isVisible()), 'duplicate heading hidden');
    assert.equal(await page.locator('#region-main > h2').evaluate(e => getComputedStyle(e).borderBottomWidth), '1px');
    assert.equal(await page.locator('.activity-header').isVisible(), kind === 'board', 'empty wrapper must collapse');
    if (kind === 'board') assert(await page.locator('#intro').evaluate(e => getComputedStyle(e).fontFamily.includes('Roboto') && !getComputedStyle(e).fontFamily.includes('Serif')), 'intro keeps sans-serif');
   }
   await page.screenshot({path: path.join(output, kind + '-' + width + '.png'), fullPage: true});
  }
 }
 // Completion remains reachable even without a description.
 await page.locator('.activity-header').evaluate(e => e.innerHTML = '<div class="completion-info"><button>Marcar como hecha</button></div>');
 assert(await page.locator('.activity-header button').isVisible(), 'completion preserved');
 await browser.close();
 console.log('PASS real DOM hierarchy, stylesheet tail, title, Onetopic menu/pills/focus, Board, Page and completion at 12 responsive views');
})().catch(e => { console.error(e); process.exit(1); });
