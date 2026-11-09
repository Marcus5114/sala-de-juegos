/* =====================================================================================
   KIT DE LA SALA DE JUEGOS · v2
   Se inserta en cada juego al armar (en la marca KIT_JS). Todo queda en el mismo ámbito que el juego.
   Secciones:
     1. Base ............ $, store, toast, paneles, confirmar, formato, azar con semilla
     2. Entrada ......... Input.keys / dirKeys / press / drag / swipe / trace
     3. Animación ....... Anim.pop / shake / pulse / fly / stagger / countTo / celebrate
     4. Bucle ........... Loop (cuadros solo cuando hace falta) · Redraw (un dibujo por cuadro)
     5. Sonido y vibración Sfx.play(nombre) · vibe(patrón)
     6. Juego ........... kitStart(cfg): modos, dificultades, niveles, guardado, reloj, deshacer,
                          pistas, fin de nivel, estrellas, récords, temas y progreso
   Guía completa: dev/README.md · dev/kit/ESTILO.md · dev/kit/LIBRERIAS.md · plantilla: dev/kit/plantilla.src.html
   ===================================================================================== */

/* ---------- 1. Base ---------- */
const $=id=>document.getElementById(id);
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE='cubic-bezier(.22,.61,.36,1)';
// resorte: una curva física (masa, rigidez, freno) convertida a linear() de CSS. La sigue moviendo la placa de video,
// como cualquier curva, pero se siente más natural (pasa un poquito y vuelve). Sin soporte de linear(), una curva parecida.
function springEasing({stiffness=210,damping=19,mass=1}={}){
  let x=0,v=0;const dt=1/240,pts=[];let t=0,still=0;
  while(t<3&&still<40){const a=(-stiffness*(x-1)-damping*v)/mass;v+=a*dt;x+=v*dt;t+=dt;pts.push(x);still=Math.abs(x-1)<.002&&Math.abs(v)<.01?still+1:0;}
  const n=Math.min(48,pts.length),out=[];for(let k=0;k<n;k++)out.push(+pts[Math.round(k*(pts.length-1)/(n-1))].toFixed(4));out[n-1]=1;
  const lin=`linear(0,${out.join(',')})`;
  try{if(window.CSS&&CSS.supports('transition-timing-function',lin))return lin;}catch(e){}
  return 'cubic-bezier(.3,1.35,.5,1)';}
const SPRING=springEasing();
document.documentElement.style.setProperty('--spring',SPRING);
const mkStore=pre=>({get(k,d){try{const v=localStorage.getItem(pre+'.'+k);return v?JSON.parse(v):d;}catch(e){return d;}},
  set(k,v){try{localStorage.setItem(pre+'.'+k,JSON.stringify(v));}catch(e){}},del(k){try{localStorage.removeItem(pre+'.'+k);}catch(e){}}});
