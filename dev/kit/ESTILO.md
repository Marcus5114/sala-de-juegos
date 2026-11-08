# Guía de estilo

La sala tiene que sentirse como un solo producto: misma barra, mismos paneles, mismos botones, mismo ritmo. Lo que cambia entre juegos es el tablero y sus temas.

## Pantalla

- **Una sola pantalla, sin desplazamiento.** De arriba abajo: barra (sala · ayuda · Libre/Desafío · temas · progreso), dificultades, marcador, tablero (ocupa todo lo que sobra), botonera.
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

## Batería y fluidez

- **En reposo, 0 % de trabajo**: ningún `setInterval` ni `requestAnimationFrame` corriendo sin que pase nada. El reloj del kit y `Loop` se detienen solos con la app oculta. Las pruebas exigen menos de 0,5 % de CPU en reposo.
- **Dibujar solo lo que cambia**: `build()` crea los elementos una vez; `draw()` cambia clases y atributos, y compara antes de escribir (`if(el._c!==cls)`). Al arrastrar, mover solo la pieza y lo que está unido a ella.
- **Un dibujo por cuadro**: `Input.drag` ya agrupa los movimientos; para otros casos, `Redraw(draw)`.
- **Sonido**: el contexto de audio se suspende 1,5 s después del último sonido.
- **Fluidez**: arrastrar tiene que ir a 30 cuadros/s o más con el procesador 4× más lento (las pruebas lo miden).

## Sonido y vibración

Apagado de entrada; la preferencia es de toda la sala (`sala.sonido`) y se cambia en el panel de temas. Sonidos del kit: `tap` (elegir), `place` (poner), `ok`, `bad` (no se puede), `clear` (limpiar línea), `win`, `undo`. Vibración (`vibe`) solo para errores (40 ms) y logros (patrón corto).

## Textos

Español rioplatense, con voseo (“arrastrá”, “tocá”). Cortos. La ayuda explica la regla, qué cambia con la dificultad y qué es Libre y Desafío. Sin marcas registradas en nombres de juegos, temas ni textos.
