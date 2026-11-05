"""Sound effects for holo.html, placed on its animation times (effects only, no music).
Reuses the synth building blocks from ../sound.py.  Usage: python3 sound.py  -> sfx-holo.wav
"""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from sound import SR, band, boom, glass_tick, notification, place, pop, reverb, rng, riser, shimmer, sweep_noise, t_axis, whoosh, write_wav  # noqa: E402

DURATION = 10.5


def hum(dur, f=55.0):
    """Hologram hum: low tone with a slow shimmer on top."""
    t = t_axis(dur)
    tone = np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2 * t + 1) + .2 * np.sin(2 * np.pi * f * 3.01 * t)
    air = band(rng.standard_normal(len(t)), 2000, 6000) * .15 * (.6 + .4 * np.sin(2 * np.pi * .7 * t))
    return (tone * .12 + air) * (.85 + .15 * np.sin(2 * np.pi * 5.3 * t))


def zap():
    """Short electric flicker."""
    n = int(.07 * SR)
    t = np.arange(n) / SR
    buzz = np.sign(np.sin(2 * np.pi * 120 * t)) * .3 + band(rng.standard_normal(n), 1500, 9000)
    return buzz * np.exp(-t / .02) * .35


def scan_tone(dur):
    t = t_axis(dur)
    f = 900 + 1600 * t / dur
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / dur) * .08 + sweep_noise(dur, 1500, 6000, .8) * .12 * np.sin(np.pi * t / dur)


def counter_ticks(buf, at, dur, n, pan):
    """Ticks that slow down like the number easing out (power2.out)."""
    for k in range(1, n + 1):
        frac = k / n
        tt = at + dur * (1 - np.sqrt(1 - frac))  # inverse of power2.out
        place(buf, glass_tick(3000 + 40 * (k % 5), .07), tt, pan)


def design():
    buf = np.zeros((int(DURATION * SR) + SR, 2))
    place(buf, riser(.6) * .6, 0.0, 0)
    place(buf, hum(DURATION - .2), .2, 0, 1)                       # hologram hum under everything
    place(buf, whoosh(.8, True, big=True), .25, 0, .9)               # card rises from the palm
    place(buf, boom(1.6, 90, 40, .7), .38, 0)                        # light-up hit with the flash
    for t in (.37, .45, .51, .58, .7, .77):
        place(buf, zap(), t, (rng.random() - .5) * .6)              # flicker
    place(buf, scan_tone(1.0), .5, 0, 1)                             # scan line sweeping down
    place(buf, pop(520, .5), 1.65, -.5)                              # avatar
    place(buf, shimmer(1.4, 1046.5, .25), 1.8, -.5)                  # ring lights up
    place(buf, whoosh(.45, True) * .5, 2.2, .1)                      # name
    place(buf, notification() * .7, 2.85, .3)                        # verified badge
    place(buf, glass_tick(2400, .12), 3.05, .1)                      # handle
    for i, (n, pan) in enumerate([(14, -.3), (22, .1), (22, .5)]):   # numbers counting up
        counter_ticks(buf, 3.35 + i * .2, 1.0, n, pan)
    place(buf, whoosh(.6, True) * .4, 4.35, 0)                       # divider line
    for i in range(4):                                               # the four lines
        at = 4.8 + i * .38
        place(buf, pop(700 + i * 60, .4), at + .05, -.4)
        place(buf, whoosh(.35, True) * .35, at + .1, .2)
    place(buf, pop(880, .45), 6.5, -.4)                              # link
    place(buf, shimmer(1.0, 1318.5, .2), 6.6, .1)
    for k in range(2):                                               # link pulses
        place(buf, boom(.5, 140, 90, .25), 7.0 + k * 1.0, 0)
    for t in (2.0, 7.6, 9.4):                                        # sheen across the card
        place(buf, sweep_noise(1.1, 3000, 9000, .7) * np.sin(np.pi * np.linspace(0, 1, int(1.1 * SR))) * .12, t, 0)
    mix = reverb(buf, 1.2, .22)[: int(DURATION * SR)]
    mix = np.tanh(mix * 1.2) / np.tanh(1.2)
    mix *= .89 / np.max(np.abs(mix))
    mix *= np.clip((len(mix) - np.arange(len(mix))) / (.4 * SR), 0, 1)[:, None]
    return mix


if __name__ == "__main__":
    out = Path(__file__).parent / "sfx-holo.wav"
    write_wav(out, design())
    print("wrote", out)
