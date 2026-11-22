import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {Hero, LOOKS} from './Hero';
import {WaterBottle, CannedFood, Radio, Flashlight} from './Props';

// ---------- constantes do prédio ----------
const HF = 1.4;                 // altura de cada andar
const F13 = 12 * HF + 0.06;     // chão do 13º andar
const ROOF = 13 * HF + 0.06;    // chão do telhado
const TX = -2.8;                // x da torre de escada
const HS = 0.62;                // escala do herói no prédio

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (f: number, a: number, b: number) => clamp((f - a) / (b - a), 0, 1);
const ease = Easing.inOut(Easing.cubic);
const rand = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- roteiro: palavra, frame ----------
const WORDS: [string, number][] = [
  ['VOCÊ', 0], ['ESTÁ', 12], ['NO', 22], ['13º', 30], ['ANDAR', 44],
  ['E', 100], ['O', 108], ['MUNDO', 116], ['ACABOU', 130], ['ZUMBIS', 152], ['NA', 164], ['RUA', 172],
  ['PASSO', 182], ['1', 194], ['TRANQUE', 206], ['A', 222], ['PORTA', 230], ['COM', 262], ['MÓVEIS', 272],
  ['PASSO', 392], ['2', 404], ['RACIONE', 416], ['ÁGUA', 436], ['E', 452], ['COMIDA', 462], ['1 LATA', 512], ['POR DIA', 538],
  ['ERRO', 574], ['1', 586], ['LIGOU', 598], ['O', 612], ['RÁDIO', 620], ['ALTO', 634], ['ZUMBIS', 690], ['OUVIRAM', 706], ['DESLIGA!', 748],
  ['SE', 792], ['ELE', 802], ['DESCER', 812], ['MORRE!', 912],
  ['NÃO', 938], ['DESÇA!', 950],
  ['ERRO', 984], ['2', 996], ['COMEU', 1008], ['TUDO', 1022], ['DE UMA', 1034], ['VEZ', 1048], ['RESTA', 1092], ['ZERO', 1106],
  ['PASSO', 1144], ['3', 1156], ['PEÇA', 1170], ['AJUDA', 1184], ['NO', 1200], ['TELHADO', 1208], ['USE', 1252], ['A', 1262], ['LANTERNA', 1270], ['SOS', 1330],
  ['ALGUÉM', 1512], ['VIU!', 1526], ['RESGATE!', 1640],
  ['NUNCA', 1696], ['DESÇA!', 1710], ['COMENTA', 1742], ['O QUE', 1756], ['VOCÊ', 1770], ['FARIA?', 1780],
];
const RED = new Set(['ERRO', 'ZUMBIS', 'OUVIRAM', 'MORRE!', 'NÃO', 'DESÇA!', 'ZERO']);
const GREEN = new Set(['PASSO', 'RESGATE!', 'TRANQUE']);

// ---------- câmera ----------
const KEYS: number[][] = [
  [0, 0, 9, 30, 0, 8.8, 0],
  [60, 0, 9.5, 29, 0, 9.3, 0],
  [150, 0, 17.5, 10, 0, 17.5, 0],
  [390, 0.3, 17.5, 9.5, 0, 17.5, 0],
  [570, 0.6, 17.5, 8.5, 0.4, 17.4, 0],
  [640, 0.9, 17.5, 8, 0.5, 17.4, 0],
  [700, 0, 9, 30, 0, 8.8, 0],
  [770, 0, 9, 30, 0, 8.8, 0],
  [785, -1.8, 17.8, 11, -2.8, 17.5, 0],
  [815, -1.8, 17.8, 11, -2.8, 17.5, 0],
  [910, -1.8, 1.0, 11, -2.8, 0.8, 0],
  [960, -1.8, 1.0, 11, -2.8, 0.8, 0],
  [961, 0, 17.5, 10, 0, 17.5, 0],
  [1139, 0, 17.5, 9.5, 0, 17.4, 0],
  [1140, 0, 19.2, 11, 0, 18.9, 0],
  [1500, 0, 19.4, 11.5, 0.3, 19.2, 0],
  [1640, 0, 19.8, 12.5, 0.3, 19.9, 0],
  [1760, 0, 14.5, 30, 0, 13.5, 0],
  [1800, 0, 14.5, 32, 0, 13.5, 0],
];
const descP = (f: number) => 12 * seg(f, 815, 905);
const descY = (f: number) => F13 - descP(f) * HF;

