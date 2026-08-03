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

  // Calculates exact aspect ratio directly from source video pixels
  const aspect = frames[0].width / frames[0].height;

  return (
    <div 
      className="w-full relative overflow-hidden rounded-lg bg-black" 
      style={{ aspectRatio: `${aspect}` }}
    >
      <Canvas
        flat
        linear
        frameloop="demand"
        camera={{ position: [0, 0, cameraZ] }}
        style={{ width: '100%', height: '100%' }}
      >
        <mesh material={material!}>
          {/* Matches 3D mesh width to aspect ratio */}
          <planeGeometry args={[planeSize * aspect, planeSize, 1, 1]} />
        </mesh>
      </Canvas>
    </div>
  );
};