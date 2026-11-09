// Genera muchos niveles y revisa que cada uno sea un autodefinido válido.
// Uso: node dev/herramientas/crucigrama/verificar.js [niveles por dificultad=500]
const {genCross,CDIFFS}=require('../../juegos/crucigrama.gen.js');
const N=+(process.argv[2]||500);let malos=0;
function revisar(g){const {W,H,sol,words}=g,err=[];const at=(r,c)=>r>=0&&c>=0&&r<H&&c<W?r*W+c:-1;
  const slots=new Set();
  for(const w of words){const dr=w.dir,dc=1-w.dir;
    if(at(w.cr,w.cc)<0||sol[at(w.cr,w.cc)])err.push('pista sobre letra '+w.ans);
    if(w.cr!==w.r-dr||w.cc!==w.c-dc)err.push('pista fuera de lugar '+w.ans);
    const k=w.cr+','+w.cc+','+w.dir;if(slots.has(k))err.push('dos pistas en la misma flecha');slots.add(k);
    for(let i=0;i<w.ans.length;i++)if(sol[at(w.r+dr*i,w.c+dc*i)]!==w.ans[i])err.push('letra distinta en '+w.ans);
    const a=at(w.r+dr*w.ans.length,w.c+dc*w.ans.length);if(a>=0&&sol[a])err.push('sigue después de '+w.ans);}
  // toda tira de 2+ letras seguidas tiene que ser una palabra con pista
  const has=new Set(words.map(w=>w.r+','+w.c+','+w.dir+','+w.ans.length));
  for(const dir of [0,1])for(let a=0;a<(dir?W:H);a++){let run=[];
    for(let b=0;b<=(dir?H:W);b++){const i=dir?at(b,a):at(a,b);if(i>=0&&sol[i])run.push(i);else{if(run.length>1){const r=Math.floor(run[0]/W),c=run[0]%W;if(!has.has(r+','+c+','+dir+','+run.length))err.push('palabra sin pista: '+run.map(i=>sol[i]).join(''));}run=[];}}}
  // cada letra pertenece a alguna palabra
  const cov=new Set();words.forEach(w=>{for(let i=0;i<w.ans.length;i++)cov.add(at(w.r+w.dir*i,w.c+(1-w.dir)*i));});
  sol.forEach((v,i)=>{if(v&&!cov.has(i))err.push('letra suelta');});
  if(new Set(words.map(w=>w.ans)).size!==words.length)err.push('palabra repetida');
  return err;}
for(let d=0;d<4;d++){const t0=Date.now();let nw=0,den=0,minW=99,maxW=0,maxT=0,sz=[0,0];const cnt={};
  for(let l=0;l<N;l++){const t1=Date.now();const g=genCross(d,l);maxT=Math.max(maxT,Date.now()-t1);const e=revisar(g);
    if(e.length){malos++;if(malos<6)console.log('✘',d,l,e.slice(0,3));}
    nw+=g.words.length;minW=Math.min(minW,g.words.length);maxW=Math.max(maxW,g.words.length);den+=g.sol.filter(Boolean).length/(g.W*g.H);sz[0]+=g.W;sz[1]+=g.H;
    g.words.forEach(w=>cnt[w.ans]=(cnt[w.ans]||0)+1);}
  const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([w,c])=>w+' '+(100*c/N).toFixed(0)+'%').join(', ');
  console.log(`${CDIFFS[d].name.padEnd(8)} palabras ${minW}–${maxW} (media ${(nw/N).toFixed(1)}) · densidad ${(den/N*100).toFixed(0)}% · tamaño ${(sz[0]/N).toFixed(1)}×${(sz[1]/N).toFixed(1)} · ${((Date.now()-t0)/N).toFixed(1)} ms/nivel (máx ${maxT}) · más usadas: ${top}`);}
console.log(malos?`${malos} niveles con problemas`:'todos los niveles son válidos');process.exitCode=malos?1:0;
