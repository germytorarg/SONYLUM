"""
Prepara los assets derivados del proyecto (se ejecuta una sola vez; los
resultados ya están versionados en public/).

  python3 -I tools/prepare_assets.py

1. Separa el logo SONYLUM en piezas independientes (4 piezas del símbolo +
   7 letras), todas sobre el mismo lienzo para que se alineen solas y
   puedan animarse sin deformar el logo.
2. Genera las texturas analógicas: papel marfil con fibras y 3 variantes de
   grano fotográfico.
"""
import os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public")
rng = np.random.default_rng(7)


def split_sonylum():
    logo = Image.open(os.path.join(ROOT, "brands", "sonylum.png")).convert("RGBA")
    rgba = np.array(logo)
    alpha = rgba[..., 3]
    lab, n = ndi.label(alpha > 20)
    names = {
        1: "arc-top", 2: "chevron-left", 3: "chevron-right", 4: "arc-bottom",
        5: "letter-s", 6: "letter-o", 7: "letter-n", 8: "letter-y",
        9: "letter-l", 10: "letter-u", 11: "letter-m",
    }
    assert n == 11, f"esperaba 11 piezas, encontré {n}"
    out_dir = os.path.join(ROOT, "brands", "sonylum-parts")
    os.makedirs(out_dir, exist_ok=True)
    for idx, name in names.items():
        region = ndi.binary_dilation(lab == idx, iterations=3)
        part = rgba.copy()
        part[..., 3] = np.where(region, alpha, 0)
        Image.fromarray(part).save(os.path.join(out_dir, f"{name}.png"))
    print("sonylum parts:", logo.size)


def split_creando():
    """Esquinas del visor (4) + bloque tipográfico, sobre el mismo lienzo."""
    logo = Image.open(os.path.join(ROOT, "brands", "creando-contenidos.png")).convert("RGBA")
    rgba = np.array(logo)
    alpha = rgba[..., 3]
    H, W = alpha.shape
    lab, n = ndi.label(alpha > 20)
    out_dir = os.path.join(ROOT, "brands", "creando-parts")
    os.makedirs(out_dir, exist_ok=True)
    groups = {"corner-tl": [], "corner-tr": [], "corner-bl": [], "corner-br": [], "type": []}
    for i, sl in enumerate(ndi.find_objects(lab), start=1):
        h = sl[0].stop - sl[0].start
        w = sl[1].stop - sl[1].start
        is_corner = w > 120 and h > 120
        if not is_corner:
            groups["type"].append(i)
            continue
        top = sl[0].start < H / 2
        left = sl[1].start < W / 2
        groups[f"corner-{'t' if top else 'b'}{'l' if left else 'r'}"].append(i)
    for name, ids in groups.items():
        region = ndi.binary_dilation(np.isin(lab, ids), iterations=3)
        part = rgba.copy()
        part[..., 3] = np.where(region, alpha, 0)
        Image.fromarray(part).save(os.path.join(out_dir, f"{name}.png"))
    print("creando parts:", {k: len(v) for k, v in groups.items()})


def flatten_torn_paper():
    """La hoja fotografiada venía con la luz de una escena oscura: se aplana la
    iluminación (flat-field) conservando la fibra y el borde rasgado."""
    path = os.path.join(ROOT, "objects", "torn-paper.png")
    im = np.array(Image.open(path).convert("RGBA")).astype(float)
    rgb, a = im[..., :3], im[..., 3:] / 255
    lum = rgb.mean(-1)
    w = (a[..., 0] > 0.6).astype(float)
    num = ndi.gaussian_filter(lum * w, 28)
    den = ndi.gaussian_filter(w, 28) + 1e-4
    illum = np.maximum(num / den, 40)
    target = np.array([243, 237, 226], float)
    detail = np.clip(lum / illum, 0.9, 1.06)[..., None]
    out = np.clip(target[None, None, :] * (0.35 + 0.65 * detail), 0, 255)
    Image.fromarray(np.dstack([out, a * 255]).astype(np.uint8)).save(path)


def paper_texture(w=1080, h=1920):
    def smooth(scale, amp):
        small = rng.normal(0, 1, (h // scale + 2, w // scale + 2))
        img = Image.fromarray(((small - small.min()) / np.ptp(small) * 255).astype(np.uint8))
        img = img.resize((w, h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(scale / 3))
        return (np.array(img).astype(float) / 255 - 0.5) * amp

    lum = smooth(240, 10) + smooth(60, 6) + smooth(12, 3)
    # fibras: trazos finos y largos en direcciones aleatorias
    fib = Image.new("L", (w, h), 0)
    from PIL import ImageDraw
    d = ImageDraw.Draw(fib)
    for _ in range(1400):
        x, y = rng.uniform(0, w), rng.uniform(0, h)
        a = rng.uniform(0, np.pi)
        L = rng.uniform(8, 46)
        pts = [(x, y)]
        for k in range(4):
            a += rng.normal(0, 0.35)
            x += np.cos(a) * L / 4
            y += np.sin(a) * L / 4
            pts.append((x, y))
        d.line(pts, fill=int(rng.uniform(30, 120)), width=1)
    fib = np.array(fib.filter(ImageFilter.GaussianBlur(0.6))).astype(float) / 255
    base = np.array([234, 226, 212], float)
    img = base[None, None, :] + lum[..., None] - fib[..., None] * np.array([14, 15, 17])
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(
        os.path.join(ROOT, "textures", "paper.jpg"), quality=92
    )


def grain_tiles(w=540, h=960, count=3):
    for i in range(count):
        g = rng.normal(0, 1, (h, w))
        g = ndi.gaussian_filter(g, 0.55)
        g = (g - g.min()) / np.ptp(g)
        lum = (g * 255).astype(np.uint8)
        Image.fromarray(lum).convert("RGB").save(os.path.join(ROOT, "textures", f"grain-{i}.jpg"), quality=88)


if __name__ == "__main__":
    os.makedirs(os.path.join(ROOT, "textures"), exist_ok=True)
    split_sonylum()
    split_creando()
    # flatten_torn_paper() se aplica una sola vez sobre el recorte original
    paper_texture()
    grain_tiles()
    print("ok")
