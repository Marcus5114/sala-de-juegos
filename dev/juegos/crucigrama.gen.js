// En el juego, rngOf y shuffle vienen del kit y BANCO de los datos que inserta armar.py; acá se definen para usar el generador desde node.
const shuffle=(a,r)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function rngOf(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
/*GEN*/
/* ---------- Crucigrama: generador de autodefinidos ----------
   Cada palabra tiene su casilla de pista justo antes: a la izquierda si va → y arriba si va ↓ (una casilla puede tener las dos).
   Reglas: las palabras se cruzan solo en letras iguales; ninguna letra nueva toca a otra de costado (así no se forman
   palabras sin pista); la casilla después de cada palabra queda sin letra. Mismo nivel = mismo tablero en cualquier navegador.
   Dificultad: tamaño, cantidad de palabras, qué tan difíciles son las palabras y pistas, y cuántas letras vienen puestas. */
const CDIFFS=[
  {name:'Fácil',  W:7, H:8, words:[6,8],  tiers:[1],     len:[3,6],  give:.30,par:150,short:0},
  {name:'Media',  W:9, H:10,words:[10,12],tiers:[1,2],   len:[3,8],  give:.15,par:300,short:0},
  {name:'Difícil',W:10,H:11,words:[10,12],tiers:[2,3],   len:[4,10], give:.06,par:480,short:2.5},
  {name:'Experto',W:11,H:12,words:[11,13],tiers:[3,2],   len:[4,11], give:0,  par:720,short:3.5}
];
// BANCO: [{w:'PALABRA',c:'pista',n:1..3}] agrupado por palabra → {w, pistas:[{c,n}], n: nivel más bajo}
let _words=null;
function bankWords(){if(_words)return _words;const m=new Map();
  for(const e of BANCO){let x=m.get(e.w);if(!x){x={w:e.w,p:[],n:e.n};m.set(e.w,x);}x.p.push({c:e.c,n:e.n});x.n=Math.min(x.n,e.n);}
  _words=[...m.values()];return _words;}

function genCross(d,lvl){
  const D=CDIFFS[d],base=(d+1)*1000003+lvl*7919;let best=null;
  for(let t=0;t<6;t++){const g=tryGen(D,rngOf(base+t*104729));if(g&&(!best||score(g)>score(best)))best=g;if(best&&best.words.length>=D.words[0]&&density(best)>=.45)break;}
  return finish(best,D,rngOf(base+77));
}
const density=g=>g.letters/(g.W*g.H),score=g=>g.words.length*2+density(g)*10;

function tryGen(D,rnd){
  const W=D.W,H=D.H,L=Array(W*H).fill(''),C=Array(W*H).fill(null);// L: letra; C: casilla de pista {a:idx,d:idx}
  const own=Array(W*H).fill(0);// bits: 1 = parte de palabra →, 2 = parte de palabra ↓
  const words=[];const used=new Set();
  const pref=D.tiers[0];
  let pool=bankWords().filter(x=>D.tiers.includes(x.n)||x.p.some(p=>D.tiers.includes(p.n))).filter(x=>x.w.length>=D.len[0]&&x.w.length<=D.len[1]);
  pool=shuffle(pool.slice(),rnd);
  // el nivel más fácil de la lista primero (la mayoría de las palabras)
  pool.sort((a,b)=>(a.n===pref?0:1)-(b.n===pref?0:1));
  const at=(r,c)=>r>=0&&c>=0&&r<H&&c<W?r*W+c:-1;
  function check(w,r,c,dir){
    const dr=dir,dc=1-dir,n=w.length;
    const cb=at(r-dr,c-dc);if(cb<0||L[cb]||(C[cb]&&C[cb][dir?'d':'a']!=null))return -1;
    const ca=at(r+dr*n,c+dc*n);if(ca>=0&&L[ca])return -1;
    let cross=0;
    for(let k=0;k<n;k++){const i=at(r+dr*k,c+dc*k);if(i<0||C[i])return -1;
      if(L[i]){if(L[i]!==w[k]||(own[i]&(dir?2:1)))return -1;cross++;continue;}
      // sin vecinos de costado (si no, se formarían palabras sin pista)
      const s1=at(r+dr*k+dc,c+dc*k+dr),s2=at(r+dr*k-dc,c+dc*k-dr);if((s1>=0&&L[s1])||(s2>=0&&L[s2]))return -1;}
    return cross;}
  function place(x,w,r,c,dir){const dr=dir,dc=1-dir,cb=at(r-dr,c-dc);
    C[cb]=C[cb]||{a:null,d:null};C[cb][dir?'d':'a']=words.length;
    for(let k=0;k<w.length;k++){const i=at(r+dr*k,c+dc*k);L[i]=w[k];own[i]|=dir?2:1;}
    words.push({x,w,r,c,dir,cr:Math.floor(cb/W),cc:cb%W});used.add(w);}
  // primera palabra: → arriba a la izquierda, larga
  const longs=pool.filter(x=>x.w.length>=Math.max(5,Math.min(D.len[1],W-1)-4)&&x.w.length<=W-1&&x.n===pref);const first=longs.length?longs[Math.floor(rnd()*longs.length)]:pool.find(x=>x.w.length<=W-1);
  const r0=Math.floor(rnd()*2)+1;place(first,first.w,r0,1,0);
  const target=D.words[0]+Math.floor(rnd()*(D.words[1]-D.words[0]+1));
  let fails=0;
  while(words.length<target&&fails<3){
    let bestP=null,tried=0;
    for(const x of pool){if(used.has(x.w))continue;if(++tried>200)break;const w=x.w;
      for(let i=0;i<W*H;i++){if(!L[i])continue;const r=Math.floor(i/W),c=i%W;
        for(let k=0;k<w.length;k++){if(w[k]!==L[i])continue;
          for(const dir of [0,1]){const sr=r-dir*k,sc=c-(1-dir)*k;const cr=check(w,sr,sc,dir);if(cr<1)continue;
            // puntaje: más cruces, palabras más largas y bien repartidas (cerca de lo vacío), un poco de azar
            const s=cr*6+w.length*1.2+(x.n===pref?2:0)-(w.length<5?D.short:0)+rnd()*3-Math.abs(sr+(dir?w.length/2:0)-H/2)*.25-Math.abs(sc+(dir?0:w.length/2)-W/2)*.25;
            if(!bestP||s>bestP.s)bestP={s,x,w,r:sr,c:sc,dir};}}}
      if(bestP&&tried>45)break;}
    if(bestP){place(bestP.x,bestP.w,bestP.r,bestP.c,bestP.dir);fails=0;}else{fails++;pool=shuffle(pool,rnd);}
  }
  return {W,H,L,C,words,letters:L.filter(Boolean).length};
}

function finish(g,D,rnd){
  // recortar a lo que se usa (letras y pistas)
  const {W,H}=g;let r0=H,r1=-1,c0=W,c1=-1;
  for(let i=0;i<W*H;i++)if(g.L[i]||g.C[i]){const r=Math.floor(i/W),c=i%W;r0=Math.min(r0,r);r1=Math.max(r1,r);c0=Math.min(c0,c);c1=Math.max(c1,c);}
  const w=c1-c0+1,h=r1-r0+1,sol=Array(w*h).fill(''),clue=Array(w*h).fill(null);
  for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const i=r*W+c,j=(r-r0)*w+(c-c0);sol[j]=g.L[i];if(g.C[i])clue[j]=1;}
  const words=g.words.map(o=>{
    const ok=o.x.p.filter(p=>D.tiers.includes(p.n));const P=ok.length?ok:o.x.p;// pista del nivel que corresponde
    return {ans:o.w,clue:P[Math.floor(rnd()*P.length)].c,r:o.r-r0,c:o.c-c0,dir:o.dir,cr:o.cr-r0,cc:o.cc-c0};});
  // orden de lectura: por casilla de pista, primero →
  words.sort((a,b)=>a.cr-b.cr||a.cc-b.cc||a.dir-b.dir);
  const cells=sol.flatMap((v,i)=>v?[i]:[]);const give=shuffle(cells.slice(),rnd).slice(0,Math.round(cells.length*D.give)).sort((a,b)=>a-b);
  return {W:w,H:h,sol,words,give};
}
/*END_GEN*/
if(typeof module!=='undefined'){const {leer}=require('../herramientas/crucigrama/banco.js');global.BANCO=leer().map(e=>({w:e.w,c:e.c,n:e.n}));module.exports={genCross,CDIFFS,bankWords};}
