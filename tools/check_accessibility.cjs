// Actual Boost drawer templates + observed local_accessibility launcher DOM/CSS.
// node tools/check_accessibility.cjs drawer-fixture-dir compiled.css output-dir
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const [fixture,css,out]=process.argv.slice(2).map(x=>path.resolve(x));
fs.mkdirSync(out,{recursive:true});
fs.copyFileSync(css,path.join(out,'moodle-503-default.css'));
for(const f of ['services.js','drawers.js'])fs.copyFileSync(path.join(fixture,f),path.join(out,f));
let html=fs.readFileSync(path.join(fixture,'fixture.html'),'utf8')
.replace(/<header id="page-header"[\s\S]*?<\/header>/,'<header id="page-header"><div class="page-header-headings"><h1 class="h2 mb-0">Administración del sitio</h1></div></header>')
.replace('</head>','<style>.btn.local-accessibility-launcher{position:fixed;inset-block-end:80px;inset-inline-end:24px;z-index:1050;inline-size:44px;block-size:44px;border-radius:50%;padding:0}</style></head>')
.replace('</body>','<button class="btn local-accessibility-launcher" aria-controls="local-accessibility-panel" aria-expanded="false" aria-label="Accesibilidad"><svg width="20" height="20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor"/><path d="M5 8h10M10 6v9" stroke="currentColor"/></svg></button><div id="local-accessibility-panel" hidden>Opciones</div></body>');
fs.writeFileSync(path.join(out,'fixture.html'),html);
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
const page=await browser.newPage();await page.route(/^https?:/,r=>r.abort());
for(const width of [390,768,900,1024,1440,1920]){
 await page.setViewportSize({width,height:900});await page.goto('file://'+out+'/fixture.html');
 await page.evaluate(()=>document.body.className='uses-drawers pagelayout-admin path-admin');
 for(const left of [false,true])for(const right of [false,true]){
  await page.evaluate(({left,right})=>{
   const p=document.querySelector('#page');p.classList.toggle('show-drawer-left',left);p.classList.toggle('show-drawer-right',right);
   document.querySelector('.drawer-left').classList.toggle('show',left);document.querySelector('.drawer-right').classList.toggle('show',right);
  },{left,right});
  await page.waitForTimeout(260);
  const r=await page.evaluate(()=>{const b=document.querySelector('.local-accessibility-launcher'),h=document.querySelector('#page-header h1'),d=document.querySelector('.drawer-right');return {b:b.getBoundingClientRect().toJSON(),d:d.getBoundingClientRect().toJSON(),bg:getComputedStyle(h).backgroundColor,border:getComputedStyle(h).borderLeftWidth,after:getComputedStyle(h,'::after').display,z:getComputedStyle(b).zIndex}});
  assert(r.bg.endsWith(', 0)'), 'admin heading plain');assert.equal(r.border,'0px');assert.equal(r.after,'none');
  assert(r.b.x>=0&&r.b.right<=width,'launcher in viewport');
  if(width>=850){assert(r.b.y<220,'launcher restored near header');if(right)assert(r.b.right<=r.d.x-8,'launcher clears actual drawer anchor '+JSON.stringify({width,left,right,r}));}
  else if(right)assert(Number(r.z)<1040,'launcher below mobile modal drawer');
 }
 await page.screenshot({path:path.join(out,'admin-'+width+'.png')});
}
await browser.close();console.log('PASS admin heading and accessibility position at 24 drawer/viewport states');
})().catch(e=>{console.error(e);process.exit(1)});