const fmt=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
let toastT;function toast(t,ms=1800){const el=$('toast');if(!el)return;el.textContent=t;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),ms);}
const KIT={onPane:null,onConfirm:null};
function open(p){$('sheet').hidden=false;document.querySelectorAll('[data-pane]').forEach(s=>s.hidden=s.dataset.pane!==p);if(KIT.onPane)KIT.onPane(p);}
function close(){$('sheet').hidden=true;}
const panelOpen=()=>!$('sheet').hidden;
function askConfirm(title,note,okTxt,fn){$('cfTitle').textContent=title;$('cfNote').textContent=note;$('confirmOk').textContent=okTxt;KIT.onConfirm=fn;open('confirm');}
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',close));
$('confirmOk').addEventListener('click',()=>{close();const f=KIT.onConfirm;KIT.onConfirm=null;if(f)f();});
addEventListener('keydown',e=>{if(e.key==='Escape')close();});
$('helpBtn').onclick=()=>open('help');$('palBtn').onclick=()=>open('colors');$('recBtn').onclick=()=>open('recs');
if(/\/games\/[^/]+\/(index\.html)?$/.test(location.pathname))$('homeBtn').hidden=false;
// pestañas de modo y dificultad (los juegos con kitStart no la llaman: lo hace el kit)
function kitTabs(diffNames,getMode,getDiff,onMode,onDiff){
  $('diffs').innerHTML=diffNames.map((n,i)=>`<button role="tab" data-diff="${i}">${n}</button>`).join('');
  const paint=()=>{document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-selected',b.dataset.mode===getMode()));document.querySelectorAll('[data-diff]').forEach(b=>b.setAttribute('aria-selected',+b.dataset.diff===getDiff()));};
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{b.blur();if(b.dataset.mode!==getMode())onMode(b.dataset.mode);paint();}));
  document.querySelectorAll('[data-diff]').forEach(b=>b.addEventListener('click',()=>{b.blur();if(+b.dataset.diff!==getDiff())onDiff(+b.dataset.diff);paint();}));
  return paint;
}
// reloj que solo corre con la app a la vista y sin paneles abiertos
function kitTimer(tick){let id=null;return {start(){this.stop();id=setInterval(()=>{if(document.hidden||panelOpen())return;tick();},1000);},stop(){clearInterval(id);id=null;},get on(){return !!id;}};}
// azar con semilla (mismo nivel = mismo dibujo) y mezcla sin depender del navegador
function rngOf(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const shuffle=(a,r)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------- 2. Entrada ----------
   Todos los gestos usan Pointer Events (dedo, mouse y lápiz con el mismo código) y capturan el puntero,
   así el gesto sigue aunque el dedo salga del elemento. Las coordenadas se dan relativas al elemento. */
const Input={
  rel(el,e){const r=el.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top,cx:e.clientX,cy:e.clientY};},
  // teclado: {'ArrowLeft':fn, 'z':fn, ...}. No actúa con un panel abierto ni mientras se escribe en un campo.
  keys(map,{repeat=true,always=false}={}){
    const h=e=>{if(!always&&panelOpen())return;if(e.target&&e.target.closest&&e.target.closest('input,textarea,select'))return;
      if(e.ctrlKey||e.metaKey||e.altKey)return;const f=map[e.key]||map[e.key.toLowerCase()]||map[e.code];if(!f||(e.repeat&&!repeat))return;e.preventDefault();f(e);};
    addEventListener('keydown',h);return ()=>removeEventListener('keydown',h);},
  // flechas y WASD → 'up' | 'down' | 'left' | 'right'
  dirKeys(fn,opts){const d=k=>()=>fn(k);return this.keys({ArrowUp:d('up'),ArrowDown:d('down'),ArrowLeft:d('left'),ArrowRight:d('right'),w:d('up'),s:d('down'),a:d('left'),d:d('right')},opts);},
  // tocar y mantener: {tap(e,pt), long(e,pt), ms, move}
  press(el,{tap,long,ms=420,move=12}){let p=null;
    el.addEventListener('pointerdown',e=>{if(e.button>0)return;const pt=Input.rel(el,e);p={pt,long:false,t:long?setTimeout(()=>{p.long=true;long(e,pt);vibe(15);},ms):0};});
    el.addEventListener('pointermove',e=>{if(p&&Math.hypot(e.clientX-p.pt.cx,e.clientY-p.pt.cy)>move){clearTimeout(p.t);p=null;}});
    el.addEventListener('pointerup',e=>{if(!p)return;clearTimeout(p.t);const was=p;p=null;if(!was.long&&tap)tap(e,was.pt);});
    el.addEventListener('pointercancel',()=>{if(p){clearTimeout(p.t);p=null;}});
    el.addEventListener('contextmenu',e=>{if(long)e.preventDefault();});},
  // arrastrar: start(pt,e) devuelve un contexto (o false para ignorar); move(ctx,pt,e) a lo sumo una vez por cuadro;
  // end(ctx,pt,{moved,cancelled}). threshold: píxeles antes de considerar que se movió.
  drag(el,{start,move,end,threshold=4}){let ctx=null,last=null,raf=0,moved=false,s0=null;
    el.addEventListener('pointerdown',e=>{if(e.button>0||ctx)return;const pt=Input.rel(el,e);const c=start(pt,e);if(!c)return;ctx=c;moved=false;s0=pt;el.setPointerCapture(e.pointerId);e.preventDefault();});
    el.addEventListener('pointermove',e=>{if(!ctx)return;last=Input.rel(el,e);if(!moved&&Math.hypot(last.x-s0.x,last.y-s0.y)<threshold)return;moved=true;
      if(!raf)raf=requestAnimationFrame(()=>{raf=0;if(ctx&&move)move(ctx,last,e);});});
    const fin=(e,cancelled)=>{if(!ctx)return;cancelAnimationFrame(raf);raf=0;const c=ctx;ctx=null;const pt=e?Input.rel(el,e):last;if(moved&&move&&!cancelled)move(c,pt,e);if(end)end(c,pt,{moved,cancelled});};
    el.addEventListener('pointerup',e=>fin(e,false));el.addEventListener('pointercancel',e=>fin(e,true));},
  // deslizar: fn(dir, {dx,dy,v}) con dir 'up'|'down'|'left'|'right'. min: distancia mínima en píxeles.
  swipe(el,fn,{min=28}={}){let s=null;
    el.addEventListener('pointerdown',e=>{if(e.button>0)return;s={x:e.clientX,y:e.clientY,t:performance.now()};});
    el.addEventListener('pointerup',e=>{if(!s)return;const dx=e.clientX-s.x,dy=e.clientY-s.y,dt=performance.now()-s.t;s=null;if(Math.max(Math.abs(dx),Math.abs(dy))<min)return;
      fn(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'),{dx,dy,v:Math.hypot(dx,dy)/Math.max(1,dt)});});
    el.addEventListener('pointercancel',()=>{s=null;});},
  // trazar un camino pasando por elementos (como la rueda de letras): hit(pt)→id|null;
  // enter(id,path) al entrar en uno nuevo (volver al anterior lo saca del camino); end(path) al soltar.
  trace(el,{hit,enter,end,back=true}){let path=null;
    const step=pt=>{const id=hit(pt);if(id==null)return;if(back&&path.length>1&&path[path.length-2]===id){path.pop();enter&&enter(null,path);return;}
      if(path.includes(id))return;path.push(id);enter&&enter(id,path);};
    el.addEventListener('pointerdown',e=>{if(e.button>0)return;path=[];el.setPointerCapture(e.pointerId);step(Input.rel(el,e));});
    el.addEventListener('pointermove',e=>{if(path)step(Input.rel(el,e));});
    const fin=()=>{if(!path)return;const p=path;path=null;end&&end(p);};
    el.addEventListener('pointerup',fin);el.addEventListener('pointercancel',fin);}
};

/* ---------- 3. Animación ----------
   Web Animations API: corre en la placa de video cuando se anima transform/opacity.
   Con "reducir movimiento" activado, las animaciones se saltean o se acortan. */
const Anim={
  run(el,frames,opt){if(!el||reduceMotion)return null;return el.animate(frames,{easing:EASE,...opt});},
  pop(el,s=1.15,d=220){return this.run(el,[{transform:'scale(1)'},{transform:`scale(${s})`},{transform:'scale(1)'}],{duration:d});},
  shake(el,px=6){vibe(30);return this.run(el,[{transform:'translateX(0)'},{transform:`translateX(${-px}px)`},{transform:`translateX(${px}px)`},{transform:`translateX(${-px/2}px)`},{transform:'translateX(0)'}],{duration:320});},
  pulse(el,n=3){return this.run(el,[{transform:'scale(1)'},{transform:'scale(1.08)'}],{duration:260,iterations:n*2,direction:'alternate'});},
  fadeIn(el,d=200){return this.run(el,[{opacity:0},{opacity:1}],{duration:d});},
  // mover un elemento desde un rectángulo de pantalla a otro (DOMRect o {left,top})
  fly(el,from,to,d=280){return this.run(el,[{transform:`translate(${from.left-to.left}px,${from.top-to.top}px)`},{transform:'translate(0,0)'}],{duration:d});},
  stagger(els,fn,step=30){[...els].forEach((e,i)=>setTimeout(()=>fn(e,i),reduceMotion?0:i*step));},
  countTo(el,to,d=500){const from=+el.textContent||0;if(reduceMotion||from===to){el.textContent=to;return;}const t0=performance.now();
    const f=t=>{const k=Math.min(1,(t-t0)/d);el.textContent=Math.round(from+(to-from)*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f);};requestAnimationFrame(f);},
  // festejo: papelitos livianos (≈40 elementos) que se borran solos
  celebrate(host=document.body,colors=['#f2c230','#e8483f','#2f7fe0','#2e9e5b','#a77bd6']){if(reduceMotion)return;
    const r=host.getBoundingClientRect(),box=document.createElement('div');box.className='kit-confeti';box.style.cssText=`position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;pointer-events:none;overflow:hidden;z-index:25`;
    document.body.appendChild(box);
    for(let i=0;i<40;i++){const p=document.createElement('i'),x=Math.random()*r.width,w=5+Math.random()*6;
      p.style.cssText=`position:absolute;left:${x}px;top:-12px;width:${w}px;height:${w*1.6}px;background:${colors[i%colors.length]};border-radius:2px`;box.appendChild(p);
      p.animate([{transform:'translate(0,0) rotate(0)'},{transform:`translate(${(Math.random()-.5)*120}px,${r.height+30}px) rotate(${(Math.random()-.5)*900}deg)`}],{duration:1100+Math.random()*900,delay:Math.random()*250,easing:'cubic-bezier(.25,.4,.6,1)',fill:'forwards'});}
    setTimeout(()=>box.remove(),2600);}
};

/* ---------- 4. Bucle ----------
   Loop: requestAnimationFrame que se detiene solo (pantalla oculta, o cuando step devuelve false).
   Redraw: pide un dibujo; varias pedidas en el mismo cuadro se juntan en una sola. */
function Loop(step){let id=0,last=0,on=false;
  const f=t=>{if(!on)return;const dt=last?Math.min(.05,(t-last)/1000):0;last=t;if(step(dt,t)===false){on=false;id=0;return;}id=requestAnimationFrame(f);};
  const api={start(){if(on)return;on=true;last=0;id=requestAnimationFrame(f);},stop(){on=false;cancelAnimationFrame(id);},get on(){return on;}};
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&on){api.stop();api._resume=true;}else if(!document.hidden&&api._resume){api._resume=false;api.start();}});
  return api;}
