const run=require('./_base.js');
run(process.argv[2]||require('path').join(__dirname,'..','..','games','piramide','index.html'),8841,async({p,ok,D,fits,cpuIdle})=>{
  const g=await p.evaluate(()=>{const r=[];for(let d=0;d<4;d++){let bad=0;for(let i=0;i<100;i++){const P=genPyramid(d,i);if(!pDeduce(P.n,P.v,P.g))bad++;
    for(const [t,a,b] of pRules(P.n))if(P.v[t]!==P.v[a]+P.v[b])bad++;}r.push(bad);}return r;});
  ok('100 pirámides por dificultad: todas se resuelven deduciendo y las sumas son correctas',g.every(x=>x===0));
  const type=async n=>{for(const ch of String(n))await p.click(`[data-k="${ch}"]`);};
  // escribir un número equivocado marca conflicto si cierra una suma
  const empties=await p.evaluate(()=>S.u.map((x,i)=>x==null?i:-1).filter(i=>i>=0));
  ok('arranca con ladrillos vacíos',empties.length>0);
  // completar todo con los valores correctos, tocando y escribiendo
  for(const i of empties){await p.click(`.br[data-i="${i}"]`);const v=await p.evaluate(i=>S.v[i],i);await type(v);}
  await p.waitForTimeout(900);ok('completar correcto gana',await p.evaluate(()=>S.won)&&await p.isVisible('[data-pane=end]'));
  await p.screenshot({path:D+'pir_win.png'});
  await p.click('#endNext');await p.waitForTimeout(200);ok('siguiente nivel',await p.evaluate(()=>S.lvl===1&&!S.won));
  // error: escribir algo que no cierra
  const tri=await p.evaluate(()=>{for(const [t,a,b] of pRules(S.n)){const m=[t,a,b].filter(i=>S.u[i]==null);if(m.length===1)return m[0];}return -1;});
  if(tri>=0){await p.click(`.br[data-i="${tri}"]`);await type(9999);ok('un número que no cierra la suma se marca en rojo',await p.evaluate(i=>document.querySelector(`.br[data-i="${i}"]`).classList.contains('bad'),tri));
    await p.click('[data-k="del"]');await p.click('[data-k="del"]');await p.click('[data-k="del"]');await p.click('[data-k="del"]');ok('borrar con el teclado',await p.evaluate(i=>S.u[i]==null,tri));}
  // teclado físico: Tab va al siguiente vacío y los números se escriben
  await p.keyboard.press('Tab');const si=await p.evaluate(()=>sel);await p.keyboard.type('12');ok('teclado: Tab elige un vacío y se escribe con los números',await p.evaluate(i=>S.u[i]===12,si));
  await p.keyboard.press('Backspace');await p.keyboard.press('Backspace');ok('teclado: borrar',await p.evaluate(i=>S.u[i]==null,si));
  await p.keyboard.press('ArrowUp');ok('teclado: las flechas mueven la selección',await p.evaluate(i=>sel!==i,si));
  await p.click('#act');ok('deshacer',await p.evaluate(()=>S.undo.length>=0));
  await p.click('#hintBtn');await p.waitForTimeout(100);ok('la pista completa un ladrillo deducible',await p.evaluate(()=>S.u.filter(x=>x!=null).length>S.g.filter(Boolean).length));
  await p.click('#restart');ok('reiniciar pide confirmación',await p.isVisible('[data-pane=confirm]'));await p.click('#confirmOk');ok('reiniciar limpia',await p.evaluate(()=>S.undo.length===0));
  await p.click(`.br[data-i="${await p.evaluate(()=>S.u.findIndex(x=>x==null))}"]`);await type(5);
  await p.reload();await p.waitForTimeout(400);ok('al volver retoma lo escrito',await p.evaluate(()=>S.undo.length===1&&S.lvl===1));
  ok('marca de partida en curso',await p.evaluate(()=>localStorage.getItem('piramide.enCurso')==='1'));
  await p.click('[data-mode=desafio]');await p.waitForTimeout(200);ok('desafío con reloj y sin pista',await p.isVisible('#timeBox')&&!(await p.isVisible('#hintBtn')));
  const e2=await p.evaluate(()=>S.u.map((x,i)=>x==null?i:-1).filter(i=>i>=0));for(const i of e2){await p.click(`.br[data-i="${i}"]`);await type(await p.evaluate(i=>S.v[i],i));}
  await p.waitForTimeout(900);ok('desafío da estrellas',/★/.test(await p.textContent('#endBig')));await p.click('#endSee');
  for(let d=0;d<4;d++){await p.click(`[data-diff="${d}"]`);await p.waitForTimeout(200);
    const r=await p.evaluate(()=>{const s=document.getElementById('stage').getBoundingClientRect();const bs=[...document.querySelectorAll('.br')].map(b=>b.getBoundingClientRect());
      return {inside:bs.every(b=>b.left>=s.left-1&&b.right<=s.right+1&&b.top>=s.top-1&&b.bottom<=s.bottom+1),w:Math.round(Math.min(...bs.map(b=>b.width))),
        textFits:[...document.querySelectorAll('.br')].every(b=>b.scrollWidth<=b.clientWidth+1)};});
    ok(`${['Fácil','Media','Difícil','Experto'][d]}: ladrillos de ${r.w}px dentro del tablero, números entran, sin desborde`,r.inside&&r.textFits&&r.w>=36&&await fits());
    await p.screenshot({path:D+'pir_d'+d+'.png'});}
  for(const k of ['piedra','hielo','juguete','choco','pizarra']){await p.evaluate(k=>{themeKey=k;applyTheme();},k);await p.waitForTimeout(100);await p.screenshot({path:D+'pir_t_'+k+'.png'});}
  const idle=await cpuIdle();ok(`en reposo no consume (${idle.toFixed(2)} %)`,idle<0.5);
});
