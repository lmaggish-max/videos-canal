import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {Hero, LOOKS, HeroPose, Look} from './Hero';
import TIME from './stime.json';
import WORDS_S from './swords.json';

type V3 = [number, number, number];
const S = TIME.sents as {i: number; start: number; end: number}[];
const st = (i: number) => S[i].start, en = (i: number) => S[i].end;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = Easing.inOut(Easing.cubic);
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
const rand = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const HEROLOOK: Look = {...LOOKS.garoto, backpack: '#2a9d8f'} as Look;
const ZLOOKS: Look[] = [LOOKS.zumbi, {...LOOKS.zumbi, shirt: '#7a4a4a', hair: '#222'} as Look, {...LOOKS.zumbi, shirt: '#4a6a7a', hair: '#5a3a2a'} as Look];
const TS = () => st(4) + 0.5;           // momento do rangido
const HX = 0, HZ_STOP = -8.5, DOOR_Z = -12, BIKE_Z = -14.8;

// posição do herói
const heroAt = (t: number): {z: number; rot: number; pose: HeroPose; y: number} => {
  const PI = Math.PI;
  if (t < st(1)) return {z: 11, rot: PI, pose: 'idle', y: 0};
  if (t < en(1)) return {z: lerp(11, 6.5, prog(t, st(1), en(1))), rot: PI, pose: 'walk', y: 0};
  if (t < en(2)) return {z: lerp(6.5, -1.5, prog(t, st(2), en(2))), rot: PI, pose: 'walk', y: 0};
  if (t < en(3)) return {z: lerp(-1.5, HZ_STOP, prog(t, st(3), en(3))), rot: PI, pose: 'walk', y: 0};
  if (t < st(5)) return {z: HZ_STOP, rot: PI, pose: 'idle', y: 0};
  if (t < st(7)) return {z: HZ_STOP, rot: lerp(PI, 0, ease(prog(t, st(5), st(5) + 0.5))), pose: 'scared', y: 0};
  const u = t - st(7);
  if (u < 1.5) return {z: lerp(HZ_STOP, BIKE_Z, ease(clamp(u / 1.5, 0, 1))), rot: PI, pose: 'run', y: 0};
  const v = u - 1.5;
  return {z: BIKE_Z - 1.6 * v * v - 2.2 * v, rot: PI, pose: 'run', y: 0.42};
};

const Beam: React.FC<{a: V3; b: V3; r?: number; color: string}> = ({a, b, r = 0.05, color}) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va); const L = Math.max(0.001, dir.length());
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return <mesh position={mid.toArray() as V3} quaternion={q}><boxGeometry args={[r * 2, L, r * 2]} /><meshStandardMaterial color={color} /></mesh>;
};

const Cam: React.FC<{t: number; f: number}> = ({t, f}) => {
  const {camera} = useThree();
  const h = heroAt(t);
  const follow: {p: V3; g: V3} = {p: [0, 8.8, Math.min(h.z + 9.5, 21)], g: [0, 0.8, h.z - 3.5]};
  const wide: {p: V3; g: V3} = {p: [0, 17, 19], g: [0, 0, 0]};
  const w = 1 - ease(prog(t, st(0) + 1.2, en(0)));
  const pull = ease(prog(t, TS() + 0.2, st(5) + 0.8)) * (1 - ease(prog(t, st(7), st(7) + 1.0)));
  const p: V3 = [0, lerp(lerp(follow.p[1], wide.p[1], w), 13, pull), lerp(lerp(follow.p[2], wide.p[2], w), h.z + 12.5, pull)];
  const g: V3 = [0, lerp(follow.g[1], wide.g[1], w), lerp(lerp(follow.g[2], wide.g[2], w), h.z - 2, pull)];
  let sh = 0; const d = t - TS(); if (d >= 0 && d < 0.5) sh = 0.2 * (1 - d / 0.5);
  const d2 = t - (st(6) + 0.5); if (d2 >= 0 && d2 < 0.4) sh = Math.max(sh, 0.15 * (1 - d2 / 0.4));
  camera.position.set(p[0] + Math.sin(f * 3.7) * sh, p[1] + Math.cos(f * 4.3) * sh, p[2]);
  camera.lookAt(g[0], g[1], g[2]);
  return null;
};

const SEGZ = [7.5, 3.6, -0.3, -4.2, -8.1];
const PAL_L = ['#d94f4f', '#f5b700', '#4fa84f', '#e07b39'], PAL_R = ['#4da6ff', '#bfe6ff', '#2f7fd6', '#e8f4ff'];