function Redraw(draw){let q=0;return ()=>{if(!q)q=requestAnimationFrame(()=>{q=0;draw();});};}

/* ---------- 5. Sonido y vibración ----------
   Sonidos sintetizados (sin archivos): cortos, suaves y apagados por defecto.
   La preferencia es de toda la sala: localStorage 'sala.sonido' = '1' | '0'. */
const Sfx={ctx:null,
  get on(){try{return localStorage.getItem('sala.sonido')==='1';}catch(e){return false;}},
  set on(v){try{localStorage.setItem('sala.sonido',v?'1':'0');}catch(e){}},
  P:{tap:[[660,.04,'sine',.05]],place:[[330,.06,'triangle',.08],[495,.05,'triangle',.05]],ok:[[523,.08,'sine',.07],[784,.1,'sine',.06]],
     bad:[[196,.12,'sawtooth',.04]],clear:[[523,.06,'square',.03],[659,.06,'square',.03],[784,.09,'square',.03]],
     win:[[523,.1,'triangle',.07],[659,.1,'triangle',.07],[784,.1,'triangle',.07],[1047,.22,'triangle',.07]],undo:[[440,.05,'sine',.04],[330,.05,'sine',.04]]},
  play(name){if(!this.on)return;const notes=this.P[name];if(!notes)return;try{
    this.ctx=this.ctx||new (window.AudioContext||window.webkitAudioContext)();const c=this.ctx;if(c.state==='suspended')c.resume();let t=c.currentTime;
    for(const [f,d,type,v] of notes){const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);
      o.connect(g).connect(c.destination);o.start(t);o.stop(t+d+.02);t+=d*.8;}
    clearTimeout(this._s);this._s=setTimeout(()=>{if(this.ctx&&this.ctx.state==='running')this.ctx.suspend();},1500);// ahorra batería
  }catch(e){}}
};
function vibe(p){if(navigator.vibrate)try{navigator.vibrate(p);}catch(e){}}

