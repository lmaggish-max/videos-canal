import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {Hero, LOOKS, HeroPose, Look} from './Hero';
import TIME from './rtime.json';
import WORDS_R from './rwords.json';

type V3 = [number, number, number];
const S = TIME.sents as {i: number; start: number; end: number}[];
const st = (i: number) => S[i].start, en = (i: number) => S[i].end;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = Easing.inOut(Easing.cubic);
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
const rand = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const PIERZ = [0.8, -2.8];
const SEGZ = [2.6, 0.8, -1.0, -2.8, -4.6];
const ARCH = [0, 0.9, 2.0, 0.9, 0];
const DECK_Y = 1.15;
const HEROLOOK: Look = {...LOOKS.garoto, helmet: '#f5c518', hairStyle: 'short'} as Look;
const archY = (z: number) => {
  if (z >= SEGZ[0] || z <= SEGZ[4]) return 0;
  for (let k = 0; k < 4; k++) if (z <= SEGZ[k] && z >= SEGZ[k + 1]) return lerp(ARCH[k], ARCH[k + 1], (SEGZ[k] - z) / (SEGZ[k] - SEGZ[k + 1]));
  return 0;
};

type KF = {t: number; p: V3; g: V3};
const BASE = {p: [0, 12, 10.5] as V3, g: [0, 0.3, -1.5] as V3};
const CAMK: KF[] = [
  {t: 0, p: [0, 17, 15], g: [0, 0, -1]},
  {t: en(0), ...BASE}, {t: st(2), ...BASE},
  {t: st(2) + 1, p: [1.2, 10.2, 8.6], g: [0, -0.8, -1.3]}, {t: en(2), p: [1.2, 10.2, 8.6], g: [0, -0.8, -1.3]},
  {t: st(3) + 0.3, p: [-5.5, 7.5, 9], g: [-0.5, 1.2, -1.2]}, {t: en(3), p: [-5.5, 7.5, 9], g: [-0.5, 1.2, -1.2]},
  {t: st(4) + 0.8, p: [-7.5, 5.5, 5.5], g: [0, 2.2, -1.5]}, {t: en(4), p: [-7.5, 5.5, 5.5], g: [0, 2.2, -1.5]},
  {t: st(5) + 0.3, p: [0, 15, 13.5], g: [0, 0, -2.5]},
  {t: st(6) + 0.5, p: [4.2, 11, 11], g: [0, 1, -1.5]}, {t: st(7), p: [4.2, 11, 11], g: [0, 1, -1.5]},
  {t: st(7) + 2, p: [0, 9.5, 11.5], g: [0, 1.4, -2]}, {t: TIME.total, p: [2.6, 8.8, 11], g: [0, 1.4, -2]},
];
const camAt = (t: number) => {
  let i = 0; for (let k = 0; k < CAMK.length; k++) if (CAMK[k].t <= t) i = k;
  const a = CAMK[i], b = CAMK[i + 1]; if (!b) return a;
  const u = ease(prog(t, a.t, b.t));
  return {p: [0, 1, 2].map((j) => lerp(a.p[j], b.p[j], u)) as V3, g: [0, 1, 2].map((j) => lerp(a.g[j], b.g[j], u)) as V3};
};
const Cam: React.FC<{t: number; f: number}> = ({t, f}) => {
  const {camera} = useThree(); const c = camAt(t);
  camera.position.set(c.p[0] + Math.sin(f * 0.01) * 0.2, c.p[1], c.p[2]); camera.lookAt(c.g[0], c.g[1], c.g[2]);
  return null;
};
const Beam: React.FC<{a: V3; b: V3; r?: number; color: string}> = ({a, b, r = 0.08, color}) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va); const L = Math.max(0.001, dir.length());
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return <mesh position={mid.toArray() as V3} quaternion={q}><boxGeometry args={[r * 2, L, r * 2]} /><meshStandardMaterial color={color} /></mesh>;
};

