import React from 'react';

/**
 * HERO / PERSONAGEM — modelo 3D do canal (estilo boneco, cabeça grande).
 * Uso:  <Hero frame={frame} pose="walk" position={[0,0,0]} rotY={0} scale={1} />
 * Outros personagens: <Hero look={LOOKS.garota} ... />
 * O personagem olha para +Z.
 */
export type HeroPose = 'idle' | 'wave' | 'walk' | 'run' | 'scared' | 'point' | 'zombie';
export type HeroFace = 'happy' | 'open' | 'scared' | 'neutral';
export type HairStyle = 'spiky' | 'ponytail' | 'short' | 'elder' | 'messy' | 'none';

export type Look = {
  hair: string; hairStyle: HairStyle; skin: string; shirt: string; shorts: string; shoe: string;
  glasses?: boolean; helmet?: string; cap?: string; beard?: string; backpack?: string; zombie?: boolean;
};

export const LOOKS: Record<string, Look> = {
  garoto: {hair: '#f5d142', hairStyle: 'spiky', skin: '#ffdcbc', shirt: '#e63946', shorts: '#1d3557', shoe: '#f8f9fa'},
  garota: {hair: '#6b3a1e', hairStyle: 'ponytail', skin: '#f1c9a5', shirt: '#f4a300', shorts: '#2f4858', shoe: '#e9ecef', backpack: '#2a9d8f'},
  vovo: {hair: '#f1f1f1', hairStyle: 'elder', skin: '#f0c7a0', shirt: '#4f7942', shorts: '#6b5b4b', shoe: '#5c4033', glasses: true, beard: '#f1f1f1'},
  nerd: {hair: '#1b1b1b', hairStyle: 'short', skin: '#d9a77d', shirt: '#3a86ff', shorts: '#343a40', shoe: '#f8f9fa', glasses: true, backpack: '#ef476f'},
  soldado: {hair: '#2b1d14', hairStyle: 'short', skin: '#8d5a3b', shirt: '#6b7f3a', shorts: '#4a5a2a', shoe: '#2b2b2b', helmet: '#556b2f'},
  zumbi: {hair: '#3d4a3a', hairStyle: 'messy', skin: '#8fbf7a', shirt: '#5b5266', shorts: '#3b3b4f', shoe: '#3a3a3a', zombie: true},
};

type Props = {
  frame: number;
  pose?: HeroPose;
  face?: HeroFace;
  position?: [number, number, number];
  rotY?: number;
  scale?: number;
  look?: Partial<Look>;
  shirt?: string;
  shorts?: string;
};

const Mat: React.FC<{c: string}> = ({c}) => <meshStandardMaterial color={c} roughness={0.8} />;

