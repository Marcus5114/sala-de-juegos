// Pruebas de minas (anteriores al kit). Uso: node dev/pruebas/minas.test.js [games/minas/index.html]
const {chromium}=require('playwright');const http=require('http'),fs=require('fs');
const file=process.argv[2]||require('path').join(__dirname,'..','..','games','minas','index.html');
const page=fs.readFileSync(file,'utf8');const wrap=page.startsWith('<!doctype')?page:'<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}</style></head><body>'+page+'</body></html>';
const srv=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(wrap);}).listen(8821);
const ok=(n,c)=>{console.log((c?'OK  ':'FAIL')+' '+n);if(!c)process.exitCode=1;};const D=require('path').join(__dirname,'capturas')+'/';require('fs').mkdirSync(D,{recursive:true});
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:400,height:820},deviceScaleFactor:2,hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8821/');await p.waitForTimeout(300);if(await p.isVisible('[data-pane=help]'))await p.click('[data-pane=help] [data-close]');
// primer toque seguro, 200 veces, en los tres tamaños
const safe=await p.evaluate(()=>{let bad=0,opened=0;for(let s=0;s<3;s++){sz=s;for(let k=0;k<70;k++){G=fresh();const i=Math.floor(Math.random()*G.w*G.h);reveal(i);if(G.boom.length||G.done&&!G.won)bad++;opened+=G.open.filter(Boolean).length>1?1:0;
  if(G.mines.filter(Boolean).length!==G.m)bad+=100;}}sz=0;return {bad,opened};});
ok('primer toque nunca es mina y siempre abre una zona (210 partidas)',safe.bad===0&&safe.opened===210);
await p.evaluate(()=>{newGame();});
const c0=await p.locator('.cell').nth(40).boundingBox();await p.mouse.click(c0.x+c0.width/2,c0.y+c0.height/2);await p.waitForTimeout(100);
ok('toque destapa en cascada',await p.evaluate(()=>G.open.filter(Boolean).length>1));
ok('números correctos',await p.evaluate(()=>cells.every((c,i)=>!G.open[i]||G.mines[i]||String(count(i)||'')===c.textContent)));
// toque largo pone bandera
const hid=await p.evaluate(()=>G.open.findIndex(o=>!o));const hb=await p.locator('.cell').nth(hid).boundingBox();
await p.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);await p.mouse.down();await p.waitForTimeout(550);await p.mouse.up();
ok('toque largo marca bandera',await p.evaluate(i=>G.flag[i],hid));
// acorde: número con todas sus banderas destapa vecinas
const ch=await p.evaluate(()=>{for(let i=0;i<G.w*G.h;i++){if(!G.open[i]||G.mines[i]||!count(i))continue;const around=nb(i,G.w,G.h);if(around.some(j=>!G.open[j]&&!G.mines[j])){G.flag.fill(false);around.forEach(j=>{if(G.mines[j])G.flag[j]=true;});paint();return i;}}return -1;});
if(ch>=0){const cb=await p.locator('.cell').nth(ch).boundingBox();await p.mouse.click(cb.x+cb.width/2,cb.y+cb.height/2);await p.waitForTimeout(100);
 ok('acorde destapa las vecinas sin minas',await p.evaluate(i=>nb(i,G.w,G.h).every(j=>G.mines[j]||G.open[j]),ch));}else console.log('--  sin caso para acorde');
// libre: pisar mina quita una vida y sigue
const mine=await p.evaluate(()=>G.mines.findIndex((m,i)=>m&&!G.flag[i]));const mb=await p.locator('.cell').nth(mine).boundingBox();await p.mouse.click(mb.x+mb.width/2,mb.y+mb.height/2);await p.waitForTimeout(100);
ok('libre: mina quita una vida y sigue',await p.evaluate(()=>G.lives===2&&!G.done));
// ganar
await p.evaluate(()=>{for(let i=0;i<G.w*G.h;i++)if(!G.mines[i])G.open[i]=true;checkWin();paint();});await p.waitForTimeout(800);
ok('ganar abre el cartel',await p.isVisible('[data-pane=end]')&&(await p.textContent('#endTitle'))==='¡Campo despejado!');
await p.click('#endNew');
// desafío: una mina termina y el reloj corre
await p.click('[data-mode=desafio]');await p.waitForTimeout(100);
const c1=await p.locator('.cell').nth(40).boundingBox();await p.mouse.click(c1.x+c1.width/2,c1.y+c1.height/2);await p.waitForTimeout(2200);
ok('desafío: cronómetro corre',await p.evaluate(()=>G.secs>=1)&&await p.isVisible('#timeBox')&&await p.isHidden('#livesBox'));
const m2=await p.evaluate(()=>G.mines.findIndex(Boolean));const b2=await p.locator('.cell').nth(m2).boundingBox();await p.mouse.click(b2.x+b2.width/2,b2.y+b2.height/2);await p.waitForTimeout(1000);
ok('desafío: una mina termina la partida',await p.evaluate(()=>G.done&&!G.won)&&await p.isVisible('[data-pane=end]'));
await p.click('#endNew');
// tamaños
for(const s of [1,2]){await p.click(`[data-size="${s}"]`);await p.waitForTimeout(100);const r=await p.evaluate(()=>({n:cells.length,w:G.w,h:G.h,over:document.documentElement.scrollWidth>innerWidth}));ok(`tamaño ${s}: ${r.w}x${r.h} entra en pantalla`,r.n===r.w*r.h&&!r.over);}
// guardado
const c2=await p.locator('.cell').nth(60).boundingBox();await p.mouse.click(c2.x+c2.width/2,c2.y+c2.height/2);await p.waitForTimeout(150);
const snap=await p.evaluate(()=>JSON.stringify(G.open));await p.reload();await p.waitForTimeout(300);
ok('retoma la partida al volver',await p.evaluate(s=>JSON.stringify(G.open)===s,snap));
await p.click('[data-mode=libre]');
for(const k of ['clasico','jardin','playa','espacio','nieve']){await p.evaluate(k=>{sz=0;G=fresh();reveal(40);G.flag[G.mines.findIndex(Boolean)]=true;const m=G.mines.findIndex((x,i)=>x&&!G.flag[i]);G.boom.push(m);G.open[m]=true;themeKey=k;build();applyTheme();},k);await p.waitForTimeout(80);await p.screenshot({path:D+'minas_'+k+'.png',clip:{x:0,y:110,width:400,height:560}});}
{const _e=errs.filter(e=>!/ServiceWorker/.test(e));console.log('errores',_e);if(_e.length)process.exitCode=1;};await b.close();srv.close();})();
