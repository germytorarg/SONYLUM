// Versión web: la misma composición corriendo en vivo en el navegador (Remotion Player).
// Se compila con `npm run web` → web/player.js
import React from "react";
import { createRoot } from "react-dom/client";
import { Player, PlayerRef } from "@remotion/player";
import { WEB_ASSETS } from "./web-assets.gen";

// Los assets van embebidos: se registran antes de cargar composición y fuentes.
window.__SONYLUM_ASSETS = WEB_ASSETS;

const { SonylumIdeas } = await import("./SonylumIdeas");
const { DURATION, FPS, H, W } = await import("./theme");
await import("./lib/fonts");

declare global {
  interface Window {
    sonylumPlayer?: PlayerRef | null;
    /** "capture": sin controles, una sola pasada, para grabar la pantalla. */
    SONYLUM_MODE?: "page" | "capture";
  }
}

const capture = window.SONYLUM_MODE === "capture";

const mount = document.getElementById("player");
if (mount) {
  createRoot(mount).render(
    <Player
      ref={(r) => {
        window.sonylumPlayer = r;
      }}
      component={SonylumIdeas}
      durationInFrames={DURATION}
      fps={FPS}
      compositionWidth={W}
      compositionHeight={H}
      style={{ width: "100%", height: "100%" }}
      controls={!capture}
      loop={!capture}
      autoPlay={!capture}
      initiallyMuted
      clickToPlay={!capture}
      moveToBeginningWhenEnded={!capture}
      showPosterWhenPaused={false}
      bufferStateDelayInMilliseconds={600}
    />,
  );
}
