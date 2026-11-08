// Base común de las pruebas: sirve un archivo armado, abre un celular simulado (390×800, táctil) y da utilidades.
// Uso: require('./_base.js')(archivo, puerto, async ({p,ok,D,fits,cpuIdle,ctx})=>{ … })
const {chromium}=require('playwright');const fs=require('fs'),http=require('http'),path=require('path');
module.exports=async function(file,port,body){
  const srv=http.createServer((q,r)=>{const html=fs.readFileSync(file,'utf8');r.writeHead(200,{'content-type':'text/html'});
    r.end(html.startsWith('<!doctype')?html:'<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>'+html+'</body></html>');}).listen(port);
  let pass=0,fail=0;const ok=(m,c)=>{console.log((c?'OK   ':'FAIL ')+m);c?pass++:fail++;};
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:800},deviceScaleFactor:2,hasTouch:true,isMobile:true});const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:'+port+'/');await p.waitForTimeout(400);
  if(await p.isVisible('[data-pane=help]'))await p.click('[data-pane=help] [data-close]');
  const D=path.join(__dirname,'capturas')+'/';fs.mkdirSync(D,{recursive:true});
  const fits=async()=>p.evaluate(()=>!(document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight+1));
  const cpuIdle=async()=>{const cdp=await ctx.newCDPSession(p);await cdp.send('Performance.enable');const g=async()=>(await cdp.send('Performance.getMetrics')).metrics.reduce((a,x)=>(a[x.name]=x.value,a),{});
    const m0=await g();await p.waitForTimeout(3000);const m1=await g();return (m1.TaskDuration-m0.TaskDuration)/(m1.Timestamp-m0.Timestamp)*100;};
  try{await body({p,ok,D,fits,cpuIdle,ctx,b});}catch(e){ok('excepción: '+e.message.split('\n')[0],false);}
  const real=errs.filter(e=>!/ServiceWorker/.test(e));if(real.length)ok('errores en la página: '+real.join(' | '),false);
  console.log(`\n${pass} OK, ${fail} fallas`);await b.close();srv.close();process.exitCode=fail?1:0;
};
