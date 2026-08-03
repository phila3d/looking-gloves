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

  // Calculates exact aspect ratio dynamically from extracted frame pixels
  const aspect = frames[0].width / frames[0].height;

  return (
    <div 
      className="w-full relative overflow-hidden rounded-lg bg-black" 
      style={{ aspectRatio: `${aspect}` }}
    >
      <Canvas
        key={aspect}
        orthographic
        flat
        linear
        frameloop="demand"
        camera={{
          left: -aspect,
          right: aspect,
          top: 1,
          bottom: -1,
          near: 0.1,
          far: 10,
          position: [0, 0, 1],
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <mesh scale={[aspect, 1, 1]} material={material!}>
          <planeGeometry args={[2, 2, 1, 1]} />
        </mesh>
      </Canvas>
    </div>
  );
};