// Pruebas del menú (sala). Uso: node dev/pruebas/sala.test.js [carpeta armada, por defecto la raíz del repo]
const N=require('../juegos.json').juegos.length;
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const dir=(process.argv[2]||require('path').join(__dirname,'..','..')),T={'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.png':'image/png'};
const srv=http.createServer((q,r)=>{let f=path.join(dir,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
  if(!fs.existsSync(f)){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});r.end(fs.readFileSync(f));}).listen(8801);
const D=require('path').join(__dirname,'capturas')+'/';require('fs').mkdirSync(D,{recursive:true});
const ok=(n,c)=>{console.log((c?'OK  ':'FAIL')+' '+n);if(!c)process.exitCode=1;};
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:400,height:820},deviceScaleFactor:2,hasTouch:true});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto('http://localhost:8801/');await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForTimeout(500);
 ok(N+' juegos',await p.locator('.tile').count()===N);
 ok('6 chips de categoría',await p.locator('.cat').count()===6);
 await p.click('[data-cat="cartas"]');{const n=await p.$$eval('.tile .name',e=>e.map(x=>x.textContent).sort().join('|'));ok('Cartas filtra los juegos de cartas: '+n,n==='Blackjack|Spider Solitario');}
 await p.click('[data-cat="arcade"]');ok('Arcade muestra Bloques',(await p.textContent('.tile .name'))==='Bloques');
 await p.click('[data-cat="puzzle"]');ok('Puzzle filtra sus 6 juegos',await p.locator('.tile').count()===6);
 await p.click('[data-cat="all"]');await p.click('[data-star="spider"]');
 ok('destacado va primero',(await p.locator('.tile .name').first().textContent())==='Spider Solitario');
 await p.click('#tab-fav');await p.click('[data-cat="puzzle"]');ok('Destacados + Puzzle vacío explica',await p.locator('.empty').count()===1);
 await p.click('[data-cat="all"]');await p.click('#tab-all');
 await p.screenshot({path:D+'hub5.png'});
 await p.click('.tile[data-id="atasco"] .name');await p.waitForURL('**/games/atasco/index.html');await p.waitForTimeout(500);
 ok('Atasco abre con vehículos',await p.locator('.veh').count()>5);ok('botón volver en Atasco',await p.isVisible('#homeBtn'));
 // mover algo para dejar partida en curso
 const moved=await p.evaluate(()=>{for(let i=0;i<veh.length;i++){const [lo,hi]=range(i);if(hi>lo)return i;}return -1;});
 const box=await p.locator(`.veh[data-i="${moved}"]`).boundingBox();const info=await p.evaluate(i=>{const [lo,hi]=range(i);return {h:veh[i].h,dir:hi>pos[i]?1:-1,cell};},moved);
 await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.move(box.x+box.width/2+(info.h?info.dir*info.cell:0),box.y+box.height/2+(info.h?0:info.dir*info.cell),{steps:6});await p.mouse.up();await p.waitForTimeout(300);
 ok('movimiento contado',(await p.textContent('#moves'))==='1');
 await p.screenshot({path:D+'hub6.png'});
 await p.click('#homeBtn');await p.waitForTimeout(400);
 ok('Atasco "En curso" en el menú',await p.locator('.tile[data-id="atasco"] .live').count()===1);
 await p.click('.tile[data-id="atasco"] .name');await p.waitForTimeout(400);ok('retoma la partida',(await p.textContent('#moves'))==='1');
 await ctx.setOffline(true);await p.goto('http://localhost:8801/index.html');await p.waitForTimeout(300);ok('menú sin conexión',await p.locator('.tile').count()===N);
 await p.goto('http://localhost:8801/games/atasco/index.html');await p.waitForTimeout(300);ok('Atasco sin conexión',await p.locator('.veh').count()>5);
 await p.goto('http://localhost:8801/games/spider/index.html');await p.waitForTimeout(2500);ok('Spider sin conexión',await p.locator('.card').count()>=54);
 const p2=await b.newPage({viewport:{width:1100,height:760},colorScheme:'dark'});await p2.goto('http://localhost:8801/games/atasco/index.html');await p2.waitForTimeout(400);await p2.screenshot({path:D+'hub7.png'});
 {const _e=errs.filter(e=>!/ServiceWorker/.test(e));console.log('errores',_e);if(_e.length)process.exitCode=1;};await b.close();srv.close();})();
