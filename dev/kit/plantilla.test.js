// Pruebas de __NOMBRE__. Las escribió nuevo_juego.py para la plantilla ("apagá todas las luces"):
// cuando cambies las reglas, cambiá estas pruebas. Lo común del kit lo revisa _generico.js.
// Uso: node dev/pruebas/__ID__.test.js [games/__ID__/index.html]
require('./_base.js')(process.argv[2]||require('path').join(__dirname,'..','..','games','__ID__','index.html'),8870,async({p,ok,D,fits,cpuIdle})=>{
  const tapCell=i=>p.click(`[data-i="${i}"]`);
  ok('el nivel arranca con luces encendidas',await p.evaluate(()=>S.on.some(Boolean)));
  const on0=await p.evaluate(()=>S.on.join(''));await tapCell(0);
  ok('tocar cambia la casilla y sus vecinas',await p.evaluate(o=>S.on.join('')!==o&&S.undo.length===1,on0));
  await p.click('#act');ok('deshacer',await p.evaluate(o=>S.on.join('')===o&&S.undo.length===0,on0));
  for(const i of await p.evaluate(()=>S.sol))await tapCell(i);await p.waitForTimeout(1100);
  ok('tocar la solución gana y abre el cartel',await p.evaluate(()=>S.won)&&await p.isVisible('[data-pane=end]'));
  await p.screenshot({path:D+'__ID___win.png'});await p.click('#endNext');await p.waitForTimeout(150);
  await p.keyboard.press('ArrowRight');await p.keyboard.press(' ');ok('teclado: flechas y Espacio',await p.evaluate(()=>cur===0&&S.undo.length===1));
  ok('la pista marca una casilla',await p.evaluate(()=>{hint();return !!document.querySelector('.cell.is-hint');}));
  for(let d=0;d<4;d++){await p.click(`[data-diff="${d}"]`);await p.waitForTimeout(120);ok(`dificultad ${d+1}: sin desborde`,await fits());await p.screenshot({path:D+'__ID___d'+d+'.png'});}
  await p.waitForTimeout(1800);const idle=await cpuIdle();ok(`en reposo no consume (${idle.toFixed(2)} %)`,idle<0.5);
});
