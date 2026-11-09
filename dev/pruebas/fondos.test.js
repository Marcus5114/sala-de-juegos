// Prueba de los fondos animados del kit: la galería (todos los fondos), el interruptor, reducir movimiento, batería baja y consumo.
// Uso: node dev/pruebas/fondos.test.js [games/puentes/index.html armado, para la prueba de batería]
const {execSync}=require('child_process');const path=require('path'),os=require('os'),fs=require('fs');
const out=path.join(os.tmpdir(),'kitfondos.html'),tmp=path.join(os.tmpdir(),'kitfondos.src.html');
fs.copyFileSync(path.join(__dirname,'..','kit','fondos.src.html'),tmp);
execSync(`python3 -c "import sys;sys.path.insert(0,'${path.join(__dirname,'..','herramientas')}');sys.argv=['x','--sin-minificar'];import armar;open('${out}','w').write(armar.con_kit(open('${tmp}').read(),'fondos'))"`);
const juego=process.argv[2]||path.join(__dirname,'..','..','games','puentes','index.html');
require('./_base.js')(out,8861,async({p,ok,D,cpuIdle,ctx})=>{
  await p.waitForTimeout(800);
  const r=await p.evaluate(()=>Fondo.presets.map(k=>({k,n:document.querySelectorAll(`.t[data-p="${k}"] .fondo *`).length,a:document.querySelectorAll(`.t[data-p="${k}"] .fondo *`).length&&[...document.querySelectorAll(`.t[data-p="${k}"] .fondo *`)].some(e=>e.getAnimations().length)})));
  ok(`${r.length} fondos en la galería`,r.length>=13);
  r.forEach(x=>ok(`${x.k}: ${x.n} piezas, animadas`,x.n>0&&x.a));
  await p.screenshot({path:D+'fondos_galeria.png',fullPage:true});
  // solo transform y opacity: nada que obligue a recalcular la página
  const props=await p.evaluate(()=>{const s=new Set();document.getAnimations().forEach(a=>{const kf=a.effect&&a.effect.getKeyframes?a.effect.getKeyframes():[];kf.forEach(f=>Object.keys(f).forEach(k=>{if(!['offset','easing','composite','computedOffset'].includes(k))s.add(k);}));});return [...s];});
  ok(`solo se anima transform y opacity (${props.join(', ')})`,props.every(k=>k==='transform'||k==='opacity'));
  const idle=await cpuIdle();ok(`con los ${r.length*2} fondos andando a la vez, el procesador casi no trabaja (${idle.toFixed(2)} %)`,idle<1);
  await p.click('#sw');await p.waitForTimeout(150);
  ok('el interruptor los deja quietos y lo guarda para toda la sala',await p.evaluate(()=>localStorage.getItem('sala.fondos')==='0'&&document.getAnimations().filter(a=>a.effect.target.closest('.fondo')).every(a=>a.playState==='paused')));
  await p.click('#sw');
  // reducir movimiento
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(150);
  ok('con "reducir movimiento" se quedan quietos',await p.evaluate(()=>document.getAnimations().filter(a=>a.effect.target.closest('.fondo')).every(a=>getComputedStyle(a.effect.target).animationPlayState.split(',').every(x=>x.trim()==='paused'))));
  await p.emulateMedia({reducedMotion:'no-preference'});
  // batería baja en un juego de verdad
  const b=await ctx.browser().newContext({viewport:{width:390,height:800}});const q=await b.newPage();
  await q.addInitScript(()=>{navigator.getBattery=()=>Promise.resolve({level:.12,charging:false,addEventListener(){}});try{localStorage.setItem('puentes.seen','true');}catch(e){}});
  const http=require('http');const srv=http.createServer((rq,rs)=>{fs.readFile(juego,(e,d)=>{rs.writeHead(200,{'content-type':'text/html'});rs.end(d);});}).listen(8860);
  await q.goto('http://localhost:8860/');await q.waitForTimeout(800);
  ok('con la batería baja (12 %, sin cargar) el fondo del juego se queda quieto',await q.evaluate(()=>!Fondo.activo&&document.querySelector('.fondo').classList.contains('quieto')));
  await b.close();srv.close();
});
