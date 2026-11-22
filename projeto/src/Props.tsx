import React from 'react';

/** ITENS E CENÁRIOS do canal de apocalipse zumbi. Cada um é um componente 3D simples. */
const M: React.FC<{c: string; o?: number; r?: number; m?: number}> = ({c, o = 1, r = 0.7, m = 0}) => (
  <meshStandardMaterial color={c} transparent={o < 1} opacity={o} roughness={r} metalness={m} />
);
type P = {position?: [number, number, number]; rotation?: [number, number, number]; scale?: number};
const G: React.FC<P & {children: React.ReactNode}> = ({position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, children}) => (
  <group position={position} rotation={rotation} scale={scale}>{children}</group>
);

// ---------------- ITENS ----------------
export const WaterBottle: React.FC<P> = (p) => (
  <G {...p}>
    <mesh><cylinderGeometry args={[0.17, 0.17, 0.62, 24]} /><M c="#9fd8ff" o={0.55} r={0.2} /></mesh>
    <mesh position={[0, -0.1, 0]}><cylinderGeometry args={[0.155, 0.155, 0.4, 24]} /><M c="#2f9bff" o={0.8} r={0.2} /></mesh>
    <mesh position={[0, 0.28, 0]}><cylinderGeometry args={[0.07, 0.14, 0.12, 24]} /><M c="#9fd8ff" o={0.55} r={0.2} /></mesh>
    <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.075, 0.075, 0.1, 20]} /><M c="#1565c0" /></mesh>
    <mesh position={[0, 0.0, 0]}><cylinderGeometry args={[0.175, 0.175, 0.16, 24]} /><M c="#ffffff" /></mesh>
  </G>
);
export const CannedFood: React.FC<P> = (p) => (
  <G {...p}>
    <mesh><cylinderGeometry args={[0.24, 0.24, 0.4, 28]} /><M c="#c9ced6" m={0.6} r={0.35} /></mesh>
    <mesh><cylinderGeometry args={[0.245, 0.245, 0.24, 28]} /><M c="#d62828" /></mesh>
    <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.246, 0.246, 0.05, 28]} /><M c="#ffd23f" /></mesh>
    <mesh position={[0, 0.205, 0]}><cylinderGeometry args={[0.22, 0.22, 0.02, 28]} /><M c="#e5e9ef" m={0.6} r={0.3} /></mesh>
    <mesh position={[0.05, 0.225, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.06, 0.012, 8, 18]} /><M c="#aab" m={0.6} /></mesh>
  </G>
);
export const Bread: React.FC<P> = (p) => (
  <G {...p}>
    <mesh rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1.1]}><capsuleGeometry args={[0.2, 0.5, 8, 16]} /><M c="#d9983f" /></mesh>
    {[-0.18, 0, 0.18].map((x, i) => (
      <mesh key={i} position={[x, 0.17, 0]} rotation={[0, 0, 0.5]} scale={[1, 0.25, 0.8]}><boxGeometry args={[0.2, 0.06, 0.25]} /><M c="#b5752a" /></mesh>
    ))}
  </G>
);
export const Backpack: React.FC<P> = (p) => (
  <G {...p}>
    <mesh><boxGeometry args={[0.62, 0.78, 0.36]} /><M c="#2a9d8f" /></mesh>
    <mesh position={[0, 0.4, 0]} scale={[1, 0.5, 1]}><sphereGeometry args={[0.31, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><M c="#2a9d8f" /></mesh>
    <mesh position={[0, -0.12, 0.2]}><boxGeometry args={[0.5, 0.36, 0.1]} /><M c="#1f776d" /></mesh>
    <mesh position={[0, -0.04, 0.26]}><boxGeometry args={[0.52, 0.04, 0.03]} /><M c="#ffd23f" /></mesh>
    {[-0.2, 0.2].map((x, i) => <mesh key={i} position={[x, 0.05, -0.2]}><boxGeometry args={[0.08, 0.7, 0.06]} /><M c="#17413c" /></mesh>)}
    <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.07, 0.015, 8, 14, Math.PI]} /><M c="#17413c" /></mesh>
  </G>
);
export const Radio: React.FC<P> = (p) => (
  <G {...p}>
    <mesh><boxGeometry args={[0.8, 0.5, 0.26]} /><M c="#d94f4f" r={0.5} /></mesh>
    <mesh position={[-0.2, -0.02, 0.135]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.17, 0.17, 0.02, 24]} /><M c="#2b2b2b" /></mesh>
    {[-0.1, -0.2, -0.3].map((x, i) => <mesh key={i} position={[x + 0.1 - 0.1, -0.02, 0.15]}><boxGeometry args={[0.02, 0.26 - i * 0.04, 0.01]} /><M c="#555" /></mesh>)}
    <mesh position={[0.17, 0.1, 0.135]}><boxGeometry args={[0.28, 0.14, 0.02]} /><M c="#b6ffb0" /></mesh>
    {[0.1, 0.28].map((x, i) => <mesh key={i} position={[x, -0.1, 0.15]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.055, 0.055, 0.05, 16]} /><M c="#f1f1f1" /></mesh>)}
    <mesh position={[0.35, 0.5, -0.05]} rotation={[0, 0, -0.25]}><cylinderGeometry args={[0.012, 0.012, 0.8, 8]} /><M c="#bbb" m={0.8} /></mesh>
    <mesh position={[0, 0.27, 0]} rotation={[0, 0, 0]}><torusGeometry args={[0.2, 0.025, 8, 18, Math.PI]} /><M c="#333" /></mesh>
  </G>
);
export const Flashlight: React.FC<P> = (p) => (
  <G {...p} >
    <group rotation={[0, 0, -Math.PI / 2]}>
      <mesh><cylinderGeometry args={[0.09, 0.09, 0.55, 20]} /><M c="#ffc300" /></mesh>
      <mesh position={[0, -0.1, 0]}><cylinderGeometry args={[0.095, 0.095, 0.08, 20]} /><M c="#222" /></mesh>
      <mesh position={[0, 0.34, 0]}><cylinderGeometry args={[0.17, 0.1, 0.2, 24]} /><M c="#333" /></mesh>
      <mesh position={[0, 0.445, 0]}><cylinderGeometry args={[0.15, 0.15, 0.02, 24]} /><meshStandardMaterial color="#fff6a8" emissive="#fff3a0" emissiveIntensity={0.8} /></mesh>
    </group>
  </G>
);
export const FirstAid: React.FC<P> = (p) => (
  <G {...p}>
    <mesh><boxGeometry args={[0.8, 0.56, 0.28]} /><M c="#f8f9fa" /></mesh>
    <mesh position={[0, 0, 0.145]}><boxGeometry args={[0.38, 0.12, 0.02]} /><M c="#e63946" /></mesh>
    <mesh position={[0, 0, 0.145]}><boxGeometry args={[0.12, 0.38, 0.02]} /><M c="#e63946" /></mesh>
    <mesh position={[0, 0.32, 0]}><torusGeometry args={[0.12, 0.02, 8, 16, Math.PI]} /><M c="#adb5bd" /></mesh>
    {[-1, 1].map((s) => <mesh key={s} position={[s * 0.22, 0.275, 0.1]}><boxGeometry args={[0.05, 0.05, 0.06]} /><M c="#adb5bd" /></mesh>)}
  </G>
);
export const Bat: React.FC<P> = (p) => (
  <G {...p}>
    <group rotation={[0, 0, 0.5]}>
      <mesh><cylinderGeometry args={[0.1, 0.035, 1.0, 20]} /><M c="#c68642" r={0.5} /></mesh>
      <mesh position={[0, -0.52, 0]}><sphereGeometry args={[0.05, 12, 12]} /><M c="#c68642" /></mesh>
      <mesh position={[0, -0.3, 0]}><cylinderGeometry args={[0.04, 0.045, 0.2, 12]} /><M c="#222" /></mesh>
      <mesh position={[0, 0.5, 0]}><sphereGeometry args={[0.1, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /><M c="#c68642" /></mesh>
    </group>
  </G>
);
export const MapItem: React.FC<P> = (p) => (
  <G {...p}>
    {[-0.26, 0, 0.26].map((x, i) => (
      <mesh key={i} position={[x, 0, i === 1 ? 0.02 : 0]} rotation={[0, i === 1 ? 0 : (i - 1) * -0.18, 0]}><boxGeometry args={[0.26, 0.6, 0.02]} /><M c={i === 1 ? '#f1e3b8' : '#e8d6a0'} /></mesh>
    ))}
    <mesh position={[0.02, 0.05, 0.04]} rotation={[0, 0, 0.78]}><boxGeometry args={[0.2, 0.035, 0.01]} /><M c="#d62828" /></mesh>
    <mesh position={[0.02, 0.05, 0.04]} rotation={[0, 0, -0.78]}><boxGeometry args={[0.2, 0.035, 0.01]} /><M c="#d62828" /></mesh>
    <mesh position={[-0.15, -0.12, 0.04]} rotation={[0, 0, 0.4]}><boxGeometry args={[0.3, 0.02, 0.01]} /><M c="#1d6fd6" /></mesh>
  </G>
);
export const Batteries: React.FC<P> = (p) => (
  <G {...p}>
    {[-0.14, 0.14].map((x, i) => (
      <group key={i} position={[x, 0, 0]}>
        <mesh><cylinderGeometry args={[0.1, 0.1, 0.45, 20]} /><M c={i ? '#2dbf4a' : '#1a1a1a'} m={0.3} /></mesh>
        <mesh position={[0, 0.24, 0]}><cylinderGeometry args={[0.04, 0.04, 0.04, 12]} /><M c="#ffd23f" m={0.6} /></mesh>
        <mesh position={[0, 0.0, 0]}><cylinderGeometry args={[0.102, 0.102, 0.08, 20]} /><M c="#ffd23f" /></mesh>
      </group>
    ))}
  </G>
);
export const Binoculars: React.FC<P> = (p) => (
  <G {...p}>
    <group rotation={[Math.PI / 2, 0, 0]}>
      {[-0.17, 0.17].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh><cylinderGeometry args={[0.12, 0.12, 0.45, 20]} /><M c="#2b2d42" /></mesh>
          <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.15, 0.13, 0.1, 20]} /><M c="#111" /></mesh>
          <mesh position={[0, 0.305, 0]}><cylinderGeometry args={[0.12, 0.12, 0.01, 20]} /><meshStandardMaterial color="#7fd6ff" emissive="#4fb8ff" emissiveIntensity={0.5} /></mesh>
          <mesh position={[0, -0.25, 0]}><cylinderGeometry args={[0.09, 0.09, 0.06, 16]} /><M c="#111" /></mesh>
        </group>
      ))}
      <mesh><boxGeometry args={[0.25, 0.3, 0.08]} /><M c="#3d405b" /></mesh>
    </group>
  </G>
);
export const SleepingBag: React.FC<P> = (p) => (
  <G {...p}>
    <mesh rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[0.24, 0.55, 8, 20]} /><M c="#3a86ff" /></mesh>
    {[-0.2, 0.2].map((x, i) => <mesh key={i} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.245, 0.02, 8, 24]} /><M c="#ffd23f" /></mesh>)}
    <mesh position={[0.4, 0, 0.2]} rotation={[0, 0.4, 0]}><circleGeometry args={[0.14, 16]} /><M c="#2a6bd1" /></mesh>
  </G>
);

