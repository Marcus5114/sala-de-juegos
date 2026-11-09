// Verifica el motor de Blackjack: estrategia básica, tiempos de la IA y qué tan difícil es cada mesa.
// Uso: node dev/herramientas/blackjack/verificar.js [mesas por dificultad=200]
const {BJ}=require('../../juegos/blackjack.gen.js');const E=BJ();const N=+(process.argv[2]||200);let mal=0;
const C=s=>{const m={A:1,T:10,J:11,Q:12,K:13};return s.split('').map(x=>({r:m[x]||+x,s:0}));};
function spot(d,mine,up){const T=E.newTable(d,0);T.phase='turnos';T.turn=1;T.hi=0;const s=T.seats[1];s.chips=1000;s.hands=[{cards:C(mine),bet:10,done:false}];
  T.dealer.cards=[C(up)[0],{r:5,s:1}];const c=Array(11).fill(0),n=E.RULES[d].decks*4;for(let v=1;v<=9;v++)c[v]=n;c[10]=n*4;[...C(mine),C(up)[0]].forEach(x=>c[E.val(x.r)]--);
  const e=E.evs(T,1,0,c);return Object.keys(e).sort((a,b)=>e[b]-e[a])[0];}
// estrategia básica conocida (6 mazos; Difícil = el crupier pide con 17 blando, sin rendirse)
const casos=[['T6','T','pedir'],['56','6','doblar'],['T2','4','plantarse'],['T2','2','pedir'],['A7','9','pedir'],['88','T','dividir'],['AA','6','dividir'],
  ['TT','6','plantarse'],['A7','3','doblar'],['93','2','pedir'],['63','3','doblar'],['T3','2','plantarse'],['A2','5','doblar'],['99','7','plantarse'],['99','9','dividir'],['55','9','doblar'],['T7','A','plantarse']];
for(const [m,u,exp] of casos){const got=spot(2,m,u);if(got!==exp){mal++;console.log(`✘ ${m} contra ${u}: dio ${got}, la estrategia básica dice ${exp}`);}}
console.log(`estrategia básica: ${casos.length-mal}/${casos.length} jugadas iguales`);
// con rendición (Fácil): 16 contra 10 se rinde
{const g=spot(0,'T6','T');console.log('16 contra 10 con rendición:',g);if(g!=='rendirse'){mal++;}}
// tiempos
let tmax=0,tsum=0,n=0;
// mesa completa con el jugador manejado por una política
function jugar(d,lvl,pol){const T=E.newTable(d,lvl);let guard=0;
  while(T.phase!=='final'&&guard++<5000){
    if(T.phase==='bet'){const b=T.seats.map((s,i)=>i===1?betYo(T,pol):E.aiBet(T,i));E.placeBets(T,b);continue;}
    const ev=E.step(T);if(ev)continue;
    // decisión
    const s=T.seats[T.turn];let a;const t0=process.hrtime.bigint();
    if(s.who==='ia')a=E.aiAct(T);
    else{if(pol==='perfecto')a=E.advice(T).best;else{const sk=E.SKILL[pol];const e=E.evs(T,1,T.hi,pol==='novato'?full(T):E.unseen(T));a=E.elegir(E.legal(T).filter(x=>x in e).map(x=>({v:x,score:e[x]})),sk,Math.random);}}
    const ms=Number(process.hrtime.bigint()-t0)/1e6;tmax=Math.max(tmax,ms);tsum+=ms;n++;
    if(!E.act(T,a))throw new Error('jugada inválida '+a);}
  const yo=T.seats[1].chips,best=Math.max(T.seats[0].chips,T.seats[2].chips);return {gana:E.gana(T),yo,best,manos:T.hand};}
function full(T){const c=Array(11).fill(0),n=E.RULES[T.d].decks*4;for(let v=1;v<=9;v++)c[v]=n;c[10]=n*4;return c;}
function betYo(T,pol){if(pol==='novato')return 20;if(pol==='perfecto'){T.seats[1].kind='contador';const b=E.aiBet(T,1);delete T.seats[1].kind;return b;}return 20;}
for(let d=0;d<4;d++){const r={};for(const pol of ['novato','basico','perfecto']){let w=0;for(let l=0;l<N;l++)if(jugar(d,l,pol).gana)w++;r[pol]=(100*w/N).toFixed(0)+'%';}
  console.log(`${E.RULES[d].name.padEnd(8)} ganás la mesa: jugando como novato ${r.novato} · con estrategia básica ${r.basico} · perfecto y apostando con la cuenta ${r.perfecto}`);}
console.log(`IA: ${n} decisiones · promedio ${(tsum/n).toFixed(1)} ms · la más lenta ${tmax.toFixed(0)} ms`);
// el mismo nivel sale igual
const a=JSON.stringify(jugar(1,5,'basico')),b=JSON.stringify(jugar(1,5,'basico'));if(a!==b){mal++;console.log('✘ el mismo nivel no da lo mismo');}
process.exitCode=mal?1:0;console.log(mal?mal+' problemas':'todo bien');
