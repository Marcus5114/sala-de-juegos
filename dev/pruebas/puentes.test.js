const run=require('./_base.js');
run(process.argv[2]||require('path').join(__dirname,'..','..','games','puentes','index.html'),8842,async({p,ok,D,fits,cpuIdle,ctx})=>{
  const g=await p.evaluate(()=>{const r=[];for(let d=0;d<4;d++){let bad=0;for(let i=0;i<40;i++){const L=genBridges(d,i);const s=bSolve(L.I,L.N,2);if(s.count!==1)bad++;
    // la solución cumple números, no se cruza y conecta
    const sum=L.I.map(()=>0);L.E.forEach(([a,b],k)=>{sum[a]+=L.sol[k];sum[b]+=L.sol[k];});if(!sum.every((x,i)=>x===L.N[i]))bad++;
    for(let a=0;a<L.E.length;a++)for(let b=a+1;b<L.E.length;b++)if(L.sol[a]&&L.sol[b]&&bCross(L.I,L.E[a],L.E[b]))bad++;}r.push(bad);}return r;});
  ok('40 niveles por dificultad: solución única, sin cruces y con los números correctos',g.every(x=>x===0));
  const swipe=async k=>{const [a,b]=await p.evaluate(k=>{const r=document.getElementById('stage').getBoundingClientRect();const [i,j]=S.E[k];const A=P(i),B=P(j);return [[r.left+A[0],r.top+A[1]],[r.left+(A[0]+B[0])/2,r.top+(A[1]+B[1])/2]];},k);
    await p.mouse.move(...a);await p.mouse.down();await p.mouse.move(...b,{steps:4});await p.mouse.up();};
  await swipe(0);ok('arrastrar entre islas tiende un puente',await p.evaluate(()=>S.v[0]===1));
  await swipe(0);ok('otra vez lo hace doble',await p.evaluate(()=>S.v[0]===2));
  await swipe(0);ok('otra vez lo quita',await p.evaluate(()=>S.v[0]===0));
  await p.click('#act');ok('deshacer',await p.evaluate(()=>S.v[0]===2));await p.click('#act');await p.click('#act');
  // cruce prohibido
  const pair=await p.evaluate(()=>{crossIdx();for(let k=0;k<S.E.length;k++)if(X[k].length)return [k,X[k][0]];return null;});
  if(pair){await swipe(pair[0]);await swipe(pair[1]);ok('no deja cruzar puentes',await p.evaluate(([a,b])=>S.v[a]===1&&S.v[b]===0,pair));await p.click('#act');}
  else ok('(sin cruces posibles en este nivel)',true);
  // resolver con gestos
  const sol=await p.evaluate(()=>S.sol);for(let k=0;k<sol.length;k++)for(let t=0;t<sol[k];t++)await swipe(k);
  await p.waitForTimeout(900);ok('resolverlo gana',await p.evaluate(()=>S.won)&&await p.isVisible('[data-pane=end]'));
  await p.screenshot({path:D+'pue_win.png'});await p.click('#endNext');await p.waitForTimeout(200);ok('siguiente nivel',await p.evaluate(()=>S.lvl===1));
  await p.click('#hintBtn');ok('la pista pone un puente',await p.evaluate(()=>S.v.some(Boolean)));
  // tocar un puente lo cambia
  const k0=await p.evaluate(()=>S.v.findIndex(Boolean));const mid=await p.evaluate(k=>{const r=document.getElementById('stage').getBoundingClientRect();const [i,j]=S.E[k];const A=P(i),B=P(j);return [r.left+(A[0]+B[0])/2,r.top+(A[1]+B[1])/2];},k0);
  const before=await p.evaluate(k=>S.v[k],k0);await p.mouse.click(...mid);ok('tocar un puente lo cambia',await p.evaluate(([k,b])=>S.v[k]!==b,[k0,before]));
  // teclado: flechas mueven el cursor y Mayúscula + flecha tiende el puente
  await p.keyboard.press('ArrowRight');ok('teclado: aparece el cursor en una isla',await p.evaluate(()=>cur===0));
  const kd=await p.evaluate(()=>{for(const [dx,dy,k] of [[1,0,'ArrowRight'],[-1,0,'ArrowLeft'],[0,1,'ArrowDown'],[0,-1,'ArrowUp']]){const e=neighborEdge(cur,dx,dy);if(e>=0&&!crossIdx()[e].some(j=>S.v[j]>0))return [k,e,S.v[e]];}return null;});
  if(kd){await p.keyboard.press('Shift+'+kd[0]);ok('teclado: Mayúscula + flecha tiende un puente',await p.evaluate(([k,e,v])=>S.v[e]===(v+1)%3,kd));}
  await p.evaluate(()=>{if(!S.v.some(Boolean)){S.v[0]=1;draw();}});await p.click('#restart');ok('reiniciar pide confirmación',await p.isVisible('[data-pane=confirm]'));await p.click('#confirmOk');ok('reiniciar quita todo',await p.evaluate(()=>!S.v.some(Boolean)));
  await swipe(0);await p.reload();await p.waitForTimeout(400);ok('al volver retoma',await p.evaluate(()=>S.v[0]===1&&S.lvl===1));
  ok('marca de partida en curso',await p.evaluate(()=>localStorage.getItem('puentes.enCurso')==='1'));
  await p.click('[data-mode=desafio]');await p.waitForTimeout(200);const sol2=await p.evaluate(()=>S.sol);for(let k=0;k<sol2.length;k++)for(let t=0;t<sol2[k];t++)await swipe(k);
  await p.waitForTimeout(900);ok('desafío da estrellas',/★/.test(await p.textContent('#endBig')));await p.click('#endSee');
  for(let d=0;d<4;d++){await p.click(`[data-diff="${d}"]`);await p.waitForTimeout(200);
    const r=await p.evaluate(()=>({c:Math.round(c),inside:S.I.every((_,i)=>{const [x,y]=P(i);const s=document.getElementById('stage');return x-c*.4>=0&&y-c*.4>=0&&x+c*.4<=s.clientWidth&&y+c*.4<=s.clientHeight;})}));
    ok(`${['Fácil','Media','Difícil','Experto'][d]}: celdas de ${r.c}px, islas dentro del tablero, sin desborde`,r.inside&&r.c>=30&&await fits());await p.screenshot({path:D+'pue_d'+d+'.png'});}
  for(const k of Object.keys(await p.evaluate(()=>THEMES))){await p.evaluate(k=>{themeKey=k;applyTheme();},k);await p.evaluate(()=>{S.v=S.sol.slice();draw();});await p.waitForTimeout(100);await p.screenshot({path:D+'pue_t_'+k+'.png'});}
  await p.evaluate(()=>{S.v=S.E.map(()=>0);draw();});
  // fluidez del arrastre (redibuja todo) con CPU lenta
  const cdp=await ctx.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const a=await p.evaluate(()=>{const r=document.getElementById('stage').getBoundingClientRect();const A=P(0);return [r.left+A[0],r.top+A[1]];});
  await p.evaluate(()=>{window._f=0;const f=()=>{window._f++;window._raf=requestAnimationFrame(f);};f();});const t0=Date.now();
  await p.mouse.move(...a);await p.mouse.down();for(let k=0;k<40;k++)await p.mouse.move(a[0]+(k%20)*4,a[1],{steps:1});await p.mouse.up();
  const fps=await p.evaluate(t=>{cancelAnimationFrame(window._raf);return window._f/((Date.now()-t)/1000);},t0);await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  ok(`arrastre fluido en Experto con CPU 4× más lenta (${fps.toFixed(0)} cuadros/s)`,fps>=30);
  const idle=await cpuIdle();ok(`en reposo no consume (${idle.toFixed(2)} %)`,idle<0.5);
});
