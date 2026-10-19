// Browser check of Moodle 5.3's MDS primary and secondary navigation styles.
// Run after check_drawers.cjs has generated a fixture using Boost's templates.
// node tools/check_navigation.cjs /path/to/fixture-directory
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const directory = path.resolve(process.argv[2] || '');
if (!fs.existsSync(path.join(directory, 'fixture.html'))) {
    console.error('Usage: node tools/check_navigation.cjs /path/to/fixture-directory');
    process.exit(1);
}
const pill = (label, classes = '') => `<li class="nav-item d-flex align-items-center"><a href="#" class="mds-nav-pill ${classes}"><span class="mds-nav-pill__indicator"></span><span class="mds-nav-pill__label">${label}</span></a></li>`;
const primary = `<div class="primary-navigation"><nav class="navigation primarynav-navbar"><ul class="nav more-nav">${pill('Área personal', 'mds-nav-pill--selected')}${pill('Mis cursos')}${pill('Administración del sitio')}</ul></nav></div>`;
const secondary = `<div class="secondary-navigation"><nav class="navigation secondarynav-tabbar"><ul class="nav more-nav">${pill('Curso', 'mds-nav-pill--selected')}${pill('Configuración')}${pill('Participantes')}${pill('Calificaciones', 'active')}${pill('Más', 'dropdown-toggle')}</ul></nav></div>`;
const html = fs.readFileSync(path.join(directory, 'fixture.html'), 'utf8')
    .replace('<div id="usernavigation"', primary + '<div id="usernavigation"')
    .replace('<header id="page-header"', secondary + '<header id="page-header"');
fs.writeFileSync(path.join(directory, 'navigation.html'), html);

(async () => {
    const browser = await chromium.launch({
        ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {}),
        args: ['--no-sandbox', '--disable-gpu', '--disable-software-rasterizer', '--no-zygote'],
        headless: true,
    });
    const page = await browser.newPage();
    await page.route(/^https?:/, route => route.abort());
    const styles = selector => page.locator(selector).first().evaluate(element => {
        const s = getComputedStyle(element);
        const label = getComputedStyle(element.querySelector('.mds-nav-pill__label'));
        return {background: s.backgroundColor, color: s.color, labelColor: label.color,
            radius: s.borderRadius, height: element.getBoundingClientRect().height,
            border: s.borderBottomColor, fontSize: parseFloat(label.fontSize),
            indicator: getComputedStyle(element.querySelector('.mds-nav-pill__indicator')).display};
    });
    for (const width of [1920, 1440, 1200, 1024]) {
        await page.setViewportSize({width, height: 900});
        await page.goto('file://' + directory + '/navigation.html');
        const primarySelected = await styles('.primary-navigation .mds-nav-pill--selected');
        const secondarySelected = await styles('.secondary-navigation .mds-nav-pill--selected');
        assert(primarySelected.fontSize >= 18 && secondarySelected.fontSize >= 18, `${width} typography`);
        assert.equal(primarySelected.radius, '0px', `${width} primary shape`);
        assert.equal(primarySelected.background, 'rgba(0, 0, 0, 0)', `${width} primary selected triangle`);
        assert(primarySelected.height >= 61, `${width} primary tab fills navbar height`);
        assert(await page.locator('.primary-navigation .mds-nav-pill--selected').evaluate(element => {
            const labelBottom = element.querySelector('.mds-nav-pill__label').getBoundingClientRect().bottom;
            const triangleHeight = parseFloat(getComputedStyle(element, '::after').borderBottomWidth);
            return element.getBoundingClientRect().bottom - triangleHeight >= labelBottom + 2;
        }), `${width} active triangle is below label`);
        assert.equal(secondarySelected.radius, '0px', `${width} secondary shape`);
        assert.notEqual(secondarySelected.background, 'rgba(0, 0, 0, 0)', `${width} secondary selected background`);
        assert(secondarySelected.height >= 59, `${width} secondary active area`);
        assert.equal(secondarySelected.labelColor, 'rgb(255, 255, 255)', `${width} secondary selected text contrast`);
        assert.equal(primarySelected.indicator, 'none', `${width} native dot hidden`);
        assert.equal(secondarySelected.indicator, 'none', `${width} native dot hidden`);
        const primary = '.primary-navigation .mds-nav-pill:not(.mds-nav-pill--selected)';
        const secondary = '.secondary-navigation .mds-nav-pill:not(.mds-nav-pill--selected):not(.active)';
        await page.mouse.move(width - 5, 850);
        const primaryBefore = await styles(primary);
        const secondaryBefore = await styles(secondary);
        await page.locator(primary).first().hover();
        assert.notEqual((await styles(primary)).background, primaryBefore.background, `${width} primary hover`);
        assert.equal((await styles(primary)).labelColor, 'rgb(255, 255, 255)', `${width} primary hover text contrast`);
        await page.locator(secondary).first().hover();
        assert.notEqual((await styles(secondary)).background, secondaryBefore.background, `${width} secondary hover`);
        assert.equal((await styles(secondary)).labelColor, 'rgb(255, 255, 255)', `${width} secondary hover text contrast`);
        await page.locator('.primary-navigation .mds-nav-pill--selected').hover();
        assert.equal((await styles('.primary-navigation .mds-nav-pill--selected')).labelColor,
            'rgb(255, 255, 255)', `${width} primary selected hover text contrast`);
        await page.locator('.secondary-navigation .mds-nav-pill--selected').hover();
        assert.equal((await styles('.secondary-navigation .mds-nav-pill--selected')).labelColor,
            'rgb(255, 255, 255)', `${width} secondary selected hover text contrast`);
        assert.equal((await styles('.secondary-navigation .mds-nav-pill.active')).indicator, 'none', `${width} active tab`);
        assert(await page.locator('.secondary-navigation .mds-nav-pill.dropdown-toggle').isVisible(), `${width} More visible`);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width} overflow`);
    }
    await browser.close();
    console.log('PASS Moodle 5.3 navigation typography, selection, hover and overflow at four desktop widths');
})().catch(error => { console.error(error); process.exit(1); });
