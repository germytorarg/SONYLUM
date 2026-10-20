import React from "react";
import { AbsoluteFill, random, Sequence, useCurrentFrame } from "remotion";
import { AnalogOverlay, CameraLayer, DraftMarks, Hud, PaperBackground } from "./components/Layers";
import { TornSweep } from "./components/TornSweep";
import { ease, prog } from "./lib/anim";
import { Cuaderno } from "./scenes/Cuaderno";
import { Estudio } from "./scenes/Estudio";
import { Cierre, IdeaCentral } from "./scenes/Recordar";
import { Transformacion } from "./scenes/Transformacion";
import { T } from "./timeline";
import { C } from "./theme";

/**
 * Composición principal. Las escenas reciben el frame GLOBAL (f) para que
 * todas compartan el mismo mapa de tiempos (timeline.ts); <Sequence> solo
 * monta/desmonta y organiza la línea de tiempo en Remotion Studio.
 *
 * Capas (de atrás hacia adelante), cada una con su profundidad de cámara:
 *   papel (1.0) → marcas técnicas (0.85) → escenas (1.0) → barridos (1.1)
 *   → HUD (fijo) → grano / viñeta (fijo)
 */
export const SonylumIdeas: React.FC = () => {
  const f = useCurrentFrame();

  // Cierre: vibración analógica (gate weave) antes del fundido
  const shake = prog(f, T.vibrate, T.vibrate + 4, ease.out) * (1 - prog(f, T.fade + 6, T.end, ease.inOut));
  const jx = (random(`jx-${f}`) - 0.5) * 5 * shake;
  const jy = (random(`jy-${f}`) - 0.5) * 7 * shake;
  const breath = 1 + (random(`js-${f}`) - 0.5) * 0.006 * shake;

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: C.paper }}>
      <AbsoluteFill style={{ transform: `translate(${jx}px, ${jy}px) scale(${breath})` }}>
        <CameraLayer f={f} depth={1}>
          <PaperBackground />
        </CameraLayer>
        <CameraLayer f={f} depth={0.85}>
          <DraftMarks f={f} />
        </CameraLayer>
        <CameraLayer f={f} depth={1}>
          <Sequence from={0} durationInFrames={T.cut3 + 4} name="01–02 · La idea / El proceso" layout="none">
            <Cuaderno f={f} />
          </Sequence>
          <Sequence from={T.cut3 - 2} durationInFrames={T.sweep + 20 - (T.cut3 - 2)} name="03 · La transformación" layout="none">
            <Transformacion f={f} />
          </Sequence>
          <Sequence from={T.sweep + 14} durationInFrames={T.clear + 24 - (T.sweep + 14)} name="04–05 · SONYLUM / Ecosistema" layout="none">
            <Estudio f={f} />
          </Sequence>
          <Sequence from={T.clear + 10} durationInFrames={T.retire + 40 - (T.clear + 10)} name="06 · La idea central" layout="none">
            <IdeaCentral f={f} />
          </Sequence>
          <Sequence from={T.retire + 10} durationInFrames={T.end - (T.retire + 10)} name="07 · Cierre" layout="none">
            <Cierre f={f} />
          </Sequence>
        </CameraLayer>
        <CameraLayer f={f} depth={1.1}>
          <Sequence from={T.sweep - 8} durationInFrames={62} name="Barrido · hoja rasgada" layout="none">
            <TornSweep f={f} start={T.sweep - 6} dur={44} seed="sweepA" />
          </Sequence>
          <Sequence from={T.clear - 6} durationInFrames={56} name="Barrido · limpieza" layout="none">
            <TornSweep f={f} start={T.clear - 4} dur={36} angle={184} seed="sweepB" color={C.paperLight} strip={C.terra} sheetW={760} cover={false} />
          </Sequence>
        </CameraLayer>
      </AbsoluteFill>
      <Hud f={f} />
      <AnalogOverlay f={f} boost={shake} />
    </AbsoluteFill>
  );
};
