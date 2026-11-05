# Promos con dispositivos · Sonylum y Creando Contenidos

Videos verticales 9:16 (1080×1920, 30 fps, unos 23 s), sin subtítulos ni audio. Fondo negro con violeta tornasolado.

- `device-promo.html?brand=sonylum` o `?brand=creando`: la animación (GSAP, una sola línea de tiempo). Abrila en el navegador para verla en loop.
- `render.mjs`: exporta los MP4 (`promo-sonylum.mp4`, `promo-creando.mp4`).
- `assets/web-*.mp4`: grabaciones de las páginas que se ven dentro de los celulares. A la de Sonylum se le recortó el reloj de la captura y a las dos se les sacó el final con las notificaciones.
- `assets/logo-*.png`: logos (blancos con transparencia; se usan como máscara del degradé tornasolado).

## Escenas

1. Logo tornasolado que aparece desenfocado y se aclara, con destello.
2. Celular en 3D con la página haciendo scroll real.
3. Tres celulares en profundidad, cada uno en otra sección de la página.
4. Alguien escribe por WhatsApp a Germán, envía, doble tilde azul y "escribiendo…".
5. Cierre: logo, frase, botón de WhatsApp 11 5765-2300 e Instagram/web.

Los textos de cada marca (mensaje de WhatsApp, frase final, usuarios y qué parte de la grabación muestra cada celular) están en el objeto `BRANDS` al principio del script.

## Renderizar

```sh
npm i playwright
node render.mjs              # las dos marcas
node render.mjs creando      # una sola
```

La primera vez extrae los cuadros de las grabaciones a `frames/` (no se versiona). Necesita `ffmpeg`.

## Sonido

`promo-sonylum-sonido.mp4` y `promo-creando-sonido.mp4` son los mismos videos con diseño de sonido sincronizado al cuadro: arme del logo, golpe con el destello, etiquetas y tarjetas, cada tecla del mensaje, envío de WhatsApp, doble tilde, notificación, transiciones y cierre, con una base musical oscura a 100 BPM. Todo sintetizado (sin samples de terceros).

```sh
node events.mjs > events.json   # tiempos de cada evento de la animación
python3 sound.py events.json    # -> sound-sonylum.wav, sound-creando.wav
ffmpeg -i promo-sonylum.mp4 -i sound-sonylum.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest promo-sonylum-sonido.mp4
```
