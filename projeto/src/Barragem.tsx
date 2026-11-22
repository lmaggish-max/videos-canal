import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {Hero, LOOKS, HeroPose, Look} from './Hero';
import TIME from './btime.json';
import WORDS_B from './bwords.json';

type V3 = [number, number, number];
const S = TIME.sents as {i: number; start: number; end: number}[];
const st = (i: number) => S[i].start, en = (i: number) => S[i].end;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = Easing.inOut(Easing.cubic);
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
const rand = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const SEGZ = [2.6, 0.8, -1.0, -2.8, -4.6];
const JOINTZ = [1.7, -0.1, -1.9, -3.7];
const WALL_H = 3.8, BED = -1.2;
const HEROLOOK: Look = {...LOOKS.garoto, helmet: '#f5c518', hairStyle: 'short'} as Look;
const STAMPS: [number, string][] = [[st(5) + 0.5, 'p'], [st(6) + 0.2, 's']];

type KF = {t: number; p: V3; g: V3};
const BASE = {p: [0, 12, 10.5] as V3, g: [0, 0.3, -1.5] as V3};
const CAMK: KF[] = [
  {t: 0, p: [0, 17, 15], g: [0, 0, -1]},
  {t: en(0), ...BASE}, {t: en(1), ...BASE},
  {t: st(2) + 0.8, p: [1.5, 11.5, 10], g: [0, 1, -1.5]}, {t: en(2), p: [1.5, 11.5, 10], g: [0, 1, -1.5]},
  {t: en(3), p: [-1.0, 10.8, 9.2], g: [0.3, 0.8, -1.5]},
  {t: st(4) + 0.6, p: [2.8, 9.2, 6.8], g: [0.8, 0.2, -1.6]}, {t: en(6), p: [3.2, 9.4, 6.4], g: [0.8, 0.2, -1.8]},
  {t: en(6) + 1.0, p: [-1.5, 10.5, 10.5], g: [0, 1, -1.5]}, {t: st(8), p: [-1.5, 10.5, 10.5], g: [0, 1, -1.5]},
  {t: en(8), p: [3.5, 9.2, 9.5], g: [1, 0.5, -1.5]},
  {t: st(9), p: [0, 10, 12], g: [0, 1, -1.5]}, {t: TIME.total, p: [-2, 9, 11.5], g: [0, 1, -1.5]},
];
const camAt = (t: number) => {
  let i = 0; for (let k = 0; k < CAMK.length; k++) if (CAMK[k].t <= t) i = k;
  const a = CAMK[i], b = CAMK[i + 1]; if (!b) return a;
  const u = ease(prog(t, a.t, b.t));
  return {p: [0, 1, 2].map((j) => lerp(a.p[j], b.p[j], u)) as V3, g: [0, 1, 2].map((j) => lerp(a.g[j], b.g[j], u)) as V3};
};
const Cam: React.FC<{t: number; f: number}> = ({t, f}) => {
  const {camera} = useThree(); const c = camAt(t);
  let sh = 0; STAMPS.forEach(([ts]) => { const d = t - ts; if (d >= 0 && d < 0.4) sh = Math.max(sh, 0.18 * (1 - d / 0.4)); });
  camera.position.set(c.p[0] + Math.sin(f * 0.01) * 0.2 + Math.sin(f * 3.7) * sh, c.p[1] + Math.cos(f * 4.3) * sh, c.p[2]);
  camera.lookAt(c.g[0], c.g[1], c.g[2]);
  return null;
};
const Beam: React.FC<{a: V3; b: V3; r?: number; color: string}> = ({a, b, r = 0.08, color}) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va); const L = Math.max(0.001, dir.length());
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return <mesh position={mid.toArray() as V3} quaternion={q}><boxGeometry args={[r * 2, L, r * 2]} /><meshStandardMaterial color={color} /></mesh>;
};
const CB: V3 = [2.7, 1.0, 4.2], P0: V3 = [2.7, 5.6, 4.2];
const Crane: React.FC<{hook: V3}> = ({hook}) => {
  const tip: V3 = [hook[0], hook[1] + 1.6, hook[2]];
  return (
    <group>
      <mesh position={[CB[0], CB[1] + 0.3, CB[2]]}><boxGeometry args={[1.5, 0.6, 2.2]} /><meshStandardMaterial color="#f5b700" /></mesh>
      <mesh position={[CB[0], CB[1] + 0.05, CB[2]]}><boxGeometry args={[1.7, 0.2, 2.4]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh position={[CB[0] - 0.1, CB[1] + 0.95, CB[2] + 0.5]}><boxGeometry args={[0.9, 0.7, 0.8]} /><meshStandardMaterial color="#f5b700" /></mesh>
      <mesh position={[CB[0] + 0.1, CB[1] + 1.0, CB[2] - 0.7]}><boxGeometry args={[1.0, 0.8, 0.8]} /><meshStandardMaterial color="#8a8f98" /></mesh>
      <Beam a={[CB[0], CB[1] + 0.5, CB[2]]} b={P0} r={0.2} color="#f5b700" />
      <Beam a={P0} b={tip} r={0.1} color="#f5b700" />
      <Beam a={tip} b={[hook[0], hook[1] + 0.1, hook[2]]} r={0.025} color="#222" />
      <mesh position={[hook[0], hook[1] - 0.15, hook[2]]}><boxGeometry args={[0.55, 0.4, 0.55]} /><meshStandardMaterial color="#6b7280" /></mesh>
    </group>
  );
};

export const Barragem: React.FC = () => {
  const f = useCurrentFrame(); const t = f / 30;
  const {fps, width, height} = useVideoConfig();
  let si = 0; S.forEach((s, i) => { if (t >= s.start) si = i; });
  const pose = (['wave', 'point', 'point', 'idle', 'scared', 'scared', 'point', 'wave', 'wave', 'idle'] as HeroPose[])[si];

  // desvio do rio
  const canal = ease(prog(t, st(1) + 0.8, en(1)));
  const midH = lerp(1.2, 0.02, ease(prog(t, st(1) + 1.0, en(1) + 0.4)));
  // parede
  const dd = (en(2) - st(2) - 0.6) / 5;
  const segH = SEGZ.map((_, k) => WALL_H * ease(prog(t, st(2) + 0.3 + k * dd, st(2) + 0.3 + (k + 1) * dd)));
  const kAct = clamp(Math.floor((t - st(2) - 0.3) / dd), 0, 4);
  const hook: V3 = t < st(2) + 0.2 ? [0.2, 5.2, 4.0] : [0, BED + segH[kAct] + 1.4, SEGZ[kAct]];
  const wallDone = t >= en(2);
  // reservatório
  const L = ease(prog(t, st(3) + 0.6, en(7) - 0.2)) * 1.0;
  const leftH = 1.2 + L;
  const rightDrain = ease(prog(t, st(3), en(3)));
  const rightRefill = ease(prog(t, st(8) + 0.4, en(8)));
  const rightH = wallDone ? lerp(1.2, 0.3, rightDrain) + rightRefill * 0.8 : 1.2;
  // vazamentos
  const leakBase = prog(t, en(3) - 1.5, st(4) + 1.2) * clamp((L - 0.05) / 0.4, 0, 1);
  const sealT = JOINTZ.map((_, j) => st(6) + 0.9 + j * ((en(6) - st(6) - 1.4) / 4));
  const gate = ease(prog(t, st(8), st(8) + 1.0));

  // legenda
  let wi = -1; (WORDS_B as [string, number, number][]).forEach((w, i) => { if (f >= w[1]) wi = i; });
  const cur = wi >= 0 ? (WORDS_B as [string, number, number][])[wi] : null;
  const showWord = !!cur && f <= cur[2] + 5;
  const word = cur ? cur[0].replace(/[,:]$/, '').toUpperCase() : '';
  const key = cur ? cur[0].replace(/[^\wÀ-ÿ]/g, '').toLowerCase() : '';
  const wColor = ['erro', 'vazando', 'juntas'].includes(key) ? '#ff5a5a' : ['solução', 'funcionou', 'pronto', 'lago'].includes(key) ? '#4dff88' : undefined;
  const pop = spring({frame: f - (cur ? cur[1] : 0), fps, config: {damping: 12, stiffness: 180}});
  const wScale = interpolate(pop, [0, 1], [0.6, 1]);

  const BAN = ['', 'PASSO 1: DESVIAR O RIO', 'PASSO 2: LEVANTAR A PAREDE', 'PASSO 3: ENCHER O RESERVATÓRIO', 'OLHA SÓ...', 'ERRO: JUNTAS SEM VEDAÇÃO', 'SOLUÇÃO: INJETAR CONCRETO', 'FUNCIONOU!', 'COMPORTAS ABERTAS', 'BARRAGEM PRONTA!'];
  const banColor = si === 5 ? '#b91c1c' : si === 4 ? '#b45309' : '#15803d';
  const showBan = si >= 1 && !(si === 5 && t < st(5) + 0.5);
  const banPop = spring({frame: f - Math.round((si === 5 ? st(5) + 0.5 : st(si)) * 30), fps, config: {damping: 12, stiffness: 160}});
  let stamp: {k: string; a: number} | null = null;
  STAMPS.forEach(([ts, kind]) => { const a = t - ts; if (a >= 0 && a < 1.2) stamp = {k: kind, a}; });
  const stampPop = stamp ? spring({frame: Math.round((stamp as any).a * 30), fps, config: {damping: 9, stiffness: 220}}) : 0;

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

        {/* água: montante, meio, jusante */}
        <mesh position={[-10.3, BED + leftH / 2, -1]}><boxGeometry args={[19.4, leftH, 8]} /><meshStandardMaterial color="#2ea0ff" transparent opacity={0.62} depthWrite={false} /></mesh>
        {!wallDone && <mesh position={[0, BED + midH / 2, -1]}><boxGeometry args={[1.2, Math.max(0.01, midH), 8]} /><meshStandardMaterial color="#2ea0ff" transparent opacity={0.62} depthWrite={false} /></mesh>}
        <mesh position={[10.3, BED + rightH / 2, -1]}><boxGeometry args={[19.4, rightH, 8]} /><meshStandardMaterial color="#2ea0ff" transparent opacity={0.62} depthWrite={false} /></mesh>
        {Array.from({length: 16}).map((_, i) => {
          const x = ((rand(i) * 16 + t * (0.6 + rand(i + 5) * 0.8)) % 16) - 8;
          const inLeft = x < -0.8, inRight = x > 0.8;
          const surf = inLeft ? BED + leftH : inRight ? BED + rightH : BED + midH;
          if (!inLeft && !inRight && midH < 0.3) return null;
          return <mesh key={i} position={[x, surf + 0.02, -4.5 + rand(i + 9) * 7.2]}><boxGeometry args={[0.9, 0.02, 0.1]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.6} /></mesh>;
        })}

        {/* canal de desvio (margem oposta) */}
        {canal > 0 && (
          <group position={[0, 1.04, -6.9]}>
            <mesh scale={[canal, 1, 1]}><boxGeometry args={[30, 0.1, 1.5]} /><meshStandardMaterial color="#2ea0ff" /></mesh>
            {Array.from({length: 8}).map((_, i) => <mesh key={i} position={[((rand(i + 40) * 12 + t * 1.8) % 12) - 6, 0.08, (rand(i + 50) - 0.5) * 1.0]} scale={[canal, 1, 1]}><boxGeometry args={[0.8, 0.02, 0.1]} /><meshBasicMaterial color="#fff" /></mesh>)}
          </group>
        )}

        {/* parede de concreto */}
        {SEGZ.map((z, k) => segH[k] > 0.01 && (
          <mesh key={k} position={[0, BED + segH[k] / 2, z]}><boxGeometry args={[1.2, segH[k], 1.76]} /><meshStandardMaterial color="#c4c9d1" /></mesh>
        ))}
        {/* juntas vedadas */}
        {JOINTZ.map((z, j) => t >= sealT[j] + 0.2 && <mesh key={j} position={[0, BED + WALL_H / 2, z]}><boxGeometry args={[1.26, WALL_H, 0.14]} /><meshStandardMaterial color="#e9edf2" /></mesh>)}
        {/* injetores */}
        {JOINTZ.map((z, j) => {
          const u = prog(t, sealT[j] - 0.7, sealT[j]); const out = prog(t, sealT[j] + 0.2, sealT[j] + 0.8);
          if (t < sealT[j] - 0.7 || out >= 1) return null;
          return <Beam key={j} a={[0, 6.0 - out * 2, z]} b={[0, 2.3 + (1 - ease(u)) * 1.7, z]} r={0.06} color="#f5b700" />;
        })}
        {/* pinos de aviso nas juntas */}
        {t >= st(5) + 0.4 && t < st(6) + 0.2 && JOINTZ.map((z, j) => (
          <mesh key={j} position={[0, 3.4 + Math.abs(Math.sin(f * 0.25 + j)) * 0.35, z]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.28, 0.6, 12]} /><meshStandardMaterial color="#ff2a2a" emissive="#ff0000" emissiveIntensity={0.7} /></mesh>
        ))}
        {/* vazamentos */}
        {JOINTZ.map((z, j) => {
          const strength = t >= sealT[j] ? 0 : leakBase; if (strength < 0.03) return null;
          const y0 = clamp(L - 0.2, -0.7, 1.4);
          const n = Math.ceil(4 + strength * 8);
          return Array.from({length: n}).map((_, p) => {
            const ph = (t * 1.7 + p / n + j * 0.17) % 1;
            return <mesh key={`${j}-${p}`} position={[0.62 + ph * (0.6 + strength * 1.4), y0 - ph * ph * 1.9, z + (rand(p + j * 9) - 0.5) * 0.12]}><boxGeometry args={[0.11 + strength * 0.07, 0.11, 0.11]} /><meshStandardMaterial color="#bfe6ff" emissive="#7cc8ff" emissiveIntensity={0.6} /></mesh>;
          });
        })}
        {/* comporta e queda d'água */}
        {t >= st(8) - 0.2 && (
          <group>
            <mesh position={[-0.78, 1.0 + gate * 1.6, SEGZ[2]]}><boxGeometry args={[0.3, 1.2, 1.2]} /><meshStandardMaterial color="#374151" /></mesh>
            {gate > 0.3 && <mesh position={[1.7, 0.2, SEGZ[2]]} rotation={[0, 0, -0.45]}><boxGeometry args={[2.6, 0.45, 1.1]} /><meshStandardMaterial color="#8fd0ff" transparent opacity={0.8} /></mesh>}
          </group>
        )}

        <Crane hook={hook} />
        <Hero frame={f} pose={pose} look={HEROLOOK} position={[-2.5, 1.0, 3.4]} rotY={0.5} scale={1.2} />

        {t >= st(8) + 1.6 && Array.from({length: 36}).map((_, i) => {
          const t0 = st(8) + 1.6 + rand(i + 30) * 1.0; const y = 9 - (t - t0) * 3.4; if (t < t0 || y < 1.4) return null;
          return <mesh key={i} position={[(rand(i + 1) - 0.5) * 6.5, y, (rand(i + 2) - 0.5) * 6 - 1.5]} rotation={[t * 3 + i, t * 2, i]}><boxGeometry args={[0.16, 0.02, 0.1]} /><meshBasicMaterial color={['#ff4d6d', '#ffd23f', '#4dff88', '#4da6ff', '#c77dff'][i % 5]} /></mesh>;
        })}
      </ThreeCanvas>

      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)'}} />
      {showBan && (
        <div style={{position: 'absolute', top: 130, width: '100%', display: 'flex', justifyContent: 'center'}}>
          <div style={{transform: `scale(${0.7 + banPop * 0.3})`, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 46, color: '#fff', background: banColor, border: '6px solid #fff', borderRadius: 20, padding: '8px 30px', textAlign: 'center', maxWidth: 980}}>{BAN[si]}</div>
        </div>
      )}
      {stamp && (
        <div style={{position: 'absolute', top: 660, width: '100%', display: 'flex', justifyContent: 'center', opacity: (stamp as any).a > 0.9 ? 1 - ((stamp as any).a - 0.9) / 0.3 : 1}}>
          <div style={{transform: `rotate(-7deg) scale(${0.5 + stampPop * 0.5})`, fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 150, color: (stamp as any).k === 'p' ? '#ff3b3b' : '#16a34a', border: `12px solid ${(stamp as any).k === 'p' ? '#ff3b3b' : '#16a34a'}`, borderRadius: 26, padding: '0 36px', background: '#fff'}}>{(stamp as any).k === 'p' ? 'ERRO!' : 'SOLUÇÃO!'}</div>
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
