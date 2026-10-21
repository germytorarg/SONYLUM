import {continueRender, delayRender, staticFile} from 'remotion';

// Tipografías autoalojadas (OFL): Cormorant Garamond + Montserrat.
const faces: [string, string, string, string][] = [
  ['Cormorant Garamond', 'cormorant-garamond-latin-300-normal', '300', 'normal'],
  ['Cormorant Garamond', 'cormorant-garamond-latin-400-normal', '400', 'normal'],
  ['Cormorant Garamond', 'cormorant-garamond-latin-500-normal', '500', 'normal'],
  ['Cormorant Garamond', 'cormorant-garamond-latin-600-normal', '600', 'normal'],
  ['Cormorant Garamond', 'cormorant-garamond-latin-300-italic', '300', 'italic'],
  ['Cormorant Garamond', 'cormorant-garamond-latin-400-italic', '400', 'italic'],
  ['Montserrat', 'montserrat-latin-300-normal', '300', 'normal'],
  ['Montserrat', 'montserrat-latin-400-normal', '400', 'normal'],
  ['Montserrat', 'montserrat-latin-500-normal', '500', 'normal'],
];

let loaded = false;

export const loadFonts = () => {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const handle = delayRender('Cargando tipografías');
  Promise.all(
    faces.map(([family, file, weight, style]) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}.woff2`)}) format('woff2')`, {
        weight,
        style,
      });
      return face.load().then((f) => document.fonts.add(f));
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
};
