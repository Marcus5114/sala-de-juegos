# Guía de estilo

La sala tiene que sentirse como un solo producto: misma barra, mismos paneles, mismos botones, mismo ritmo. Lo que cambia entre juegos es el tablero y sus temas.

## Pantalla

- **Una sola pantalla, sin desplazamiento.** De arriba abajo: barra (sala · ayuda · Libre/Desafío · temas · progreso), dificultades, marcador, tablero (ocupa todo lo que sobra), botonera.
- **Marcador dentro de la pantalla.** Marcador y tablero forman una sola superficie con el color del tema (`.pantalla`, la arma `Pantalla.unir(hud, stage)` de `kit/fondo.js`). Nivel, líneas, puntos, manos y demás contadores son texto sobre el juego, en pastillas tenues, no tarjetas aparte. El color de la letra sale solo del brillo del tablero (o del tinte del fondo animado): `--hudInk` y `--hudChip`. En los juegos con `kitStart` ya viene hecho.
- **Botonera**: acción principal a la izquierda, 70 % del ancho (Deshacer, que pasa a *Siguiente nivel* o *Reintentar*); Reiniciar a la derecha, 30 %.
- **Medida de referencia**: 390×800 con dedo. Revisar también 320 px de ancho y escritorio (el contenido se centra en 640 px como máximo).
- **Zonas de toque** de 42 px o más. Las cosas chicas (puntos, ejes) se agarran con un radio cómodo alrededor, no solo sobre el dibujo.
- **Márgenes**: los da el kit (12 px a los lados o el área segura del teléfono).
- El tablero calcula su tamaño en `build()` a partir de `#stage` y se vuelve a armar al cambiar el tamaño de la ventana.

## Colores del kit

Definidos en `kit.css`, en claro y en oscuro. Usarlos para todo lo que no es el tablero.

| Token | Claro | Oscuro | Para |
| --- | --- | --- | --- |
| `--bg` | `#f1f1f2` | `#141416` | fondo de la página |
| `--fg` | `#18181a` | `#ececee` | texto, botón principal |
| `--muted` | `#6c6c72` | `#9a9aa1` | etiquetas, texto secundario |
| `--panel` | `#fafafa` | `#1e1e22` | paneles, botones |
| `--chip` | `#e2e2e6` | `#2b2b30` | marcador, pestañas, bordes |
| `--ok` | `#2e9e5b` | `#5fd08d` | resuelto, correcto |
| `--bad` | `#d8423a` | `#ff6a5f` | error, conflicto |
| `--acc` | `#2f6fd0` | `#7fb2ff` | selección, foco |

Letra: `--font` (Arial/Helvetica en la sala publicada: no se descargan fuentes, así anda sin conexión). Pesos 700 y 800 para números y títulos; números con `font-variant-numeric: tabular-nums`.

**Modo oscuro**: la sala lo maneja sola (`sala.modo`: auto, claro u oscuro → `data-theme` en `<html>`). Un juego solo tiene que redefinir sus propias variables con las dos reglas de siempre:

```css
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .t-clasico{--sea:#1c1d21}}
:root[data-theme="dark"] .t-clasico{--sea:#1c1d21}
```

Los temas de color propio (noche, espacio, neón…) se ven igual en los dos modos; el tema neutro de cada juego (Clásico) tiene versión oscura.

## Temas

Cada juego tiene **cinco temas** que cambian el tablero entero, no solo un color: fondo, forma de las piezas, trazo de las líneas, dibujos. Ejemplos: Puentes (Clásico, Mar, Noche, Espacio, Montaña), Engranajes (Taller, Reloj, Juguete, Vapor, Plano).

Contrato:

```js
const THEMES={clave:{name:'Nombre visible',cls:'t-clave', …lo que el juego necesite (colores, símbolos)}};
```

- La clase `t-clave` va en `#stage` (y en otros contenedores del tablero si hace falta) y define variables CSS: `.t-clave{--board:…;--on:…}`. El dibujo usa siempre variables, nunca colores fijos, así un tema nuevo es solo CSS y datos.
- `preview(clave, t)` devuelve la muestra del panel de temas (58 px de alto): un pedazo real del tablero, no un color plano.
- El primer tema es el neutro y es el que aparece por defecto.

## Contraste

