"""Arma la Sala de Juegos lista para publicar.

Uso:  python3 dev/herramientas/armar.py [carpeta_de_salida] [--solo id1,id2] [--sin-minificar]
      (sin carpeta, escribe en la raíz del repo: index.html, manifest.json, sw.js, games/…)

Qué hace, para cada juego de dev/juegos.json:
  1. lee dev/juegos/<fuente>
  2. inserta el kit (/*KIT_CSS*/, <!--KIT_BAR-->, <!--KIT_SHEETS-->, /*KIT_JS*/; los fondos solos: /*KIT_FONDO_CSS*/, /*KIT_FONDO_JS*/), el generador (/*GEN*/…/*END_GEN*/ ← <id>.gen.js)
     y las librerías pedidas con /*LIB:nombre*/ (dev/libs.json, instaladas con npm en dev/)
  3. inserta datos propios (Rueda: los 10 juegos de niveles; Crucigrama: el banco de palabras y pistas)
  4. lo envuelve como página instalable (manifest, ícono, modo claro/oscuro, service worker) y lo minifica
  5. copia el ícono y los archivos extra
Después arma el menú (dev/sala/sala.src.html), el manifest con atajos y el service worker con la lista sin conexión.
La versión sale de la primera entrada del CHANGELOG del menú."""
import os,re,sys,json,shutil,subprocess,glob
DEV=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO=os.path.dirname(DEV)
args=[a for a in sys.argv[1:] if not a.startswith('--')]
OUT=os.path.abspath(args[0]) if args else REPO
SOLO=None
for i,a in enumerate(sys.argv):
    if a=='--solo':SOLO=set(sys.argv[i+1].split(','))
MINIFY='--sin-minificar' not in sys.argv
REG=json.load(open(os.path.join(DEV,'juegos.json')))['juegos']
exec(open(os.path.join(DEV,'herramientas','_modo.py')).read())  # MODO_HEAD, MODO_UI
KIT=os.path.join(DEV,'kit')

def minifier():
    for c in [os.path.join(DEV,'node_modules','.bin','html-minifier-terser'),shutil.which('html-minifier-terser') or '',
              '/tmp/claude-0/-home-claude/6f3f9b68-58e6-576d-9b15-9e8c36baf96d/scratchpad/tools/node_modules/.bin/html-minifier-terser']:
        if c and os.path.exists(c):return c
    return None
MIN=minifier()

LIBS=json.load(open(os.path.join(DEV,'libs.json')))['libs']
MODULOS=[os.path.join(DEV,'node_modules')]+([os.environ['SALA_MODULOS']] if os.environ.get('SALA_MODULOS') else [])
def lib(nombre):
    """Texto de una librería para pegar en el juego (así funciona sin conexión)."""
    if nombre not in LIBS:raise SystemExit(f'librería desconocida: {nombre} (ver dev/libs.json)')
    L=LIBS[nombre];f=next((os.path.join(m,L['archivo']) for m in MODULOS if os.path.exists(os.path.join(m,L['archivo']))),None)
    if not f:raise SystemExit(f'falta {L["paquete"]}: corré "npm install" en dev/')
    t=open(f).read()
    if L.get('esm'):t=re.sub(r'^export\s+','',t,flags=re.M)
    if L.get('envolver'):# en su propio ámbito, para que sus variables no choquen con las del juego
        g=L['global'];names=L['envolver']
        t='(()=>{\n'+t+'\n'+(f'window.{g}={{{",".join(names)}}};' if g not in names else f'window.{g}={g};'+''.join(f'window.{n}={n};' for n in names if n!=g))+'\n})();'
    return f'/* {L["paquete"]} · {L["licencia"]} */\n'+t

def con_kit(s,gid):
    """Inserta la base común y el generador del juego."""
    rd=lambda f:open(os.path.join(KIT,f)).read()
    # el kit trae los fondos animados; los juegos sin kit los piden con sus propias marcas
    rep={'/*KIT_CSS*/':rd('kit.css')+'\n'+rd('fondo.css'),'<!--KIT_BAR-->':rd('bar.html'),'<!--KIT_SHEETS-->':rd('sheets.html'),'/*KIT_JS*/':rd('kit.js')+'\n'+rd('fondo.js'),
         '/*KIT_FONDO_CSS*/':rd('fondo.css'),'/*KIT_FONDO_JS*/':rd('fondo.js')}
    for k,v in rep.items():
        if k in s:s=s.replace(k,v)
    s=re.sub(r'/\*LIB:([\w-]+)\*/',lambda m:lib(m.group(1)),s)
    g=os.path.join(DEV,'juegos',gid+'.gen.js')
    if '/*GEN*/\n/*END_GEN*/' in s:
        t=open(g).read();s=s.replace('/*GEN*/\n/*END_GEN*/',t[t.index('/*GEN*/'):t.index('/*END_GEN*/')+11])
    return s

def datos_rueda(s):
    sets={os.path.basename(f)[1:3]:open(f).read().strip() for f in sorted(glob.glob(os.path.join(DEV,'datos','rueda','r*.txt')))}
    k='/*DATA*/const LEVELS_RAW="";/*END_DATA*/'
    assert k in s,'falta el marcador de datos de Rueda'
    return s.replace(k,'/*DATA*/const LEVELS_RAW='+json.dumps(sets,ensure_ascii=False,separators=(',',':'))+';/*END_DATA*/')

