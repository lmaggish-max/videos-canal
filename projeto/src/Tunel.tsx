import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {Hero, LOOKS, HeroPose, Look} from './Hero';
import TIME from './ttime.json';
import WORDS_T from './twords.json';

type V3 = [number, number, number];
const S = TIME.sents as {i: number; start: number; end: number}[];
const st = (i: number) => S[i].start, en = (i: number) => S[i].end;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = Easing.inOut(Easing.cubic);
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
const rand = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const HEROLOOK: Look = {...LOOKS.garoto, helmet: '#f5c518', hairStyle: 'short'} as Look;

const Beam: React.FC<{a: V3; b: V3; r?: number; color: string}> = ({a, b, r = 0.05, color}) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va); const L = Math.max(0.001, dir.length());
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return <mesh position={mid.toArray() as V3} quaternion={q}><boxGeometry args={[r * 2, L, r * 2]} /><meshStandardMaterial color={color} /></mesh>;
};

// TBM
const X0 = -6, X1 = 12;
const xTBM = (t: number) => lerp(X0, X1, ease(prog(t, st(1), en(1))));
const camX = (t: number) => (t < st(1) ? lerp(0, clamp(X0 - 1.5, -4, 5), 0) : clamp(xTBM(t) - 1.5, 0, 5.5));
const JOINTS_LEAK = [3, 4, 5, 6];

const Cam: React.FC<{t: number; f: number}> = ({t, f}) => {
  const {camera} = useThree();
  const cx = t < st(1) ? lerp(0, 0, 1) : camX(t);
  const intro = 1 - ease(prog(t, 0, st(1)));
  const dist = lerp(13.5, 17, intro), cy = lerp(1.0, 2.4, intro);
  let sh = 0; const d = t - (st(4) + 0.5); if (d >= 0 && d < 0.4) sh = 0.15 * (1 - d / 0.4);
  camera.position.set(cx + Math.sin(f * 3.7) * sh, cy + Math.cos(f * 4.3) * sh, dist);
  camera.lookAt(cx, cy, 0);
  return null;
};

