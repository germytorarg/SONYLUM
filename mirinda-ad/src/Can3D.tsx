import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import React, {useEffect, useMemo, useState} from 'react';
import {continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import PROFILE from './canProfile.json';
import {CAMERA, CAN_HEIGHT, canState, T, prog} from './timing';

/** Carga de textura que frena el render hasta que está lista. */
const useTex = (file: string, wrap = false) => {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [handle] = useState(() => delayRender(`Textura ${file}`));
  useEffect(() => {
    new THREE.TextureLoader().load(staticFile(file), (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      if (wrap) t.wrapS = THREE.RepeatWrapping;
      setTex(t);
      continueRender(handle);
    });
  }, [file, handle, wrap]);
  return tex;
};

/** Reflejos de estudio (RoomEnvironment) para el metal y el barniz. */
const Env: React.FC = () => {
  const {gl, scene} = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
};

const S = CAN_HEIGHT / (PROFILE.yBot - PROFILE.yTop); // px de la foto -> mundo

const Can: React.FC<{label: THREE.Texture; lid: THREE.Texture}> = ({label, lid}) => {
  const frame = useCurrentFrame();
  const st = canState(frame);

  const {body, topR, botR} = useMemo(() => {
    const mid = (PROFILE.yTop + PROFILE.yBot) / 2;
    // PROFILE.points ya va de abajo hacia arriba: v = 0 abajo, v = 1 arriba
    const pts = PROFILE.points.map(([r, y]) => new THREE.Vector2(r * S, (mid - y) * S));
    const geo = new THREE.LatheGeometry(pts, 160);
    return {body: geo, topR: pts[pts.length - 1].x, botR: pts[0].x};
  }, []);

  const half = CAN_HEIGHT / 2;
  return (
    <group position={[st.x, st.y, 0]} rotation={[st.rotX, st.rotY, st.rotZ]} scale={st.scale}>
      <mesh geometry={body}>
        <meshPhysicalMaterial
          map={label}
          roughness={0.3}
          metalness={0.25}
          clearcoat={0.45}
          clearcoatRoughness={0.3}
          envMapIntensity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* tapa reconstruida desde la foto, con anillita */}
      <mesh position={[0, half + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[topR * 1.01, 96]} />
        <meshStandardMaterial map={lid} metalness={0.85} roughness={0.32} envMapIntensity={1.2} />
      </mesh>
      {/* borde de la tapa */}
      <mesh position={[0, half + 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[topR * 1.0, 0.022, 16, 96]} />
        <meshStandardMaterial color="#d9d9d9" metalness={1} roughness={0.25} />
      </mesh>
      {/* fondo */}
      <mesh position={[0, -half - 0.002, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[botR, 96]} />
        <meshStandardMaterial color="#bdbdbd" metalness={1} roughness={0.3} />
      </mesh>
    </group>
  );
};

export const Can3D: React.FC = () => {
  const frame = useCurrentFrame();
  // las texturas se cargan ANTES de montar el canvas (si llegan después, el
  // render por frame de Remotion ya pintó la escena vacía)
  const label = useTex('assets/can_label.jpg', true);
  const lid = useTex('assets/can_lid.png');
  // pulso del contraluz naranja con el beat (1 tiempo = 15 frames) desde el impacto
  const beat = frame >= T.impact ? Math.exp(-((frame - T.impact) % 15) / 4) : 0;
  const rim = 26 + 18 * beat + 40 * prog(frame, T.logo - 4, T.logo + 2) * (1 - prog(frame, T.logo + 2, T.logo + 20));
  if (!label || !lid) return null;
  return (
    <ThreeCanvas
      width={1080}
      height={1920}
      flat
      gl={{alpha: true, antialias: true, preserveDrawingBuffer: true}}
      camera={{fov: CAMERA.fov, position: [0, 0, CAMERA.z], near: 0.1, far: 100}}
      style={{position: 'absolute', inset: 0}}
    >
      <Env />
      <ambientLight intensity={0.55} />
      <directionalLight position={[-3, 2.5, 5]} intensity={2.1} color="#fff4e6" />
      <directionalLight position={[2.5, 4, 3]} intensity={0.8} color="#ffffff" />
      {/* contraluces naranjas: recortan la silueta contra el negro */}
      <pointLight position={[3.2, 1.2, -2.2]} intensity={rim} distance={14} color="#ff7a00" />
      <pointLight position={[-3.2, -0.6, -2.4]} intensity={rim * 0.85} distance={14} color="#ff5a00" />
      <pointLight position={[0, 4, -1]} intensity={10} distance={10} color="#ffd9a0" />
      <Can label={label} lid={lid} />
    </ThreeCanvas>
  );
};
