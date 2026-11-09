// Uso: node dev/herramientas/medir_animacion.js   (necesita npm install en dev/, o SALA_MODULOS con otra carpeta node_modules)
// Misma escena (20 motas que suben y titilan, 390×520) hecha de 4 formas; mide el hilo principal con CDP
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const L=[path.join(__dirname,'..','node_modules'),process.env.SALA_MODULOS||''].find(d=>d&&fs.existsSync(path.join(d,'gsap')))+'/';
const KIT=path.join(__dirname,'..','kit')+'/';
(async()=>{const b=await chromium.launch();const res={};
for(const modo of ['css','motion','gsap','canvas']){const p=await b.newPage({viewport:{width:390,height:520}});
  await p.setContent(`<html><head><style>${fs.readFileSync(KIT+'fondo.css','utf8')}body{margin:0}#h{position:relative;width:390px;height:520px;background:#123}</style></head><body><div id="h"></div></body></html>`);
  await p.addScriptTag({content:fs.readFileSync(KIT+'fondo.js','utf8')});
  if(modo==='motion')await p.addScriptTag({path:L+'motion/dist/motion.js'});
  if(modo==='gsap')await p.addScriptTag({path:L+'gsap/dist/gsap.min.js'});
  await p.evaluate(modo=>{const h=document.getElementById('h'),W=390,H=520,N=20,r=()=>Math.random();
    if(modo==='css'){Fondo.iniciar({host:h,temas:{x:{p:[['polvo',['#fff']]]}}});Fondo.tema('x');return;}
    if(modo==='canvas'){const c=document.createElement('canvas');c.width=W*2;c.height=H*2;c.style.cssText='width:390px;height:520px';h.appendChild(c);const g=c.getContext('2d');g.scale(2,2);
      const P=Array.from({length:N},()=>({x:r()*W,y:r()*H,s:3+r()*7,v:H/(20+r()*22),ph:r()*6}));let t0=performance.now();
      (function f(t){const dt=(t-t0)/1000;t0=t;g.clearRect(0,0,W,H);for(const q of P){q.y-=q.v*dt;if(q.y<-10)q.y=H+10;const a=.3+.3*Math.sin(t/700+q.ph);
        const gr=g.createRadialGradient(q.x,q.y,0,q.x,q.y,q.s/2);gr.addColorStop(0,`rgba(255,255,255,${a})`);gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(q.x,q.y,q.s/2,0,7);g.fill();}requestAnimationFrame(f);})(t0);return;}
    for(let k=0;k<N;k++){const e=document.createElement('i');const s=3+r()*7;e.style.cssText=`position:absolute;left:${r()*W}px;top:${H}px;width:${s}px;height:${s}px;border-radius:50%;background:radial-gradient(circle,#fff 0 30%,transparent 70%)`;h.appendChild(e);
      const d=20+r()*22;
      if(modo==='motion'){Motion.animate(e,{transform:['translateY(0px)',`translateY(${-H-20}px)`]},{duration:d,repeat:Infinity,ease:'linear'});Motion.animate(e,{opacity:[.15,.7]},{duration:3+r()*3,repeat:Infinity,repeatType:'reverse'});}
      else{gsap.fromTo(e,{y:0},{y:-H-20,duration:d,repeat:-1,ease:'none'});gsap.fromTo(e,{opacity:.15},{opacity:.7,duration:3+r()*3,repeat:-1,yoyo:true});}}},modo);
  await p.waitForTimeout(1200);const cdp=await p.context().newCDPSession(p);await cdp.send('Performance.enable');
  const m=async()=>{const x=await cdp.send('Performance.getMetrics');return Object.fromEntries(x.metrics.map(q=>[q.name,q.value]));};
  const a=await m();await p.waitForTimeout(5000);const z=await m();
  res[modo]={cpu:+((z.TaskDuration-a.TaskDuration)/5*100).toFixed(2),script:+((z.ScriptDuration-a.ScriptDuration)/5*100).toFixed(2),layout:+((z.LayoutDuration-a.LayoutDuration)/5*100).toFixed(2),style:+((z.RecalcStyleDuration-a.RecalcStyleDuration)/5*100).toFixed(2)};
  await p.close();}
const N={css:'CSS / WAAPI (kit: Fondo, Anim)',motion:'Motion (WAAPI)',gsap:'GSAP (cuadro a cuadro)',canvas:'Lienzo <canvas> cuadro a cuadro'};
console.log('Procesador principal con 20 motas animadas (menos es mejor para la batería):');for(const [k,v] of Object.entries(res))console.log(`  ${N[k].padEnd(34)} ${v.cpu.toFixed(2)} %`);await b.close();})();