const camAt = (f: number) => {
  if (f >= 815 && f <= 905) {
    const hy = descY(f);
    return {p: [-1.8, hy + 0.9, 11], l: [-2.8, hy + 0.7, 0]};
  }
  let i = 0;
  while (i < KEYS.length - 2 && f >= KEYS[i + 1][0]) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = ease(seg(f, a[0], b[0]));
  const v = [1, 2, 3, 4, 5, 6].map((k) => lerp(a[k], b[k], t));
  return {p: v.slice(0, 3), l: v.slice(3, 6)};
};

const Cam: React.FC<{frame: number}> = ({frame}) => {
  const {camera} = useThree();
  const c = camAt(frame);
  const shake = frame >= 912 && frame < 960 ? Math.sin(frame * 3) * 0.06 : 0;
  camera.position.set(c.p[0] + shake, c.p[1], c.p[2]);
  camera.lookAt(c.l[0], c.l[1], c.l[2]);
  return null;
};

// ---------- peças do cenário ----------
const Building: React.FC = () => (
  <>
    {Array.from({length: 13}).map((_, k) => {
      const y = k * HF;
      return (
        <group key={k}>
          <mesh position={[0, y, 0]}><boxGeometry args={[4.4, 0.12, 3]} /><meshStandardMaterial color="#6b7280" /></mesh>
          <mesh position={[0, y + HF / 2, -1.45]}><boxGeometry args={[4.4, HF, 0.1]} /><meshStandardMaterial color={k % 2 ? '#b8c0cc' : '#a9b3c2'} /></mesh>
          {[-2.2, 2.2].map((x) => <mesh key={x} position={[x, y + HF / 2, 0]}><boxGeometry args={[0.12, HF, 3]} /><meshStandardMaterial color="#8a93a3" /></mesh>)}
          {k < 12 && [-1.2, 1.2].map((x) => (
            <mesh key={x} position={[x, y + 0.75, -1.38]}>
              <boxGeometry args={[0.8, 0.5, 0.02]} />
              <meshStandardMaterial color={(k + (x > 0 ? 1 : 0)) % 3 === 0 ? '#ffb347' : '#2b3a5a'} emissive={(k + (x > 0 ? 1 : 0)) % 3 === 0 ? '#ff9a2e' : '#000'} emissiveIntensity={0.4} />
            </mesh>
          ))}
        </group>
      );
    })}
    {/* telhado */}
    <mesh position={[0, 13 * HF, 0]}><boxGeometry args={[4.6, 0.14, 3.2]} /><meshStandardMaterial color="#5b616d" /></mesh>
    {/* torre de escada */}
    <mesh position={[TX, 6.5 * HF, -1.4]}><boxGeometry args={[1.3, 13 * HF, 0.06]} /><meshStandardMaterial color="#9aa4b4" /></mesh>
    <mesh position={[TX - 0.65, 6.5 * HF, 0]}><boxGeometry args={[0.06, 13 * HF, 2.8]} /><meshStandardMaterial color="#7f889a" /></mesh>
    {Array.from({length: 12}).map((_, i) => (
      <mesh key={i} position={[TX, F13 - i * HF - HF / 2, 0.3]} rotation={[0, 0, i % 2 === 0 ? -1.0 : 1.0]}>
        <boxGeometry args={[1.66, 0.08, 0.6]} /><meshStandardMaterial color="#d0d5dd" />
      </mesh>
    ))}
    <mesh position={[TX, F13 + 0.0, 0.3]}><boxGeometry args={[1.3, 0.1, 0.8]} /><meshStandardMaterial color="#d0d5dd" /></mesh>
    {/* rua e cidade ao fundo */}
    <mesh position={[0, -0.1, 4]}><boxGeometry args={[60, 0.2, 40]} /><meshStandardMaterial color="#3a3a42" /></mesh>
    {Array.from({length: 14}).map((_, i) => (
      <mesh key={i} position={[-18 + i * 2.9, (4 + rand(i) * 18) / 2, -9 - rand(i + 4) * 6]}>
        <boxGeometry args={[2.4, 4 + rand(i) * 18, 2.4]} /><meshStandardMaterial color="#241438" />
      </mesh>
    ))}
  </>
);

