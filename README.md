# Sala de Juegos

Colección de juegos de puzzle y arcade instalable en el celular (PWA). Funciona sin conexión.

## Estructura

```
index.html            menú de juegos (mosaico, destacados)
manifest.json         datos de la app instalable
sw.js                 caché sin conexión
icon-192.png / 512    ícono de la sala
games/<id>/index.html cada juego en su carpeta
```

## Sumar un juego

1. Crear `games/<id>/index.html`. Para volver al menú, enlazar a `../../index.html`.
2. En `index.html`, agregar una entrada al arreglo `GAMES`: `id`, `name`, `cat` (una categoría de `CATEGORIES`: cartas, puzzle, arcade, palabras, estrategia), `href`, `logo` (SVG) y, si guarda partida, `saveKey` (la clave de localStorage que indica una partida en curso). Para una categoría nueva, sumarla a `CATEGORIES`.
3. En `sw.js`, sumar los archivos del juego a `FILES` y subir el número de versión de `CACHE`.

## Publicar

Settings → Pages → Branch: `main`, carpeta `/ (root)`.
La sala queda en `https://marcus5114.github.io/solitario-spider-pwa/`.
Cada vez que cambies un archivo, subí la versión en `sw.js` para que los celulares tomen lo nuevo.

## Juegos

- **Spider Solitario** (`games/spider/`, Cartas): 1, 2 o 4 palos; solo reparte manos con solución verificada.
- **Atasco** (`games/atasco/`, Puzzle): 40 niveles en 4 dificultades (Fácil, Media, Difícil, Experto) en una grilla de 6×6; cada nivel tiene su mínimo de movimientos verificado.