/* ---------- 6. Juego ----------
   kitStart(cfg) arma todo lo común a un juego de niveles. El juego solo describe lo suyo:
   cfg = {
     id:'piramide',                       // prefijo de guardado y marca "en curso" de la sala
     diffs:[{name:'Fácil',par:45,…}],     // dificultades (par: segundos para 3 estrellas en Desafío)
     themes:{clave:{name,fondo:{p:'estrellas',c:['#fff']},…}}, theme:'clave por defecto',   (fondo: ver kit/fondo.js)
     help:'<p>…</p>',
     create(diff,lvl) → estado nuevo del nivel (el kit agrega lvl, undo, secs, won)
     reset(S)          → vuelve el nivel al comienzo (para Reiniciar y Reintentar)
     build()           → arma el tablero (al cargar, cambiar de nivel o de tamaño)
     draw()            → redibuja (debe llamar a paintCommon())
     busy(S)           → true si el jugador ya hizo algo en este nivel
     undo(entrada)     → deshace una entrada que el juego guardó con pushUndo(entrada)
     hint()            → (Libre) da una pista
     applyTheme(clave) → aplica el tema
     preview(clave,t)  → html de la muestra del tema
     info(diff)        → texto corto de la dificultad para Progreso
     end(S,stars)      → {title,big,note} del cartel de fin (opcional)
     limit(diff)       → segundos máximos en Desafío (opcional; si se pasa: "Se acabó el tiempo")
     keys:{tecla:fn}   → atajos de teclado del juego (opcional)
     letras:true       → el juego usa las letras para escribir: Z, R y H dejan de ser atajos (deshacer pasa a Ctrl+Z)
     stars(S)          → estrellas propias en Desafío (1 a 3), en vez de contar el tiempo (opcional)
   Para perder un nivel por algo que no es el tiempo (quedarse sin fichas, sin vidas): lose('título','nota').
   }
   Quedan como variables globales: S (estado), mode, diff, themeKey; y las funciones newLevel, retry, win, lose,
   save, load, applyTheme, pushUndo, paintCommon. */
