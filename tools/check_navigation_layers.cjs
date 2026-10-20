// Real Boost templates/controller plus Academic's footer JS. No campus data.
// node tools/check_navigation_layers.cjs fixture-dir compiled.css output-dir
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const [fixture,css,out]=process.argv.slice(2).map(x=>path.resolve(x));
fs.mkdirSync(out,{recursive:true});
fs.copyFileSync(css,path.join(out,'moodle-503-default.css'));
for(const f of ['services.js','drawers.js'])fs.copyFileSync(path.join(fixture,f),path.join(out,f));
fs.copyFileSync(path.join(__dirname,'../javascript/drawer_toggles.js'),path.join(out,'drawer_toggles.js'));
const header='<header id="page-header" class="header-maxwidth"><div class="w-100"><div class="d-flex flex-wrap"><div id="page-navbar"><nav aria-label="Ruta"><ol class="breadcrumb"><li class="breadcrumb-item"><a href="#">Mis cursos</a></li><li class="breadcrumb-item"><a href="#">Curso de formación con un nombre institucional extenso para comprobar la navegación responsive</a></li><li class="breadcrumb-item"><a href="#">Unidad de trabajo y actividades de aprendizaje</a></li><li class="breadcrumb-item">Diario de clase</li></ol></nav></div></div><div class="page-header-headings"><h1 class="h2 mb-0">Diario de clase</h1></div></div></header>';
const plugin='<style>.btn.local-accessibility-launcher{position:fixed;inset-block-end:80px;inset-inline-end:24px;z-index:1050;inline-size:44px;block-size:44px;border-radius:50%;padding:0}</style>';
let html=fs.readFileSync(path.join(fixture,'fixture.html'),'utf8').replace(/<header id="page-header"[\s\S]*?<\/header>/,header)
.replace('</head>',plugin+'</head>')
.replace('</body>','<button class="btn local-accessibility-launcher" aria-label="Accesibilidad"><svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor"/></svg></button><script src="drawer_toggles.js"></script></body>');
fs.writeFileSync(path.join(out,'fixture.html'),html);
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox']});
 const page=await browser.newPage();await page.route(/^https?:/,r=>r.abort());const errors=[];page.on('pageerror',e=>errors.push(e.message));let count=0, overlaps=0;
 const settle=()=>page.waitForTimeout(300);
 const metrics=()=>page.evaluate(()=>{
  const rect=e=>e.getBoundingClientRect().toJSON();
  const toggles=[...document.querySelectorAll('.drawer-toggler')].filter(e=>getComputedStyle(e).display!=='none').map(e=>({rect:rect(e),focusable:!e.querySelector('button').disabled}));
  return {toggles,nav:rect(document.querySelector('.navbar')),crumb:rect(document.querySelector('#page-navbar')),heading:rect(document.querySelector('.page-header-headings')),overflow:document.documentElement.scrollWidth>innerWidth+1};
 });
 for(const width of [390,768,991,992,1280,1440,1920]){
  await page.setViewportSize({width,height:900});await page.goto('file://'+out+'/fixture.html');await page.waitForFunction(()=>window.Drawers);await settle();
  for(const scrolled of [false,true]){
   if(scrolled)await page.evaluate(()=>{document.querySelector('#page').scrollTop=600;window.scrollTo(0,600)});
   await settle();const m=await metrics();assert(!m.overflow,'overflow '+width);
   if(m.toggles.length===2)assert(Math.abs(m.toggles[0].rect.y-m.toggles[1].rect.y)<1,'tabs aligned');
   for(const t of m.toggles){assert(t.focusable);assert(t.rect.y>=m.nav.bottom,'tab below navbar '+width);assert(t.rect.bottom<=900,'tab in viewport '+width);if(width>=768){assert(t.rect.y>=m.crumb.bottom+8,'tab below wrapped breadcrumbs '+width);const h=m.heading;assert(t.rect.right<=h.x||t.rect.x>=h.right||t.rect.y>=h.bottom||t.rect.bottom<=h.y,'tab clears title '+width);}}
   // The dropdown must win the actual hit-test where it overlaps the launcher.
   await page.evaluate(()=>{const d=document.querySelector('.usermenu .dropdown-menu');d.classList.add('show');// The external Popper service is not initialised in this fixture.
    // Reproduce its placement beneath the user toggle, within the same navbar context.
    Object.assign(d.style,{minHeight:'180px',top:'100%',right:'0',left:'auto',bottom:'auto',transform:'none',margin:'0'});});
   const layer=await page.evaluate(()=>{const n=document.querySelector('.navbar'),b=document.querySelector('.local-accessibility-launcher'),d=document.querySelector('.usermenu .dropdown-menu'),r=b.getBoundingClientRect(),dr=d.getBoundingClientRect();const x=Math.max(r.x,dr.x)+1,y=Math.max(r.y,dr.y)+1;return {navZ:+getComputedStyle(n).zIndex,buttonZ:+getComputedStyle(b).zIndex,overlap:x<Math.min(r.right,dr.right)&&y<Math.min(r.bottom,dr.bottom),winner:d.contains(document.elementFromPoint(x,y))};});
   assert(layer.buttonZ<layer.navZ,'launcher below navbar context '+width);if(layer.overlap){overlaps++;assert(layer.winner,'profile wins hit-test '+width);}
   await page.evaluate(()=>document.querySelector('.usermenu .dropdown-menu').classList.remove('show'));
   count++;
  }
  // Real Boost controller: both opening tabs and close controls, keyboard restoration.
  await page.evaluate(()=>{document.querySelector('#page').scrollTop=0;window.scrollTo(0,0)});await settle();
  for(const side of ['left','right']){
   const opener=page.locator('.drawer-'+side+'-toggle button');await opener.focus();await page.keyboard.press('Enter');await settle();
   assert(await page.locator('.drawer-'+side).evaluate(e=>e.classList.contains('show')),'keyboard opens '+side+' '+width);
   const close=page.locator('.drawer-'+side+' .drawertoggle');await close.click();await settle();assert(await opener.evaluate(e=>document.activeElement===e),'focus restored '+width);
  }
  if(width===1440||width===390)await page.screenshot({path:path.join(out,'navigation-'+width+'.png')});
 }
 // Live resize with a more deeply wrapped trail, without reloading the page.
 await page.setViewportSize({width:1920,height:900});await page.goto('file://'+out+'/fixture.html');await settle();
 await page.setViewportSize({width:768,height:900});await settle();const m=await metrics();for(const t of m.toggles)assert(t.rect.y>=m.crumb.bottom+8,'resize measures wrapped trail');
 assert(overlaps>0,'test must exercise actual menu/launcher overlap');assert.deepEqual(errors,[]);await browser.close();console.log('PASS '+count+' viewport/scroll states, 7-width keyboard drawer cycles, dropdown stacking and responsive remeasurement');
})().catch(e=>{console.error(e);process.exit(1)});
