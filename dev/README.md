# Kit de desarrollo de la Sala de Juegos

Todo lo que hace falta para crear, armar y probar los juegos de la sala. La carpeta `dev/` tiene las fuentes; lo que se publica (la raíz del repo: `index.html`, `sw.js`, `manifest.json`, `games/…`) sale de acá con un solo comando.

```
dev/
├── juegos.json          registro de juegos (orden = atajos de Android)
├── libs.json            librerías probadas que se pueden pegar en un juego
├── package.json         herramientas de npm (minificador, pruebas, diccionarios, librerías)
├── juegos/              fuente de cada juego (<id>.src.html) y su generador de niveles (<id>.gen.js)
├── datos/               datos grandes que se insertan al armar (niveles de Rueda, listas de Cinco)
├── iconos/              ícono de cada juego (192×192) y de la sala
├── sala/sala.src.html   el menú: lista GAMES, CHANGELOG (de acá sale la versión) y modo claro/oscuro
├── kit/                 la base común de los juegos
│   ├── kit.css          tokens de color, barra, marcador, botonera, paneles, estados
│   ├── bar.html         barra de arriba (sala, ayuda, Libre/Desafío, temas, progreso) y dificultades
│   ├── sheets.html      paneles: ayuda, temas, progreso, fin de nivel, confirmar
│   ├── kit.js           entrada, animación, bucle, sonido y kitStart (el juego base)
│   ├── demo.src.html    laboratorio: un juego mínimo y una zona por cada tipo de entrada
│   ├── plantilla.*      juego de ejemplo completo que copia nuevo_juego.py
│   ├── ESTILO.md        colores, temas, animación, accesibilidad, batería
│   └── LIBRERIAS.md     cuándo usar cada librería y cómo
├── herramientas/
│   ├── armar.py         arma la sala
│   ├── nuevo_juego.py   crea un juego nuevo desde la plantilla
│   ├── contraste.js     contraste y distancia entre colores
│   └── palabras/        generador y verificación de niveles de Rueda de Palabras
└── pruebas/             pruebas con un celular simulado (Playwright); todas.js corre todo
```

## Preparar (una vez)

```
cd dev && npm install
```

Hace falta Python 3 y Node 18 o más. Playwright usa su propio Chromium (`npx playwright install chromium` si no está).

## Crear un juego

```
python3 dev/herramientas/nuevo_juego.py laberinto "Laberinto" --color '#2b2f36' --cat puzzle
```

Crea `juegos/laberinto.src.html` (copia de la plantilla, que ya es un juego que funciona), su prueba, un ícono y un logo provisorios, y lo agrega al registro y al menú. `--quitar laberinto` deshace todo.

Después se reemplaza, en este orden:

1. **Datos**: `DIFFS` (cuatro dificultades: Fácil, Media, Difícil, Experto, cada una con `par` = segundos para 3 estrellas) y `THEMES` (cinco temas).
2. **Generador**: `genLevel(diff, lvl)` con `rngOf(semilla)`: el mismo nivel tiene que salir igual en cualquier navegador. Cada nivel debe tener solución verificada (mejor si se construye desde la solución). Si el generador es grande o se prueba con node, va en `juegos/<id>.gen.js` entre `/*GEN*/` y `/*END_GEN*/`, y en la fuente se deja la marca vacía.
3. **Tablero**: `build()` crea los elementos una vez; `draw()` solo cambia clases y atributos, y termina con `paintCommon()`.
4. **Jugadas**: cada jugada llama a `pushUndo(entrada)`, `Sfx.play(…)`, `draw()`, `save()` y, si ganó, `win()`.
5. **kitStart({...})**: la configuración. El contrato completo está en el comentario de la sección 6 de `kit/kit.js`.

### Lo que hace el kit solo

