import React from 'react';
import {Composition} from 'remotion';
import {Scene} from './Scene';
import {ZombieScene} from './Zombie';
import {HeroShowcase} from './HeroShowcase';
import {Catalogo} from './Catalogo';
import {Torre} from './Torre';
import {Ponte} from './Ponte';
import PT from './ptime.json';
import {Barragem} from './Barragem';
import BT from './btime.json';
import {Supermercado} from './Supermercado';
import ST from './stime.json';
import {Tunel} from './Tunel';
import TT from './ttime.json';
import {Alcatraz} from './Alcatraz';
import AT from './atime.json';
import {PredioScene} from './Predio';

export const Root: React.FC = () => (
  <>
    <Composition id="Demo" component={Scene} durationInFrames={300} fps={30} width={1080} height={1920} />
    <Composition id="Zombie" component={ZombieScene} durationInFrames={450} fps={30} width={1080} height={1920} />
    <Composition id="Hero" component={HeroShowcase} durationInFrames={290} fps={30} width={1080} height={1920} />
    <Composition id="Catalogo" component={Catalogo} durationInFrames={3} fps={30} width={1080} height={1920} />
    <Composition id="Predio" component={PredioScene} durationInFrames={1800} fps={30} width={1080} height={1920} />
    <Composition id="Torre" component={Torre} durationInFrames={1713} fps={30} width={1080} height={1920} />
    <Composition id="Ponte" component={Ponte} durationInFrames={PT.frames} fps={30} width={1080} height={1920} />
    <Composition id="Barragem" component={Barragem} durationInFrames={BT.frames} fps={30} width={1080} height={1920} />
    <Composition id="Supermercado" component={Supermercado} durationInFrames={ST.frames} fps={30} width={1080} height={1920} />
    <Composition id="Alcatraz" component={Alcatraz} durationInFrames={AT.frames} fps={30} width={1080} height={1920} />
    <Composition id="Tunel" component={Tunel} durationInFrames={TT.frames} fps={30} width={1080} height={1920} />
  </>
);
