// Pruebas sin conexión. Uso: node dev/pruebas/sinconexion.test.js [carpeta armada, por defecto la raíz del repo]
const N=require('../juegos.json').juegos.length;
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path'),zlib=require('zlib');
const dir=(process.argv[2]||require('path').join(__dirname,'..','..'));const T={'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.png':'image/png','.txt':'text/plain; charset=utf-8'};
let bytes={};const srv=http.createServer((q,r)=>{let f=path.join(dir,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);return r.end();}
 let b=fs.readFileSync(f);const h={'Content-Type':T[path.extname(f)]||'application/octet-stream'};if(!f.endsWith('.png')){b=zlib.gzipSync(b);h['Content-Encoding']='gzip';}r.writeHead(200,h);r.end(b);}).listen(8830);
const ok=(n,c)=>{console.log((c?'OK  ':'FAIL')+' '+n);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:400,height:820},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 const cdp=await ctx.newCDPSession(p);await cdp.send('Network.enable');await cdp.send('Performance.enable');await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 let kb=0;cdp.on('Network.loadingFinished',e=>kb+=e.encodedDataLength/1024);
 const met=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
 await p.goto('http://localhost:8830/');await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForTimeout(1500);
 const games={'2048':'.tile','minas':'.cell','bloques':'canvas#c','rueda':'.tok','desenredo':'.nd','encastre':'.pc','piramide':'.br','puentes':'.isl','mapa':'.rg','engranajes':'.gr'};
 for(const [g,sel] of Object.entries(games)){kb=0;await p.goto(`http://localhost:8830/games/${g}/index.html`);await p.waitForTimeout(800);
  if(await p.isVisible('[data-pane=help]'))await p.click('[data-pane=help] [data-close]');
  if(g==='bloques'&&await p.isVisible('#pauseBtn'))await p.click('#pauseBtn');
  await p.waitForTimeout(500);const a=await met();await p.waitForTimeout(4000);const z=await met();
  console.log(`     ${g}: ${kb.toFixed(1)} KB al abrir (con caché) · reposo ${((z.TaskDuration-a.TaskDuration)/4*100).toFixed(2)}% CPU`);
  ok(`${g}: botón volver visible`,await p.isVisible('#homeBtn'));}
 await ctx.setOffline(true);
 for(const [g,sel] of Object.entries(games)){await p.goto(`http://localhost:8830/games/${g}/index.html`);await p.waitForTimeout(700);ok(`${g} sin conexión`,await p.locator(sel).count()>0);}
 await p.goto('http://localhost:8830/index.html');await p.waitForTimeout(300);ok('menú sin conexión con '+N+' juegos',await p.locator('.tile').count()===N);
 {const _e=errs.filter(e=>!/ServiceWorker/.test(e)).filter(e=>!/ServiceWorker/.test(e));console.log('errores',_e);if(_e.length)process.exitCode=1;};await b.close();srv.close();})();