const bargeX = (t: number) => lerp(14, 1.6, ease(prog(t, st(6), st(6) + 1.4)));
const TC0 = () => st(6) + 1.3, TC1 = () => st(7) + 2.2;
const stackPos = (k: number, t: number): V3 => [bargeX(t) - 0.2, 0.62 + (4 - k) * 0.32, 2.2];
const targetPos = (k: number): V3 => [0, DECK_Y + ARCH[k], SEGZ[k]];
const segPos = (k: number, t: number): V3 => {
  const d = (TC1() - TC0()) / 5; const u = (t - (TC0() + k * d)) / d;
  const A = stackPos(k, t), T = targetPos(k), H = 5.2 + ARCH[k];
  if (u <= 0) return A; if (u >= 1) return T;
  if (u < 0.25) return [A[0], lerp(A[1], H, ease(u / 0.25)), A[2]];
  if (u < 0.65) { const e = ease((u - 0.25) / 0.4); return [lerp(A[0], T[0], e), H, lerp(A[2], T[2], e)]; }
  if (u < 0.9) return [T[0], lerp(H, T[1], ease((u - 0.65) / 0.25)), T[2]];
  return T;
};
const CB: V3 = [2.7, 1.0, 4.2], P0: V3 = [2.7, 6.0, 4.2];
const Crane: React.FC<{t: number}> = ({t}) => {
  const d = (TC1() - TC0()) / 5; const kAct = clamp(Math.floor((t - TC0()) / d), 0, 4);
  const sp = t < TC0() ? ([stackPos(0, t)[0], stackPos(0, t)[1] + 2.6, stackPos(0, t)[2]] as V3) : segPos(kAct, t);
  const tip: V3 = [sp[0], sp[1] + 1.5, sp[2]];
  return (
    <group>
      <mesh position={[CB[0], CB[1] + 0.3, CB[2]]}><boxGeometry args={[1.5, 0.6, 2.2]} /><meshStandardMaterial color="#f5b700" /></mesh>
      <mesh position={[CB[0], CB[1] + 0.05, CB[2]]}><boxGeometry args={[1.7, 0.2, 2.4]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh position={[CB[0] - 0.1, CB[1] + 0.95, CB[2] + 0.5]}><boxGeometry args={[0.9, 0.7, 0.8]} /><meshStandardMaterial color="#f5b700" /></mesh>
      <Beam a={[CB[0], CB[1] + 0.5, CB[2]]} b={P0} r={0.2} color="#f5b700" />
      <Beam a={P0} b={tip} r={0.1} color="#f5b700" />
      <Beam a={tip} b={[sp[0], sp[1] + 0.2, sp[2]]} r={0.025} color="#222" />
    </group>
  );
};

export const RioNiteroi: React.FC = () => {
  const f = useCurrentFrame(); const t = f / 30;
  const {fps, width, height} = useVideoConfig();
  let si = 0; S.forEach((s, i) => { if (t >= s.start) si = i; });
  const pose = (['wave', 'scared', 'point', 'scared', 'point', 'scared', 'point', 'wave', 'wave'] as HeroPose[])[si];

  const bp = prog(t, st(1) + 0.3, en(1) + 0.4);
  const blockY = bp < 0.35 ? lerp(2.4, -0.7, ease(bp / 0.35)) : lerp(-0.7, -2.0, (bp - 0.35) / 0.65);
  const showBlock = t >= st(1) && t < st(2) + 0.1;
  const pp = prog(t, st(2) + 0.1, en(2) - 0.6);
  const N = 12, s = pp * N, k = Math.floor(s), fr = s - k;
  const stepp = Math.min(1, (k + ease(clamp(fr / 0.5, 0, 1))) / N);
  const pileTop = lerp(3.4, -0.35, pp >= 1 ? 1 : stepp);
  const showPiles = t >= st(2) - 0.1 && t < en(2) + 1.2;
  const hammerY = pileTop + 0.75 + Math.abs(Math.sin(f * 0.45)) * 0.3;
  const showHammer = t >= st(2) && t < en(2) - 0.5;
  const pierGrow = ease(prog(t, en(2) - 0.8, en(2) + 1.0));
  const archU = ease(prog(t, st(4) + 0.2, st(4) + 1.6));
  const pierH = (zi: number) => (2.2 + (zi === 0 ? ARCH[1] : ARCH[3]) * archU) * pierGrow;
  const ghost = t >= st(3) - 0.2 && t < TC0() - 0.1;
  const shipX = t < st(3) ? -10 : t < st(4) + 1.4 ? lerp(-10, -2.7, ease(prog(t, st(3), st(3) + 1.8))) : lerp(-2.7, 10, ease(prog(t, st(4) + 1.4, en(4) + 1.4)));
  const blocked = t > st(3) + 1.6 && t < st(4) + 1.4;

  let wi = -1; (WORDS_R as [string, number, number][]).forEach((w, i) => { if (f >= w[1]) wi = i; });
  const cur = wi >= 0 ? (WORDS_R as [string, number, number][])[wi] : null;
  const showWord = !!cur && f <= cur[2] + 5;
  const word = cur ? cur[0].replace(/[,:]$/, '').toUpperCase() : '';
  const key = cur ? cur[0].replace(/[^\wÀ-ÿ]/g, '').toLowerCase() : '';
  const wColor = ['mole', 'funda', 'demais', 'pesam'].includes(key) ? '#ff5a5a' : ['parabéns', 'construiu', 'central'].includes(key) ? '#4dff88' : undefined;
  const pop = spring({frame: f - (cur ? cur[1] : 0), fps, config: {damping: 12, stiffness: 180}});
  const wScale = interpolate(pop, [0, 1], [0.6, 1]);
  const BAN = ['', 'FUNDO MOLE', 'PILARES ATÉ O CHÃO FIRME', 'NAVIOS GIGANTES NÃO PASSAM', 'VÃO CENTRAL: 300 m • 72 m DE ALTURA', '13 KM: OBRA GRANDE DEMAIS', 'PEÇAS PRONTAS + BALSAS', 'PONTE RIO-NITERÓI!', 'INAUGURADA EM 1974'];
  const isProb = [1, 3, 5].includes(si);
  const showBan = BAN[si] !== '';
  const banPop = spring({frame: f - Math.round(st(si) * 30), fps, config: {damping: 12, stiffness: 160}});
  const info = prog(t, st(7) + 3.0, st(7) + 4.0);
  const segs = [0, 1, 2, 3, 4].map((kk) => segPos(kk, t));
  const asphalt = t >= st(7) + 1.0;
  const railP = prog(t, st(7) + 0.6, st(7) + 2.4);
  const cars = [{x: 0.55, dir: -1, t0: st(7) + 2.6, col: '#e63946'}, {x: -0.55, dir: 1, t0: st(7) + 3.4, col: '#2a9df4'}, {x: 0.55, dir: -1, t0: st(7) + 4.2, col: '#ffd23f'}];

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#6ec6ff, #e2f4ff)'}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 50, position: [0, 17, 15]}}>
        <Cam t={t} f={f} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[6, 12, 8]} intensity={1.7} />
        {[[-9, 'far'], [6.5, 'near']].map(([z, n]) => (
          <group key={n as string}>
            <mesh position={[0, -0.6, z as number]}><boxGeometry args={[40, 3.2, 8]} /><meshStandardMaterial color="#9c6b3c" /></mesh>
            <mesh position={[0, 0.97, z as number]}><boxGeometry args={[40, 0.08, 8]} /><meshStandardMaterial color="#5fb04a" /></mesh>
          </group>
        ))}
        <mesh position={[0, -1.7, -1]}><boxGeometry args={[40, 1.0, 8]} /><meshStandardMaterial color="#7a5a37" /></mesh>
        <mesh position={[0, -2.6, -1]}><boxGeometry args={[40, 0.8, 8]} /><meshStandardMaterial color="#8a8f98" /></mesh>
        <mesh position={[0, -0.6, -1]}><boxGeometry args={[40, 1.2, 8]} /><meshStandardMaterial color="#2ea0ff" transparent opacity={0.62} depthWrite={false} /></mesh>
        {Array.from({length: 14}).map((_, i) => <mesh key={i} position={[((rand(i) * 16 + t * (0.6 + rand(i + 5) * 0.8)) % 16) - 8, 0.02, -4.5 + rand(i + 9) * 7.2]}><boxGeometry args={[0.9, 0.02, 0.1]} /><meshBasicMaterial color="#fff" transparent opacity={0.6} /></mesh>)}

        {showBlock && <mesh position={[0, blockY, PIERZ[0]]} rotation={[0, 0, bp > 0.35 ? Math.sin(f * 0.35) * 0.1 * (bp - 0.35) : 0]}><boxGeometry args={[1.4, 1.0, 1.2]} /><meshStandardMaterial color="#9aa3ad" /></mesh>}
        {showPiles && PIERZ.map((pz) => [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]].map((o, i) => <mesh key={`${pz}${i}`} position={[o[0], pileTop - 1.7, pz + o[1]]}><cylinderGeometry args={[0.13, 0.13, 3.4, 12]} /><meshStandardMaterial color="#9aa3ad" metalness={0.4} roughness={0.4} /></mesh>))}
        {showHammer && PIERZ.map((pz) => <group key={pz} position={[0, hammerY, pz]}><mesh><boxGeometry args={[1.2, 0.5, 1.0]} /><meshStandardMaterial color="#333" /></mesh><mesh position={[0, 0.35, 0]}><boxGeometry args={[1.3, 0.2, 1.1]} /><meshStandardMaterial color="#f5b700" /></mesh></group>)}
        {PIERZ.map((pz, zi) => pierGrow > 0.01 && <mesh key={pz} position={[0, -1.2 + pierH(zi) / 2, pz]}><boxGeometry args={[2.0, Math.max(0.01, pierH(zi)), 1.4]} /><meshStandardMaterial color="#c4c9d1" /></mesh>)}

        {ghost && SEGZ.map((z, kk) => <mesh key={kk} position={[0, DECK_Y + ARCH[kk] * archU, z]}><boxGeometry args={[2.6, 0.3, 1.78]} /><meshStandardMaterial color="#8fd0ff" transparent opacity={0.45} /></mesh>)}

        <group position={[shipX, 0.25 + (blocked ? Math.sin(f * 1.2) * 0.04 : 0), -1.0]}>
          <mesh><boxGeometry args={[3.4, 0.6, 1.2]} /><meshStandardMaterial color="#374151" /></mesh>
          <mesh position={[-0.6, 0.65, 0]}><boxGeometry args={[1.0, 0.7, 0.9]} /><meshStandardMaterial color="#f1f1f1" /></mesh>
          <mesh position={[-0.6, 1.4, 0]}><boxGeometry args={[0.35, 0.8, 0.35]} /><meshStandardMaterial color="#e63946" /></mesh>
          <mesh position={[0.5, 0.65, 0]}><boxGeometry args={[0.5, 0.5, 0.9]} /><meshStandardMaterial color="#f5b700" /></mesh>
          <mesh position={[1.1, 0.65, 0]}><boxGeometry args={[0.5, 0.5, 0.9]} /><meshStandardMaterial color="#2a9df4" /></mesh>
        </group>
        {blocked && <mesh position={[-2.0, 3.6 + Math.abs(Math.sin(f * 0.25)) * 0.3, -1.0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.3, 0.7, 12]} /><meshStandardMaterial color="#ff2a2a" emissive="#ff0000" emissiveIntensity={0.7} /></mesh>}

        {t >= st(6) - 0.1 && <mesh position={[bargeX(t) - 0.2, 0.2, 2.2]}><boxGeometry args={[3.4, 0.4, 2.4]} /><meshStandardMaterial color="#c2410c" /></mesh>}

        {t >= TC0() - 0.1 && segs.map((p, i) => (
          <group key={i} position={p}>
            <mesh><boxGeometry args={[2.6, 0.3, 1.78]} /><meshStandardMaterial color={asphalt ? '#3a3d44' : '#b8bec7'} /></mesh>
            {asphalt && <mesh position={[0, 0.16, 0]}><boxGeometry args={[0.1, 0.01, 0.8]} /><meshBasicMaterial color="#fff" /></mesh>}
          </group>
        ))}
        {railP > 0 && [-1, 1].map((sx) => Array.from({length: 11}).map((_, i) => { const z = 3.4 - i * 0.9; return railP > i / 11 && <mesh key={`${sx}${i}`} position={[sx * 1.22, DECK_Y + archY(z) + 0.35, z]}><boxGeometry args={[0.07, 0.4, 0.07]} /><meshStandardMaterial color="#f1f1f1" /></mesh>; }))}
        <Crane t={t} />
        {cars.map((c, i) => { const u = prog(t, c.t0, c.t0 + 5); if (t < c.t0 || u >= 1) return null; const z = c.dir < 0 ? lerp(7, -10, u) : lerp(-10, 7, u);
          return (<group key={i} position={[c.x, DECK_Y + 0.4 + archY(z), z]} rotation={[0, c.dir < 0 ? Math.PI : 0, 0]}><mesh><boxGeometry args={[0.7, 0.3, 1.3]} /><meshStandardMaterial color={c.col} /></mesh><mesh position={[0, 0.25, -0.1]}><boxGeometry args={[0.6, 0.25, 0.65]} /><meshStandardMaterial color="#cfe9ff" /></mesh></group>); })}
        {t >= st(7) && Array.from({length: 36}).map((_, i) => { const t0 = st(7) + rand(i + 30) * 1.0; const y = 9 - (t - t0) * 3.4; if (t < t0 || y < 1.4) return null; return <mesh key={i} position={[(rand(i + 1) - 0.5) * 6.5, y, (rand(i + 2) - 0.5) * 6 - 1.5]} rotation={[t * 3 + i, t * 2, i]}><boxGeometry args={[0.16, 0.02, 0.1]} /><meshBasicMaterial color={['#ff4d6d', '#ffd23f', '#4dff88', '#4da6ff', '#c77dff'][i % 5]} /></mesh>; })}

        <Hero frame={f} pose={pose} look={HEROLOOK} position={[-2.5, 1.0, 3.4]} rotY={0.5} scale={1.2} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)'}} />
      {showBan && (
        <div style={{position: 'absolute', top: 130, width: '100%', display: 'flex', justifyContent: 'center'}}>
          <div style={{transform: `scale(${0.7 + banPop * 0.3})`, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 46, color: '#fff', background: isProb ? '#b91c1c' : '#15803d', border: '6px solid #fff', borderRadius: 20, padding: '8px 30px', textAlign: 'center', maxWidth: 980}}>{BAN[si]}</div>
        </div>
      )}
      {info > 0 && (
        <div style={{position: 'absolute', top: 400, left: 60, right: 60, transform: `scale(${0.8 + 0.2 * info})`, opacity: info, background: '#0b1b3aee', border: '6px solid #fff', borderRadius: 28, padding: '26px 34px', fontFamily: 'Poppins, sans-serif', color: '#fff'}}>
          <div style={{fontWeight: 700, fontSize: 46, textAlign: 'center', color: '#ffd23f'}}>PONTE RIO–NITERÓI</div>
          <div style={{marginTop: 18, fontSize: 38, fontWeight: 600}}>Comprimento: 13,29 km</div>
          <div style={{fontSize: 38, fontWeight: 600}}>Sobre a água: 8,83 km</div>
          <div style={{fontSize: 38, fontWeight: 600}}>Vão central: 300 m, a 72 m de altura</div>
          <div style={{fontSize: 38, fontWeight: 600}}>Inaugurada em 1974</div>
        </div>
      )}
      {showWord && (
        <div style={{position: 'absolute', bottom: 250, width: '100%', textAlign: 'center'}}>
          <span style={{display: 'inline-block', transform: `scale(${wScale})`, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: word.length > 9 ? 105 : 135, color: wColor ?? '#fff', textShadow: '0 8px 0 #000, 6px 0 0 #000, -6px 0 0 #000, 0 -6px 0 #000'}}>{word}</span>
        </div>
      )}
    </AbsoluteFill>
  );
};