Medir con `node dev/herramientas/contraste.js` (ver el encabezado del archivo).

- Texto chico: **4,5:1** o más contra su fondo.
- Texto grande o en negrita, números del tablero, piezas, líneas y símbolos: **3:1** o más contra lo que tienen inmediatamente atrás.
- Colores de una misma paleta (fichas, regiones, valores consecutivos): **ΔE ≥ 12** entre cualquier par (`--paleta`).
- Dibujos (emoji o SVG) sobre fichas de color: elegir el fondo de la ficha por luminancia para que al menos el 70 % del dibujo se distinga; si un dibujo es claro, su ficha va oscura.
- El color nunca es la única señal: un conflicto además se marca con trazo, anillo o patrón; una pieza elegida, con borde.
- Revisar cada tema en claro y en oscuro.

## Estados de las piezas

| Estado | Cómo se ve | Clase o función |
| --- | --- | --- |
| Elegida (dedo o teclado) | borde de 3 px `--fg` o `--acc`, o escala 1,1–1,3 | propia del juego |
| Conflicto | `--bad`, más un trazo o anillo | propia |
| Error al soltar | sacudida corta | `.is-bad` o `Anim.shake(el)` |
| Pista | latido 3 veces | `.is-hint` o `Anim.pulse(el)` |
| Puesta / sumada | rebote corto | `Anim.pop(el)` |
| Resuelto | todo el tablero en `--ok` o en el color de festejo del tema, y papelitos | `win()` lo hace |

## Animación

- **Duraciones**: toques 120–220 ms; movimientos de piezas 200–320 ms; festejos hasta 1 s. Curva `EASE` (`cubic-bezier(.22,.61,.36,1)`).
- **Solo `transform` y `opacity`** (corren en la placa de video). Nada de animar `width`, `top`, `box-shadow` o filtros en bucle.
- **Web Animations** (`Anim.*` o `el.animate`) para efectos de una vez; CSS `@keyframes` para estados (`.is-hint`).
- **En cascada**: `Anim.stagger(els, fn, 30)` o `delay` por posición, nunca más de ~400 ms en total.
- **Fondos animados** (hojas, olas, estrellas): sutiles, lentos (10 s o más por ciclo), pocos elementos, y que no tapen el juego.
- **Reducir movimiento**: `reduceMotion` es `true` → saltear o acortar. `Anim.*` ya lo respeta; las animaciones CSS necesitan su `@media (prefers-reduced-motion:reduce)`.

## Tema Píxel

Todos los juegos tienen un tema **Píxel**: misma paleta de 16 colores (`--x0` … `--x15` en `kit/pixel.css`, también `Pixel.PAL`), letra Pixelify Sans (libre, OFL, en `fuentes/`, sin conexión), esquinas rectas, sombras duras y cielo de estrellas cuadradas (`Pixel.FONDO`).

- En los juegos con `kitStart`: `pixel:{name:'Píxel',cls:'t-pixel',pixel:true,fondo:Pixel.FONDO}`. El kit prende la clase `px` en `<html>` y cambia el foco de la pista por un sprite.
- En los demás: `/*KIT_PIXEL_CSS*/` y `/*KIT_PIXEL_JS*/`, y `Pixel.modo(clave==='pixel')` al cambiar de tema.
- **Sprites**: se escriben como texto, un carácter por píxel, y salen como SVG nítido: `Pixel.svg(Pixel.SPR.mina,{'#':'#1a1c2c','w':'#f4f4f4'})`. Hay palos, flechas, bandera, mina, pala, foco, estrella, moneda, corazón, tilde y cruz; `Pixel.circulo(n)` da un círculo pixelado.
- La letra pixelada no trae los símbolos de los palos: en cartas, usar los sprites.
- Lienzos (Bloques): dibujar con `fillRect` en enteros, relieve en escalón, sin degradados ni curvas.

## Fondos animados

Cada tema tiene un fondo que se mueve despacio por detrás del tablero (`kit/fondo.js`). Es lo que hace que la sala se sienta viva y pareja: todos los juegos lo tienen, con la misma calidad y las mismas reglas.

