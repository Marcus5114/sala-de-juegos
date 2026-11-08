/*GEN*/
// Puentes: islas con números; los puentes van en horizontal o vertical, de a 1 o 2, sin cruzarse, y todas las islas quedan conectadas.
const BDIFFS=[
  {name:'Fácil',  w:7, h:8, islands:[8,10], cycles:.15,dbl:.35,par:60},
  {name:'Media',  w:8, h:10,islands:[13,16],cycles:.25,dbl:.4,par:150},
  {name:'Difícil',w:9, h:12,islands:[20,24],cycles:.3, dbl:.45,par:300},
  {name:'Experto',w:10,h:14,islands:[28,33],cycles:.35,dbl:.5,par:480}
];
function bRng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const DIRS=[[1,0],[0,1],[-1,0],[0,-1]];
// posibles puentes: cada isla con la más cercana en cada dirección
function bEdges(I){const at=new Map(I.map((p,i)=>[p[0]+','+p[1],i])),E=[],seen=new Set();
  I.forEach((p,i)=>{for(const [dx,dy] of DIRS){let x=p[0]+dx,y=p[1]+dy,k=0;while(k++<40){const j=at.get(x+','+y);if(j!==undefined){const key=Math.min(i,j)+'-'+Math.max(i,j);if(!seen.has(key)){seen.add(key);E.push([Math.min(i,j),Math.max(i,j)]);}break;}x+=dx;y+=dy;if(x<-1||y<-1||x>60||y>60)break;}}});
  return E;}
function bCross(I,a,b){// ¿se cruzan los puentes a y b? (uno horizontal y otro vertical que se cortan en el medio)
  const [p,q]=[I[a[0]],I[a[1]]],[r,s]=[I[b[0]],I[b[1]]];const ah=p[1]===q[1],bh=r[1]===s[1];if(ah===bh)return false;
  const H=ah?[p,q]:[r,s],V=ah?[r,s]:[p,q];const y=H[0][1],x=V[0][0];
  return x>Math.min(H[0][0],H[1][0])&&x<Math.max(H[0][0],H[1][0])&&y>Math.min(V[0][1],V[1][1])&&y<Math.max(V[0][1],V[1][1]);}
