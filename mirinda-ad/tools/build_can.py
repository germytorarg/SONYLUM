"""Convierte la foto frontal de la lata en un modelo 3D texturizable.

Salidas:
  public/assets/can_label.jpg  etiqueta desenrollada (u = ángulo, 0 = frente)
  public/assets/can_lid.png    tapa reconstruida desde la elipse de la foto
  public/assets/mirinda_logo.png logo 3D recortado
  src/canProfile.json          perfil (radio por altura) para LatheGeometry

La foto trae la luz "horneada" (bordes oscuros del cilindro); se aplana por
columna para que la iluminación 3D sea la que modele la lata al girar. La foto
solo muestra el frente: la parte trasera repite el frente (el logo aparece dos
veces por vuelta, como en los mockups de producto).

Uso: python3 -I tools/build_can.py <lata.png> <logo.png>
"""
import json
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

Y_TOP, Y_BOT = 110, 1350  # cuerpo (debajo de la tapa / arriba del fondo)
LID_C, LID_A, LID_B = (543.0, 82.0), 290.0, 52.0
TEX_W = 2048
SEAM = np.radians(16)  # ancho del fundido en cada costura


def main(can_path, logo_path):
    im = np.array(Image.open(can_path).convert('RGBA')).astype(np.float32)
    rgb, a = im[..., :3], im[..., 3]

    # perfil por fila
    rows = np.arange(Y_TOP, Y_BOT)
    cen, rad = [], []
    for y in rows:
        xs = np.nonzero(a[y] > 128)[0]
        cen.append((xs.min() + xs.max()) / 2)
        rad.append((xs.max() - xs.min()) / 2)
    cen = ndimage.gaussian_filter1d(np.array(cen), 6)
    # el borde de la foto tiene gotas: se toma un radio liso (mediana móvil + suavizado fuerte)
    rad = ndimage.median_filter(np.array(rad), 61, mode='nearest')
    rad = ndimage.gaussian_filter1d(rad, 14, mode='nearest')

    # etiqueta desenrollada: frente en u=0 y copia trasera en u=0,5. En cada
    # costura (±90°) se funde el borde derecho de la foto con el izquierdo.
    u = np.arange(TEX_W) / TEX_W
    phi = (u * 2 * np.pi + np.pi) % (2 * np.pi) - np.pi  # [-pi, pi)
    ys = np.broadcast_to(rows[:, None], (len(rows), TEX_W)).astype(np.float32)

    def remap(ang):
        # exacto en el frente (|φ| < 55°); cerca del borde se comprime hasta 78°
        a0, a1 = np.radians(55), np.radians(78)
        d = np.abs(ang)
        k = (np.pi / 2 - a1) / (np.pi / 2 - a0) ** 2
        out = np.where(d <= a0, d, d - k * (d - a0) ** 2)
        return np.sign(ang) * out

    def sample(ang):
        x = cen[:, None] + rad[:, None] * np.sin(remap(np.clip(ang, -np.pi / 2, np.pi / 2)))[None, :]
        return np.stack([ndimage.map_coordinates(rgb[..., c], [ys, x], order=1) for c in range(3)], -1)

    d = np.abs(phi)  # 0 frente, pi atrás
    front_ang = phi  # válido para d <= 90°
    back_ang = np.where(phi >= 0, phi - np.pi, phi + np.pi)  # válido para d >= 90°
    t = np.clip((d - (np.pi / 2 - SEAM)) / (2 * SEAM), 0, 1)  # 0 frente -> 1 atrás
    t = t * t * (3 - 2 * t)
    tex = sample(front_ang) * (1 - t)[None, :, None] + sample(back_ang) * t[None, :, None]

    # aplanar la luz horneada (perfil horizontal de luminancia)
    lum = tex.mean(-1)
    prof = lum[100:1100].mean(0)
    prof = ndimage.gaussian_filter1d(prof, 40, mode='wrap')
    gain = (np.percentile(prof, 92) / np.maximum(prof, 1)) ** 0.85
    gain = np.clip(gain, 1, 1.8)
    tex = np.clip(tex * gain[None, :, None], 0, 255)
    Image.fromarray(tex.astype(np.uint8)).save('public/assets/can_label.jpg', quality=93)

    # tapa: elipse de la foto -> disco
    N = 1024
    pz, px = np.mgrid[0:N, 0:N] / (N - 1) * 2 - 1
    sx = LID_C[0] + px * LID_A
    sy = LID_C[1] + pz * LID_B
    lid = np.stack([ndimage.map_coordinates(rgb[..., c], [sy, sx], order=1) for c in range(3)], -1)
    inside = (px ** 2 + pz ** 2) <= 1
    lid_a = (inside * 255).astype(np.uint8)
    Image.fromarray(np.dstack([lid.astype(np.uint8), lid_a])).save('public/assets/can_lid.png')

    # perfil para LatheGeometry: de abajo hacia arriba, filas equiespaciadas
    step = 10
    pts = [[float(rad[i]), float(rows[i])] for i in range(0, len(rows), step)]
    pts.append([float(rad[-1]), float(rows[-1])])
    json.dump(
        {'points': pts[::-1], 'yTop': Y_TOP, 'yBot': Y_BOT, 'radiusPx': float(np.median(rad))},
        open('src/canProfile.json', 'w'),
    )

    logo = Image.open(logo_path).convert('RGBA')
    logo.crop(logo.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()).save('public/assets/mirinda_logo.png')
    print('ok', tex.shape, len(pts))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
