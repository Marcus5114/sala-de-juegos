/* ---------- Fondos animados ----------
   Fondo.iniciar({host, temas}) y después Fondo.tema(clave) cada vez que cambia el tema.
     temas: {clave:{p:'estrellas+polvo', c:['#fff','#9ad'], bg:'linear-gradient(…)'}}   (bg es opcional: tiñe el área)
   Fondos disponibles: polvo, estrellas, burbujas, hojas, nieve, garabatos, destellos, ondas, nubes, engranajes, chispas, luz, grilla.
   Todo se mueve con transform y opacity (lo anima la placa de video). La capa se arma de nuevo solo si cambia el tema o el tamaño.
   Se queda quieta (se ve, pero no se mueve) si: el teléfono pide reducir el movimiento, la persona apagó "Fondo animado"
   (vale para toda la sala: sala.fondos) o la batería está por debajo del 20 % sin cargar.
   No depende del resto del kit: también lo usan los juegos que no son kitStart. */
const Fondo=(()=>{
  let host=null,temas={},clave='',hecho='',lowBat=false,lay=null;
  const rm=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pref=()=>{try{return localStorage.getItem('sala.fondos')!=='0';}catch(e){return true;}};
  const activo=()=>pref()&&!lowBat&&!rm();
  const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  const hash=s=>{let h=7;for(const ch of s)h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;};
  const cnt=(W,H,per,min,max)=>Math.max(min,Math.min(max,Math.round(W*H/per)));
  const f=(x,d=1)=>x.toFixed(d);
  const pick=(c,k)=>c[k%c.length];
  const svgURL=x=>`url('data:image/svg+xml,${encodeURIComponent(x)}')`;
  // un viajero: recorre (va) y adentro algo que se balancea, gira o titila
  const viaje=(anim,x,y,sz,d,dl,extra,inner)=>`<i class="va" style="left:${f(x)}px;top:${f(y)}px;width:${f(sz)}px;height:${f(sz)}px;--anim:${anim} ${f(d)}s;--dl:-${f(dl)}s;${extra}">${inner}</i>`;
  const ESTRELLA4='<svg viewBox="0 0 10 10"><path d="M5 0Q5.7 4.3 10 5Q5.7 5.7 5 10Q4.3 5.7 0 5Q4.3 4.3 5 0z" fill="currentColor"/></svg>';
  const HOJAS=['M12 1l2.2 4.6 3.6-1.4-1.1 4.4 4.7.6-3.4 3.3 2.4 3.4-5.3-.9-.6 5.4H11.5l-.6-5.4-5.3.9 2.4-3.4L4.6 9.2l4.7-.6-1.1-4.4 3.6 1.4z M12 15v8',
    'M12 2C19 6 20 14 12 22 4 14 5 6 12 2z M12 5v17','M12 2c2 2 5 2 5 5s3 3 1 6 1 4-2 5-2 3-4 3-2-2-4-3-4-2-2-5 1-3 1-6 3-3 5-5z M12 4v19'];
  const circ=(cx,cy,r,a0=0,a1=6.283,n=20)=>Array.from({length:n+1},(_,i)=>{const a=a0+(a1-a0)*i/n;return [cx+r*Math.cos(a),cy+r*Math.sin(a)];});
  const GARABATOS=[
    ()=>[Array.from({length:11},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=i%2?20:46;return [50+r*Math.cos(a),52+r*Math.sin(a)];})],
    ()=>[Array.from({length:50},(_,i)=>{const a=i*.32,r=3+i*.8;return [50+r*Math.cos(a),50+r*Math.sin(a)];})],
    ()=>[[[50,86],[18,54],[12,34],[22,18],[38,16],[50,30],[62,16],[78,18],[88,34],[82,54],[50,86]]],
    ()=>[[[8,70],[26,48],[46,40],[66,42],[86,30]],[[72,22],[88,29],[78,44]]],
    ()=>[Array.from({length:30},(_,i)=>[6+i*3,50+18*Math.sin(i*.75)])],
    ()=>[circ(50,50,40),[[34,38],[36,42]],[[64,38],[66,42]],circ(50,52,22,.5,2.64,10)],
    ()=>[circ(50,50,18),...Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return [[50+26*Math.cos(a),50+26*Math.sin(a)],[50+40*Math.cos(a),50+40*Math.sin(a)]];})],
    ()=>[[[16,86],[16,46],[50,16],[84,46],[84,86],[16,86]],[[42,86],[42,62],[58,62],[58,86]]],
    ()=>[[[20,70],[30,40],[50,30],[64,38],[78,30],[90,44],[86,62],[70,72],[20,70]]],
    ()=>[[[58,4],[30,52],[50,52],[38,96],[76,40],[56,40],[72,4],[58,4]]],
    ()=>[circ(50,50,10),...Array.from({length:5},(_,i)=>{const a=i*1.2566-1.57;return circ(50+24*Math.cos(a),50+24*Math.sin(a),13,0,6.283,12);})],
    ()=>[[[12,52],[38,80],[90,14]]],()=>[[[20,20],[80,80]],[[80,20],[20,80]]],()=>[[[50,10],[90,86],[10,86],[50,10]]],
    ()=>[[[10,40],[26,26],[42,40],[58,26],[74,40],[90,26]],[[10,70],[26,56],[42,70],[58,56],[74,70],[90,56]]],
    ()=>[[[20,30],[30,14],[50,10],[64,20],[62,38],[48,50],[48,64]],[[48,84],[48,88]]]];
  function garabato(fn,r,col,w){const parts=fn();let paths='';
    for(let v=0;v<3;v++)paths+=`<path d="${parts.map(pts=>pts.map(([x,y],i)=>(i?'L':'M')+f(x+(r()-.5)*3.2)+' '+f(y+(r()-.5)*3.2)).join('')).join('')}"/>`;
    return `<svg viewBox="0 0 100 100" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;}
  function engrane(dientes,col){const R=50,r=40,h=8;let d='';
    for(let k=0;k<dientes;k++){const a=k*2*Math.PI/dientes,w=Math.PI/dientes*.55;
      [[a-w*1.2,r],[a-w,R],[a+w,R],[a+w*1.2,r]].forEach(([ang,rad],j)=>{d+=(k||j?'L':'M')+f(50+rad*Math.cos(ang))+' '+f(50+rad*Math.sin(ang));});}
    return `<svg viewBox="0 0 100 100"><path d="${d}Z M${50+h*2} 50a${h*2} ${h*2} 0 1 0 -${h*4} 0a${h*2} ${h*2} 0 1 0 ${h*4} 0z" fill="${col}" fill-rule="evenodd"/></svg>`;}
  const P={
    // motas que suben despacio y titilan (polvo en la luz)
    polvo(r,W,H,c){let h='';const N=cnt(W,H,9000,8,22);
      for(let k=0;k<N;k++){const sz=3+r()*7,d=20+r()*22;
        h+=viaje('fSube',r()*W,H+sz,sz,d,r()*d,`--h:${f(H+3*sz,0)}px;--dx:${f((r()-.5)*70,0)}px`,
          `<i class="ti" style="border-radius:50%;background:radial-gradient(circle,${pick(c,k)} 0 30%,transparent 70%);--o0:${f(.1+r()*.15,2)};--o1:${f(.45+r()*.35,2)};--f:${f(2.5+r()*3)}s;--dl:-${f(r()*4)}s"></i>`);}
      return h;},
    // estrellas que titilan, alguna grande y una fugaz de vez en cuando
    estrellas(r,W,H,c){let h='';const N=cnt(W,H,5200,14,42);
      for(let k=0;k<N;k++){const big=r()<.12,sz=big?8+r()*5:1.5+r()*2.2;
        const st=`left:${f(r()*W)}px;top:${f(r()*H)}px;width:${f(sz)}px;height:${f(sz)}px;color:${pick(c,k)};--o0:${f(.1+r()*.2,2)};--o1:${f(.55+r()*.4,2)};--f:${f(1.8+r()*3.5)}s;--dl:-${f(r()*4)}s`;
        h+=big?`<i class="ti" style="${st};position:absolute">${ESTRELLA4}</i>`:`<i class="ti" style="${st};position:absolute;border-radius:50%;background:currentColor;box-shadow:0 0 4px currentColor"></i>`;}
      for(let k=0;k<2;k++){const d=9+r()*7,len=60+r()*50;
        h+=`<i class="fz" style="left:${f(W*(.15+r()*.6))}px;top:${f(H*(.05+r()*.35))}px;width:${f(len)}px;height:1.5px;background:linear-gradient(90deg,transparent,${pick(c,k)});--a:${f(18+r()*20)}deg;--dx:${f(W*.35)}px;--dy:${f(H*.22)}px;--d:${f(d)}s;--dl:-${f(r()*d)}s;--o1:.85"></i>`;}
      return h;},
    // burbujas transparentes que suben con reflejos de colores en el borde
    burbujas(r,W,H,c){let h='';const N=cnt(W,H,14000,6,16);
      for(let k=0;k<N;k++){const sz=8+r()*22,d=14+r()*14,col=pick(c,k);
        h+=viaje('fSube',r()*W,H+sz,sz,d,r()*d,`--h:${f(H+3*sz,0)}px;--dx:${f((r()-.5)*40,0)}px`,
          `<i class="bal" style="border-radius:50%;border:1.2px solid ${col};opacity:.55;background:radial-gradient(circle at 32% 30%,rgba(255,255,255,.7) 0 10%,transparent 16%),radial-gradient(circle,transparent 58%,${col} 100%);box-shadow:inset 2px -2px 3px rgba(255,120,200,.35),inset -2px 2px 3px rgba(120,230,255,.4);--sw:${f(4+r()*8,0)}px;--f:${f(2+r()*2)}s;--dl:-${f(r()*3)}s"></i>`);}
      return h;},
    // hojas que caen balanceándose; alguna con viento, girando
    hojas(r,W,H,c){let h='';const N=cnt(W,H,15000,6,14);
      for(let k=0;k<N;k++){const wind=k%4===3,sz=14+r()*18,d=(wind?10:15)+r()*10;
        const x=wind?-W*.25+r()*W*.5:r()*W,dx=wind?W*(.5+r()*.4):(r()-.5)*W*.3;
        const leaf=`<svg viewBox="0 0 24 24"><path d="${HOJAS[k%3]}" fill="${pick(c,k)}" stroke="rgba(60,30,10,.4)" stroke-width=".8"/></svg>`;
        h+=viaje('fBaja',x,-sz*2,sz,d,r()*d,`--h:${f(H+4*sz,0)}px;--dx:${f(dx,0)}px;opacity:${f(.45+r()*.3,2)}`,
          wind?`<i class="gi" style="--a:${(r()*360)|0}deg;--f:${f(2+r()*2)}s">${leaf}</i>`:`<i class="bal" style="--a:${(r()*360)|0}deg;--s:${((r()<.5?-1:1)*(40+r()*50))|0}deg;--sw:14px;--f:${f(1.6+r()*2)}s;--dl:-${f(r()*2)}s">${leaf}</i>`);}
      return h;},
    nieve(r,W,H,c){let h='';const N=cnt(W,H,6500,12,34);
      for(let k=0;k<N;k++){const big=r()<.15,sz=big?9+r()*6:2+r()*3.5,d=12+r()*14;
        const inner=big?`<i class="gi" style="--f:${f(6+r()*6)}s;color:${pick(c,k)};opacity:.7"><svg viewBox="0 0 20 20"><g stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M10 1v18M2.2 5.5l15.6 9M2.2 14.5l15.6-9"/></g></svg></i>`
          :`<i class="bal" style="border-radius:50%;background:${pick(c,k)};opacity:${f(.45+r()*.4,2)};--sw:${f(6+r()*10,0)}px;--f:${f(2+r()*2)}s;--dl:-${f(r()*2)}s"></i>`;
        h+=viaje('fBaja',r()*W,-sz*2,sz,d,r()*d,`--h:${f(H+4*sz,0)}px;--dx:${f((r()-.5)*40,0)}px`,inner);}
      return h;},
    // garabatos de cuaderno o tiza que "hierven" (tres versiones del trazo que se turnan)
    garabatos(r,W,H,c){let h='';const cols=Math.max(2,Math.round(W/120)),rows=Math.max(3,Math.round(H/120));
      const ord=GARABATOS.map((_,i)=>i).sort(()=>r()-.5);
      for(let k=0;k<cols*rows;k++){if(r()<.25)continue;const sz=28+r()*30,cw=W/cols,ch=H/rows;
        h+=`<i class="doodle" style="left:${f((k%cols)*cw+r()*(cw-sz))}px;top:${f(Math.floor(k/cols)*ch+r()*(ch-sz))}px;width:${f(sz)}px;height:${f(sz)}px;transform:rotate(${((r()-.5)*40)|0}deg)">${garabato(GARABATOS[ord[k%GARABATOS.length]],r,pick(c,k),2.6)}</i>`;}
      return h;},
    // destellos de cuatro puntas que aparecen y se apagan
    destellos(r,W,H,c){let h='';const N=cnt(W,H,11000,6,18);
      for(let k=0;k<N;k++){const sz=6+r()*12,d=3+r()*4;
        h+=`<i class="br" style="left:${f(r()*W)}px;top:${f(r()*H)}px;width:${f(sz)}px;height:${f(sz)}px;color:${pick(c,k)};--d:${f(d)}s;--dl:-${f(r()*d)}s;--o1:${f(.5+r()*.4,2)}">${ESTRELLA4}</i>`;}
      return h;},
    // reflejos de agua: dos redes de ondas que se cruzan
    ondas(r,W,H,c){const a=c[0]||'#fff',b=c[1]||a;
      const t1=svgURL(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="48"><g fill="none" stroke="${a}" stroke-linecap="round"><path d="M0 24C20 8 40 8 60 24S100 40 120 24" stroke-opacity=".12" stroke-width="2.5"/><path d="M0 24C20 8 40 8 60 24S100 40 120 24" stroke-opacity=".05" stroke-width="8"/></g></svg>`);
      const t2=svgURL(`<svg xmlns="http://www.w3.org/2000/svg" width="90" height="70"><g fill="none" stroke="${b}" stroke-linecap="round"><path d="M0 35C15 20 30 20 45 35S75 50 90 35" stroke-opacity=".09" stroke-width="2"/></g></svg>`);
      return `<i class="mar" style="background-image:${t1};left:-120px;top:-48px;width:${W+120}px;height:${H+48}px;--tx:120px;--ty:48px;--d:28s"></i>`+
        `<i class="mar" style="background-image:${t2};left:-90px;top:-70px;width:${W+90}px;height:${H+70}px;--tx:-90px;--ty:70px;--d:21s"></i>`;},
    // nubes blandas que cruzan muy despacio
    nubes(r,W,H,c){let h='';const N=Math.max(3,Math.min(6,Math.round(H/150)));
      for(let k=0;k<N;k++){const w=90+r()*110,d=60+r()*50;
        h+=`<i class="va" style="left:${f(-w)}px;top:${f(H*(k+.2)/N)}px;width:${f(w)}px;height:${f(w*.45)}px;--anim:fCruza ${f(d)}s;--dl:-${f(r()*d)}s;--w:${f(W+w*2,0)}px;opacity:${f(.18+r()*.14,2)}">
          <svg viewBox="0 0 100 45"><path d="M14 40C4 40 2 28 12 25 10 14 26 10 32 18 36 4 60 2 64 18 72 10 88 14 86 26 98 27 98 40 86 40Z" fill="${pick(c,k)}"/></svg></i>`;}
      return h;},
    // engranajes grandes y tenues que giran lento (uno sí, uno no al revés, como si engranaran)
    engranajes(r,W,H,c){let h='';const spots=[[-.12,-.06],[.78,.1],[.05,.62],[.72,.78],[.4,.32]];
      spots.slice(0,W*H>160000?5:4).forEach(([x,y],k)=>{const sz=Math.min(W,H)*(.32+r()*.25),d=60+r()*50;
        h+=`<i class="rot${k%2?' inv':''}" style="left:${f(W*x)}px;top:${f(H*y)}px;width:${f(sz)}px;height:${f(sz)}px;--d:${f(d)}s">${engrane(10+((r()*8)|0),pick(c,k))}</i>`;});
      return h;},
    // chispas que suben rápido y se apagan
    chispas(r,W,H,c){let h='';const N=cnt(W,H,10000,8,22);
      for(let k=0;k<N;k++){const sz=2+r()*3,d=6+r()*6;
        h+=viaje('fSube',W*(.1+r()*.8),H+sz,sz,d,r()*d,`--h:${f(H*(.5+r()*.6),0)}px;--dx:${f((r()-.5)*80,0)}px`,
          `<i class="ti" style="border-radius:50%;background:${pick(c,k)};box-shadow:0 0 6px ${pick(c,k)};--o0:0;--o1:.9;--f:${f(.4+r()*.8)}s;--dl:-${f(r())}s"></i>`);}
      return h;},
    // una franja de luz que barre la superficie cada tanto
    luz(r,W,H,c){const w=Math.max(W,H)*.35,d=12+r()*6;
      return `<i class="barre" style="left:0;top:${f(-H*.5)}px;width:${f(w)}px;height:${f(H*2)}px;background:linear-gradient(90deg,transparent,${c[0]||'rgba(255,255,255,.08)'},transparent);--x0:${f(-w*1.6)}px;--x1:${f(W+w)}px;--d:${f(d)}s;--dl:-${f(r()*d)}s"></i>`;},
    // cuadrícula tenue con una línea que la recorre y nodos que se encienden
    grilla(r,W,H,c){const col=c[0]||'rgba(255,255,255,.12)';let h=`<i style="inset:0;opacity:.35;background-image:linear-gradient(${col} 1px,transparent 1px),linear-gradient(90deg,${col} 1px,transparent 1px);background-size:24px 24px"></i>`;
      h+=`<i class="va" style="left:0;top:-6px;width:${W}px;height:6px;--anim:fBaja 9s;--h:${H+12}px;background:linear-gradient(transparent,${c[1]||col},transparent);opacity:.5"></i>`;
      const N=cnt(W,H,16000,5,14);for(let k=0;k<N;k++){const x=Math.round(r()*W/24)*24,y=Math.round(r()*H/24)*24;
        h+=`<i class="ti" style="left:${x-3}px;top:${y-3}px;width:6px;height:6px;border-radius:50%;background:${c[1]||col};box-shadow:0 0 6px ${c[1]||col};--o0:0;--o1:.8;--f:${f(1.5+r()*2.5)}s;--dl:-${f(r()*3)}s"></i>`;}
      return h;}
  };
  function capa(){let el=host.querySelector(':scope>.fondo');if(!el&&lay){host.prepend(lay);el=lay;}if(!el){el=document.createElement('div');el.className='fondo';el.setAttribute('aria-hidden','true');host.prepend(el);}lay=el;return el;}
  function armar(forzar){if(!host)return;const t=temas[clave],W=host.clientWidth,H=host.clientHeight;if(!W||!H)return;
    const k=clave+'|'+Math.round(W/40)+'x'+Math.round(H/40);if(!forzar&&k===hecho){quieto();return;}hecho=k;
    host.classList.add('fondo-host');const el=capa();el.style.background=t&&t.bg||'';
    // con tinte propio y sin esquinas redondeadas en el anfitrión, la capa las pone
    el.style.borderRadius=t&&t.bg&&getComputedStyle(host).borderTopLeftRadius==='0px'?'18px':'';
    if(!t||!t.p){el.innerHTML='';return;}
    // capas: [[fondo, colores, opacidad], …] o 'estrellas+polvo' con t.c
    const capas=Array.isArray(t.p)?t.p:t.p.split('+').map(x=>[x,t.c]);
    const r=rng(hash(clave+JSON.stringify(capas)));
    el.innerHTML=capas.map(([p,c,o])=>P[p]?`<b style="inset:0${o!=null&&o!==1?';opacity:'+o:''}">${P[p](r,W,H,c||['rgba(255,255,255,.6)'])}</b>`:'').join('');quieto();}
  function quieto(){const el=host&&host.querySelector(':scope>.fondo');if(el)el.classList.toggle('quieto',!activo());}
  let rT=0;
  const api={
    iniciar({host:h,temas:t}){host=typeof h==='string'?document.querySelector(h):h;temas=t||{};if(!host)return;host.classList.add('fondo-host');
      if(getComputedStyle(host).position==='static')host.style.position='relative';
      if(window.ResizeObserver)new ResizeObserver(()=>{clearTimeout(rT);rT=setTimeout(()=>armar(),200);}).observe(host);
      try{navigator.getBattery&&navigator.getBattery().then(b=>{const u=()=>{lowBat=b.level<.2&&!b.charging;quieto();};b.addEventListener('levelchange',u);b.addEventListener('chargingchange',u);u();}).catch(()=>{});}catch(e){}
      matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change',quieto);
      addEventListener('storage',e=>{if(e.key==='sala.fondos')quieto();});},
    tema(k){clave=k;if(host)host.classList.add('fondo-host');armar();},
    rehacer(){armar(true);},
    get activo(){return activo();},
    set activo(v){try{localStorage.setItem('sala.fondos',v?'1':'0');}catch(e){}quieto();},
    // pinta capas en cualquier elemento (no reemplaza al fondo principal): Fondo.pintar(el,[['nieve',['#fff']]],{semilla:3})
    pintar(el,capas,{semilla=1}={}){const W=el.clientWidth,H=el.clientHeight,r=rng(semilla);el.classList.add('fondo-host');
      let lay=el.querySelector(':scope>.fondo');if(!lay){lay=document.createElement('div');lay.className='fondo';lay.setAttribute('aria-hidden','true');el.prepend(lay);}
      lay.innerHTML=capas.map(([p,c,o])=>P[p]?`<b style="inset:0${o!=null&&o!==1?';opacity:'+o:''}">${P[p](r,W,H,c||['rgba(255,255,255,.6)'])}</b>`:'').join('');lay.classList.toggle('quieto',!activo());return lay;},
    get presets(){return Object.keys(P);},
    get clave(){return clave;}
  };
  return api;
})();
