import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {Hero, HeroPose} from './Hero';

const Cam: React.FC<{frame: number}> = ({frame}) => {
  const {camera} = useThree();
  const a = interpolate(frame, [0, 75], [0, Math.PI * 2], {extrapolateRight: 'clamp'});
  camera.position.set(Math.sin(a) * 6.2, 1.6, Math.cos(a) * 6.2);
  camera.lookAt(0, 1.0, 0);
  return null;
};

const PARTS: {from: number; pose: HeroPose; label: string}[] = [
  {from: 0, pose: 'idle', label: 'PARADO'},
  {from: 75, pose: 'wave', label: 'OI!'},
  {from: 125, pose: 'walk', label: 'ANDANDO'},
  {from: 185, pose: 'run', label: 'CORRENDO'},
  {from: 235, pose: 'scared', label: 'SUSTO!'},
];

export const HeroShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  let part = PARTS[0];
  PARTS.forEach((p) => { if (frame >= p.from) part = p; });

  let pos: [number, number, number] = [0, 0, 0];
  if (part.pose === 'walk') pos = [0, 0, interpolate(frame, [125, 185], [-2.5, 1.2])];
  if (part.pose === 'run') pos = [0, 0, interpolate(frame, [185, 235], [-3, 0.4])];

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#7ec8e3, #e8f7ff)'}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 38, position: [0, 1.8, 9]}}>
        <Cam frame={frame} />
        <hemisphereLight args={['#ffffff', '#b08a6a', 1.2]} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 8, 6]} intensity={1.6} />
        <mesh position={[0, -0.06, 0]}><boxGeometry args={[7, 0.12, 7]} /><meshStandardMaterial color="#5fb04a" /></mesh>
        <mesh position={[0, -1.1, 0]}><boxGeometry args={[7, 1.96, 7]} /><meshStandardMaterial color="#9c5a34" /></mesh>
        <Hero frame={frame} pose={part.pose} position={pos} scale={1.35} />
      </ThreeCanvas>
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 110, color: '#fff', textShadow: '0 6px 0 #1d3557, 5px 0 0 #1d3557, -5px 0 0 #1d3557, 0 -5px 0 #1d3557'}}>
        {part.label}
      </div>
    </AbsoluteFill>
  );
};
