"""Splits foto.png into the layers the hologram animation needs.

- clean.png      the photo with the card removed (inpainted dark jacket behind it)
- card.png       the empty glass card (border glow, no content), transparent around it
- the content (logo, name, stats, lines, link) is cut from the original photo by the page itself,
  using the boxes in PIECES below, so the text stays exactly as in the photo.

Coordinates are in the photo's own pixels (941 x 1672). Usage: python3 prep.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).parent
SRC = np.asarray(Image.open(HERE / "assets/foto.png").convert("RGB")).astype(np.float32)
H, W, _ = SRC.shape

# Card corners (slightly tilted: the right side sits lower)
QUAD = [(133, 663), (838, 703), (836, 1168), (132, 1163)]

# Content boxes [x0, y0, x1, y1] and what they are
PIECES = {
    "avatar": [168, 700, 366, 904],
    "name": [392, 726, 770, 790],
    "handle": [392, 774, 548, 810],
    "stat1": [392, 860, 530, 894], "stat2": [570, 866, 680, 900], "stat3": [726, 870, 814, 904],
    "num1": [392, 826, 440, 864], "num2": [570, 832, 632, 870], "num3": [726, 836, 788, 876],
    "rule": [170, 904, 802, 918],
    "line1": [184, 922, 580, 970], "line2": [184, 968, 504, 1008], "line3": [184, 1005, 520, 1047],
    "line4": [184, 1044, 600, 1088],
    "link": [180, 1086, 412, 1140],
}


def blur(a, r):
    """Separable box blur x3 (close to a gaussian), on HxW or HxWxC float arrays."""
    out = a.copy()
    for _ in range(3):
        for axis in (0, 1):
            c = np.cumsum(np.pad(out, [(r + 1, r) if i == axis else (0, 0) for i in range(out.ndim)], mode="edge"), axis=axis)
            hi = np.take(c, np.arange(2 * r + 1, c.shape[axis]), axis=axis)
            lo = np.take(c, np.arange(0, c.shape[axis] - 2 * r - 1), axis=axis)
            out = (hi - lo) / (2 * r + 1)
    return out


def inpaint(img, hole, radii=(160, 80, 40, 20, 10, 5)):
    """Fill `hole` (bool) from its surroundings with normalized blurs, coarse to fine.
    Each finer pass only overrides where it has enough known pixels nearby."""
    keep = (~hole).astype(np.float32)
    fill = img.copy()
    for i, r in enumerate(radii):
        num = blur(img * keep[..., None], r)
        den = blur(keep, r)[..., None]
        est = num / np.maximum(den, 1e-6)
        w = np.ones_like(den) if i == 0 else np.clip(den * 4, 0, 1)
        fill = np.where(hole[..., None], w * est + (1 - w) * fill, fill)
    return fill


def mask_from(draw_fn):
    m = Image.new("L", (W, H), 0)
    draw_fn(ImageDraw.Draw(m))
    return np.asarray(m) > 127


quad = mask_from(lambda d: d.polygon(QUAD, fill=255))
inner = mask_from(lambda d: d.polygon([(x + (14 if i in (0, 3) else -14), y + (14 if i < 2 else -14)) for i, (x, y) in enumerate(QUAD)], fill=255))

# 1 · empty card: remove everything bright inside the card (text, icons, logo ring)
luma = SRC @ np.array([.299, .587, .114], np.float32)
local = blur(luma, 20)
content = inner & (luma > local + 18)
x0a, y0a, x1a, y1a = PIECES["avatar"]
content |= mask_from(lambda d: d.ellipse([x0a - 8, y0a - 8, x1a + 8, y1a + 8], fill=255))
content = blur(content.astype(np.float32), 3) > .05
empty = inpaint(SRC, content)

# 2 · clean plate: refill the glowing border from both sides, then take the glass tint off
qf = blur(quad.astype(np.float32), 5)
border = (qf > .01) & (qf < .99)
clean = inpaint(empty, border)
inside = blur((qf > .99).astype(np.float32), 4)[..., None]
clean = clean * (1 - inside * .2)
Image.fromarray(np.clip(clean, 0, 255).astype(np.uint8)).save(HERE / "assets/clean.png")

# 3 · card layer: the empty card plus its glow, alpha fades out beyond the glow
alpha = blur(quad.astype(np.float32), 22)
alpha = np.clip(alpha * 2.2, 0, 1)
x0, y0, x1, y1 = 96, 630, 876, 1205
rgba = np.dstack([np.clip(empty, 0, 255), alpha * 255]).astype(np.uint8)[y0:y1, x0:x1]
Image.fromarray(rgba, "RGBA").save(HERE / "assets/card.png")

(HERE / "assets/layout.json").write_text(json.dumps({"size": [W, H], "quad": QUAD, "card": [x0, y0, x1, y1], "pieces": PIECES}, indent=1))
print("ok")