// resolvedor: cuenta soluciones (hasta "limit") con propagación de cotas + búsqueda
function bSolve(I,N,limit=2){
  const E=bEdges(I),m=E.length,inc=I.map(()=>[]);E.forEach(([a,b],k)=>{inc[a].push(k);inc[b].push(k);});
  const X=E.map(()=>[]);for(let i=0;i<m;i++)for(let j=i+1;j<m;j++)if(bCross(I,E[i],E[j])){X[i].push(j);X[j].push(i);}
  let count=0,sol=null;
  function prop(lo,hi){let ch=true;while(ch){ch=false;
    for(let i=0;i<I.length;i++){let sl=0,sh=0;for(const k of inc[i]){sl+=lo[k];sh+=hi[k];}if(sl>N[i]||sh<N[i])return false;
      for(const k of inc[i]){const nl=Math.max(lo[k],N[i]-(sh-hi[k])),nh=Math.min(hi[k],N[i]-(sl-lo[k]));if(nl>nh)return false;if(nl!==lo[k]||nh!==hi[k]){lo[k]=nl;hi[k]=nh;ch=true;}}}
    for(let k=0;k<m;k++)if(lo[k]>0)for(const j of X[k])if(hi[j]>0){if(lo[j]>0)return false;hi[j]=0;ch=true;}}
    return true;}
  function connected(v){const adj=I.map(()=>[]);E.forEach(([a,b],k)=>{if(v[k]){adj[a].push(b);adj[b].push(a);}});const s=new Set([0]),st=[0];while(st.length){const x=st.pop();for(const y of adj[x])if(!s.has(y)){s.add(y);st.push(y);}}return s.size===I.length;}
  function rec(lo,hi,depth){if(count>=limit)return;if(!prop(lo,hi))return;
    let k=-1;for(let i=0;i<m;i++)if(lo[i]<hi[i]){k=i;break;}
    if(k<0){if(connected(lo)){count++;if(!sol)sol=lo.slice();}return;}
    for(let v=hi[k];v>=lo[k];v--){const l2=lo.slice(),h2=hi.slice();l2[k]=h2[k]=v;rec(l2,h2,depth+1);if(count>=limit)return;}}
  rec(E.map(()=>0),E.map(()=>2),0);
  return {count,sol,E};
}
function genBridges(diff,idx){
  const D=BDIFFS[diff];
  for(let att=0;;att++){
    const r=bRng(diff*9999991+idx*15485863+att*7919+3),W=D.w,H=D.h,target=D.islands[0]+Math.floor(r()*(D.islands[1]-D.islands[0]+1));
    const occ=new Map(),I=[],B=[];// occ: celda -> 'I' isla, 'h'/'v' puente
    const key=(x,y)=>x+','+y,free=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&!occ.has(key(x,y));
    const nearIsland=(x,y)=>DIRS.some(([dx,dy])=>occ.get(key(x+dx,y+dy))==='I');
    const add=(x,y)=>{occ.set(key(x,y),'I');I.push([x,y]);return I.length-1;};
    add(Math.floor(r()*W),Math.floor(r()*H));
    let guard=0;
    while(I.length<target&&guard++<4000){
      const i=Math.floor(r()*I.length),[dx,dy]=DIRS[Math.floor(r()*4)],len=2+Math.floor(r()*Math.max(2,Math.min(W,H)-2));
      const [x0,y0]=I[i];let ok=true;
      for(let s=1;s<len;s++){const x=x0+dx*s,y=y0+dy*s;if(!free(x,y)){ok=false;break;}}
      const nx=x0+dx*len,ny=y0+dy*len;if(!ok||!free(nx,ny)||nearIsland(nx,ny))continue;
      // la isla nueva no puede quedar sobre la línea de otro puente posible ya ocupado
      for(let s=1;s<len;s++)occ.set(key(x0+dx*s,y0+dy*s),dx?'h':'v');
      const j=add(nx,ny);B.push([i,j,r()<D.dbl?2:1]);
    }
    if(I.length<target)continue;
    // ciclos: unir islas que ya se ven en línea recta, con el camino libre
    const E0=bEdges(I);for(const [a,b] of E0){if(B.some(e=>(e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a)))continue;if(r()>D.cycles)continue;
      const [p,q]=[I[a],I[b]],dx=Math.sign(q[0]-p[0]),dy=Math.sign(q[1]-p[1]);let ok=true;const cells=[];
      for(let x=p[0]+dx,y=p[1]+dy;x!==q[0]||y!==q[1];x+=dx,y+=dy){if(occ.has(key(x,y))){ok=false;break;}cells.push([x,y]);}
      if(!ok)continue;cells.forEach(([x,y])=>occ.set(key(x,y),dx?'h':'v'));B.push([a,b,r()<D.dbl?2:1]);}
    const N=I.map(()=>0);B.forEach(([a,b,c])=>{N[a]+=c;N[b]+=c;});
    // achicar a la caja que ocupan las islas
    const minX=Math.min(...I.map(p=>p[0])),minY=Math.min(...I.map(p=>p[1])),maxX=Math.max(...I.map(p=>p[0])),maxY=Math.max(...I.map(p=>p[1]));
    const I2=I.map(([x,y])=>[x-minX,y-minY]);
    const res=bSolve(I2,N,2);
    if(res.count!==1&&att<60)continue;
    return {w:maxX-minX+1,h:maxY-minY+1,I:I2,N,E:res.E,sol:res.sol||res.E.map(([a,b])=>{const e=B.find(e=>(e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a));return e?e[2]:0;}),unique:res.count===1};
  }
}
/*END_GEN*/
if(typeof module!=='undefined')module.exports={BDIFFS,genBridges,bSolve,bEdges,bCross};