export const Hero: React.FC<Props> = ({
  frame: f, pose = 'idle', face, position = [0, 0, 0], rotY = 0, scale = 1, look, shirt: shirtOv, shorts: shortsOv,
}) => {
  const L: Look = {...LOOKS.garoto, ...look};
  const skin = L.skin, hair = L.hair, sole = '#adb5bd';
  const shirt = shirtOv ?? L.shirt, shorts = shortsOv ?? L.shorts, shoe = L.shoe;
  const zom = !!L.zombie;
  const expr: HeroFace = face ?? (pose === 'scared' ? 'scared' : pose === 'run' || zom ? 'open' : 'happy');

  let hipY = 0.5, lean = 0, bob = 0, shakeX = 0, headTilt = 0, headTurn = 0;
  let lHip = 0, rHip = 0, lKnee = 0, rKnee = 0;
  let lSh: [number, number] = [0, -0.08];
  let rSh: [number, number] = [0, 0.08];
  let lEl = -0.1, rEl = -0.1, rElZ = 0;

  if (pose === 'idle') {
    const b = Math.sin(f * 0.12);
    bob = b * 0.012; lSh = [b * 0.05, -0.1]; rSh = [-b * 0.05, 0.1];
    headTilt = Math.sin(f * 0.07) * 0.05; headTurn = Math.sin(f * 0.05) * 0.15;
  } else if (pose === 'walk') {
    const p = f * 0.28;
    lHip = Math.sin(p) * 0.55; rHip = -Math.sin(p) * 0.55;
    lKnee = Math.max(0, -Math.cos(p)) * 0.8; rKnee = Math.max(0, Math.cos(p)) * 0.8;
    rSh = [lHip * 0.9, 0.08]; lSh = [rHip * 0.9, -0.08]; lEl = rEl = -0.3;
    bob = -Math.abs(Math.sin(p)) * 0.04; lean = 0.06;
  } else if (pose === 'run') {
    const p = f * 0.45;
    lHip = Math.sin(p) * 0.95; rHip = -Math.sin(p) * 0.95;
    lKnee = Math.max(0, -Math.cos(p)) * 1.5; rKnee = Math.max(0, Math.cos(p)) * 1.5;
    rSh = [lHip * 0.95, 0.12]; lSh = [rHip * 0.95, -0.12]; lEl = rEl = -1.3;
    bob = Math.abs(Math.sin(p)) * 0.1; lean = 0.28;
  } else if (pose === 'wave') {
    const b = Math.sin(f * 0.12);
    bob = b * 0.01; rSh = [0, 2.7]; rEl = 0; rElZ = 0.25 + Math.sin(f * 0.5) * 0.5;
    lSh = [b * 0.05, -0.1]; headTilt = 0.1;
  } else if (pose === 'scared') {
    hipY -= 0.1; lHip = -0.3; rHip = -0.2; lKnee = 0.55; rKnee = 0.45;
    lSh = [-2.0, -0.35]; rSh = [-2.0, 0.35]; lEl = rEl = -1.0; lean = -0.18;
    shakeX = Math.sin(f * 2.6) * 0.014; headTilt = Math.sin(f * 1.9) * 0.04;
  } else if (pose === 'point') {
    rSh = [-1.57, 0.05]; rEl = 0; headTurn = 0.1;
  } else if (pose === 'zombie') {
    const p = f * 0.16;
    lHip = Math.sin(p) * 0.4; rHip = -Math.sin(p) * 0.4;
    lKnee = Math.max(0, -Math.cos(p)) * 0.5; rKnee = Math.max(0, Math.cos(p)) * 0.5;
    lSh = [-1.5, -0.12]; rSh = [-1.5, 0.12]; lEl = rEl = -0.15;
    bob = -Math.abs(Math.sin(p)) * 0.03; lean = 0.1; headTilt = 0.22 + Math.sin(p) * 0.05;
  }

  const blink = f % 90 < 4;

  const Arm: React.FC<{side: 1 | -1; sh: [number, number]; el: number; elZ?: number}> = ({side, sh, el, elZ = 0}) => (
    <group position={[side * 0.22, 0.38, 0]} rotation={[sh[0], 0, sh[1]]}>
      <mesh position={[0, -0.095, 0]}><capsuleGeometry args={[0.06, 0.08, 6, 12]} /><Mat c={zom ? skin : shirt} /></mesh>
      <group position={[0, -0.19, 0]} rotation={[el, 0, elZ]}>
        <mesh position={[0, -0.09, 0]}><capsuleGeometry args={[0.05, 0.08, 6, 12]} /><Mat c={skin} /></mesh>
        <mesh position={[0, -0.2, 0]}><sphereGeometry args={[0.06, 14, 14]} /><Mat c={skin} /></mesh>
      </group>
    </group>
  );

  const Leg: React.FC<{side: 1 | -1; hip: number; knee: number}> = ({side, hip, knee}) => (
    <group position={[side * 0.1, 0, 0]} rotation={[hip, 0, 0]}>
      <mesh position={[0, -0.13, 0]}><capsuleGeometry args={[0.08, 0.1, 6, 12]} /><Mat c={shorts} /></mesh>
      <group position={[0, -0.25, 0]} rotation={[knee, 0, 0]}>
        <mesh position={[0, -0.11, 0]}><capsuleGeometry args={[0.065, 0.08, 6, 12]} /><Mat c={skin} /></mesh>
        <mesh position={[0, -0.2, 0.045]}><boxGeometry args={[0.15, 0.09, 0.27]} /><Mat c={shoe} /></mesh>
        <mesh position={[0, -0.245, 0.045]}><boxGeometry args={[0.155, 0.02, 0.28]} /><Mat c={sole} /></mesh>
      </group>
    </group>
  );

  const H = (c: string) => <meshStandardMaterial color={c} roughness={0.9} />;
  const eyeY = blink ? 0.12 : 1.35;

  return (
    <group position={position} rotation={[0, rotY, 0]} scale={scale}>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 24]} /><meshBasicMaterial color="#000" transparent opacity={0.22} />
      </mesh>

      <group position={[shakeX, hipY + bob, 0]}>
        <Leg side={-1} hip={lHip} knee={lKnee} />
        <Leg side={1} hip={rHip} knee={rKnee} />
        <mesh position={[0, 0.03, 0]}><boxGeometry args={[0.36, 0.14, 0.24]} /><Mat c={shorts} /></mesh>

        <group rotation={[lean, 0, 0]}>
          <mesh position={[0, 0.25, 0]} scale={[1, 1, 0.8]}><capsuleGeometry args={[0.16, 0.14, 8, 14]} /><Mat c={shirt} /></mesh>
          {zom && [-0.1, 0.02, 0.12].map((x, i) => (
            <mesh key={i} position={[x, 0.05, 0.0]} scale={[1, 1, 0.8]}><boxGeometry args={[0.07, 0.07 + i * 0.02, 0.27]} /><Mat c={skin} /></mesh>
          ))}
          {L.backpack && (
            <group position={[0, 0.28, -0.2]}>
              <mesh><boxGeometry args={[0.32, 0.4, 0.16]} /><Mat c={L.backpack} /></mesh>
              <mesh position={[0, -0.07, -0.09]}><boxGeometry args={[0.24, 0.2, 0.05]} /><Mat c="#00000040" /></mesh>
            </group>
          )}
          <Arm side={-1} sh={lSh} el={lEl} />
          <Arm side={1} sh={rSh} el={rEl} elZ={rElZ} />

          <group position={[0, 0.76, 0]} scale={1.45} rotation={[0, headTurn, headTilt]}>
            <mesh><sphereGeometry args={[0.25, 24, 24]} /><Mat c={skin} /></mesh>
            <mesh position={[-0.25, -0.01, 0]}><sphereGeometry args={[0.045, 10, 10]} /><Mat c={skin} /></mesh>
            <mesh position={[0.25, -0.01, 0]}><sphereGeometry args={[0.045, 10, 10]} /><Mat c={skin} /></mesh>
            <mesh position={[0, -0.03, 0.25]}><sphereGeometry args={[0.028, 10, 10]} /><Mat c={zom ? '#78a866' : '#f2b999'} /></mesh>
            {!zom && [-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.15, -0.06, 0.2]} scale={[1, 0.7, 0.3]}><sphereGeometry args={[0.045, 10, 10]} /><meshStandardMaterial color="#ffb0a3" /></mesh>
            ))}
            {/* olhos */}
            {[-1, 1].map((s) => (
              <group key={s} position={[s * 0.09, 0.04, 0.215]}>
                {(expr === 'scared' || zom) && <mesh scale={[1, 1.3, 0.5]}><sphereGeometry args={[0.055, 14, 14]} /><meshStandardMaterial color="#ffffff" /></mesh>}
                <mesh position={[0, 0, 0.03]} scale={[1, blink ? 0.12 : (expr === 'scared' || zom ? 1 : eyeY), 0.5]}>
                  <sphereGeometry args={[zom ? 0.024 : expr === 'scared' ? 0.022 : 0.036, 12, 12]} /><meshStandardMaterial color={zom ? '#8b0000' : '#1b1b2f'} />
                </mesh>
                {zom && <mesh position={[0, -0.06, -0.005]} scale={[1.1, 0.4, 0.4]}><sphereGeometry args={[0.05, 10, 10]} /><meshStandardMaterial color="#5c7f50" /></mesh>}
              </group>
            ))}
            {/* boca */}
            {expr === 'happy' && !zom && (
              <mesh position={[0, -0.095, 0.235]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.06, 0.012, 8, 20, Math.PI]} /><meshStandardMaterial color="#8a3b3b" /></mesh>
            )}
            {(expr === 'open' || expr === 'scared') && (
              <mesh position={[0, -0.1, 0.23]} scale={[1, expr === 'scared' ? 1.5 : 1.1, 0.4]}><sphereGeometry args={[0.05, 14, 14]} /><meshStandardMaterial color="#4a1515" /></mesh>
            )}
            {expr === 'neutral' && <mesh position={[0, -0.095, 0.235]}><boxGeometry args={[0.08, 0.014, 0.014]} /><meshStandardMaterial color="#8a3b3b" /></mesh>}
            {/* óculos */}
            {L.glasses && (
              <group position={[0, 0.04, 0.245]}>
                {[-1, 1].map((s) => <mesh key={s} position={[s * 0.09, 0, 0]}><torusGeometry args={[0.062, 0.01, 8, 20]} /><meshStandardMaterial color="#222" /></mesh>)}
                <mesh><boxGeometry args={[0.05, 0.01, 0.01]} /><meshStandardMaterial color="#222" /></mesh>
              </group>
            )}
            {/* barba */}
            {L.beard && <mesh position={[0, -0.13, 0.12]} scale={[1, 0.65, 0.85]}><sphereGeometry args={[0.17, 16, 16]} />{H(L.beard)}</mesh>}

            {/* cabelo */}
            {L.hairStyle === 'spiky' && (
              <>
                <mesh rotation={[-0.35, 0, 0]} scale={[1.02, 1, 1.02]}><sphereGeometry args={[0.27, 24, 16, 0, Math.PI * 2, 0, 1.55]} />{H(hair)}</mesh>
                {[-0.16, -0.08, 0, 0.08, 0.16].map((x, i) => (
                  <mesh key={i} position={[x, 0.2 - Math.abs(x) * 0.25, 0.2]} rotation={[1.2, 0, -x * 2.2]}><coneGeometry args={[0.055, 0.15, 6]} />{H(hair)}</mesh>
                ))}
                <mesh position={[0.02, 0.33, -0.02]} rotation={[0.1, 0, 0.35]}><coneGeometry args={[0.07, 0.2, 6]} />{H(hair)}</mesh>
                <mesh position={[-0.1, 0.3, -0.03]} rotation={[0.1, 0, -0.5]}><coneGeometry args={[0.06, 0.16, 6]} />{H(hair)}</mesh>
              </>
            )}
            {L.hairStyle === 'ponytail' && (
              <>
                <mesh rotation={[-0.3, 0, 0]} scale={[1.03, 1, 1.03]}><sphereGeometry args={[0.27, 24, 16, 0, Math.PI * 2, 0, 1.6]} />{H(hair)}</mesh>
                <mesh position={[0, 0.0, -0.27]}><sphereGeometry args={[0.09, 12, 12]} />{H(hair)}</mesh>
                <mesh position={[0.02, -0.14, -0.3]} rotation={[0.2, 0, 0.1]}><capsuleGeometry args={[0.06, 0.2, 6, 10]} />{H(hair)}</mesh>
                <mesh position={[0, -0.01, -0.27]}><torusGeometry args={[0.07, 0.015, 8, 16]} /><meshStandardMaterial color="#ff4d6d" /></mesh>
                {[-1, 1].map((s) => <mesh key={s} position={[s * 0.2, 0.1, 0.1]} scale={[0.6, 1.3, 0.8]}><sphereGeometry args={[0.07, 10, 10]} />{H(hair)}</mesh>)}
              </>
            )}
            {L.hairStyle === 'short' && (
              <mesh rotation={[-0.4, 0, 0]} scale={[1.02, 1, 1.02]}><sphereGeometry args={[0.265, 24, 16, 0, Math.PI * 2, 0, 1.4]} />{H(hair)}</mesh>
            )}
            {L.hairStyle === 'elder' && (
              <>
                {[-1, 1].map((s) => <mesh key={s} position={[s * 0.22, 0.04, -0.03]} scale={[0.6, 1.2, 1]}><sphereGeometry args={[0.09, 12, 12]} />{H(hair)}</mesh>)}
                <mesh position={[0, 0.06, -0.2]} scale={[1.1, 0.7, 0.5]}><sphereGeometry args={[0.16, 14, 14]} />{H(hair)}</mesh>
              </>
            )}
            {L.hairStyle === 'messy' && (
              <>
                <mesh rotation={[-0.3, 0, 0]} scale={[1.02, 0.9, 1.02]}><sphereGeometry args={[0.265, 20, 14, 0, Math.PI * 2, 0, 1.2]} />{H(hair)}</mesh>
                {[[-0.12, 0.26, 0.05, 0.5], [0.1, 0.28, 0, -0.6], [0, 0.3, -0.1, 0.1], [0.2, 0.18, 0.05, -1.0]].map((c, i) => (
                  <mesh key={i} position={[c[0], c[1], c[2]]} rotation={[0, 0, c[3]]}><coneGeometry args={[0.045, 0.16, 5]} />{H(hair)}</mesh>
                ))}
              </>
            )}
            {/* capacete / boné */}
            {L.helmet && (
              <>
                <mesh scale={[1.08, 1.05, 1.08]} position={[0, 0.02, 0]}><sphereGeometry args={[0.27, 24, 16, 0, Math.PI * 2, 0, 1.45]} /><meshStandardMaterial color={L.helmet} roughness={0.6} /></mesh>
                <mesh position={[0, 0.1, 0]}><torusGeometry args={[0.285, 0.018, 8, 28]} /><meshStandardMaterial color="#3d4a22" /></mesh>
              </>
            )}
            {L.cap && (
              <>
                <mesh rotation={[-0.2, 0, 0]}><sphereGeometry args={[0.27, 24, 16, 0, Math.PI * 2, 0, 1.4]} /><meshStandardMaterial color={L.cap} /></mesh>
                <mesh position={[0, 0.1, 0.3]}><boxGeometry args={[0.3, 0.02, 0.2]} /><meshStandardMaterial color={L.cap} /></mesh>
              </>
            )}
          </group>
        </group>
      </group>
    </group>
  );
};
