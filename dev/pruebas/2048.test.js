// Pruebas de 2048 (anteriores al kit). Uso: node dev/pruebas/2048.test.js [games/2048/index.html]
const {chromium}=require('playwright');const http=require('http'),fs=require('fs');
const file=process.argv[2]||require('path').join(__dirname,'..','..','games','2048','index.html');
const page=fs.readFileSync(file,'utf8');const wrap=page.startsWith('<!doctype')?page:'<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}</style></head><body>'+page+'</body></html>';
const srv=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(wrap);}).listen(8820);
const ok=(n,c)=>{console.log((c?'OK  ':'FAIL')+' '+n);if(!c)process.exitCode=1;};const D=require('path').join(__dirname,'capturas')+'/';require('fs').mkdirSync(D,{recursive:true});
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:400,height:820},deviceScaleFactor:2,hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8820/');await p.waitForTimeout(300);if(await p.isVisible('[data-pane=help]'))await p.click('[data-pane=help] [data-close]');
const cases=await p.evaluate(()=>{const set=a=>{grid=a.map(v=>v?{id:nextId++,v}:null);};const get=()=>grid.map(t=>t?t.v:0);const out=[];
  const T=(a,dir)=>{set(a);slide(dir);return get();};
  out.push(['[2,2,2,2] izq',T([2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0],0).slice(0,4).join(),'4,4,0,0']);
  out.push(['[2,2,4,4] izq',T([2,2,4,4,0,0,0,0,0,0,0,0,0,0,0,0],0).slice(0,4).join(),'4,8,0,0']);
  out.push(['[4,0,4,8] der',T([4,0,4,8,0,0,0,0,0,0,0,0,0,0,0,0],1).slice(0,4).join(),'0,0,8,8']);
  out.push(['[2,2,2,0] der',T([2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0],1).slice(0,4).join(),'0,0,2,4']);
  out.push(['columna arriba',(()=>{set([2,0,0,0,2,0,0,0,4,0,0,0,4,0,0,0]);slide(2);const g=get();return [g[0],g[4],g[8],g[12]].join();})(),'4,8,0,0']);
  out.push(['sin movimiento',(()=>{set([2,4,2,4,4,2,4,2,2,4,2,4,4,2,4,2]);return String(slide(0).moved)+','+canMove();})(),'false,false']);
  return out;});
for(const [n,got,exp] of cases)ok(`${n}: ${got}`,got===exp);
await p.evaluate(()=>{newGame();});
for(const k of ['ArrowLeft','ArrowUp','ArrowRight','ArrowDown','ArrowLeft','ArrowUp']){await p.keyboard.press(k);await p.waitForTimeout(160);}
ok('jugadas con teclado suman fichas y tablero coincide',await p.evaluate(()=>document.querySelectorAll('.tile').length===grid.filter(Boolean).length&&grid.filter(Boolean).length>=3));
// deslizar con el dedo
const box=await p.locator('#board').boundingBox();const before=await p.evaluate(()=>JSON.stringify(grid.map(t=>t&&t.v)));
for(const [dx,dy] of [[-120,0],[0,-120],[120,0],[0,120]]){await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.move(box.x+box.width/2+dx,box.y+box.height/2+dy,{steps:5});await p.mouse.up();await p.waitForTimeout(160);}
ok('deslizar mueve fichas',await p.evaluate(b=>JSON.stringify(grid.map(t=>t&&t.v))!==b,before));
ok('deshacer en libre',await p.evaluate(()=>{const n=hist.length;undo();return hist.length===n-1;}));
await p.screenshot({path:D+'g2048_numeros.png'});
for(const k of ['frutas','espacio','animales']){await p.evaluate(k=>{grid=[2,4,8,16,32,64,128,256,512,1024,2048,4096,0,2,0,0].map(v=>v?{id:nextId++,v}:null);themeKey=k;applyTheme();},k);await p.waitForTimeout(100);await p.screenshot({path:D+'g2048_'+k+'.png'});}
// desafío: reloj y fin por tiempo
await p.click('[data-mode=desafio]');await p.waitForTimeout(150);
ok('desafío muestra reloj y oculta deshacer',await p.isVisible('#timerBox')&&await p.isHidden('#undo'));
await p.keyboard.press('ArrowLeft');await p.keyboard.press('ArrowRight');await p.waitForTimeout(1200);
ok('el reloj corre',await p.evaluate(()=>timeLeft<CHALLENGE_SECS));
await p.evaluate(()=>{timeLeft=1;});await p.waitForTimeout(1600);
ok('fin por tiempo abre resultado',await p.isVisible('[data-pane=over]')&&(await p.textContent('#overTitle'))==='¡Tiempo!');
const w=await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);ok('sin desborde horizontal',w);
{const _e=errs.filter(e=>!/ServiceWorker/.test(e));console.log('errores',_e);if(_e.length)process.exitCode=1;};await b.close();srv.close();})();
