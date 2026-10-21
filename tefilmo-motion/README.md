# TEFILMO — Motion graphic vertical (Remotion)

Pieza publicitaria de 30 s para TEFILMO: 1080 × 1920, 30 fps, 900 frames, H.264 + AAC.
Construida a partir del kit `TEFILMO_MOTION_KIT_24_ASSETS.zip` (guion, inventario y prompt
maestro en `docs/`).

**Video final:** `out/TEFILMO_1080x1920.mp4`

## Instalación y uso

```bash
cd tefilmo-motion
npm install
npm run studio      # editor/preview de Remotion (composición "Tefilmo" + "Escena01"…"Escena06")
npm run render      # exporta out/TEFILMO_1080x1920.mp4 (H.264, CRF 16)
npm run typecheck
```

Si el entorno no puede descargar Chrome Headless de Remotion, usá un Chromium local:
`REMOTION_CHROME=/ruta/a/chrome npm run render`.

Herramientas de assets y audio (Python 3, numpy, scipy, Pillow):

```bash
python3 -I tools/clean_assets.py public/assets/original public/assets/clean
python3 -I tools/compose_music.py public/audio/tefilmo_music.wav
```

## Estructura

```
src/
  timing.ts          tiempos por escena, mapa de sincronía con la música, ventanas de transición
  assets.ts          PNG por nombre + puntos de interés (llamas, sello, anillo, interior del marco)
  config.ts          paleta, tipografías, música / voz en off
  anim.ts            easing, interpolación, ruido suave
  components/        Cutout (recorte 2D con blur, sombra, estela de movimiento, máscaras),
                     Atmosphere (fondo marfil, grano, viñeta, bokeh por profundidad, destellos, flare),
                     KineticText (tipografía cinética por letra)
  scenes/            Scene01 … Scene06 + Transitions (flare, barrido del ramo, velo, disolución cálida)
  Tefilmo.tsx        secuencia maestra de 900 frames
public/
  assets/original/   los 24 PNG del kit, sin tocar
  assets/clean/      PNG corregidos (ver informe)
  audio/             música original; acá va voiceover.wav si se agrega locución
  fonts/             Cormorant Garamond + Montserrat (OFL, autoalojadas)
tools/               limpieza de assets y composición musical
docs/                guion, inventario, prompt maestro y vista general del kit
```

## Mapa de escenas

| Escena | Frames | Assets | Movimiento | Texto |
|---|---|---|---|---|
| 01 Dos caminos | 0–149 | 01, 02, 03 | Dos líneas doradas se dibujan desde izquierda y derecha y se cruzan; 01 entra desde la profundidad (escala, blur, giro sugerido por escala horizontal y barrido especular); 02 como plano cercano y lejano desenfocado; 03 titila al aterrizar | «Dos caminos.» «Un encuentro.» |
| → | 112–176 | — | Flare anamórfico sobre los anillos, blanqueo cálido | |
| 02 Encuentro | 150–299 | 04, 05, 06 | 04 en contraluz con push-in; wipe de luz diagonal revela 05; 06 avanza hacia cámara con parallax de bokeh cercano/lejano | «Una historia empieza» |
| → | 279–322 | 07 | El ramo barre el cuadro en primer plano con estela de movimiento | |
| 03 Expectativa | 300–419 | 08, 09, 10 | 10 en segundo plano con profundidad de campo; 08 florece; 09 dividido en 4 pétalos con trayectorias, giro y volteo individuales (dos planos de profundidad) | «El día que soñaron» |
| → | 398–446 | — | Velo luminoso de tul (desplazamiento SVG) que baja y se disuelve | |
| 04 Ceremonia | 420–599 | 11, 12, 13, 14, 23 | 11 surge al fondo con bruma; 13 se despliega en perspectiva de cerca hacia lejos; push-in digital; 12 llega desde cámara y enmarca el altar; 14 con llamas titilantes; 23 se abre por capas (sobre cerrado al frente, abierto detrás) con brillo en el sello | «Un sí que lo cambia todo» |
| → | 584–620 | — | Empuje de cámara a través del arco + destello | |
| 05 Promesa | 600–749 | 15, 01, 16, 17, 24 | Cortes rápidos con cámara continua: manos → rack focus a los anillos 01 → 16 → 17 en contraluz → 24 brindis con rebote, burbujas y destello; wipes de luz verticales en cada corte | «Momentos irrepetibles» |
| → | 724–772 | — | Disolución cálida ámbar | |
| 06 Recuerdo / Marca | 750–899 | 18, 19, 20, 21, 22 | 18 como fondo en parallax (más placa de color desenfocada); 21 al inicio y sale antes de 22; 19 aparece y queda enmarcado en 22 (recuerdo); 20 atraviesa cámara y se convierte en una cinta vectorial que se enrolla alrededor del logo (mitad detrás, mitad delante) y se retira para dejar el final limpio; anochecer a negro suave | Últimos 2,5 s (825–899): logo TEFILMO, «Tu historia merece quedarse», «tefilmo.ar» |