const Store: React.FC = () => (
  <group>
    <mesh position={[0, -0.1, 0]}><boxGeometry args={[16, 0.2, 24]} /><meshStandardMaterial color="#ebe8df" /></mesh>
    <mesh position={[0, -0.09, 0]}><boxGeometry args={[2.8, 0.2, 24]} /><meshStandardMaterial color="#d8d4c8" /></mesh>
    {[-8, 8].map((x) => <mesh key={x} position={[x, 0.6, 0]}><boxGeometry args={[0.3, 1.2, 24]} /><meshStandardMaterial color="#cfcac0" /></mesh>)}
    {[12, -12].map((z) => [-1, 1].map((s) => <mesh key={`${z}${s}`} position={[s * 4.9, 0.6, z]}><boxGeometry args={[6.4, 1.2, 0.3]} /><meshStandardMaterial color="#cfcac0" /></mesh>))}
    <mesh position={[0, 1.6, -12]}><boxGeometry args={[3.4, 0.5, 0.3]} /><meshStandardMaterial color="#16a34a" emissive="#16a34a" emissiveIntensity={0.7} /></mesh>
    <mesh position={[0, 1.6, 12]}><boxGeometry args={[3.4, 0.5, 0.3]} /><meshStandardMaterial color="#b45309" /></mesh>
    {[-2.3, 2.3, -5.6, 5.6].map((x, r) => SEGZ.map((z, k) => (
      <group key={`${r}${k}`} position={[x, 0, z]}>
        <mesh position={[0, 1.0, 0]}><boxGeometry args={[1.0, 2.0, 2.6]} /><meshStandardMaterial color="#9aa7b8" /></mesh>
        {r < 2 && [0.5, 1.1, 1.7].map((y, li) => [-0.9, -0.3, 0.3, 0.9].map((dz, pi) => (
          <mesh key={`${li}${pi}`} position={[r === 0 ? 0.55 : -0.55, y, dz]}><boxGeometry args={[0.18, 0.38, 0.4]} /><meshStandardMaterial color={(r === 0 ? PAL_L : PAL_R)[(li + pi + k) % 4]} /></mesh>
        )))}
      </group>
    )))}
    {/* estacionamento */}
    <mesh position={[0, -0.1, -42]}><boxGeometry args={[60, 0.2, 60]} /><meshStandardMaterial color="#6b6f78" /></mesh>
    {[[-6, -22, '#e63946'], [6, -26, '#2a9df4'], [-7, -34, '#f5b700'], [7, -40, '#16a34a']].map((c, i) => (
      <group key={i} position={[c[0] as number, 0.3, c[1] as number]}>
        <mesh><boxGeometry args={[1.5, 0.5, 2.8]} /><meshStandardMaterial color={c[2] as string} /></mesh>
        <mesh position={[0, 0.4, -0.2]}><boxGeometry args={[1.3, 0.4, 1.4]} /><meshStandardMaterial color="#cfe9ff" /></mesh>
      </group>
    ))}
  </group>
);

const Bike: React.FC<{z: number}> = ({z}) => (
  <group position={[0, 0.45, z]}>
    {[-0.6, 0.6].map((dz) => <mesh key={dz} position={[0, 0, dz]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.45, 0.06, 8, 20]} /><meshStandardMaterial color="#222" /></mesh>)}
    <Beam a={[0, 0, -0.6]} b={[0, 0.55, -0.1]} color="#e63946" /><Beam a={[0, 0.55, -0.1]} b={[0, 0, 0.6]} color="#e63946" />
    <Beam a={[0, 0.55, -0.1]} b={[0, 0.9, -0.3]} color="#e63946" /><Beam a={[-0.25, 0.92, -0.3]} b={[0.25, 0.92, -0.3]} color="#333" />
    <mesh position={[0, 0.62, 0.2]}><boxGeometry args={[0.2, 0.06, 0.4]} /><meshStandardMaterial color="#222" /></mesh>
  </group>
);

const Cart: React.FC<{items: number; water: number}> = ({items, water}) => (
  <group>
    <mesh position={[0, 0.65, 0]}><boxGeometry args={[0.9, 0.5, 1.3]} /><meshStandardMaterial color="#b8bec7" transparent opacity={0.55} /></mesh>
    <Beam a={[-0.45, 1.0, 0.65]} b={[0.45, 1.0, 0.65]} color="#7a828e" />
    {[[-0.4, -0.55], [0.4, -0.55], [-0.4, 0.55], [0.4, 0.55]].map((w, i) => <mesh key={i} position={[w[0], 0.12, w[1]]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.12, 0.12, 0.08, 12]} /><meshStandardMaterial color="#222" /></mesh>)}
    {Array.from({length: items}).map((_, i) => <mesh key={i} position={[-0.2 + (i % 2) * 0.35, 0.78, -0.3 + Math.floor(i / 2) * 0.28]}><cylinderGeometry args={[0.11, 0.11, 0.2, 10]} /><meshStandardMaterial color="#d94f4f" /></mesh>)}
    {Array.from({length: water}).map((_, i) => <mesh key={i} position={[-0.2 + (i % 2) * 0.35, 0.85, 0.2 + Math.floor(i / 2) * 0.28]}><cylinderGeometry args={[0.09, 0.09, 0.32, 10]} /><meshStandardMaterial color="#4da6ff" /></mesh>)}
  </group>
);

