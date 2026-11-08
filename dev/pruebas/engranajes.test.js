const run=require('./_base.js');
run(process.argv[2]||require('path').join(__dirname,'..','..','games','engranajes','index.html'),8845,async({p,ok,D,fits,cpuIdle,ctx})=>{
  const g=await p.evaluate(()=>{const r=[];for(let d=0;d<4;d++){let bad=0;for(let i=0;i<100;i++){const L=genGears(d,i);
    const G=[L.motor,...L.pegs.map((q,k)=>L.sol[k]?{x:q.x,y:q.y,s:L.sol[k],peg:k}:null).filter(Boolean)];const s=gSim(G);const k=G.findIndex(x=>x.peg===L.out);
    if(s.jam.size||!s.st[k]||s.st[k].dir!==L.need.dir||Math.abs(s.st[k].w-L.need.w)>1e-9)bad++;
    // el inventario alcanza para la solución y todo entra en el tablero
    for(const z of 'SML')if(L.sol.filter(v=>v===z).length>L.inv[z])bad++;
    for(const q of G)if(q.x-GSIZES[q.s].r<0||q.y-GSIZES[q.s].r<0||q.x+GSIZES[q.s].r>GW||q.y+GSIZES[q.s].r>GH)bad++;}r.push(bad);}return r;});
  ok('100 máquinas por dificultad: la solución funciona, alcanza el inventario y entra en el tablero',g.every(x=>x===0));
  // física: contacto invierte sentido, la velocidad sigue los dientes, choque traba
  const phys=await p.evaluate(()=>{const a=gSim([{x:2,y:2,s:'M'},{x:4.5,y:2,s:'S'}]),b=gSim([{x:2,y:2,s:'M'},{x:3,y:2,s:'S'}]),c=gSim([{x:2,y:2,s:'S'},{x:4,y:2,s:'S'},{x:3,y:2+Math.sqrt(3),s:'S'}]);
    return {inv:a.st[1].dir===-1,w:Math.abs(a.st[1].w-1.5)<1e-9,choque:b.jam.size===2,triangulo:c.jam.size===3};});
  ok('dos engranajes en contacto giran al revés',phys.inv);ok('el chico gira más rápido (12 dientes → 8 dientes = ×1,5)',phys.w);
  ok('dos engranajes encimados se traban',phys.choque);ok('tres en triángulo se traban (no pueden girar todos al revés del otro)',phys.triangulo);
  const tapPeg=async i=>{const pt=await p.evaluate(i=>{const r=document.getElementById('stage').getBoundingClientRect();const q=S.L.pegs[i];return [r.left+ox+q.x*u,r.top+oy+q.y*u];},i);await p.mouse.click(...pt);};
  // resolver: elegir tamaño y tocar el eje
  const sol=await p.evaluate(()=>S.L.sol);
  for(let i=0;i<sol.length;i++)if(sol[i]){await p.click(`[data-s="${sol[i]}"]`);await tapPeg(i);}
  ok('la salida gira como pide',await p.evaluate(()=>S._ok||S.won));
  const mesh=await p.evaluate(()=>{const G=placed(),sim=gSim(G),ph=phases(G,sim),Rr=i=>GSIZES[G[i].s].r,Nn=i=>GSIZES[G[i].s].t;let bad=0,pairs=0;
    for(let i=0;i<G.length;i++)for(let j=0;j<G.length;j++){if(i===j||!sim.st[i]||!sim.st[j])continue;const d=Math.hypot(G[j].x-G[i].x,G[j].y-G[i].y);if(Math.abs(d-Rr(i)-Rr(j))>.05)continue;pairs++;
      for(const tt of [0,.37,1.9]){const ai=ph[i]*Math.PI/180+sim.st[i].dir*sim.st[i].w*tt*2*Math.PI,aj=ph[j]*Math.PI/180+sim.st[j].dir*sim.st[j].w*tt*2*Math.PI,th=Math.atan2(G[j].y-G[i].y,G[j].x-G[i].x);
        let fi=((th-ai)*Nn(i)/(2*Math.PI))%1;if(fi<0)fi+=1;let fj=((th+Math.PI-aj)*Nn(j)/(2*Math.PI))%1;if(fj<0)fj+=1;const err=Math.abs(((fi+fj-.5)%1+1.5)%1-.5);if(err>.02)bad++;}}
    return {pairs,bad};});
  ok(`los dientes se intercalan en los ${mesh.pairs} contactos y siguen intercalados al girar`,mesh.pairs>0&&mesh.bad===0);
  ok('la velocidad se muestra en rpm',/^\d+ rpm$/.test(await p.textContent('#need'))&&(await p.textContent('#motorRpm'))==='24 rpm');
  ok('una flecha gira alrededor de la salida en el sentido pedido',await p.evaluate(()=>{const g=document.querySelector('.goal');return !!g&&getComputedStyle(g).animationName==='spin'&&getComputedStyle(g).animationDirection===(S.L.need.dir<0?'reverse':'normal');}));
  await p.waitForTimeout(1700);ok('gana y muestra el cartel',await p.evaluate(()=>S.won)&&await p.isVisible('[data-pane=end]'));
  ok('los engranajes conectados giran',await p.evaluate(()=>document.querySelectorAll('.gr.spin').length>=2));
  await p.screenshot({path:D+'eng_win.png'});await p.click('#endNext');await p.waitForTimeout(200);ok('siguiente nivel',await p.evaluate(()=>S.lvl===1));
  // sacar con el mismo tamaño
  const first=await p.evaluate(()=>S.L.sol.findIndex(Boolean));const sz=await p.evaluate(i=>S.L.sol[i],first);
  await p.click(`[data-s="${sz}"]`);await tapPeg(first);ok('poner un engranaje',await p.evaluate(i=>S.g[i]!==null,first));
  await tapPeg(first);ok('tocarlo con el mismo tamaño lo saca',await p.evaluate(i=>S.g[i]===null,first));
  await p.click('#act');ok('deshacer',await p.evaluate(i=>S.g[i]!==null,first));
  // inventario limitado
  const lim=await p.evaluate(()=>{for(const z of 'SML'){if(S.L.inv[z]===0)continue;const n=S.L.inv[z];const free=S.L.pegs.map((_,i)=>i).filter(i=>!S.g[i]);if(free.length>n)return [z,n,free];}return null;});
  if(lim){await p.click(`[data-s="${lim[0]}"]`);for(const i of lim[2].slice(0,lim[1]+1))await tapPeg(i);
    ok('no deja usar más engranajes de los que hay',await p.evaluate(z=>S.g.filter(v=>v===z).length<=S.L.inv[z],lim[0]));}
  await p.click('#restart');ok('reiniciar pide confirmación',await p.isVisible('[data-pane=confirm]'));await p.click('#confirmOk');ok('reiniciar saca todo',await p.evaluate(()=>!S.g.some(Boolean)));
  await p.click('#hintBtn');ok('la pista pone un engranaje del camino',await p.evaluate(()=>S.g.some((v,i)=>v&&v===S.L.sol[i])));
  await p.reload();await p.waitForTimeout(400);ok('al volver retoma',await p.evaluate(()=>S.g.some(Boolean)&&S.lvl===1));
  ok('marca de partida en curso',await p.evaluate(()=>localStorage.getItem('engranajes.enCurso')==='1'));
  await p.click('[data-mode=desafio]');await p.waitForTimeout(200);const s2=await p.evaluate(()=>S.L.sol);for(let i=0;i<s2.length;i++)if(s2[i]){await p.click(`[data-s="${s2[i]}"]`);await tapPeg(i);}
  await p.waitForTimeout(1700);ok('desafío da estrellas',/★/.test(await p.textContent('#endBig')));await p.click('#endSee');
  for(let d=0;d<4;d++){await p.click(`[data-diff="${d}"]`);await p.waitForTimeout(200);
    const r=await p.evaluate(()=>{const st=document.getElementById('stage');return {u:Math.round(u),inside:S.L.pegs.every(q=>ox+q.x*u>=0&&oy+q.y*u>=0&&ox+q.x*u<=st.clientWidth&&oy+q.y*u<=st.clientHeight)};});
    ok(`${['Fácil','Media','Difícil','Experto'][d]}: unidad de ${r.u}px, ejes dentro del tablero, sin desborde`,r.inside&&r.u>=18&&await fits());
    await p.evaluate(()=>{S.g=S.L.sol.slice();draw();});await p.screenshot({path:D+'eng_d'+d+'.png'});await p.evaluate(()=>{S.g=S.L.pegs.map(()=>null);draw();});}
  for(const k of Object.keys(await p.evaluate(()=>THEMES))){await p.evaluate(k=>{themeKey=k;applyTheme();S.g=S.L.sol.slice();draw();},k);await p.waitForTimeout(150);await p.screenshot({path:D+'eng_t_'+k+'.png'});}
  // teclado
  await p.evaluate(()=>{newLevel(0);});
  await p.keyboard.press('1');ok('teclado: 1 elige el chico',await p.evaluate(()=>pen==='S'||S.L.inv.S===0));
  await p.keyboard.press('2');ok('teclado: 2 elige el mediano',await p.evaluate(()=>pen==='M'||S.L.inv.M===0));
  await p.keyboard.press('ArrowRight');ok('teclado: las flechas eligen un eje',await p.evaluate(()=>curPeg>=0));
  const k0=await p.evaluate(()=>curPeg);await p.keyboard.press('ArrowRight');await p.keyboard.press('ArrowDown');
  await p.keyboard.press(' ');ok('teclado: espacio pone un engranaje',await p.evaluate(()=>S.g.some(Boolean)));
  await p.keyboard.press('z');ok('teclado: Z deshace',await p.evaluate(()=>!S.g.some(Boolean)));
  const idle=await cpuIdle();ok(`con todo girando, el procesador casi no trabaja (${idle.toFixed(2)} %)`,idle<1);
});
