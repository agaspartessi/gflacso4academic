// Regression for the actual campus Raw SCSS footer offsets and Dashboard headings.
// node tools/check_dashboard.cjs /drawer-fixture-directory /compiled.served.css [output]
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const {chromium} = require('playwright');
const fixture = path.resolve(process.argv[2]);
const output = path.resolve(process.argv[4] || '/tmp/academic-dashboard');
fs.mkdirSync(output, {recursive:true});
fs.copyFileSync(process.argv[3], path.join(output, 'moodle-503-default.css'));
for (const f of ['services.js','drawers.js']) fs.copyFileSync(path.join(fixture,f),path.join(output,f));
// Read-only CSSOM inspection in Virtual Test confirmed these site-setting rules.
const raw = `<style>
#page-footer.nova-foot{width:100vw;position:relative;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;margin-top:1em}
#page #page-footer.nova-foot{margin-top:auto!important;flex-shrink:0}
#page-header h1.h2{border-bottom:none;border-radius:0;font-size:clamp(1.5rem,2.2vw,1.75rem);padding:.2em 0;margin:0 0 1em!important;line-height:1;font-family:"Roboto Condensed";color:#2b435f!important;font-weight:500!important}
</style>`;
const base=fs.readFileSync(path.join(fixture,'fixture.html'),'utf8').replace('</head>',raw+'</head>');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox']});
 const page=await browser.newPage(); await page.route(/^https?:/,r=>r.abort());
 for(const title of ['Tablero','Mis cursos']){
  const header=`<header id="page-header" class="header-maxwidth"><div class="page-context-header d-flex"><div class="page-header-headings"><h1 class="h2 mb-0">${title}</h1></div></div>${title==='Tablero'?'<div class="mb-2"><span class="h2">¡Hola! 👋</span></div>':''}</header>`;
  const html=base.replace(/<header id="page-header"[\s\S]*?<\/header>/,header);
  fs.writeFileSync(path.join(output,'dashboard.html'),html);
  for(const width of [390,768,1024,1440,1920]){
   await page.setViewportSize({width,height:900});await page.goto('file://'+output+'/dashboard.html');
   await page.evaluate(()=>document.body.classList.add('path-my'));
   const metrics=await page.evaluate(()=>{
    const footer=document.querySelector('#page-footer'), page=document.querySelector('#page');
    const box=e=>e.getBoundingClientRect().toJSON();
    const headings=Array.from(document.querySelectorAll('#page-header h1,#page-header span.h2')).map(e=>{const c=getComputedStyle(e);return {bg:c.backgroundColor,left:c.borderLeftWidth,bottom:c.borderBottomWidth,size:parseFloat(c.fontSize),box:box(e)}});
    return {footer:box(footer),page:box(page),address:box(footer.querySelector('.adres')),headings,overflow:document.documentElement.scrollWidth>innerWidth+1};
   });
   assert(!metrics.overflow,`${title} ${width}: document overflow`);
   assert(Math.abs(metrics.footer.left-metrics.page.left)<1&&Math.abs(metrics.footer.right-metrics.page.right)<1,`${title} ${width}: footer must fill page without the old 50% offset`);
   assert(metrics.address.left>=-1&&metrics.address.right<=width+1,`${title} ${width}: contact text is inside viewport`);
   for(const heading of metrics.headings){
    assert(heading.bg.endsWith(', 0)'),`${title} ${width}: heading has no grey card`);
    assert.equal(heading.left,'0px');assert.equal(heading.bottom,'0px');
    assert(heading.size<=28.1&&heading.box.width<=width+1,`${title} ${width}: heading scale`);
   }
   await page.locator('#page-footer').scrollIntoViewIfNeeded();
   await page.screenshot({path:path.join(output,`${title==='Tablero'?'dashboard':'courses'}-footer-${width}.png`)});
  }
 }
 await browser.close();console.log('PASS Dashboard/Courses headings, greeting, campus Raw SCSS and footer at 10 responsive views');
})().catch(e=>{console.error(e);process.exit(1)});
