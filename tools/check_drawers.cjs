// Browser regression check using Boost's actual templates and AMD drawer controller.
// npm install --no-save playwright mustache && npx playwright install chromium
// node tools/check_drawers.cjs /path/to/moodle /path/to/compiled-default.css [output-directory]
// Optional: CHROMIUM_EXECUTABLE_PATH selects an existing Chromium binary.
// External services (preferences, templates, tooltip, backdrop) are doubled. No campus is accessed.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const Mustache=require('mustache');
if (!process.argv[2] || !process.argv[3]) {
 console.error('Usage: node tools/check_drawers.cjs /path/to/moodle /path/to/compiled-default.css [output-directory]');
 process.exit(1);
}
let moodleroot=path.resolve(process.argv[2]);
if (fs.existsSync(path.join(moodleroot,'public/theme/boost'))) moodleroot=path.join(moodleroot,'public');
const base=path.join(moodleroot,'theme/boost');
const output=process.argv[4]?path.resolve(process.argv[4]):fs.mkdtempSync(path.join(os.tmpdir(),'academic-drawers-'));
fs.mkdirSync(output,{recursive:true});
fs.copyFileSync(path.resolve(process.argv[3]),path.join(output,'moodle-503-default.css'));
const svg='<svg class="icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="1" y="2" width="14" height="12" fill="none" stroke="currentColor"/><path d="M5 2v12" stroke="currentColor"/></svg>';
const blocks=Array.from({length:12},(_,i)=>`<section class="block card" data-block="html"><div class="card-body"><h3 class="card-title">Bloque ${i+1}</h3><div class="card-text"><p>Contenido del bloque ${i+1}</p><a href="#target">Enlace de prueba</a><p>Información para revisar el scroll lateral.</p></div></div></section>`).join('');
function clean(s){return s.replace(/{{![\s\S]*?}}/g,'').replace(/{{#js}}[\s\S]*?{{\/js}}/g,'');}
const drawer=clean(fs.readFileSync(base+'/templates/drawer.mustache','utf8'));
function renderDrawer(side){
 const id=side==='left'?'theme_boost-drawers-courseindex':'theme_boost-drawers-blocks';
 const fields={id,drawerclasses:'drawer drawer-'+side,drawerpreferencename:'drawer-open-'+side,drawerstate:'show-drawer-'+side,drawercloseonresize:side==='right'?'1':'0',closebuttontext:'Cerrar cajón',closebuttonicon:svg,drawerheading:side==='left'?'Índice del curso':'',drawercontrols:side==='left'?'<button class="btn btn-link">Contraer todo</button>':'',drawercontent:side==='left'?Array.from({length:60},(_,i)=>`<div class="courseindex-item"><a href="#target">Sección ${i+1}</a></div>`).join(''):blocks};
 return drawer.replace(/{{\$([\w]+)}}([\s\S]*?){{\/\1}}/g,(_,key,def)=>fields[key]??def);
}
let template=clean(fs.readFileSync(base+'/templates/drawers.mustache','utf8'));
let n=0;template=template.replace(/{{<\s*theme_boost\/drawer\s*}}[\s\S]*?{{\/\s*theme_boost\/drawer\s*}}/g,()=>renderDrawer(n++?'right':'left'));
template=template.replace(/{{#pix}}[\s\S]*?{{\/pix}}/g,svg).replace(/{{#str}}([\s\S]*?){{\/str}}/g,(_,s)=>s);
const context={bodyattributes:'class="uses-drawers pagelayout-mydashboard limitedwidth"',courseindex:'yes',hasblocks:true,output:{standard_top_of_body_html:'',full_header:'<header id="page-header" class="header-maxwidth"><h1>Tablero</h1></header>',main_content:'<div role="main"><h2>Vista general del curso</h2><button class="btn btn-primary">Crear curso</button><div style="height:1500px">Contenido central</div><div id="target">Fin del contenido</div></div>',standard_after_main_region_html:''}};
let html=Mustache.render(template,context,{
 'theme_boost/head':'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="./moodle-503-default.css"><title>Académico 5.3 — cajones</title></head>',
 'theme_boost/navbar':'<nav class="navbar fixed-top bg-body navbar-expand"><a class="navbar-brand" href="#">FLACSO Académico</a><ul class="navbar-nav"><li class="nav-item"><a class="nav-link" href="#">Tablero</a></li></ul></nav>',
 'theme_boost/footer':'<footer id="page-footer" class="nova-foot"><p>FLACSO Argentina</p></footer>',
 'core/local/toast/wrapper':''
});
html=html.replace('</body>','<script src="./services.js"></script><script src="./drawers.js"></script></body>');
fs.writeFileSync(output+'/fixture.html',html);
fs.copyFileSync(base+'/amd/build/drawers.min.js',output+'/drawers.js');
fs.writeFileSync(output+'/services.js', String.raw`
// Only external services are doubled; the drawer controller is Moodle's real AMD module.
window.define=(name,deps,factory)=>{
 const exports={};
 class Pending {resolve(){}}
 class Tooltip {static getInstance(){return null} disable(){} enable(){}}
 class Backdrop {constructor(){this.el=document.createElement('div');this.el.className='drawer-test-backdrop';document.body.append(this.el)}setZIndex(i){this.el.style.zIndex=i}getAttachmentPoint(){return {get:()=>this.el}}show(){this.el.setAttribute('data-show','1')}hide(){this.el.removeAttribute('data-show')}}
 const services={
  'exports':exports,'core/modal_backdrop':Backdrop,'core/templates':{render:async()=>'<div></div>'},
  'core/aria':{hide:n=>n.setAttribute('aria-hidden','true'),unhide:n=>n.setAttribute('aria-hidden','false')},
  'core/event_dispatcher':{dispatchEvent:(name,detail,node,options)=>{const e=new CustomEvent(name,{detail,bubbles:true,...options});node.dispatchEvent(e);return e}},
  'core/utils':{debounce:(fn,ms)=>{let t;return(...args)=>{clearTimeout(t);t=setTimeout(()=>fn(...args),ms)}}},
  'core/pagehelpers':{isSmall:()=>window.innerWidth<768,isLarge:()=>window.innerWidth>=992},
  'core/pending':Pending,'core_user/repository':{setUserPreference:(...args)=>{window.lastPreference=args;return Promise.resolve()}},
  'bootstrap':{Tooltip},'core/pubsub':{subscribe:()=>{}},'core/drawer_events':{}
 };
 factory(...deps.map(n=>services[n]));window.Drawers=exports.default;
};
window.right_to_left=()=>false;
`);

const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-zygote'],headless:true});
 const page=await browser.newPage();let count=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const metrics=async()=>page.evaluate(()=>{
  const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
  const d=side=>{let e=document.querySelector('.drawer-'+side),b=e.querySelector('.drawertoggle'),c=e.querySelector('.drawercontent');return {r:rect(e),b:rect(b),header:rect(e.querySelector('.drawerheader')),visibility:getComputedStyle(e).visibility,show:e.classList.contains('show'),aria:e.getAttribute('aria-hidden'),scroll:c.scrollHeight,client:c.clientHeight,z:getComputedStyle(e).zIndex}};
  return {main:rect(document.querySelector('.main-inner')),left:d('left'),right:d('right'),nav:rect(document.querySelector('.navbar')),width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1};
 });
 for(const width of [1920,1440,1200,1024,992,991,768,767,390]){
  await page.setViewportSize({width,height:900});await page.goto('file://'+output+'/fixture.html');await page.waitForFunction(()=>window.Drawers);
  for(const layout of ['pagelayout-mydashboard limitedwidth','pagelayout-standard','pagelayout-report']){
   await page.evaluate(layout=>{document.body.className='uses-drawers '+layout;window.scrollTo(0,0)},layout);
   for(const state of ['none','left','right',...(width>=992?['both']:[])]){
    await page.evaluate(state=>{
     for(const side of ['left','right']){const d=window.Drawers.getDrawerInstanceForNode(document.querySelector('.drawer-'+side));if(state===side||state==='both')d.openDrawer({focusOnCloseButton:false});else d.closeDrawer({focusOnOpenButton:false});}
    },state);await page.waitForTimeout(350);
    const m=await metrics();const tag=`${width} ${layout} ${state}`;
    assert(!m.overflow,tag+' horizontal overflow');
    for(const side of ['left','right']){const d=m[side];if(!d.show){assert.equal(d.visibility,'hidden',tag+' hidden drawer');continue;}
     assert(d.r.x>=-1&&d.r.right<=width+1,tag+' drawer outside viewport '+JSON.stringify(d.r));
     assert(d.r.y>=m.nav.bottom-1,tag+' drawer behind navbar');
     assert(d.r.bottom<=901,tag+' drawer exceeds viewport');
     assert(d.b.x>=d.r.x-1&&d.b.right<=d.r.right+1&&d.b.y>=d.r.y-1&&d.b.bottom<=d.r.bottom+1,tag+' close button outside drawer '+JSON.stringify(d));
     assert(d.header.y>=d.r.y-1,tag+' header outside drawer');
     assert(d.client>10&&d.scroll>d.client,tag+' missing inner scroll');
     if(width>=992)assert(side==='left'?d.r.right<=m.main.x+1:d.r.x>=m.main.right-1,tag+' drawer overlaps main');
    }
    if(width===1440&&layout.includes('mydashboard')&&['none','right','both'].includes(state))await page.screenshot({path:output+'/after-'+state+'.png'});
    count++;
   }
  }
 }
 // Exercise real clicks, inner scroll, keyboard focus restoration, resize, sticky footer.
 await page.setViewportSize({width:1440,height:900});await page.goto('file://'+output+'/fixture.html');await page.waitForFunction(()=>window.Drawers);
 await page.locator('.drawer-right-toggle button').click();await page.waitForTimeout(400);
 assert(await page.locator('.drawer-right').evaluate(e=>e.classList.contains('show')),'open click');
 assert(await page.locator('.drawer-right .drawertoggle svg').evaluate(e=>e.getBoundingClientRect().width>=16),'close icon is not squeezed');
 await page.locator('.drawer-right .drawercontent').evaluate(e=>e.scrollTop=e.scrollHeight);await page.waitForTimeout(60);
 assert(await page.locator('.drawer-right').evaluate(e=>e.classList.contains('scrolled')),'scroll class');
 await page.locator('.drawer-right .drawertoggle').click();await page.waitForTimeout(400);
 assert(await page.locator('.drawer-right-toggle button').evaluate(e=>e===document.activeElement),'keyboard focus restoration');
 await page.evaluate(()=>{document.documentElement.style.setProperty('--sticky-footer-total-height','100px');document.querySelector('#page').classList.add('hasstickyfooter')});
 await page.locator('.drawer-right-toggle button').click();await page.waitForTimeout(400);let m=await metrics();assert(m.right.r.bottom<=801,'sticky footer clearance');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(650);assert(!(await metrics()).right.show,'resize closes right drawer');
 await page.locator('.drawer-right-toggle button').click();await page.waitForTimeout(400);assert((await metrics()).right.show,'mobile open');
 await page.locator('.drawer-right .drawertoggle').click();await page.waitForTimeout(400);assert(!(await metrics()).right.show,'mobile close');
 assert.deepEqual(errors,[],'JavaScript errors');
 console.log(`PASS ${count} viewport/layout/drawer states; open/close clicks, inner scroll, focus restoration, sticky footer and mobile resize`);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
