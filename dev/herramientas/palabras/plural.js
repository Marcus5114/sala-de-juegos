// Plurales de sustantivos y adjetivos según el diccionario ortográfico (reglas S y G de hunspell, español general y de Argentina).
// isPlural(w): w (sin tildes) es plural generado por esas reglas y no es además una palabra base del diccionario (lunes, crisis, virus…).
const fs=require('fs');
const norm=w=>w.toLowerCase().replace(/ñ/g,'\u0001').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\u0001/g,'ñ');
const plural=new Set(),stems=new Set();
for(const d of ['dictionary-es','dictionary-es-ar']){
  const aff=fs.readFileSync(require.resolve(d+'/index.aff'),'utf8').split('\n'),rules={};
  for(const l of aff){const m=l.match(/^SFX\s+([SG])\s+(\S+)\s+(\S+)\s+(\S+)/);if(!m||/^[YN]$/.test(m[2])&&/^\d+$/.test(m[3]))continue;
    const [,f,strip,add,cond]=m;(rules[f]=rules[f]||[]).push({strip:strip==='0'?'':strip,add:add==='0'?'':add.split('/')[0],re:new RegExp(cond==='.'?'$':cond+'$')});}
  for(const l of fs.readFileSync(require.resolve(d+'/index.dic'),'utf8').split('\n').slice(1)){
    const [w,fl='']=l.split('/');if(!w||/[A-Z0-9]/.test(w[0]))continue;stems.add(norm(w));
    for(const f of ['S','G'])if(fl.includes(f))for(const r of rules[f]||[])if(r.re.test(w)&&w.endsWith(r.strip)){const out=w.slice(0,w.length-r.strip.length)+r.add;if(out.endsWith('s'))plural.add(norm(out));}}
}
const {ok}=require('./check.js');
// también participios en plural (unidas, cansados): -dos/-das cuyo singular existe
const isPlural=w=>(plural.has(w)&&!stems.has(w))||(/[ai]d[oa]s$/.test(w)&&ok(w.slice(0,-1)));
module.exports={isPlural};
if(require.main===module)for(const w of process.argv.slice(2))console.log(w,isPlural(w));
