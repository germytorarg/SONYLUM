import { ease, tw } from "./lib/anim";

/**
 * Mapa de tiempos (frames globales, 30 fps). Toda la pieza se sincroniza
 * desde acá: mover un beat mueve las acciones que dependen de él.
 *
 * Si se incorpora una locución, reemplazar estos valores por el frame de
 * cada palabra (segundo × 30) y la pieza se re-sincroniza sola.
 */
export const T = {
  // 00:00–00:04 · LA IDEA
  sheetFall: 4,
  todoEmpieza: 34,
  ideaHit: 58,
  ideaRule: 72,
  glassesCross: 70,

  // 00:04–00:08 · EL PROCESO
  proceso: 118,
  coffeeIn: 126,
  lineMirada: 142,
  linePregunta: 170,
  lineIdea: 198,
  pushIn: 214,
  cut3: 240,

  // 00:08–00:13 · LA TRANSFORMACIÓN
  imagen: 256, // inicio de la transición IDEA→IMAGEN (cada transición dura MORPH_DUR)
  movimiento: 298,
  whip: 326, // la palabra MOVIMIENTO arrastra los objetos
  historia: 346,

  // 00:13–00:18 · SONYLUM
  sweep: 382, // hoja rasgada que barre (cobertura total ≈ sweep+15…sweep+18)
  logo: 400,
  verb1: 440,
  verb2: 456,
  verb3: 472,
  penLine: 488,

  // 00:18–00:23 · EL ECOSISTEMA
  cut: 532, // recorte de revista
  cardCC: 574,
  cardTefilmo: 622,
  ecoPull: 664,

  // 00:23–00:27 · LA IDEA CENTRAL
  clear: 690,
  noSeTrata: 718,
  deMostrar: 736,
  seTrataDe: 760,
  recordar: 774,

  // 00:27–00:30 · CIERRE
  retire: 810,
  finalLogo: 828,
  tagline: 852,
  vibrate: 872,
  fade: 886,
  end: 900,
};

/** Desplazamiento horizontal de MOVIMIENTO: el látigo que arrastra todo. */
export const whipX = (f: number) =>
  tw(f, [T.whip, T.whip + 14], [0, -470], ease.whip);

export const MORPH_DUR = 26;
