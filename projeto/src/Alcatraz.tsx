import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Easing, interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {Hero, LOOKS, HeroPose, Look} from './Hero';
import TIME from './atime.json';
import WORDS_A from './awords.json';

type V3 = [number, number, number];
const S = TIME.sents as {i: number; start: number; end: number}[];
const st = (i: number) => S[i].start, en = (i: number) => S[i].end;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = Easing.inOut(Easing.cubic);
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
const rand = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const UNI = {shirt: '#f1f1f1', shorts: '#f1f1f1'};
const PL: Look[] = [
  {...LOOKS.garoto, ...UNI} as Look,
  {...LOOKS.nerd, ...UNI, backpack: undefined} as Look,
  {...LOOKS.soldado, ...UNI, helmet: undefined, hairStyle: 'short'} as Look,
];
const GUARD: Look = {...LOOKS.soldado, helmet: undefined, cap: '#1e3a8a', shirt: '#1e3a8a', shorts: '#1e3a8a', hairStyle: 'short'} as Look;
const CX = [-4.7, -1.3, 2.5];
const DUCT_X = -1.3;
const ROOF = 7.0;
const RAFT0: V3 = [13, 0.2, 1];

// ---------- câmera ----------
type KF = {t: number; p: V3; g: V3};
const CAMK: KF[] = [
  {t: 0, p: [0, 15, 24], g: [0, 2.5, 0]},
  {t: en(0), p: [0, 13, 21], g: [0, 2.5, 0]},
  {t: st(1) + 0.8, p: [-1.2, 4.4, 14], g: [-1.2, 2.2, -1]},
  {t: en(2), p: [-1.2, 4.4, 14], g: [-1.2, 2.2, -1]},
  {t: st(3), p: [-1.3, 3.5, 11], g: [-1.3, 2, -4]},
  {t: en(3), p: [-1.3, 9.5, 11], g: [-1.3, 7.5, -4]},
  {t: st(4), p: [1.5, 9.5, 14], g: [2.5, 6.8, -2]},
  {t: en(4), p: [3, 9.8, 14], g: [4, 6.8, -2]},
  {t: st(5), p: [13, 3.6, 12], g: [12.6, 0.6, 0.5]},
  {t: en(5), p: [13, 3.6, 12], g: [12.6, 0.6, 0.5]},
  {t: st(6) + 0.3, p: [11, 8, 18], g: [12.5, 0, -6]},
  {t: en(6), p: [9, 13, 26], g: [12, 0, -12]},
  {t: st(7), p: [8, 14, 28], g: [12, 0, -12]},
  {t: TIME.total, p: [8, 15, 30], g: [12, 0, -14]},
];
const camAt = (t: number) => {
  let i = 0; for (let k = 0; k < CAMK.length; k++) if (CAMK[k].t <= t) i = k;
  const a = CAMK[i], b = CAMK[i + 1]; if (!b) return a;
  const cut = (i === 7 && true) || (i === 9 && false);
  const u = ease(prog(t, a.t, b.t));
  return {p: [0, 1, 2].map((j) => lerp(a.p[j], b.p[j], u)) as V3, g: [0, 1, 2].map((j) => lerp(a.g[j], b.g[j], u)) as V3};
};
const Cam: React.FC<{t: number; f: number}> = ({t, f}) => {
  const {camera} = useThree(); const c = camAt(t);
  camera.position.set(c.p[0] + Math.sin(f * 0.01) * 0.2, c.p[1], c.p[2]);
  camera.lookAt(c.g[0], c.g[1], c.g[2]);
  return null;
};

