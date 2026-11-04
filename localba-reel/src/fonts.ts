import {continueRender, delayRender, staticFile} from 'remotion';

// Anton (titulares de impacto) + Montserrat (apoyo). Ambas OFL, autoalojadas.
const faces: [string, string, string, string][] = [
  ['Anton', 'anton-latin-400-normal', '400', 'normal'],
  ['Montserrat', 'montserrat-latin-600-normal', '600', 'normal'],
  ['Montserrat', 'montserrat-latin-700-normal', '700', 'normal'],
  ['Montserrat', 'montserrat-latin-800-normal', '800', 'normal'],
  ['Montserrat', 'montserrat-latin-800-italic', '800', 'italic'],
  ['Montserrat', 'montserrat-latin-900-normal', '900', 'normal'],
];

let loaded = false;
export const loadFonts = () => {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const handle = delayRender('Cargando tipografías');
  Promise.all(
    faces.map(([family, file, weight, style]) =>
      new FontFace(family, `url(${staticFile(`fonts/${file}.woff2`)}) format('woff2')`, {weight, style})
        .load()
        .then((f) => document.fonts.add(f)),
    ),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
};