def datos_crucigrama(s):
    import unicodedata
    def norm(w):
        w=unicodedata.normalize('NFD',w.lower()).replace('n\u0303','ñ')
        return ''.join(ch for ch in w if unicodedata.category(ch)!='Mn').upper()
    out=[]
    for n in (1,2,3):
        for l in open(os.path.join(DEV,'datos','crucigrama',f'n{n}.txt')).read().split('\n'):
            if not l.strip() or l.startswith('#'):continue
            w,c=l.split('|',1);w=norm(w.strip())
            if len(w)>=3:out.append([w,c.strip(),n])
    k='/*BANCO*/const BANCO=[];/*END_BANCO*/'
    assert k in s,'falta el marcador del banco del Crucigrama'
    return s.replace(k,'/*BANCO*/const BANCO='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+'.map(([w,c,n])=>({w,c,n}));/*END_BANCO*/')

def pagina(s,root,title,theme,extra='',modo_ui=True):
    s=re.sub(r'<title>.*?</title>\s*','',s,count=1,flags=re.S)
    s=re.sub(r'<meta name="claude:viewport-fit-sides"[^>]*>\s*','',s,count=1)
    s=re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>\s*','',s)
    i=s.index('<style>');j=s.index('</style>')+8
    style=s[i:j].replace("'Montserrat',","").replace("Montserrat,","");rest=s[j:]
    head=f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title>
<meta name="theme-color" content="{theme}">
<link rel="manifest" href="{root}manifest.json">
<link rel="icon" href="{root}icon-192.png">
<link rel="apple-touch-icon" href="{root}icon-192.png">
'''+MODO_HEAD
    base='<style>\n:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);box-sizing:border-box}\nbody{font-size:14px;overscroll-behavior:none}\nimg{max-width:100%}\n[hidden]{display:none!important}\n'+extra+'</style>\n'
    tail=(MODO_UI if modo_ui else '')+f'''<script>
if('serviceWorker' in navigator){{addEventListener('load',()=>navigator.serviceWorker.register('{root}sw.js',{{scope:'{root}'}}));}}
</script>
</body>
</html>
'''
    return head+style+'\n'+base+'</head>\n<body>\n'+rest+tail

def escribir(html,out):
    os.makedirs(os.path.dirname(out),exist_ok=True)
    if not (MINIFY and MIN):
        open(out,'w').write(html);return
    tmp=out+'.src';open(tmp,'w').write(html)
    subprocess.run([MIN,'--collapse-whitespace','--remove-comments','--minify-css','true','--minify-js','{"compress":{"passes":2},"mangle":{"toplevel":false}}','-o',out,tmp],check=True)
    os.remove(tmp)

def armar_juego(j):
    gid=j['id'];s=open(os.path.join(DEV,'juegos',j['fuente'])).read()
    s=con_kit(s,gid)
    if j.get('datos')=='rueda':s=datos_rueda(s)
    if j.get('datos')=='crucigrama':s=datos_crucigrama(s)
    escribir(pagina(s,'../../',j['nombre'],j['color'],j.get('css',':root{height:100%}\n')),os.path.join(OUT,'games',gid,'index.html'))
    shutil.copy(os.path.join(DEV,'iconos',gid+'.png'),os.path.join(OUT,'games',gid,'icon-192.png'))
    for dst,src in j.get('archivos',{}).items():shutil.copy(os.path.join(DEV,src),os.path.join(OUT,'games',gid,dst))

def version():
    return 'v'+re.search(r"version:'([\d.]+)'",open(os.path.join(DEV,'sala','sala.src.html')).read()).group(1)

def armar_sala():
    sala=open(os.path.join(DEV,'sala','sala.src.html')).read()
    faltan=[j['id'] for j in REG if f"games/{j['id']}/index.html" not in sala]
    if faltan:raise SystemExit('Faltan en el menú (dev/sala/sala.src.html): '+', '.join(faltan))
    escribir(pagina(sala,'./','Sala de Juegos','#18181a',modo_ui=False),os.path.join(OUT,'index.html'))
    for f in ['icon-192.png','icon-512.png']:shutil.copy(os.path.join(DEV,'iconos',f),os.path.join(OUT,f))
    json.dump({"name":"Sala de Juegos","short_name":"Juegos","start_url":"./","scope":"./","display":"standalone",
      "orientation":"any","background_color":"#18181a","theme_color":"#18181a","lang":"es",
      "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png","purpose":"any maskable"},{"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}],
      "shortcuts":[{"name":j['nombre'],"url":f"games/{j['id']}/index.html","icons":[{"src":f"games/{j['id']}/icon-192.png","sizes":"192x192"}]} for j in REG]},
      open(os.path.join(OUT,'manifest.json'),'w'),ensure_ascii=False,indent=2)
    files=',\n'.join(f"  'games/{j['id']}/index.html','games/{j['id']}/icon-192.png'" for j in REG)
    sw=open(os.path.join(DEV,'herramientas','_sw.txt')).read().replace('{VERSION}',version()).replace('{FILES}',files)
    open(os.path.join(OUT,'sw.js'),'w').write(sw)

if __name__=='__main__':
    if not MIN and MINIFY:print('aviso: no encontré html-minifier-terser (npm install en dev/); armo sin minificar')
    for j in REG:
        if SOLO and j['id'] not in SOLO:continue
        armar_juego(j)
    armar_sala()
    print('ok',version(),'→',OUT,'·',len(REG),'juegos')
