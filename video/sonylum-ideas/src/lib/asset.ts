import { staticFile } from "remotion";

declare global {
  interface Window {
    __SONYLUM_ASSETS?: Record<string, string>;
  }
}

/**
 * Ruta de un asset de public/. En Remotion (studio / render) es staticFile();
 * en la versión web los assets vienen embebidos en el bundle (data URIs),
 * así la página funciona en cualquier host sin depender de rutas relativas.
 */
export const asset = (path: string) =>
  (typeof window !== "undefined" && window.__SONYLUM_ASSETS?.[path]) || staticFile(path);
