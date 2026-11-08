/*GEN*/
// Engranajes: el motor gira; hay que poner engranajes en los ejes para que el eje de salida gire
// en el sentido y a la velocidad pedidos.
// Física simplificada pero real: dos engranajes engranan cuando la distancia entre ejes es la suma de sus radios;
// cada contacto invierte el sentido; la velocidad cambia según los dientes (ω·dientes se conserva).
// Por eso, con engranajes simples en cadena, la velocidad final depende solo del motor y del engranaje de salida,
// y el sentido depende de cuántos contactos hay: elegir el camino y los tamaños es el acertijo.
const GSIZES={S:{t:8,r:1},M:{t:12,r:1.5},L:{t:16,r:2}};
const GDIFFS=[
  {name:'Fácil',  chain:[2,3],sizes:'SM', diag:false,decoys:1,extra:0,par:45},
  {name:'Media',  chain:[3,4],sizes:'SML',diag:false,decoys:3,extra:1,par:90},
  {name:'Difícil',chain:[4,5],sizes:'SML',diag:true, decoys:4,extra:1,par:180},
  {name:'Experto',chain:[6,7],sizes:'SML',diag:true, decoys:6,extra:2,par:300}
];
const GW=12,GH=16;
function gRng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
// simulación: gears = [{x,y,s}] ; motor = índice 0 con sentido +1 y velocidad 1
// devuelve por engranaje: {dir, w} si gira, null si quieto, y jam=true si algo se traba
function gSim(G){
  const n=G.length,st=G.map(()=>null);let jam=new Set();
  const R=i=>GSIZES[G[i].s].r,T=i=>GSIZES[G[i].s].t;
  // choques: ejes demasiado cerca
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const d=Math.hypot(G[i].x-G[j].x,G[i].y-G[j].y);if(d<R(i)+R(j)-.05){jam.add(i);jam.add(j);}}
  st[0]={dir:1,w:1};const q=[0];
  while(q.length){const i=q.shift();for(let j=0;j<n;j++){if(j===i)continue;const d=Math.hypot(G[i].x-G[j].x,G[i].y-G[j].y);if(Math.abs(d-(R(i)+R(j)))>.05)continue;
    const want={dir:-st[i].dir,w:st[i].w*T(i)/T(j)};
    if(!st[j]){st[j]=want;q.push(j);}else if(st[j].dir!==want.dir||Math.abs(st[j].w-want.w)>1e-9){jam.add(i);jam.add(j);}}}
  // lo que toca algo trabado también queda trabado
  if(jam.size){let ch=true;while(ch){ch=false;for(let i=0;i<n;i++){if(jam.has(i)||!st[i])continue;for(const j of jam){const d=Math.hypot(G[i].x-G[j].x,G[i].y-G[j].y);if(Math.abs(d-(R(i)+R(j)))<=.05){jam.add(i);ch=true;break;}}}}}
  return {st,jam};
}
function genGears(diff,idx){
  const D=GDIFFS[diff];
  for(let att=0;;att++){
    const r=gRng(diff*15485863+idx*32452843+att*49979687+29);
    const pick=a=>a[Math.floor(r()*a.length)];
    const len=D.chain[0]+Math.floor(r()*(D.chain[1]-D.chain[0]+1));
    const motorS=pick(['M','L','S']);
    const G=[{x:2+Math.floor(r()*8),y:GH-2-Math.floor(r()*2),s:motorS}];
    const inB=(x,y,s)=>x-GSIZES[s].r>=0&&y-GSIZES[s].r>=0&&x+GSIZES[s].r<=GW&&y+GSIZES[s].r<=GH;
    let ok=true;
    for(let k=0;k<len;k++){
      const prev=G[G.length-1];let placed=false;
      for(let t=0;t<60&&!placed;t++){
        const s=pick(D.sizes.split('')),d=GSIZES[prev.s].r+GSIZES[s].r;
        const vs=[[d,0],[-d,0],[0,d],[0,-d]];if(D.diag&&Math.abs(d-2.5)<1e-9)vs.push([1.5,2],[2,1.5],[-1.5,2],[-2,1.5],[1.5,-2],[2,-1.5],[-1.5,-2],[-2,-1.5]);
        // sesgo hacia arriba, para que la salida quede lejos del motor
        const v=r()<.45?vs.filter(v=>v[1]<0)[Math.floor(r()*vs.filter(v=>v[1]<0).length)]||pick(vs):pick(vs);
        const x=prev.x+v[0],y=prev.y+v[1];if(!inB(x,y,s))continue;
        if(G.slice(0,-1).some(g=>Math.hypot(g.x-x,g.y-y)<GSIZES[g.s].r+GSIZES[s].r+.4))continue;
        G.push({x,y,s});placed=true;}
      if(!placed){ok=false;break;}
    }
    if(!ok)continue;
    const sim=gSim(G);if(sim.jam.size||G.some((g,i)=>!sim.st[i]))continue;
    const out=G.length-1,need=sim.st[out];
    // la salida tiene que quedar bastante lejos del motor
    if(Math.hypot(G[out].x-G[0].x,G[out].y-G[0].y)<5)continue;
    // ejes señuelo: lugares donde entraría algún engranaje junto a otro eje, pero que no son el camino
    const pegs=G.slice(1).map(g=>({x:g.x,y:g.y}));let dg=0;
    for(let t=0;t<400&&dg<D.decoys;t++){const base=pick(G),s=pick(D.sizes.split('')),d=GSIZES[base.s].r+GSIZES[s].r;
      const v=pick([[d,0],[-d,0],[0,d],[0,-d]]);const x=base.x+v[0],y=base.y+v[1];if(!inB(x,y,s))continue;
      if([...G,...pegs].some(p=>Math.hypot(p.x-x,p.y-y)<1.9))continue;pegs.push({x,y,decoy:true});dg++;}
    // inventario: lo que usa la solución, más algunos de sobra
    const inv={S:0,M:0,L:0};G.slice(1).forEach(g=>inv[g.s]++);for(let e=0;e<D.extra;e++)inv[pick(D.sizes.split(''))]++;
    // mezclar el orden de los ejes para que no delate la solución
    const order=pegs.map((p,i)=>[p,r()]).sort((a,b)=>a[1]-b[1]).map(x=>x[0]);
    const outIdx=order.findIndex(p=>p.x===G[out].x&&p.y===G[out].y);
    return {motor:G[0],pegs:order.map(p=>({x:p.x,y:p.y})),out:outIdx,need:{dir:need.dir,w:need.w},inv,sol:order.map(p=>{const g=G.slice(1).find(g=>g.x===p.x&&g.y===p.y);return g?g.s:null;}),len};
  }
}
/*END_GEN*/
if(typeof module!=='undefined')module.exports={GDIFFS,GSIZES,genGears,gSim,GW,GH};
