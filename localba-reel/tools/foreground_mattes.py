"""Recorte de primer plano (Obelisco + ciudad) para poner títulos DETRÁS.

Separa el cielo del resto con un keying de color por cuadro y exporta el
primer plano como WebP con alfa. En Remotion el título va entre el video y
este recorte, así queda oculto por el Obelisco y los edificios.

Uso:
  python3 -I tools/foreground_mattes.py <dir_frames> <dir_salida> day 0 35
  python3 -I tools/foreground_mattes.py <dir_frames> <dir_salida> night 554 600
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage


def sky_mask(rgb, mode):
    r, g, b = [rgb[..., i].astype(np.float32) for i in range(3)]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    if mode == "day":
        # cielo azul saturado: azul claramente dominante sobre rojo
        sky = (b - r > 38) & (b > 110)
    else:
        # cielo nocturno: oscuro y frío; el Obelisco iluminado queda fuera
        sky = (lum < 92) & (b >= r - 6)
    h = sky.shape[0]
    # solo cuenta como cielo lo conectado al borde superior (evita ventanas, reflejos)
    sky = ndimage.binary_opening(sky, iterations=2)
    lab, n = ndimage.label(sky)
    top = np.unique(lab[: max(4, h // 60)])
    top = top[top > 0]
    sky = np.isin(lab, top)
    sky = ndimage.binary_closing(sky, iterations=3)
    sky = ndimage.binary_fill_holes(sky | ~ndimage.binary_dilation(~sky, iterations=1)) & sky | sky
    return sky


def main(src, dst, mode, f0, f1):
    os.makedirs(dst, exist_ok=True)
    for k in range(f0, f1 + 1):
        p = os.path.join(src, f"src_{k:04d}.png")
        if not os.path.exists(p):
            continue
        rgb = np.array(Image.open(p).convert("RGB"))
        sky = sky_mask(rgb, mode)
        fg = 1.0 - ndimage.gaussian_filter(sky.astype(np.float32), 1.2)
        # el borde del recorte se contrae medio píxel para no arrastrar cielo
        fg = np.clip((fg - 0.15) / 0.85, 0, 1)
        rgba = np.dstack([rgb, (fg * 255).astype(np.uint8)])
        Image.fromarray(rgba, "RGBA").save(os.path.join(dst, f"fg_{k:04d}.webp"), quality=88, method=4)
    print("ok", mode, f0, f1)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5]))