const Rails: React.FC = () => (
  <>
    <mesh position={[0, ROOF + 0.25, -1.5]}><boxGeometry args={[4.6, 0.06, 0.06]} /><meshStandardMaterial color="#adb5bd" /></mesh>
    {[-2.3, 2.3].map((x) => <mesh key={x} position={[x, ROOF + 0.25, 0]}><boxGeometry args={[0.06, 0.06, 3.0]} /><meshStandardMaterial color="#adb5bd" /></mesh>)}
    <mesh position={[1.7, ROOF + 0.3, -0.9]}><boxGeometry args={[0.9, 0.5, 0.7]} /><meshStandardMaterial color="#9ca3af" /></mesh>
    <mesh position={[-1.9, ROOF + 0.8, -1.1]}><cylinderGeometry args={[0.015, 0.015, 1.5, 6]} /><meshStandardMaterial color="#888" /></mesh>
  </>
);

const SosSign: React.FC = () => {
  const S = ['111', '100', '111', '001', '111'], O = ['111', '101', '101', '101', '111'];
  const letters = [S, O, S];
  return (
    <group position={[-0.9, ROOF + 0.55, -0.9]}>
      <mesh position={[0, 0.1, 0]}><boxGeometry args={[1.7, 0.8, 0.05]} /><meshStandardMaterial color="#f8f9fa" /></mesh>
      {[-0.7, 0.7].map((x) => <mesh key={x} position={[x, -0.4, -0.02]}><boxGeometry args={[0.06, 0.5, 0.05]} /><meshStandardMaterial color="#7a4a25" /></mesh>)}
      {letters.map((L, li) => L.map((row, r) => row.split('').map((c, cc) => c === '1' && (
        <mesh key={`${li}-${r}-${cc}`} position={[-0.52 + li * 0.52 + cc * 0.1, 0.3 - r * 0.1, 0.04]}><boxGeometry args={[0.09, 0.09, 0.03]} /><meshStandardMaterial color="#e63946" /></mesh>
      ))))}
    </group>
  );
};

const Heli: React.FC<{frame: number; x: number; y: number; tilt: number}> = ({frame, x, y, tilt}) => (
  <group position={[x, y, 0.2]} rotation={[0, 0, tilt]} scale={0.9}>
    <mesh scale={[1.25, 0.75, 0.75]}><sphereGeometry args={[0.5, 20, 16]} /><meshStandardMaterial color="#d62828" /></mesh>
    <mesh position={[-0.45, 0.05, 0.12]} scale={[0.6, 0.6, 0.6]}><sphereGeometry args={[0.35, 14, 12]} /><meshStandardMaterial color="#9fd8ff" /></mesh>
    <mesh position={[1.0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.1, 0.05, 1.2, 10]} /><meshStandardMaterial color="#d62828" /></mesh>
    <mesh position={[1.55, 0.3, 0]}><boxGeometry args={[0.08, 0.4, 0.04]} /><meshStandardMaterial color="#d62828" /></mesh>
    <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.04, 0.04, 0.2, 8]} /><meshStandardMaterial color="#333" /></mesh>
    <group position={[0, 0.58, 0]} rotation={[0, frame * 0.9, 0]}>
      <mesh><boxGeometry args={[2.6, 0.03, 0.14]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[2.6, 0.03, 0.14]} /><meshStandardMaterial color="#222" /></mesh>
    </group>
    {[-0.25, 0.25].map((z) => <mesh key={z} position={[0, -0.5, z]}><boxGeometry args={[1.3, 0.04, 0.05]} /><meshStandardMaterial color="#333" /></mesh>)}
    {[-0.4, 0.4].map((x2) => <mesh key={x2} position={[x2, -0.3, 0]}><boxGeometry args={[0.04, 0.4, 0.5]} /><meshStandardMaterial color="#333" /></mesh>)}
  </group>
);

