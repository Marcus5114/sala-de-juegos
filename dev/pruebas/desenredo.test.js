// Pruebas de Desenredo: generador, arrastre real con el dedo, conflictos, ganar, deshacer, desafío, guardado, temas, teclado y pantallas.
require('./_base.js')(process.argv[2]||require('path').join(__dirname,'..','..','games','desenredo','index.html'),8830,async({p,ok,D,fits,cpuIdle,ctx})=>{
// generador: 50 niveles por dificultad, la solución no tiene cruces y el comienzo sí
const g=await p.evaluate(()=>{const out=[];for(let d=0;d<4;d++){let bad=0,minC=1e9;for(let i=0;i<50;i++){const L=genLevel(d,i);if(crossings(L.sol,L.E))bad++;minC=Math.min(minC,L.cross);
  const L2=genLevel(d,i);if(JSON.stringify(L2.E)!==JSON.stringify(L.E))bad++;}out.push({bad,minC});}return out;});
g.forEach((r,d)=>ok(`dificultad ${d}: 50 niveles con solución, repetibles, y al menos ${r.minC} cruces al empezar`,r.bad===0&&r.minC>0));
// arrastre real: llevar cada punto a su lugar de la solución con el dedo
async function dragTo(i,to){const r=await p.evaluate(([i,to])=>{const s=document.getElementById('stage').getBoundingClientRect();const a=px(S.P[i]),b=px(to);return [s.left+a[0],s.top+a[1],s.left+b[0],s.top+b[1]];},[i,to]);
  await p.mouse.move(r[0],r[1]);await p.mouse.down();await p.mouse.move((r[0]+r[2])/2,(r[1]+r[3])/2,{steps:3});await p.mouse.move(r[2],r[3],{steps:3});await p.mouse.up();}
const sol=await p.evaluate(()=>genLevel(diff,S.lvl).sol);
ok('el nivel arranca con cruces marcados',await p.evaluate(()=>info.k>0&&document.querySelectorAll('.eg line.x').length>0));
await dragTo(0,sol[0]);
ok('arrastrar mueve el punto y cuenta una movida',await p.evaluate(()=>S.moves===1));
await p.click('#act');await p.waitForTimeout(100);
ok('deshacer devuelve el punto',await p.evaluate(()=>S.undo.length===0&&Math.abs(S.P[0][0]-S.start[0][0])<1e-9));
for(let i=0;i<sol.length;i++)await dragTo(i,sol[i]);
await p.waitForTimeout(900);
ok('sin cruces gana y abre el cartel',await p.evaluate(()=>S.won&&info.k===0)&&await p.isVisible('[data-pane=end]'));
await p.screenshot({path:D+'desenredo_win.png'});
await p.click('#endSee');ok('botón de abajo pasa a Siguiente nivel',(await p.textContent('#actTxt'))==='Siguiente nivel');
await p.click('#act');await p.waitForTimeout(150);ok('pasa al nivel 2',await p.evaluate(()=>S.lvl===1&&!S.won));
// punto encima de una línea cuenta como conflicto
const hit=await p.evaluate(()=>{const [a,b]=S.E[0];let v=0;while(v===a||v===b)v++;const save=S.P[v];S.P[v]=[(S.P[a][0]+S.P[b][0])/2,(S.P[a][1]+S.P[b][1])/2];analyze();const r=info.hit[v]===1;S.P[v]=save;analyze();return r;});
ok('un punto encima de una línea se marca',hit);
// reinicio con confirmación
await dragTo(1,[.5,.5]);await p.click('#restart');ok('reiniciar pide confirmación',await p.isVisible('[data-pane=confirm]'));
await p.click('#confirmOk');ok('reiniciar vuelve al inicio',await p.evaluate(()=>S.moves===0));
// guardado
await dragTo(2,[.3,.7]);const before=await p.evaluate(()=>JSON.stringify(S.P[2]));await p.reload();await p.waitForTimeout(400);
ok('al volver retoma nivel y posiciones',await p.evaluate(b=>S.lvl===1&&JSON.stringify(S.P[2])===b,before));
ok('marca de partida en curso para la sala',await p.evaluate(()=>localStorage.getItem('desenredo.enCurso')==='1'));
// desafío: reloj, se acaba el tiempo
await p.click('[data-mode=desafio]');await p.waitForTimeout(200);
ok('desafío muestra reloj y oculta pista',await p.isVisible('#timeBox')&&!(await p.isVisible('#hintBtn')));
await p.evaluate(()=>{S.secs=DIFFS[diff].time-2;});await p.waitForTimeout(2600);
ok('se acaba el tiempo y ofrece reintentar',await p.evaluate(()=>S.timeup)&&(await p.textContent('#endNext'))==='Reintentar');
await p.click('#endNext');await p.waitForTimeout(150);ok('reintentar reinicia el reloj',await p.evaluate(()=>!S.timeup&&S.secs===0));
// desafío ganado con estrellas
const sol2=await p.evaluate(()=>genLevel(diff,S.lvl).sol);for(let i=0;i<sol2.length;i++)await dragTo(i,sol2[i]);await p.waitForTimeout(900);
ok('desafío ganado da estrellas',await p.evaluate(()=>S.won&&S.stars>=1)&&/★/.test(await p.textContent('#endBig')));
await p.click('#endSee');
// todas las dificultades: tablero dentro de la pantalla y puntos separados para el dedo
for(let d=0;d<4;d++){await p.click(`[data-diff="${d}"]`);await p.waitForTimeout(200);
  const r=await p.evaluate(()=>{const s=document.getElementById('stage').getBoundingClientRect();const Q=S.P.map(px);let mn=1e9;for(let a=0;a<Q.length;a++)for(let c=a+1;c<Q.length;c++)mn=Math.min(mn,Math.hypot(Q[a][0]-Q[c][0],Q[a][1]-Q[c][1]));
    return {inside:Q.every(([x,y])=>x>=R&&y>=R&&x<=s.width-R&&y<=s.height-R),gap:Math.round(mn),R:Math.round(R),over:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight+1,n:S.n};});
  ok(`${['Fácil','Media','Difícil','Experto'][d]}: ${r.n} puntos dentro del tablero, separados ${r.gap}px (radio ${r.R}px), sin desborde`,r.inside&&!r.over&&r.gap>=2*r.R);
  await p.screenshot({path:D+'desenredo_d'+d+'.png'});}
// temas
for(const k of ['clasico','cielo','costura','circuito','metro']){await p.evaluate(k=>{themeKey=k;applyTheme();},k);await p.waitForTimeout(120);await p.screenshot({path:D+'desenredo_t_'+k+'.png'});}
// teclado
await p.click('[data-diff="0"]');await p.click('[data-mode=libre]');await p.waitForTimeout(150);
await p.keyboard.press('Tab');ok('teclado: Tab elige un punto',await p.evaluate(()=>sel===0&&document.querySelector('.nd.kb')));
await p.keyboard.press('Tab');ok('teclado: Tab pasa al siguiente',await p.evaluate(()=>sel===1));
const k0=await p.evaluate(()=>({p:S.P[1].slice(),m:S.moves,u:S.undo.length}));
for(let k=0;k<5;k++)await p.keyboard.down('ArrowRight');await p.keyboard.up('ArrowRight');await p.keyboard.press('ArrowDown');
const k1=await p.evaluate(()=>({p:S.P[1].slice(),m:S.moves,u:S.undo.length}));
ok('teclado: las flechas mueven el punto (y se repiten al mantener)',k1.p[0]>k0.p[0]+.05&&k1.p[1]>k0.p[1]);
ok('teclado: cada tanda de flechas es una movida',k1.m===k0.m+2&&k1.u===k0.u+2);
await p.keyboard.press('z');await p.keyboard.press('z');ok('teclado: Z deshace',await p.evaluate(p0=>Math.abs(S.P[1][0]-p0[0])<1e-9&&Math.abs(S.P[1][1]-p0[1])<1e-9,k0.p));
await p.keyboard.press('h');ok('teclado: H da una pista',await p.evaluate(()=>!!document.querySelector('.nd.hint')));await p.waitForTimeout(2600);
// rendimiento: arrastre continuo en Experto con el procesador 4 veces más lento
const cdp=await ctx.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Performance.enable');
await p.click('[data-diff="3"]');await p.waitForTimeout(200);
const r0=await p.evaluate(()=>{const s=document.getElementById('stage').getBoundingClientRect();const a=px(S.P[0]);return [s.left+a[0],s.top+a[1],s.width,s.height,s.left,s.top];});
const fr=await p.evaluate(()=>{window._f=0;const f=()=>{window._f++;window._raf=requestAnimationFrame(f);};f();return 0;});
await p.mouse.move(r0[0],r0[1]);await p.mouse.down();const t0=Date.now();for(let k=0;k<60;k++)await p.mouse.move(r0[4]+r0[2]*(.2+.6*((k%20)/20)),r0[5]+r0[3]*(.3+.4*Math.sin(k/5)),{steps:1});await p.mouse.up();
const fps=await p.evaluate(t=>{cancelAnimationFrame(window._raf);return window._f/((Date.now()-t)/1000);},t0);
ok(`arrastre fluido en Experto con CPU 4× más lenta (${fps.toFixed(0)} cuadros/s)`,fps>=30);
await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
await p.waitForTimeout(800);// que terminen las transiciones del último arrastre
const idle=await cpuIdle();ok(`en reposo no consume (${idle.toFixed(2)} % de CPU)`,idle<0.5);
});