// ---------------- CENÁRIOS ----------------
export const Building: React.FC<P> = (p) => (
  <G {...p}>
    <mesh position={[0, 1.25, 0]}><boxGeometry args={[1.7, 2.5, 1.3]} /><M c="#8a8f98" /></mesh>
    <mesh position={[0.3, 2.65, 0]} rotation={[0, 0, -0.18]}><boxGeometry args={[1.0, 0.35, 1.3]} /><M c="#7a7f88" /></mesh>
    {Array.from({length: 5}).map((_, r) => Array.from({length: 3}).map((__, c) => {
      const broken = (r * 3 + c) % 4 === 1; const lit = (r * 3 + c) % 7 === 2;
      return (
        <mesh key={`${r}-${c}`} position={[-0.52 + c * 0.52, 0.35 + r * 0.45, 0.66]}>
          <boxGeometry args={[0.32, 0.28, 0.02]} />
          <meshStandardMaterial color={lit ? '#ffb347' : broken ? '#3a2a22' : '#1d2b4a'} emissive={lit ? '#ff9a2e' : '#000'} emissiveIntensity={lit ? 0.6 : 0} />
        </mesh>
      );
    }))}
    {[0.4, 0.95].map((y, i) => <mesh key={i} position={[0.0 + i * 0.5, y + 0.4, 0.69]} rotation={[0, 0, i ? 0.1 : -0.1]}><boxGeometry args={[0.45, 0.06, 0.02]} /><M c="#8b5a2b" /></mesh>)}
    <mesh position={[0, 0.2, 0.67]}><boxGeometry args={[0.4, 0.4, 0.02]} /><M c="#4a3b2f" /></mesh>
  </G>
);
export const CarWreck: React.FC<P> = (p) => (
  <G {...p}>
    <mesh position={[0, 0.35, 0]}><boxGeometry args={[2.0, 0.5, 0.95]} /><M c="#4a7bd0" r={0.6} /></mesh>
    <mesh position={[-0.1, 0.78, 0]}><boxGeometry args={[1.05, 0.4, 0.85]} /><M c="#5b8be0" r={0.6} /></mesh>
    <mesh position={[-0.1, 0.8, 0.43]}><boxGeometry args={[0.85, 0.28, 0.02]} /><M c="#1b2a41" /></mesh>
    {[[-0.65, 0.5], [0.65, 0.5], [-0.65, -0.5], [0.65, -0.5]].map((w, i) => (
      <mesh key={i} position={[w[0], 0.17, w[1]]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.14, 18]} /><M c="#1a1a1a" /></mesh>
    ))}
    <mesh position={[1.01, 0.4, 0.3]}><boxGeometry args={[0.04, 0.12, 0.18]} /><meshStandardMaterial color="#ffe08a" emissive="#ffd23f" emissiveIntensity={0.4} /></mesh>
    <mesh position={[0.3, 0.62, 0.2]} rotation={[0, 0, 0.1]}><boxGeometry args={[0.5, 0.04, 0.3]} /><M c="#8b3a2a" /></mesh>
  </G>
);
export const Barricade: React.FC<P> = (p) => (
  <G {...p}>
    {[0.9, -0.9].map((x, i) => <mesh key={i} position={[x * 0.55, 0.65, 0]} rotation={[0, 0, x * 0.35]}><boxGeometry args={[0.12, 1.5, 0.12]} /><M c="#7a4a25" /></mesh>)}
    {[0.4, 0.75, 1.1].map((y, i) => <mesh key={i} position={[0, y, 0.1]} rotation={[0, 0, (i - 1) * 0.12]}><boxGeometry args={[1.8, 0.2, 0.08]} /><M c="#b07a43" /></mesh>)}
    {[-0.6, -0.2, 0.2, 0.6].map((x, i) => <mesh key={i} position={[x, 0.14, 0.2]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.9]}><capsuleGeometry args={[0.14, 0.2, 6, 12]} /><M c="#c2b280" /></mesh>)}
    <mesh position={[0, 1.4, 0.05]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.7, 0.012, 6, 30, Math.PI]} /><M c="#888" m={0.8} /></mesh>
  </G>
);
export const Camp: React.FC<P> = (p) => (
  <G {...p}>
    <mesh position={[-0.55, 0.45, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.9, 0.95, 4]} /><M c="#f08a24" /></mesh>
    <mesh position={[-0.55, 0.28, 0.5]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.25, 0.5, 4]} /><M c="#222" /></mesh>
    <group position={[0.75, 0, 0.3]}>
      {[0, 1, 2].map((i) => <mesh key={i} position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, i * 1.05]}><cylinderGeometry args={[0.05, 0.05, 0.5, 8]} /><M c="#5b3a1e" /></mesh>)}
      <mesh position={[0, 0.32, 0]}><coneGeometry args={[0.17, 0.5, 8]} /><meshStandardMaterial color="#ff7a18" emissive="#ff6a00" emissiveIntensity={0.8} /></mesh>
      <mesh position={[0, 0.26, 0]}><coneGeometry args={[0.09, 0.32, 8]} /><meshStandardMaterial color="#ffd23f" emissive="#ffc300" emissiveIntensity={0.9} /></mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => <mesh key={i} position={[Math.cos(i * 1.05) * 0.3, 0.05, Math.sin(i * 1.05) * 0.3]}><sphereGeometry args={[0.07, 8, 8]} /><M c="#8a8f98" /></mesh>)}
    </group>
  </G>
);
export const WatchTower: React.FC<P> = (p) => (
  <G {...p}>
    {[[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].map((l, i) => (
      <mesh key={i} position={[l[0] * 1.15, 0.95, l[1] * 1.15]} rotation={[-l[1] * 0.12, 0, l[0] * 0.12]}><boxGeometry args={[0.1, 1.9, 0.1]} /><M c="#7a4a25" /></mesh>
    ))}
    {[0.5, 1.1].map((y, i) => <mesh key={i} position={[0, y, 0.37]}><boxGeometry args={[0.8, 0.07, 0.07]} /><M c="#9b6a38" /></mesh>)}
    <mesh position={[0, 1.95, 0]}><boxGeometry args={[1.1, 0.1, 1.1]} /><M c="#9b6a38" /></mesh>
    <mesh position={[0, 2.25, 0.5]}><boxGeometry args={[1.1, 0.5, 0.06]} /><M c="#b07a43" /></mesh>
    <mesh position={[0, 2.8, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.95, 0.5, 4]} /><M c="#5b3a1e" /></mesh>
    {[0.25, 0.55, 0.85, 1.15, 1.45, 1.75].map((y, i) => <mesh key={i} position={[0.55, y, 0.45]}><boxGeometry args={[0.3, 0.04, 0.04]} /><M c="#c9a06a" /></mesh>)}
    <mesh position={[0.5, 2.1, 0.0]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color="#ffe08a" emissive="#ffd23f" emissiveIntensity={1} /></mesh>
  </G>
);
export const DeadTree: React.FC<P> = (p) => (
  <G {...p}>
    <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.09, 0.2, 1.8, 10]} /><M c="#4a3a2e" /></mesh>
    {[[0.35, 1.5, 0.9], [-0.4, 1.3, -0.8], [0.25, 1.9, 0.5], [-0.2, 2.0, -0.4]].map((b, i) => (
      <mesh key={i} position={[b[0] * 0.6, b[1], 0]} rotation={[0, 0, -b[2]]}><cylinderGeometry args={[0.03, 0.06, 0.8, 8]} /><M c="#4a3a2e" /></mesh>
    ))}
    {[[0.62, 1.8], [-0.62, 1.6]].map((t, i) => <mesh key={i} position={[t[0], t[1], 0]} rotation={[0, 0, i ? 0.7 : -0.7]}><cylinderGeometry args={[0.015, 0.03, 0.4, 6]} /><M c="#4a3a2e" /></mesh>)}
    <mesh position={[0.15, 0.02, 0.3]} scale={[1, 0.3, 1]}><sphereGeometry args={[0.2, 10, 8]} /><M c="#6b7a3a" /></mesh>
  </G>
);