// ---------- zumbis da rua ----------
const NZ = 16;
const ZS = Array.from({length: NZ}, (_, i) => ({
  spread: [(rand(i + 1) - 0.5) * 14, 3.5 + rand(i + 9) * 6] as [number, number],
  cluster: [(rand(i + 3) - 0.5) * 6.4, 2.0 + rand(i + 5) * 1.8] as [number, number],
  tower: [TX + (rand(i + 7) - 0.5) * 2.2, 0.5 + rand(i + 11) * 1.4] as [number, number],
  seed: i * 2.1,
}));
const zpos = (z: (typeof ZS)[number], f: number) => {
  let a = z.spread, b = z.spread, t = 0;
  if (f < 650) { a = b = z.spread; }
  else if (f < 750) { a = z.spread; b = z.cluster; t = ease(seg(f, 650, 750)); }
  else if (f < 880) { a = b = z.cluster; }
  else if (f < 915) { a = z.cluster; b = z.tower; t = ease(seg(f, 880, 915)); }
  else if (f < 960) { a = b = z.tower; }
  else { a = b = z.cluster; }
  const moving = (f >= 650 && f < 750) || (f >= 880 && f < 915) || f < 650;
  return {x: lerp(a[0], b[0], t) + Math.sin(f * 0.02 + z.seed) * 0.15, z: lerp(a[1], b[1], t), moving};
};

// ---------- estado do herói por frame ----------
type HS_ = {pos: [number, number, number]; rotY: number; pose: any; zombie?: boolean; fat?: number; face?: any};
const heroAt = (f: number): HS_ => {
  const R = -Math.PI / 2;
  if (f < 100) return {pos: [0.9, F13, 0.3], rotY: 0, pose: 'idle'};
  if (f < 180) return {pos: [0.9, F13, 0.3], rotY: 0, pose: 'scared'};
  if (f < 200) return {pos: [0.9, F13, 0.3], rotY: R, pose: 'idle'};
  if (f < 290) return {pos: [lerp(0.9, -1.2, seg(f, 200, 290)), F13, 0.3], rotY: R, pose: 'walk'};
  if (f < 310) return {pos: [lerp(-1.2, 1.7, seg(f, 290, 310)), F13, 0.3], rotY: -R, pose: 'run'};
  if (f < 380) return {pos: [lerp(1.7, 0.1 + 0.0, seg(f, 310, 380)) + 0.0, F13, 0.3], rotY: R, pose: 'walk'};
  if (f < 390) return {pos: [0.1, F13, 0.3], rotY: 0.0, pose: 'idle'};
  if (f < 640) return {pos: [0.95, F13, 0.4], rotY: -0.6, pose: f < 520 ? 'point' : 'idle'};
  if (f < 745) return {pos: [0.95, F13, 0.4], rotY: -0.3, pose: 'scared'};
  if (f < 785) return {pos: [0.95, F13, 0.4], rotY: -0.3, pose: 'idle'};
  if (f < 815) return {pos: [TX - 0.45, F13, 0.3], rotY: 0.6, pose: 'idle'};
  if (f < 905) {
    const p = descP(f); const i = Math.min(11, Math.floor(p)); const u = p - i;
    const even = i % 2 === 0;
    return {pos: [TX + (even ? -0.45 + 0.9 * u : 0.45 - 0.9 * u), descY(f), 0.3], rotY: even ? Math.PI / 2 : -Math.PI / 2, pose: 'run'};
  }
  if (f < 915) return {pos: [TX + 0.45, 0.06, 0.3], rotY: 0.3, pose: 'scared'};
  if (f < 960) return {pos: [TX + 0.45, 0.06, 0.3], rotY: 0.3, pose: 'zombie', zombie: true};
  if (f < 1140) {
    const fat = 1 + 0.45 * seg(f, 1030, 1090);
    return {pos: [0.95, F13, 0.4], rotY: -0.5, pose: 'idle', fat, face: f > 1100 ? 'neutral' : 'happy'};
  }
  if (f < 1640) return {pos: [0.6, ROOF, 0.3], rotY: 0, pose: 'wave'};
  const jump = Math.abs(Math.sin(f * 0.25)) * 0.25;
  return {pos: [0.6, ROOF + jump, 0.3], rotY: 0, pose: 'wave'};
};

