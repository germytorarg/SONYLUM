# SONYLUM — "Las ideas también tienen vida"

Motion graphic editorial vertical (1080 × 1920 · 30 fps · 30 s) hecho con
React + Remotion. Lenguaje de collage de mesa de trabajo: papel marfil,
objetos fotografiados con sombra real, tipografía con escalas extremas y
marcas técnicas de plano, a partir de la referencia de Instagram
(kaloyan.editor) reinterpretada para SONYLUM y sus marcas.

```
npm install
npm run studio     # editar / previsualizar en Remotion Studio
npm run render     # → out/sonylum-ideas.mp4 (H.264, CRF 16)
npm run web        # → web/player.js: la misma pieza en vivo en el navegador (Remotion Player)
```

## Estructura

```
src/
  Root.tsx                 Composición "SonylumIdeas" (1080×1920, 30 fps, 900 frames)
  SonylumIdeas.tsx         Pila de capas + secuencias por escena
  timeline.ts              ★ Mapa de beats (frames). Toda la pieza se sincroniza desde acá
  camera.ts                Cámara virtual 2.5D (x, y, zoom, roll) con keyframes
  theme.ts                 Paleta, familias tipográficas, métricas de Anton
  lib/anim.ts              Easings propios, springs, pistas de keyframes, ruido orgánico
  lib/fonts.ts             Carga de fuentes locales (el render espera a que estén)
  components/
    Blur.tsx               Motion blur direccional (feGaussianBlur anisotrópico) + sombra de elevación
    Obj.tsx                Objeto físico (PNG) con pose 3D, sombra en espacio de pantalla y blur por velocidad
    Paper.tsx              Papel rasgado procedural (borde con fibra, textura, contenido encima)
    TornSweep.tsx          Transición de hoja rasgada que barre el cuadro
    Type.tsx               Reveal por máscara, palabras con stagger, máquina de escribir
    Morph.tsx              Palabras que se fragmentan y reordenan letra por letra
    Strokes.tsx            Círculo a mano, trazos, esquinas de visor, cruces de registro
    Logos.tsx              SONYLUM por piezas · Creando Contenidos (visor + texto) · TEFILMO
    Layers.tsx             Fondo de papel, marcas técnicas, HUD, grano / viñeta / parpadeo
  scenes/
    Cuaderno.tsx           00:00–00:08  La idea + El proceso
    Transformacion.tsx     00:08–00:13  IDEA → IMAGEN → MOVIMIENTO → HISTORIA
    Estudio.tsx            00:13–00:23  SONYLUM + El ecosistema (recorte de revista)
    Recordar.tsx           00:23–00:30  La idea central + Cierre
public/
  objects/                 Anteojos, taza, lapicera, clip, papel rasgado, papel arrugado, eucalipto (PNG)
  brands/                  Logos originales recoloreados + piezas separadas (sonylum-parts/, creando-parts/)
  textures/                Papel con fibras y grano fotográfico
  fonts/                   Anton, Cormorant Garamond, Courier Prime (woff2, OFL)
tools/
  cut_objects.md           Recorte de los objetos de la foto cenital (rembg / isnet)
  prepare_assets.py        Piezas de logos, aplanado de la hoja, texturas
  stills.mjs               Render rápido de frames sueltos para revisión
```

## Cómo editar

- **Tiempos**: cambiar un valor en `src/timeline.ts` mueve todo lo que depende
  de ese beat (textos, objetos, cámara, marcas). Si se suma locución, poner el
  frame de cada palabra (segundo × 30) en el beat correspondiente.
- **Cámara**: `src/camera.ts`, una pista de keyframes por eje. Las capas la
  aplican con profundidades distintas (papel 1.0, marcas 0.85, barridos 1.1).
- **Objetos**: cada objeto declara su recorrido como una función `pose(f)`;
  el motion blur y la sombra salen solos de esa función.
- **Textos**: cada escena tiene sus textos en el propio componente.

## TEFILMO

No vino el archivo del logo de TEFILMO. Mientras tanto se usa una marca
tipográfica provisoria. Para usar el original basta con dejar
`public/brands/tefilmo.png` (o `.svg` / `.webp`) y volver a renderizar: el
componente lo detecta y lo muestra con `object-fit: contain`, sin deformarlo.

## Audio

La pieza no tiene audio. Si se suma una locución o música, ajustar los beats
de `timeline.ts` a las palabras y agregar `<Audio src={staticFile(...)} />`
en `SonylumIdeas.tsx`.
