// Contraste y distancia entre colores, para diseñar temas sin abrir el navegador.
// Uso:
//   node dev/herramientas/contraste.js '#f6c445' '#383c48'          → contraste (WCAG) y ΔE entre dos colores
//   node dev/herramientas/contraste.js --paleta '#e8483f,#f29b30,…'  → el par más parecido de una paleta (ΔE)
//   node dev/herramientas/contraste.js --sobre '#20232b' '#383c48,#f6c445'  → cada color contra un fondo
// Reglas de la sala (ver dev/kit/ESTILO.md): texto chico ≥ 4,5 · texto grande/negrita y piezas ≥ 3 · colores de una paleta con ΔE ≥ 12.
const hex=c=>{c=c.trim().replace('#','');if(c.length===3)c=[...c].map(x=>x+x).join('');return [0,2,4].map(i=>parseInt(c.slice(i,i+2),16));};
const lin=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};
const lum=c=>{const [r,g,b]=hex(c).map(lin);return .2126*r+.7152*g+.0722*b;};
const cr=(a,b)=>{const A=lum(a),B=lum(b);return (Math.max(A,B)+.05)/(Math.min(A,B)+.05);};
function lab(c){let [r,g,b]=hex(c).map(v=>{v/=255;return v>.04045?Math.pow((v+.055)/1.055,2.4):v/12.92;});
  let x=(r*.4124+g*.3576+b*.1805)/.95047,y=r*.2126+g*.7152+b*.0722,z=(r*.0193+g*.1192+b*.9505)/1.08883;
  const f=t=>t>.008856?Math.cbrt(t):7.787*t+16/116;[x,y,z]=[f(x),f(y),f(z)];return [116*y-16,500*(x-y),200*(y-z)];}
const dE=(a,b)=>{const A=lab(a),B=lab(b);return Math.hypot(A[0]-B[0],A[1]-B[1],A[2]-B[2]);};
const nota=r=>r>=4.5?'texto chico ✔':r>=3?'texto grande y piezas ✔ (texto chico ✘)':'✘ poco contraste';
const a=process.argv.slice(2);
if(!a.length){console.log(require('fs').readFileSync(__filename,'utf8').split('\n').slice(0,7).join('\n'));process.exit(0);}
if(a[0]==='--paleta'){const P=a[1].split(',');let m=[1e9];
  for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const d=dE(P[i],P[j]);if(d<m[0])m=[d,P[i],P[j]];}
  console.log(`par más parecido: ${m[1]} y ${m[2]} · ΔE ${m[0].toFixed(1)} ${m[0]>=12?'✔':'✘ (mínimo 12)'}`);process.exitCode=m[0]>=12?0:1;}
else if(a[0]==='--sobre'){let mal=0;for(const c of a[2].split(',')){const r=cr(a[1],c);if(r<3)mal++;console.log(`${c} sobre ${a[1]}: ${r.toFixed(2)}:1 · ${nota(r)}`);}process.exitCode=mal?1:0;}
else{const r=cr(a[0],a[1]);console.log(`${a[0]} / ${a[1]}: contraste ${r.toFixed(2)}:1 · ${nota(r)} · ΔE ${dE(a[0],a[1]).toFixed(1)}`);}
