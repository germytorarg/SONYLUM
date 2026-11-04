# LocalBA — reel vertical con títulos, hooks y CTA (Remotion)

1080 × 1920 · 30 fps · 16,2 s · H.264 + AAC. **Video final:** `out/LOCALBA_reel_1080x1920.mp4`

```bash
npm install
npm run studio   # editar / previsualizar
npm run render   # exporta out/LOCALBA_reel_1080x1920.mp4
```
Sin acceso a la descarga de Chrome de Remotion: `REMOTION_CHROME=/ruta/a/chrome npm run render`.

## Guion de títulos (tiempos de salida)

| Tiempo | Toma | Título | Técnica |
|---|---|---|---|
| 0,0–1,9 s | Obelisco (cámara lenta ×0,3 interpolada) | Anillo **VIVÍ BUENOS AIRES · COMO UN LOCAL** + **BUENOS AIRES** | El anillo de texto **gira alrededor del Obelisco**: la mitad trasera pasa por detrás (espejada) y la delantera por delante, siguiendo el eje medido cuadro por cuadro. Después, BUENOS AIRES sale desde detrás del Obelisco |
| 1,9–2,6 s | Avenida | COMO UN / **LOCAL** + carteles VIVÍ BUENOS AIRES / COMO UN LOCAL | **Subtítulos en perspectiva** corriendo sobre las paredes de los edificios, con el punto de fuga real de la toma |
| 1,9–2,6 s | Auto | **SIN** · **VUELTAS** | A los **laterales del auto**, siguiendo su tamaño y posición; el auto los empuja fuera de cuadro; rayas de velocidad |
| 2,6–9,2 s | Recorrido | Hook **¿CUÁNTOS CONOCÉS?** (en Puerto Madero, líneas que avanzan sobre el agua en perspectiva; en Caminito, carteles sobre las paredes de chapa) + etiquetas 01 Floralis Genérica · 02 Planetario · 03 Bosques de Palermo · 04 Puerto Madero · 05 Caminito | Contador de retención |
| 6,0–7,2 s | Palacios | Hook **GUARDÁ ESTE VIDEO** para tu próximo viaje | Llamado a guardar |
| 9,2–9,9 s | Tango | **TANGO** + banda PASIÓN · TANGO · ARRABAL | Golpe con ecos de contorno, sacudida y banda inclinada en perspectiva |
| 9,9–10,5 s | Skyline | TU PRÓXIMA HISTORIA / **EMPIEZA ACÁ** + banda BUENOS AIRES TE ESPERA | Banda en perspectiva |
| 10,5–11,3 s | Obelisco de noche | **¿ARRANCAMOS?** | **Combinación**: primero detrás del Obelisco y, cuando entra el glitch del video, salta adelante con glitch RGB |
| 11,3–16,2 s | Logo | RESERVÁ TU EXPERIENCIA · ESCRIBINOS · **11 5765-2200** · @localba · localba.ar | Logo del propio video, con aire a los costados y sostenido hasta el final |

En todo el video hay golpes de zoom en cada corte, flashes en los acentos y una viñeta para que los títulos se lean.

## Audio
- Música original del video, desplazada 1,3 s para compensar la cámara lenta inicial. Los cortes siguen cayendo en los golpes.
- `public/audio/sfx.wav`: efectos sintetizados para este reel (`tools/sfx.py`): boom y riser de arranque, impactos en los títulos, paso del auto, pops de etiquetas, glitch, y boom con cola en el logo, donde el video original queda en silencio.

## Archivos
- `public/video/localba_src.mp4`: video original.
- `public/open`: cámara lenta interpolada de la apertura (ffmpeg minterpolate) con sus recortes; `public/night`: cuadros del Obelisco nocturno. Recortes con `tools/foreground_mattes.py`; eje del Obelisco por cuadro en `src/obeliskAxis.json`.
- `src/timing.ts`: cortes y mapeo de tiempos; `src/LocalBA.tsx`: composición; `src/components.tsx`: títulos, etiquetas, glitch e iconos.
- Tipografías: Anton y Montserrat (OFL), autoalojadas en `public/fonts`.
