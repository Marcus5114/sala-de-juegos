// Rueda de Palabras: niveles por cantidad de letras (4 a 8) y por tipo de palabras (comunes / difíciles).
// Salida: dev/datos/rueda/r<n><c|d>.txt  — una línea por nivel: letras|ancho|alto|palabra,x,y,d;...|extras
const fs=require('fs');
// quita tildes y diéresis pero conserva la ñ
const norm=w=>w.toLowerCase().replace(/ñ/g,'\u0001').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\u0001/g,'ñ');
const {ok:enDicc}=require('./check.js');
const {isPlural}=require('./plural.js');
// extras: palabras de la lista general que además están en el diccionario ortográfico
const dictArr=[...new Set(require('an-array-of-spanish-words/index.json').map(norm))].filter(w=>/^[a-zñ]{3,8}$/.test(w)&&enDicc(w));
const dict=new Set(dictArr);
const raw=fs.readFileSync(require.resolve('most-common-words-by-language/build/resources/spanish.txt'),'utf8').split(/\r?\n/);
const curated=new Set(fs.readFileSync(__dirname+'/common.txt','utf8').split('\n'));
const seen=new Set(),common=[];for(const w0 of raw){const w=norm(w0.trim());if(!/^[a-zñ]{3,8}$/.test(w)||seen.has(w)||!dict.has(w))continue;if(w.length<8&&!curated.has(w))continue;if(!enDicc(w))continue;seen.add(w);common.push(w);}
const rank=new Map(common.map((w,i)=>[w,i]));
const block=new Set('puta puto putas mierda joder coño culo polla pene penes sexo sexual verga pito idiota estupido imbecil maldito maldita bastardo zorra cabron marica perra perras drogas droga muerte muerto muertos matar mato mata asesino asesina suicidio sangre arma armas balas tiro tiros disparo violar violacion nazi nazis pedo pedos caca mear orina teta tetas cadaver cocaina heroina guerra matanza tortura esclavo esclava ies sexuales sexual cojones cojon james miss paris luis'.split(' '));
const {layout,verify}=require('./rueda_layout.js');
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const cnt=w=>{const m={};for(const c of w)m[c]=(m[c]||0)+1;return m;};
const fitsIn=(w,m)=>{const c=cnt(w);for(const k in c)if((m[k]||0)<c[k])return false;return true;};
// palabras del crucigrama: comunes = primeras 4000 del ranking; difíciles = todo el ranking, prefiriendo las menos usadas
const PLAN={4:{c:[3,5],d:[3,5]},5:{c:[4,6],d:[5,8]},6:{c:[4,8],d:[6,9]},7:{c:[5,9],d:[7,10]},8:{c:[5,10],d:[6,10]}};
const COUNT=100;
fs.mkdirSync('rueda',{recursive:true});
const summary=[];
for(let n=4;n<=8;n++)for(const kind of ['c','d']){
  const r=rng(1000*n+(kind==='d'?7:3));
  const [w0,w1]=PLAN[n][kind];
  const pool=common.filter(w=>!block.has(w)&&(kind==='c'?rank.get(w)<4000:true));
  const bases=pool.filter(w=>w.length===n&&!isPlural(w)&&(kind==='c'?rank.get(w)<4000:rank.get(w)>=1200));
  const used=new Set(),levels=[];let fails=0,attempts=0;
  // orden: comunes de más a menos frecuentes, con algo de azar; difíciles al revés
  const order=bases.map(w=>({w,k:(kind==='c'?rank.get(w):-rank.get(w))+r()*900})).sort((a,b)=>a.k-b.k).map(o=>o.w);
  for(const base of order){
    if(levels.length>=COUNT)break;attempts++;
    const key=[...base].sort().join('');if(used.has(key))continue;
    const i=levels.length,want=Math.min(w1,w0+Math.floor(i*(w1-w0+1)/COUNT));
    const m=cnt(base);
    let cand=pool.filter(w=>w.length<=n&&fitsIn(w,m));
    if(kind==='c')cand.sort((a,b)=>b.length-a.length||rank.get(a)-rank.get(b));
    else cand.sort((a,b)=>b.length-a.length||rank.get(b)-rank.get(a)); // largas y poco usadas primero
    if(cand.length<want)continue;
    const maxPl=want<=4?0:1;let pl=0;
    const pick=[base];for(const w of cand){if(pick.length>=want+4)break;if(w===base)continue;if(isPlural(w)){if(pl>=maxPl)continue;pl++;}if(pick.some(p=>p===w+'s'||w===p+'s'||p===w+'es'||w===p+'es'))continue;pick.push(w);}
    const L0=layout(pick,r);if(L0.words.length<want)continue;
    const words=L0.words.slice(0,want);
    const L=layout(words.map(p=>p.w),r);if(L.words.length<want)continue;
    let letters;do{letters=[...base].sort(()=>r()-.5).join('');}while(letters===base);
    const inGrid=new Set(L.words.map(p=>p.w));
    const extras=dictArr.filter(w=>w.length<=n&&!inGrid.has(w)&&!block.has(w)&&fitsIn(w,m));
    const lvl={letters,w:L.w,h:L.h,words:L.words,extras};
    if(verify(lvl)!=='ok'){fails++;continue;}
    used.add(key);levels.push(lvl);
  }
  const file=require("path").join(__dirname,"..","..","datos","rueda",`r${n}${kind}.txt`);
  fs.writeFileSync(file,levels.map(l=>[l.letters,l.w,l.h,l.words.map(p=>[p.w,p.x,p.y,p.d].join(',')).join(';'),l.extras.join(',')].join('|')).join('\n'));
  const ws=levels.map(l=>l.words.length);
  summary.push(`${n}${kind}: ${levels.length} niveles, palabras ${Math.min(...ws)}–${Math.max(...ws)}, tamaño máx ${Math.max(...levels.map(l=>Math.max(l.w,l.h)))}, ${(fs.statSync(file).size/1024).toFixed(0)} KB, rechazados ${fails}`);
}
console.log(summary.join('\n'));
