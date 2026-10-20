// Visual/layout check with Moodle's actual login form and Académico's login layout.
// Authentication, MFA and external-provider services must still be tested on campus.
// node tools/check_login.cjs /path/to/moodle /path/to/compiled.css [output-directory]
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const Mustache = require('mustache');
const {chromium} = require('playwright');
if (!process.argv[2] || !process.argv[3]) {
    console.error('Usage: node tools/check_login.cjs /path/to/moodle /path/to/compiled.css [output-directory]');
    process.exit(1);
}
let root = path.resolve(process.argv[2]);
if (fs.existsSync(path.join(root, 'public/theme/boost'))) root = path.join(root, 'public');
const output = process.argv[4] ? path.resolve(process.argv[4]) : fs.mkdtempSync(path.join(os.tmpdir(), 'academic-login-'));
fs.mkdirSync(output, {recursive: true});
fs.copyFileSync(process.argv[3], path.join(output, 'theme.css'));
const clean = text => text.replace(/{{![\s\S]*?}}/g, '').replace(/{{#js}}[\s\S]*?{{\/js}}/g, '');
const translations = {
    loginwelcomeback: 'Bienvenido/a', loginto: 'Campus FLACSO Académico', username: 'Usuario',
    firsttime: 'Registrarse como nuevo usuario', loginsteps: 'Para acceder a los cursos, creá una cuenta.', startsignup: 'Crear nueva cuenta', forgotaccount: '¿Olvidaste tu usuario o contraseña?', password: 'Contraseña', enterusername: 'Ingresá tu usuario', loginenterpassword: 'Ingresá tu contraseña',
    loginforgotpassword: '¿Olvidaste tu contraseña?', login: 'Acceder', loginseparatoror: 'O',
    loginwith: 'Acceder con cuenta institucional', cookiesnotice: 'Aviso de cookies', loginasguest: 'Entrar como invitado',
};
let form = clean(fs.readFileSync(path.join(__dirname, '../templates/core/loginform.mustache'), 'utf8'))
    .replace(/{{#str}}([\s\S]*?){{\/str}}/g, (_, key) => translations[key.trim().split(',')[0]] || key.trim().split(',')[0])
    .replace(/{{#pix}}[\s\S]*?{{\/pix}}/g, '<span aria-hidden="true">●</span>');
form = Mustache.render(form, {
    sitename: 'FLACSO Académico', logourl: 'file://' + path.resolve(__dirname, '../pix/FLACSO_sin_fondo_Virtual.svg'), showloginform: true, hasidentityproviders: true, cansignup: true,
    identityproviders: [{name: 'Institucional', url: '#sso'}], canloginasguest: true,
    loginurl: '#login', forgotpasswordurl: '#recover', logintoken: 'fixture-only',
});
const layout = fs.readFileSync(path.join(__dirname, '../templates/core/login_layout.mustache'), 'utf8');
const image = path.resolve(__dirname, '../pix/mapa.svg');
const content = Mustache.render(layout, {output: {main_content: '<div role="main">' + form + '</div>'}});
assert(content.trimStart().startsWith('<div'), 'layout must not leak template comment delimiters');
fs.writeFileSync(path.join(output, 'login.html'), `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="theme.css"><style>.pagelayout-login #page { background-image:url("file://${image}"); }</style></head><body id="page-login-index" class="pagelayout-login"><div id="page-wrapper"><div id="page" class="mt-0">${content}</div></div></body></html>`);
(async () => {
    const browser = await chromium.launch({headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {}), args: ['--no-sandbox', '--disable-gpu', '--disable-software-rasterizer', '--no-zygote']});
    const page = await browser.newPage();
    await page.route(/^https?:/, route => route.abort());
    for (const [width, height] of [[360, 800], [390, 844], [844, 390], [768, 1024], [1440, 900]]) {
        await page.setViewportSize({width, height});
        await page.goto('file://' + output + '/login.html');
        const geometry = await page.evaluate(() => {
            const panel = document.querySelector('.login-container').getBoundingClientRect();
            return {overflow: document.documentElement.scrollWidth > innerWidth + 1, left: panel.left, right: panel.right, top: panel.top};
        });
        assert(!geometry.overflow, `${width} horizontal overflow`);
        assert(geometry.left >= -1 && geometry.right <= width + 1 && geometry.top >= -1, `${width} panel outside viewport`);
        const colour = selector => page.locator(selector).first().evaluate(el => getComputedStyle(el).color);
        assert.equal(await page.locator('.loginform > h1').count(), 0, 'no new welcome heading');
        assert(await page.locator('label[for="username"]').evaluate(el => el.classList.contains('visually-hidden')), 'accessible hidden label');
        assert.equal(await colour('.academic-login-registration h2'), 'rgb(255, 255, 255)', 'registration title on institutional background');
        assert.notEqual(await colour('.login-identityprovider-btn'), 'rgb(255, 255, 255)', 'SSO text on white');
        await page.locator('.login-cookiesnotice button').scrollIntoViewIfNeeded();
        assert(await page.locator('.login-cookiesnotice button').isVisible(), 'bottom controls reachable');
        await page.screenshot({path: path.join(output, `login-${width}.png`), fullPage: true});
    }
    // A long recovery/MFA form must expand the page rather than disappear above it.
    await page.locator('.loginform').evaluate(el => { el.innerHTML = '<h1>Verificación</h1><div style="height:1500px">Formulario largo</div><button id="continue" class="btn btn-primary">Continuar</button>'; });
    await page.locator('#continue').scrollIntoViewIfNeeded();
    assert(await page.locator('#continue').isVisible(), 'long form bottom reachable');
    console.log('PASS 5 login viewports, classic form, signup panel, SSO and long-form layout');
    await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