let S=null,mode='libre',diff=0,themeKey='',GAME=null,store=null,timer=null,paintTabs=null;
function kitStart(cfg){
  GAME=cfg;store=mkStore(cfg.id);
  // fondo animado de cada tema: se arma solo cuando cambia el tema o el tamaño
  const ap=cfg.applyTheme;cfg.applyTheme=k=>{ap(k);Fondo.tema(k);};
  Fondo.iniciar({host:$('stage'),temas:Object.fromEntries(Object.entries(cfg.themes).map(([k,t])=>[k,t.fondo||null]))});
  kitHud();
  $('helpBody').innerHTML=cfg.help+(cfg.letras?`<p class="kbd">Con teclado: ${cfg.keysHelp}; <b>Ctrl+Z</b> deshace y <b>Enter</b> pasa al siguiente nivel.</p>`
    :`<p class="kbd">Con teclado: <b>Z</b> deshace, <b>R</b> reinicia${cfg.hint?', <b>H</b> da una pista':''} y <b>Enter</b> pasa al siguiente nivel${cfg.keysHelp?'. '+cfg.keysHelp:''}.</p>`);
  timer=kitTimer(()=>{if(!S||S.won||S.timeup)return;S.secs++;
    const lim=cfg.limit&&mode==='desafio'?cfg.limit(diff):0;if(lim&&S.secs>=lim){S.secs=lim;S.timeup=true;timer.stop();save();cfg.draw();showEnd();return;}
    const t=$('time');if(t)t.textContent=fmt(lim?lim-S.secs:S.secs);if(S.secs%5===0)save();});
  KIT.onPane=p=>{if(p==='colors')renderThemes();if(p==='recs')renderRecs();};
  $('palList').addEventListener('click',e=>{const b=e.target.closest('[data-pal]');if(!b)return;themeKey=b.dataset.pal;store.set('theme',themeKey);applyTheme();renderThemes();});
  $('act').onclick=()=>{if(!S)return;if(S.won){Sfx.play('tap');newLevel(S.lvl+1);return;}if(S.timeup){retry();return;}kitUndo();};
  $('restart').onclick=()=>{if(!S)return;if(cfg.busy(S)&&!S.won)askConfirm('¿Reiniciar el nivel?','Se borra lo que hiciste en este nivel.','Reiniciar',retry);else retry();};
  $('endSee').onclick=close;$('endNext').onclick=()=>{close();if(S.timeup)retry();else newLevel(S.lvl+1);};
  const hb=$('hintBtn');if(hb)hb.onclick=()=>{if(S&&!S.won&&!S.timeup&&cfg.hint){cfg.hint();Sfx.play('tap');}};
  paintTabs=kitTabs(cfg.diffs.map(d=>d.name),()=>mode,()=>diff,m=>{save();mode=m;store.set('mode',m);load();},d=>{save();diff=d;store.set('diff',d);load();});
  const short=cfg.letras?{}:{z:kitUndo,r:()=>$('restart').click(),h:()=>{if(mode==='libre'&&hb&&!hb.hidden)hb.click();}};
  Input.keys({...short,Enter:()=>{if(S&&(S.won||S.timeup))$('act').click();},...(cfg.keys||{})},{repeat:false});
  // Ctrl/Cmd+Z deshace siempre (Input.keys no mira teclas con Ctrl)
  addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&!e.altKey&&e.key.toLowerCase()==='z'&&!panelOpen()&&!/^(INPUT|TEXTAREA|SELECT)$/.test((e.target&&e.target.tagName)||'')){e.preventDefault();kitUndo();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});addEventListener('pagehide',()=>save());
  let rT;addEventListener('resize',()=>{clearTimeout(rT);rT=setTimeout(()=>{if(S)cfg.build();},80);});
  themeKey=cfg.themes[store.get('theme',cfg.theme)]?store.get('theme',cfg.theme):cfg.theme;
  mode=store.get('mode','libre')==='desafio'?'desafio':'libre';diff=clamp(+store.get('diff',0)||0,0,cfg.diffs.length-1);
  cfg.applyTheme(themeKey);load();
  if(!store.get('seen',false)){store.set('seen',true);open('help');}
}
const SK=()=>mode+'.'+diff;
function newLevel(lvl){kitHud.calma&&kitHud.calma();S=Object.assign(GAME.create(diff,lvl),{lvl,undo:[],secs:0,won:false,timeup:false});save();GAME.build();timer.start();entrada();}
// entrada de cada nivel: el tablero aparece con un resorte corto (el fondo no se mueve)
function entrada(){if(reduceMotion)return;const st=$('stage');if(!st)return;
  [...st.children].filter(e=>!e.classList.contains('fondo')).forEach(e=>e.animate([{opacity:0,transform:'scale(.965)'},{opacity:1,transform:'none'}],{duration:380,easing:SPRING}));}
