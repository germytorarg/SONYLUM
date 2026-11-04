"""Música original para TEFILMO (síntesis, sin samples ni material de terceros).

Piano emotivo en Re mayor, pulso progresivo y efectos sutiles (anillos,
tela, pétalos, copas). Grilla: 120 BPM -> 1 tiempo = 0,5 s = 15 frames;
1 compás = 2 s = 60 frames. Los cortes de escena (5, 10, 14, 20, 25 s) y el
cierre de marca (27,5 s) caen sobre la grilla; ver SYNC en src/timing.ts.

Uso: python3 -I tools/compose_music.py public/audio/tefilmo_music.wav
"""
import sys
import wave

import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt

SR = 48000
DUR = 30.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(7)

L = np.zeros(N)
R = np.zeros(N)
dry_piano = np.zeros(N)
pad_bus = np.zeros(N)
fx_bus_l = np.zeros(N)
fx_bus_r = np.zeros(N)
low_bus = np.zeros(N)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(buf, start, sig):
    i = int(start * SR)
    if i >= N:
        return
    j = min(N, i + len(sig))
    buf[i:j] += sig[: j - i]


def piano(m, vel=0.6, length=2.5):
    f0 = mtof(m)
    t = np.arange(int(SR * (length + 1.2))) / SR
    out = np.zeros_like(t)
    B = 0.00035
    bright = 0.6 + 0.6 * vel
    for n in range(1, 13):
        fn = n * f0 * np.sqrt(1 + B * n * n)
        if fn > 16000:
            break
        amp = (1 / n ** (1.55 - 0.35 * bright)) * (1 + 0.05 * rng.standard_normal())
        decay = (0.9 + 0.45 * n) * (f0 / 262) ** 0.45
        out += amp * np.exp(-t * decay) * np.sin(2 * np.pi * fn * t + rng.uniform(0, 6.28))
    # Doble decaimiento típico de la cuerda de piano.
    out *= 0.75 * np.exp(-t * 1.1) + 0.25 * np.exp(-t * 0.25)
    att = np.minimum(1, t / 0.004)
    rel = np.clip((length + 0.35 - t) / 0.35, 0, 1)
    out *= att * rel
    # Martillo: ruido corto filtrado.
    nh = int(0.012 * SR)
    ham = rng.standard_normal(nh) * np.exp(-np.arange(nh) / (0.002 * SR)) * 0.08 * vel
    out[:nh] += ham
    return out * vel


def pad(ms, start, length, gain=0.12):
    t = np.arange(int(SR * length)) / SR
    sig = np.zeros_like(t)
    for m in ms:
        for det in (-0.07, 0.0, 0.06):
            f = mtof(m + det)
            for n, a in ((1, 1.0), (2, 0.35), (3, 0.18), (4, 0.08)):
                sig += a * np.sin(2 * np.pi * f * n * t + rng.uniform(0, 6.28))
    env = np.minimum(1, t / 0.9) * np.minimum(1, (length - t) / 0.9)
    env = np.clip(env, 0, 1) ** 1.5
    sig *= env * gain / (len(ms) * 3)
    add(pad_bus, start, sig)


def chime(start, base=1568.0, gain=0.10, pan=0.0):
    t = np.arange(int(SR * 3.0)) / SR
    sig = np.zeros_like(t)
    for ratio, a, d in ((1, 1, 1.4), (2.76, 0.5, 2.2), (5.4, 0.25, 3.5), (8.93, 0.12, 5)):
        sig += a * np.exp(-t * d) * np.sin(2 * np.pi * base * ratio * t)
    sig *= np.minimum(1, t / 0.002) * gain
    add(fx_bus_l, start, sig * (1 - pan) * 0.5)
    add(fx_bus_r, start, sig * (1 + pan) * 0.5)


def shimmer(start, length=1.6, gain=0.05):
    t = np.arange(int(SR * length)) / SR
    sig = np.zeros_like(t)
    for k in range(14):
        f = rng.uniform(2500, 7000)
        on = rng.uniform(0, length * 0.7)
        e = np.where(t > on, np.exp(-(t - on) * 6), 0)
        sig += e * np.sin(2 * np.pi * f * t) * rng.uniform(0.3, 1)
    sig *= np.sin(np.pi * t / length) ** 0.5 * gain
    add(fx_bus_l, start, sig * rng.uniform(0.6, 1))
    add(fx_bus_r, start, sig * rng.uniform(0.6, 1))


def whoosh(start, length=1.0, lo=300, hi=3000, gain=0.12, pan_from=-0.6, pan_to=0.6):
    """Barrido de tela / aire: ruido filtrado con banda móvil."""
    n = int(SR * length)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    steps = 24
    for s in range(steps):
        a, b = s * n // steps, (s + 1) * n // steps
        p = s / (steps - 1)
        fc = lo * (hi / lo) ** (np.sin(np.pi * p) if hi > lo else p)
        sos = butter(2, [max(40, fc * 0.6), min(SR / 2 - 100, fc * 1.6)], "bandpass", fs=SR, output="sos")
        seg = sosfilt(sos, noise[max(0, a - 2000): b])[-(b - a):]
        out[a:b] = seg
    t = np.arange(n) / n
    out *= np.sin(np.pi * t) ** 2 * gain
    pan = pan_from + (pan_to - pan_from) * t
    add(fx_bus_l, start, out * (1 - pan) * 0.5)
    add(fx_bus_r, start, out * (1 + pan) * 0.5)


