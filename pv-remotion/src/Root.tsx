import React from 'react';
import {Composition} from 'remotion';
import {FourGamesPV} from './PV';

export const Root: React.FC = () => {
  return (
    <Composition
      id="FourGamesPV"
      component={FourGamesPV}
      durationInFrames={120 * 30}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
