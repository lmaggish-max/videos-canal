import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Hero, LOOKS, HeroPose, Look} from './Hero';
import * as P from './Props';

const W = 1080, H = 1920;
type Cell = {name: string; sub?: string; cx: number; cy: number; node: (wx: number, wy: number, z: number) => React.ReactNode};

const wx = (px: number, z: number) => (px - W / 2) / z;
const wy = (py: number, z: number) => (H / 2 - py) / z;

const chars: {name: string; sub: string; look: Look; pose: HeroPose; s: number}[] = [
  {name: 'GAROTO', sub: 'Herói do canal', look: LOOKS.garoto, pose: 'wave', s: 1},
  {name: 'GAROTA', sub: 'Exploradora', look: LOOKS.garota, pose: 'idle', s: 1},
  {name: 'VOVÔ', sub: 'O sábio', look: LOOKS.vovo, pose: 'idle', s: 1},
  {name: 'NERD', sub: 'O inventor', look: LOOKS.nerd, pose: 'scared', s: 0.95},
  {name: 'SOLDADO', sub: 'Protetor', look: LOOKS.soldado, pose: 'point', s: 1.05},
  {name: 'ZUMBI', sub: 'Comum', look: LOOKS.zumbi, pose: 'zombie', s: 1},
  {name: 'ZUMBI GRANDÃO', sub: 'Tanque', look: {...LOOKS.zumbi, shirt: '#7a4a4a', skin: '#7fae6a', hair: '#222'} as Look, pose: 'zombie', s: 1.12},
  {name: 'ZUMBI CORREDOR', sub: 'Rápido e perigoso', look: {...LOOKS.zumbi, shirt: '#4a6a7a', hair: '#5a3a2a'} as Look, pose: 'run', s: 1},
];

const items: {name: string; el: React.FC<any>; s?: number}[] = [
  {name: 'GARRAFA DE ÁGUA', el: P.WaterBottle},
  {name: 'LATA DE COMIDA', el: P.CannedFood},
  {name: 'PÃO', el: P.Bread},
  {name: 'MOCHILA', el: P.Backpack, s: 0.95},
  {name: 'RÁDIO', el: P.Radio, s: 0.95},
  {name: 'LANTERNA', el: P.Flashlight},
  {name: 'KIT MÉDICO', el: P.FirstAid, s: 0.95},
  {name: 'TACO', el: P.Bat, s: 0.9},
  {name: 'MAPA', el: P.MapItem, s: 1.1},
  {name: 'PILHAS', el: P.Batteries, s: 1.2},
  {name: 'BINÓCULOS', el: P.Binoculars, s: 1.1},
  {name: 'SACO DE DORMIR', el: P.SleepingBag},
];

const scenery: {name: string; el: React.FC<any>; s?: number}[] = [
  {name: 'PRÉDIO ABANDONADO', el: P.Building, s: 0.9},
  {name: 'CARRO ABANDONADO', el: P.CarWreck},
  {name: 'BARRICADA', el: P.Barricade},
  {name: 'ACAMPAMENTO', el: P.Camp},
  {name: 'TORRE DE VIGIA', el: P.WatchTower, s: 0.85},
  {name: 'ÁRVORE SECA', el: P.DeadTree},
];

const Page: React.FC<{title: string; sub: string; z: number; cw: number; ch: number; cells: Cell[]}> = ({title, sub, z, cw, ch, cells}) => (
  <AbsoluteFill style={{background: 'linear-gradient(#2a1233, #8a3a1c)'}}>
    <div style={{position: 'absolute', top: 70, width: '100%', textAlign: 'center', fontFamily: 'Poppins, sans-serif', fontWeight: 700}}>
      <div style={{fontSize: 96, color: '#ffd23f', textShadow: '0 6px 0 #000'}}>{title}</div>
      <div style={{fontSize: 38, color: '#fff', opacity: 0.85, marginTop: 4}}>{sub}</div>
    </div>
    {cells.map((c, i) => (
      <div key={i} style={{position: 'absolute', left: c.cx - cw / 2, top: c.cy - ch / 2, width: cw, height: ch, borderRadius: 36, background: 'rgba(244,234,219,0.94)', border: '5px solid #ffd23f'}} />
    ))}
    <ThreeCanvas orthographic width={W} height={H} camera={{zoom: z, position: [0, 0, 60], near: 0.1, far: 200}}>
      <ambientLight intensity={1.5} />
      <hemisphereLight args={['#ffffff', '#b08a6a', 0.8]} />
      <directionalLight position={[3, 6, 8]} intensity={1.6} />
      {cells.map((c, i) => <React.Fragment key={i}>{c.node(wx(c.cx, z), wy(c.cy, z), z)}</React.Fragment>)}
    </ThreeCanvas>
    {cells.map((c, i) => (
      <div key={i} style={{position: 'absolute', left: c.cx - cw / 2, top: c.cy + ch / 2 - 74, width: cw, textAlign: 'center', fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#2a1233'}}>
        <div style={{fontSize: c.name.length > 13 ? 30 : 34, lineHeight: 1.1, whiteSpace: 'nowrap'}}>{c.name}</div>
        {c.sub && <div style={{fontSize: 24, opacity: 0.7, fontWeight: 600}}>{c.sub}</div>}
      </div>
    ))}
  </AbsoluteFill>
);

export const Catalogo: React.FC = () => {
  const page = useCurrentFrame();
  if (page === 0) {
    const z = 140, cw = 440, ch = 360;
    const cells: Cell[] = chars.map((c, i) => {
      const cx = i % 2 === 0 ? 300 : 780;
      const cy = 520 + Math.floor(i / 2) * 395;
      return {name: c.name, sub: c.sub, cx, cy, node: (x, y) => (
        <Hero frame={30} pose={c.pose} look={c.look} position={[x, wy(cy + 85, z), 0]} rotY={0.45} scale={c.s} />
      )};
    });
    return <Page title="ELENCO" sub="Apocalipse Zumbi" z={z} cw={cw} ch={ch} cells={cells} />;
  }
  if (page === 1) {
    const z = 190, cw = 320, ch = 330;
    const cells: Cell[] = items.map((it, i) => {
      const cx = [190, 540, 890][i % 3];
      const cy = 470 + Math.floor(i / 3) * 365;
      const E = it.el;
      return {name: it.name, cx, cy, node: (x, y) => <E position={[x, wy(cy - 28, z), 0]} rotation={[0.3, -0.55, 0]} scale={(it.s ?? 1) * 1.3} />};
    });
    return <Page title="ITENS" sub="Kit de sobrevivência" z={z} cw={cw} ch={ch} cells={cells} />;
  }
  const z = 105, cw = 440, ch = 420;
  const cells: Cell[] = scenery.map((it, i) => {
    const cx = i % 2 === 0 ? 300 : 780;
    const cy = 580 + Math.floor(i / 2) * 465;
    const E = it.el;
    return {name: it.name, cx, cy, node: (x, y) => <E position={[x, wy(cy + 105, z), 0]} rotation={[0.18, -0.6, 0]} scale={(it.s ?? 1) * (['CARRO ABANDONADO','BARRICADA','ACAMPAMENTO'].includes(it.name) ? 1.2 : 1)} />};
  });
  return <Page title="CENÁRIOS" sub="Onde a história acontece" z={z} cw={cw} ch={ch} cells={cells} />;
};
