// Corre todas las pruebas sobre una sala recién armada.
// Uso: node dev/pruebas/todas.js [carpeta]   (sin carpeta: arma en una carpeta temporal)
//      node dev/pruebas/todas.js --solo encastre,puentes
// Para cada juego: sus pruebas propias (dev/pruebas/<id>.test.js) o, si no tiene, la de humo;
// si usa kitStart, además la prueba común del kit (_generico.js). Al final: kit, menú y sin conexión.
const {execFileSync,spawnSync}=require('child_process');const path=require('path'),fs=require('fs'),os=require('os');
const DEV=path.join(__dirname,'..');const REG=require('../juegos.json').juegos;
const args=process.argv.slice(2);const solo=args.includes('--solo')?args[args.indexOf('--solo')+1].split(','):null;
let out=args.find(a=>!a.startsWith('--')&&a!==(solo||[]).join(','));
if(!out){out=fs.mkdtempSync(path.join(os.tmpdir(),'sala-'));console.log('armando en',out);execFileSync('python3',[path.join(DEV,'herramientas','armar.py'),out],{stdio:'inherit'});}
const res=[];
function run(nombre,file,...a){const t0=Date.now();const r=spawnSync('node',[path.join(__dirname,file),...a],{encoding:'utf8',timeout:600000});
  const txt=(r.stdout||'')+(r.stderr||'');const oks=(txt.match(/^OK/gm)||[]).length,fails=txt.split('\n').filter(l=>/^FAIL/.test(l));
  const bien=r.status===0&&fails.length===0;res.push({nombre,oks,fails,bien,seg:((Date.now()-t0)/1000).toFixed(0)});
  console.log(`${bien?'✔':'✘'} ${nombre.padEnd(26)} ${String(oks).padStart(3)} OK${fails.length?'  '+fails.length+' fallas':''}  (${res.at(-1).seg} s)`);
  if(!bien){fails.forEach(f=>console.log('     '+f));if(!fails.length)console.log(txt.split('\n').slice(-6).map(l=>'     '+l).join('\n'));}}
let port=8900;
for(const j of REG){if(solo&&!solo.includes(j.id))continue;const f=path.join(out,'games',j.id,'index.html');
  const own=fs.existsSync(path.join(__dirname,j.id+'.test.js'));run(j.id,own?j.id+'.test.js':'_humo.js',f,...(own?[]:[String(port++)]));
  const src=fs.readFileSync(path.join(DEV,'juegos',j.fuente),'utf8');if(/kitStart\(\{/.test(src))run(j.id+' · kit',' _generico.js'.trim(),f,String(port++));}
if(!solo){run('kit (laboratorio)','kit.test.js');run('librerías','libs.test.js');run('fondos','fondos.test.js',path.join(out,'games','puentes','index.html'));run('menú','sala.test.js',out);run('sin conexión','sinconexion.test.js',out);}
const mal=res.filter(r=>!r.bien);console.log(`\n${res.length-mal.length}/${res.length} grupos bien · ${res.reduce((a,r)=>a+r.oks,0)} pruebas OK`+(mal.length?` · fallan: ${mal.map(r=>r.nombre).join(', ')}`:''));
process.exitCode=mal.length?1:0;
