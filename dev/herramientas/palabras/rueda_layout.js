const cnt=w=>{const m={};for(const c of w)m[c]=(m[c]||0)+1;return m;};
const fitsIn=(w,m)=>{const c=cnt(w);for(const k in c)if((m[k]||0)<c[k])return false;return true;};
// crucigrama: coloca palabras cruzándolas; devuelve [{w,x,y,d}] con d 0=horizontal 1=vertical
function layout(words,r){
  const cells=new Map(),key=(x,y)=>x+','+y,placed=[];
  const put=(w,x,y,d)=>{for(let i=0;i<w.length;i++)cells.set(key(x+(d?0:i),y+(d?i:0)),w[i]);placed.push({w,x,y,d});};
  const can=(w,x,y,d)=>{
    let cross=0;
    const before=key(x-(d?0:1),y-(d?1:0)),after=key(x+(d?0:w.length),y+(d?w.length:0));
    if(cells.has(before)||cells.has(after))return -1;
    for(let i=0;i<w.length;i++){
      const cx=x+(d?0:i),cy=y+(d?i:0),c=cells.get(key(cx,cy));
      if(c){if(c!==w[i])return -1;cross++;continue;}
      // vecinos laterales vacíos (si no, se formarían palabras que no existen)
      const s1=key(cx+(d?1:0),cy+(d?0:1)),s2=key(cx-(d?1:0),cy-(d?0:1));
      if(cells.has(s1)||cells.has(s2))return -1;
    }
    return cross;
  };
  const bbox=()=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const k of cells.keys()){const [x,y]=k.split(',').map(Number);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}return [x0,y0,x1,y1];};
  put(words[0],0,0,0);
  for(const w of words.slice(1)){
    let best=null;
    for(const p of placed)for(let i=0;i<p.w.length;i++)for(let j=0;j<w.length;j++){
      if(p.w[i]!==w[j])continue;const d=1-p.d;
      const nx=p.d?p.x-j:p.x+i,ny=p.d?p.y+i:p.y-j;
      const sc=can(w,nx,ny,d);if(sc<1)continue;
      put(w,nx,ny,d);const [x0,y0,x1,y1]=bbox();placed.pop(); // prueba y deshace
      cells.clear();placed.forEach(q=>{for(let k=0;k<q.w.length;k++)cells.set(key(q.x+(q.d?0:k),q.y+(q.d?k:0)),q.w[k]);});
      const W=x1-x0+1,H=y1-y0+1;if(W>9||H>9)continue;
      const score=sc*10-Math.max(W,H)-Math.abs(W-H)*.5+r()*.5;
      if(!best||score>best.score)best={x:nx,y:ny,d,score};
    }
    if(best)put(w,best.x,best.y,best.d);
  }
  const [x0,y0,x1,y1]=bbox();
  return {w:x1-x0+1,h:y1-y0+1,words:placed.map(p=>({w:p.w,x:p.x-x0,y:p.y-y0,d:p.d}))};
}
// verificación independiente del crucigrama
function verify(L){
  const grid=Array.from({length:L.h},()=>Array(L.w).fill(null)),m=cnt(L.letters);
  for(const p of L.words){if(!fitsIn(p.w,m))return 'no se arma con la rueda: '+p.w;
    for(let i=0;i<p.w.length;i++){const x=p.x+(p.d?0:i),y=p.y+(p.d?i:0);if(x>=L.w||y>=L.h)return 'fuera';if(grid[y][x]&&grid[y][x]!==p.w[i])return 'choque';grid[y][x]=p.w[i];}}
  // toda secuencia horizontal o vertical de 2+ letras debe ser una palabra del nivel
  const set=new Set(L.words.map(p=>p.w+'|'+p.d+'|'+p.x+'|'+p.y));
  for(let d=0;d<2;d++)for(let a=0;a<(d?L.w:L.h);a++){let run='',sx=0,sy=0;
    for(let b=0;b<=(d?L.h:L.w);b++){const x=d?a:b,y=d?b:a,c=b<(d?L.h:L.w)?grid[y][x]:null;
      if(c){if(!run){sx=x;sy=y;}run+=c;}else{if(run.length>1&&!set.has(run+'|'+d+'|'+sx+'|'+sy))return 'secuencia extra: '+run;run='';}}}
  // conectado
  const cellsList=[];grid.forEach((row,y)=>row.forEach((c,x)=>{if(c)cellsList.push([x,y]);}));
  const seen=new Set([cellsList[0].join()]),q=[cellsList[0]];
  while(q.length){const [x,y]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(grid[ny]&&grid[ny][nx]&&!seen.has(nx+','+ny)){seen.add(nx+','+ny);q.push([nx,ny]);}}}
  if(seen.size!==cellsList.length)return 'no conectado';
  return 'ok';
}
module.exports={layout,verify};
