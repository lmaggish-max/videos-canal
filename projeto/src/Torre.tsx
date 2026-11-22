import React from 'react';
import {AbsoluteFill, Easing, interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {Hero, LOOKS, HeroPose, Look} from './Hero';
import {WaterBottle, CannedFood, Radio, Flashlight, Backpack, SleepingBag} from './Props';
import warp from './warp.json';
import WORDS_N from './words.json';

// ===================== constantes =====================
const FH = 1.7, BW = 6, BD = 3.6, N = 13;
const F13 = 12 * FH;      // chão do 13º andar
const ROOF = 13 * FH;     // telhado
const rand = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ===================== roteiro (palavra, frame, cor) =====================
const R = '#ff4d4d', Y = '#ffd23f', G = '#4dff88';
const WORDS: [string, number, string?][] = [
  ['VOCÊ', 0], ['ESTÁ', 10], ['NO', 20], ['13º', 27], ['ANDAR', 40],
  ['E', 68], ['O', 74], ['MUNDO', 80], ['ACABOU', 92],
  ['REGRA', 118], ['Nº1:', 130], ['NÃO DESÇA!', 143, R],
  ['SE', 156], ['DESCER...', 166], ['VOCÊ', 188], ['MORRE', 198, R],
  ['ENTÃO,', 245], ['TRANQUE', 258], ['A', 272], ['PORTA', 278],
  ['EMPILHE', 305], ['MÓVEIS', 322], ['ATÉ', 340], ['NÃO', 352], ['ENTRAR', 362], ['NADA', 376],
  ['PRONTO.', 420], ['SEGURO', 440], ['POR', 455], ['ENQUANTO', 464],
  ['AGORA', 485], ['UM', 498], ['RÁDIO', 506], ['PARA', 522], ['OUVIR', 532], ['NOTÍCIAS', 544],
  ['ERRO!', 566, R], ['VOLUME', 590], ['NO', 603], ['MÁXIMO', 610],
  ['OS', 632], ['ZUMBIS', 640], ['OUVIRAM', 654, R], ['RÁDIO', 692], ['DESLIGADO', 704],
  ['REGRA', 725], ['3:', 740], ['RACIONE', 752], ['ÁGUA', 768], ['E', 780], ['COMIDA', 786],
  ['ERRO!', 812, R], ['ELE', 832], ['BEBEU', 842], ['TUDO', 856], ['DE UMA VEZ', 868],
  ['AGORA', 910], ['SÓ', 922], ['RESTA', 930], ['UMA', 944], ['GARRAFA', 950],
  ['NOITE.', 966], ['APAGUE', 986], ['A', 1002], ['LUZ', 1008],
  ['ERRO!', 1032, R], ['LANTERNA', 1052], ['NA', 1070], ['JANELA', 1076],
  ['ELES', 1100], ['VIRAM', 1112], ['A', 1126], ['LUZ', 1132, R],
  ['COBRE', 1162], ['A', 1176], ['JANELA', 1182],
  ['DIA', 1206], ['10:', 1218], ['A', 1232], ['COMIDA', 1238], ['ACABOU', 1252, R],
  ['VAI', 1288], ['DESCER?', 1298, Y],
  ['NÃO!', 1342, R], ['NÃO DESÇA!', 1352, R],
  ['ELE', 1398], ['AGUENTOU', 1408], ['MAIS', 1432], ['UM', 1442], ['DIA', 1450],
  ['DIA', 1506], ['14:', 1518], ['UM', 1534], ['HELICÓPTERO!', 1542, Y],
  ['RESGATE!', 1590, G],
  ['A', 1636], ['REGRA', 1642], ['É', 1656], ['SIMPLES:', 1664],
  ['NÃO', 1692], ['DESÇA.', 1702, R],
  ['SEGUE', 1742], ['PARA', 1754], ['A', 1764], ['PARTE', 1770], ['2', 1784, Y],
];
const STAMPS = [566, 812, 1032];
const oldFor = (nf: number) => {
  const n = warp.new, o = warp.old;
  if (nf <= n[0]) return o[0];
  for (let i = 0; i < n.length - 1; i++) if (nf <= n[i + 1]) return o[i] + (o[i + 1] - o[i]) * (nf - n[i]) / (n[i + 1] - n[i]);
  return o[o.length - 1] + (nf - n[n.length - 1]);
};
const colorFor = (w: string) => {
  const k = w.replace(/[^\wÀ-ÿ]/g, '').toLowerCase();
  if (['erro', 'desça', 'desce', 'volta'].includes(k)) return '#ff4d4d';
  if (['catorze', 'dez', 'helicóptero', 'salvo', 'será'].includes(k)) return '#ffd23f';
  return undefined;
};
const FLASHES = [196, 1360];

// ===================== câmera =====================
type KF = {f: number; p: [number, number, number]; t: [number, number, number]; cut?: boolean};
const INT: KF = {f: 0, p: [0, 21.3, 12.6], t: [0, 21.3, 0]};
const WIDE = {p: [0, 12, 30] as [number, number, number], t: [0, 11.5, 0] as [number, number, number]};
const DEATH1 = {p: [-1.5, 2.8, 11.5] as [number, number, number], t: [-1, 1.3, 0] as [number, number, number]};
const DEATH2 = {p: [-1.5, 2.4, 9.8] as [number, number, number], t: [-1, 1.3, 0] as [number, number, number]};
const CAM: KF[] = [
  {f: 0, ...WIDE},
  {f: 145, p: INT.p, t: INT.t}, {f: 149, p: INT.p, t: INT.t},
  {f: 150, ...DEATH1, cut: true}, {f: 239, ...DEATH2},
  {f: 240, p: INT.p, t: INT.t, cut: true},
  {f: 600, p: INT.p, t: INT.t}, {f: 640, ...WIDE}, {f: 700, ...WIDE}, {f: 745, p: INT.p, t: INT.t},
  {f: 1090, p: INT.p, t: INT.t}, {f: 1125, ...WIDE}, {f: 1165, ...WIDE}, {f: 1195, p: INT.p, t: INT.t},
  {f: 1335, p: INT.p, t: INT.t},
  {f: 1340, ...DEATH1, cut: true}, {f: 1379, ...DEATH2},
  {f: 1380, p: INT.p, t: INT.t, cut: true},
  {f: 1499, p: INT.p, t: INT.t},
  {f: 1500, p: [0, 24.6, 14], t: [0, 24, 0], cut: true},
  {f: 1650, p: [0, 25.0, 13.5], t: [0, 24.4, 0]},
  {f: 1675, p: [2.0, 26.9, 5.8], t: [1.45, 26.65, 1.5]},
  {f: 1800, p: [1.9, 26.85, 5.0], t: [1.45, 26.65, 1.5]},
];
const shakeAmp = (f: number) => {
  let a = 0;
  [...STAMPS].forEach((s) => { if (f >= s && f < s + 14) a = Math.max(a, 0.25 * (1 - (f - s) / 14)); });
  FLASHES.forEach((s) => { if (f >= s - 4 && f < s + 14) a = Math.max(a, 0.45 * (1 - Math.abs(f - s) / 14)); });
  return a;
};
const camAt = (f: number) => {
  let i = 0;
  for (let k = 0; k < CAM.length; k++) if (CAM[k].f <= f) i = k;
  const a = CAM[i], b = CAM[i + 1];
  if (!b || b.cut) return a;
  const t = Easing.inOut(Easing.cubic)(clamp((f - a.f) / (b.f - a.f), 0, 1));
  return {p: [0, 1, 2].map((j) => lerp(a.p[j], b.p[j], t)) as [number, number, number], t: [0, 1, 2].map((j) => lerp(a.t[j], b.t[j], t)) as [number, number, number]};
};
const Cam: React.FC<{frame: number}> = ({frame}) => {
  const {camera} = useThree();
  const c = camAt(frame);
  const s = shakeAmp(frame);
  const sx = Math.sin(frame * 3.7) * s, sy = Math.cos(frame * 4.3) * s;
  camera.position.set(c.p[0] + Math.sin(frame * 0.01) * 0.25 + sx, c.p[1] + sy, c.p[2]);
  camera.lookAt(c.t[0], c.t[1], c.t[2]);
  return null;
};

// ===================== herói =====================
type HK = {f: number; x: number; y: number; z: number; r: number; pose: HeroPose; zom?: boolean};
const A = (f: number, x: number, z: number, r: number, pose: HeroPose): HK => ({f, x, y: F13, z, r, pose});
const GR = (f: number, x: number, z: number, r: number, pose: HeroPose, zom = false): HK => ({f, x, y: 0, z, r, pose, zom});
const HERO: HK[] = [
  A(0, 0.8, -0.3, 0, 'idle'), A(149, 0.8, -0.3, 0, 'idle'),
  GR(150, -1, -1.8, 0, 'walk'), GR(190, -1, 0.6, 0, 'walk'), GR(192, -1, 0.6, 0, 'scared'), GR(200, -1, 0.6, 0, 'zombie', true), GR(239, -1, 0.6, 0, 'zombie', true),
  A(240, 0.8, -0.3, 0, 'idle'), A(266, 0.8, -0.3, -1.57, 'idle'),
  A(268, 0.8, -0.3, -1.57, 'walk'), A(325, -1.3, -0.3, -1.57, 'walk'), A(330, -1.3, -0.3, -1.57, 'point'), A(425, -1.3, -0.3, -1.57, 'point'),
  A(428, -1.3, -0.3, 1.57, 'walk'), A(490, 1.8, -0.3, 1.57, 'walk'), A(495, 1.8, -0.3, 3.14, 'idle'),
  A(550, 1.8, -0.3, 3.14, 'point'), A(572, 1.8, -0.3, 3.14, 'scared'), A(700, 1.8, -0.3, 3.14, 'scared'), A(704, 1.8, -0.3, 3.14, 'idle'),
  A(828, 1.8, -0.3, 3.14, 'idle'), A(832, 1.8, -0.3, 3.14, 'point'), A(862, 1.8, -0.3, 3.14, 'point'), A(866, 1.8, -0.3, 3.14, 'idle'),
  A(906, 1.8, -0.3, 3.14, 'scared'), A(960, 1.8, -0.3, 3.14, 'scared'), A(964, 1.8, -0.3, 3.14, 'idle'),
  A(1040, 1.8, -0.3, 3.14, 'point'), A(1100, 1.8, -0.3, 3.14, 'scared'), A(1160, 1.8, -0.3, 3.14, 'scared'), A(1164, 1.8, -0.3, 3.14, 'idle'),
  A(1200, 1.8, -0.3, 3.14, 'idle'), A(1278, 1.8, -0.3, -1.57, 'idle'), A(1280, 1.8, -0.3, -1.57, 'walk'), A(1335, -1.0, -0.3, -1.57, 'walk'), A(1336, -1.0, -0.3, -1.57, 'point'),
  GR(1337, -1, -0.4, 0, 'walk'), GR(1356, -1, 0.6, 0, 'walk'), GR(1358, -1, 0.6, 0, 'scared'), GR(1364, -1, 0.6, 0, 'zombie', true), GR(1379, -1, 0.6, 0, 'zombie', true),
  A(1380, -1.0, -0.3, 1.57, 'walk'), A(1420, 0.8, -0.3, 1.57, 'walk'), A(1424, 0.8, -0.3, 0, 'idle'), A(1499, 0.8, -0.3, 0, 'idle'),
  {f: 1500, x: 0.6, y: ROOF, z: 0, r: 0.2, pose: 'idle'}, {f: 1545, x: 0.6, y: ROOF, z: 0, r: 0.2, pose: 'point'}, {f: 1560, x: 0.6, y: ROOF, z: 0, r: 0.1, pose: 'wave'}, {f: 1800, x: 0.6, y: ROOF, z: 0, r: 0.1, pose: 'wave'},
];
const heroAt = (f: number) => {
  let i = 0;
  for (let k = 0; k < HERO.length; k++) if (HERO[k].f <= f) i = k;
  const a = HERO[i], b = HERO[i + 1];
  if (!b) return a;
  const t = clamp((f - a.f) / Math.max(1, b.f - a.f), 0, 1);
  return {...a, x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t), r: lerp(a.r, b.r, t)};
};

