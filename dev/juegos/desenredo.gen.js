// En el juego, rngOf y shuffle vienen del kit; acá se definen para usar el generador desde node.
const shuffle=(a,r)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function rngOf(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
/*GEN*/
// Generador de niveles de Desenredo. Mismo código en el juego y en las pruebas.
// Idea: puntos al azar → triangulación de Delaunay (un dibujo plano, sin cruces) → se quitan líneas hasta la densidad
// de la dificultad → los puntos se desordenan en un círculo. Como el grafo salió de un dibujo sin cruces, siempre tiene solución.
const DIFFS=[
  {name:'Fácil',  n:[7,8],   deg:2.6, maxDeg:4, minCross:4,  time:60},
  {name:'Media',  n:[11,12], deg:3.1, maxDeg:5, minCross:10, time:120},
  {name:'Difícil',n:[16,17], deg:3.6, maxDeg:6, minCross:22, time:240},
  {name:'Experto',n:[22,24], deg:4.1, maxDeg:6, minCross:40, time:420}
];
// ¿se cruzan los segmentos ab y cd? (los que comparten un punto no cuentan)
function segX(a,b,c,d){
  const o=(p,q,r)=>{const v=(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);return Math.abs(v)<1e-12?0:v>0?1:-1;};
  const on=(p,q,r)=>Math.min(p[0],r[0])-1e-12<=q[0]&&q[0]<=Math.max(p[0],r[0])+1e-12&&Math.min(p[1],r[1])-1e-12<=q[1]&&q[1]<=Math.max(p[1],r[1])+1e-12;
  const o1=o(a,b,c),o2=o(a,b,d),o3=o(c,d,a),o4=o(c,d,b);
  if(o1!==o2&&o3!==o4)return true;
  return (o1===0&&on(a,c,b))||(o2===0&&on(a,d,b))||(o3===0&&on(c,a,d))||(o4===0&&on(c,b,d));
}
function crossings(P,E){let k=0;for(let i=0;i<E.length;i++){const [a,b]=E[i];for(let j=i+1;j<E.length;j++){const [c,d]=E[j];if(a===c||a===d||b===c||b===d)continue;if(segX(P[a],P[b],P[c],P[d]))k++;}}return k;}
// triangulación de Delaunay (Bowyer-Watson; alcanza para 30 puntos)
function delaunay(P){
  const pts=P.concat([[-10,-10],[10,-10],[0,10]]),N=P.length;let tris=[[N,N+1,N+2]];
  const cc=t=>{const [a,b,c]=t.map(i=>pts[i]),d=2*(a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]));
    const ux=((a[0]**2+a[1]**2)*(b[1]-c[1])+(b[0]**2+b[1]**2)*(c[1]-a[1])+(c[0]**2+c[1]**2)*(a[1]-b[1]))/d,uy=((a[0]**2+a[1]**2)*(c[0]-b[0])+(b[0]**2+b[1]**2)*(a[0]-c[0])+(c[0]**2+c[1]**2)*(b[0]-a[0]))/d;
    return [ux,uy,(a[0]-ux)**2+(a[1]-uy)**2];};
  for(let i=0;i<N;i++){const p=pts[i],bad=[],keep=[];
    for(const t of tris){const [ux,uy,r2]=cc(t);((p[0]-ux)**2+(p[1]-uy)**2<r2?bad:keep).push(t);}
    const cnt=new Map();for(const t of bad)for(const [u,v] of [[t[0],t[1]],[t[1],t[2]],[t[2],t[0]]]){const k=u<v?u+','+v:v+','+u;cnt.set(k,(cnt.get(k)||0)+1);}
    tris=keep;for(const [k,c] of cnt)if(c===1){const [u,v]=k.split(',').map(Number);tris.push([u,v,i]);}}
  const E=new Set();for(const t of tris)for(const [u,v] of [[t[0],t[1]],[t[1],t[2]],[t[2],t[0]]])if(u<N&&v<N)E.add(u<v?u+','+v:v+','+u);
  return [...E].map(k=>k.split(',').map(Number));
}
function connected(n,E){const adj=Array.from({length:n},()=>[]);E.forEach(([a,b])=>{adj[a].push(b);adj[b].push(a);});const seen=new Set([0]),st=[0];while(st.length){const v=st.pop();for(const w of adj[v])if(!seen.has(w)){seen.add(w);st.push(w);}}return seen.size===n;}
function genLevel(diff,idx){
  const D=DIFFS[diff];
  for(let attempt=0;;attempt++){
    const r=rngOf(diff*1000003+idx*7919+attempt*104729+17);
    const n=D.n[0]+Math.floor(r()*(D.n[1]-D.n[0]+1));
    // puntos separados entre sí, para que la solución sea cómoda de ver y tocar
    const md=.62/Math.sqrt(n),P=[];let guard=0;
    while(P.length<n&&guard++<5000){const p=[.06+r()*.88,.06+r()*.88];if(P.every(q=>Math.hypot(p[0]-q[0],p[1]-q[1])>md))P.push(p);}
    if(P.length<n)continue;
    let E=delaunay(P);
    // sacar las líneas casi chatas del borde (triángulos muy finos): confunden a la vista
    const deg=()=>{const d=Array(n).fill(0);E.forEach(([a,b])=>{d[a]++;d[b]++;});return d;};
    const target=Math.round(n*D.deg/2);
    const order=shuffle(E.slice(),r);
    // primero bajar los puntos con demasiadas líneas, después al azar hasta llegar a la densidad buscada
    for(const pass of [0,1])for(const e of order){
      if(E.length<=target)break;if(!E.includes(e))continue;
      const d=deg();if(d[e[0]]<=2||d[e[1]]<=2)continue;
      if(pass===0&&d[e[0]]<=D.maxDeg&&d[e[1]]<=D.maxDeg)continue;
      const rest=E.filter(x=>x!==e);if(!connected(n,rest))continue;E=rest;}
    const dg=deg();if(Math.max(...dg)>D.maxDeg+1||Math.min(...dg)<2)continue;
    // desorden inicial: los puntos en un círculo, en orden al azar, con suficientes cruces
    let best=null;
    for(let t=0;t<40;t++){const perm=shuffle(Array.from({length:n},(_,i)=>i),r),S=Array(n);
      perm.forEach((v,k)=>{const a=-Math.PI/2+k*2*Math.PI/n;S[v]=[.5+.42*Math.cos(a),.5+.42*Math.sin(a)];});
      const c=crossings(S,E);if(!best||c>best.c)best={S,c};if(c>=D.minCross)break;}
    if(best.c<D.minCross&&attempt<20)continue;
    return {n,E,sol:P,start:best.S,cross:best.c};
  }
}
/*END_GEN*/
if(typeof module!=='undefined')module.exports={DIFFS,genLevel,crossings,segX};
