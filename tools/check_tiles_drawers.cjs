// Run after check_drawers.cjs, using its real Boost template and drawer controller.
// node tools/check_tiles_drawers.cjs /path/to/fixture-directory /path/to/format_tiles/styles.css
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const directory = path.resolve(process.argv[2] || '');
const tiles = path.resolve(process.argv[3] || '');
if (!fs.existsSync(path.join(directory, 'fixture.html')) || !fs.existsSync(tiles)) {
    console.error('Usage: node tools/check_tiles_drawers.cjs /path/to/fixture-directory /path/to/format_tiles/styles.css');
    process.exit(1);
}
fs.copyFileSync(tiles, path.join(directory, 'format-tiles.css'));
const fixture = fs.readFileSync(path.join(directory, 'fixture.html'), 'utf8')
    .replace('</head>', '<link rel="stylesheet" href="./format-tiles.css"></head>')
    .replace('pagelayout-mydashboard limitedwidth', 'pagelayout-course limitedwidth path-course-view format-tiles')
    .replace('Vista general del curso', 'Curso de Mosaicos')
    .replace('Contenido central', '<ul class="tiles" id="multi_section_tiles"><li class="section tile">Mosaico</li></ul>');
fs.writeFileSync(path.join(directory, 'tiles.html'), fixture);

(async () => {
    const browser = await chromium.launch({
        ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {}),
        args: ['--no-sandbox', '--disable-gpu', '--disable-software-rasterizer', '--no-zygote'],
        headless: true,
    });
    const page = await browser.newPage();
    await page.route(/^https?:/, route => route.abort());
    let count = 0;
    for (const width of [1920, 1440, 1200, 1024, 992, 991, 768, 767, 390]) {
        await page.setViewportSize({width, height: 900});
        await page.goto('file://' + directory + '/tiles.html');
        await page.waitForFunction(() => window.Drawers);
        for (const expanded of [false, true]) {
            await page.evaluate(expanded => {
                document.querySelector('.tiles').classList.toggle('expanded', expanded);
                document.querySelector('.tiles').insertAdjacentHTML('beforeend', expanded ? '<li class="section tile">Contenido expandido</li>' : '');
            }, expanded);
            for (const singleSection of [false, true]) {
                await page.evaluate(singleSection => {
                    document.body.classList.toggle('format-tiles-single-sec', singleSection);
                }, singleSection);
                for (const state of ['none', 'left', 'right', ...(width >= 992 ? ['both'] : [])]) {
                    await page.evaluate(state => {
                        for (const side of ['left', 'right']) {
                            const instance = window.Drawers.getDrawerInstanceForNode(document.querySelector('.drawer-' + side));
                            if (state === side || state === 'both') {
                                instance.openDrawer({focusOnCloseButton: false});
                            } else {
                                instance.closeDrawer({focusOnOpenButton: false});
                            }
                        }
                    }, state);
                    await page.waitForTimeout(260);
                    const boxes = await page.evaluate(() => {
                        const rect = selector => {
                            const r = document.querySelector(selector).getBoundingClientRect();
                            return {x: r.x, right: r.right, width: r.width};
                        };
                        return {
                            main: rect('.main-inner'), header: rect('.header-maxwidth'),
                            left: rect('.drawer-left'), right: rect('.drawer-right'),
                            tiles: rect('#multi_section_tiles'),
                            overflow: document.documentElement.scrollWidth > innerWidth + 1,
                        };
                    });
                    const tag = `${width}px ${expanded ? 'expandido' : 'normal'} ${singleSection ? 'sección' : 'curso'} ${state}`;
                    assert(!boxes.overflow, tag + ' desborde horizontal');
                    if (width >= 768) {
                        assert(boxes.main.width <= 1001, tag + ' contenido excede ancho de Boost');
                        assert(boxes.header.width <= 1001, tag + ' encabezado excede ancho de Boost');
                    }
                    if (width >= 992) {
                        if (state === 'left' || state === 'both') {
                            assert(boxes.left.right <= boxes.main.x + 1, tag + ' cajón izquierdo sobre contenido');
                        }
                        if (state === 'right' || state === 'both') {
                            assert(boxes.right.x >= boxes.main.right - 1, tag + ' cajón derecho sobre contenido');
                        }
                    }
                    for (const side of ['left', 'right']) {
                        if (state === side || state === 'both') {
                            assert(boxes[side].x >= -1 && boxes[side].right <= width + 1,
                                tag + ' cajón fuera de pantalla: ' + side + ' ' + JSON.stringify(boxes));
                        }
                    }
                    count++;
                }
            }
        }
    }
    await browser.close();
    console.log(`PASS ${count} estados de Tiles, expandido, cajones y anchos de pantalla`);
})().catch(error => { console.error(error); process.exit(1); });
