import {staticFile} from 'remotion';

// PNG limpios (tools/clean_assets.py): sin restos de otras láminas, bordes
// corregidos y escalados x2. Los originales del kit están en assets/original.
type Asset = {src: string; w: number; h: number};

const a = (file: string, w: number, h: number): Asset => ({
  src: staticFile(`assets/clean/${file}.png`),
  w,
  h,
});

export const ASSETS = {
  anillosEntrelazados: a('01_anillos_entrelazados', 704, 460),
  anilloSolitario: a('02_anillo_solitario', 554, 572),
  destellos: a('03_destellos', 582, 294),
  siluetaEncuentro: a('04_silueta_encuentro', 746, 836),
  noviosDeFrente: a('05_novios_de_frente', 786, 982),
  noviosCaminando: a('06_novios_caminando', 620, 976),
  ramo: a('07_ramo', 638, 954),
  rosa: a('08_rosa_individual', 356, 366),
  petalos: [
    a('09_petalos_1', 254, 192),
    a('09_petalos_2', 138, 212),
    a('09_petalos_3', 180, 182),
    a('09_petalos_4', 190, 144),
  ],
  noviaSola: a('10_novia_sola', 504, 940),
  iglesia: a('11_iglesia', 718, 1024),
  arcoFloral: a('12_arco_floral', 830, 1024),
  pasillo: a('13_pasillo_ceremonia', 830, 588),
  velas: a('14_velas', 488, 494),
  manos: a('15_manos_alianza', 1672, 436),
  abrazo: a('16_novios_abrazo', 426, 972),
  beso: a('17_novios_beso_silueta', 904, 840),
  atardecer: a('18_atardecer_mar', 548, 300),
  noviosAtardecer: a('19_novios_atardecer', 658, 694),
  cinta: a('20_cinta_cine', 942, 432),
  lazo: a('21_lazo_saten', 646, 672),
  marco: a('22_marco_dorado', 608, 484),
  // 23 dividido en dos capas sobre el mismo lienzo (854 x 730).
  sobreCerrado: a('23_sobre_invitacion_cerrado', 854, 730),
  sobreAbierto: a('23_sobre_invitacion_fondo', 854, 730),
  copas: a('24_copa_brindis', 530, 674),
} as const;

// Puntos de interés medidos sobre los PNG limpios (proporción 0..1).
export const HOTSPOTS = {
  ringOnHand: {x: 0.47, y: 0.25},
  candleFlames: [
    {x: 0.41, y: 0.14},
    {x: 0.67, y: 0.27},
    {x: 0.13, y: 0.44},
    {x: 0.29, y: 0.62},
  ],
  frameInterior: {x0: 0.19, y0: 0.11, x1: 0.875, y1: 0.775},
  waxSeal: {x: 0.55, y: 0.62},
  diamond: {x: 0.5, y: 0.12},
} as const;

export const MUSIC = staticFile('audio/tefilmo_music.wav');
// Colocar audio/voiceover.wav en public/audio y activar en src/config.ts.
export const VOICEOVER = staticFile('audio/voiceover.wav');
