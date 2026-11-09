/*GEN*/
/* ---------- Blackjack: motor de mesa y de IA ----------
   Todo vive en BJ(), una función sin nada de afuera: así corre igual en la página, en segundo plano (kitWorker(BJ)) y en node.
   La mesa es un torneo: vos y dos rivales empiezan con las mismas fichas; gana quien termina con más al cabo de N manos.
   La dificultad sube por dos lados: reglas de la casa más duras y rivales más hábiles.
   Cartas: {r:1..13, s:0..3} (1 = as; 11, 12, 13 = J, Q, K). Para las cuentas, 10, J, Q y K valen 10. */
function BJ(){
  const RULES=[
    {name:'Fácil',  decks:2,h17:false,bj:1.5,surr:true, das:true, hands:10,rivals:['novato','novato'],  meta:0,  par:180},
    {name:'Media',  decks:4,h17:false,bj:1.5,surr:true, das:true, hands:12,rivals:['novato','basico'],  meta:0,  par:240},
    {name:'Difícil',decks:6,h17:true, bj:1.5,surr:false,das:true, hands:14,rivals:['basico','contador'],meta:200,par:300},
    {name:'Experto',decks:6,h17:true, bj:1.2,surr:false,das:false,hands:16,rivals:['contador','contador'],meta:260,par:360}
  ];
  const START=200,MINB=10,MAXB=100;
  // rivales: cómo juegan (temp: cuánto se aleja de la mejor jugada; error: cada tanto, una jugada al azar) y cómo apuestan
  const SKILL={
    novato:  {name:'Novato',  temp:.35,error:.12,cuenta:false,apuesta:'azar'},
    basico:  {name:'Prolija', temp:0,  error:0,  cuenta:false,apuesta:'fija'},
    contador:{name:'Contador',temp:0,  error:0,  cuenta:true, apuesta:'cuenta'}
  };
  const NOMBRES={novato:['Tito','Pocha','Beto'],basico:['Marta','Inés','Ramiro'],contador:['Doc','Lola','Vera']};
  function rngOf(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  const val=r=>r>=10?10:r;
  function total(cards){let h=0,a=false;for(const c of cards){const v=val(c.r);h+=v;if(v===1)a=true;}const soft=a&&h+10<=21;return {t:soft?h+10:h,soft,h,a};}
  const isBJ=cards=>cards.length===2&&total(cards).t===21;
  const hilo=r=>{const v=val(r);return v>=2&&v<=6?1:v===1||v===10?-1:0;};

  /* ---------- mazo ---------- */
  function buildShoe(T){const R=RULES[T.d],rnd=rngOf(T.seed*7+T.shuffles*104729+13),s=[];
    for(let k=0;k<R.decks;k++)for(let su=0;su<4;su++)for(let r=1;r<=13;r++)s.push({r,s:su});
    for(let i=s.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[s[i],s[j]]=[s[j],s[i]];}
    T.shoe=s;T.pos=0;T.cut=Math.floor(s.length*.72);T.rc=0;T.shuffles++;}
  function draw(T,visible=true){const c=T.shoe[T.pos++];if(visible)T.rc+=hilo(c.r);return c;}
  // cartas que nadie vio todavía (el resto del mazo más la tapada del crupier), por valor 1..10
  function unseen(T){const c=Array(11).fill(0);for(let i=T.pos;i<T.shoe.length;i++)c[val(T.shoe[i].r)]++;
    if(T.dealer.cards.length>1&&!T.dealer.open)c[val(T.dealer.cards[1].r)]++;return c;}
  function fullShoe(T){const c=Array(11).fill(0),n=RULES[T.d].decks*4;for(let v=1;v<=9;v++)c[v]=n;c[10]=n*4;return c;}

  /* ---------- mesa ---------- */
  function newTable(d,lvl){const R=RULES[d],seed=(d+1)*1000003+lvl*7919;const rnd=rngOf(seed+5);
    const pick=k=>NOMBRES[k][Math.floor(rnd()*NOMBRES[k].length)];
    const seats=[{who:'ia',kind:R.rivals[0],name:pick(R.rivals[0])},{who:'yo',name:'Vos'},{who:'ia',kind:R.rivals[1],name:pick(R.rivals[1])}];
    if(seats[2].name===seats[0].name)seats[2].name=NOMBRES[R.rivals[1]].find(n=>n!==seats[0].name);
    seats.forEach(s=>Object.assign(s,{chips:START,bet:0,hands:[],out:false,last:MINB*2}));
    const T={d,lvl,seed,shuffles:0,hand:0,phase:'bet',seats,dealer:{cards:[],open:false},turn:-1,hi:0,acts:0,res:null};
    buildShoe(T);return T;}
  // apuestas: las de los rivales las decide su IA; la tuya llega de afuera
  function aiBet(T,i){const s=T.seats[i],R=RULES[T.d],sk=SKILL[s.kind],rnd=rngOf(T.seed+T.hand*31+i*7);
    if(s.chips<MINB)return 0;let b;
    if(sk.apuesta==='azar')b=[10,20,20,30,50][Math.floor(rnd()*5)];
    else if(sk.apuesta==='fija')b=20;
    else{const decksLeft=Math.max(.5,(T.shoe.length-T.pos)/52),tc=T.rc/decksLeft;b=10*Math.max(1,Math.min(8,Math.floor(tc)+1));}
    // torneo: en las últimas manos, el que va atrás arriesga y el que va adelante cuida
    if(sk.apuesta!=='azar'){const left=R.hands-T.hand,lead=Math.max(...T.seats.filter((x,j)=>j!==i).map(x=>x.chips));
      if(left<=3){if(s.chips<lead)b=Math.max(b,Math.min(MAXB,lead-s.chips+10));else if(s.chips-lead>MAXB*left)b=MINB;}}
    return Math.max(MINB,Math.min(b,MAXB,s.chips,Math.floor(s.chips/10)*10||MINB));}
  function placeBets(T,bets){// bets: [b0,b1,b2]
    T.seats.forEach((s,i)=>{const b=Math.min(bets[i]||0,s.chips);s.out=b<MINB;s.bet=s.out?0:b;s.hands=[];});
    T.dealer={cards:[],open:false};T.phase='deal';T.q=[];T.res=null;
    // orden de reparto: cada asiento con apuesta, el crupier; dos vueltas (la segunda del crupier, tapada)
    for(let k=0;k<2;k++){T.seats.forEach((s,i)=>{if(!s.out)T.q.push([i,0]);});T.q.push(['d',k===1]);}
    T.seats.forEach(s=>{if(!s.out){s.hands=[{cards:[],bet:s.bet,done:false}];s.chips-=s.bet;}});}
  // un paso automático; devuelve el evento para animar, o null si hace falta una decisión
  function step(T){
    if(T.phase==='deal'){
      if(T.pos>=T.shoe.length-1)buildShoe(T);
      const [to,down]=T.q.shift();
      if(to==='d'){const c=draw(T,!down);T.dealer.cards.push(c);if(!T.q.length)T.phase='peek';return {t:'carta',to:'d',c,down:!!down};}
      const h=T.seats[to].hands[0],c=draw(T);h.cards.push(c);return {t:'carta',to,hi:0,c};}
    if(T.phase==='peek'){const up=val(T.dealer.cards[0].r);T.phase='turnos';T.turn=-1;
      if((up===1||up===10)&&isBJ(T.dealer.cards)){T.dealer.open=true;T.rc+=hilo(T.dealer.cards[1].r);T.phase='pago';return {t:'blackjack'};}
      T.seats.forEach(s=>s.hands.forEach(h=>{if(isBJ(h.cards))h.done=true;}));return {t:'mira',bj:false,peek:up===1||up===10};}
    if(T.phase==='turnos'){
      // siguiente mano que necesita decisión
      const cur=T.turn>=0&&T.seats[T.turn].hands[T.hi];
      if(cur&&!cur.done){// mano partida a la que le falta la segunda carta
        if(cur.cards.length<2){const c=draw(T);cur.cards.push(c);if(cur.cards[0].r===1&&cur.split||total(cur.cards).t===21)cur.done=true;return {t:'carta',to:T.turn,hi:T.hi,c};}
        return null;}
      for(let i=Math.max(0,T.turn);i<3;i++){const s=T.seats[i];if(s.out)continue;
        for(let k=i===T.turn?T.hi:0;k<s.hands.length;k++)if(!s.hands[k].done||s.hands[k].cards.length<2){T.turn=i;T.hi=k;return {t:'turno',to:i,hi:k};}}
      T.phase='crupier';T.dealer.open=true;T.rc+=hilo(T.dealer.cards[1].r);return {t:'destapa',c:T.dealer.cards[1]};}
    if(T.phase==='crupier'){const live=T.seats.some(s=>s.hands.some(h=>!h.bust&&!h.surr&&!(isBJ(h.cards)&&!h.split)));
      const {t,soft}=total(T.dealer.cards);
      if(live&&(t<17||(t===17&&soft&&RULES[T.d].h17))){if(T.pos>=T.shoe.length)buildShoe(T);const c=draw(T);T.dealer.cards.push(c);return {t:'carta',to:'d',c};}
      T.phase='pago';return {t:'planta',total:t};}
    if(T.phase==='pago'){const R=RULES[T.d],dt=total(T.dealer.cards).t,dbj=isBJ(T.dealer.cards);T.res=[];
      T.seats.forEach((s,i)=>s.hands.forEach((h,k)=>{let win;const pt=total(h.cards).t,pbj=isBJ(h.cards)&&!h.split;
        if(h.surr)win=-.5;else if(h.bust)win=-1;else if(dbj)win=pbj?0:-1;else if(pbj)win=R.bj;else if(dt>21||pt>dt)win=1;else if(pt===dt)win=0;else win=-1;
        const back=Math.round(h.bet+h.bet*win);s.chips+=back;T.res.push({to:i,hi:k,win,delta:back-h.bet,kind:h.surr?'rinde':h.bust?'pasa':pbj&&win>0?'bj':win>0?'gana':win===0?'empata':'pierde'});}));
      T.hand++;T.phase='fin';return {t:'pago',res:T.res};}
    if(T.phase==='fin'){const R=RULES[T.d];
      if(T.pos>=T.cut){buildShoe(T);T.phase=T.seats[1].chips<MINB||T.hand>=R.hands?'final':'bet';return {t:'baraja'};}
      T.phase=T.seats[1].chips<MINB||T.hand>=R.hands?'final':'bet';return {t:'limpia'};}
    return null;}
  // decisiones
  function legal(T){const s=T.seats[T.turn],h=s&&s.hands[T.hi];if(T.phase!=='turnos'||!h||h.done||h.cards.length<2)return [];
    const R=RULES[T.d],two=h.cards.length===2,a=['plantarse','pedir'];
    if(two&&s.chips>=h.bet&&(!h.split||R.das))a.push('doblar');
    if(two&&!h.split&&s.hands.length===1&&val(h.cards[0].r)===val(h.cards[1].r)&&s.chips>=h.bet)a.push('dividir');
    if(two&&!h.split&&s.hands.length===1&&R.surr)a.push('rendirse');return a;}
  function act(T,a){const s=T.seats[T.turn],h=s.hands[T.hi];if(!legal(T).includes(a))return null;T.acts++;
    if(a==='plantarse'){h.done=true;return {t:'planta',to:T.turn,hi:T.hi};}
    if(a==='rendirse'){h.done=true;h.surr=true;return {t:'rinde',to:T.turn,hi:T.hi};}
    if(a==='pedir'||a==='doblar'){if(a==='doblar'){s.chips-=h.bet;h.bet*=2;h.doubled=true;}if(T.pos>=T.shoe.length)buildShoe(T);
      const c=draw(T);h.cards.push(c);const t=total(h.cards).t;if(t>21){h.bust=true;h.done=true;}else if(t===21||a==='doblar')h.done=true;
      return {t:'carta',to:T.turn,hi:T.hi,c,doble:a==='doblar'};}
    if(a==='dividir'){s.chips-=h.bet;const h2={cards:[h.cards.pop()],bet:h.bet,done:false,split:true};h.split=true;s.hands.push(h2);return {t:'divide',to:T.turn};}}

  /* ---------- cuentas: valor esperado de cada jugada según las cartas que faltan salir ----------
     Para el crupier se calcula la distribución exacta sacando cartas una por una (sabiendo que no tiene blackjack, porque ya miró).
     Para el jugador también se sacan sus cartas al pedir. Es exacto salvo un detalle: el crupier usa el mazo que hay ahora. */
  function dealerDist(up,cnt,h17){const memo=new Map(),c=cnt.slice();
    function rec(h,a,n){const t=a&&h+10<=21?h+10:h,soft=a&&h+10<=21;
      if(h>21)return [0,0,0,0,0,1];
      if(n>=2&&(t>=18||(t===17&&!(h17&&soft)))){const o=[0,0,0,0,0,0];o[t-17]=1;return o;}
      const key=h*2+(a?1:0)+(n===1?'|1|':'|2|')+c.join(',');const m=memo.get(key);if(m)return m;
      let tot=0;for(let r=1;r<=10;r++)tot+=c[r];
      // la tapada no puede completar un blackjack (ya se miró)
      let excl=0;if(n===1){if(up===1)excl=10;else if(up===10)excl=1;}
      if(excl)tot-=c[excl];
      const o=[0,0,0,0,0,0];
      for(let r=1;r<=10;r++){if(!c[r]||r===excl)continue;const p=c[r]/tot;c[r]--;const s=rec(h+r,a||r===1,n+1);c[r]++;for(let k=0;k<6;k++)o[k]+=p*s[k];}
      memo.set(key,o);return o;}
    return rec(up,up===1,1);}
  function standEV(t,D){if(t>21)return -1;let ev=D[5];for(let k=0;k<5;k++){const dt=17+k;ev+=dt<t?D[k]:dt>t?-D[k]:0;}return ev;}
  function evs(T,i,hi,cnt){// valores esperados de las jugadas posibles (en unidades de apuesta)
    const R=RULES[T.d],s=T.seats[i],h=s.hands[hi],up=val(T.dealer.cards[0].r),c=cnt.slice();
    const D=dealerDist(up,c,R.h17),memo=new Map();
    function best(hh,a,n,canDbl){// mejor valor desde un total, pudiendo pedir
      const t=a&&hh+10<=21?hh+10:hh;if(hh>21)return -1;const st=standEV(t,D);if(t===21)return st;
      const key=hh*2+(a?1:0)+'|'+c.join(',');let hv=memo.get(key);
      if(hv===undefined){let tot=0;for(let r=1;r<=10;r++)tot+=c[r];hv=0;
        for(let r=1;r<=10;r++){if(!c[r])continue;const p=c[r]/tot;c[r]--;hv+=p*best(hh+r,a||r===1,n+1,false);c[r]++;}memo.set(key,hv);}
      return Math.max(st,hv);}
    function hitEV(hh,a){let tot=0;for(let r=1;r<=10;r++)tot+=c[r];let ev=0;
      for(let r=1;r<=10;r++){if(!c[r])continue;const p=c[r]/tot;c[r]--;ev+=p*best(hh+r,a||r===1,0,false);c[r]++;}return ev;}
    function dblEV(hh,a){let tot=0;for(let r=1;r<=10;r++)tot+=c[r];let ev=0;
      for(let r=1;r<=10;r++){if(!c[r])continue;const p=c[r]/tot;const h2=hh+r,a2=a||r===1;ev+=p*(h2>21?-1:standEV(a2&&h2+10<=21?h2+10:h2,D));}return 2*ev;}
    const {h:hh,a}=total(h.cards),out={};const L=legal(T).length?legal(T):['plantarse','pedir'];
    out.plantarse=standEV(total(h.cards).t,D);
    if(L.includes('pedir'))out.pedir=hitEV(hh,a);
    if(L.includes('doblar'))out.doblar=dblEV(hh,a);
    if(L.includes('rendirse'))out.rendirse=-.5;
    if(L.includes('dividir')){const v=val(h.cards[0].r);let ev=0,tot=0;for(let r=1;r<=10;r++)tot+=c[r];
      for(let r=1;r<=10;r++){if(!c[r])continue;const p=c[r]/tot;c[r]--;const h2=v+r,a2=v===1||r===1,t2=a2&&h2+10<=21?h2+10:h2;
        let e;if(v===1)e=standEV(t2,D);else{e=Math.max(standEV(t2,D),hitEV(h2,a2));if(R.das)e=Math.max(e,dblEV(h2,a2));}ev+=p*e;c[r]++;}
      out.dividir=2*ev;}
    return out;}
  // consejo para el jugador: con las cartas que faltan salir
  function advice(T){const t0=Date.now();const e=evs(T,T.turn,T.hi,unseen(T));const best=Object.keys(e).sort((x,y)=>e[y]-e[x])[0];return {evs:e,best,ms:Date.now()-t0};}
  // jugada de un rival: estrategia básica (mazo completo) o según la cuenta, con errores creíbles según su nivel
  function aiAct(T){const s=T.seats[T.turn],sk=SKILL[s.kind];const L=legal(T);if(!L.length)return null;
    const e=evs(T,T.turn,T.hi,sk.cuenta?unseen(T):fullShoeMinus(T));const ops=L.filter(a=>a in e).map(a=>({v:a,score:e[a]}));
    const rnd=rngOf(T.seed+T.hand*131+T.turn*17+T.acts*7);return elegir(ops,sk,rnd);}
  function fullShoeMinus(T){const c=fullShoe(T),h=T.seats[T.turn].hands[T.hi];h.cards.concat([T.dealer.cards[0]]).forEach(x=>c[val(x.r)]--);return c;}
  // dificultad: con temperatura 0 siempre la mejor; con temperatura, más chances para las jugadas cercanas a la mejor; con error, una al azar
  function elegir(ops,{temp=0,error=0},rnd=Math.random){if(!ops.length)return null;const sorted=ops.slice().sort((a,b)=>b.score-a.score);
    if(error&&rnd()<error)return sorted[Math.floor(rnd()*sorted.length)].v;
    if(!temp)return sorted[0].v;const m=sorted[0].score,w=sorted.map(o=>Math.exp((o.score-m)/temp)),S=w.reduce((a,b)=>a+b,0);
    let x=rnd()*S;for(let k=0;k<w.length;k++){x-=w[k];if(x<=0)return sorted[k].v;}return sorted[0].v;}
  // ganás la mesa si terminás primero (o empatado arriba) y, en las difíciles, con la meta de fichas
  function gana(T){const yo=T.seats[1].chips;return yo>=E_MIN()&&yo>=Math.max(T.seats[0].chips,T.seats[2].chips)&&yo>=RULES[T.d].meta;}
  const E_MIN=()=>MINB;
  function standings(T){return T.seats.map((s,i)=>({i,chips:s.chips})).sort((a,b)=>b.chips-a.chips);}
  return {gana,RULES,SKILL,START,MINB,MAXB,val,total,isBJ,newTable,aiBet,placeBets,step,legal,act,evs,advice,aiAct,elegir,unseen,dealerDist,standings,hilo};
}
/*END_GEN*/
if(typeof module!=='undefined')module.exports={BJ};
