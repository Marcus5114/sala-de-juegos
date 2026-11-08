// Pruebas de bloques (anteriores al kit). Uso: node dev/pruebas/bloques.test.js [games/bloques/index.html]
const {chromium}=require('playwright');const http=require('http'),fs=require('fs');
const file=process.argv[2]||require('path').join(__dirname,'..','..','games','bloques','index.html');
const page=fs.readFileSync(file,'utf8');const wrap=page.startsWith('<!doctype')?page:'<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}</style></head><body>'+page+'</body></html>';
const srv=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(wrap);}).listen(8822);
const ok=(n,c)=>{console.log((c?'OK  ':'FAIL')+' '+n);if(!c)process.exitCode=1;};const D=require('path').join(__dirname,'capturas')+'/';require('fs').mkdirSync(D,{recursive:true});
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:400,height:820},deviceScaleFactor:2,hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const cdp=await ctx.newCDPSession(p);await cdp.send('Performance.enable');const met=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
await p.goto('http://localhost:8822/');await p.waitForTimeout(300);if(await p.isVisible('[data-pane=help]'))await p.click('[data-pane=help] [data-close]');
ok('las 7 piezas tienen 4 bloques en las 4 rotaciones',await p.evaluate(()=>[...KINDS].every(k=>[0,1,2,3].every(r=>new Set(cellsOf(k,r).map(c=>c.join())).size===4))));
ok('bolsa de 7: cada pieza una vez cada 7',await p.evaluate(()=>{bag=[];const seq=[];for(let i=0;i<70;i++){refill();seq.push(bag.shift());}for(let i=0;i<70;i+=7)if(new Set(seq.slice(i,i+7)).size!==7)return false;return true;}));
// línea completa: llenar una fila salvo 4 huecos y soltar una I acostada
const r1=await p.evaluate(()=>{newGame();const y=H+HIDDEN-1;for(let x=0;x<W;x++)board[y][x]=x<4?null:'Z';cur={k:'I',r:0,x:0,y:0};hardDrop();return {clearing:!!clearing};});
await p.waitForTimeout(400);
ok('fila completa se borra',r1.clearing&&await p.evaluate(()=>lines===1&&board[H+HIDDEN-1].every(c=>!c)));
// giro contra la pared izquierda con desplazamiento
ok('giro junto a la pared se acomoda',await p.evaluate(()=>{cur={k:'I',r:1,x:-2,y:5};return fits(cur)&&rotate(1)&&fits(cur);}));
ok('guardar pieza',await p.evaluate(()=>{newGame();const k=cur.k;hold();return holdK===k&&!canHold;}));
// controles: botones
await p.evaluate(()=>{newGame();cur={k:'T',r:0,x:3,y:4};});
const x0=await p.evaluate(()=>cur.x);await p.click('[data-act=left]');await p.click('[data-act=left]');
ok('botón izquierda mueve',await p.evaluate(x=>cur.x===x-2,x0));
const r0=await p.evaluate(()=>cur.r);await p.click('[data-act=rot]');ok('botón girar',await p.evaluate(r=>cur.r!==r,r0));
// gesto: tocar gira, deslizar a la derecha mueve, deslizar abajo suelta
const cb=await p.locator('#c').boundingBox();const S=await p.evaluate(()=>S);
const rr=await p.evaluate(()=>cur.r);await p.touchscreen.tap(cb.x+cb.width/2,cb.y+cb.height/2);await p.waitForTimeout(60);
ok('tocar el tablero gira',await p.evaluate(r=>cur.r!==r,rr));
const xb=await p.evaluate(()=>cur.x);await p.mouse.move(cb.x+50,cb.y+200);await p.mouse.down();await p.mouse.move(cb.x+50+S*2.2,cb.y+200,{steps:8});await p.mouse.up();
ok('deslizar mueve',await p.evaluate(x=>cur.x>x,xb));
const filled0=await p.evaluate(()=>board.flat().filter(Boolean).length);await p.mouse.move(cb.x+100,cb.y+100);await p.mouse.down();await p.mouse.move(cb.x+100,cb.y+100+S*4,{steps:4});await p.mouse.up();await p.waitForTimeout(100);
ok('deslizar hacia abajo suelta',await p.evaluate(n=>board.flat().filter(Boolean).length===n+4,filled0));
// teclado
await p.evaluate(()=>{cur={k:'L',r:0,x:4,y:3};});await p.keyboard.press('ArrowRight');await p.keyboard.press('ArrowUp');
ok('flechas mueven y giran',await p.evaluate(()=>cur.x===5&&cur.r===1));
// libre: tablero lleno se vacía y sigue
const lib=await p.evaluate(()=>{for(let y=0;y<H+HIDDEN;y++)for(let x=0;x<W;x++)board[y][x]=(x+y)%2?'S':null;spawnNext();return {over,empty:board.flat().every(c=>!c)};});
ok('libre: tablero lleno empieza limpio sin terminar',!lib.over&&lib.empty);
// la gravedad hace caer
await p.evaluate(()=>{newGame();speed=2;});const y0=await p.evaluate(()=>cur.y);await p.waitForTimeout(900);ok('la pieza cae sola',await p.evaluate(y=>cur.y>y||board.flat().some(Boolean),y0));
await p.screenshot({path:D+'bloques_play.png'});
// desafío: fin de partida y récord
await p.click('[data-mode=desafio]');await p.waitForTimeout(200);if(await p.isVisible('[data-pane=pause]'))await p.click('#pauseGo');
await p.evaluate(()=>{for(let y=0;y<H+HIDDEN;y++)for(let x=0;x<W;x++)board[y][x]=(x+y)%2?'S':null;score=1234;spawnNext();});await p.waitForTimeout(300);
ok('desafío: tablero lleno termina con puntaje',await p.isVisible('[data-pane=over]')&&(await p.textContent('#overPts'))==='1234');
ok('récord guardado',await p.evaluate(()=>store.get('best',0)===1234));
await p.click('#overNew');await p.waitForTimeout(100);
ok('desafío sube de nivel cada 10 líneas',await p.evaluate(()=>{lines=9;const y=H+HIDDEN-1;for(let x=0;x<W;x++)board[y][x]=x<4?null:'Z';cur={k:'I',r:0,x:0,y:0};hardDrop();clearing.t=999;finishClear();return level===2;}));
// pausa: el ciclo se detiene (batería)
await p.click('#pauseBtn');await p.waitForTimeout(900);const a=await met();/* que termine de abrirse el panel de pausa */await p.waitForTimeout(3000);const z=await met();
{const pc=(z.TaskDuration-a.TaskDuration)/3*100;ok(`en pausa no consume (${pc.toFixed(2)} % de CPU)`,pc<0.5);}
await p.click('#pauseGo');
const a2=await met();await p.waitForTimeout(3000);const z2=await met();console.log('     jugando: '+((z2.TaskDuration-a2.TaskDuration)/3*100).toFixed(1)+'% de CPU');
for(const k of ['clasico','caramelos','madera','neon','gemas']){await p.evaluate(k=>{themeKey=k;newGame();paused=true;stop();const pieces='IOTSZJL';let i=0;for(let y=H+HIDDEN-5;y<H+HIDDEN;y++)for(let x=0;x<W;x++)if((x*7+y*3)%5)board[y][x]=pieces[(i++)%7];cur={k:'T',r:0,x:4,y:10};hud();draw();},k);await p.waitForTimeout(60);await p.screenshot({path:D+'bloques_'+k+'.png',clip:{x:0,y:100,width:400,height:600}});}
console.log('sin desborde:',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
{const _e=errs.filter(e=>!/ServiceWorker/.test(e));console.log('errores',_e);if(_e.length)process.exitCode=1;};await b.close();srv.close();})();