def heartbeat(start, gain=0.3):
    t = np.arange(int(SR * 0.5)) / SR
    f = 42 + 40 * np.exp(-t * 18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    sig = np.sin(ph) * np.exp(-t * 9) * np.minimum(1, t / 0.003) * gain
    add(low_bus, start, sig)


def glass(start, gain=0.09):
    t = np.arange(int(SR * 2.2)) / SR
    sig = np.zeros_like(t)
    for f, a, d in ((2093, 1, 2.2), (2093 * 2.32, 0.6, 3.1), (2093 * 4.25, 0.35, 4.5), (2140, 0.8, 2.4)):
        sig += a * np.exp(-t * d) * np.sin(2 * np.pi * f * t)
    sig *= gain
    add(fx_bus_l, start, sig * 0.55)
    add(fx_bus_r, start + 0.012, sig * 0.45)


def swell(start, length=1.2, gain=0.08):
    """Platillo invertido suave (ruido brillante con subida exponencial)."""
    n = int(SR * length)
    noise = sosfilt(butter(2, 4000, "highpass", fs=SR, output="sos"), rng.standard_normal(n))
    t = np.arange(n) / n
    sig = noise * t ** 3 * gain
    add(fx_bus_l, start, sig)
    add(fx_bus_r, start, sig * 0.9)


# ---------------------------------------------------------------- armonía
D, E, Fs, G, A, B, Cs = 50, 52, 54, 55, 57, 59, 61  # raíces en octava 3
CHORDS = [  # (inicio s, duración s, bajo, tonos del acorde)
    (0, 2, D, [62, 66, 69]),       # D
    (2, 2, Cs, [61, 64, 69]),      # A/C#
    (4, 2, B, [62, 66, 71]),       # Bm
    (6, 2, G, [62, 67, 71]),       # G
    (8, 2, Fs, [62, 66, 69]),      # D/F#
    (10, 2, G, [62, 67, 71]),      # G
    (12, 2, E, [64, 67, 71]),      # Em
    (14, 2, A, [61, 64, 69]),      # A
    (16, 2, B, [62, 66, 71]),      # Bm
    (18, 2, G, [62, 67, 71]),      # G
    (20, 2, D, [62, 66, 69]),      # D  (clímax)
    (22, 2, A, [61, 64, 69]),      # A
    (24, 2, G, [62, 67, 71]),      # G
    (26, 1.5, A, [62, 64, 69]),    # Asus4 (suspensión)
    (27.5, 2.5, D, [62, 66, 69]),  # D final (marca)
]
MELODY = {  # índice de compás -> [(tiempo, midi, duración en tiempos)]
    2: [(0, 66, 1.5), (1.5, 69, 0.5), (2, 71, 2)],
    3: [(0, 74, 3), (3, 71, 1)],
    4: [(0, 69, 2), (2, 66, 1), (3, 69, 1)],
    5: [(0, 71, 1.5), (1.5, 74, 0.5), (2, 76, 2)],
    6: [(0, 78, 2), (2, 76, 1), (3, 74, 1)],
    7: [(0, 73, 3), (3, 69, 1)],
    8: [(0, 74, 1.5), (1.5, 73, 0.5), (2, 71, 2)],
    9: [(0, 74, 2), (2, 79, 2)],
    10: [(0, 78, 3), (3, 76, 1)],
    11: [(0, 76, 1.5), (1.5, 74, 0.5), (2, 73, 2)],
    12: [(0, 71, 2), (2, 74, 2)],
    13: [(0, 76, 1.5), (1.5, 73, 1.5)],
    14: [(0, 74, 5)],
}

for i, (st, ln, bass, tones) in enumerate(CHORDS):
    intensity = min(1.0, 0.35 + i * 0.06)
    if i >= 13:
        intensity = 0.7
    # Bajo
    add(dry_piano, st, piano(bass - 12 if i >= 10 else bass, 0.45 + 0.2 * intensity, ln + 0.3))
    if i >= 10 and i < 13:
        add(dry_piano, st, piano(bass, 0.3, ln))
    # Arpegio
    arp = [bass, tones[0], tones[1], tones[2], tones[1] + 12, tones[2], tones[1], tones[0]]
    if i == 14:
        for k, m in enumerate([bass - 12, bass] + tones + [tones[0] + 12, tones[1] + 12]):
            add(dry_piano, st + k * 0.045, piano(m, 0.5, 2.4))
        continue
    if i == 13:
        for k, m in enumerate([bass] + tones + [tones[2] + 12]):
            add(dry_piano, st + k * 0.12, piano(m, 0.42, 1.4))
        continue
    step = BEAT if i < 2 else BEAT / 2
    n = int(round(ln / step))
    for k in range(n):
        m = arp[(k * (2 if step == BEAT else 1)) % len(arp)]
        v = (0.22 + 0.2 * intensity) * (1.0 if k % 4 == 0 else 0.8)
        add(dry_piano, st + k * step, piano(m, v, step * 2.5))
    # Pad
    if i >= 2:
        pad([bass] + tones, st - 0.3, ln + 0.9, gain=0.05 + 0.10 * intensity)

for bar, notes in MELODY.items():
    st = CHORDS[bar][0]
    for beat, m, d in notes:
        v = 0.55 if bar < 10 else 0.68
        add(dry_piano, st + beat * BEAT, piano(m, v, d * BEAT + 0.4))
        if bar >= 10:
            add(dry_piano, st + beat * BEAT, piano(m - 12, 0.32, d * BEAT + 0.4))

# --------------------------------------------------------------- pulso
for k in range(6):  # 14 s - 20 s: pulso en 1 y 3
    heartbeat(14 + k * 1.0, 0.10 + 0.03 * k)
for k in range(12):  # 20 s - 26 s: pulso en cada tiempo
    heartbeat(20 + k * 0.5, 0.24 if k % 2 == 0 else 0.15)
heartbeat(27.5, 0.45)

# --------------------------------------------------------------- efectos (SYNC)
swell(0.0, 2.0, 0.03)
shimmer(1.2, 1.8, 0.03)          # líneas doradas
chime(2.5, 1568, 0.09, -0.2)     # entrada anillos
chime(2.62, 2349, 0.05, 0.25)
shimmer(3.2, 1.2, 0.035)         # destellos 03
swell(3.9, 1.1, 0.07)            # flare
chime(5.0, 1175, 0.06)
shimmer(6.6, 1.4, 0.03)          # wipe de luz 04 -> 05
whoosh(9.3, 1.2, 250, 2400, 0.10, -0.7, 0.7)   # barrido del ramo
for s in (10.6, 11.4, 12.1, 12.9):             # pétalos
    whoosh(s, 0.5, 1500, 5000, 0.018, 0.3, -0.3)
whoosh(13.4, 1.0, 600, 6000, 0.05, 0.0, 0.0)  # velo luminoso
shimmer(16.0, 1.6, 0.03)          # velas
whoosh(17.7, 0.6, 800, 3500, 0.04, 0.4, 0.0)  # sobre
chime(18.4, 1760, 0.05, 0.2)      # sello
chime(20.0, 2093, 0.06, -0.3)     # manos / alianza
chime(21.0, 2637, 0.05, 0.3)      # brillo 01
whoosh(21.9, 0.5, 400, 2500, 0.03)
whoosh(23.0, 0.5, 400, 2500, 0.03)
glass(24.25, 0.08)                # brindis
swell(24.0, 1.0, 0.06)            # disolución cálida
whoosh(26.7, 1.2, 200, 2200, 0.08, 0.7, -0.7)  # cinta de cine
chime(27.5, 1175, 0.08)
chime(27.62, 1760, 0.05, 0.3)
shimmer(27.6, 2.0, 0.03)

# --------------------------------------------------------------- mezcla
ir_len = int(SR * 2.8)
tt = np.arange(ir_len) / SR
ir_l = rng.standard_normal(ir_len) * np.exp(-tt * 2.4)
ir_r = rng.standard_normal(ir_len) * np.exp(-tt * 2.4)
lp = butter(1, 5000, "lowpass", fs=SR, output="sos")
ir_l, ir_r = sosfilt(lp, ir_l), sosfilt(lp, ir_r)
ir_l /= np.sqrt((ir_l ** 2).sum())
ir_r /= np.sqrt((ir_r ** 2).sum())

piano_bus = sosfilt(butter(1, 7000, "lowpass", fs=SR, output="sos"), dry_piano)
wet_src = piano_bus * 0.9 + pad_bus
wl = fftconvolve(wet_src + fx_bus_l, ir_l)[:N]
wr = fftconvolve(wet_src + fx_bus_r, ir_r)[:N]
L = piano_bus * 0.95 + pad_bus * 0.6 + fx_bus_l + low_bus + wl * 0.32
R = piano_bus * 0.95 + pad_bus * 0.6 + fx_bus_r + low_bus + wr * 0.32

# Fade de cierre
fade = np.ones(N)
fs = int(28.6 * SR)
fade[fs:] = np.linspace(1, 0, N - fs) ** 2
L *= fade
R *= fade
fi = int(0.05 * SR)
L[:fi] *= np.linspace(0, 1, fi)
R[:fi] *= np.linspace(0, 1, fi)

# Compresión suave + normalización a -2,5 dBFS
st = np.stack([L, R], 1)
st /= np.abs(st).max()
st = np.tanh(st * 1.3) / np.tanh(1.3)
st *= 10 ** (-2.5 / 20) / np.abs(st).max()
pcm = (st * 32767).astype(np.int16)

with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("ok", sys.argv[1], pcm.shape)
