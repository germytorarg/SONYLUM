# Ser Asertivo · promo vertical

Video 9:16 (1080×1920, 30 fps, ~20 s) para Reels / TikTok, hecho en código.

- `promo.html`: toda la animación (GSAP, una sola línea de tiempo). Abrilo en el navegador para verla en loop.
- `render.mjs`: la exporta a MP4 cuadro por cuadro (captura a 60 fps y mezcla pares de cuadros para un motion blur suave).
- `ser-asertivo-promo.mp4`: el render final, sin audio (sumale el sonido en la app).

## Escenas

| Tiempo | Escena |
| --- | --- |
| 0–3.9 s | Celular en 3D, llega la notificación: "¿Cuándo fue la última vez que dijiste que no sin sentir culpa?" |
| 3.9–6.9 s | Pantalla "¿Qué te está pesando hoy?", se tildan Decir que no, Poner límites, Autoestima |
| 6.9–10.9 s | Empatía, Aceptación y Autenticidad entran, se funden y revelan a Sandra |
| 11–13.6 s | Revelado de marca: monograma con brillo, ser.asertivo letra por letra, pilares |
| 13.7–17.4 s | WhatsApp: se escribe y envía "Hola Sandra, quiero empezar 🙂" |
| 17.4–20.6 s | Cierre: "Conocerse es comprenderse." + botón Escribime + @ser.asertivo |

Los subtítulos palabra por palabra están en el array `CAPTIONS` de `promo.html` (`[palabra, segundo, estilo]`), dentro de la zona segura de TikTok.

## Renderizar

```sh
npm i playwright   # usa el Chromium de Playwright
node render.mjs                     # -> ser-asertivo-promo.mp4
node render.mjs prueba.mp4 --from 6 --to 11   # solo un tramo
```

Necesita `ffmpeg` en el PATH.
