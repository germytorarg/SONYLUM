// Versión web: la misma composición corriendo en vivo en el navegador (Remotion Player).
// Se compila con `npm run web` → web/player.js
import React from "react";
import { createRoot } from "react-dom/client";
import { Player, PlayerRef } from "@remotion/player";
import { SonylumIdeas } from "./SonylumIdeas";
import { DURATION, FPS, H, W } from "./theme";
import "./lib/fonts";

declare global {
  interface Window {
    sonylumPlayer?: PlayerRef | null;
  }
}

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
      controls
      loop
      autoPlay
      initiallyMuted
      clickToPlay
      showPosterWhenPaused={false}
      bufferStateDelayInMilliseconds={600}
    />,
  );
}
