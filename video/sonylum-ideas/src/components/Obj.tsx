import React from "react";
import { Img } from "remotion";
import { Blur, liftShadow } from "./Blur";
import { asset } from "../lib/asset";

export type Pose = {
  x: number;
  y: number;
  rot?: number;
  rx?: number;
  ry?: number;
  s?: number;
  elev?: number;
  o?: number;
  focus?: number;
};

export const OBJECTS = {
  glasses: { src: "objects/glasses.png", ar: 665 / 310 },
  coffee: { src: "objects/coffee.png", ar: 1 },
  crumpled: { src: "objects/crumpled-paper.png", ar: 310 / 285 },
  torn: { src: "objects/torn-paper.png", ar: 677 / 429 },
  clip: { src: "objects/binder-clip.png", ar: 177 / 210 },
  pen: { src: "objects/pen.png", ar: 630 / 285 },
  eucalyptus: { src: "objects/eucalyptus.png", ar: 255 / 470 },
} as const;
export type ObjName = keyof typeof OBJECTS;

/**
 * Un objeto físico de la mesa. La posición se pasa como función del frame
 * para poder derivar la velocidad (motion blur) y mantener la sombra en el
 * espacio de pantalla (la luz no gira con el objeto).
 */
export const Obj: React.FC<{
  name: ObjName;
  w: number;
  f: number;
  pose: (f: number) => Pose;
  id?: string;
  children?: React.ReactNode;
}> = ({ name, w, f, pose, id, children }) => {
  const p = pose(f);
  const prev = pose(f - 1);
  const o = p.o ?? 1;
  if (o <= 0.001) return null;
  const meta = OBJECTS[name];
  const h = w / meta.ar;
  const transform = `translate(-50%,-50%) perspective(1800px) rotateX(${p.rx ?? 0}deg) rotateY(${p.ry ?? 0}deg) rotateZ(${p.rot ?? 0}deg) scale(${p.s ?? 1})`;
  return (
    <Blur
      id={id ?? name}
      vx={p.x - prev.x}
      vy={p.y - prev.y}
      focus={p.focus ?? 0}
      extraFilter={liftShadow(p.elev ?? 0)}
      style={{ opacity: o }}
    >
      <div style={{ position: "absolute", left: p.x, top: p.y, width: w, height: h, transform }}>
        <Img src={asset(meta.src)} style={{ width: "100%", height: "100%", display: "block" }} />
        {children}
      </div>
    </Blur>
  );
};
