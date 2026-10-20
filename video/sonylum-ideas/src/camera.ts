import { ease, Key, track } from "./lib/anim";
import { T } from "./timeline";
import { H, W } from "./theme";
import { ideaTypedPoint } from "./scenes/Cuaderno";

/**
 * Cámara virtual 2.5D. Cada capa la aplica con su propia profundidad
 * (depth): el fondo y los objetos se desplazan a velocidades distintas.
 * x/y = desplazamiento del punto de mira en px · z = zoom · r = roll (deg)
 */
export type Cam = { x: number; y: number; z: number; r: number };

/** Punto (en coordenadas de escena) donde está la palabra IDEA tipeada. */
const IDEA_TYPED = ideaTypedPoint();

const K = (keys: Key[]) => keys;

const X = K([
  [0, 0],
  [T.proceso, 0],
  [T.proceso + 30, -14, ease.inOut],
  [T.pushIn, -14],
  [T.cut3 - 1, IDEA_TYPED.x - W / 2, ease.in],
  [T.cut3, 0],
  [T.whip - 2, 0],
  [T.whip + 10, -46, ease.inOut],
  [T.historia + 20, 0, ease.inOut],
  [T.cut, 0],
  // ecosistema: foco en cada marca
  [T.cut + 30, 0],
  [T.cut + 44, 0],
  [T.cardCC + 6, 20, ease.inOut],
  [T.cardTefilmo + 2, -20, ease.inOut],
  [T.ecoPull, -20],
  [T.ecoPull + 18, 0, ease.inOut],
  [T.clear, 0],
]);

const Y = K([
  [0, 0],
  [T.proceso, 0],
  [T.proceso + 30, -30, ease.inOut],
  [T.lineMirada, -30],
  [T.lineMirada + 14, -16, ease.inOut],
  [T.linePregunta, -16],
  [T.linePregunta + 14, 4, ease.inOut],
  [T.lineIdea, 4],
  [T.lineIdea + 14, 20, ease.inOut],
  [T.pushIn, 20],
  [T.cut3 - 1, IDEA_TYPED.y - H / 2, ease.in],
  [T.cut3, 0],
  [T.cut, 0],
  [T.cut + 30, 0],
  [T.cut + 44, -470, ease.inOut],
  [T.cardCC, -470],
  [T.cardCC + 14, 40, ease.inOut],
  [T.cardTefilmo, 40],
  [T.cardTefilmo + 14, 520, ease.inOut],
  [T.ecoPull, 520],
  [T.ecoPull + 18, 20, ease.inOut],
  [T.clear, 0, ease.inOut],
  [T.recordar, 0],
  [T.retire, 30, ease.inOut],
  [T.retire + 1, 0],
]);

const Z = K([
  [0, 1],
  [T.proceso, 1.045, ease.linear],
  [T.proceso + 30, 1.0, ease.inOut],
  [T.pushIn, 1.02, ease.linear],
  [T.cut3 - 1, 3.4, ease.in],
  [T.cut3, 1.09],
  [T.cut3 + 22, 1.0, ease.out],
  [T.sweep, 1.035, ease.linear],
  [T.logo, 1.035],
  [T.logo + 1, 1.0],
  [T.cut, 1.03, ease.linear],
  [T.cut + 30, 1.0, ease.inOut],
  [T.cut + 44, 1.24, ease.inOut],
  [T.cardCC, 1.24],
  [T.cardCC + 14, 1.28, ease.inOut],
  [T.cardTefilmo, 1.28],
  [T.cardTefilmo + 14, 1.26, ease.inOut],
  [T.ecoPull, 1.26],
  [T.ecoPull + 18, 0.97, ease.inOut],
  [T.clear, 0.97],
  [T.clear + 24, 1.0, ease.inOut],
  [T.retire, 1.06, ease.linear],
  [T.retire + 1, 1.0],
  [T.end, 1.03, ease.linear],
]);

const R = K([
  [0, 0],
  [T.whip, 0],
  [T.whip + 8, -1.2, ease.inOut],
  [T.historia + 10, 0, ease.inOut],
  [T.cut + 44, 0],
  [T.cardCC + 14, 0.6, ease.inOut],
  [T.cardTefilmo + 14, -0.5, ease.inOut],
  [T.ecoPull + 18, 0, ease.inOut],
]);

export const camera = (f: number): Cam => ({ x: track(f, X), y: track(f, Y), z: track(f, Z), r: track(f, R) });

export const camTransform = (f: number, depth = 1) => {
  const c = camera(f);
  const z = 1 + (c.z - 1) * depth;
  return `translate(${W / 2}px, ${H / 2}px) rotate(${c.r * depth}deg) scale(${z}) translate(${-W / 2 - c.x * depth}px, ${-H / 2 - c.y * depth}px)`;
};