Modos Libre y Desafío, cuatro dificultades, niveles sin fin con progreso por modo y dificultad, guardado automático (al cambiar de pestaña también), marca “en curso” para el menú, reloj que se detiene con la app oculta o con un panel abierto, límite de tiempo opcional, deshacer, reiniciar con confirmación, pista (solo en Libre), cartel de fin con estrellas y mejor tiempo, panel de temas con muestras e interruptor de sonido, panel de progreso, ayuda con las teclas y atajos de teclado (Z, R, H, Enter).

### Entradas disponibles (`Input`)

| Gesto | Función | Uso típico |
| --- | --- | --- |
| Tocar / mantener | `Input.press(el,{tap,long})` | botones, marcar con bandera |
| Arrastrar | `Input.drag(el,{start,move,end})` | piezas, puntos, puentes; `move` corre a lo sumo una vez por cuadro |
| Deslizar | `Input.swipe(el,fn)` | 2048, mover fichas |
| Trazar | `Input.trace(el,{hit,enter,end})` | unir letras o puntos pasando por encima |
| Teclas | `Input.keys({tecla:fn})`, `Input.dirKeys(fn)` | atajos; flechas y WASD |

Todos usan Pointer Events (dedo, mouse y lápiz con el mismo código). Las teclas no actúan con un panel abierto ni mientras se escribe en un campo. Los juegos con teclado explican sus teclas en `keysHelp` (se ven solo en equipos con mouse).

## Armar

```
python3 dev/herramientas/armar.py                 # en la raíz del repo (lo que se publica)
python3 dev/herramientas/armar.py /tmp/sala       # en otra carpeta
python3 dev/herramientas/armar.py /tmp/sala --solo puentes,mapa --sin-minificar
```

Inserta el kit, los generadores, las librerías y los datos; envuelve cada juego como página instalable (manifest, ícono, modo claro/oscuro, service worker); minifica; y escribe el menú, el manifest con atajos y el service worker con la lista sin conexión. La versión (y el nombre de la caché) sale de la primera entrada de `CHANGELOG` en `sala/sala.src.html`: **cada publicación lleva una entrada nueva**, si no los teléfonos siguen con la versión vieja.

## Probar

```
node dev/pruebas/todas.js                 # arma en una carpeta temporal y corre todo
node dev/pruebas/todas.js /tmp/sala --solo puentes
node dev/pruebas/puentes.test.js /tmp/sala/games/puentes/index.html
node dev/pruebas/_generico.js /tmp/sala/games/puentes/index.html
```

- `<id>.test.js`: reglas del juego, arrastres reales con el dedo, deshacer, ganar, guardado, temas, teclado, pantallas por dificultad, fluidez con el procesador 4× más lento y consumo en reposo.
- `_generico.js`: el contrato de kitStart, igual para todos los juegos que lo usan.
- `_humo.js`: para los juegos sin pruebas propias.
- `kit.test.js`, `libs.test.js`, `sala.test.js`, `sinconexion.test.js`.

Las capturas quedan en `pruebas/capturas/` (no se suben).

## Lista antes de publicar

- [ ] Cada nivel tiene solución verificada; el mismo nivel sale igual siempre.
- [ ] Entra en 390×800 sin desborde en las cuatro dificultades; se ve bien de 320 a 1100 px de ancho.
- [ ] Cinco temas, con contraste revisado (`herramientas/contraste.js`) en claro y en oscuro.
- [ ] Libre con pista; Desafío con reloj y estrellas.
- [ ] Teclado: todo lo que se hace con el dedo se puede hacer con teclas.
- [ ] En reposo usa menos de 0,5 % de CPU; arrastrar va a 30 cuadros/s o más con el procesador 4× más lento.
- [ ] Respeta “reducir movimiento”.
- [ ] Sin marcas registradas en nombres, dibujos ni textos.
- [ ] Ícono y logo definitivos; entrada en `CHANGELOG`.
- [ ] `node dev/pruebas/todas.js` sin fallas.
