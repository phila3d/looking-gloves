import { Canvas } from '@react-three/fiber';
import React, { FC, useEffect } from 'react';
import { DataArrayTexture } from 'three';

import {
  material,
  setTexture,
  setTextureFocus,
  disposeTexture,
} from '@/components/common/LightFieldMaterial';

export interface LightFieldFocusViewerProps {
  focus?: number;
  frames?: HTMLCanvasElement[];
}

export const LightFieldFocusViewer: FC<LightFieldFocusViewerProps> = ({
  focus = 0,
  frames,
}) => {
  const fov = 75;
  const planeSize = 1;
  const cameraZ = planeSize / (2 * Math.tan((fov * Math.PI) / 360));

  useEffect(() => {
    return () => disposeTexture();
  }, []);

  useEffect(() => {
    setTextureFocus(focus);
  }, [focus]);

  useEffect(() => {
    if (frames?.length) {
      const numberOfFrames = frames.length;
      const frameWidth = frames[0].width;
      const frameHeight = frames[0].height;

      let offset = 0;
      const data = new Uint8Array(frameWidth * frameHeight * 4 * numberOfFrames);
      for (const frame of [...frames].reverse()) {
        const imgData = frame.getContext('2d')!.getImageData(0, 0, frameWidth, frameHeight);
        data.set(imgData.data, offset);
        offset += imgData.data.byteLength;
      }

      const texture = new DataArrayTexture(data, frameWidth, frameHeight, numberOfFrames);
      setTexture(texture, numberOfFrames);
    }
  }, [frames]);

  if (!frames?.length) return null;

  const aspect = frames[0].width / frames[0].height;

  return (
    <div 
      className="w-full relative overflow-hidden rounded-lg bg-black" 
      style={{ aspectRatio: `${aspect}` }}
    >
      <Canvas
        key={aspect}
        flat
        linear
        frameloop="demand"
        camera={{ position: [0, 0, cameraZ], fov }}
        style={{ width: '100%', height: '100%' }}
      >
        <mesh scale={[aspect, 1, 1]} material={material!}>
          <planeGeometry args={[planeSize, planeSize, 1, 1]} />
        </mesh>
      </Canvas>
    </div>
  );
};