// pisca-pisca do SOS (frames de 1290 a 1520)
const beamOn = (f: number) => {
  if (f < 1290 || f > 1520) return false;
  const pat: [number, number][] = [];
  [6, 6, 6, 18, 18, 18, 6, 6, 6].forEach((on) => pat.push([on, 6]));
  const cycle = pat.reduce((s, [a, b]) => s + a + b, 0) + 30;
  let t = (f - 1290) % cycle;
  for (const [on, off] of pat) { if (t < on) return true; t -= on + off; }
  return false;
};

const Table: React.FC<{x: number}> = ({x}) => (
  <group position={[x, F13, 0.3]}>
    <mesh position={[0, 0.4, 0]}><boxGeometry args={[1.1, 0.06, 0.6]} /><meshStandardMaterial color="#b07a43" /></mesh>
    {[[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].map((l, i) => <mesh key={i} position={[l[0], 0.19, l[1]]}><boxGeometry args={[0.06, 0.38, 0.06]} /><meshStandardMaterial color="#8b5a2b" /></mesh>)}
  </group>
);
const Shelf: React.FC<{x: number}> = ({x}) => (
  <group position={[x, F13, 0.3]}>
    <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.3, 1.0, 0.7]} /><meshStandardMaterial color="#8b5a2b" /></mesh>
    {[0.25, 0.5, 0.75].map((y, i) => <mesh key={i} position={[0.16, y, 0]}><boxGeometry args={[0.02, 0.04, 0.68]} /><meshStandardMaterial color="#5b3a1e" /></mesh>)}
  </group>
);

