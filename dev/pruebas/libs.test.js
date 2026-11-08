// Prueba de las librerías de dev/libs.json: se insertan con /*LIB:nombre*/ y quedan listas para usar sin conexión.
// Necesita "npm install" en dev/ (o SALA_MODULOS apuntando a otra carpeta node_modules). Si faltan, se saltea.
const {execSync}=require('child_process');const path=require('path'),os=require('os'),fs=require('fs');
const libs=Object.keys(require('../libs.json').libs);const out=path.join(os.tmpdir(),'kitlibs.html');
const src=`<title>libs</title><style>/*KIT_CSS*/</style><div class="app"><!--KIT_BAR--><div class="stage" id="stage"></div><nav class="bottom"><button class="bb" id="act"><span id="actTxt">x</span></button><button class="bb" id="restart">r</button></nav></div><!--KIT_SHEETS-->
<script>/*KIT_JS*/</script>`+libs.map(n=>`<script>/*LIB:${n}*/</script>`).join('\n');
const tmp=path.join(os.tmpdir(),'kitlibs.src.html');fs.writeFileSync(tmp,src);
try{execSync(`python3 -c "import sys;sys.path.insert(0,'${path.join(__dirname,'..','herramientas')}');sys.argv=['x','--sin-minificar'];import armar;open('${out}','w').write(armar.con_kit(open('${tmp}').read(),'libs'))"`,{stdio:'pipe'});}
catch(e){console.log('salteada: '+String(e.stderr).trim().split('\n').pop());process.exit(0);}
require('./_base.js')(out,8862,async({p,ok})=>{
  const r=await p.evaluate(()=>{const t={};const tr=(k,f)=>{try{t[k]=!!f();}catch(e){t[k]='error: '+e.message;}};
    tr('gsap',()=>gsap.to(document.body,{opacity:1,duration:.01})&&typeof gsap.timeline==='function');
    tr('matter',()=>{const e=Matter.Engine.create(),b=Matter.Bodies.circle(0,0,5);Matter.Composite.add(e.world,b);Matter.Engine.update(e,16);return b.position.y>0;});
    tr('planck',()=>{const w=new planck.World({gravity:planck.Vec2(0,-10)}),b=w.createDynamicBody(planck.Vec2(0,10));b.createFixture(planck.Circle(1),1);w.step(1/60);return b.getPosition().y<10;});
    tr('pixi',()=>typeof PIXI.Application==='function'&&typeof PIXI.Sprite==='function');
    tr('howler',()=>typeof Howl==='function');
    tr('zzfx',()=>typeof zzfx==='function'&&typeof zzfxV==='number');
    tr('ruido',()=>{const n=SimplexNoise.createNoise2D(()=>.5);const v=n(.3,.7);return v>=-1&&v<=1;});
    tr('confeti',()=>typeof confetti==='function');
    tr('caminos',()=>{const g=new PF.Grid(5,5);g.setWalkableAt(2,0,false);g.setWalkableAt(2,1,false);return new PF.AStarFinder().findPath(0,0,4,0,g).length>5;});
    tr('semilla',()=>{const a=new Math.seedrandom('sala'),b=new Math.seedrandom('sala');return a()===b();});
    tr('el kit sigue funcionando',()=>typeof Input.drag==='function'&&typeof $==='function');
    return t;});
  for(const [k,v] of Object.entries(r))ok(k+(v===true?'':' → '+v),v===true);
});