// ---------- prisioneiros ----------
const prisoner = (i: number, t: number): {p: V3; rot: number; pose: HeroPose} => {
  const off = (i - 1) * 0.55;
  const PI = Math.PI;
  if (t < st(1)) return {p: [CX[i], 1.0, -1.5], rot: 0.2, pose: 'idle'};
  if (t < st(2)) return {p: [CX[i], 1.0, -2.4], rot: PI, pose: 'point'};
  if (t < st(2) + 0.9) return {p: [CX[i], 1.0, lerp(-2.4, -1.4, prog(t, st(2), st(2) + 0.5))], rot: 0, pose: 'walk'};
  if (t < st(2) + 1.6) return {p: [CX[i], 1.0, lerp(-1.4, -4.2, prog(t, st(2) + 0.9, st(2) + 1.6))], rot: PI, pose: 'walk'};
  if (t < st(3)) { const u = ease(prog(t, st(2) + 1.6, st(3) - 0.1)); return {p: [lerp(CX[i], DUCT_X + off, u), 1.0, -4.2], rot: DUCT_X + off > CX[i] ? PI / 2 : -PI / 2, pose: 'walk'}; }
  if (t < st(3) + 0.4) return {p: [DUCT_X + off, 1.0, -4.3], rot: 0, pose: 'idle'};
  if (t < en(3) - 0.2) { const u = ease(prog(t, st(3) + 0.4, en(3) - 0.2)); return {p: [DUCT_X + off * 0.6, lerp(1.0, ROOF, u), -4.3], rot: 0, pose: 'walk'}; }
  if (t < st(4)) return {p: [DUCT_X + off * 0.6, ROOF, -4.3], rot: 0, pose: 'idle'};
  if (t < st(4) + 2.2) { const u = ease(prog(t, st(4), st(4) + 2.2)); return {p: [lerp(DUCT_X + off * 0.6, 5.0 + off, u), ROOF, lerp(-4.3, -1.5, u)], rot: PI / 2, pose: 'walk'}; }
  if (t < st(5)) return {p: [5.0 + off, ROOF, -1.5], rot: PI / 2, pose: 'scared'};
  const rt = raft(t);
  return {p: [rt.p[0] + (i - 1) * 0.65, rt.p[1] + 0.35, rt.p[2] + (i === 1 ? 0 : 0.1)], rot: PI * 0.5, pose: t > st(5) + 1.4 ? 'walk' : 'idle'};
};
const raft = (t: number): {p: V3; s: number} => {
  const s = ease(prog(t, st(5), st(5) + 0.8));
  const u = ease(prog(t, st(5) + 1.4, en(6) + 1.0));
  return {p: [RAFT0[0] + 6 * u + Math.sin(t * 1.3) * 0.15, RAFT0[1] + Math.sin(t * 2.1) * 0.06, RAFT0[2] - 26 * u], s};
};

const Beam: React.FC<{a: V3; b: V3; r?: number; color: string}> = ({a, b, r = 0.05, color}) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va); const L = Math.max(0.001, dir.length());
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return <mesh position={mid.toArray() as V3} quaternion={q}><boxGeometry args={[r * 2, L, r * 2]} /><meshStandardMaterial color={color} /></mesh>;
};

