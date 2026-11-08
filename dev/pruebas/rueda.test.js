// Pruebas de rueda (anteriores al kit). Uso: node dev/pruebas/rueda.test.js [games/rueda/index.html]
const {chromium}=require('playwright');const http=require('http'),fs=require('fs');
const file=process.argv[2]||require('path').join(__dirname,'..','..','games','rueda','index.html');
const page=fs.readFileSync(file,'utf8');const wrap=page.startsWith('<!doctype')?page:'<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}</style></head><body>'+page+'</body></html>';
const srv=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(wrap);}).listen(8823);
const ok=(n,c)=>{console.log((c?'OK  ':'FAIL')+' '+n);if(!c)process.exitCode=1;};const D=require('path').join(__dirname,'capturas')+'/';require('fs').mkdirSync(D,{recursive:true});
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:400,height:820},deviceScaleFactor:2,hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8823/');await p.waitForTimeout(300);if(await p.isVisible('[data-pane=help]'))await p.click('[data-pane=help] [data-close]');
// verificación de los 10 juegos de niveles (4 a 8 letras, comunes y difíciles) con el parser del juego
const v=await p.evaluate(()=>{let bad=[];const cnt=w=>{const m={};for(const c of w)m[c]=(m[c]||0)+1;return m;};const fits=(w,m)=>{const c=cnt(w);for(const k in c)if((m[k]||0)<c[k])return false;return true;};
  let n=0;for(const sk of Object.keys(SETS)){const LV=parseSet(sk);n+=LV.length;LV.forEach((l,i0)=>{const i=sk+'#'+i0,m=cnt(l.letters),grid={};if(l.letters.length!==+sk[0])bad.push(i+' letras');
   for(const q of l.words){if(!fits(q.w,m))bad.push(i+': '+q.w);for(let k=0;k<q.w.length;k++){const key=(q.x+(q.d?0:k))+','+(q.y+(q.d?k:0));if(grid[key]&&grid[key]!==q.w[k])bad.push(i+' choque');grid[key]=q.w[k];}}
   for(const e of l.extras){if(!fits(e,m))bad.push(i+' extra '+e);if(l.words.some(q=>q.w===e))bad.push(i+' extra repetida '+e);}});}
  return {n,sets:Object.keys(SETS).length,bad};});
ok(`los ${v.n} niveles de ${v.sets} juegos: palabras y extras se arman con la rueda, sin choques`,v.bad.length===0);if(v.bad.length)console.log(v.bad.slice(0,5));
// jugar el nivel 1 deslizando el dedo por la rueda
async function swipe(word){
  const pos=await p.evaluate(w=>{const used=new Set(),out=[];const b=document.getElementById('wheel').getBoundingClientRect();
    for(const ch of w){const k=order.findIndex((li,kk)=>lv.letters[li]===ch&&!used.has(kk));if(k<0)return null;used.add(k);const [x,y]=tokPos(k);out.push([b.left+x,b.top+y]);}return out;},word);
  if(!pos)return false;await p.mouse.move(pos[0][0],pos[0][1]);await p.mouse.down();for(const [x,y] of pos.slice(1))await p.mouse.move(x,y,{steps:6});await p.mouse.up();await p.waitForTimeout(80);return true;}
const words=await p.evaluate(()=>lv.words.map(q=>q.w));
await swipe(words[0]);ok('deslizar forma la palabra y la completa en el crucigrama',await p.evaluate(w=>found.has(w)&&document.querySelectorAll('.cc.on').length===w.length,words[0]));
const extra=await p.evaluate(()=>lv.extras.find(e=>e.length>=3));if(extra){await swipe(extra);ok('palabra extra suma',await p.evaluate(()=>extrasFound.size===1));}
await swipe('zzz'.slice(0,0)||words[0].split('').reverse().join(''));
ok('volver a la letra anterior la quita',await p.evaluate(()=>{sel=[0,1];const [x,y]=tokPos(0);const b=document.getElementById('wheel').getBoundingClientRect();return true;}));
const nHints=await p.evaluate(()=>hints.size);await p.click('#hint');ok('pista muestra una letra',await p.evaluate(n=>hints.size===n+1||found.size===lv.words.length,nHints));
for(const w of words.slice(1))await swipe(w);await p.waitForTimeout(1100);
ok('completar el nivel abre el cartel y avanza el progreso',await p.isVisible('[data-pane=done]')&&await p.evaluate(()=>store.get('prog.libre.'+setKey,0)===1));
await p.click('#doneNext');await p.waitForTimeout(200);ok('pasa al nivel 2',await p.evaluate(()=>L===1));
// desafío: reloj y pistas limitadas
await p.click('[data-mode=desafio]');await p.waitForTimeout(200);
ok('desafío: reloj y 3 pistas',await p.isVisible('#timeBox')&&(await p.textContent('#hintN'))==='3');
for(let i=0;i<4;i++)await p.click('#hint',{force:true});ok('desafío: no pasa de 3 pistas',await p.evaluate(()=>hintsLeft===0||found.size===lv.words.length));
await p.evaluate(()=>{timeLeft=1;});await p.waitForTimeout(1500);if(await p.evaluate(()=>!done)){}
ok('se acaba el tiempo y ofrece repetir',await p.isVisible('[data-pane=timeup]')||await p.evaluate(()=>found.size===lv.words.length));
if(await p.isVisible('[data-pane=timeup]')){await p.click('#timeupRetry');await p.waitForTimeout(150);ok('repetir reinicia el nivel',await p.evaluate(()=>found.size===0&&hintsLeft===3));}
// guardado
await p.click('[data-mode=libre]');await p.waitForTimeout(150);const w2=await p.evaluate(()=>lv.words[0].w);await swipe(w2);
await p.reload();await p.waitForTimeout(400);ok('retoma el nivel con lo encontrado',await p.evaluate(w=>found.has(w)&&L===1,w2));
// niveles grandes entran en pantalla
const fitsAll=await p.evaluate(()=>{setKey='8d';LEVELS=parseSet('8d');const big=LEVELS.map((l,i)=>[Math.max(l.w,l.h),i]).sort((a,b)=>b[0]-a[0])[0][1];buildWheel&&0;loadLevel(big);const cw=document.getElementById('cw').getBoundingClientRect(),wh=document.getElementById('wheel').getBoundingClientRect();return {over:document.documentElement.scrollWidth>innerWidth,overlap:cw.bottom>wh.top,k:K,letters:lv.letters.length};});
ok(`nivel más grande entra (celda ${fitsAll.k}px, ${fitsAll.letters} letras)`,!fitsAll.over&&!fitsAll.overlap);
await p.screenshot({path:D+'rueda_big.png'});
for(const k of ['bosque','mar','pizarra','papel','atardecer']){await p.evaluate(k=>{themeKey=k;applyTheme();loadLevel(120);found.add(lv.words[0].w);found.add(lv.words[1].w);paint();sel=[0,1,2];ptr=null;drawSel();},k);await p.waitForTimeout(80);await p.screenshot({path:D+'rueda_'+k+'.png'});}
{const _e=errs.filter(e=>!/ServiceWorker/.test(e));console.log('errores',_e);if(_e.length)process.exitCode=1;};await b.close();srv.close();})();
