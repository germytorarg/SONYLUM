import React from "react";
import { random } from "remotion";
import { clamp, ease, lerp, prog } from "../lib/anim";
import { ANTON_ADV, C, F } from "../theme";
import { Blur } from "./Blur";

export type MorphWord = { text: string; fs: number; cx: number; cy: number; tracking?: number };
export type Offset = (f: number, word: number, letter: number) => { x: number; y: number };

type Glyph = { ch: string; x: number; y: number; w: number; fs: number };

const layout = (wd: MorphWord): Glyph[] => {
  const tr = (wd.tracking ?? 0.012) * wd.fs;
  const adv = wd.text.split("").map((c) => (ANTON_ADV[c] ?? 0.48) * wd.fs);
  const total = adv.reduce((a, b) => a + b, 0) + tr * (adv.length - 1);
  let x = wd.cx - total / 2;
  return adv.map((w, i) => {
    const g = { ch: wd.text[i], x: x + w / 2, y: wd.cy, w, fs: wd.fs };
    x += w + tr;
    return g;
  });
};

/** Empareja letras iguales entre dos palabras (las que viajan) y deja el resto. */
const match = (a: Glyph[], b: Glyph[]) => {
  const used = new Set<number>();
  const pairs: [number, number][] = [];
  const enter: number[] = [];
  b.forEach((gb, j) => {
    let best = -1;
    let bestD = Infinity;
    a.forEach((ga, i) => {
      if (used.has(i) || ga.ch !== gb.ch) return;
      const d = Math.abs(i / Math.max(1, a.length - 1) - j / Math.max(1, b.length - 1));
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0) {
      used.add(best);
      pairs.push([best, j]);
    } else enter.push(j);
  });
  const exit = a.map((_, i) => i).filter((i) => !used.has(i));
  return { pairs, enter, exit };
};

const Letter: React.FC<{
  g: { ch: string; x: number; y: number; fs: number; w: number };
  rot?: number;
  clip?: string;
  color?: string;
  o?: number;
}> = ({ g, rot = 0, clip, color = C.ink, o = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: g.x - g.w / 2,
      top: g.y - g.fs * 0.5,
      width: g.w,
      height: g.fs,
      fontFamily: F.impact,
      fontSize: g.fs,
      lineHeight: `${g.fs}px`,
      textAlign: "center",
      color,
      opacity: o,
      transform: rot ? `rotate(${rot}deg)` : undefined,
      clipPath: clip,
      whiteSpace: "pre",
    }}
  >
    {g.ch}
  </div>
);

/**
 * La palabra se fragmenta en bloques y se recompone en la siguiente.
 * - Letras compartidas viajan (arco + rotación + motion blur).
 * - Letras que sobran se parten en dos bloques que se deslizan en sentidos opuestos.
 * - Letras nuevas se arman con dos bloques que llegan desde lados opuestos.
 */