export const PredioScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  // móveis
  const shelfX = frame < 200 ? 0.35 : frame < 290 ? lerp(0.35, -1.75, seg(frame, 200, 290)) : -1.75;
  const tableX = frame < 310 ? 1.0 : frame < 380 ? lerp(1.0, -0.6 + 0.0, seg(frame, 310, 380)) : -0.6;
  const tx = tableX + 0.7 > 0 ? tableX : tableX; // posição final da mesa
  const tableTop = F13 + 0.43;
  const hs = heroAt(frame);
  const look = hs.zombie ? LOOKS.zumbi : LOOKS.garoto;
  const fat = hs.fat ?? 1;

  // rações
  const bottles = [430, 445, 460].map((s) => spring({frame: frame - s, fps, config: {damping: 10, stiffness: 160}}));
  const cans = [470, 484, 498, 512].map((s, i) => frame >= s && !(frame >= 1030 + i * 12) ? spring({frame: frame - s, fps, config: {damping: 10, stiffness: 160}}) : 0);
  const food = cans.filter((c) => c > 0.5).length;
  const showRations = frame >= 470 && frame < 960 || (frame >= 961 && frame < 1140);

  // palavra
  let idx = 0; WORDS.forEach(([, f], i) => { if (frame >= f) idx = i; });
  const [word, wStart] = WORDS[idx];
  const pop = spring({frame: frame - wStart, fps, config: {damping: 12, stiffness: 180}});
  const sc = interpolate(pop, [0, 1], [0.6, 1]);
  const color = RED.has(word) ? '#ff4d4d' : GREEN.has(word) ? '#7CFF6B' : '#ffffff';
  const wshake = (frame >= 912 && frame < 975) ? Math.sin(frame * 2.5) * 10 : 0;

  // chips do topo
  const floorNow = frame >= 815 && frame < 960 ? 13 - Math.min(12, Math.floor(descP(frame))) : (frame >= 1140 ? 14 : 13);
  let chip: [string, string] | null = null;
  if (frame >= 182 && frame < 390) chip = ['PASSO 1: PORTA', '#15803d'];
  else if (frame >= 392 && frame < 570) chip = ['PASSO 2: RAÇÃO', '#15803d'];
  else if (frame >= 574 && frame < 780) chip = ['ERRO #1: RÁDIO', '#b91c1c'];
  else if (frame >= 780 && frame < 960) chip = ['ERRO FATAL', '#b91c1c'];
  else if (frame >= 984 && frame < 1140) chip = ['ERRO #2: COMIDA', '#b91c1c'];
  else if (frame >= 1144 && frame < 1500) chip = ['PASSO 3: SOS', '#15803d'];
  else if (frame >= 1500 && frame < 1700) chip = ['RESGATE!', '#15803d'];

  const dead = frame >= 915 && frame < 960;
  const deadA = dead ? interpolate(frame, [915, 925, 955, 960], [0, 0.6, 0.6, 0.0]) : 0;

  // helicóptero
  const hp = seg(frame, 1520, 1625);
  const heliX = frame < 1520 ? 20 : lerp(9, 1.5, ease(hp));
  const heliY = (frame < 1520 ? 30 : lerp(24, 21.6, ease(hp))) + Math.sin(frame * 0.1) * 0.06;
  const ropeOn = frame >= 1625;
  const ropeLen = (heliY - 0.5) - ROOF;

  // feixe da lanterna
  const hand: [number, number, number] = [hs.pos[0] + 0.25, hs.pos[1] + 0.78, 0.3];
  const a = 0.35;

  const radioOn = frame >= 575 && frame < 765;
  const ringT = (frame - 600) % 30;

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#2a1233, #8a3a1c)'}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 40, position: [0, 9.5, 26]}}>
        <Cam frame={frame} />
        <ambientLight intensity={1.5} color="#ffe2c2" />
        <hemisphereLight args={['#ffd9b0', '#6b4a3a', 0.7]} />
        <directionalLight position={[6, 22, 14]} intensity={1.5} color="#ffbf8a" />
        <Building />
        {frame >= 1139 && <Rails />}
        {frame >= 1139 && <SosSign />}

        {/* mobília do 13º andar */}
        <mesh position={[-2.12, F13 + 0.52, 0.3]}><boxGeometry args={[0.08, 1.05, 0.55]} /><meshStandardMaterial color="#6b4423" /></mesh>
        <mesh position={[1.7, F13 + 0.18, -0.85]}><boxGeometry args={[0.9, 0.36, 1.1]} /><meshStandardMaterial color="#4f6db3" /></mesh>
        <Shelf x={shelfX} />
        <Table x={tableX} />

        {/* itens na mesa */}
        {frame >= 430 && (
          <>
            {bottles.map((b, i) => <WaterBottle key={i} position={[tableX - 0.2 + i * 0.12, tableTop + 0.1 * b, 0.3]} scale={0.3 * b} />)}
            {cans.map((c, i) => c > 0 && <CannedFood key={i} position={[tableX + 0.18 + i * 0.1, tableTop + 0.06 * c, 0.3]} scale={0.28 * c} />)}
          </>
        )}
        {radioOn && <Radio position={[tableX - 0.42, tableTop + 0.12, 0.3]} scale={0.35} />}
        {radioOn && [0, 1, 2].map((r) => {
          const t = ((frame - 600 + r * 10) % 30) / 30;
          return <mesh key={r} position={[tableX - 0.42, tableTop + 0.15, 0.3]} scale={0.3 + t * 2.2}><torusGeometry args={[0.5, 0.025, 8, 36]} /><meshBasicMaterial color="#ffd23f" transparent opacity={0.8 * (1 - t)} /></mesh>;
        })}

        {/* herói */}
        <group position={hs.pos} scale={[fat, 1, fat]}>
          <Hero frame={frame} pose={hs.pose} face={hs.face} look={look} rotY={hs.rotY} scale={HS} />
        </group>
        {frame >= 1200 && frame < 1640 && (
          <>
            <Flashlight position={[hand[0] + 0.05, hand[1] + 0.05, 0.3]} rotation={[0, 0, 0.9]} scale={0.32} />
            {beamOn(frame) && (
              <mesh position={[hand[0] + Math.sin(a) * 0.95, hand[1] + Math.cos(a) * 0.95, 0.3]} rotation={[0, 0, Math.PI - a]}>
                <coneGeometry args={[0.45, 1.9, 20, 1, true]} /><meshBasicMaterial color="#fff6a8" transparent opacity={0.45} side={2} />
              </mesh>
            )}
          </>
        )}

        {/* zumbis da rua */}
        {ZS.map((z, i) => {
          const p = zpos(z, frame);
          const target = frame >= 880 && frame < 960 ? [TX, 0.3] : [0, -2];
          return (
            <Hero key={i} frame={frame} pose="zombie" look={LOOKS.zumbi} position={[p.x, 0, p.z]} rotY={Math.atan2(target[0] - p.x, target[1] - p.z)} scale={0.72}
              shirt={['#5b5266', '#4a6a7a', '#7a4a4a', '#5a6a4a'][i % 4]} />
          );
        })}

        {/* helicóptero */}
        {frame >= 1500 && <Heli frame={frame} x={heliX} y={heliY} tilt={frame < 1625 ? -0.18 * (1 - hp) : Math.sin(frame * 0.08) * 0.03} />}
        {ropeOn && <mesh position={[heliX - 0.3, ROOF + ropeLen / 2 + 0.0, 0.2]}><cylinderGeometry args={[0.012, 0.012, ropeLen, 6]} /><meshStandardMaterial color="#e5d9b6" /></mesh>}
      </ThreeCanvas>

      {/* vinheta e perigo */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)'}} />
      {deadA > 0 && <AbsoluteFill style={{background: `rgba(190,0,0,${deadA})`}} />}

      {/* HUD */}
      <div style={{position: 'absolute', top: 120, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, fontFamily: 'Poppins, sans-serif', fontWeight: 700}}>
        <div style={{fontSize: 64, color: '#ffd23f', background: '#1a1a2e', border: '7px solid #ffd23f', borderRadius: 22, padding: '6px 36px'}}>
          {frame >= 1140 ? 'TELHADO' : `ANDAR ${floorNow}`}
        </div>
        {chip && <div style={{fontSize: 48, color: '#fff', background: chip[1], border: '6px solid #fff', borderRadius: 18, padding: '4px 30px'}}>{chip[0]}</div>}
        {showRations && (
          <div style={{fontSize: 42, color: '#fff', background: '#1a1a2e', border: '5px solid #fff', borderRadius: 16, padding: '4px 26px', display: 'flex', gap: 28}}>
            <span style={{color: '#7fd6ff'}}>ÁGUA: 3</span>
            <span style={{color: food === 0 ? '#ff4d4d' : '#ffd23f'}}>COMIDA: {food}</span>
          </div>
        )}
      </div>

      {/* VOCÊ MORREU */}
      {dead && (
        <div style={{position: 'absolute', top: 760, width: '100%', textAlign: 'center', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 130, color: '#fff', textShadow: '0 8px 0 #000, 6px 0 0 #000, -6px 0 0 #000', transform: `translateX(${Math.sin(frame * 3) * 8}px)`}}>
          VOCÊ MORREU
        </div>
      )}

      {/* legenda: uma palavra por vez */}
      {!dead && (
        <div style={{position: 'absolute', bottom: 230, width: '100%', textAlign: 'center'}}>
          <span style={{display: 'inline-block', transform: `translateX(${wshake}px) scale(${sc})`, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 124, color, textShadow: '0 8px 0 #000, 6px 0 0 #000, -6px 0 0 #000, 0 -6px 0 #000'}}>
            {word}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