// el marcador reacciona cuando cambia un número (salvo el reloj)
function kitHud(){const hud=document.querySelector('.hud');if(!hud||!window.MutationObserver)return;const last=new WeakMap();let quiet=0;
  hud.querySelectorAll('b').forEach(b=>last.set(b,b.textContent));
  new MutationObserver(ms=>{const now=performance.now();const seen=new Set();ms.forEach(m=>{const b=m.target.nodeType===3?m.target.parentElement:m.target.closest&&m.target.closest('b');
      if(!b||b.tagName!=='B'||b.id==='time'||seen.has(b))return;seen.add(b);const t=b.textContent;if(last.get(b)!==t){last.set(b,t);if(now>quiet&&!document.hidden)Anim.pop(b);}});})
    .observe(hud,{subtree:true,childList:true,characterData:true});
  kitHud.calma=()=>{quiet=performance.now()+500;};}
function retry(){kitHud.calma&&kitHud.calma();GAME.reset(S);Object.assign(S,{undo:[],secs:0,won:false,timeup:false,rec:false,lost:null});GAME.applyTheme(themeKey);GAME.build();save();timer.start();}
function pushUndo(entry){S.undo.push(entry);if(S.undo.length>300)S.undo.shift();}
function kitUndo(){if(!S||S.won||S.timeup)return;const u=S.undo.pop();if(u===undefined)return;GAME.undo(u);Sfx.play('undo');GAME.draw();save();}
function applyTheme(){GAME.applyTheme(themeKey);if(S)GAME.draw();}
function paintCommon(){
  const lv=$('lvl');if(lv)lv.textContent=S.lvl+1;
  const tb=$('timeBox');if(tb){tb.hidden=mode!=='desafio';const lim=GAME.limit?GAME.limit(diff):0;$('time').textContent=fmt(lim?Math.max(0,lim-S.secs):S.secs);}
  const hb=$('hintBtn');if(hb)hb.hidden=mode!=='libre'||S.won||!GAME.hint;
  const a=$('act');if(!a)return;
  if(S.won){$('actTxt').textContent='Siguiente nivel';a.classList.add('primary');a.disabled=false;}
  else if(S.timeup){$('actTxt').textContent='Reintentar';a.classList.add('primary');a.disabled=false;}
  else{$('actTxt').textContent='Deshacer';a.classList.remove('primary');a.disabled=!S.undo.length;}
}
function win(){
  if(S.won)return;S.won=true;timer.stop();let stars=0;
  if(mode==='desafio'){const par=GAME.diffs[diff].par||120;stars=GAME.stars?clamp(GAME.stars(S)|0,1,3):S.secs<=par?3:S.secs<=par*2?2:1;
    const st=store.get('stars.'+diff,{});if(!st[S.lvl]||stars>st[S.lvl])st[S.lvl]=stars;store.set('stars.'+diff,st);
    const bt=store.get('best',{});if(!bt[diff]||S.secs<bt[diff]){bt[diff]=S.secs;store.set('best',bt);S.rec=true;}}
  S.stars=stars;const pk='prog.'+SK();store.set(pk,Math.max(store.get(pk,0),S.lvl+1));
  const sv=store.get('solved',{});sv[SK()]=(sv[SK()]||0)+1;store.set('solved',sv);
  save();GAME.draw();Sfx.play('win');vibe([20,40,30]);Anim.celebrate($('stage'));
  setTimeout(showEnd,reduceMotion?150:900);
}
function lose(title,note){if(!S||S.won||S.timeup)return;S.timeup=true;S.lost={title,note};timer.stop();save();GAME.draw();Sfx.play('bad');vibe(60);setTimeout(showEnd,reduceMotion?150:700);}
function showEnd(){
  if(S.timeup){const L=S.lost||{};$('endTitle').textContent=L.title||'Se acabó el tiempo';$('endBig').textContent=L.title?'✗':'⏱';$('endNote').textContent=L.note||'Probá de nuevo: el nivel empieza igual.';$('endNext').textContent='Reintentar';open('end');return;}
  const e=GAME.end?GAME.end(S,S.stars):{};
  $('endTitle').textContent=e.title||'¡Nivel resuelto!';
  $('endBig').textContent=mode==='desafio'?'★'.repeat(S.stars)+'☆'.repeat(3-S.stars):(e.big||'✓');
  $('endNote').textContent=mode==='desafio'?`${fmt(S.secs)}${S.rec?' · ¡mejor tiempo en '+GAME.diffs[diff].name+'!':''}`:(e.note||'');
  $('endNext').textContent='Siguiente nivel';open('end');
}
function save(){if(!S)return;const o={};for(const k in S)if(k[0]!=='_')o[k]=S[k];store.set('state.'+SK(),o);
  let busy=false;for(const m of ['libre','desafio'])for(let d=0;d<GAME.diffs.length;d++){const s=store.get('state.'+m+'.'+d,null);if(s&&!s.won&&!s.timeup&&GAME.busy(s))busy=true;}
  try{busy?localStorage.setItem(GAME.id+'.enCurso','1'):localStorage.removeItem(GAME.id+'.enCurso');}catch(e){}}
