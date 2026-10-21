"""Limpieza de los PNG del kit TEFILMO.

- Conserva solo los componentes alfa que pertenecen al elemento (descarta
  restos de otras ilustraciones que quedaron en los bordes del recorte).
- Recorte manual opcional para restos que están pegados al elemento.
- Defringe: limpia el halo claro/oscuro de los bordes semitransparentes.
- Recorta al bounding box y escala x2 (Lanczos + unsharp suave).

Uso: python3 -I tools/clean_assets.py public/assets/original public/assets/clean
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

# keep: cantidad de componentes (ordenados por área) que se conservan.
# box: (x0, y0, x1, y1) en px originales; fuera de esa caja el alfa se anula.
# erase: rectángulos (x0, y0, x1, y1) donde se anula el alfa (restos pegados).
# split: exporta cada componente por separado (pétalos individuales).
# layers: divide el elemento en capas por polígono (sobre abierto / cerrado).
# domes: remates de cabeza cortados por el borde superior del recorte. Cada
#   domo (cx, rx, ry, tilt°, rim) se apoya en la fila 0. Sin rim se rellena
#   con la textura reflejada de la propia imagen (pelo); con rim (siluetas a
#   contraluz) se usa el tono oscuro de la cabeza y luz de borde cálida.
SPEC = {
    "01_anillos_entrelazados": {},
    "02_anillo_solitario": {},
    "03_destellos": {},
    "04_silueta_encuentro": {},
    "05_novios_de_frente": {"domes": [(118, 20, 11, -8, 0.0)]},
    "06_novios_caminando": {"box": (0, 0, 303, 490)},
    "07_ramo": {},
    "08_rosa_individual": {},
    "09_petalos": {"split": 4},
    "10_novia_sola": {"erase": [(0, 0, 58, 365)]},
    "11_iglesia": {},
    "12_arco_floral": {},
    "13_pasillo_ceremonia": {},
    "14_velas": {},
    "15_manos_alianza": {},
    "16_novios_abrazo": {},
    # 17: cabezas cortadas por el borde superior; se resuelve con encuadre (borde fuera de cuadro).
    "17_novios_beso_silueta": {},
    "18_atardecer_mar": {},
    "19_novios_atardecer": {"box": (0, 0, 323, 350)},
    "20_cinta_cine": {},
    "21_lazo_saten": {"erase": [(280, 165, 326, 200), (205, 262, 326, 336)]},
    "22_marco_dorado": {},
    "23_sobre_invitacion": {
        "erase": [(0, 0, 26, 365), (0, 255, 40, 365)],
        "layers": {
            "cerrado": [(134, 157), (401, 116), (444, 116), (444, 389), (161, 389), (161, 314)],
        },
    },
    "24_copa_brindis": {},
}
SCALE = 2
PAD = 6


def components(alpha):
    m = ndimage.binary_closing(alpha > 40, iterations=2)
    lab, n = ndimage.label(m)
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    order = np.argsort(-sizes) + 1
    return lab, order


def add_domes(rgba, domes):
    """Completa cabezas cortadas por el borde superior con píxeles propios."""
    pad = int(max(d[2] for d in domes)) + 6
    h, w = rgba.shape[:2]
    out = np.zeros((h + pad, w, 4), np.float32)
    out[pad:] = rgba
    src = rgba.astype(np.float32)
    ys, xs = np.mgrid[0:pad, 0:w]
    yo = ys - pad + 0.5  # coordenada original (negativa: por encima del corte)
    for cx, rx, ry, tilt, rim in domes:
        t = np.radians(tilt)
        dx, dy = xs - cx, yo
        u = dx * np.cos(t) + dy * np.sin(t)
        v = -dx * np.sin(t) + dy * np.cos(t)
        r = np.sqrt((u / rx) ** 2 + (v / ry) ** 2)
        inside = np.clip((1.0 - r) * min(rx, ry) / 1.5, 0, 1)
        # textura reflejada respecto de la fila 0
        sy = np.clip(-yo.astype(int), 0, h - 1)
        sx = np.clip(xs, 0, w - 1)
        col = src[sy, sx, :3]
        ok = src[sy, sx, 3:4] > 200
        row = src[0:6, max(0, cx - rx):cx + rx]
        mean = np.median(row[row[..., 3] > 200][:, :3], axis=0)
        col = np.where(ok, col, mean)
        if rim > 0:
            dark = row[(row[..., 3] > 200) & (row[..., :3].mean(-1) < 60)][:, :3]
            tone = np.median(dark, axis=0)
            # leve degradé vertical para que no quede plano
            col = np.broadcast_to(tone, col.shape) * (1 + 0.12 * (yo / pad))[..., None]
            band = np.clip(1 - np.abs(r - 0.93) / 0.09, 0, 1)[..., None] * rim
            col = col * (1 - band) + np.array([255, 198, 132], np.float32) * band
        a_new = inside * 255
        blend = (a_new > out[:pad, :, 3])[..., None]
        out[:pad, :, :3] = np.where(blend, col, out[:pad, :, :3])
        out[:pad, :, 3] = np.maximum(out[:pad, :, 3], a_new)
    return np.clip(out, 0, 255).astype(np.uint8)


def defringe(rgba):
    rgb = rgba[..., :3].astype(np.float32)
    a = rgba[..., 3].astype(np.float32) / 255.0
    # Color "descontaminado": promedio ponderado por alfa de los vecinos,
    # evita el halo del fondo de la lámina en los píxeles de borde.
    k = 2.0
    num = np.stack([ndimage.gaussian_filter(rgb[..., c] * a, k) for c in range(3)], -1)
    den = ndimage.gaussian_filter(a, k)[..., None] + 1e-6
    bleed = num / den
    edge = ((a > 0.02) & (a < 0.92))[..., None]
    rgb = np.where(edge, bleed, rgb)
    # Endurece levemente el alfa y suaviza el escalonado.
    a = np.clip((a - 0.08) / 0.84, 0, 1)
    a = ndimage.gaussian_filter(a, 0.6)
    out = np.dstack([np.clip(rgb, 0, 255), a * 255]).astype(np.uint8)
    return out


def finish(arr, out_path):
    a = arr[..., 3]
    ys, xs = np.nonzero(a > 4)
    y0, y1 = max(ys.min() - PAD, 0), min(ys.max() + PAD + 1, a.shape[0])
    x0, x1 = max(xs.min() - PAD, 0), min(xs.max() + PAD + 1, a.shape[1])
    im = Image.fromarray(arr[y0:y1, x0:x1], "RGBA")
    im = im.resize((im.width * SCALE, im.height * SCALE), Image.LANCZOS)
    r, g, b, al = im.split()
    rgb = Image.merge("RGB", (r, g, b)).filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=2))
    im = Image.merge("RGBA", (*rgb.split(), al))
    im.save(out_path, optimize=True)
    return im.size


def main(src, dst):
    os.makedirs(dst, exist_ok=True)
    for name, spec in SPEC.items():
        rgba = np.array(Image.open(os.path.join(src, name + ".png")).convert("RGBA"))
        if "box" in spec:
            x0, y0, x1, y1 = spec["box"]
            mask = np.zeros(rgba.shape[:2], bool)
            mask[y0:y1, x0:x1] = True
            rgba[..., 3] = np.where(mask, rgba[..., 3], 0)
        if "domes" in spec:
            rgba = add_domes(rgba, spec["domes"])
        for x0, y0, x1, y1 in spec.get("erase", []):
            rgba[y0:y1, x0:x1, 3] = 0
        lab, order = components(rgba[..., 3])
        if "split" in spec:
            for i, cid in enumerate(order[: spec["split"]]):
                part = rgba.copy()
                keep = ndimage.binary_dilation(lab == cid, iterations=3)
                part[..., 3] = np.where(keep, part[..., 3], 0)
                size = finish(defringe(part), os.path.join(dst, f"{name}_{i + 1}.png"))
                print(f"{name}_{i + 1}", size)
            continue
        keep = np.isin(lab, order[: spec.get("keep", 1)])
        keep = ndimage.binary_dilation(keep, iterations=3)
        rgba[..., 3] = np.where(keep, rgba[..., 3], 0)
        size = finish(defringe(rgba), os.path.join(dst, name + ".png"))
        print(name, size)
        if "layers" in spec:
            # Las capas comparten el mismo lienzo para poder superponerlas 1:1.
            rest = np.ones(rgba.shape[:2], bool)
            for lname, poly in spec["layers"].items():
                mimg = Image.new("L", rgba.shape[1::-1], 0)
                ImageDraw.Draw(mimg).polygon(poly, fill=255)
                m = np.array(mimg) > 0
                rest &= ~m
                save_layer(rgba, m, os.path.join(dst, f"{name}_{lname}.png"))
            save_layer(rgba, rest, os.path.join(dst, f"{name}_fondo.png"))


def save_layer(rgba, mask, path):
    part = rgba.copy()
    part[..., 3] = np.where(mask, part[..., 3], 0)
    part = defringe(part)
    im = Image.fromarray(part, "RGBA")
    im = im.resize((im.width * SCALE, im.height * SCALE), Image.LANCZOS)
    im.save(path, optimize=True)
    print(os.path.basename(path), im.size)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
