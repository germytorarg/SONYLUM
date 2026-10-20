import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, Key, track } from "../lib/anim";
import { C, H, W } from "../theme";
import { Blur, liftShadow } from "./Blur";
import { Paper } from "./Paper";

/**
 * Hoja rasgada que barre la pantalla: entra por un borde, cubre el cuadro
 * (ahí se cambia la escena de abajo) y sale por el opuesto. Detrás va una
 * tira más angosta, con su propio retraso: dos capas, dos velocidades.
 */
export const TornSweep: React.FC<{
  f: number;
  start: number;
  dur?: number;
  angle?: number; // grados
  seed: string;
  color?: string;
  strip?: string;
  sheetW?: number;
  cover?: boolean; // true: se detiene cubriendo el cuadro; false: pasa de largo empujando
}> = ({ f, start, dur = 38, angle = -14, seed, color = C.paperLight, strip = C.paperDeep, sheetW = 2000, cover = true }) => {
  if (f < start - 1 || f > start + dur + 12) return null;
  const sheetH = 3000;
  const dist = cover ? 2200 : 1100 + sheetW / 2;
  const keys: Key[] = cover
    ? [
        [start, dist],
        [start + dur * 0.42, 0, ease.glide],
        [start + dur * 0.47, 0],
        [start + dur, -dist, ease.inOut],
      ]
    : [
        [start, dist],
        [start + dur, -dist, ease.inOut],
      ];
  const a = (angle * Math.PI) / 180;
  const pos = (ff: number, lag = 0) => {
    const u = track(ff - lag, keys);
    return { x: W / 2 + u * Math.cos(a), y: H / 2 + u * Math.sin(a) };
  };
  const layer = (lag: number, w: number, c: string, key: string, elev: number) => {
    const p = pos(f, lag);
    const pv = pos(f - 1, lag);
    return (
      <Blur key={key} id={`sweep-${seed}-${key}`} vx={p.x - pv.x} vy={p.y - pv.y} k={0.22} max={18} extraFilter={liftShadow(elev, 1.2)}>
        <div
          style={{
            position: "absolute",
            left: p.x - w / 2,
            top: p.y - sheetH / 2,
            transform: `rotate(${angle}deg)`,
          }}
        >
          <Paper w={w} h={sheetH} seed={`${seed}-${key}`} color={c} rough={22} sides={{ left: true, right: true }} texture={0.6} />
        </div>
      </Blur>
    );
  };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {layer(5, 360, strip, "strip", 0.35)}
      {layer(0, sheetW, color, "sheet", 0.5)}
    </AbsoluteFill>
  );
};