function load(){kitHud.calma&&kitHud.calma();timer.stop();const s=store.get('state.'+SK(),null);
  if(s&&(!GAME.valid||GAME.valid(s))){S=s;S.undo=S.undo||[];GAME.applyTheme(themeKey);GAME.build();if(!S.won&&!S.timeup)timer.start();}
  else newLevel(store.get('prog.'+SK(),0));
  paintTabs();}
function renderThemes(){$('palList').innerHTML=Object.entries(GAME.themes).map(([k,t])=>`<button class="pal" data-pal="${k}" aria-pressed="${k===themeKey}">${GAME.preview(k,t)}${t.name}</button>`).join('')+
  `<div class="sndrow"><b>Sonido</b><button class="sw" id="sndBtn" role="switch" aria-checked="${Sfx.on}">${Sfx.on?'Sí':'No'}</button></div>`+
  `<div class="sndrow"><b>Fondo animado</b><button class="sw" id="fxBtn" role="switch" aria-checked="${Fondo.activo}">${Fondo.activo?'Sí':'No'}</button></div>`;
  $('sndBtn').onclick=()=>{Sfx.on=!Sfx.on;Sfx.play('ok');renderThemes();};
  $('fxBtn').onclick=()=>{Fondo.activo=!Fondo.activo;Sfx.play('tap');renderThemes();};}
