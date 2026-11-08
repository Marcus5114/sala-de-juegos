// Prueba mínima para juegos sin pruebas propias: carga sin errores, entra en la pantalla y no consume en reposo.
// Uso: node dev/pruebas/_humo.js games/<id>/index.html [puerto]
require('./_base.js')(process.argv[2],+(process.argv[3]||8898),async({p,ok,fits,cpuIdle})=>{
  ok('carga y muestra algo',await p.evaluate(()=>document.body.innerText.trim().length>0));
  ok('sin desborde',await fits());
  await p.waitForTimeout(3000);// deja terminar la animación de entrada (Spider reparte las cartas)
  const idle=await cpuIdle();ok(`en reposo no consume (${idle.toFixed(2)} %)`,idle<0.5);
});
