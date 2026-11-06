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

El workflow `.github/workflows/publicar.yml` publica en cada push a `main`. Configuración única: Settings → Pages → Build and deployment → Source: **GitHub Actions**. También se puede lanzar a mano desde Actions → Publicar sala → Run workflow.
La sala queda en `https://marcus5114.github.io/sala-de-juegos/`.
Para publicar una versión nueva, sumá una entrada al comienzo de `CHANGELOG` en `index.html` (número, fecha y cambios) y la misma versión en `CACHE` de `sw.js`. El número aparece al pie del menú y las novedades se abren al tocarlo.

## Juegos

- **Spider Solitario** (`games/spider/`, Cartas): 1, 2 o 4 palos; solo reparte manos con solución verificada.
- **Atasco** (`games/atasco/`, Puzzle): 1600 niveles, 400 por dificultad (Fácil 2–7, Media 8–14, Difícil 15–22, Experto 23–39 movimientos), 100 de cada una con obstáculos fijos. Modo con puntaje (estrellas según el mínimo) y modo Libre. Todos los mínimos están verificados.
- **Cinco Letras** (`games/cinco/`, Palabras): adivinar una palabra de 5, 7 o 9 letras en 6 intentos. Palabra diaria y modo libre. Las listas de 7 y 9 letras (`v7.txt`, `v9.txt`) se descargan al elegir ese largo. Palabras válidas tomadas de an-array-of-spanish-words (MIT).
