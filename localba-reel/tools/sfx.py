"""Capa de efectos de sonido (síntesis propia) en la línea de tiempo FINAL.

La música original del video entra desplazada 0,6 s (la toma del Obelisco va
en cámara lenta). Esta capa suma golpes, risers, whooshes y el cierre sonoro
del logo, donde el video original queda en silencio.

Uso: python3 -I tools/sfx.py public/audio/sfx.wav
"""
import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
DUR = 15.5
N = int(SR * DUR)
rng = np.random.default_rng(11)
L = np.zeros(N)
R = np.zeros(N)


def put(start, sig, pan=0.0, gain=1.0):
    i = int(start * SR)
    j = min(N, i + len(sig))
    if i >= N or j <= i:
        return
    L[i:j] += sig[: j - i] * gain * (1 - pan) * 0.5 * 2 ** 0.5
    R[i:j] += sig[: j - i] * gain * (1 + pan) * 0.5 * 2 ** 0.5


def env_t(sec):
    return np.arange(int(SR * sec)) / SR


def boom(start, gain=0.9, f_hi=110, f_lo=38, length=1.4):
    t = env_t(length)
    f = f_lo + (f_hi - f_lo) * np.exp(-t * 9)
    ph = 2 * np.pi * np.cumsum(f) / SR
    sig = np.sin(ph) * np.exp(-t * 3.2) * np.minimum(1, t / 0.002)
    click = sosfilt(butter(2, 3000, 'lowpass', fs=SR, output='sos'), rng.standard_normal(len(t))) * np.exp(-t * 60) * 0.35
    put(start, np.tanh((sig + click) * 1.6), gain=gain)


def impact(start, gain=0.6):
    """Golpe seco de título: transiente + cuerpo grave + ruido corto."""
    boom(start, gain * 0.8, 160, 50, 0.6)
    t = env_t(0.25)
    n = sosfilt(butter(2, [800, 6000], 'bandpass', fs=SR, output='sos'), rng.standard_normal(len(t)))
    put(start, n * np.exp(-t * 28) * 0.5, gain=gain)


def whoosh(start, length=0.6, lo=300, hi=4000, gain=0.35, pan_from=-0.8, pan_to=0.8, rise=False):
    n = int(SR * length)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    steps = 20
    for s in range(steps):
        a, b = s * n // steps, (s + 1) * n // steps
        p = s / (steps - 1)
        fc = lo * (hi / lo) ** (p if rise else np.sin(np.pi * p))
        sos = butter(2, [max(60, fc * 0.6), min(SR / 2 - 200, fc * 1.6)], 'bandpass', fs=SR, output='sos')
        out[a:b] = sosfilt(sos, noise[max(0, a - 2000): b])[-(b - a):]
    t = np.arange(n) / n
    shape = t ** 2.5 if rise else np.sin(np.pi * t) ** 2
    out *= shape
    pan = pan_from + (pan_to - pan_from) * t
    i = int(start * SR)
    j = min(N, i + n)
    L[i:j] += (out * (1 - pan))[: j - i] * gain
    R[i:j] += (out * (1 + pan))[: j - i] * gain


def riser(start, length, gain=0.25):
    whoosh(start, length, 200, 7000, gain, 0, 0, rise=True)
    t = env_t(length)
    f = 120 * (8 ** (t / length))
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / length) ** 3 * 0.25
    put(start, sig, gain=gain)


def pop(start, gain=0.25, f=1400):
    t = env_t(0.12)
    sig = np.sin(2 * np.pi * f * t * (1 + 0.6 * np.exp(-t * 40))) * np.exp(-t * 45)
    put(start, sig, gain=gain)


def zap(start, gain=0.25):
    """Glitch digital: ráfagas de onda cuadrada y ruido con bitcrush."""
    t = env_t(0.35)
    sq = np.sign(np.sin(2 * np.pi * (900 + 700 * np.sin(t * 90)) * t))
    gate = (np.sin(2 * np.pi * 26 * t) > 0).astype(float)
    crush = np.round(rng.standard_normal(len(t)) * 3) / 3
    put(start, (sq * 0.5 + crush * 0.3) * gate * np.exp(-t * 6), pan=0.2, gain=gain)


def shimmer(start, length=2.0, gain=0.08):
    t = env_t(length)
    sig = np.zeros_like(t)
    for _ in range(18):
        f = rng.uniform(2500, 8000)
        on = rng.uniform(0, length * 0.6)
        sig += np.where(t > on, np.exp(-(t - on) * 5), 0) * np.sin(2 * np.pi * f * t) * rng.uniform(0.3, 1)
    put(start, sig * gain)


def pad_tail(start, length, gain=0.18):
    t = env_t(length)
    sig = np.zeros_like(t)
    for m in (38, 45, 50, 57, 62):  # Re grave abierto
        f = 440 * 2 ** ((m - 69) / 12)
        for det in (-0.08, 0.07):
            sig += np.sin(2 * np.pi * f * (1 + det / 100) * t)
    env = np.minimum(1, t / 0.4) * np.exp(-t * 0.55)
    put(start, sig * env * gain / 10)


# ------------------------------------------------ eventos (segundos de salida)
boom(0.0, 0.55, 90, 36, 1.6)
riser(0.15, 1.05, 0.22)
impact(0.13, 0.55)            # VIVÍ BUENOS AIRES
impact(1.2, 0.45)             # COMO UN LOCAL (entra la música)
whoosh(1.9, 0.7, 250, 3500, 0.5, -0.9, 0.9)  # SIN VUELTAS, paso del auto
for s in (2.6, 3.87, 4.57, 6.57, 7.85):       # etiquetas de lugar
    pop(s, 0.22, 1500)
    whoosh(s - 0.08, 0.3, 1500, 6000, 0.08, 0.6, -0.6)
riser(4.85, 0.45, 0.16)
impact(5.3, 0.5)              # GUARDÁ ESTE VIDEO
impact(8.53, 0.7)             # TANGO
whoosh(9.1, 0.5, 400, 5000, 0.18)
impact(9.85, 0.55)            # ¿ARRANCAMOS?
zap(10.28, 0.22)
riser(9.95, 0.65, 0.18)
boom(10.6, 1.0, 120, 34, 2.6)  # logo
shimmer(10.62, 2.6, 0.07)
pad_tail(10.6, 4.9, 0.6)
for s in (11.25, 11.6, 11.95):  # CTA
    whoosh(s - 0.12, 0.35, 900, 6000, 0.12, -0.4, 0.4)
    pop(s, 0.14, 1100)

# ------------------------------------------------ mezcla
ir_len = int(SR * 1.6)
tt = np.arange(ir_len) / SR
ir = rng.standard_normal(ir_len) * np.exp(-tt * 4)
ir = sosfilt(butter(1, 6000, 'lowpass', fs=SR, output='sos'), ir)
ir /= np.sqrt((ir ** 2).sum())
L = L + fftconvolve(L, ir)[:N] * 0.25
R = R + fftconvolve(R, ir[::-1].copy())[:N] * 0.25
st = np.stack([L, R], 1)
st /= np.abs(st).max()
st = np.tanh(st * 1.2) / np.tanh(1.2) * 10 ** (-1.5 / 20)
fo = int(0.6 * SR)
st[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
print('ok', sys.argv[1])
