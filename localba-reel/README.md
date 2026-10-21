# LocalBA — reel vertical con títulos, hooks y CTA (Remotion)

1080 × 1920 · 30 fps · 15,5 s · H.264 + AAC. **Video final:** `out/LOCALBA_reel_1080x1920.mp4`

```bash
npm install
npm run studio   # editar / previsualizar
npm run render   # exporta out/LOCALBA_reel_1080x1920.mp4
```
Sin acceso a la descarga de Chrome de Remotion: `REMOTION_CHROME=/ruta/a/chrome npm run render`.

## Guion de títulos (tiempos de salida)

| Tiempo | Toma | Título | Técnica |
|---|---|---|---|
| 0,0–1,2 s | Obelisco (cámara lenta ×0,5) | VIVÍ / **BUENOS AIRES** | El texto sale desde **detrás del Obelisco** (recorte de cielo cuadro por cuadro) |
| 1,2–1,9 s | Avenida | COMO UN / **LOCAL** | Golpe con aberración cromática |
| 1,9–2,6 s | Auto | **SIN** · **VUELTAS** | A los **laterales del auto**, siguiendo su tamaño y posición; el auto los empuja fuera de cuadro; rayas de velocidad |
| 2,6–8,5 s | Recorrido | Hook **¿CUÁNTOS CONOCÉS?** + etiquetas 01 Floralis Genérica · 02 Planetario · 03 Bosques de Palermo · 04 Puerto Madero · 05 Caminito | Contador de retención |
| 5,3–6,5 s | Palacios | Hook **GUARDÁ ESTE VIDEO** para tu próximo viaje | Llamado a guardar |
| 8,5–9,2 s | Tango | **TANGO** | Golpe con ecos de contorno y sacudida |
| 9,2–9,8 s | Skyline | TU PRÓXIMA HISTORIA / **EMPIEZA ACÁ** | |
| 9,8–10,6 s | Obelisco de noche | **¿ARRANCAMOS?** | **Combinación**: primero detrás del Obelisco y, cuando entra el glitch del video, salta adelante con glitch RGB |
| 10,6–15,5 s | Logo | RESERVÁ TU EXPERIENCIA · ESCRIBINOS · **11 5765-2200** · @localba · localba.ar | Logo del propio video, con aire a los costados y sostenido hasta el final |

En todo el video hay golpes de zoom en cada corte, flashes en los acentos y una viñeta para que los títulos se lean.

## Audio
- Música original del video, desplazada 0,6 s para compensar la cámara lenta inicial. Los cortes siguen cayendo en los golpes.
- `public/audio/sfx.wav`: efectos sintetizados para este reel (`tools/sfx.py`): boom y riser de arranque, impactos en los títulos, paso del auto, pops de etiquetas, glitch, y boom con cola en el logo, donde el video original queda en silencio.

## Archivos
- `public/video/localba_src.mp4`: video original.
- `public/bg`, `public/fg`: cuadros de las dos tomas del Obelisco y sus recortes de primer plano (`tools/foreground_mattes.py`).
- `src/timing.ts`: cortes y mapeo de tiempos; `src/LocalBA.tsx`: composición; `src/components.tsx`: títulos, etiquetas, glitch e iconos.
- Tipografías: Anton y Montserrat (OFL), autoalojadas en `public/fonts`.
