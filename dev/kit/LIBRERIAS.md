# Librerías

**Primero el kit.** Entrada, animación, bucle, sonido, azar con semilla, guardado y todo el juego base están en `kit.js` y no pesan casi nada. Una librería se agrega solo cuando resuelve algo que el kit no hace y que llevaría días escribir bien (física, miles de sprites, rutas).

## Cómo se usa una

1. Está en `dev/libs.json` (versión exacta, archivo y licencia). Si no está, se agrega ahí y en `dev/package.json`, y se prueba en `pruebas/libs.test.js`.
2. `cd dev && npm install`.
3. En la fuente del juego, en su propio `<script>` antes del código del juego:

   ```html
   <script>/*LIB:planck*/</script>
   ```

4. `armar.py` pega el archivo dentro de la página. Nada se carga desde internet: la sala funciona sin conexión y la versión queda fija.

## Las probadas

| Nombre (`/*LIB:…*/`) | Paquete | Peso | Licencia | Global | Para qué |
| --- | --- | --- | --- | --- | --- |
| `planck` | planck 1.5.1 | 292 KB | MIT | `planck` | física 2D precisa (cuerpos, uniones, choques); juegos de engranajes reales, palancas, encastres con gravedad |
| `matter` | matter-js 0.20.0 | 84 KB | MIT | `Matter` | física 2D simple y liviana; bolitas, pilas, caídas |
| `pixi` | pixi.js 8.22.0 | 824 KB | MIT | `PIXI` | dibujo con WebGL; cientos o miles de sprites a 60 cuadros/s (arcade) |
| `gsap` | gsap 3.15.1 | 72 KB | licencia estándar sin cargo | `gsap` | secuencias largas de animación con líneas de tiempo; intros y festejos elaborados |
| `howler` | howler 2.2.4 (núcleo) | 28 KB | MIT | `Howl` | sonidos grabados (archivos), música de fondo |
| `zzfx` | zzfx 1.4.0 (micro) | 1 KB | MIT | `zzfx` | efectos sintetizados con parámetros (más variedad que `Sfx`) |
| `ruido` | simplex-noise 4.0.3 | 20 KB | MIT | `SimplexNoise.createNoise2D` … | ruido suave: terrenos, fondos orgánicos, movimientos naturales |
| `confeti` | canvas-confetti 1.9.4 | 28 KB | ISC | `confetti` | festejos grandes con lienzo (más partículas que `Anim.celebrate`) |
| `caminos` | pathfinding 0.4.18 | 20 KB | MIT | `PF` | rutas en grillas (A*, Dijkstra, salto de puntos): laberintos, enemigos |
| `semilla` | seedrandom 3.0.5 | 4 KB | MIT | `Math.seedrandom` | azar con semilla de texto (para niveles por fecha, “el desafío del día”) |

Pesos sin comprimir (el sitio los envía comprimidos, más o menos a un tercio).

## Cuidados

- **Peso**: el juego entero se descarga para jugar sin conexión. Más de ~300 KB en librerías pide una buena razón (pixi solo para un juego que de verdad lo necesite).
- **Batería**: los motores de física y pixi corren en bucle. Pausarlos cuando nada se mueve (si la función de `Loop` devuelve `false`, el bucle se detiene) y con la app oculta. La prueba de reposo tiene que seguir dando menos de 0,5 %.
- **zzfx** crea su contexto de audio al cargar la página; respetar `Sfx.on` antes de llamar a `zzfx(...)`.
- **Azar**: para niveles, alcanza `rngOf` del kit. `semilla` solo si hace falta una semilla de texto.
- **gsap** usa su licencia propia sin cargo (no es MIT): sirve para la sala, que es gratuita.
- **Animar con librerías** sigue las reglas de `ESTILO.md`: `transform` y `opacity`, y respetar `reduceMotion`.

## Herramientas de desarrollo (no se publican)

| Paquete | Para qué |
| --- | --- |
| html-minifier-terser 7.2.0 | minificar las páginas al armar |
| playwright 1.63.0 | pruebas con celular simulado |
| nspell 2.1.5 + dictionary-es 3.2.0 + dictionary-es-ar 1.2.0 | verificar palabras de Rueda contra el diccionario ortográfico |
| an-array-of-spanish-words 2.0.0, most-common-words-by-language 3.0.14 | listas de palabras para generar niveles |
