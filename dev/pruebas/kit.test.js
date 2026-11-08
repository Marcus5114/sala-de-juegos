// Pruebas del kit con la página de laboratorio (dev/kit/demo.src.html): entradas, animación, sonido, juego base.
const {execSync}=require('child_process');const path=require('path'),os=require('os');
const out=path.join(os.tmpdir(),'kitdemo.html');
execSync(`python3 -c "import sys;sys.path.insert(0,'${path.join(__dirname,'..','herramientas')}');sys.argv=['x','--sin-minificar'];import armar;open('${out}','w').write(armar.con_kit(open('${path.join(__dirname,'..','kit','demo.src.html')}').read(),'kitdemo'))"`);
require('./_base.js')(out,8861,async({p,ok,fits,cpuIdle})=>{
  const box=async id=>p.evaluate(id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};},id);
  // tocar y mantener
  const tb=await box('tapBig');await p.mouse.click(tb.x+tb.w/2,tb.y+tb.h/2);ok('Input.press: tocar',await p.evaluate(()=>S.taps===1));
  await p.mouse.move(tb.x+tb.w/2,tb.y+tb.h/2);await p.mouse.down();await p.waitForTimeout(550);await p.mouse.up();ok('Input.press: mantener apretado',await p.evaluate(()=>LOG.some(l=>l[0]==='long')&&S.taps===1));
  // arrastrar
  const c=await box('chip');await p.mouse.move(c.x+10,c.y+10);await p.mouse.down();for(let k=1;k<=10;k++)await p.mouse.move(c.x+10+k*6,c.y+10+k*4);await p.mouse.up();
  const c2=await box('chip');ok('Input.drag: la ficha sigue al dedo',Math.abs(c2.x-c.x-60)<3&&Math.abs(c2.y-c.y-40)<3);
  ok('Input.drag: avisa al terminar y agrupa movimientos por cuadro',await p.evaluate(()=>{const l=LOG.find(l=>l[0]==='drag-end');return l&&l[1]===true&&l[2]>=1&&l[2]<=11;}));
  const z=await box('zDrag');await p.mouse.move(z.x+z.w-8,z.y+z.h-8);await p.mouse.down();await p.mouse.move(z.x+20,z.y+20,{steps:3});await p.mouse.up();
  ok('Input.drag: fuera de la ficha no arrastra',await p.evaluate(()=>LOG.filter(l=>l[0]==='drag-end').length===1));
  // trazar 0→1→2, volver a 1 (saca el 2), seguir a 3
  const t=await box('zTrace');const D=[[.2,.3],[.5,.2],[.8,.3],[.65,.75],[.35,.75]],pt=i=>[t.x+D[i][0]*t.w,t.y+D[i][1]*t.h];
  await p.mouse.move(...pt(0));await p.mouse.down();for(const i of [1,2,1,3])await p.mouse.move(...pt(i),{steps:5});await p.mouse.up();
  ok('Input.trace: arma el camino y deja volver atrás',await p.evaluate(()=>LOG.some(l=>l[0]==='trace'&&l[1]==='013')));
  // deslizar
  const s=await box('zSwipe');await p.mouse.move(s.x+s.w/2,s.y+s.h/2);await p.mouse.down();await p.mouse.move(s.x+s.w/2+70,s.y+s.h/2+10,{steps:3});await p.mouse.up();
  ok('Input.swipe: reconoce la dirección',(await p.textContent('#swOut'))==='right');
  await p.mouse.move(s.x+s.w/2,s.y+s.h/2);await p.mouse.down();await p.mouse.move(s.x+s.w/2+8,s.y+s.h/2+5,{steps:2});await p.mouse.up();
  ok('Input.swipe: un toque corto no cuenta como deslizar',await p.evaluate(()=>LOG.filter(l=>l[0]==='dir').length===1));
  // teclado
  await p.keyboard.press('ArrowUp');await p.keyboard.press('a');ok('Input.dirKeys: flechas y WASD',await p.evaluate(()=>LOG.filter(l=>l[0]==='dir').map(l=>l[1]).join()==='right,up,left'));
  await p.keyboard.press('x');ok('teclas propias del juego',await p.evaluate(()=>LOG.some(l=>l[0]==='key-x')));
  await p.keyboard.press('Control+x');ok('las combinaciones con Ctrl no se capturan',await p.evaluate(()=>LOG.filter(l=>l[0]==='key-x').length===1));
  await p.click('#helpBtn');await p.keyboard.press('x');ok('con un panel abierto el teclado no juega',await p.evaluate(()=>LOG.filter(l=>l[0]==='key-x').length===1));await p.keyboard.press('Escape');
  // juego base: deshacer, ganar, siguiente, guardar, reiniciar, desafío
  await p.keyboard.press('z');ok('Z deshace',await p.evaluate(()=>S.taps===0));
  const need=await p.evaluate(()=>S.need);for(let k=0;k<need;k++)await p.mouse.click(tb.x+tb.w/2,tb.y+tb.h/2);
  await p.waitForTimeout(1200);ok('kitStart: ganar abre el cartel',await p.isVisible('[data-pane=end]')&&(await p.textContent('#endTitle'))==='¡Listo!');
  await p.click('#endSee');ok('kitStart: el botón principal pasa a Siguiente nivel',(await p.textContent('#actTxt'))==='Siguiente nivel');
  await p.keyboard.press('Enter');ok('Enter pasa al siguiente nivel',await p.evaluate(()=>S.lvl===1&&!S.won));
  await p.mouse.click(tb.x+tb.w/2,tb.y+tb.h/2);await p.reload();await p.waitForTimeout(400);ok('guardado: retoma nivel y avance',await p.evaluate(()=>S.lvl===1&&S.taps===1));
  ok('marca de partida en curso para la sala',await p.evaluate(()=>localStorage.getItem('kitdemo.enCurso')==='1'));
  await p.keyboard.press('r');ok('R pide confirmación para reiniciar',await p.isVisible('[data-pane=confirm]'));await p.click('#confirmOk');ok('reiniciar',await p.evaluate(()=>S.taps===0));
  await p.click('#hintBtn');ok('pista en Libre',await p.evaluate(()=>LOG.some(l=>l[0]==='hint')));
  await p.click('[data-mode=desafio]');ok('Desafío: reloj y sin pista',await p.isVisible('#timeBox')&&!(await p.isVisible('#hintBtn')));
  await p.waitForTimeout(2200);ok('el reloj corre',await p.evaluate(()=>S.secs>=1));
  await p.click('#helpBtn');const s0=await p.evaluate(()=>S.secs);await p.waitForTimeout(2200);ok('el reloj se detiene con un panel abierto',await p.evaluate(s=>S.secs===s,s0));await p.keyboard.press('Escape');
  const n2=await p.evaluate(()=>S.need);for(let k=0;k<n2;k++)await p.mouse.click(tb.x+tb.w/2,tb.y+tb.h/2);await p.waitForTimeout(1200);
  ok('Desafío da estrellas',/★/.test(await p.textContent('#endBig')));await p.click('#endSee');
  // temas y sonido
  await p.click('#palBtn');await p.click('[data-pal="b"]');ok('cambiar de tema',await p.evaluate(()=>themeKey==='b'&&document.getElementById('stage').classList.contains('t-b')));
  ok('sonido apagado por defecto',await p.evaluate(()=>!Sfx.on));await p.click('#sndBtn');ok('el interruptor lo prende y queda guardado para toda la sala',await p.evaluate(()=>Sfx.on&&localStorage.getItem('sala.sonido')==='1'));
  await p.click('#sndBtn');await p.keyboard.press('Escape');
  // animaciones y bucle
  ok('Anim.celebrate aparece y después se borra solo',await p.evaluate(async()=>{Anim.celebrate($('stage'));const a=document.querySelectorAll('.kit-confeti').length;await new Promise(r=>setTimeout(r,2800));return a>=1&&document.querySelectorAll('.kit-confeti').length===0;}));
  ok('Loop se detiene cuando step devuelve false',await p.evaluate(async()=>{let n=0;const L=Loop(()=>++n<5);L.start();await new Promise(r=>setTimeout(r,300));return n===5&&!L.on;}));
  ok('Redraw junta varias pedidas en un solo dibujo',await p.evaluate(async()=>{let n=0;const R=Redraw(()=>n++);R();R();R();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return n===1;}));
  ok('azar con semilla: mismo número, misma secuencia',await p.evaluate(()=>{const a=rngOf(7),b=rngOf(7);return [a(),a(),a()].join()===[b(),b(),b()].join();}));
  ok('sin desborde en pantalla de celular',await fits());
  const idle=await cpuIdle();ok(`en reposo no consume (${idle.toFixed(2)} %)`,idle<0.5);
});
