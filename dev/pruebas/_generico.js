// Prueba común para cualquier juego hecho con kitStart: revisa el contrato del kit sin saber nada de las reglas.
// Uso: node dev/pruebas/_generico.js games/<id>/index.html [puerto]
// Revisa: carga sin errores, cada dificultad entra en la pantalla, modos, temas y sonido, ayuda con teclado,
// ganar → cartel → siguiente nivel (botón y Enter), progreso, guardado al recargar, reiniciar y consumo en reposo.
const file=process.argv[2];if(!file){console.log('uso: node _generico.js <archivo armado> [puerto]');process.exit(2);}
require('./_base.js')(file,+(process.argv[3]||8899),async({p,ok,fits,cpuIdle})=>{
  const g=await p.evaluate(()=>typeof kitStart==='function'&&GAME?{id:GAME.id,diffs:GAME.diffs.length,themes:Object.keys(GAME.themes),hint:!!GAME.hint}:null);
  ok('usa kitStart',!!g);if(!g)return;
  // dificultades
  for(let d=0;d<g.diffs;d++){await p.click(`[data-diff="${d}"]`);await p.waitForTimeout(150);
    ok(`dificultad ${d+1}: nivel cargado y sin desborde`,await p.evaluate(d=>diff===d&&S&&typeof S.lvl==='number',d)&&await fits());}
  await p.click('[data-diff="0"]');await p.waitForTimeout(100);
  // modos
  await p.click('[data-mode=desafio]');await p.waitForTimeout(100);
  ok('Desafío muestra el reloj y esconde la pista',await p.isVisible('#timeBox')&&!(await p.isVisible('#hintBtn')));
  await p.click('[data-mode=libre]');await p.waitForTimeout(100);
  ok('Libre esconde el reloj'+(g.hint?' y muestra la pista':''),!(await p.isVisible('#timeBox'))&&(!g.hint||await p.isVisible('#hintBtn')));
  // ayuda con teclado
  ok('la ayuda explica el teclado',await p.evaluate(()=>!!document.querySelector('#helpBody .kbd')));
  // temas y sonido
  await p.click('#palBtn');await p.waitForTimeout(100);
  ok(`muestra los ${g.themes.length} temas`,await p.evaluate(()=>document.querySelectorAll('#palList .pal').length)===g.themes.length);
  for(const k of g.themes){await p.click(`[data-pal="${k}"]`);await p.waitForTimeout(60);}
  ok('cambiar de tema se guarda',await p.evaluate(k=>themeKey===k&&localStorage.getItem(GAME.id+'.theme')===JSON.stringify(k),g.themes[g.themes.length-1]));
  const s0=await p.evaluate(()=>Sfx.on);await p.click('#sndBtn');ok('el interruptor de sonido cambia la preferencia de la sala',await p.evaluate(s0=>Sfx.on!==s0&&localStorage.getItem('sala.sonido')===(s0?'0':'1'),s0));
  await p.click('#sndBtn');await p.click('[data-pane=colors] [data-close]');await p.waitForTimeout(80);
  // ganar
  const l0=await p.evaluate(()=>S.lvl);await p.evaluate(()=>win());await p.waitForTimeout(1100);
  ok('ganar abre el cartel',await p.isVisible('[data-pane=end]'));
  await p.click('#endNext');await p.waitForTimeout(150);ok('Siguiente nivel avanza',await p.evaluate(l0=>S.lvl===l0+1&&!S.won,l0));
  await p.evaluate(()=>win());await p.waitForTimeout(1100);await p.click('#endSee');await p.waitForTimeout(80);
  ok('después de ganar, el botón de abajo dice Siguiente nivel',(await p.textContent('#actTxt')).trim()==='Siguiente nivel');
  await p.keyboard.press('Enter');await p.waitForTimeout(150);ok('Enter pasa de nivel',await p.evaluate(l0=>S.lvl===l0+2,l0));
  ok('el progreso recuerda los niveles resueltos',await p.evaluate(()=>store.get('prog.'+SK(),0)>=S.lvl));
  await p.click('#recBtn');await p.waitForTimeout(80);ok('Progreso muestra cada dificultad',await p.evaluate(()=>document.querySelectorAll('#recList > div').length===GAME.diffs.length));
  await p.click('[data-pane=recs] [data-close]');
  // guardado
  const lv=await p.evaluate(()=>S.lvl);await p.reload();await p.waitForTimeout(400);
  ok('al volver retoma el nivel',await p.evaluate(lv=>S.lvl===lv,lv));
  // reiniciar sin jugadas no pregunta; R hace lo mismo
  await p.keyboard.press('r');await p.waitForTimeout(80);ok('R reinicia (sin preguntar si no hay jugadas)',!(await p.isVisible('[data-pane=confirm]'))&&await p.evaluate(()=>!S.won&&S.undo.length===0));
  ok('Desafío con estrellas: win() da 1 a 3',await p.evaluate(async()=>{mode='desafio';load();win();return S.stars>=1&&S.stars<=3;}));
  await p.waitForTimeout(1000);await p.evaluate(()=>{close();mode='libre';load();});
  await p.waitForTimeout(2000);// que terminen los papelitos del festejo
  const idle=await cpuIdle();ok(`en reposo no consume (${idle.toFixed(2)} %)`,idle<0.5);
});
