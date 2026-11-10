// Pruebas de Blackjack: motor y estrategia, mano completa con teclado, rivales en segundo plano, consejo, deshacer,
// Desafío, guardado a mitad de mano, ganar y perder la mesa, temas, pantallas, fluidez y consumo.
const run=require('./_base.js');
run(process.argv[2]||require('path').join(__dirname,'..','..','games','blackjack','index.html'),8848,async({p,ok,D,fits,cpuIdle})=>{
  // motor
  const m=await p.evaluate(()=>{const C=s=>s.split('').map(x=>({r:{A:1,T:10}[x]||+x,s:0}));
    const spot=(mine,up)=>{const T=E.newTable(2,0);T.phase='turnos';T.turn=1;T.hi=0;T.seats[1].chips=999;T.seats[1].hands=[{cards:C(mine),bet:10,done:false}];T.dealer.cards=[C(up)[0],{r:5,s:1}];
      const c=Array(11).fill(0);for(let v=1;v<=9;v++)c[v]=24;c[10]=96;[...C(mine),C(up)[0]].forEach(x=>c[E.val(x.r)]--);const e=E.evs(T,1,0,c);return Object.keys(e).sort((a,b)=>e[b]-e[a])[0];};
    const casos=[['T6','T','pedir'],['56','6','doblar'],['T2','4','plantarse'],['88','T','dividir'],['A7','3','doblar'],['TT','6','plantarse']];
    const a=JSON.stringify(E.newTable(1,3).shoe.slice(0,20)),b=JSON.stringify(E.newTable(1,3).shoe.slice(0,20)),c=JSON.stringify(E.newTable(1,4).shoe.slice(0,20));
    return {bien:casos.filter(([x,u,e])=>spot(x,u)===e).length,n:casos.length,igual:a===b,distinto:a!==c};});
  ok(`el consejo coincide con la estrategia básica (${m.bien}/${m.n})`,m.bien===m.n);
  ok('el mismo nivel reparte igual y otro nivel distinto',m.igual&&m.distinto);
  const esperar=async(fn,ms=15000)=>{const t=Date.now();while(Date.now()-t<ms){if(await p.evaluate(fn))return true;await p.waitForTimeout(80);}return false;};
  const miTurno=()=>esperar(()=>S.T.phase==='bet'||S.T.phase==='final'||S.won||S.timeup||(S.T.phase==='turnos'&&S.T.seats[S.T.turn].who==='yo'&&S.T.seats[1].hands[S.T.hi].cards.length>=2));
  // apostar y repartir con teclado
  await p.screenshot({path:D+'bj_bet.png'});
  await p.keyboard.press('2');ok('2 suma 25 a la apuesta',await p.evaluate(()=>S.bet===45));
  await p.keyboard.press('Enter');ok('Enter reparte',await p.evaluate(()=>S.T.phase!=='bet'));
  ok('los rivales piensan en segundo plano',await p.evaluate(()=>ia.enSegundoPlano));
  await miTurno();
  const enTurno=await p.evaluate(()=>S.T.phase==='turnos');
  if(enTurno){
    await p.screenshot({path:D+'bj_turno.png'});
    // consejo
    await p.click('#hintBtn');await esperar(()=>!!document.querySelector('.ctl small.ev'),4000);
    ok('el consejo muestra el valor de cada jugada en los botones',await p.evaluate(()=>document.querySelectorAll('.ctl small.ev').length>=2&&!!document.querySelector('.ctl button.best')));
    // deshacer en Libre
    const before=await p.evaluate(()=>S.T.seats[1].hands[0].cards.length);
    await p.keyboard.press('p');await p.waitForTimeout(500);
    ok('P pide carta',await p.evaluate(b=>S.T.seats[1].hands[0].cards.length===b+1,before));
    await p.click('#act');await p.waitForTimeout(400);
    ok('Libre deja deshacer la jugada',await p.evaluate(b=>S.T.seats[1].hands[0].cards.length===b&&S.T.phase==='turnos',before));
    // guardado a mitad de mano
    const snap=await p.evaluate(()=>JSON.stringify({c:S.T.seats[1].hands,d:S.T.dealer.cards}));
    await p.reload();await p.waitForTimeout(600);
    ok('al volver, la mano sigue donde estaba',await p.evaluate(s=>JSON.stringify({c:S.T.seats[1].hands,d:S.T.dealer.cards})===s&&S.T.phase==='turnos',snap));
    ok('y los botones esperan tu jugada',await p.evaluate(()=>!!document.querySelector('[data-a="plantarse"]:not([disabled])')));
    await p.keyboard.press('m');
  }else ok('(la mano se resolvió sin tu turno: blackjack)',true);
  await esperar(()=>S.T.phase==='bet'||S.T.phase==='final',20000);
  ok('la mano termina y se paga',await p.evaluate(()=>S.T.hand===1));
  ok('las fichas cambian según el resultado',await p.evaluate(()=>S.T.seats.some(s=>s.chips!==200)));
  // fluidez: una mano entera con el procesador 4× más lento, sin tareas largas en la pantalla
  const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await p.evaluate(()=>{window.__lt=[];new PerformanceObserver(l=>l.getEntries().forEach(e=>__lt.push(e.duration))).observe({type:'longtask',buffered:false});});
  await p.keyboard.press('Enter');await miTurno();if(await p.evaluate(()=>S.T.phase==='turnos'))await p.keyboard.press('m');
  await esperar(()=>S.T.phase==='bet'||S.T.phase==='final',30000);
  const lt=await p.evaluate(()=>__lt);await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  ok(`mano completa sin trabas con el procesador 4× más lento (tarea más larga ${lt.length?Math.max(...lt).toFixed(0):0} ms)`,!lt.length||Math.max(...lt)<200);
  // perder y ganar la mesa
  await p.evaluate(()=>{S.T.seats[1].chips=5;S.T.phase='final';run();});await p.waitForTimeout(1000);
  ok('sin fichas, se pierde la mesa',await p.evaluate(()=>S.timeup)&&(await p.textContent('#endTitle'))==='Te quedaste sin fichas');
  await p.screenshot({path:D+'bj_pierde.png'});await p.click('#endNext');await p.waitForTimeout(300);
  ok('Reintentar arranca la misma mesa',await p.evaluate(()=>!S.timeup&&S.T.hand===0&&S.T.seats[1].chips===200));
  await p.evaluate(()=>{S.T.seats[1].chips=420;S.T.seats[0].chips=150;S.T.seats[2].chips=90;S.T.phase='final';run();});await p.waitForTimeout(1200);
  ok('terminar primero gana la mesa',await p.evaluate(()=>S.won)&&await p.isVisible('[data-pane=end]'));
  await p.screenshot({path:D+'bj_gana.png'});await p.click('#endNext');await p.waitForTimeout(300);
  // Desafío: sin consejo ni deshacer; estrellas por diferencia
  await p.click('[data-mode=desafio]');await p.waitForTimeout(300);
  ok('Desafío: sin consejo',!(await p.isVisible('#hintBtn')));
  await p.keyboard.press('Enter');await miTurno();
  if(await p.evaluate(()=>S.T.phase==='turnos')){await p.keyboard.press('m');await p.waitForTimeout(200);ok('Desafío no deja deshacer',await p.evaluate(()=>S.undo.length===0));}
  else ok('Desafío no deja deshacer',await p.evaluate(()=>S.undo.length===0));
  ok('estrellas por diferencia con el segundo',await p.evaluate(()=>{const T=S.T;T.seats[1].chips=400;T.seats[0].chips=200;T.seats[2].chips=100;const a=GAME.stars(S);T.seats[1].chips=230;const b=GAME.stars(S);return a===3&&b===1;}));
  await p.click('[data-mode=libre]');await p.waitForTimeout(300);
  // meta en las difíciles
  ok('Difícil y Experto muestran la meta',await p.evaluate(async()=>{diff=3;load();await new Promise(r=>setTimeout(r,300));return !$('metaBox').hidden&&$('meta').textContent==='260';}));
  // pantallas y temas
  for(let d=0;d<4;d++){await p.click(`[data-diff="${d}"]`);await p.waitForTimeout(250);ok(`dificultad ${d+1}: sin desborde`,await fits());}
  await p.click('[data-diff="0"]');await p.waitForTimeout(200);
  for(const t of ['pano','casino','noche','bar','gris']){await p.evaluate(t=>{themeKey=t;applyTheme();},t);await p.waitForTimeout(100);await p.screenshot({path:D+'bj_t_'+t+'.png'});}
  ok('cinco temas',await p.evaluate(()=>Object.keys(THEMES).length===5));
  await p.waitForTimeout(1500);const idle=await cpuIdle();ok(`en reposo no consume (${idle.toFixed(2)} % de CPU)`,idle<0.5);
});
