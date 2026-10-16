"""Sound design for the device promos, synthesized from scratch (numpy only).

Every effect is placed on the exact moment its animation happens, using the event
times exported from device-promo.html (see events.mjs): logo pieces, glass chips,
cards, every key press of the WhatsApp message, send, double tick, notification,
transitions and the closing card. Under it runs a dark, minimal music bed.

Usage: python3 sound.py events.json            -> sound-sonylum.wav, sound-creando.wav
       python3 sound.py events.json --sfx-only -> sfx-sonylum.wav, sfx-creando.wav (no music bed)
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48000
rng = np.random.default_rng(7)


# ---------- building blocks ----------
def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def env_ad(n, attack, decay_tau):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-np.maximum(t - attack, 0) / decay_tau)


def band(sig, lo, hi, soft=0.15):
    """Band-pass with a smooth spectral mask (fine for short one-shots)."""
    spec = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR)
    lo_m = 1 / (1 + np.exp(-(np.log(f + 1) - np.log(lo)) / soft))
    hi_m = 1 / (1 + np.exp((np.log(f + 1) - np.log(hi)) / soft))
    return np.fft.irfft(spec * lo_m * hi_m, len(sig))


def sweep_noise(dur, f0, f1, width=1.2):
    """Noise through a band-pass whose center glides f0 -> f1 (STFT overlap-add)."""
    n = int(dur * SR)
    x = rng.standard_normal(n + 2048)
    win, hop = 2048, 512
    out = np.zeros_like(x)
    w = np.hanning(win)
    f = np.fft.rfftfreq(win, 1 / SR)
    for start in range(0, n, hop):
        k = start / max(n, 1)
        fc = f0 * (f1 / f0) ** k
        mask = np.exp(-0.5 * ((np.log(f + 1) - np.log(fc)) / (width * 0.5)) ** 2)
        seg = np.fft.irfft(np.fft.rfft(x[start:start + win] * w) * mask, win)
        out[start:start + win] += seg * w
    return out[:n] / (np.max(np.abs(out[:n])) + 1e-9)


def whoosh(dur=0.7, up=True, big=False):
    n = int(dur * SR)
    s = sweep_noise(dur, 300 if up else 3500, 3500 if up else 300, width=1.6 if big else 1.2)
    t = np.linspace(0, 1, n)
    shape = np.sin(np.pi * t ** (0.7 if up else 1.3)) ** 2
    out = s * shape
    if big:  # low body
        out += 0.6 * band(rng.standard_normal(n), 60, 400) * shape / 3
    return out * (0.9 if big else 0.6)


def boom(dur=1.8, f0=70, f1=34, amp=1.0):
    t = t_axis(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.55)
    click = band(rng.standard_normal(len(t)), 80, 1200) * np.exp(-t / 0.03) * 0.5
    return (body + click) * amp


def shimmer(dur=1.4, base=1046.5, amp=0.25):
    t = t_axis(dur)
    out = np.zeros_like(t)
    for i, ratio in enumerate([1, 1.25, 1.5, 1.875, 2, 2.5, 3]):
        start = i * 0.06
        e = np.clip((t - start) / 0.02, 0, 1) * np.exp(-np.maximum(t - start, 0) / 0.5)
        out += np.sin(2 * np.pi * base * ratio * t + i) * e * (0.9 ** i)
    sparkle = band(rng.standard_normal(len(t)), 5000, 14000) * env_ad(len(t), 0.2, 0.4) * 0.25
    return (out / 4 + sparkle) * amp


def pop(freq=700, amp=0.5):
    t = t_axis(0.18)
    f = freq * (1 + 0.8 * np.exp(-t / 0.012))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * env_ad(len(t), 0.002, 0.045) * amp


def glass_tick(freq=2600, amp=0.25):
    t = t_axis(0.35)
    return (np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(2 * np.pi * freq * 2.76 * t)) * env_ad(len(t), 0.001, 0.07) * amp


def key_tap(space=False):
    n = int(0.05 * SR)
    noise = band(rng.standard_normal(n), 1800 if not space else 600, 7000 if not space else 3000)
    t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * (1300 if not space else 420) * t) * np.exp(-t / 0.006)
    return (noise * np.exp(-t / 0.008) * 0.6 + thump * 0.35) * (0.55 + rng.random() * 0.25)


def shutter_click():
    a = key_tap() * 1.4
    b = np.concatenate([np.zeros(int(0.035 * SR)), key_tap(space=True)])
    out = np.zeros(max(len(a), len(b)))
    out[:len(a)] += a
    out[:len(b)] += b
    return out


def send_swoosh():
    w = whoosh(0.28, up=True) * 0.8
    p = pop(1100, 0.45)
    out = np.zeros(len(w) + len(p))
    out[:len(w)] += w
    out[int(0.2 * SR):int(0.2 * SR) + len(p)] += p
    return out


def notification():
    """Two-note glassy chime, like a messaging app."""
    t = t_axis(1.2)
    out = np.zeros_like(t)
    for start, f in [(0.0, 1318.5), (0.11, 1975.5)]:
        tt = np.maximum(t - start, 0)
        e = (t >= start) * np.exp(-tt / 0.28)
        out += (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2 * tt) + 0.12 * np.sin(2 * np.pi * f * 3.01 * tt)) * e
    return out * 0.32


def double_tick():
    a = glass_tick(3200, 0.18)
    out = np.zeros(len(a) + int(0.07 * SR))
    out[:len(a)] += a
    out[int(0.07 * SR):] += a[:len(out) - int(0.07 * SR)]
    return out


def riser(dur=1.2):
    t = np.linspace(0, 1, int(dur * SR))
    return sweep_noise(dur, 400, 9000, 1.0) * t ** 2.2 * 0.55


# ---------- music bed ----------
def music(total, end_at):
    t = t_axis(total)
    out = np.zeros((len(t), 2))
    # pad: A minor add9, detuned, slow swell, opens a little at the end card
    notes = [110.0, 164.81, 196.0, 246.94, 261.63, 329.63]
    pad = np.zeros_like(t)
    for i, f in enumerate(notes):
        for det in (-0.12, 0.12):
            ph = 2 * np.pi * f * (1 + det / 100) * t + i
            pad += np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    pad /= len(notes) * 2
    swell = np.clip(t / 2.5, 0, 1) * (0.75 + 0.25 * np.sin(2 * np.pi * t / 8))
    fade = np.clip((total - t) / 1.8, 0, 1)
    pad *= swell * fade * 0.18
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.11 * t)
    out[:, 0] += pad * (0.8 + 0.2 * lfo)
    out[:, 1] += pad * (1.0 - 0.2 * lfo)
    # pulse: soft kick on each beat at 100 BPM, hats on the off-beats, from the hero shot to the end card
    beat = 60 / 100
    k = boom(0.5, 95, 45, 0.5)
    h = band(rng.standard_normal(int(0.04 * SR)), 7000, 15000) * np.exp(-np.arange(int(0.04 * SR)) / SR / 0.008) * 0.12
    bt = 3.05
    i = 0
    while bt < end_at - 0.3:
        place(out, k * (0.8 if i % 4 else 1.0), bt, 0)
        place(out, h, bt + beat / 2, 0.4 if i % 2 else -0.4)
        bt += beat
        i += 1
    return out


# ---------- mixing ----------
def place(buf, sig, at, pan=0.0, gain=1.0):
    i = int(at * SR)
    if i >= len(buf) or i + len(sig) <= 0:
        return
    s = sig[: max(0, len(buf) - i)] * gain
    f = min(len(s) // 2, int(0.006 * SR))  # 6 ms fades: no clicks at the edges of any one-shot
    if f > 1:
        ramp = np.linspace(0, 1, f)
        s = s.copy(); s[:f] *= ramp; s[-f:] *= ramp[::-1]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(s), 0] += s * l * 1.41
    buf[i:i + len(s), 1] += s * r * 1.41


def reverb(x, seconds=1.4, wet=0.22):
    n = int(seconds * SR)
    ir = rng.standard_normal((n, 2)) * np.exp(-np.arange(n) / SR / (seconds / 4))[:, None]
    ir[:, 0] = band(ir[:, 0], 200, 9000)
    ir[:, 1] = band(ir[:, 1], 200, 9000)
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    m = len(x) + n
    size = 1 << int(np.ceil(np.log2(m)))
    out = np.zeros_like(x)
    for c in range(2):
        y = np.fft.irfft(np.fft.rfft(x[:, c], size) * np.fft.rfft(ir[:, c], size), size)[: len(x)]
        out[:, c] = y
    return x + out * wet


def design(ev, brand, music_bed=True):
    total = ev["DURATION"]
    sfx = np.zeros((int(total * SR) + SR, 2))

    # 1 · logo assembles
    place(sfx, riser(0.9), 0.0, 0, 0.5)
    if brand == "sonylum":
        place(sfx, whoosh(0.6, True), 0.05, -0.6, 0.8)   # left half
        place(sfx, whoosh(0.6, True), 0.05, 0.6, 0.8)    # right half
    else:
        for i, at in enumerate(ev["pieces"][:4]):        # viewfinder corners click in
            place(sfx, shutter_click(), at + 0.35, [-0.6, 0.6, -0.6, 0.6][i], 0.9)
    place(sfx, boom(2.0, 75, 32, 1.0), 0.9, 0, 0.9)        # lock-in hit on the flash
    letters = ev["pieces"][2:] if brand == "sonylum" else ev["pieces"][4:]
    for i, at in enumerate(letters):
        place(sfx, glass_tick(1800 + i * 90, 0.12), at + 0.12, -0.5 + i / max(len(letters) - 1, 1), 1)
    place(sfx, shimmer(1.6, 1046.5, 0.35), 1.7, 0.2)
    place(sfx, whoosh(0.6, True), 2.75, 0, 0.6)

    # 2 · hero phone + glass chips
    place(sfx, whoosh(1.0, False, big=True), 2.95, 0.2, 1)
    place(sfx, boom(1.0, 90, 45, 0.45), 3.6, 0)
    place(sfx, whoosh(0.8, True), 3.3, -0.3, 0.35)
    for i in range(ev["chips"]):
        place(sfx, pop(620 + i * 70, 0.42), 4.0 + i * 0.28 + 0.05, [-0.6, 0.5, -0.5, 0.6, -0.3][i % 5])
        place(sfx, glass_tick(2900 + i * 120, 0.08), 4.0 + i * 0.28 + 0.08, [-0.6, 0.5, -0.5, 0.6, -0.3][i % 5])
    place(sfx, whoosh(0.7, True, big=True), 8.05, -0.4, 0.9)

    # 3 · what we do
    place(sfx, whoosh(0.9, False), 8.6, 0.3, 0.6)
    place(sfx, shimmer(1.4, 880, 0.22), 8.95, -0.2)
    for i in range(ev["cards"]):
        at = 10.0 + i * 0.42
        place(sfx, pop(380 + i * 40, 0.5), at + 0.04, 0)
        place(sfx, whoosh(0.35, True), at - 0.05, 0, 0.35)
        place(sfx, glass_tick(3400, 0.07), at + 0.5 + 0.35, 0.5)
    place(sfx, whoosh(0.7, True, big=True), 14.3, 0, 0.9)

    # 4 · three phones + tags
    place(sfx, whoosh(1.1, False, big=True), 14.8, 0, 1)
    place(sfx, boom(1.2, 85, 40, 0.5), 15.45, 0)
    for i in range(ev["tags"]):
        place(sfx, pop(760 - i * 60, 0.38), 15.9 + i * 0.3 + 0.05, [-0.6, 0.6, 0.4][i])
    place(sfx, whoosh(0.7, True, big=True), 19.15, 0.3, 0.9)

    # 5 · WhatsApp: phone in, every key, send, ticks, Germán typing
    place(sfx, whoosh(0.9, False, big=True), 19.5, 0.4, 0.9)
    msg = ev["msg"]
    for i, ch in enumerate(msg):
        at = ev["TYPE_AT"] + (i + 0.5) * ev["TYPE_DUR"] / len(msg)
        place(sfx, key_tap(space=(ch == " ")), at, (rng.random() - 0.5) * 0.3, 0.9)
    place(sfx, key_tap(space=True) * 1.2, ev["SEND"] - 0.1, 0.1)
    place(sfx, send_swoosh(), ev["SEND"], 0.15, 0.9)
    place(sfx, double_tick(), ev["SEND"] + 0.8, 0.2)
    place(sfx, notification(), ev["SEND"] + 1.0, -0.1, 1)

    # 6 · end card
    place(sfx, riser(1.0), ev["OUT"] - 0.6, 0, 0.8)
    place(sfx, whoosh(0.6, True, big=True), ev["OUT"], 0, 0.9)
    place(sfx, boom(2.6, 80, 30, 1.1), ev["OUT"] + 0.3, 0)
    place(sfx, shimmer(2.2, 1318.5, 0.35), ev["E"] + 0.55, 0)
    place(sfx, pop(520, 0.5), ev["E"] + 0.95, 0)
    place(sfx, notification() * 0.6, ev["E"] + 1.35, 0.3)

    sfx = reverb(sfx, 1.3, 0.25)
    mix = sfx * 0.9
    if music_bed:
        mix = mix + music(len(sfx) / SR, ev["OUT"] + 0.3)[: len(sfx)]
    mix = mix[: int(total * SR)]
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)               # gentle limiter
    mix *= 0.89 / np.max(np.abs(mix))                    # peak at -1 dBFS
    fade = np.clip((len(mix) - np.arange(len(mix))) / (0.4 * SR), 0, 1)[:, None]
    return mix * fade


def write_wav(path, x):
    data = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


if __name__ == "__main__":
    events = json.loads(Path(sys.argv[1]).read_text())
    here = Path(__file__).parent
    sfx_only = "--sfx-only" in sys.argv
    for brand, ev in events.items():
        out = here / f"{'sfx' if sfx_only else 'sound'}-{brand}.wav"
        write_wav(out, design(ev, brand, music_bed=not sfx_only))
        print("wrote", out)
