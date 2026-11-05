# Seteo Higgsfield: presentador en el living (voz y cara OK)

Usado en `proyectos/2026-11-ansiedad/` (5/11/2026). Pedile a Claude: "usá el seteo de plantillas/higgsfield-presentador.md" + el guion.

## Parámetros
- Modelo: `wan3_0_prime`
- Formato: 9:16, 1080p, `generate_audio: true`
- Duración: 4–9 s por clip (un clip por frase o idea)

## Referencias (IDs en Higgsfield)
- @Video1, personaje y voz: video_input `9d223014-90b3-4e04-ba2e-8d7d38978e18`
- @Image1, locación (living, sofá verde, lámpara hongo roja, cuadros): image_job `63dd40d2-9028-434a-8ae6-efb43e4041b2`

## Prompt base (siempre igual)
```
@Video1 is the reference of the character and voice. Preserve the wardrobe; its room, light and framing are not the scene. @Image1 defines the location: its space, furniture, materials and light. It is a place, not a fixed camera position; the shot below sets the camera and the presenter's position in it.

Audio: Generate only the presenter's clean, close-miked speaking voice in Spanish, with the same timbre and accent as @Video1. Use reference audio for voice identity only. Keep the background silent. No music, score, instrumental bed, ambient sounds, sound effects or other voices. Do not carry over background audio from the references.
```

## Parte que cambia en cada clip
```
Delivery: <tono, ritmo, qué palabra enfatizar>. Eyes into the lens.

Body: he talks with his hands. On "<palabra>", <gesto>. ...

SHOT — <close-up | medium close-up | medium | wide>: the frame runs from <...> to <...>; <frontal | three-quarter>, the lens level with his eyes, <locked off | slow push-in>: he sits on the green sofa; behind him, <fondo>.
Character says:
"<texto en español>"
```

## Armado final
Clips unidos en orden + reloj arriba (hora de cada momento) + subtítulos palabra por palabra.
Resultado de referencia: `proyectos/2026-11-ansiedad/ansiedad-reel-higgsfield.mp4`.
