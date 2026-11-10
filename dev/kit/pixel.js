/* ---------- Sprites y modo píxel ----------
   Pixel.svg(filas, paleta, {tam, clase}) dibuja un sprite escrito como texto: cada carácter es un píxel y la paleta dice su color.
     Pixel.svg(['.##.','####','.##.'],{'#':'var(--x2)'},{tam:24})
   '.' y ' ' son transparentes. Las filas seguidas del mismo color se juntan en un solo rectángulo (pocos nodos, archivo chico).
   Pixel.url(…) da lo mismo como url() para usar de fondo en CSS. Pixel.modo(true|false) prende la clase px en <html>.
   Pixel.SPR tiene los sprites comunes de la sala (palos, flechas, bandera, mina, foco, estrella, moneda, corazón, tilde, cruz).
   No depende del resto del kit: también lo usan los juegos que no son kitStart. */
const Pixel=(()=>{
  function rects(rows,pal){let out='';const h=rows.length;
    for(let y=0;y<h;y++){const r=rows[y];let x=0;
      while(x<r.length){const ch=r[x];if(ch==='.'||ch===' '||!(ch in pal)){x++;continue;}let w=1;while(r[x+w]===ch)w++;
        out+=`<rect x="${x}" y="${y}" width="${w}" height="1" fill="${pal[ch]}"/>`;x+=w;}}
    return out;}
  function svg(rows,pal,{tam=null,clase='spr',extra=''}={}){const w=Math.max(...rows.map(r=>r.length)),h=rows.length;
    const size=tam?` width="${typeof tam==='number'?tam*w/Math.max(w,h):tam}" height="${typeof tam==='number'?tam*h/Math.max(w,h):tam}"`:'';
    return `<svg class="${clase}" viewBox="0 0 ${w} ${h}"${size} shape-rendering="crispEdges" aria-hidden="true" ${extra}>${rects(rows,pal)}</svg>`;}
  const url=(rows,pal)=>`url("data:image/svg+xml,${encodeURIComponent(svg(rows,pal).replace('class="spr" ','xmlns="http://www.w3.org/2000/svg" '))}")`;
  // círculo pixelado de n×n: '#' relleno y 'o' borde
  function circulo(n){const r=n/2,rows=[];for(let y=0;y<n;y++){let t='';for(let x=0;x<n;x++){const d=Math.hypot(x+.5-r,y+.5-r);t+=d<=r-1.15?'#':d<=r?'o':'.';}rows.push(t);}return rows;}
  // un sprite dentro de un SVG, en x,y con ancho y alto dados
  const en=(x,y,w,h,rows,pal)=>`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${Math.max(...rows.map(r=>r.length))} ${rows.length}" shape-rendering="crispEdges" overflow="visible">${rects(rows,pal)}</svg>`;
  // relieve en escalón de los bloques píxel (luz arriba a la izquierda, sombra abajo a la derecha)
  const BISEL='inset -3px -3px 0 rgba(0,0,0,.38),inset 3px 3px 0 rgba(255,255,255,.28)';
  function modo(on){document.documentElement.classList.toggle('px',!!on);}
  // sprites comunes (7×7 salvo indicación). # = color principal, o = contorno o detalle, w = brillo
  const S={
    pica:['...#...','..###..','.#####.','#######','#######','.#.#.#.','..###..'],
    corazon:['.##.##.','#######','#######','#######','.#####.','..###..','...#...'],
    diamante:['...#...','..###..','.#####.','#######','.#####.','..###..','...#...'],
    trebol:['..###..','..###..','##.#.##','#######','##.#.##','...#...','..###..'],
    flechaDer:['...#...','...##..','#######','#######','...##..','...#...','.......'],
    flechaAbajo:['..##...','..##...','..##...','#######','.#####.','..###..','...#...'],
    bandera:['.##....','.####..','.######','.####..','.##....','.#.....','###....'],
    mina:['...#...','.#####.','##ww###','#w#####','#######','.#####.','...#...'],
    foco:['..###..','.#ww##.','.#w###.','.#####.','..###..','..ooo..','..ooo..'],
    estrella:['...#...','...#...','#######','.#####.','..###..','.##.##.','##...##'],
    moneda:['..###..','.#ooo#.','#ow#oo#','#o#ooo#','#oooo#.','.#ooo#.','..###..'],
    pala:['.....##','....###','...###.','..#.#..','.#.....','##.....','#......'],
    tilde:['......#','.....##','#...##.','##.##..','.###...','..#....','.......'],
    cruz:['##...##','.##.##.','..###..','..###..','.##.##.','##...##','.......']
  };
  // paleta común (la misma que --x0 … --x15 en pixel.css)
  const PAL=['#1a1c2c','#5d275d','#b13e53','#ef7d57','#ffcd75','#a7f070','#38b764','#257179','#29366f','#3b5dc9','#41a6f6','#73eff7','#f4f4f4','#94b0c2','#566c86','#333c57'];
  // el fondo de todos los temas Píxel: estrellas cuadradas que titilan sobre azul noche
  const FONDO={p:[['estrellas',['#f4f4f4','#73eff7','#ffcd75']]]};
  return {svg,url,modo,SPR:S,rects,PAL,FONDO,circulo,en,BISEL};
})();
