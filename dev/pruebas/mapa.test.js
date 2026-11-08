const run=require('./_base.js');
run(process.argv[2]||require('path').join(__dirname,'..','..','games','mapa','index.html'),8843,async({p,ok,D,fits,cpuIdle,ctx})=>{
  const g=await p.evaluate(()=>{const r=[];for(let d=0;d<4;d++){let bad=0;for(let i=0;i<25;i++){const M=genMap(d,i);const c=mCount(M.adj,M.k,M.given,2);
    if(MDIFFS[d].unique?c.count!==1:c.count<1)bad++;
    // la solución respeta vecinas y pistas
    for(let a=0;a<M.n;a++){if(M.given[a]!=null&&M.sol[a]!==M.given[a])bad++;for(const b of M.adj[a])if(M.sol[a]===M.sol[b])bad++;}}r.push(bad);}return r;});
  ok('25 mapas por dificultad: se pueden pintar, y en Difícil y Experto con una sola solución',g.every(x=>x===0));
  const tapRegion=async i=>{const pt=await p.evaluate(i=>{const r=document.getElementById('stage').getBoundingClientRect();const [lx,ly]=G.label[i];return [r.left+ox+lx*s,r.top+oy+ly*s];},i);await p.mouse.click(...pt);};
  const free=await p.evaluate(()=>S.c.map((v,i)=>v==null?i:-1).filter(i=>i>=0));
  // conflicto: pintar dos vecinas del mismo color
  const pair=await p.evaluate(()=>{for(let a=0;a<S.M.n;a++)if(S.c[a]==null)for(const b of S.M.adj[a])if(S.c[b]==null)return [a,b];return null;});
  await p.click('[data-c="0"]');await tapRegion(pair[0]);await tapRegion(pair[1]);
  ok('dos vecinas iguales marcan el borde en rojo',await p.evaluate(()=>{const c=document.getElementById('conf');return !!c&&c.getAttribute('d').length>6;}));
  await p.keyboard.press('2');ok('teclado: 2 elige el segundo color',await p.evaluate(()=>pen===1));await p.keyboard.press('0');ok('teclado: 0 elige la goma',await p.evaluate(()=>pen===-1));await p.keyboard.press('1');
  await p.click('#act');ok('deshacer',await p.evaluate(b=>S.c[b]==null,pair[1]));
  await tapRegion(pair[0]);ok('tocar con el mismo color despinta',await p.evaluate(a=>S.c[a]==null,pair[0]));
  const given=await p.evaluate(()=>S.M.given.findIndex(v=>v!=null));await tapRegion(given);ok('las regiones con alfiler no se cambian',await p.evaluate(i=>S.c[i]===S.M.given[i],given));
  // resolver tocando
  const sol=await p.evaluate(()=>S.M.sol);for(const i of free){await p.click(`[data-c="${sol[i]}"]`);await tapRegion(i);}
  await p.waitForTimeout(900);ok('pintar todo bien gana',await p.evaluate(()=>S.won)&&await p.isVisible('[data-pane=end]'));
  await p.screenshot({path:D+'map_win.png'});await p.click('#endNext');await p.waitForTimeout(200);ok('siguiente nivel',await p.evaluate(()=>S.lvl===1));
  await p.click('#hintBtn');ok('la pista pinta una región',await p.evaluate(()=>S.undo.length===1));
  await p.click('#restart');ok('reiniciar pide confirmación',await p.isVisible('[data-pane=confirm]'));await p.click('#confirmOk');ok('reiniciar despinta',await p.evaluate(()=>S.undo.length===0));
  const f2=await p.evaluate(()=>S.c.findIndex(v=>v==null));await p.click('[data-c="1"]');await tapRegion(f2);await p.reload();await p.waitForTimeout(400);
  ok('al volver retoma',await p.evaluate(i=>S.c[i]===1&&S.lvl===1,f2));ok('marca de partida en curso',await p.evaluate(()=>localStorage.getItem('mapa.enCurso')==='1'));
  // pista con un error: avisa y despinta
  await p.evaluate(()=>{for(let d of [2]){} });
  await p.click('[data-mode=desafio]');await p.waitForTimeout(200);const s2=await p.evaluate(()=>S.M.sol),fr=await p.evaluate(()=>S.c.map((v,i)=>v==null?i:-1).filter(i=>i>=0));
  for(const i of fr){await p.click(`[data-c="${s2[i]}"]`);await tapRegion(i);}await p.waitForTimeout(900);ok('desafío da estrellas',/★/.test(await p.textContent('#endBig')));await p.click('#endSee');
  for(let d=0;d<4;d++){await p.click(`[data-diff="${d}"]`);await p.waitForTimeout(250);
    const r=await p.evaluate(()=>{// región más chica en pantalla: alto y ancho mínimo de su caja
      let mn=1e9;for(let i=0;i<S.M.n;i++){let c=0;for(const v of S.M.reg)if(v===i)c++;mn=Math.min(mn,Math.sqrt(c)*s);}return {mn:Math.round(mn),k:S.M.k,btn:document.querySelectorAll('#cols button').length};});
    ok(`${['Fácil','Media','Difícil','Experto'][d]}: ${r.k} colores + borrar, la región más chica mide ~${r.mn}px, sin desborde`,r.btn===r.k+1&&r.mn>=24&&await fits());await p.screenshot({path:D+'map_d'+d+'.png'});}
  // pista cuando hay una región mal pintada (3 colores, solución única)
  await p.click('[data-mode=libre]');await p.click('[data-diff="2"]');await p.waitForTimeout(200);
  const wrong=await p.evaluate(()=>{const i=S.c.findIndex(v=>v==null);const w=(S.M.sol[i]+1)%3;S.c[i]=w;S.undo.push([i,null]);draw();return i;});
  await p.click('#hintBtn');ok('si algo no puede ir, la pista lo despinta o lo corrige',await p.evaluate(i=>S.c.every((v,j)=>v==null||!S.M.adj[j].some(k=>S.c[k]===v))&&mCount(S.M.adj,S.M.k,S.c,1).count>0,wrong));
  for(const k of Object.keys(await p.evaluate(()=>THEMES))){await p.evaluate(k=>{themeKey=k;applyTheme();S.c=S.M.sol.slice();draw();},k);await p.waitForTimeout(100);await p.screenshot({path:D+'map_t_'+k+'.png'});}
  await p.evaluate(()=>{S.c=S.M.given.slice();draw();});
  const cdp=await ctx.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const t0=Date.now();for(let k=0;k<10;k++){await p.click('[data-c="0"]');await tapRegion(await p.evaluate(()=>S.c.findIndex(v=>v==null)));}
  const per=(Date.now()-t0)/10;await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});ok(`pintar responde rápido con CPU 4× más lenta (${per.toFixed(0)} ms por toque, incluido el clic)`,per<250);
  const idle=await cpuIdle();ok(`en reposo no consume (${idle.toFixed(2)} %)`,idle<0.5);
});
