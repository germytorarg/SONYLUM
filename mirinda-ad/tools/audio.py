"""Banda sonora original del aviso (síntesis, sin samples de terceros).

Beat a 120 BPM (1 tiempo = 15 frames) sincronizado con src/timing.ts:
pssst de apertura, impacto de la lata (f45), giro rápido (f150-180),
logo (f270). Uso: python3 -I tools/audio.py public/audio/mirinda.wav
"""
import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
DUR = 12.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(5)
L = np.zeros(N)
R = np.zeros(N)


def put(t0, sig, pan=0.0, gain=1.0):
    i = int(t0 * SR)
    j = min(N, i + len(sig))
    if i >= N or j <= i:
        return
    L[i:j] += sig[: j - i] * gain * (1 - pan)
    R[i:j] += sig[: j - i] * gain * (1 + pan)


def tt(sec):
    return np.arange(int(SR * sec)) / SR


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], 'bandpass', fs=SR, output='sos'), x)


def kick(t0, g=0.9):
    t = tt(0.45)
    f = 45 + 110 * np.exp(-t * 28)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    s += bp(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t * 120) * 0.25
    put(t0, np.tanh(s * 1.8), gain=g)


def clap(t0, g=0.35):
    t = tt(0.3)
    n = bp(rng.standard_normal(len(t)), 900, 4000)
    env = np.zeros_like(t)
    for d in (0, 0.012, 0.024):
        env += np.where(t >= d, np.exp(-(t - d) * 45), 0)
    put(t0, n * env * 0.6, gain=g)


def hat(t0, g=0.12, open_=False):
    t = tt(0.25 if open_ else 0.06)
    n = sosfilt(butter(2, 7000, 'highpass', fs=SR, output='sos'), rng.standard_normal(len(t)))
    put(t0, n * np.exp(-t * (12 if open_ else 70)), pan=0.25, gain=g)


def bass(t0, midi, dur, g=0.32):
    t = tt(dur)
    f = 440 * 2 ** ((midi - 69) / 12)
    s = np.sign(np.sin(2 * np.pi * f * t)) * 0.4 + np.sin(2 * np.pi * f * t)
    s = sosfilt(butter(2, 500, 'lowpass', fs=SR, output='sos'), s)
    put(t0, s * np.minimum(1, t / 0.005) * np.exp(-t * 2.5), gain=g)


def pluck(t0, midi, g=0.12, pan=0.0):
    t = tt(0.6)
    f = 440 * 2 ** ((midi - 69) / 12)
    s = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.4 for k in range(1, 7)) * np.exp(-t * 7)
    put(t0, s, pan=pan, gain=g)


def pssst(t0, dur=0.9, g=0.55):
    """Lata que se abre: chasquido + siseo de gas que decae."""
    t = tt(dur)
    n = rng.standard_normal(len(t))
    hiss = sosfilt(butter(2, [2500, 11000], 'bandpass', fs=SR, output='sos'), n)
    env = np.minimum(1, t / 0.01) * np.exp(-t * 3.2)
    click = bp(rng.standard_normal(len(t)), 1500, 5000) * np.exp(-t * 250) * 3
    put(t0, hiss * env * 0.5 + click, gain=g)


def fizz(t0, dur, g=0.08):
    """Burbujeo: microclics agudos aleatorios."""
    n = int(SR * dur)
    s = np.zeros(n)
    for _ in range(int(dur * 180)):
        i = rng.integers(0, n - 400)
        f = rng.uniform(3000, 9000)
        k = np.arange(300) / SR
        s[i : i + 300] += np.sin(2 * np.pi * f * k) * np.exp(-k * 900) * rng.uniform(0.2, 1)
    put(t0, s, gain=g)


def whoosh(t0, dur, lo=250, hi=5000, g=0.3, p0=-0.8, p1=0.8, rise=False):
    n = int(SR * dur)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    steps = 20
    for k in range(steps):
        a, b = k * n // steps, (k + 1) * n // steps
        p = k / (steps - 1)
        fc = lo * (hi / lo) ** (p if rise else np.sin(np.pi * p))
        out[a:b] = bp(noise[max(0, a - 2000) : b], max(60, fc * 0.6), min(SR / 2 - 300, fc * 1.6))[-(b - a):]
    t = np.arange(n) / n
    out *= t ** 2.5 if rise else np.sin(np.pi * t) ** 2
    pan = p0 + (p1 - p0) * t
    i = int(t0 * SR)
    j = min(N, i + n)
    L[i:j] += (out * (1 - pan))[: j - i] * g
    R[i:j] += (out * (1 + pan))[: j - i] * g


def boom(t0, g=0.9, length=2.2):
    t = tt(length)
    f = 32 + 90 * np.exp(-t * 7)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    put(t0, np.tanh(s * 1.5), gain=g)


def chime(t0, g=0.1):
    t = tt(1.6)
    s = sum(a * np.exp(-t * d) * np.sin(2 * np.pi * 1760 * r * t) for r, a, d in ((1, 1, 2), (2.76, 0.5, 3), (5.4, 0.25, 5)))
    put(t0, s, gain=g)


# ------------------------------------------------------------------ arreglo
pssst(0.05)
fizz(0.3, 11.4, 0.05)
whoosh(0.45, 1.05, 200, 6000, 0.35, 0, 0, rise=True)  # la lata cae girando
boom(1.5, 0.85)
chime(1.52, 0.06)

E, G, A, B, D = 40, 43, 45, 47, 50  # Mi menor
BASS = [E, E, G, A, E, E, D, B]
for k in range(int((11.5 - 1.5) / BEAT)):
    t0 = 1.5 + k * BEAT
    if 5.0 <= t0 < 6.0:  # quiebre durante el giro
        continue
    kick(t0, 0.8 if t0 < 9 else 0.95)
    hat(t0 + BEAT / 2, 0.1)
    if k % 2 == 1 and t0 >= 6.0:
        clap(t0)
    if k % 8 == 7:
        hat(t0 + BEAT / 2, 0.08, open_=True)
    bass(t0, BASS[k % 8], BEAT * 0.9)
    if t0 >= 3.5 and k % 2 == 0:
        pluck(t0 + BEAT * 0.75, [64, 67, 71, 74][(k // 2) % 4], 0.08, 0.3 if k % 4 else -0.3)

whoosh(4.9, 1.2, 300, 7000, 0.45, -0.9, 0.9)  # giro rápido
whoosh(8.2, 0.8, 200, 8000, 0.25, 0, 0, rise=True)
boom(9.0, 1.0, 2.8)                           # logo
pssst(9.02, 0.6, 0.3)
chime(9.05, 0.08)

# ------------------------------------------------------------------ mezcla
ir_len = int(SR * 1.2)
t_ir = np.arange(ir_len) / SR
ir = sosfilt(butter(1, 6000, 'lowpass', fs=SR, output='sos'), rng.standard_normal(ir_len) * np.exp(-t_ir * 5))
ir /= np.sqrt((ir ** 2).sum())
L = L + fftconvolve(L, ir)[:N] * 0.18
R = R + fftconvolve(R, ir[::-1].copy())[:N] * 0.18
st = np.stack([L, R], 1)
st /= np.abs(st).max()
st = np.tanh(st * 1.4) / np.tanh(1.4) * 10 ** (-1.5 / 20)
fo = int(0.8 * SR)
st[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
print('ok')
