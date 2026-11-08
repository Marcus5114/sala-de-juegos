/*GEN*/
// Pirámide de sumas: cada ladrillo es la suma de los dos de abajo.
// Filas numeradas de arriba (0) a abajo (n-1); ladrillo (f,c) con c de 0 a f; (f,c) = (f+1,c) + (f+1,c+1).
const PDIFFS=[
  {name:'Fácil',  rows:4,base:[1,9], extra:2,maxBottomGiven:4},
  {name:'Media',  rows:5,base:[1,12],extra:1,maxBottomGiven:3},
  {name:'Difícil',rows:6,base:[1,15],extra:0,maxBottomGiven:2},
  {name:'Experto',rows:7,base:[1,12],extra:0,maxBottomGiven:1}
];
function pRng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const pIdx=(f,c)=>f*(f+1)/2+c; // posición en la lista
// reglas: [arriba, abajo-izq, abajo-der]
function pRules(n){const R=[];for(let f=0;f<n-1;f++)for(let c=0;c<=f;c++)R.push([pIdx(f,c),pIdx(f+1,c),pIdx(f+1,c+1)]);return R;}
// deducción paso a paso con la única regla "a = b + c": devuelve cuántas rondas hacen falta (o -1 si se traba)
function pDeduce(n,vals,given){
  const R=pRules(n),k=given.slice();let rounds=0,changed=true,steps=[];
  while(changed){changed=false;rounds++;const add=[];
    for(const [t,a,b] of R){const kt=k[t],ka=k[a],kb=k[b];
      if(kt&&ka&&!kb)add.push(b);else if(kt&&!ka&&kb)add.push(a);else if(!kt&&ka&&kb)add.push(t);}
    for(const i of add)if(!k[i]){k[i]=true;changed=true;steps.push(i);}}
  return k.every(Boolean)?{rounds:rounds-1,steps}:null;
}
function genPyramid(diff,idx){
  const D=PDIFFS[diff],n=D.rows,N=n*(n+1)/2;
  for(let att=0;;att++){
    const r=pRng(diff*7777777+idx*104723+att*31337+5);
    const v=Array(N);for(let c=0;c<n;c++)v[pIdx(n-1,c)]=D.base[0]+Math.floor(r()*(D.base[1]-D.base[0]+1));
    for(let f=n-2;f>=0;f--)for(let c=0;c<=f;c++)v[pIdx(f,c)]=v[pIdx(f+1,c)]+v[pIdx(f+1,c+1)];
    // elegir n ladrillos dados (+ extra en fáciles) que alcancen para deducir todo
    for(let t=0;t<200;t++){
      const g=Array(N).fill(false),cells=Array.from({length:N},(_,i)=>i);
      for(let i=N-1;i>0;i--){const j=Math.floor(r()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]];}
      let bottom=0,cnt=0;for(const i of cells){if(cnt>=n+D.extra)break;const isB=i>=pIdx(n-1,0);if(isB&&bottom>=D.maxBottomGiven)continue;g[i]=true;cnt++;if(isB)bottom++;}
      const d=pDeduce(n,v,g);
      if(d&&(diff<2||d.rounds>=n-1))return {n,v,g,rounds:d.rounds};
    }
  }
}
/*END_GEN*/
if(typeof module!=='undefined')module.exports={PDIFFS,genPyramid,pDeduce,pRules,pIdx};
