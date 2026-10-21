# Mirinda: aviso vertical con lata 3D (Remotion + Three.js)

1080 × 1920 · 30 fps · 12 s · H.264 + AAC. **Video:** `out/MIRINDA_aviso_1080x1920.mp4`

```bash
npm install
npm run studio   # editar / previsualizar
npm run render   # exporta el MP4 (WebGL con --gl=angle)
```
Sin acceso a la descarga de Chrome de Remotion: `REMOTION_CHROME=/ruta/a/chrome npm run render`.

## Cómo está hecha la lata 3D
`tools/build_can.py` convierte la foto frontal (`public/assets/src/mirinda_lata.png`) en un modelo:
- **Silueta real:** radio por altura medido en la foto, con LatheGeometry.
- **Etiqueta desenrollada** sobre el cilindro: exacta en el frente y comprimida solo cerca de los bordes. Se le quita la luz «horneada» de la foto para que la luz 3D modele la lata al girar.
- **Tapa con anillita,** reconstruida desde la elipse de la foto.
- **Limitación:** la foto solo muestra el frente, así que la parte de atrás repite el frente (la marca aparece dos veces por vuelta, como en los mockups de producto). Las costuras laterales van fundidas.

Material con barniz (clearcoat), reflejos de estudio y contraluces naranjas que laten con el beat.

## Guion (frames)
| Frames | Momento |
|---|---|
| 0–15 | Negro texturado, «pssst» de la lata y destello naranja |
| 15–45 | La lata cae girando y frena de frente |
| 45 | Impacto: flash, onda expansiva y salpicadura naranja |
| 45–150 | Flota y gira lento; gotas que corren, vapor frío, burbujas; HELADA. / BURBUJEANTE |
| 150–180 | Giro rápido de 2 vueltas con estelas; SABOR / NARANJA |
| 180–262 | Acercamiento con la tapa a la vista; PURA / FRESCURA |
| 270–360 | Logo 3D MIRINDA con golpe y brillo; BIEN FRÍA. BIEN NARANJA.; firma |

## Audio
`tools/audio.py`: banda original sintetizada a 120 BPM (1 tiempo = 15 frames), con «pssst», burbujeo, whooshes, impacto y boom del logo.

## Opciones
- La firma «CREANDO CONTENIDOS × SONYLUM» se quita con `SHOW_CREDIT = false` en `src/Mirinda.tsx`.
- Los textos están en `WORDS` y en `EndCard` (`src/Mirinda.tsx`); los tiempos, en `src/timing.ts`.