function renderRecs(){const sv=store.get('solved',{}),bt=store.get('best',{});
  $('recList').innerHTML=GAME.diffs.map((d,k)=>{const st=Object.values(store.get('stars.'+k,{})).reduce((a,b)=>a+b,0);
    return `<div><b>${d.name}</b><small>${GAME.info?GAME.info(k):''}</small><small>Libre: ${sv['libre.'+k]||0} resueltos</small><small>Desafío: ${st} ★ · mejor ${bt[k]?fmt(bt[k]):'—'}</small></div>`;}).join('');}

/* ---------- 7. Segundo plano e IA ----------
   kitWorker(fábrica) corre cálculos pesados (IA, búsquedas, verificaciones) en otro hilo, así la pantalla nunca se traba.
   La fábrica es una función SIN nada de afuera que devuelve un objeto con funciones: function MiIA(){ … return {pensar,…}; }
   El mismo código se usa en la página (MiIA()), en segundo plano (kitWorker(MiIA)) y en node para las pruebas.
     const ia=kitWorker(MiIA,{timeout:4000});
     ia.call('pensar',estado).then(jugada=>…)    // los datos viajan copiados (objetos simples, sin funciones ni elementos)
     ia.cancel()                                // corta lo que esté pensando (por ejemplo, al reiniciar)
     ia.enSegundoPlano, ia.ultimo               // si de verdad usa otro hilo, y cuántos ms tardó la última respuesta
   Si el navegador no puede crear el hilo, hace lo mismo en el principal (más lento, pero funciona).
   IA.elegir(opciones,{temp,error},rnd) da dificultad creíble: [{v:'pedir',score:-.1},…] → v.
     temp 0 = siempre la mejor; temp .2–.5 = a veces elige una parecida; error .1 = una de cada diez, cualquiera.
   IA.pensar(promesa,ms) espera al menos ms para que se vea que el rival "piensa", aunque la cuenta sea instantánea. */
function kitWorker(factory,{timeout=4000}={}){
  const src=`const API=(${factory.toString()})();onmessage=e=>{const {id,m,a}=e.data;let r,err;const t0=performance.now();try{r=API[m](...a);}catch(x){err=String(x&&x.message||x);}postMessage({id,r,err,ms:performance.now()-t0});};`;
  let w=null,seq=0,api=null,ok=typeof Worker!=='undefined';const pend=new Map();
  function start(){if(w||!ok)return;try{const url=URL.createObjectURL(new Blob([src],{type:'text/javascript'}));w=new Worker(url);URL.revokeObjectURL(url);
      w.onmessage=e=>{const d=e.data,p=pend.get(d.id);if(!p)return;pend.delete(d.id);clearTimeout(p.to);K.ultimo=d.ms;d.err?p.rej(new Error(d.err)):p.res(d.r);};
      w.onerror=e=>{e.preventDefault&&e.preventDefault();reset('falló el cálculo en segundo plano');ok=false;};}
    catch(e){ok=false;w=null;}}
  function reset(msg){if(w){w.terminate();w=null;}pend.forEach(p=>{clearTimeout(p.to);p.rej(new Error(msg));});pend.clear();}
  const K={ultimo:0,
    call(m,...a){start();
      if(!w){api=api||factory();return new Promise((res,rej)=>setTimeout(()=>{const t0=performance.now();try{res(api[m](...a));K.ultimo=performance.now()-t0;}catch(e){rej(e);}},0));}
      const id=++seq;return new Promise((res,rej)=>{const to=setTimeout(()=>{if(pend.has(id))reset('tardó demasiado');},timeout);pend.set(id,{res,rej,to});w.postMessage({id,m,a});});},
    cancel(){reset('cancelado');},
    get enSegundoPlano(){start();return !!w;}};
  return K;}
const IA={
  elegir(ops,{temp=0,error=0}={},rnd=Math.random){if(!ops.length)return null;const o=ops.slice().sort((a,b)=>b.score-a.score);
    if(error&&rnd()<error)return o[Math.floor(rnd()*o.length)].v;if(!temp)return o[0].v;
    const m=o[0].score,w=o.map(x=>Math.exp((x.score-m)/temp)),tot=w.reduce((a,b)=>a+b,0);let x=rnd()*tot;
    for(let k=0;k<w.length;k++){x-=w[k];if(x<=0)return o[k].v;}return o[0].v;},
  pensar(p,ms=450){return Promise.all([p,new Promise(r=>setTimeout(r,reduceMotion?0:ms))]).then(([v])=>v);}
};
