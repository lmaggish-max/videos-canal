import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {Hero, LOOKS, HeroPose, Look} from './Hero';
import TIME from './ptime.json';
import WORDS_P from './pwords.json';

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
const DECK_Y = 1.15;
const HEROLOOK: Look = {...LOOKS.garoto, helmet: '#f5c518', hairStyle: 'short'} as Look;

// ---------- câmera ----------
type KF = {t: number; p: V3; g: V3};
const BASE = {p: [0, 12, 10.5] as V3, g: [0, 0, -1.5] as V3};
const CAMK: KF[] = [
  {t: 0, p: [0, 17, 15], g: [0, 0, -1]},
  {t: en(0), ...BASE},
  {t: st(2), ...BASE},
  {t: st(2) + 1, p: [1.2, 10.2, 8.6], g: [0, -0.8, -1.3]},
  {t: en(2), p: [1.2, 10.2, 8.6], g: [0, -0.8, -1.3]},
  {t: st(3), ...BASE},
  {t: st(4) + 0.6, p: [-0.8, 10.6, 8.4], g: [0, -0.4, -1.7]},
  {t: en(5), p: [-0.8, 10.6, 8.4], g: [0, -0.4, -1.7]},
  {t: st(6), ...BASE},
  {t: st(7), p: [4.2, 11, 9.5], g: [0, 1, -1]},
  {t: en(8), p: [1, 12, 11], g: [0, 1, -1.5]},
  {t: st(9), p: [0, 9.5, 11.5], g: [0, 1.2, -1.5]},
  {t: TIME.total, p: [2.6, 8.8, 11], g: [0, 1.2, -1.5]},
];
const camAt = (t: number) => {
  let i = 0; for (let k = 0; k < CAMK.length; k++) if (CAMK[k].t <= t) i = k;
  const a = CAMK[i], b = CAMK[i + 1]; if (!b) return a;
  const u = ease(prog(t, a.t, b.t));
  return {p: [0, 1, 2].map((j) => lerp(a.p[j], b.p[j], u)) as V3, g: [0, 1, 2].map((j) => lerp(a.g[j], b.g[j], u)) as V3};
};
const STAMPS: [number, string][] = [[1, 'p'], [2, 's'], [3, 'p'], [4, 's'], [6, 'p'], [7, 's']];
const Cam: React.FC<{t: number; f: number}> = ({t, f}) => {
  const {camera} = useThree(); const c = camAt(t);
  let sh = 0; STAMPS.forEach(([i]) => { const d = t - st(i); if (d >= 0 && d < 0.4) sh = Math.max(sh, 0.18 * (1 - d / 0.4)); });
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

// ---------- segmentos do tabuleiro / guindaste ----------
const TC0 = () => st(7), TC1 = () => en(8) - 1.0;
const stackPos = (k: number): V3 => [-0.5, 1.0 + 0.16 + (4 - k) * 0.32, 4.6];
const targetPos = (k: number): V3 => [0, DECK_Y, SEGZ[k]];
const segPos = (k: number, t: number): V3 => {
  const d = (TC1() - TC0()) / 5; const u = (t - (TC0() + k * d)) / d;
  const A = stackPos(k), T = targetPos(k), H = 4.4;
  if (u <= 0) return A; if (u >= 1) return T;
  if (u < 0.25) return [A[0], lerp(A[1], H, ease(u / 0.25)), A[2]];
  if (u < 0.65) { const e = ease((u - 0.25) / 0.4); return [lerp(A[0], T[0], e), H, lerp(A[2], T[2], e)]; }
  if (u < 0.9) return [T[0], lerp(H, T[1], ease((u - 0.65) / 0.25)), T[2]];
  return T;
};
const CB: V3 = [2.7, 1.0, 4.2];
const P0: V3 = [2.7, 5.4, 4.2];

const Crane: React.FC<{t: number}> = ({t}) => {
  const d = (TC1() - TC0()) / 5;
  const kAct = clamp(Math.floor((t - TC0()) / d), 0, 4);
  const sp = t < TC0() ? ([stackPos(0)[0], stackPos(0)[1] + 2.4, stackPos(0)[2]] as V3) : segPos(kAct, t);
  const tip: V3 = [sp[0], sp[1] + 1.5, sp[2]];
  return (
    <group>
      <mesh position={[CB[0], CB[1] + 0.3, CB[2]]}><boxGeometry args={[1.5, 0.6, 2.2]} /><meshStandardMaterial color="#f5b700" /></mesh>
      <mesh position={[CB[0], CB[1] + 0.05, CB[2]]}><boxGeometry args={[1.7, 0.2, 2.4]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh position={[CB[0] - 0.1, CB[1] + 0.95, CB[2] + 0.5]}><boxGeometry args={[0.9, 0.7, 0.8]} /><meshStandardMaterial color="#f5b700" /></mesh>
      <mesh position={[CB[0] + 0.1, CB[1] + 1.0, CB[2] - 0.7]}><boxGeometry args={[1.0, 0.8, 0.8]} /><meshStandardMaterial color="#8a8f98" /></mesh>
      <Beam a={[CB[0], CB[1] + 0.5, CB[2]]} b={P0} r={0.2} color="#f5b700" />
      <Beam a={P0} b={tip} r={0.1} color="#f5b700" />
      <Beam a={tip} b={[sp[0], sp[1] + 0.2, sp[2]]} r={0.025} color="#222" />
    </group>
  );
};

// ---------- cena ----------
export const Ponte: React.FC = () => {
  const f = useCurrentFrame(); const t = f / 30;
  const {fps, width, height} = useVideoConfig();
  let si = 0; S.forEach((s, i) => { if (t >= s.start) si = i; });

  const pose: HeroPose = (['wave', 'idle', 'point', 'scared', 'point', 'idle', 'scared', 'point', 'idle', 'wave'] as HeroPose[])[si];

  // problema 1: bloco afundando na lama
  const bp = prog(t, st(1) + 0.3, en(1) + 0.4);
  const blockY = bp < 0.35 ? lerp(2.4, -0.7, ease(bp / 0.35)) : lerp(-0.7, -2.0, (bp - 0.35) / 0.65);
  const showBlock = t >= st(1) && t < st(2) + 0.1;

  // estacas
  const pp = prog(t, st(2) + 0.1, en(2));
  const N = 12, s = pp * N, k = Math.floor(s), fr = s - k;
  const stepp = Math.min(1, (k + ease(clamp(fr / 0.5, 0, 1))) / N);
  const pileTop = lerp(3.4, -0.35, pp >= 1 ? 1 : stepp);
  const showPiles = t >= st(2) - 0.1;
  const hammerY = pileTop + 0.75 + Math.abs(Math.sin(f * 0.45)) * 0.3;
  const showHammer = t >= st(2) && t < en(2) + 0.4;

  // ensecadeira
  const cdDrop = prog(t, st(4) + 0.1, st(4) + 1.3);
  const cdBounce = 1 - Math.pow(1 - cdDrop, 3) + Math.sin(cdDrop * Math.PI * 2) * 0.05 * (1 - cdDrop);
  const cdLift = prog(t, en(5) + 0.1, en(5) + 1.1);
  const cdY = lerp(3.2, 0, clamp(cdBounce, 0, 1.05)) + cdLift * 4;
  const showCD = t >= st(4) + 0.05 && cdLift < 1;
  const drain = prog(t, st(5) + 0.1, st(5) + 1.5);
  const innerH = lerp(1.2, 0.03, ease(drain));
  const showInner = t >= st(4) + 1.2 && t < en(5) + 0.1;
  const pierH = 2.2 * ease(prog(t, st(5) + 1.3, en(5)));
  const showPier = t >= st(5) + 1.3;

  // legenda
  let wi = -1; (WORDS_P as [string, number, number][]).forEach((w, i) => { if (f >= w[1]) wi = i; });
  const cur = wi >= 0 ? (WORDS_P as [string, number, number][])[wi] : null;
  const showWord = !!cur && f <= cur[2] + 5;
  const word = cur ? cur[0].replace(/[,:]$/, '').toUpperCase() : '';
  const key = cur ? cur[0].replace(/[^\wÀ-ÿ]/g, '').toLowerCase() : '';
  const wColor = ['problema', 'lama', 'mole', 'toneladas'].includes(key) ? '#ff5a5a' : ['solução', 'pronto', 'pronta', 'ponte'].includes(key) ? '#4dff88' : undefined;
  const pop = spring({frame: f - (cur ? cur[1] : 0), fps, config: {damping: 12, stiffness: 180}});
  const wScale = interpolate(pop, [0, 1], [0.6, 1]);

  // banner e etapa
  const BAN = ['', 'PROBLEMA: fundo do rio mole', 'SOLUÇÃO: estacas até a rocha', 'PROBLEMA: pilar dentro da água', 'SOLUÇÃO: ensecadeira', 'SOLUÇÃO: bombear e concretar', 'PROBLEMA: vigas de 40 toneladas', 'SOLUÇÃO: guindaste', 'ACABAMENTO', 'PONTE PRONTA!'];
  const isProb = [1, 3, 6].includes(si);
  const etapa = si <= 0 ? 0 : si <= 2 ? 1 : si <= 5 ? 2 : 3;
  const banPop = spring({frame: f - Math.round(st(si) * 30), fps, config: {damping: 12, stiffness: 160}});

  // carimbo
  let stamp: {k: string; a: number} | null = null;
  STAMPS.forEach(([i, kind]) => { const a = t - st(i); if (a >= 0 && a < 1.2) stamp = {k: kind, a}; });
  const stampPop = stamp ? spring({frame: Math.round((stamp as any).a * 30), fps, config: {damping: 9, stiffness: 220}}) : 0;

  // tabuleiro
  const segs = [0, 1, 2, 3, 4].map((k) => segPos(k, t));
  const asphalt = t >= st(8);
  const railP = prog(t, st(8) + 0.2, en(8));

  const cars = [{x: 0.55, dir: -1, t0: st(9) + 0.2, col: '#e63946'}, {x: -0.55, dir: 1, t0: st(9) + 0.9, col: '#2a9df4'}, {x: 0.55, dir: -1, t0: st(9) + 1.7, col: '#ffd23f'}];

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#6ec6ff, #e2f4ff)'}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 50, position: [0, 9.5, 15]}}>
        <Cam t={t} f={f} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[6, 12, 8]} intensity={1.7} />

        {/* margens com camadas */}
        {[[-9, 'far'], [6.5, 'near']].map(([z, n]) => (
          <group key={n as string}>
            <mesh position={[0, -0.6, z as number]}><boxGeometry args={[40, 3.2, 8]} /><meshStandardMaterial color="#9c6b3c" /></mesh>
            <mesh position={[0, 0.97, z as number]}><boxGeometry args={[40, 0.08, 8]} /><meshStandardMaterial color="#5fb04a" /></mesh>
          </group>
        ))}
        {/* leito do rio: lama e rocha */}
        <mesh position={[0, -1.7, -1]}><boxGeometry args={[40, 1.0, 8]} /><meshStandardMaterial color="#7a5a37" /></mesh>
        <mesh position={[0, -2.6, -1]}><boxGeometry args={[40, 0.8, 8]} /><meshStandardMaterial color="#8a8f98" /></mesh>
        {/* água */}
        <mesh position={[0, -0.6, -1]}><boxGeometry args={[40, 1.2, 8]} /><meshStandardMaterial color="#2ea0ff" transparent opacity={0.62} depthWrite={false} /></mesh>
        {Array.from({length: 14}).map((_, i) => {
          const x = ((rand(i) * 16 + t * (0.6 + rand(i + 5) * 0.8)) % 16) - 8;
          return <mesh key={i} position={[x, 0.02, -4.5 + rand(i + 9) * 7.2]}><boxGeometry args={[0.9, 0.02, 0.1]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.6} /></mesh>;
        })}

        {/* problema 1: bloco afundando */}
        {showBlock && <mesh position={[0, blockY, PIERZ[0]]} rotation={[0, 0, bp > 0.35 ? Math.sin(f * 0.35) * 0.1 * (bp - 0.35) : 0]}><boxGeometry args={[1.4, 1.0, 1.2]} /><meshStandardMaterial color="#9aa3ad" /></mesh>}

        {/* estacas */}
        {showPiles && PIERZ.map((pz) => [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]].map((o, i) => (
          <mesh key={`${pz}${i}`} position={[o[0], pileTop - 1.7 + (i % 2) * 0.0, pz + o[1]]}><cylinderGeometry args={[0.13, 0.13, 3.4, 12]} /><meshStandardMaterial color="#9aa3ad" metalness={0.4} roughness={0.4} /></mesh>
        )))}
        {showHammer && PIERZ.map((pz) => (
          <group key={pz} position={[0, hammerY, pz]}>
            <mesh><boxGeometry args={[1.2, 0.5, 1.0]} /><meshStandardMaterial color="#333" /></mesh>
            <mesh position={[0, 0.35, 0]}><boxGeometry args={[1.3, 0.2, 1.1]} /><meshStandardMaterial color="#f5b700" /></mesh>
          </group>
        ))}

        {/* ensecadeira + pilar */}
        {PIERZ.map((pz) => (
          <group key={pz}>
            {showCD && (
              <group position={[0, cdY, pz]}>
                {[[0, 1.15, 3.0, 0.12], [0, -1.15, 3.0, 0.12], [1.5, 0, 0.12, 2.3], [-1.5, 0, 0.12, 2.3]].map((w, i) => (
                  <mesh key={i} position={[w[0], -0.2, w[1]]}><boxGeometry args={[w[2], 2.0, w[3]]} /><meshStandardMaterial color="#e8892b" /></mesh>
                ))}
              </group>
            )}
            {showInner && <mesh position={[0, -1.2 + innerH / 2, pz]}><boxGeometry args={[2.86, innerH, 2.18]} /><meshStandardMaterial color="#3fa7ff" /></mesh>}
            {showPier && <mesh position={[0, -1.2 + pierH / 2, pz]}><boxGeometry args={[2.0, Math.max(0.01, pierH), 1.4]} /><meshStandardMaterial color="#c4c9d1" /></mesh>}
          </group>
        ))}

        {/* tabuleiro */}
        {segs.map((p, i) => (
          <group key={i} position={p}>
            <mesh><boxGeometry args={[2.6, 0.3, 1.78]} /><meshStandardMaterial color={asphalt ? '#3a3d44' : '#b8bec7'} /></mesh>
            {asphalt && <mesh position={[0, 0.16, 0]}><boxGeometry args={[0.1, 0.01, 0.8]} /><meshBasicMaterial color="#ffffff" /></mesh>}
          </group>
        ))}
        {railP > 0 && [-1, 1].map((sx) => (
          <group key={sx}>
            {Array.from({length: 11}).map((_, i) => railP > i / 11 && <mesh key={i} position={[sx * 1.22, DECK_Y + 0.35, 3.4 - i * 0.9]}><boxGeometry args={[0.07, 0.4, 0.07]} /><meshStandardMaterial color="#f1f1f1" /></mesh>)}
            <mesh position={[sx * 1.22, DECK_Y + 0.52, -0.5]} scale={[1, 1, railP]}><boxGeometry args={[0.06, 0.06, 9.3]} /><meshStandardMaterial color="#e63946" /></mesh>
          </group>
        ))}

        <Crane t={t} />

        {/* carros */}
        {cars.map((c, i) => {
          const u = prog(t, c.t0, c.t0 + 5); if (t < c.t0 || u >= 1) return null;
          const z = c.dir < 0 ? lerp(7, -10, u) : lerp(-10, 7, u);
          return (
            <group key={i} position={[c.x, DECK_Y + 0.4, z]} rotation={[0, c.dir < 0 ? Math.PI : 0, 0]}>
              <mesh><boxGeometry args={[0.7, 0.3, 1.3]} /><meshStandardMaterial color={c.col} /></mesh>
              <mesh position={[0, 0.25, -0.1]}><boxGeometry args={[0.6, 0.25, 0.65]} /><meshStandardMaterial color="#cfe9ff" /></mesh>
              {[[-0.36, 0.45], [0.36, 0.45], [-0.36, -0.45], [0.36, -0.45]].map((w, j) => <mesh key={j} position={[w[0], -0.12, w[1]]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.15, 0.15, 0.12, 12]} /><meshStandardMaterial color="#111" /></mesh>)}
            </group>
          );
        })}

        {/* confete */}
        {t >= st(9) + 0.4 && Array.from({length: 36}).map((_, i) => {
          const t0 = st(9) + 0.4 + rand(i + 30) * 0.9; const y = 9 - (t - t0) * 3.4; if (t < t0 || y < 1.4) return null;
          return <mesh key={i} position={[(rand(i + 1) - 0.5) * 6.5, y, (rand(i + 2) - 0.5) * 6 - 1.5]} rotation={[t * 3 + i, t * 2, i]}><boxGeometry args={[0.16, 0.02, 0.1]} /><meshBasicMaterial color={['#ff4d6d', '#ffd23f', '#4dff88', '#4da6ff', '#c77dff'][i % 5]} /></mesh>;
        })}

        {/* herói engenheiro */}
        <Hero frame={f} pose={pose} look={HEROLOOK} position={[-2.5, 1.0, 3.4]} rotY={0.5} scale={1.2} />
      </ThreeCanvas>

      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)'}} />

      {/* HUD */}
      {si >= 1 && (
        <div style={{position: 'absolute', top: 120, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
          <div style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 60, color: '#ffd23f', background: '#1a1a2e', border: '8px solid #ffd23f', borderRadius: 24, padding: '8px 36px'}}>ETAPA {etapa}/3</div>
          <div style={{transform: `scale(${0.7 + banPop * 0.3})`, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 44, color: '#fff', background: si === 9 ? '#15803d' : isProb ? '#b91c1c' : '#15803d', border: '6px solid #fff', borderRadius: 20, padding: '8px 30px', textAlign: 'center', maxWidth: 960}}>{BAN[si]}</div>
        </div>
      )}
      {stamp && (
        <div style={{position: 'absolute', top: 640, width: '100%', display: 'flex', justifyContent: 'center', opacity: (stamp as any).a > 0.9 ? 1 - ((stamp as any).a - 0.9) / 0.3 : 1}}>
          <div style={{transform: `rotate(-7deg) scale(${0.5 + stampPop * 0.5})`, fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 130, color: (stamp as any).k === 'p' ? '#ff3b3b' : '#16a34a', border: `12px solid ${(stamp as any).k === 'p' ? '#ff3b3b' : '#16a34a'}`, borderRadius: 26, padding: '0 36px', background: '#fff'}}>{(stamp as any).k === 'p' ? 'PROBLEMA!' : 'SOLUÇÃO!'}</div>
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
