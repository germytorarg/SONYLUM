# SONYLUM

Punto de partida limpio para trabajar con Claude.

```
assets/          material reutilizable
  marcas/        logos y manuales de cada marca
  tipografias/   fuentes (woff2 / ttf)
  audio/         música y efectos
  video/         footage: dron/, camara/, celular/
  imagenes/      fotos, PNG, texturas
proyectos/       una carpeta por trabajo (ej. proyectos/2026-11-mirinda/)
plantilla-motion/ base de Remotion: 1080×1920, 4K vertical (2160×3840) y 4K horizontal (3840×2160)
.claude/skills/  diseño (taste, impeccable, ui-ux-pro-max, awesome-design-md) y video
                 (hyperframes*, faceless-explainer estilo Vox, motion-graphics, music-to-video,
                 talking-head-recut, embedded-captions, remotion-reels, procedural-film, scroll-world…)
```

Nuevo proyecto: copiar `plantilla-motion/` a `proyectos/<nombre>/`, `npm install`, `npm run studio`.
Render: `npm run render` · `npm run render:4k` · `npm run render:16x9`.

Remotion y el resto de las skills de la cuenta ya están disponibles en cada sesión.
Los proyectos anteriores (TEFILMO, LocalBA) quedan guardados en la rama ccr-0635ff16-cpd22g.