// ===================== prédio =====================
const WALLS = ['#d8c3a5', '#c9d6c0', '#e0c1c1', '#c3cfe0', '#e6d9a8'];
const Tower: React.FC<{night: number}> = ({night}) => {
  const glass = interpolateColors(night, [0, 1], ['#9ec9e8', '#0a1022']);
  return (
    <>
      {Array.from({length: N}).map((_, i) => {
        const f = i + 1, y0 = i * FH, wall = WALLS[i % 5];
        const lit = rand(f * 3.3) < 0.4 && f !== 13;
        return (
          <group key={f}>
            <mesh position={[0, y0 - 0.1, 0]}><boxGeometry args={[BW + 0.3, 0.2, BD]} /><meshStandardMaterial color="#8b8f98" /></mesh>
            <mesh position={[0, y0 + FH / 2, -BD / 2]}><boxGeometry args={[BW, FH, 0.14]} /><meshStandardMaterial color={wall} /></mesh>
            {[-1, 1].map((s) => <mesh key={s} position={[s * (BW / 2), y0 + FH / 2, 0]}><boxGeometry args={[0.14, FH, BD]} /><meshStandardMaterial color="#a9adb6" /></mesh>)}
            {[-0.4, 1.9].map((x, j) => (
              <mesh key={j} position={[x, y0 + 1.0, -BD / 2 + 0.09]}>
                <boxGeometry args={[1.1, 0.8, 0.04]} />
                <meshStandardMaterial color={lit && j === 0 ? '#ffb347' : glass} emissive={lit && j === 0 ? '#ff9a2e' : '#000'} emissiveIntensity={lit ? night * 1.2 : 0} />
              </mesh>
            ))}
            <mesh position={[-2.4, y0 + 0.62, -BD / 2 + 0.1]}><boxGeometry args={[0.8, 1.24, 0.06]} /><meshStandardMaterial color="#7a4a25" /></mesh>
            {f !== 13 && (
              <>
                <mesh position={[-0.9 + rand(f) * 2.2, y0 + 0.25, -1.2]}><boxGeometry args={[1.3, 0.5, 0.8]} /><meshStandardMaterial color={['#a14a4a', '#4a6fa1', '#6aa14a', '#a18a4a'][i % 4]} /></mesh>
                <mesh position={[2.3, y0 + 0.5, -1.3]}><boxGeometry args={[0.5, 1.0, 0.5]} /><meshStandardMaterial color="#8a6a4a" /></mesh>
              </>
            )}
          </group>
        );
      })}
      {/* telhado */}
      <mesh position={[0, ROOF - 0.1, 0]}><boxGeometry args={[BW + 0.5, 0.2, BD + 0.3]} /><meshStandardMaterial color="#6f737c" /></mesh>
      {[[0, -BD / 2], [-BW / 2, 0], [BW / 2, 0]].map((p, i) => (
        <mesh key={i} position={[p[0], ROOF + 0.2, p[1]]}><boxGeometry args={i === 0 ? [BW + 0.5, 0.4, 0.15] : [0.15, 0.4, BD]} /><meshStandardMaterial color="#8b8f98" /></mesh>
      ))}
      {/* rua */}
      <mesh position={[0, -0.1, 8]}><boxGeometry args={[80, 0.2, 60]} /><meshStandardMaterial color="#4b4b55" /></mesh>
      {/* prédios ao fundo */}
      {[[-9, 14], [-6.5, 9], [6.8, 18], [9.5, 11], [-12, 20], [12.5, 24]].map((b, i) => (
        <mesh key={i} position={[b[0], b[1] / 2, -9 - rand(i) * 4]}><boxGeometry args={[2.6, b[1], 2.6]} /><meshStandardMaterial color="#3a3140" /></mesh>
      ))}
    </>
  );
};

