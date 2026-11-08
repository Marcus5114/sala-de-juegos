// Verifica palabras sin tildes contra los diccionarios ortográficos de LibreOffice (español general y de Argentina).
// Una palabra vale si ella misma o alguna versión con una tilde (o con ü) está en el diccionario, en minúscula.
const fs=require('fs'),nspell=require('nspell');
const load=d=>nspell(fs.readFileSync(require.resolve(d+'/index.aff')),fs.readFileSync(require.resolve(d+'/index.dic')));
const S=[load('dictionary-es'),load('dictionary-es-ar')];
const AC={a:'á',e:'é',i:'í',o:'ó',u:'ú'};
const memo=new Map();
function ok(w){if(memo.has(w))return memo.get(w);
  const v=[w];for(let i=0;i<w.length;i++){if(AC[w[i]])v.push(w.slice(0,i)+AC[w[i]]+w.slice(i+1));if(w[i]==='u'&&w[i-1]==='g')v.push(w.slice(0,i)+'ü'+w.slice(i+1));}
  const r=v.some(x=>S.some(s=>s.correct(x)));memo.set(w,r);return r;}
module.exports={ok};
if(require.main===module){for(const w of process.argv.slice(2))console.log(w,ok(w));}