const ZN = 18;
const ZOMB = Array.from({length: ZN}, (_, i) => ({
  x: (i % 2 ? 1 : -1) * (3.1 + rand(i + 1) * 3.4), z: -9 + rand(i + 9) * 19, a0: rand(i + 20) * Math.PI * 2,
  lag: 0.7 + rand(i + 30) * 1.5, ring: 1.4 + rand(i + 40) * 1.0, ang: rand(i + 50) * Math.PI * 2, jit: rand(i + 60) * 0.5,
}));

export const Supermercado: React.FC = () => {
  const f = useCurrentFrame(); const t = f / 30;
  const {fps, width, height} = useVideoConfig();
  let si = 0; S.forEach((s, i) => { if (t >= s.start) si = i; });
  const h = heroAt(t);
  const riding = t >= st(7) + 1.5;
  const items = Math.round(6 * prog(t, st(2) + 0.2, st(2) + 1.4));
  const water = Math.round(4 * prog(t, st(2) + 1.6, en(2) - 0.2));
  const showCart = t < st(7) + 0.2 || true;
  const cartZ = t < st(7) ? h.z - 1.3 : HZ_STOP - 1.3;

  // zumbis
  const ta = TS();
  const zombies = ZOMB.map((z, i) => {
    const turn = prog(t, ta + z.jit, ta + z.jit + 0.5);
    const chase = ease(prog(t, st(5) + z.jit * 0.6, st(5) + 3.0 + z.jit));
    const target: V3 = [HX + Math.cos(z.ang) * z.ring, 0, HZ_STOP + Math.sin(z.ang) * z.ring];
    let x = lerp(z.x + Math.sin(t * 0.6 + i) * 0.15, target[0], chase), zz = lerp(z.z + Math.cos(t * 0.5 + i) * 0.2, target[2], chase);
    if (t >= st(7)) {
      const hh = heroAt(Math.max(0, t - z.lag - 0.3));
      const w = ease(prog(t, st(7), st(7) + 1.2));
      x = lerp(x, HX + Math.cos(z.ang) * z.ring * 0.6, w); zz = lerp(zz, hh.z + 1.2 + Math.sin(z.ang) * 1.0 + z.ring * 0.4, w);
    }
    const faceA = Math.atan2(HX - x, heroAt(t).z - zz);
    const rot = lerp(z.a0, faceA, turn);
    return {x, z: zz, rot, walking: chase > 0.02};
  });

  // legenda
  let wi = -1; (WORDS_S as [string, number, number][]).forEach((w, i) => { if (f >= w[1]) wi = i; });
  const cur = wi >= 0 ? (WORDS_S as [string, number, number][])[wi] : null;
  const showWord = !!cur && f <= cur[2] + 5;
  const word = cur ? cur[0].replace(/[,:?]$/, (m) => (m === '?' ? '?' : '')).toUpperCase() : '';
  const key = cur ? cur[0].replace(/[^\wÀ-ÿ]/g, '').toLowerCase() : '';
  const wColor = ['zumbis', 'deslize', 'barulhento', 'range'].includes(key) ? '#ff5a5a' : ['silêncio', 'chance', 'bicicleta'].includes(key) ? '#4dff88' : undefined;
  const pop = spring({frame: f - (cur ? cur[1] : 0), fps, config: {damping: 12, stiffness: 180}});
  const wScale = interpolate(pop, [0, 1], [0.6, 1]);

  // ruído
  const spike = t >= TS() ? 1 - 0.3 * prog(t, TS() + 0.6, st(7)) : 0;
  const noise = clamp(0.1 + 0.04 * Math.sin(f * 0.3) + spike * (t < st(7) ? 0.9 : 0) + (t >= st(7) ? 0.25 : 0), 0, 1);
  const BAN = ['UM MINUTO NO SUPERMERCADO CHEIO DE ZUMBIS', 'PLANO: ENTRAR, PEGAR, SAIR', 'ENLATADOS E ÁGUA', 'SEM FAZER BARULHO...', '', 'PERIGO!', 'O DESLIZE: CARRINHO BARULHENTO', 'SEGUNDA CHANCE: BICICLETA', 'VOCÊ ESCOLHERIA O CARRINHO?'];
  const showBan = BAN[si] !== '' && !(si === 6 && t < st(6) + 0.5);
  const banColor = si === 5 || si === 6 ? '#b91c1c' : si === 0 ? '#1a1a2e' : '#15803d';
  const banPop = spring({frame: f - Math.round((si === 6 ? st(6) + 0.5 : st(si)) * 30), fps, config: {damping: 12, stiffness: 160}});
  const stampT = t - (st(6) + 0.5); const stampOn = stampT >= 0 && stampT < 1.2;
  const stampPop = stampOn ? spring({frame: Math.round(stampT * 30), fps, config: {damping: 9, stiffness: 220}}) : 0;
  const squeak = t - TS(); const squeakOn = squeak >= 0 && squeak < 1.0;

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#a8dcff, #eaf6ff)'}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 50, position: [0, 17, 19]}}>
        <Cam t={t} f={f} />
        <ambientLight intensity={1.6} />
        <directionalLight position={[5, 12, 8]} intensity={1.6} />
        <Store />
        <Bike z={riding ? h.z : BIKE_Z} />
        {/* carrinho posicionado */}
        <group position={[HX, 0, cartZ]} rotation={[0, Math.PI, 0]}><Cart items={items} water={water} /></group>
        <Hero frame={f} pose={h.pose} look={HEROLOOK} position={[HX, h.y + (riding ? 0.35 : 0), h.z]} rotY={h.rot} scale={0.9} />
        {zombies.map((z, i) => <Hero key={i} frame={f * 0.5 + i * 7} pose="zombie" look={ZLOOKS[i % 3]} position={[z.x, 0, z.z]} rotY={z.rot} scale={0.9} />)}
        {squeakOn && [0, 1, 2].map((k) => { const u = clamp(squeak * 1.6 - k * 0.2, 0, 1); return u > 0 && u < 1 ? <mesh key={k} position={[HX + 0.4, 0.3, cartZ + 0.4]} rotation={[Math.PI / 2, 0, 0]} scale={0.5 + u * 5}><torusGeometry args={[0.4, 0.04, 8, 28]} /><meshBasicMaterial color="#ffd23f" transparent opacity={1 - u} /></mesh> : null; })}
        {si === 6 && t >= st(6) + 0.3 && <mesh position={[HX, 0.1, cartZ]} rotation={[Math.PI / 2, 0, 0]} scale={1 + 0.1 * Math.sin(f * 0.4)}><torusGeometry args={[1.1, 0.07, 8, 32]} /><meshBasicMaterial color="#ff2a2a" /></mesh>}
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)'}} />
      {t >= st(1) && (
        <div style={{position: 'absolute', top: 120, left: 60, display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 36, color: '#fff', background: '#000a', borderRadius: 16, padding: '8px 18px'}}>
          <span>BARULHO</span>
          <div style={{width: 260, height: 26, borderRadius: 13, background: '#ffffff30', overflow: 'hidden'}}><div style={{width: `${noise * 100}%`, height: '100%', background: noise > 0.6 ? '#ff3b3b' : noise > 0.3 ? '#ffd23f' : '#4dff88'}} /></div>
        </div>
      )}
      {showBan && (
        <div style={{position: 'absolute', top: si === 0 ? 200 : 210, width: '100%', display: 'flex', justifyContent: 'center'}}>
          <div style={{transform: `scale(${0.7 + banPop * 0.3})`, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: si === 0 ? 54 : 44, color: '#fff', background: banColor, border: '6px solid #fff', borderRadius: 20, padding: '10px 30px', textAlign: 'center', maxWidth: 980}}>{BAN[si]}</div>
        </div>
      )}
      {squeakOn && <div style={{position: 'absolute', top: 760, width: '100%', textAlign: 'center', fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 120, color: '#ffd23f', transform: `rotate(${Math.sin(f * 2) * 4 - 4}deg)`, textShadow: '0 6px 0 #000, 5px 0 0 #000, -5px 0 0 #000'}}>RÍIIIC!</div>}
      {stampOn && (
        <div style={{position: 'absolute', top: 640, width: '100%', display: 'flex', justifyContent: 'center', opacity: stampT > 0.9 ? 1 - (stampT - 0.9) / 0.3 : 1}}>
          <div style={{transform: `rotate(-7deg) scale(${0.5 + stampPop * 0.5})`, fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 140, color: '#ff3b3b', border: '12px solid #ff3b3b', borderRadius: 26, padding: '0 36px', background: '#fff'}}>DESLIZE!</div>
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
