import React from 'react';
import {AbsoluteFill, interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';

// ---------- Roteiro: palavra e frame em que ela aparece ----------
const WORDS: [string, number][] = [
  ['10', 0], ['SOBREVIVENTES', 12],
  ['CONTRA', 52], ['ZUMBIS', 66],
  ['ELES', 110], ['SÃO', 122], ['MUITOS', 134],
  ['UM', 185], ['POR', 197], ['UM', 209], ['CAEM', 224],
  ['RESTAM', 300], ['SÓ', 318], ['3', 330],
  ['QUEM', 365], ['SOBREVIVE?', 380],
];

const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- Camera ----------
const Camera: React.FC<{frame: number}> = ({frame}) => {
  const {camera} = useThree();
  const a = interpolate(frame, [0, 450], [-0.5, 0.5]);
  const r = interpolate(frame, [0, 450], [13, 9]);
  const h = interpolate(frame, [0, 450], [17, 13]);
  camera.position.set(Math.sin(a) * r, h, Math.cos(a) * r);
  camera.lookAt(0, 0, 0);
  return null;
};

// ---------- Pessoa / zumbi ----------
const Person: React.FC<{
  x: number; z: number; rotY: number; shirt: string; skin: string; frame: number; seed: number;
  zombie?: boolean; walking?: boolean; s?: number;
}> = ({x, z, rotY, shirt, skin, frame, seed, zombie, walking, s = 1}) => {
  const bob = walking ? Math.abs(Math.sin(frame * 0.3 + seed)) * 0.1 : Math.abs(Math.sin(frame * 0.1 + seed)) * 0.03;
  const sway = zombie && walking ? Math.sin(frame * 0.15 + seed) * 0.12 : 0;
  return (
    <group position={[x, bob, z]} rotation={[0, rotY + sway, 0]} scale={s}>
      {/* pernas */}
      <mesh position={[-0.12, 0.15, 0]}><boxGeometry args={[0.17, 0.3, 0.17]} /><meshStandardMaterial color="#2b2b36" /></mesh>
      <mesh position={[0.12, 0.15, 0]}><boxGeometry args={[0.17, 0.3, 0.17]} /><meshStandardMaterial color="#2b2b36" /></mesh>
      {/* corpo */}
      <mesh position={[0, 0.6, 0]}><boxGeometry args={[0.46, 0.6, 0.28]} /><meshStandardMaterial color={shirt} /></mesh>
      {/* cabeça */}
      <mesh position={[0, 1.07, 0]}><sphereGeometry args={[0.23, 16, 16]} /><meshStandardMaterial color={skin} /></mesh>
      {/* braços */}
      {zombie ? (
        <>
          <mesh position={[-0.3, 0.75, 0.25]} rotation={[1.4, 0, 0]}><boxGeometry args={[0.14, 0.5, 0.14]} /><meshStandardMaterial color={skin} /></mesh>
          <mesh position={[0.3, 0.75, 0.25]} rotation={[1.4, 0, 0]}><boxGeometry args={[0.14, 0.5, 0.14]} /><meshStandardMaterial color={skin} /></mesh>
        </>
      ) : (
        <>
          <mesh position={[-0.32, 0.55, 0]}><boxGeometry args={[0.14, 0.45, 0.14]} /><meshStandardMaterial color={shirt} /></mesh>
          <mesh position={[0.32, 0.55, 0]}><boxGeometry args={[0.14, 0.45, 0.14]} /><meshStandardMaterial color={shirt} /></mesh>
        </>
      )}
    </group>
  );
};

// ---------- Dados fixos da cena ----------
const N_Z = 26;
const ZOMBIES = Array.from({length: N_Z}, (_, i) => {
  const lane = i % 4;
  const ang = lane * (Math.PI / 2) + (rand(i + 1) - 0.5) * 0.7;
  return {
    ang,
    start: 25 + Math.floor(rand(i + 7) * 110),
    speed: 0.045 + rand(i + 3) * 0.02,
    rEnd: 3.5 + rand(i + 11) * 1.3,
    seed: i * 2.3,
  };
});
const R0 = 13;

const SURVIVORS = Array.from({length: 10}, (_, j) => {
  const ang = (j / 10) * Math.PI * 2;
  const rad = j % 2 === 0 ? 1.0 : 1.9;
  return {x: Math.sin(ang) * rad, z: Math.cos(ang) * rad, ang, infect: j < 7 ? 175 + j * 24 : 9999, seed: j * 1.9};
});
const SHIRTS = ['#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#eab308', '#ec4899', '#22c55e', '#f97316', '#0ea5e9'];

const BUILDINGS = Array.from({length: 14}, (_, i) => {
  const diag = Math.PI / 4 + (i % 4) * (Math.PI / 2);
  const ang = diag + (rand(i + 20) - 0.5) * 0.5;
  const rad = 7 + rand(i + 30) * 4;
  return {x: Math.sin(ang) * rad, z: Math.cos(ang) * rad, w: 1.6 + rand(i + 40) * 1.4, d: 1.6 + rand(i + 50) * 1.4, h: 1.5 + rand(i + 60) * 3.5, c: ['#4b5563', '#6b7280', '#57534e', '#52525b'][i % 4]};
});

export const ZombieScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const day = Math.min(10, 1 + Math.floor(frame / 45));
  const infected = SURVIVORS.filter((s) => frame >= s.infect).length;
  const alive = 10 - infected;

  let idx = 0;
  WORDS.forEach(([, f], i) => { if (frame >= f) idx = i; });
  const [word, wStart] = WORDS[idx];
  const pop = spring({frame: frame - wStart, fps, config: {damping: 12, stiffness: 180}});
  const scale = interpolate(pop, [0, 1], [0.6, 1]);

  const danger = interpolate(frame, [120, 330], [0, 0.35], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.2);

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#2a1233, #8a3a1c)'}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 55, position: [0, 17, 13]}}>
        <Camera frame={frame} />
        <ambientLight intensity={1.4} color="#ffd9b0" />
        <directionalLight position={[8, 14, 4]} intensity={1.4} color="#ffb27a" />

        {/* chão e ruas */}
        <mesh position={[0, -0.05, 0]}><boxGeometry args={[40, 0.1, 40]} /><meshStandardMaterial color="#2f3a2c" /></mesh>
        <mesh position={[0, 0.0, 0]}><boxGeometry args={[40, 0.04, 3.2]} /><meshStandardMaterial color="#3a3a42" /></mesh>
        <mesh position={[0, 0.0, 0]}><boxGeometry args={[3.2, 0.05, 40]} /><meshStandardMaterial color="#3a3a42" /></mesh>

        {/* prédios */}
        {BUILDINGS.map((b, i) => (
          <mesh key={i} position={[b.x, b.h / 2, b.z]}><boxGeometry args={[b.w, b.h, b.d]} /><meshStandardMaterial color={b.c} /></mesh>
        ))}

        {/* base com cerca */}
        <mesh position={[0, 0.05, 0]}><boxGeometry args={[5.6, 0.1, 5.6]} /><meshStandardMaterial color="#8b8f98" /></mesh>
        {[[0, -2.8, 5.6, 0.12], [0, 2.8, 5.6, 0.12], [-2.8, 0, 0.12, 5.6], [2.8, 0, 0.12, 5.6]].map((f, i) => (
          <mesh key={i} position={[f[0], 0.35, f[1]]}><boxGeometry args={[f[2], 0.6, f[3]]} /><meshStandardMaterial color="#e5e7eb" /></mesh>
        ))}

        {/* sobreviventes */}
        {SURVIVORS.map((s, j) => {
          const inf = frame >= s.infect;
          const hop = inf ? Math.max(0, 1 - (frame - s.infect) / 8) * 0.25 : 0;
          return (
            <Person
              key={j}
              x={s.x} z={s.z}
              rotY={Math.atan2(s.x, s.z) + (inf ? Math.PI : 0)}
              shirt={inf ? '#3b3b4f' : SHIRTS[j]}
              skin={inf ? '#7fb069' : '#f2c9a0'}
              zombie={inf}
              frame={frame}
              seed={s.seed}
              s={1 + hop}
            />
          );
        })}

        {/* zumbis chegando */}
        {ZOMBIES.map((z, i) => {
          const r = Math.max(z.rEnd, R0 - z.speed * Math.max(0, frame - z.start));
          const walking = r > z.rEnd + 0.01 && frame >= z.start;
          const x = Math.sin(z.ang) * r;
          const zz = Math.cos(z.ang) * r;
          return (
            <Person key={i} x={x} z={zz} rotY={Math.atan2(-x, -zz)} shirt="#3b3b4f" skin="#7fb069" zombie frame={frame} seed={z.seed} walking={walking} />
          );
        })}
      </ThreeCanvas>

      {/* tom de perigo + vinheta */}
      <AbsoluteFill style={{background: `rgba(160,0,0,${danger * (0.5 + 0.5 * pulse)})`, mixBlendMode: 'multiply'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)'}} />

      {/* HUD */}
      <div style={{position: 'absolute', top: 140, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20}}>
        <div style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 70, color: '#ffd23f', background: '#1a1a2e', border: '8px solid #ffd23f', borderRadius: 24, padding: '10px 40px'}}>
          DIA {day}/10
        </div>
        <div style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 56, color: '#fff', background: alive <= 3 ? '#b91c1c' : '#15803d', border: '6px solid #fff', borderRadius: 20, padding: '6px 34px'}}>
          VIVOS: {alive}
        </div>
      </div>

      {/* legenda: uma palavra por vez */}
      <div style={{position: 'absolute', bottom: 260, width: '100%', textAlign: 'center'}}>
        <span style={{display: 'inline-block', transform: `scale(${scale})`, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 130, color: '#fff', textShadow: '0 8px 0 #000, 6px 0 0 #000, -6px 0 0 #000, 0 -6px 0 #000'}}>
          {word}
        </span>
      </div>
    </AbsoluteFill>
  );
};
