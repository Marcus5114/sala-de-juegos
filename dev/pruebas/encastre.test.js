const run=require('./_base.js');
run(process.argv[2]||require('path').join(__dirname,'..','..','games','encastre','index.html'),8844,async({p,ok,D,fits,cpuIdle,ctx})=>{
  // arrastrar la pieza s a la posición r,c del tablero (calcula dónde soltar para que caiga ahí)
  const dragTo=async(s,r,c)=>{const pt=await p.evaluate(([s,r,c])=>{const pc=document.querySelector(`.pc[data-s="${s}"]`).getBoundingClientRect();const br=document.getElementById('board').getBoundingClientRect();
      const cells=P[S.tray[s].k],w=Math.max(...cells.map(x=>x[1]))+1,h=Math.max(...cells.map(x=>x[0]))+1,W=w*(C+3)-3,H=h*(C+3)-3;
      const left=br.left+6+c*(C+3),top=br.top+6+r*(C+3);return {from:[pc.left+pc.width/2,pc.top+pc.height/2],to:[left+W/2,top+H+C*1.1]};},[s,r,c]);
    await p.mouse.move(...pt.from);await p.mouse.down();await p.mouse.move((pt.from[0]+pt.to[0])/2,(pt.from[1]+pt.to[1])/2,{steps:3});await p.mouse.move(...pt.to,{steps:3});await p.mouse.up();};
  const k0=await p.evaluate(()=>S.tray[0].k);await dragTo(0,0,0);
  ok('arrastrar una pieza la pone en el tablero',await p.evaluate(k=>P[k].every(([r,c])=>S.b[r*8+c]>=0)&&S.tray[0]===null,k0));
  ok('suma los puntos de sus bloques',await p.evaluate(k=>S.score===P[k].length,k0));
  await p.click('#act');ok('deshacer (Libre)',await p.evaluate(()=>S.b.every(v=>v<0)&&S.tray[0]!==null));
  // agarrar desde una esquina del casillero, fuera de la pieza
  const corner=await p.evaluate(()=>{const r=document.querySelector('.slot[data-s="1"]').getBoundingClientRect();return [r.left+5,r.top+5];});
  const k1=await p.evaluate(()=>S.tray[1].k);const to=await p.evaluate(()=>{const br=document.getElementById('board').getBoundingClientRect();return [br.left+br.width/2,br.top+br.height/2+C*2];});
  await p.mouse.move(...corner);await p.mouse.down();await p.mouse.move(to[0],to[1]-40,{steps:3});await p.mouse.move(...to,{steps:3});await p.mouse.up();
  ok('la pieza se agarra tocando cualquier parte de su casillero',await p.evaluate(()=>S.tray[1]===null));
  await p.click('#act');ok('deshacer otra vez',await p.evaluate(()=>S.b.every(v=>v<0)&&S.tray[0]!==null));
  // completar una fila: tablero preparado con la fila 7 casi llena
  await p.evaluate(()=>{S.b=Array(64).fill(-1);for(let c=1;c<8;c++)S.b[56+c]=2;S.tray=[{k:'dot',c:1},{k:'d2h',c:3},{k:'sq2',c:4}];S.combo=0;S.score=0;render();});
  await dragTo(0,7,0);ok('completar una fila la vacía y da bonus',await p.evaluate(()=>S.b.every(v=>v<0)&&S.score>1));
  // dos líneas a la vez valen más
  await p.evaluate(()=>{S.b=Array(64).fill(-1);for(let c=2;c<8;c++){S.b[c]=1;S.b[8+c]=1;}S.tray=[{k:'sq2',c:1},{k:'d2h',c:3},{k:'dot',c:4}];S.combo=0;S.score=0;render();});
  await dragTo(0,0,0);const sc2=await p.evaluate(()=>S.score);ok(`dos líneas juntas suman más (${sc2} puntos)`,sc2>=4+30);
  ok('racha al limpiar seguido',await p.evaluate(()=>S.combo>=1));
  // soltar donde no entra no la pone
  await p.evaluate(()=>{S.b=Array(64).fill(3);S.b[0]=-1;S.tray=[{k:'sq2',c:1},{k:'dot',c:3},{k:'d2h',c:4}];render();});
  await dragTo(0,3,3);ok('donde no entra no la pone',await p.evaluate(()=>S.tray[0]&&S.tray[0].k==='sq2'));
  // trabado en Libre: cambiar piezas
  await p.evaluate(()=>{S.b=Array(64).fill(3);S.b[0]=-1;S.tray=[{k:'sq2',c:1},null,{k:'d2h',c:4}];render();});
  ok('trabado en Libre ofrece cambiar piezas',(await p.textContent('#actTxt'))==='Cambiar piezas');await p.click('#act');
  ok('cambiar piezas trae alguna que entra',await p.evaluate(()=>S.tray.some(x=>x&&anyFit(S.b,x.k))));
  // desafío: fin de partida y récord
  await p.click('[data-mode=desafio]');await p.waitForTimeout(150);ok('en Desafío no hay deshacer',!(await p.isVisible('#act')));
  await p.evaluate(()=>{S.b=Array(64).fill(3);[0,1,8,9,20,29,38,47,48,57,18,27].forEach(i=>S.b[i]=-1);S.tray=[{k:'dot',c:1},{k:'sq3',c:3},{k:'d5h',c:4}];S.score=50;render();});
  await dragTo(0,0,0);await p.waitForTimeout(800);ok('sin lugar termina la partida y muestra el puntaje',await p.isVisible('[data-pane=end]')&&/\d/.test(await p.textContent('#endBig')));
  ok('guarda el récord',await p.evaluate(()=>store.get('best.desafio.0',0)>=51));
  await p.click('#endNext');ok('jugar otra vez',await p.evaluate(()=>!S.over&&S.score===0));
  await dragTo(0,2,2);await p.reload();await p.waitForTimeout(400);ok('al volver retoma',await p.evaluate(()=>S.moves===1&&mode==='desafio'));
  ok('marca de partida en curso',await p.evaluate(()=>localStorage.getItem('encastre.enCurso')==='1'));
  await p.click('#restart');ok('partida nueva pide confirmación',await p.isVisible('[data-pane=confirm]'));await p.click('#confirmOk');
  // reparto justo en Fácil: siempre llega una que entra
  const fair=await p.evaluate(()=>{const old=diff;diff=0;let bad=0;for(let t=0;t<200;t++){S.b=Array(64).fill(-1).map(()=>Math.random()<.6?1:-1);deal();if(!S.tray.some(x=>anyFit(S.b,x.k))&&EDIFFS[0].pool.some(k=>anyFit(S.b,k)))bad++;}diff=old;return bad;});
  ok('en Fácil el reparto siempre trae una pieza que entra (si alguna puede entrar)',fair===0);
  await p.click('#restart').catch(()=>{});if(await p.isVisible('[data-pane=confirm]'))await p.click('#confirmOk');
  for(let d=0;d<4;d++){await p.click(`[data-diff="${d}"]`);await p.waitForTimeout(150);if(await p.isVisible('[data-pane=confirm]'))await p.click('#confirmOk');
    const r=await p.evaluate(()=>({c:C,tray:[...document.querySelectorAll('.pc')].every(pc=>{const a=pc.getBoundingClientRect(),b=pc.parentElement.getBoundingClientRect();return a.width<=b.width+1&&a.height<=b.height+1;})}));
    ok(`${EDIFFS_N=['Fácil','Media','Difícil','Experto'][d]}: casillas de ${r.c}px, las piezas entran en la bandeja, sin desborde`,r.c>=34&&r.tray&&await fits());}
  for(const k of Object.keys(await p.evaluate(()=>THEMES))){await p.evaluate(k=>{themeKey=k;applyTheme();S.b=S.b.map((_,i)=>[3,10,11,17,18,19,26,40,41,42,43,50,51,58,59,60,61,62,63,7,15,23].includes(i)?i%8:-1);render();},k);await p.waitForTimeout(100);await p.screenshot({path:D+'enc_t_'+k+'.png'});}
  // fluidez al arrastrar con CPU lenta
  const cdp=await ctx.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await p.evaluate(()=>{S.b=Array(64).fill(-1);render();window._f=0;const f=()=>{window._f++;window._raf=requestAnimationFrame(f);};f();});
  const a=await p.evaluate(()=>{const r=document.querySelector('.pc').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];});const t0=Date.now();
  await p.mouse.move(...a);await p.mouse.down();for(let k=0;k<40;k++)await p.mouse.move(a[0]+(k%10-5)*12,a[1]-120-(k%8)*15,{steps:1});await p.mouse.up();
  const fps=await p.evaluate(t=>{cancelAnimationFrame(window._raf);return window._f/((Date.now()-t)/1000);},t0);await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  ok(`arrastre fluido con CPU 4× más lenta (${fps.toFixed(0)} cuadros/s)`,fps>=30);
  // teclado
  await p.evaluate(()=>{mode='libre';diff=0;newGame();S.tray=[{k:'dot',c:0},{k:'d2h',c:1},{k:'sq2',c:2}];render();});
  await p.keyboard.press('3');ok('teclado: 3 elige la tercera pieza y muestra dónde cae',await p.evaluate(()=>kb&&kb.s===2&&document.querySelectorAll('.cell.pv').length===4));
  await p.keyboard.press('ArrowUp');await p.keyboard.press('ArrowUp');await p.keyboard.press('ArrowLeft');
  ok('teclado: las flechas la mueven',await p.evaluate(()=>kb.r===1&&kb.c===2));
  await p.keyboard.press('Enter');ok('teclado: Enter la apoya',await p.evaluate(()=>!kb&&S.tray[2]===null&&S.b.filter(v=>v>=0).length===4&&S.b[1*8+2]>=0));
  await p.keyboard.press('z');ok('teclado: Z deshace',await p.evaluate(()=>S.b.every(v=>v<0)&&S.tray[2]));
  await p.keyboard.press('1');await p.keyboard.press('Escape');ok('teclado: Esc suelta la pieza',await p.evaluate(()=>!kb&&!document.querySelector('.cell.pv')));
  await p.waitForTimeout(800);/* que terminen las respuestas a los últimos toques */
  const idle=await cpuIdle();ok(`en reposo no consume (${idle.toFixed(2)} %)`,idle<0.5);
});
