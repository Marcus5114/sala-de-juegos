// Verificación independiente de los datos publicados de Rueda: diccionario y plurales.
const fs=require('fs'),{ok}=require('./check.js'),{isPlural}=require('./plural.js');
const html=fs.readFileSync(process.argv[2],'utf8');const m=html.match(/LEVELS_RAW=(\{.*?\});/s);const SETS=new Function('return '+m[1])();
let n=0,bad=[],basePl=0,many=0,words=0;
for(const [k,raw] of Object.entries(SETS))for(const l of raw.split('\n')){n++;const [letters,,,ws,ex]=l.split('|');const grid=ws.split(';').map(x=>x.split(',')[0]);
  for(const w of [...grid,...(ex?ex.split(','):[])]){words++;if(!ok(w))bad.push(k+':'+w);}
  const base=grid.find(w=>w.length===letters.length);if(base&&isPlural(base))basePl++;if(grid.filter(isPlural).length>1)many++;}
console.log(`${n} niveles, ${words} palabras revisadas · fuera del diccionario: ${bad.length} · ruedas sobre plural: ${basePl} · niveles con 2+ plurales: ${many}`);
if(bad.length)console.log(bad.slice(0,20).join(' '));process.exit(bad.length||basePl||many?1:0);
