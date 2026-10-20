import React from "react";
import { Composition } from "remotion";
import { SonylumIdeas } from "./SonylumIdeas";
import { DURATION, FPS, H, W } from "./theme";
import "./lib/fonts";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="SonylumIdeas"
    component={SonylumIdeas}
    durationInFrames={DURATION}
    fps={FPS}
    width={W}
    height={H}
  />
);
