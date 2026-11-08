/*GEN*/
// Cartógrafo: una isla dividida en regiones; pintar sin que dos vecinas compartan color.
// Mapa en una grilla fina: cada celda es mar (-1) o pertenece a una región. Algunas regiones vienen pintadas
// para que la solución sea una sola.
// Con 4 colores casi cualquier mapa se puede pintar de muchas formas: alcanza con respetar las vecinas (y unas pocas
// regiones ya pintadas). Con 3 colores pocos mapas se pueden pintar, y se eligen con pistas hasta que la solución es una sola.
const MDIFFS=[
  {name:'Fácil',  regions:[10,12],k:4,givens:2,unique:false,par:45},
  {name:'Media',  regions:[18,21],k:4,givens:4,unique:false,par:90},
  {name:'Difícil',regions:[12,15],k:3,unique:true,par:150},
  {name:'Experto',regions:[19,23],k:3,unique:true,par:300}
];
const MW=45,MH=60;
function mRng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
// ruido suave por suma de senos con fases al azar
function mNoise(r){const w=[];for(let i=0;i<6;i++)w.push([r()*6.28,r()*6.28,.5+r()*2.5,.5+r()*2.5,r()]);return (x,y)=>w.reduce((s,[a,b,f,g,amp])=>s+amp*Math.sin(x*f+a)*Math.cos(y*g+b),0)/3;}
// cuenta colorings (hasta limit) respetando los dados
function mCount(adj,k,given,limit=2){
  const n=adj.length,col=given.map(g=>g==null?-1:g);let count=0,first=null;
  for(let i=0;i<n;i++)if(col[i]>=0&&adj[i].some(j=>col[j]===col[i]))return {count:0};
  function pick(){let best=-1,bs=-1,bd=-1;for(let i=0;i<n;i++){if(col[i]>=0)continue;const used=new Set();for(const j of adj[i])if(col[j]>=0)used.add(col[j]);
    const sat=used.size;if(sat>bs||(sat===bs&&adj[i].length>bd)){bs=sat;bd=adj[i].length;best=i;}}return best;}
  function rec(){if(count>=limit)return;const i=pick();if(i<0){count++;if(!first)first=col.slice();return;}
    const used=new Set();for(const j of adj[i])if(col[j]>=0)used.add(col[j]);
    for(let c=0;c<k;c++){if(used.has(c))continue;col[i]=c;rec();col[i]=-1;if(count>=limit)return;}}
  rec();return {count,first};
}
function genMap(diff,idx){
  const D=MDIFFS[diff];
  for(let att=0;;att++){
    const r=mRng(diff*49979687+idx*86028121+att*104729+11),nz=mNoise(r),nz2=mNoise(r);
    // tierra: un óvalo con bordes irregulares
    const land=new Int8Array(MW*MH);
    for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const u=(x+.5)/MW*2-1,v=(y+.5)/MH*2-1,d=Math.hypot(u*1.02,v*1.02)+nz(u*2.2,v*2.2)*.32;land[y*MW+x]=d<.86?1:0;}
    const nReg=D.regions[0]+Math.floor(r()*(D.regions[1]-D.regions[0]+1));
    // semillas separadas dentro de la tierra
    const seeds=[];let g=0;const md=Math.sqrt(MW*MH*.55/nReg)*.75;
    while(seeds.length<nReg&&g++<20000){const x=Math.floor(r()*MW),y=Math.floor(r()*MH);if(!land[y*MW+x])continue;if(seeds.every(([a,b])=>Math.hypot(a-x,b-y)>md))seeds.push([x,y]);}
    if(seeds.length<nReg)continue;
    // Voronoi con bordes ondulados
    const reg=new Int16Array(MW*MH).fill(-1);
    for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){if(!land[y*MW+x])continue;const px=x+nz2(x*.18,y*.18)*3.2,py=y+nz2(y*.18+4,x*.18+2)*3.2;let b=0,bd=1e9;
      seeds.forEach(([a,c],i)=>{const d=(a-px)**2+(c-py)**2;if(d<bd){bd=d;b=i;}});reg[y*MW+x]=b;}
    // cada región en una sola pieza: los pedazos sueltos pasan a la vecina
    for(let pass=0;pass<3;pass++){const seen=new Uint8Array(MW*MH);
      for(let i=0;i<nReg;i++){const comps=[];for(let c=0;c<MW*MH;c++){if(reg[c]!==i||seen[c])continue;const comp=[c],st=[c];seen[c]=1;
        while(st.length){const q=st.pop(),x=q%MW,y=(q-x)/MW;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const nq=ny*MW+nx;if(!seen[nq]&&reg[nq]===i){seen[nq]=1;comp.push(nq);st.push(nq);}}}comps.push(comp);}
        comps.sort((a,b)=>b.length-a.length);for(const comp of comps.slice(1))for(const q of comp){const x=q%MW,y=(q-x)/MW;
          for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const o=reg[ny*MW+nx];if(o>=0&&o!==i){reg[q]=o;break;}}
          if(reg[q]===i)reg[q]=-1;}}}
    // tamaño mínimo de región (para poder tocarla con el dedo)
    const size=Array(nReg).fill(0);for(let c=0;c<MW*MH;c++)if(reg[c]>=0)size[reg[c]]++;
    if(Math.min(...size)<MW*MH*.55/nReg*.35)continue;
    // vecinas: comparten al menos 2 celdas de borde (tocarse en una esquina no cuenta)
    const cnt=new Map();for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const a=reg[y*MW+x];if(a<0)continue;
      if(x+1<MW){const b=reg[y*MW+x+1];if(b>=0&&b!==a){const k=Math.min(a,b)+','+Math.max(a,b);cnt.set(k,(cnt.get(k)||0)+1);}}
      if(y+1<MH){const b=reg[(y+1)*MW+x];if(b>=0&&b!==a){const k=Math.min(a,b)+','+Math.max(a,b);cnt.set(k,(cnt.get(k)||0)+1);}}}
    const adj=Array.from({length:nReg},()=>[]);
    for(const [k,v] of cnt){if(v<2)continue;const [a,b]=k.split(',').map(Number);adj[a].push(b);adj[b].push(a);}
    if(adj.some(a=>a.length===0))continue;
    // ¿alcanza con k colores?
    const free=mCount(adj,D.k,Array(nReg).fill(null),1);if(!free.count)continue;
    const given=Array(nReg).fill(null);
    if(!D.unique){
      // pocas regiones pintadas, separadas entre sí y que no se pisen con la solución encontrada
      const order=Array.from({length:nReg},(_,i)=>i).sort((a,b)=>adj[b].length-adj[a].length);
      for(const i of order){if(given.filter(v=>v!=null).length>=D.givens)break;if(adj[i].some(j=>given[j]!=null))continue;given[i]=free.first[i];}
      return {W:MW,H:MH,reg:Array.from(reg),n:nReg,adj,k:D.k,given,sol:free.first};
    }
    // con 3 colores: pistas hasta que haya una sola solución
    let tries=0;
    while(tries++<60){const c=mCount(adj,D.k,given,2);if(c.count===1)break;const s1=c.first;
      const cand=[];for(let i=0;i<nReg;i++)if(given[i]==null)cand.push(i);
      let best=cand[Math.floor(r()*cand.length)],bestN=1e9;
      for(let t=0;t<Math.min(10,cand.length);t++){const i=cand[Math.floor(r()*cand.length)];const g2=given.slice();g2[i]=s1[i];const n=mCount(adj,D.k,g2,8).count;if(n>=1&&n<bestN){bestN=n;best=i;}}
      given[best]=s1[best];}
    if(mCount(adj,D.k,given,2).count!==1)continue;
    return {W:MW,H:MH,reg:Array.from(reg),n:nReg,adj,k:D.k,given,sol:mCount(adj,D.k,given,1).first};
  }
}
/*END_GEN*/
if(typeof module!=='undefined')module.exports={MDIFFS,genMap,mCount};
