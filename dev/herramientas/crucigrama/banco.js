// Lee dev/datos/crucigrama/n1..n3.txt, normaliza (sin tildes, con Ñ) y verifica cada palabra con el diccionario ortográfico.
// Uso: node dev/herramientas/crucigrama/banco.js   → informe; sale con error si algo no pasa.
// Exporta leer() para el generador y las pruebas.
const fs=require('fs'),path=require('path');
const DIR=path.join(__dirname,'..','..','datos','crucigrama');
const norm=w=>w.toLowerCase().normalize('NFD').replace(/ñ/g,'ñ').replace(/[̀-ͯ]/g,'').toUpperCase();
function leer(){const out=[];
  for(const n of [1,2,3])for(const [k,l] of fs.readFileSync(path.join(DIR,`n${n}.txt`),'utf8').split('\n').entries()){
    if(!l.trim()||l.startsWith('#'))continue;const [w,c]=l.split('|');out.push({orig:w.trim(),w:norm(w.trim()),c:(c||'').trim(),n,linea:`n${n}:${k+1}`});}
  return out;}
module.exports={leer,norm};
if(require.main===module){
  const E=leer(),mal=[];let chk=null;
  try{process.chdir(path.join(__dirname,'..','palabras'));chk=require('../palabras/check.js');}catch(e){console.log('aviso: sin diccionario ('+e.message.split('\n')[0]+'); solo reviso forma');}
  const okMano=new Set(fs.readFileSync(path.join(DIR,'aceptadas.txt'),'utf8').split('\n').filter(l=>!l.startsWith('#')).join(' ').split(/\s+/).filter(Boolean).map(norm));
  const seen=new Map();
  for(const e of E){
    if(!/^[A-ZÑ]+$/.test(e.w))mal.push(`${e.linea} ${e.orig}: caracteres raros`);
    if(e.w.length<3)mal.push(`${e.linea} ${e.orig}: muy corta (mínimo 3)`);
    if(!e.c||e.c.length<4)mal.push(`${e.linea} ${e.orig}: sin pista`);
    if(e.c&&norm(e.c).includes(e.w))mal.push(`${e.linea} ${e.orig}: la pista contiene la palabra`);
    if(chk&&!okMano.has(e.w)&&!chk.ok(e.w.toLowerCase())&&!chk.ok(e.orig.toLowerCase()))mal.push(`${e.linea} ${e.orig}: no está en el diccionario`);
    const k=e.w+'|'+norm(e.c);if(seen.has(k))mal.push(`${e.linea} ${e.orig}: repetida igual que ${seen.get(k)}`);seen.set(k,e.linea);
  }
  const words=new Set(E.map(e=>e.w));const by=[1,2,3].map(n=>new Set(E.filter(e=>e.n===n).map(e=>e.w)).size);
  console.log(`${E.length} pistas · ${words.size} palabras distintas · por nivel ${by.join(' / ')}`);
  const len={};E.forEach(e=>len[e.w.length]=(len[e.w.length]||0)+1);console.log('largos',JSON.stringify(len));
  mal.forEach(m=>console.log('  ✘ '+m));process.exitCode=mal.length?1:0;if(!mal.length)console.log('todo bien');
}