// ===================== zumbis da rua =====================
const CROWD = Array.from({length: 18}, (_, i) => ({
  x0: (rand(i + 1) - 0.5) * 12, z0: 4 + rand(i + 9) * 7,
  bx: ((i % 6) - 2.5) * 1.05 + (rand(i + 20) - 0.5) * 0.4, bz: 2.6 + Math.floor(i / 6) * 0.9,
  a: Math.PI + 0.15 + (i / 18) * (Math.PI - 0.3), ring: 1.3 + 0.5 * (i % 3), seed: i * 2.1,
}));
const ZLOOKS: Look[] = [LOOKS.zumbi, {...LOOKS.zumbi, shirt: '#7a4a4a', hair: '#222'} as Look, {...LOOKS.zumbi, shirt: '#4a6a7a', hair: '#5a3a2a'} as Look];

// ===================== cena =====================
export const Torre: React.FC = () => {
  const nf = useCurrentFrame();
  const frame = oldFor(nf);
  const {fps, width, height} = useVideoConfig();

  const night = interpolate(frame, [955, 985, 1190, 1215], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const gather = interpolate(frame, [600, 690], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dA = interpolate(frame, [150, 196], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * (frame < 240 ? 1 : 0);
  const dB = interpolate(frame, [1340, 1362], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * (frame >= 1340 && frame < 1380 ? 1 : 0);
  const death = Math.max(dA, dB);

  const h = heroAt(frame);
  const heroLook: Look = h.zom ? {...LOOKS.garoto, skin: '#8fbf7a', zombie: true} as Look : LOOKS.garoto;

  const water = Math.round(interpolate(frame, [0, 832, 862, 1150, 1210], [5, 5, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const food = Math.round(interpolate(frame, [0, 300, 600, 900, 1100, 1250], [5, 5, 4, 3, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const day = Math.min(14, 1 + Math.floor(frame / 128.6));

  // palavra atual (tempo da narração)
  let wi = -1; (WORDS_N as [string, number, number][]).forEach((w, i) => { if (nf >= w[1]) wi = i; });
  const cur = wi >= 0 ? (WORDS_N as [string, number, number][])[wi] : null;
  const showWord = !!cur && nf <= cur[2] + 5;
  const word = cur ? cur[0].replace(/[,:]$/, '').toUpperCase() : '';
  const wColor = cur ? colorFor(cur[0]) : undefined;
  const pop = spring({frame: nf - (cur ? cur[1] : 0), fps, config: {damping: 12, stiffness: 180}});
  const wScale = interpolate(pop, [0, 1], [0.6, 1]);

  // flash vermelho
  let flash = 0;
  FLASHES.forEach((s) => { flash = Math.max(flash, interpolate(frame, [s, s + 2, s + 12], [0, 0.75, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})); });
  // carimbo ERRO!
  let stamp = -1; STAMPS.forEach((s) => { if (frame >= s && frame < s + 45) stamp = frame - s; });
  const stampPop = stamp >= 0 ? spring({frame: stamp, fps, config: {damping: 9, stiffness: 220}}) : 0;

  const bg1 = interpolateColors(night, [0, 1], ['#5b3d52', '#070b1f']);
  const bg2 = interpolateColors(night, [0, 1], ['#e29a5a', '#1a2550']);

  const inRoom = frame >= 240 && frame < 1500 && !(frame >= 1340 && frame < 1380);
  const boxes: [number, number, number, number][] = [[-2.8, 0.28, -1.35, 330], [-2.2, 0.28, -1.35, 350], [-1.6, 0.28, -1.35, 370], [-2.5, 0.84, -1.35, 390], [-1.9, 0.84, -1.35, 410], [-2.2, 1.4, -1.35, 424]];

  const radioOn = frame >= 560 && frame < 692;
  const beamOn = frame >= 1040 && frame < 1162;
  const cover = frame >= 1165;
  const heli = frame >= 1500;
  const hp = frame < 1590 ? [lerp(-14, 0.4, Easing.out(Easing.cubic)((frame - 1500) / 90)), lerp(31, 26.6, Easing.out(Easing.cubic)((frame - 1500) / 90)), 1.5] : [0.4 + Math.sin(frame * 0.05) * 0.15, 26.6 + Math.sin(frame * 0.09) * 0.12, 1.5];
  const rotor = frame * 1.3;

  return (
    <AbsoluteFill style={{background: `linear-gradient(${bg1}, ${bg2})`}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 45, position: [0, 12, 30]}}>
        <Cam frame={frame} />
        <ambientLight intensity={interpolate(night, [0, 1], [1.3, 0.5])} color={night > 0.5 ? '#9fb4ff' : '#ffe2c4'} />
        <directionalLight position={[6, 14, 12]} intensity={interpolate(night, [0, 1], [1.5, 0.4])} color={night > 0.5 ? '#8fa8ff' : '#ffc590'} />
        {night > 0 && <pointLight position={[0, F13 + 1.4, 0.5]} intensity={night * 30} distance={9} decay={2} color="#ffcf8a" />}
        <Tower night={night} />

        {/* itens na mesa do 13º andar */}
        <group>
          <mesh position={[1.7, F13 + 0.72, -1.2]}><boxGeometry args={[2.2, 0.12, 0.9]} /><meshStandardMaterial color="#8b5a2b" /></mesh>
          {[[0.7, -1.55], [2.7, -1.55], [0.7, -0.85], [2.7, -0.85]].map((l, i) => <mesh key={i} position={[l[0], F13 + 0.36, l[1]]}><boxGeometry args={[0.08, 0.72, 0.08]} /><meshStandardMaterial color="#6b4423" /></mesh>)}
          {Array.from({length: water}).map((_, i) => <WaterBottle key={i} position={[0.85 + i * 0.27, F13 + 0.78 + 0.14, -1.4]} scale={0.45} />)}
          {Array.from({length: food}).map((_, i) => <CannedFood key={i} position={[0.85 + i * 0.27, F13 + 0.78 + 0.09, -1.02]} scale={0.38} />)}
          <Radio position={[2.35, F13 + 0.78 + 0.13, -1.25]} scale={0.5} />
          <Flashlight position={[2.05, F13 + 0.84, -0.9]} scale={0.5} />
          <Backpack position={[-0.9, F13 + 0.3, -1.3]} scale={0.7} />
          {!cover && <SleepingBag position={[0.2, F13 + 0.18, -1.3]} scale={0.6} />}
        </group>
        {/* barricada */}
        {boxes.map((b, i) => {
          const p = spring({frame: frame - b[3], fps, config: {damping: 11, stiffness: 160}});
          return frame >= b[3] ? <mesh key={i} position={[b[0], F13 + b[1] * p, b[2]]} scale={[1, 1, 1]}><boxGeometry args={[0.58, 0.56, 0.5]} /><meshStandardMaterial color={['#b07a43', '#9b6a38', '#c08a50'][i % 3]} /></mesh> : null;
        })}
        {/* ondas do rádio */}
        {radioOn && [0, 1, 2].map((k) => {
          const t = ((frame - 560 + k * 10) % 30) / 30;
          return <mesh key={k} position={[2.35, F13 + 1.05, -1.0]} scale={0.4 + t * 3}><torusGeometry args={[0.3, 0.025, 8, 28]} /><meshBasicMaterial color="#ffd23f" transparent opacity={1 - t} /></mesh>;
        })}
        {/* feixe da lanterna */}
        {beamOn && <mesh position={[1.7, F13 + 1.0, -1.15]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.65, 1.7, 24, 1, true]} /><meshBasicMaterial color="#fff3a0" transparent opacity={0.3} side={2} /></mesh>}
        {/* cobertor na janela */}
        {cover && <mesh position={[1.9, F13 + 1.0, -BD / 2 + 0.18]}><boxGeometry args={[1.25, 0.95, 0.05]} /><meshStandardMaterial color="#3a86ff" /></mesh>}

        {/* herói */}
        <Hero frame={frame} pose={h.pose} look={heroLook} position={[h.x, h.y, h.z]} rotY={h.r} scale={0.9} />

        {/* zumbis da rua */}
        {CROWD.map((z, i) => {
          const px = lerp(z.x0, z.bx, gather), pz = lerp(z.z0, z.bz, gather);
          const tx = -1 + Math.cos(z.a) * z.ring, tz = 0.3 + Math.sin(z.a) * z.ring;
          const x = lerp(px, tx, death), zz = lerp(pz, tz, death);
          const rot = death > 0.05 ? Math.atan2(-1 - x, 0.6 - zz) : Math.PI + x * 0.03;
          return <Hero key={i} frame={frame + z.seed * 7} pose="zombie" look={ZLOOKS[i % 3]} position={[x, 0, zz]} rotY={rot} scale={0.9} />;
        })}

        {/* helicóptero */}
        {heli && (
          <group position={hp as [number, number, number]} rotation={[0, 0, -0.06]}>
            <mesh><boxGeometry args={[1.7, 0.75, 0.85]} /><meshStandardMaterial color="#e63946" /></mesh>
            <mesh position={[1.0, 0.02, 0]} scale={[0.95, 0.95, 1]}><sphereGeometry args={[0.46, 18, 14]} /><meshStandardMaterial color="#9fd8ff" transparent opacity={0.8} /></mesh>
            <mesh position={[-1.5, 0.08, 0]}><boxGeometry args={[1.6, 0.2, 0.2]} /><meshStandardMaterial color="#c92a38" /></mesh>
            <mesh position={[-2.2, 0.3, 0]}><boxGeometry args={[0.15, 0.55, 0.1]} /><meshStandardMaterial color="#c92a38" /></mesh>
            <group position={[1.0, 0.1, 0]} rotation={[0, interpolate(frame, [1655, 1668], [1.57, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), 0]}>
              <mesh><sphereGeometry args={[0.2, 14, 14]} /><meshStandardMaterial color={frame >= 1665 ? '#8fbf7a' : '#ffdcbc'} /></mesh>
              {[-0.07, 0.07].map((x, i) => <mesh key={i} position={[x, 0.04, 0.18]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color={frame >= 1665 ? '#ff2020' : '#111'} emissive={frame >= 1665 ? '#ff0000' : '#000'} emissiveIntensity={0.8} /></mesh>)}
              {frame >= 1665 && <mesh position={[0, -0.08, 0.18]} scale={[1, 1.2, 0.4]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#3a0d0d" /></mesh>}
            </group>
            <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.06, 0.06, 0.2, 8]} /><meshStandardMaterial color="#333" /></mesh>
            <group position={[0, 0.62, 0]} rotation={[0, rotor, 0]}>
              <mesh><boxGeometry args={[3.4, 0.04, 0.14]} /><meshStandardMaterial color="#222" /></mesh>
              <mesh rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[3.4, 0.04, 0.14]} /><meshStandardMaterial color="#222" /></mesh>
            </group>
            {[-0.35, 0.35].map((z, i) => <mesh key={i} position={[0, -0.55, z]}><boxGeometry args={[1.7, 0.06, 0.06]} /><meshStandardMaterial color="#222" /></mesh>)}
            {[-0.5, 0.5].map((x, i) => [-0.35, 0.35].map((z, j) => <mesh key={`${i}${j}`} position={[x, -0.4, z]}><boxGeometry args={[0.05, 0.3, 0.05]} /><meshStandardMaterial color="#222" /></mesh>))}
          </group>
        )}
      </ThreeCanvas>

      {/* clarão vermelho */}
      <AbsoluteFill style={{background: `rgba(220,0,0,${flash})`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)'}} />
      {death > 0.6 && <AbsoluteFill style={{background: `rgba(120,0,0,${(death - 0.6) * 0.5})`}} />}

      {/* HUD */}
      {frame >= 100 && (
        <div style={{position: 'absolute', top: 120, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
          <div style={{fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 64, color: '#ffd23f', background: '#1a1a2e', border: '8px solid #ffd23f', borderRadius: 24, padding: '8px 36px'}}>DIA {day}/14</div>
          <div style={{display: 'flex', gap: 26, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 34, color: '#fff'}}>
            {[['ÁGUA', water, '#4db8ff'], ['COMIDA', food, '#ffa63d']].map(([n, v, c]) => (
              <div key={n as string} style={{background: '#000a', borderRadius: 16, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 10}}>
                <span>{n}</span>
                {Array.from({length: 5}).map((_, k) => <span key={k} style={{width: 22, height: 22, borderRadius: 6, background: k < (v as number) ? (c as string) : '#ffffff30', display: 'inline-block'}} />)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* carimbo ERRO! */}
      {stamp >= 0 && (
        <div style={{position: 'absolute', top: 520, width: '100%', display: 'flex', justifyContent: 'center', opacity: stamp > 35 ? 1 - (stamp - 35) / 10 : 1}}>
          <div style={{transform: `rotate(-8deg) scale(${0.5 + stampPop * 0.5})`, fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 190, color: '#ff3b3b', border: '14px solid #ff3b3b', borderRadius: 28, padding: '0 40px', background: '#fff', textShadow: '0 0 0 #000'}}>ERRO!</div>
        </div>
      )}

      {/* legenda */}
      {showWord && <div style={{position: 'absolute', bottom: 250, width: '100%', textAlign: 'center'}}>
        <span style={{display: 'inline-block', transform: `scale(${wScale})`, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: word.length > 9 ? 105 : 135, color: wColor ?? '#fff', textShadow: '0 8px 0 #000, 6px 0 0 #000, -6px 0 0 #000, 0 -6px 0 #000'}}>{word}</span>
      </div>}
    </AbsoluteFill>
  );
};