export const Alcatraz: React.FC = () => {
  const f = useCurrentFrame(); const t = f / 30;
  const {fps, width, height} = useVideoConfig();
  let si = 0; S.forEach((s, i) => { if (t >= s.start) si = i; });
  const night = ease(prog(t, st(3) - 0.2, st(3) + 0.8));
  const water = interpolateColors(night, [0, 1], ['#2e7fb8', '#10304f']);
  const bg1 = interpolateColors(night, [0, 1], ['#8fd0ff', '#050b1c']), bg2 = interpolateColors(night, [0, 1], ['#e6f5ff', '#16294f']);
  const hole = ease(prog(t, st(1) + 0.3, en(1)));
  const month = 1 + Math.floor(prog(t, st(1), en(1)) * 5.99);
  const dummies = [0, 1, 2].map((i) => ease(prog(t, st(2) + 0.3 + i * 0.35, st(2) + 0.7 + i * 0.35)));
  const guardX = lerp(6.2, -6.2, prog(t, st(2) + 0.2, en(2) + 0.4));
  const showGuard = t >= st(2) && t < st(3);
  const rt = raft(t);
  const beamYaw = Math.sin(t * 0.9) * 0.8 + 0.3;

  // legenda
  let wi = -1; (WORDS_A as [string, number, number][]).forEach((w, i) => { if (f >= w[1]) wi = i; });
  const cur = wi >= 0 ? (WORDS_A as [string, number, number][])[wi] : null;
  const showWord = !!cur && f <= cur[2] + 5;
  const word = cur ? cur[0].replace(/[,:]$/, '').toUpperCase() : '';
  const key = cur ? cur[0].replace(/[^\wÀ-ÿ]/g, '').toLowerCase() : '';
  const wColor = ['alcatraz', 'escapava', 'ninguém'].includes(key) ? '#ffd23f' : ['gelada', 'correnteza'].includes(key) ? '#7cd0ff' : undefined;
  const pop = spring({frame: f - (cur ? cur[1] : 0), fps, config: {damping: 12, stiffness: 180}});
  const wScale = interpolate(pop, [0, 1], [0.6, 1]);
  const BAN = ['ALCATRAZ • 1962', 'MESES RASPANDO A PAREDE', 'BONECOS NAS CAMAS', 'A NOITE DA FUGA', 'BAÍA GELADA', 'BOTE DE CAPAS DE CHUVA', 'NINGUÉM SABE...', 'VOCÊ TERIA TENTADO?'];
  const banPop = spring({frame: f - Math.round(st(si) * 30), fps, config: {damping: 12, stiffness: 160}});
  const fog = ease(prog(t, st(6) + 0.2, en(6) + 0.6)) * 0.75;

  const bars = (cx: number, y0: number) => Array.from({length: 11}).map((_, k) => <mesh key={k} position={[cx - 1.6 + k * 0.32, y0 + 1.25, 0]}><boxGeometry args={[0.06, 2.5, 0.06]} /><meshStandardMaterial color="#3a3f47" /></mesh>);

  return (
    <AbsoluteFill style={{background: `linear-gradient(${bg1}, ${bg2})`}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 50, position: [0, 15, 24]}}>
        <Cam t={t} f={f} />
        <ambientLight intensity={interpolate(night, [0, 1], [1.5, 0.6])} color={night > 0.5 ? '#9fb4ff' : '#ffffff'} />
        <directionalLight position={[6, 12, 10]} intensity={interpolate(night, [0, 1], [1.6, 0.45])} />
        {night > 0 && <pointLight position={[-1, 3, 4]} intensity={night * 60} distance={18} decay={2} color="#ffd9a0" />}

        {/* mar, ilha, cidade ao fundo */}
        <mesh position={[0, -0.2, 0]}><boxGeometry args={[240, 0.4, 240]} /><meshStandardMaterial color={water} /></mesh>
        {Array.from({length: 30}).map((_, i) => <mesh key={i} position={[((rand(i) * 30 + t * (0.4 + rand(i + 4) * 0.5)) % 40) - 14, 0.02, -12 + rand(i + 9) * 40]}><boxGeometry args={[1.2, 0.02, 0.12]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.45 - night * 0.3} /></mesh>)}
        <mesh position={[0, 0.4, -0.5]}><boxGeometry args={[22, 1.2, 16]} /><meshStandardMaterial color="#8a8f98" /></mesh>
        <mesh position={[0, 1.0, -0.5]}><boxGeometry args={[21.4, 0.06, 15.4]} /><meshStandardMaterial color="#7aa35a" /></mesh>
        {Array.from({length: 14}).map((_, i) => <mesh key={i} position={[-30 + i * 5 + rand(i) * 2, 3 + rand(i + 3) * 4, -75]}><boxGeometry args={[3, 6 + rand(i + 3) * 8, 3]} /><meshStandardMaterial color={interpolateColors(night, [0, 1], ['#7a8696', '#18233d'])} emissive={night > 0.5 ? '#ffb347' : '#000'} emissiveIntensity={night * 0.15} /></mesh>)}

        {/* prédio em corte */}
        <mesh position={[0, 1.0, -1]}><boxGeometry args={[13.4, 0.3, 9.6]} /><meshStandardMaterial color="#9a958a" /></mesh>
        <mesh position={[0, 4.0, -1]}><boxGeometry args={[13.4, 0.3, 9.6]} /><meshStandardMaterial color="#9a958a" /></mesh>
        <mesh position={[0, ROOF - 0.15, -1]}><boxGeometry args={[13.6, 0.3, 9.8]} /><meshStandardMaterial color="#6f737c" /></mesh>
        <mesh position={[0, 4.0, -5.5]}><boxGeometry args={[13.4, 6.0, 0.3]} /><meshStandardMaterial color="#c9c4b8" /></mesh>
        {[-6.6, 6.6].map((x) => <mesh key={x} position={[x, 4.0, -1]}><boxGeometry args={[0.3, 6.0, 9.6]} /><meshStandardMaterial color="#b9b4a8" /></mesh>)}
        {/* paredes entre celas e fundo das celas (z=-3) */}
        <mesh position={[0, 2.5, -3]}><boxGeometry args={[13, 3.0, 0.25]} /><meshStandardMaterial color="#d9d4c7" /></mesh>
        {[-2.9, 0.7, 4.3].map((x) => <mesh key={x} position={[x, 2.5, -1.5]}><boxGeometry args={[0.2, 3.0, 3.0]} /><meshStandardMaterial color="#d9d4c7" /></mesh>)}
        {CX.map((cx, i) => (
          <group key={i}>
            <group position={[0, 0, 0]}>{bars(cx, 1.15)}</group>
            <mesh position={[cx + 0.3, 1.55, -1.7]}><boxGeometry args={[2.4, 0.35, 1.0]} /><meshStandardMaterial color="#5b6b82" /></mesh>
            {hole > 0 && <mesh position={[cx, 2.0, -2.86]}><boxGeometry args={[0.9 * hole, 1.0 * hole, 0.3]} /><meshStandardMaterial color="#0d0d0d" /></mesh>}
            {dummies[i] > 0 && (
              <group position={[cx + 0.9, 1.78, -1.7]} scale={dummies[i]}>
                <mesh><sphereGeometry args={[0.28, 12, 12]} /><meshStandardMaterial color="#e8c9a0" /></mesh>
                <mesh position={[-0.55, -0.05, 0]}><boxGeometry args={[0.9, 0.3, 0.7]} /><meshStandardMaterial color="#8a8f98" /></mesh>
              </group>
            )}
          </group>
        ))}
        {/* segundo andar: grades */}
        {CX.map((cx, i) => <group key={i} position={[0, 3.0, 0]}>{bars(cx, 1.15)}</group>)}
        {/* corredor técnico atrás e duto */}
        <mesh position={[0, 2.5, -4.9]}><boxGeometry args={[13, 3.0, 0.15]} /><meshStandardMaterial color="#26282d" /></mesh>
        <mesh position={[DUCT_X, 4.0, -5.0]}><boxGeometry args={[1.5, 6.0, 0.15]} /><meshStandardMaterial color="#111" /></mesh>
        {[-0.8, 0.8].map((dx) => <mesh key={dx} position={[DUCT_X + dx, 4.0, -4.6]}><boxGeometry args={[0.1, 6.0, 0.5]} /><meshStandardMaterial color="#555b66" /></mesh>)}
        <mesh position={[DUCT_X, ROOF + 0.35, -4.4]}><boxGeometry args={[1.5, 0.7, 1.2]} /><meshStandardMaterial color="#7a7f88" /></mesh>

        {/* torre com holofote */}
        <group position={[8.8, 1.0, 5]}>
          {[[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].map((l, i) => <mesh key={i} position={[l[0], 2.5, l[1]]}><boxGeometry args={[0.1, 5, 0.1]} /><meshStandardMaterial color="#4b4f58" /></mesh>)}
          <mesh position={[0, 5.2, 0]}><boxGeometry args={[1.4, 0.8, 1.4]} /><meshStandardMaterial color="#5a5f69" /></mesh>
          {night > 0.3 && (
            <group position={[0, 5.2, 0]} rotation={[0.38, beamYaw + 2.6, 0]}>
              <mesh position={[0, 0, 8]} rotation={[-Math.PI / 2, 0, 0]}><coneGeometry args={[3.4, 16, 20, 1, true]} /><meshBasicMaterial color="#fff3a0" transparent opacity={0.2 * night} side={2} depthWrite={false} /></mesh>
            </group>
          )}
        </group>

        {/* guarda */}
        {showGuard && <Hero frame={f} pose="walk" look={GUARD} position={[guardX, 1.0, 1.8]} rotY={-Math.PI / 2} scale={0.9} />}

        {/* presos */}
        {PL.map((lk, i) => { const pr = prisoner(i, t); return <Hero key={i} frame={f + i * 5} pose={pr.pose} look={lk} position={pr.p} rotY={pr.rot} scale={0.85} />; })}

        {/* bote */}
        {t >= st(5) && (
          <group position={rt.p} scale={rt.s}>
            <mesh><boxGeometry args={[2.6, 0.35, 1.4]} /><meshStandardMaterial color="#ff8a1f" /></mesh>
            {[-1.3, 1.3].map((x) => <mesh key={x} position={[x, 0.05, 0]}><sphereGeometry args={[0.4, 12, 12]} /><meshStandardMaterial color="#ff8a1f" /></mesh>)}
            <mesh position={[0, 0.18, 0]}><boxGeometry args={[2.4, 0.05, 1.2]} /><meshStandardMaterial color="#ffb25a" /></mesh>
          </group>
        )}
      </ThreeCanvas>

      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
      <AbsoluteFill style={{background: `rgba(235,245,255,${fog})`}} />
      <div style={{position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <div style={{transform: `scale(${0.7 + banPop * 0.3})`, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 52, color: '#fff', background: si === 0 ? '#1a1a2e' : night > 0.5 ? '#111827' : '#334155', border: '6px solid #fff', borderRadius: 20, padding: '10px 30px', textAlign: 'center', maxWidth: 980}}>{BAN[si]}</div>
      </div>
      {si === 1 && (
        <div style={{position: 'absolute', top: 310, width: '100%', textAlign: 'center', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 60, color: '#ffd23f', textShadow: '0 4px 0 #000'}}>MÊS {month}</div>
      )}
      {si === 7 && (
        <div style={{position: 'absolute', top: 560, width: '100%', textAlign: 'center', fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 320, color: '#fff', opacity: 0.9, textShadow: '0 10px 0 #000'}}>?</div>
      )}
      {showWord && (
        <div style={{position: 'absolute', bottom: 250, width: '100%', textAlign: 'center'}}>
          <span style={{display: 'inline-block', transform: `scale(${wScale})`, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: word.length > 9 ? 105 : 135, color: wColor ?? '#fff', textShadow: '0 8px 0 #000, 6px 0 0 #000, -6px 0 0 #000, 0 -6px 0 #000'}}>{word}</span>
        </div>
      )}
    </AbsoluteFill>
  );
};