export const Morph: React.FC<{
  f: number;
  id: string;
  words: MorphWord[];
  at: number[]; // frame de inicio de cada transición k → k+1
  dur: number[];
  offset?: Offset;
  color?: string;
}> = ({ f, id, words, at, dur, offset, color = C.ink }) => {
  const L = words.map(layout);
  const off = (ff: number, k: number, i: number) => offset?.(ff, k, i) ?? { x: 0, y: 0 };

  // ¿en qué tramo estamos?
  let k = 0;
  while (k < at.length && f >= at[k] + dur[k]) k++;
  const inTransition = k < at.length && f >= at[k];

  const held = (kk: number, ff: number) =>
    L[kk].map((g, i) => {
      const o = off(ff, kk, i);
      return { ...g, x: g.x + o.x, y: g.y + o.y };
    });

  if (!inTransition) {
    const cur = held(k, f);
    const prev = held(k, f - 1);
    return (
      <>
        {cur.map((g, i) => (
          <Blur key={`${k}-${i}`} id={`${id}-h${k}-${i}`} vx={g.x - prev[i].x} vy={g.y - prev[i].y} k={0.5}>
            <Letter g={g} color={color} />
          </Blur>
        ))}
      </>
    );
  }

  const A = L[k];
  const B = L[k + 1];
  const { pairs, enter, exit } = match(A, B);
  const t0 = at[k];
  const d = dur[k];
  const els: React.ReactNode[] = [];

  // letras que viajan
  const travel = (ff: number, ia: number, jb: number) => {
    const s = t0 + d * 0.08 + jb * 0.7;
    const p = prog(ff, s, s + d * 0.6, ease.whip);
    const oa = off(ff, k, ia);
    const ob = off(ff, k + 1, jb);
    const a = A[ia];
    const b = B[jb];
    const sign = random(`${id}-arc-${k}-${jb}`) > 0.5 ? 1 : -1;
    const arc = Math.sin(Math.PI * p) * sign * (90 + random(`${id}-amp-${k}-${jb}`) * 120);
    return {
      g: {
        ch: b.ch,
        x: lerp(a.x + oa.x, b.x + ob.x, p),
        y: lerp(a.y + oa.y, b.y + ob.y, p) + arc,
        fs: lerp(a.fs, b.fs, p),
        w: lerp(a.w, b.w, p),
      },
      rot: Math.sin(Math.PI * p) * sign * 16,
    };
  };
  pairs.forEach(([ia, jb]) => {
    const c = travel(f, ia, jb);
    const pv = travel(f - 1, ia, jb);
    els.push(
      <Blur key={`t${ia}`} id={`${id}-t${k}-${ia}`} vx={c.g.x - pv.g.x} vy={c.g.y - pv.g.y} k={0.55}>
        <Letter g={c.g} rot={c.rot} color={color} />
      </Blur>,
    );
  });

  // bloques que se van
  exit.forEach((ia, n) => {
    const s = t0 + n * 1.2;
    const p = prog(f, s, s + d * 0.5, ease.in);
    const pv = prog(f - 1, s, s + d * 0.5, ease.in);
    const a = A[ia];
    const o = off(f, k, ia);
    const g = { ...a, x: a.x + o.x, y: a.y + o.y };
    const dist = 420 + random(`${id}-ex-${k}-${ia}`) * 300;
    const dir = random(`${id}-dir-${k}-${ia}`) > 0.5 ? 1 : -1;
    [0, 1].forEach((half) => {
      const sx = (half === 0 ? -1 : 1) * dir * dist;
      const clip = half === 0 ? "inset(0 0 50% 0)" : "inset(50% 0 0 0)";
      els.push(
        <Blur key={`x${ia}-${half}`} id={`${id}-x${k}-${ia}-${half}`} vx={sx * (p - pv)} k={0.6}>
          <Letter g={{ ...g, x: g.x + sx * p }} clip={clip} o={1 - clamp(p * 1.4 - 0.4)} color={color} />
        </Blur>,
      );
    });
  });

  // bloques que llegan
  enter.forEach((jb, n) => {
    const s = t0 + d * 0.24 + n * 0.8;
    const p = prog(f, s, s + d * 0.5, ease.out);
    const pv = prog(f - 1, s, s + d * 0.5, ease.out);
    const b = B[jb];
    const o = off(f, k + 1, jb);
    const g = { ...b, x: b.x + o.x, y: b.y + o.y };
    const dist = 360 + random(`${id}-en-${k}-${jb}`) * 260;
    const dir = random(`${id}-edir-${k}-${jb}`) > 0.5 ? 1 : -1;
    [0, 1].forEach((half) => {
      const sx = (half === 0 ? 1 : -1) * dir * dist;
      const clip = half === 0 ? "inset(0 0 50% 0)" : "inset(50% 0 0 0)";
      els.push(
        <Blur key={`e${jb}-${half}`} id={`${id}-e${k}-${jb}-${half}`} vx={sx * (p - pv)} k={0.6}>
          <Letter g={{ ...g, x: g.x + sx * (1 - p) }} clip={clip} o={clamp(p * 1.6)} color={color} />
        </Blur>,
      );
    });
  });

  return <>{els}</>;
};

export const morphLayout = layout;
