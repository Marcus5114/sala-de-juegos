// Pruebas del Crucigrama: generador, toques, teclado en pantalla y físico, chequeo en Libre, Desafío, pistas, guardado, temas y pantallas.
const run=require('./_base.js');
run(process.argv[2]||require('path').join(__dirname,'..','..','games','crucigrama','index.html'),8846,async({p,ok,D,fits,cpuIdle})=>{
  // generador dentro de la página (mismo código que en node): válido y determinista
  const g=await p.evaluate(()=>{let bad=0,t=0;for(let d=0;d<4;d++)for(let l=0;l<25;l++){const a=performance.now();const L=genCross(d,l);t=Math.max(t,performance.now()-a);
    const W=L.W;const at=(r,c)=>r*W+c;for(const w of L.words){for(let j=0;j<w.ans.length;j++)if(L.sol[at(w.r+w.dir*j,w.c+(1-w.dir)*j)]!==w.ans[j])bad++;if(L.sol[at(w.cr,w.cc)])bad++;}}
    const same=JSON.stringify(genCross(2,7))===JSON.stringify(genCross(2,7));return {bad,t,same,bank:BANCO.length};});
  ok(`100 niveles válidos (el más lento tardó ${g.t.toFixed(0)} ms)`,g.bad===0&&g.t<400);
  ok('el mismo nivel sale igual',g.same);ok(`banco de ${g.bank} pistas`,g.bank>900);
  await p.screenshot({path:D+'cru_d0.png'});
  const cellXY=i=>p.evaluate(i=>{const r=document.querySelector(`[data-i="${i}"]`).getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];},i);
  const tapCell=async i=>{const [x,y]=await cellXY(i);await p.mouse.click(x,y);};
  const key=k=>p.click(`#kb [data-k="${k}"]`);
  // elegir con el dedo y escribir con el teclado en pantalla
  const w0=await p.evaluate(()=>{const w=S.L.words.find(w=>cellsOf(w).every(i=>!S.given[i]))||S.L.words[0];return {k:S.L.words.indexOf(w),cells:cellsOf(w),ans:w.ans,dir:w.dir};});
  await tapCell(w0.cells[0]);ok('tocar una casilla la elige',await p.evaluate(i=>S.cur===i,w0.cells[0]));
  await p.evaluate(k=>selectWord(k,false),w0.k);
  for(const ch of w0.ans)await key(ch);
  ok('el teclado en pantalla escribe y avanza por la palabra',await p.evaluate(w=>w.cells.every((i,j)=>S.fill[i]===w.ans[j]),w0));
  ok('Libre marca la palabra completa como bien',await p.evaluate(w=>els[w.cells[0]].classList.contains('ok'),w0));
  ok('la pista de arriba muestra la definición y el largo',await p.evaluate(()=>/\d+$/.test(document.getElementById('clueTxt').textContent)));
  await p.click('#act');ok('deshacer borra la última letra',await p.evaluate(w=>S.fill[w.cells.at(-1)]==='',w0));
  // palabra mal: se marca
  const w1=await p.evaluate(k=>{const w=S.L.words.find((w,j)=>j!==k&&cellsOf(w).every(i=>!S.fill[i]&&!S.given[i]));return w?{k:S.L.words.indexOf(w),cells:cellsOf(w),ans:w.ans}:null;},w0.k);
  if(w1){await p.evaluate(k=>selectWord(k,false),w1.k);for(const ch of w1.ans)await key(ch==='Z'?'Q':'Z');
    ok('Libre marca la palabra completa como mal',await p.evaluate(w=>els[w.cells[0]].classList.contains('bad'),w1));
    await key('⌫');ok('borrar borra',await p.evaluate(w=>S.fill[w.cells.at(-1)]==='',w1));}
  else ok('(sin otra palabra libre)',true);
  // teclado físico
  await p.evaluate(w=>{w.cells.forEach(i=>{if(!S.given[i])S.fill[i]='';});selectWord(w.k,false);},w0);await p.keyboard.type(w0.ans.toLowerCase().slice(0,2));
  ok('teclado físico: las letras escriben (también Z, R y H)',await p.evaluate(w=>S.fill[w.cells[0]]===w.ans[0]&&S.fill[w.cells[1]]===w.ans[1],w0));
  const both=await p.evaluate(()=>S.L.sol.findIndex((v,i)=>v&&wordsAt[i][0]>=0&&wordsAt[i][1]>=0));
  await p.evaluate(i=>select(i,0),both);await p.keyboard.press(' ');ok('Espacio cambia de dirección',await p.evaluate(()=>S.dir===1));
  await tapCell(both);ok('tocar dos veces la misma casilla también',await p.evaluate(()=>S.dir===0));
  const k0=await p.evaluate(()=>curWord());await p.keyboard.press('Tab');ok('Tab pasa a otra palabra',await p.evaluate(k=>curWord()!==k,k0));
  await p.keyboard.press('Control+z');ok('Ctrl+Z deshace',await p.evaluate(w=>S.given[w.cells[1]]||S.fill[w.cells[1]]==='',w0));
  // tocar una pista elige su palabra
  const q=await p.evaluate(()=>{const w=S.L.words[3]||S.L.words[1];return {i:w.cr*S.L.W+w.cc,k:S.L.words.indexOf(w)};});
  const qr=await p.evaluate(i=>{const r=document.querySelector(`[data-q="${i}"]`).getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];},q.i);
  await p.mouse.click(...qr);ok('tocar una casilla de pista elige su palabra',await p.evaluate(i=>qEls.get(i).includes(curWord()),q.i));
  // pista
  await p.click('#hintBtn');ok('la pista revela una letra que no se puede borrar',await p.evaluate(()=>{const i=S.rev.at(-1);return i!=null&&S.fill[i]===S.L.sol[i]&&els[i].classList.contains('rv');}));
  // guardado
  const snap=await p.evaluate(()=>JSON.stringify(S.fill));await p.reload();await p.waitForTimeout(400);
  ok('al volver retoma las letras',await p.evaluate(s=>JSON.stringify(S.fill)===s,snap));
  // completar todo gana
  await p.evaluate(()=>{S.L.sol.forEach((v,i)=>{if(v&&i!==S.L.words[0].r*S.L.W+S.L.words[0].c)S.fill[i]=v;});const i=S.L.words[0].r*S.L.W+S.L.words[0].c;S.fill[i]='';S.given[i]=0;S.rev=S.rev.filter(x=>x!==i);select(i,S.L.words[0].dir);draw();});
  await p.keyboard.press(await p.evaluate(()=>S.L.sol[S.L.words[0].r*S.L.W+S.L.words[0].c].toLowerCase()));await p.waitForTimeout(1000);
  ok('completar el crucigrama gana',await p.evaluate(()=>S.won)&&await p.isVisible('[data-pane=end]'));
  await p.screenshot({path:D+'cru_win.png'});await p.click('#endNext');await p.waitForTimeout(200);ok('siguiente nivel',await p.evaluate(()=>S.lvl===1&&!S.won));
  // desafío: sin marcas, aviso al llenar todo mal
  await p.click('[data-mode=desafio]');await p.waitForTimeout(150);
  ok('Desafío: reloj y sin pista',await p.isVisible('#timeBox')&&!(await p.isVisible('#hintBtn')));
  await p.evaluate(()=>{const w=S.L.words[0];selectWord(0,false);});const wa=await p.evaluate(()=>S.L.words[0].ans);
  for(const ch of wa)await key(ch==='A'?'E':'A');
  ok('Desafío no marca palabras mal',await p.evaluate(()=>!document.querySelector('.cell.bad')));
  ok('Desafío cuenta letras',(await p.textContent('#doneLbl'))==='letras');
  await p.evaluate(()=>{S.L.sol.forEach((v,i)=>{if(v&&!S.fill[i])S.fill[i]=v;});const w=S.L.words[0];const i=cellsOf(w)[0];S.fill[i]='';select(i,w.dir);draw();});
  await key(await p.evaluate(()=>{const i=cellsOf(S.L.words[0])[0];return S.L.sol[i]==='A'?'E':'A';}));await p.waitForTimeout(150);
  ok('Desafío avisa cuando está lleno pero algo no cierra',await p.evaluate(()=>!S.won)&&await p.evaluate(()=>/no cierra/.test(document.getElementById('toast').textContent)));
  await p.click('[data-mode=libre]');await p.waitForTimeout(150);
  // pantallas por dificultad
  for(let d=0;d<4;d++){await p.click(`[data-diff="${d}"]`);await p.waitForTimeout(200);
    const c=await p.evaluate(()=>parseFloat(getComputedStyle(document.getElementById('grid')).getPropertyValue('--c')));
    ok(`dificultad ${d+1}: entra sin desborde (casillas de ${c}px)`,await fits()&&c>=26);await p.screenshot({path:D+'cru_d'+d+'.png'});}
  // temas
  for(const t of ['diario','revista','cuaderno','pizarra','noche']){await p.evaluate(t=>{themeKey=t;applyTheme();},t);await p.waitForTimeout(80);await p.screenshot({path:D+'cru_t_'+t+'.png'});}
  ok('seis temas (con Píxel)',await p.evaluate(()=>Object.keys(THEMES).length===6));
  // tablet: la pista se lee dentro del tablero
  await p.setViewportSize({width:1024,height:1300});await p.click('[data-diff="0"]');await p.waitForTimeout(300);
  ok('en pantallas grandes la pista se lee en el tablero',await p.evaluate(()=>document.getElementById('grid').classList.contains('big')&&getComputedStyle(document.querySelector('.cell.q .qt')).display!=='none'));
  await p.screenshot({path:D+'cru_tablet.png'});await p.setViewportSize({width:390,height:800});await p.waitForTimeout(200);
  // fluidez: escribir con el procesador 4× más lento
  const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await p.click('[data-diff="3"]');await p.waitForTimeout(300);
  const t=await p.evaluate(async()=>{const a=performance.now();for(let k=0;k<20;k++){type('A');erase();}return (performance.now()-a)/40;});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  ok(`escribir es inmediato con el procesador 4× más lento (${t.toFixed(1)} ms por tecla)`,t<16);
  await p.waitForTimeout(800);const idle=await cpuIdle();ok(`en reposo no consume (${idle.toFixed(2)} % de CPU)`,idle<0.5);
});