Paleta: marfil, dorado champagne y negro suave. Tipografía: Cormorant Garamond (titulares,
cursiva para el énfasis) y Montserrat (URL). El cierre usa el logo auténtico de TEFILMO
(`public/brand/`: original entregado y versión blanca con alfa a 4×), revelado con un barrido de luz y
destellos sobre sus dos estrellas, sin modificar su diseño.

## Música y sincronía

`public/audio/tefilmo_music.wav` es una composición original generada por síntesis
(`tools/compose_music.py`), sin samples ni material de terceros. Es piano emotivo en Re mayor
con pad, un pulso progresivo desde la ceremonia (14 s) y efectos sutiles: campanas para los anillos,
aire y tela para el ramo, el velo y la cinta, pétalos, papel para el sobre y copas en el brindis.
Está escrita sobre una grilla de 120 BPM, donde 1 tiempo equivale a 15 frames. Los acentos
coinciden con `SYNC` en `src/timing.ts`: anillos en el frame 75, flare en 117–150, wipe en 198,
ramo en 279, velo en 402, sobre en 531–552, cortes de la escena 05 en 600, 630, 657 y 690, copas
en 728, cinta en 801 y acorde final de marca en 825. Mezcla: alrededor de −16 LUFS integrados.

**Voz en off (opcional):** grabá la locución del guion, guardala como `public/audio/voiceover.wav`
(30 s, alineada a la grilla) y poné `voiceover: true` en `src/config.ts`. La música baja
automáticamente. Los textos en pantalla ya respetan las frases y dejan silencios.

## Informe de control de calidad de assets

Todos los PNG traían canal alfa válido. Se corrigieron con `tools/clean_assets.py`. El script deja
solo los componentes alfa del elemento, borra restos pegados, limpia el halo de los bordes, recorta
al contenido y escala ×2. Los originales quedan intactos en `public/assets/original/`.

| Asset | Problema encontrado | Corrección |
|---|---|---|
| 02 | Destellos y fragmento de otro anillo en el borde derecho y superior | Eliminados (los brillos se generan por código) |
| 03 | Trozos de cinta de cine arriba | Eliminados |
| 04 | Fragmento de otra figura a la derecha; base cortada en recto | Eliminado; la base se funde con máscara |
| 05 | Novio de otra lámina a la derecha; el borde superior corta el pelo del novio | Eliminado; el remate del pelo se reconstruyó con la propia textura del cabello reflejada (`domes` en el script) |
| 06 | Fragmentos de otras figuras en ambos bordes | Eliminados (componentes + recorte) |
| 07, 11, 12, 14, 24 | Pedacitos de flores u objetos vecinos en los bordes | Eliminados |
| 08 | Pétalo y flores ajenas arriba y abajo | Eliminados |
| 09 | Hojas y una rosa de otras láminas en las esquinas | Eliminadas; los 4 pétalos se exportaron por separado para animarlos individualmente |
| 10 | Velo cortado en recto de otra figura a la izquierda | Borrado; queda un pequeño borde horizontal en la cola del vestido, disimulado con desenfoque de profundidad y máscara |
| 13 | Fila inferior con farol, cruz y flores de otra lámina | Eliminada |
| 15 | Recortes superiores ajenos | Eliminados; las mangas cortadas quedan fuera de cuadro |
| 16 | Espalda del novio cortada en recto a la izquierda | Fundido con máscara lateral |
| 17 | Silla ajena a la derecha; el borde superior corta las cabezas a la altura de la frente y la espalda del novio | Silla eliminada. La reconstrucción no daba un resultado creíble en silueta, así que se resolvió con encuadre: plano cerrado con los bordes cortados fuera de cuadro y la escala anclada arriba |
| 18 | Fragmento de otra lámina a la derecha y abajo; baja resolución (314 px) | Eliminado; se usa como fondo desenfocado con una placa de color, donde la baja resolución no se nota |
| 19 | Fragmento de arco ajeno a la derecha | Eliminado |
| 20 | Varios tramos sueltos de cinta | Se conserva la cinta principal |
| 21 | Perlas, destellos y pétalo pegados | Eliminados |
| 22 | Perlas, bokeh y aros de otras láminas | Eliminados; el interior del marco se midió para encastrar 19 |
| 23 | Tarjeta y objetos ajenos en los bordes | Eliminados; además se separó en dos capas (`_cerrado` y `_fondo`) para animar la apertura sin fingir una solapa física |

Limitaciones generales: los recortes son de baja resolución (200–830 px de ancho). Se escalaron
con Lanczos y unsharp suave, y la puesta (profundidad de campo, bloom, grano) evita mostrarlos
más grandes de lo que soportan. No se usó ningún asset externo ni se inventaron imágenes. Ningún
asset quedó descartado: los 24 se usan en la escena que les asigna el inventario. El 01 se reutiliza
en la escena 05 según el guion.
