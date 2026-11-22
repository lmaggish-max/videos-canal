import React from 'react';
import {AbsoluteFill, interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';

// ---------- Roteiro: palavra e frame em que ela aparece ----------
const WORDS: [string, number][] = [
  ['QUATRO', 0], ['IAs', 18],
  ['UM', 50], ['PAÍS', 62], ['CADA', 78],
  ['UMA', 112], ['DELAS', 126], ['TRAIU', 142],
  ['QUEM', 235], ['VENCE?', 252],
];

const Camera: React.FC<{frame: number}> = ({frame}) => {
  const {camera} = useThree();
  const a = interpolate(frame, [0, 300], [-0.35, 0.35]);
  const r = interpolate(frame, [0, 300], [21, 17]);
  camera.position.set(Math.sin(a) * r, 14, Math.cos(a) * r);
  camera.lookAt(0, 0, 0);
  return null;
};

const Land: React.FC<{p: [number, number, number]; s: [number, number, number]; color: string}> = ({p, s, color}) => (
  <mesh position={p}>
    <boxGeometry args={s} />
    <meshStandardMaterial color={color} />
  </mesh>
);

const Soldier: React.FC<{p: [number, number, number]; color: string; frame: number; seed: number; walking?: boolean}> = ({p, color, frame, seed, walking}) => {
  const bob = walking ? Math.abs(Math.sin(frame * 0.5 + seed)) * 0.18 : Math.abs(Math.sin(frame * 0.12 + seed)) * 0.04;
  return (
    <group position={[p[0], p[1] + bob, p[2]]}>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.45, 0.6, 0.35]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color="#f2c9a0" />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <cylinderGeometry args={[0.26, 0.28, 0.14, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
};

const Group: React.FC<{c: [number, number, number]; color: string; frame: number; walking?: boolean}> = ({c, color, frame, walking}) => (
  <>
    {[[-0.6, -0.5], [0.4, -0.6], [-0.1, 0.3], [0.8, 0.4], [-0.9, 0.5]].map((o, i) => (
      <Soldier key={i} p={[c[0] + o[0], c[1], c[2] + o[1]]} color={color} frame={frame} seed={i * 1.7} walking={walking} />
    ))}
  </>
);

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const year = Math.min(10, 1 + Math.floor(frame / 30));

  // soldados verdes marcham da terra verde para a laranja (frames 160-235)
  const march = interpolate(frame, [160, 235], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const marchX = interpolate(march, [0, 1], [2.6, -1.6]);
  const marching = march > 0 && march < 1;
  const orangeColor = interpolateColors(frame, [232, 250], ['#ff7a45', '#2fbf71']);
  const greenSoldiersLeft = march >= 1;

  // palavra atual
  let idx = 0;
  WORDS.forEach(([, f], i) => {
    if (frame >= f) idx = i;
  });
  const [word, wStart] = WORDS[idx];
  const pop = spring({frame: frame - wStart, fps, config: {damping: 12, stiffness: 180}});
  const scale = interpolate(pop, [0, 1], [0.6, 1]);

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#0e1b3d, #1b2f66)'}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 40, position: [0, 9, 12]}}>
        <Camera frame={frame} />
        <ambientLight intensity={1.1} />
        <directionalLight position={[6, 12, 6]} intensity={1.6} />
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[18, 0.1, 18]} />
          <meshStandardMaterial color="#14224d" />
        </mesh>
        <Land p={[-2.1, 0.15, 0]} s={[4, 0.3, 5]} color={orangeColor} />
        <Land p={[2.4, 0.15, -0.4]} s={[3.6, 0.3, 4]} color="#2fbf71" />
        <Land p={[0, 0.15, -4.2]} s={[7, 0.3, 3]} color="#9aa3b5" />
        <Land p={[0, 0.15, 4]} s={[7, 0.3, 3]} color="#3d7bff" />

        <Group c={[-2.4, 0.3, 0.2]} color="#c2410c" frame={frame} />
        {!greenSoldiersLeft && !marching && <Group c={[2.8, 0.3, -0.4]} color="#15803d" frame={frame} />}
        {marching && <Group c={[marchX, 0.3, -0.4 + march * 0.6]} color="#15803d" frame={frame} walking />}
        {greenSoldiersLeft && <Group c={[-1.6, 0.3, 0.2]} color="#15803d" frame={frame} />}
        <Group c={[0, 0.3, -4.2]} color="#64748b" frame={frame} />
        <Group c={[0, 0.3, 4]} color="#1d4ed8" frame={frame} />
      </ThreeCanvas>

      {/* selo de ano */}
      <div style={{position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <div style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 70, color: '#ffd23f', background: '#1a1a2e', border: '8px solid #ffd23f', borderRadius: 24, padding: '10px 40px'}}>
          ANO {year}/10
        </div>
      </div>

      {/* legenda: uma palavra por vez */}
      <div style={{position: 'absolute', bottom: 260, width: '100%', textAlign: 'center'}}>
        <span style={{display: 'inline-block', transform: `scale(${scale})`, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 150, color: '#fff', textShadow: '0 8px 0 #000, 6px 0 0 #000, -6px 0 0 #000, 0 -6px 0 #000'}}>
          {word}
        </span>
      </div>
    </AbsoluteFill>
  );
};
