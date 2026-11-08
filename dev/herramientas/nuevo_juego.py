"""Crea un juego nuevo a partir de la plantilla del kit, listo para armar y probar.

Uso:  python3 dev/herramientas/nuevo_juego.py <id> "<Nombre>" [--color '#2b2f36'] [--cat puzzle]
      python3 dev/herramientas/nuevo_juego.py --quitar <id>      (deshace lo que hizo el comando anterior)

Qué hace:
  1. dev/juegos/<id>.src.html     ← dev/kit/plantilla.src.html (un juego chico que ya funciona)
  2. dev/pruebas/<id>.test.js     ← dev/kit/plantilla.test.js
  3. dev/iconos/<id>.png          ← ícono provisorio de 192×192 (color + inicial)
  4. dev/juegos.json              ← lo agrega primero (primero en los atajos de Android)
  5. dev/sala/sala.src.html       ← lo agrega al menú con un logo provisorio
Después:  python3 dev/herramientas/armar.py /tmp/sala --solo <id>
          node dev/pruebas/<id>.test.js /tmp/sala/games/<id>/index.html
          node dev/pruebas/_generico.js /tmp/sala/games/<id>/index.html"""
import os,re,sys,json,shutil
DEV=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J=lambda *a:os.path.join(DEV,*a)
REG=J('juegos.json');SALA=J('sala','sala.src.html')

def leer_reg():return json.load(open(REG))
def escribir_reg(r):
    # una línea por juego, como está escrito a mano
    lines=',\n'.join('    '+json.dumps(j,ensure_ascii=False,separators=(',',':')) for j in r['juegos'])
    open(REG,'w').write('{\n  "_ayuda": '+json.dumps(r['_ayuda'],ensure_ascii=False)+',\n  "juegos": [\n'+lines+'\n  ]\n}\n')

def icono(gid,nombre,color,out):
    try:
        from PIL import Image,ImageDraw,ImageFont
    except ImportError:
        shutil.copy(J('iconos','icon-192.png'),out);return
    im=Image.new('RGB',(192,192),color);d=ImageDraw.Draw(im)
    r,g,b=(int(color[i:i+2],16) for i in (1,3,5));fg='#18181a' if (r*299+g*587+b*114)/1000>150 else '#ffffff'
    font=None
    for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','/System/Library/Fonts/Supplemental/Arial Bold.ttf','C:/Windows/Fonts/arialbd.ttf']:
        if os.path.exists(f):font=ImageFont.truetype(f,104);break
    d.text((96,98),nombre[0].upper(),fill=fg,font=font or ImageFont.load_default(),anchor='mm')
    im.save(out)

def crear(gid,nombre,color,cat):
    if not re.fullmatch(r'[a-z][a-z0-9]{1,20}',gid):raise SystemExit('el id va en minúsculas, sin espacios ni guiones (ej: laberinto)')
    if not re.fullmatch(r'#[0-9a-fA-F]{6}',color):raise SystemExit('el color va como #rrggbb')
    r=leer_reg()
    if any(j['id']==gid for j in r['juegos']):raise SystemExit(f'ya existe un juego "{gid}"')
    src=J('juegos',gid+'.src.html')
    for f in [src,J('pruebas',gid+'.test.js')]:
        if os.path.exists(f):raise SystemExit(f'ya existe {f}')
    sub=lambda s:s.replace('__ID__',gid).replace('__NOMBRE__',nombre)
    open(src,'w').write(sub(open(J('kit','plantilla.src.html')).read()))
    open(J('pruebas',gid+'.test.js'),'w').write(sub(open(J('kit','plantilla.test.js')).read()))
    icono(gid,nombre,color,J('iconos',gid+'.png'))
    r['juegos'].insert(0,{'id':gid,'nombre':nombre,'fuente':gid+'.src.html','color':color});escribir_reg(r)
    sala=open(SALA).read();k='const GAMES=[\n'
    assert k in sala,'no encontré la lista GAMES en el menú'
    fg='#18181a' if sum(int(color[i:i+2],16)*w for i,w in ((1,299),(3,587),(5,114)))/1000>150 else '#ffffff'
    logo=(f'<svg viewBox="0 0 120 120" aria-hidden="true"><rect width="120" height="120" fill="{color}"/>'
          f'<text x="60" y="80" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="58" text-anchor="middle" fill="{fg}">{nombre[0].upper()}</text></svg>')
    entry=(f"  {{id:'{gid}',name:'{nombre}',cat:'{cat}',href:'games/{gid}/index.html',saveKey:'{gid}.enCurso',logo:`{logo}`}},"
           " // NUEVO_JUEGO: cambiar el logo\n")
    open(SALA,'w').write(sala.replace(k,k+entry,1))
    print(f'listo: {gid}\n  editá dev/juegos/{gid}.src.html (reglas, tablero y temas)\n  y dev/pruebas/{gid}.test.js\n'
          f'  logo provisorio en dev/sala/sala.src.html; ícono provisorio en dev/iconos/{gid}.png\n'
          f'  agregá una entrada al CHANGELOG del menú cuando lo publiques')

def quitar(gid):
    r=leer_reg();r['juegos']=[j for j in r['juegos'] if j['id']!=gid];escribir_reg(r)
    for f in [J('juegos',gid+'.src.html'),J('pruebas',gid+'.test.js'),J('iconos',gid+'.png')]:
        if os.path.exists(f):os.remove(f)
    sala=open(SALA).read();sala=re.sub(r"  \{id:'"+re.escape(gid)+r"',[^\n]*NUEVO_JUEGO[^\n]*\n",'',sala);open(SALA,'w').write(sala)
    print('quitado:',gid)

if __name__=='__main__':
    a=sys.argv[1:]
    if not a:print(__doc__);sys.exit(0)
    if a[0]=='--quitar':quitar(a[1]);sys.exit(0)
    opt=lambda k,d:a[a.index(k)+1] if k in a else d
    pos=[x for i,x in enumerate(a) if not x.startswith('--') and (i==0 or not a[i-1].startswith('--'))]
    if len(pos)<2:raise SystemExit('uso: nuevo_juego.py <id> "<Nombre>" [--color #rrggbb] [--cat puzzle]')
    crear(pos[0],pos[1],opt('--color','#2f6fd0'),opt('--cat','puzzle'))