- **Catálogo**: polvo, estrellas, burbujas, hojas, nieve, garabatos, destellos, ondas, nubes, engranajes, chispas, luz y grilla. Se ven todos en `kit/fondos.src.html` (galería, sobre fondo oscuro y claro).
- **Se eligen por tema**, junto con el resto del tema:

  ```js
  noche:{name:'Noche',cls:'t-noche',fondo:{p:[['estrellas',['#fff','#c9b6ff']],['luz',['rgba(255,255,255,.08)'],.8]]}}
  ```

  Cada capa es `[fondo, colores, opacidad]`. Con `bg` se tiñe además el área (para juegos cuyo tablero flota sobre la página: usar colores con transparencia, así sirven en claro y en oscuro).
- **Sutiles**: decoran, no compiten. Opacidad de 0,2 a 0,6 para lo que se repite (polvo, garabatos), y hasta 1 para lo que ya es tenue (estrellas). Si en una captura se ve más el fondo que el tablero, está fuerte.
- **Acordes al tema**: estrellas en temas nocturnos, burbujas u ondas en el agua, garabatos en papel o pizarra, engranajes en lo mecánico. Un tema neutro (Clásico, Grises) puede quedarse quieto: mejor sin fondo que con uno de relleno. `polvo` acompaña a otro efecto, no va solo.
- **Se quedan quietos** (se ven, pero no se mueven) con "reducir movimiento", con la batería por debajo del 20 % sin cargar, o si la persona los apaga: botón **Fondos** en la sala o **Fondo animado** en el panel de temas (vale para toda la sala: `sala.fondos`).
- En los juegos con `kitStart` alcanza con poner `fondo` en cada tema. En los demás: `/*KIT_FONDO_CSS*/` y `/*KIT_FONDO_JS*/`, una tabla `FONDOS`, `Fondo.iniciar({host,temas:FONDOS})` y `Fondo.tema(clave)` al cambiar de tema.

## Movimiento común

- **Resorte**: `SPRING` (en el kit) es una curva física convertida a `linear()` de CSS: se siente natural y la sigue moviendo la placa de video. Para cartas que llegan, piezas que se apoyan, globitos.
- **Entrada de nivel**: el kit hace aparecer el tablero con un resorte corto al empezar cada nivel.
- **Marcador**: los números se "inflan" un instante cuando cambian (menos el reloj).
- **Botones**: se hunden un poco al tocarlos (`transform:scale(.95)`).
- **Rivales y procesos**: lo que piensa la computadora se muestra con un globito de tres puntos (`IA.pensar` asegura que se vea al menos medio segundo).

## Batería y fluidez

- **En reposo, casi 0 % de trabajo**: ningún `setInterval` ni `requestAnimationFrame` corriendo sin que pase nada. Los fondos animados no cuentan porque los mueve la placa de video (medido: 0,04 % con 20 motas; GSAP haría lo mismo con 2,8 % y un lienzo dibujado cuadro a cuadro con 5,6 %; ver `herramientas/medir_animacion.js`). El reloj del kit y `Loop` se detienen solos con la app oculta. Las pruebas exigen menos de 0,5 % de CPU en reposo.
- **Dibujar solo lo que cambia**: `build()` crea los elementos una vez; `draw()` cambia clases y atributos, y compara antes de escribir (`if(el._c!==cls)`). Al arrastrar, mover solo la pieza y lo que está unido a ella.
- **Un dibujo por cuadro**: `Input.drag` ya agrupa los movimientos; para otros casos, `Redraw(draw)`.
- **Cálculos pesados en segundo plano**: IA, búsquedas o verificaciones largas van con `kitWorker` (otro hilo); la pantalla nunca se traba.
- **Sonido**: el contexto de audio se suspende 1,5 s después del último sonido.
- **Fluidez**: arrastrar tiene que ir a 30 cuadros/s o más con el procesador 4× más lento (las pruebas lo miden).

## Sonido y vibración

Apagado de entrada; la preferencia es de toda la sala (`sala.sonido`) y se cambia en el panel de temas. Sonidos del kit: `tap` (elegir), `place` (poner), `ok`, `bad` (no se puede), `clear` (limpiar línea), `win`, `undo`. Vibración (`vibe`) solo para errores (40 ms) y logros (patrón corto).

## Textos

Español rioplatense, con voseo (“arrastrá”, “tocá”). Cortos. La ayuda explica la regla, qué cambia con la dificultad y qué es Libre y Desafío. Sin marcas registradas en nombres de juegos, temas ni textos.