export const Tunel: React.FC = () => {
  const f = useCurrentFrame(); const t = f / 30;
  const {fps, width, height} = useVideoConfig();
  let si = 0; S.forEach((s, i) => { if (t >= s.start) si = i; });
  const xT = xTBM(t);
  const xBuilt = xT - 4.8;
  const cx = t < st(1) ? 0 : camX(t);

  // vazamento
  const leakOn = prog(t, st(2) + 0.9, st(3) + 0.6);
  const fixT = (k: number) => st(5) + 0.4 + k * 0.6;       // tempo em que cada junta recebe borracha
  const mudAmt = (k: number) => (t >= fixT(k) ? 0 : leakOn * (k === 5 ? 1 : prog(t, st(3), st(3) + 1.6)));
  const puddle = t < st(5) + 1.2 ? 0.2 + 1.2 * prog(t, st(2) + 1.2, st(4)) : Math.max(0, 1.4 * (1 - prog(t, st(5) + 1.2, en(5))));
  const heroPose: HeroPose = (['idle', 'idle', 'scared', 'scared', 'point', 'idle', 'wave', 'idle', 'idle'] as HeroPose[])[si];

  // legenda
  let wi = -1; (WORDS_T as [string, number, number][]).forEach((w, i) => { if (f >= w[1]) wi = i; });
  const cur = wi >= 0 ? (WORDS_T as [string, number, number][])[wi] : null;
  const showWord = !!cur && f <= cur[2] + 5 && si !== 7 ? true : (!!cur && f <= cur[2] + 5);
  const word = cur ? cur[0].replace(/[,:]$/, '').toUpperCase() : '';
  const key = cur ? cur[0].replace(/[^\wÀ-ÿ]/g, '').toLowerCase() : '';
  const wColor = ['pingo', 'lama', 'deslize', 'frestas'].includes(key) ? '#ff5a5a' : ['pronto', 'saída', 'curiosidade'].includes(key) ? '#4dff88' : undefined;
  const pop = spring({frame: f - (cur ? cur[1] : 0), fps, config: {damping: 12, stiffness: 180}});
  const wScale = interpolate(pop, [0, 1], [0.6, 1]);

  const BAN = ['COMO SE ESCAVA UM TÚNEL DEBAIXO DE UM RIO?', 'PASSO 1: ESCAVAR E REVESTIR', '', '', 'O DESLIZE: SEM BORRACHA NAS JUNTAS', 'SOLUÇÃO: VEDAR E BOMBEAR', 'TÚNEL PRONTO!', '', 'VOCÊ TERIA NOTADO O PINGO?'];
  const showBan = BAN[si] !== '' && !(si === 4 && t < st(4) + 0.5);
  const banColor = si === 4 ? '#b91c1c' : si === 0 ? '#1a1a2e' : '#15803d';
  const banPop = spring({frame: f - Math.round((si === 4 ? st(4) + 0.5 : st(si)) * 30), fps, config: {damping: 12, stiffness: 160}});
  const sT = t - (st(4) + 0.5); const stampOn = sT >= 0 && sT < 1.2;
  const stampPop = stampOn ? spring({frame: Math.round(sT * 30), fps, config: {damping: 9, stiffness: 220}}) : 0;
  const info = prog(t, st(7), st(7) + 1.0), infoFill = ease(prog(t, st(7) + 1.2, st(7) + 3.2));

  const cars = [{t0: st(6) + 0.1, y: 0.4, c: '#e63946'}, {t0: st(6) + 0.9, y: 0.4, c: '#2a9df4'}];
  const boatX = lerp(-4, 8, prog(t, st(6), en(6) + 2));

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#8fd3ff, #e8f7ff)'}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 50, position: [0, 1, 13.5]}}>
        <Cam t={t} f={f} />
        <ambientLight intensity={1.6} />
        <directionalLight position={[3, 8, 10]} intensity={1.5} />

        {/* terra e rocha em corte */}
        <mesh position={[0, -3.2, 0]}><boxGeometry args={[60, 5.6, 1.2]} /><meshStandardMaterial color="#8a8f98" /></mesh>
        <mesh position={[0, 2.9, 0]}><boxGeometry args={[60, 0.2, 1.2]} /><meshStandardMaterial color="#8a8f98" /></mesh>
        <mesh position={[0, 3.7, 0]}><boxGeometry args={[9, 1.4, 1.2]} /><meshStandardMaterial color="#6b4a2b" /></mesh>
        {[-1, 1].map((s) => <mesh key={s} position={[s * 19.5, 4.5, 0]}><boxGeometry args={[30, 3.0, 1.2]} /><meshStandardMaterial color="#9c6b3c" /></mesh>)}
        {[-1, 1].map((s) => <mesh key={s} position={[s * 19.5, 6.1, 0]}><boxGeometry args={[30, 0.2, 1.2]} /><meshStandardMaterial color="#5fb04a" /></mesh>)}
        {/* rio */}
        <mesh position={[0, 5.3, 0]}><boxGeometry args={[9, 1.6, 1.2]} /><meshStandardMaterial color="#2ea0ff" transparent opacity={0.75} /></mesh>
        {Array.from({length: 6}).map((_, i) => <mesh key={i} position={[-4 + ((rand(i) * 8 + t * (0.5 + rand(i + 3))) % 8), 6.12, 0.62]}><boxGeometry args={[0.7, 0.03, 0.05]} /><meshBasicMaterial color="#fff" /></mesh>)}
        {/* barco */}
        {t >= st(6) && <group position={[boatX, 6.3, 0.2]}><mesh><boxGeometry args={[1.8, 0.35, 0.7]} /><meshStandardMaterial color="#e63946" /></mesh><mesh position={[0.2, 0.4, 0]}><boxGeometry args={[0.7, 0.5, 0.6]} /><meshStandardMaterial color="#f1f1f1" /></mesh></group>}

        {/* rocha ainda não escavada, à frente da máquina */}
        <mesh position={[xT + 15, 1.2, 0]}><boxGeometry args={[30, 3.2, 1.2]} /><meshStandardMaterial color="#8a8f98" /></mesh>
        {/* interior do túnel: parede de fundo e revestimento */}
        <mesh position={[(xT - 20) / 2, 1.2, -0.2]}><boxGeometry args={[Math.max(1, xT + 20), 3.2, 0.2]} /><meshStandardMaterial color="#2b2d33" /></mesh>
        {[2.6, -0.2].map((y) => (
          <mesh key={y} position={[(xBuilt - 20) / 2, y, 0.3]}><boxGeometry args={[Math.max(0.1, xBuilt + 20), 0.4, 0.7]} /><meshStandardMaterial color="#c4c9d1" /></mesh>
        ))}
        {/* juntas dos anéis */}
        {Array.from({length: 22}).map((_, i) => { const x = -10 + i; if (x > xBuilt) return null; return [2.6, -0.2].map((y) => <mesh key={`${i}${y}`} position={[x, y, 0.66]}><boxGeometry args={[0.05, 0.4, 0.02]} /><meshStandardMaterial color="#6b7280" /></mesh>); })}
        {/* borrachas nas juntas */}
        {JOINTS_LEAK.map((k, i) => t >= fixT(i) && <mesh key={k} position={[k, 2.6, 0.68]} scale={[1, Math.min(1, (t - fixT(i)) * 6), 1]}><boxGeometry args={[0.12, 0.44, 0.03]} /><meshStandardMaterial color="#111" /></mesh>)}
        {/* TBM */}
        <group position={[xT, 1.2, 0]}>
          <mesh position={[-2.2, 0, 0]}><boxGeometry args={[4.4, 2.3, 1.05]} /><meshStandardMaterial color="#e8892b" /></mesh>
          <mesh position={[-2.2, 1.35, 0]}><boxGeometry args={[3.6, 0.25, 0.9]} /><meshStandardMaterial color="#f5b700" /></mesh>
          <mesh position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[1.18, 1.18, 0.4, 24]} /><meshStandardMaterial color="#555b66" /></mesh>
          {[0, 1, 2, 3].map((k) => <mesh key={k} position={[0.42, 0, 0]} rotation={[t * 4 + k * Math.PI / 4, 0, 0]}><boxGeometry args={[0.2, 2.3, 0.2]} /><meshStandardMaterial color="#ffd23f" /></mesh>)}
        </group>

        {/* lama escorrendo e poça */}
        {JOINTS_LEAK.map((k, i) => { const m = mudAmt(i); if (m < 0.02) return null; const len = 2.2 * m;
          return (<group key={k}>
            <mesh position={[k, 2.4 - len / 2, 0.69]}><boxGeometry args={[0.07, len, 0.04]} /><meshStandardMaterial color="#6b4a2b" /></mesh>
            {Array.from({length: 3}).map((_, p) => { const ph = (t * 1.3 + p / 3 + i * 0.2) % 1; return <mesh key={p} position={[k, 2.35 - ph * 2.3, 0.7]}><sphereGeometry args={[0.09, 8, 8]} /><meshStandardMaterial color="#6b4a2b" /></mesh>; })}
          </group>);
        })}
        {puddle > 0.02 && <mesh position={[4.8, 0.03, 0.6]} scale={[puddle, 1, 1]}><cylinderGeometry args={[1.0, 1.0, 0.05, 20]} /><meshStandardMaterial color="#6b4a2b" /></mesh>}
        {/* bomba */}
        {t >= st(5) + 1.0 && <group><mesh position={[2.6, 0.3, 0.5]}><boxGeometry args={[0.8, 0.6, 0.6]} /><meshStandardMaterial color="#2a9df4" /></mesh><Beam a={[3.0, 0.3, 0.5]} b={[4.6, 0.1, 0.6]} r={0.07} color="#222" /></group>}
        {/* marcadores de erro */}
        {si === 4 && t >= st(4) + 0.4 && JOINTS_LEAK.map((k) => <mesh key={k} position={[k, 3.4 + Math.abs(Math.sin(f * 0.25 + k)) * 0.3, 0.7]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.22, 0.5, 12]} /><meshStandardMaterial color="#ff2a2a" emissive="#ff0000" emissiveIntensity={0.7} /></mesh>)}

        {/* carros */}
        {cars.map((c, i) => { const u = prog(t, c.t0, c.t0 + 4.5); if (t < c.t0 || u >= 1) return null; const x = lerp(-6, 16, u);
          return (<group key={i} position={[x, c.y, 0.1]}><mesh><boxGeometry args={[1.5, 0.5, 0.8]} /><meshStandardMaterial color={c.c} /></mesh><mesh position={[-0.1, 0.4, 0]}><boxGeometry args={[0.9, 0.35, 0.7]} /><meshStandardMaterial color="#cfe9ff" /></mesh><mesh position={[0.78, 0.05, 0]}><boxGeometry args={[0.06, 0.15, 0.5]} /><meshStandardMaterial color="#fff6a8" emissive="#fff6a8" emissiveIntensity={0.9} /></mesh>{[-0.5, 0.5].map((w) => <mesh key={w} position={[w, -0.28, 0.4]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.1, 12]} /><meshStandardMaterial color="#111" /></mesh>)}</group>);
        })}

        <Hero frame={f} pose={heroPose} look={HEROLOOK} position={[Math.min(cx + 1.2, xBuilt - 1.0 > 2 ? 3.4 : 2.0), 0.0, 0.35]} rotY={0.25} scale={0.85} />
      </ThreeCanvas>

      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 62%, rgba(0,0,0,0.3) 100%)'}} />
      {showBan && (
        <div style={{position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center'}}>
          <div style={{transform: `scale(${0.7 + banPop * 0.3})`, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: si === 0 || si === 8 ? 50 : 44, color: '#fff', background: banColor, border: '6px solid #fff', borderRadius: 20, padding: '10px 30px', textAlign: 'center', maxWidth: 980}}>{BAN[si]}</div>
        </div>
      )}
      {stampOn && (
        <div style={{position: 'absolute', top: 680, width: '100%', display: 'flex', justifyContent: 'center', opacity: sT > 0.9 ? 1 - (sT - 0.9) / 0.3 : 1}}>
          <div style={{transform: `rotate(-7deg) scale(${0.5 + stampPop * 0.5})`, fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 140, color: '#ff3b3b', border: '12px solid #ff3b3b', borderRadius: 26, padding: '0 36px', background: '#fff'}}>DESLIZE!</div>
        </div>
      )}
      {si === 7 && info > 0 && (
        <div style={{position: 'absolute', top: 430, left: 60, right: 60, transform: `scale(${0.8 + 0.2 * info})`, opacity: info, background: '#0b1b3aee', border: '6px solid #fff', borderRadius: 28, padding: '26px 34px', fontFamily: 'Poppins, sans-serif', color: '#fff'}}>
          <div style={{fontWeight: 700, fontSize: 46, textAlign: 'center', color: '#ffd23f'}}>TÚNEL DO CANAL DA MANCHA</div>
          <div style={{marginTop: 22, fontSize: 36, fontWeight: 600}}>Total: 50 km</div>
          <div style={{height: 34, borderRadius: 17, background: '#ffffff30', overflow: 'hidden', marginTop: 6}}><div style={{width: `${infoFill * 100}%`, height: '100%', background: '#9aa3ad'}} /></div>
          <div style={{marginTop: 22, fontSize: 36, fontWeight: 600}}>Debaixo do mar: quase 38 km</div>
          <div style={{height: 34, borderRadius: 17, background: '#ffffff30', overflow: 'hidden', marginTop: 6}}><div style={{width: `${infoFill * 76}%`, height: '100%', background: '#2ea0ff'}} /></div>
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
