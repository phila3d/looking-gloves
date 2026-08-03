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

  // Reads exact pixel dimensions of whatever source/crop you load
  const aspect = frames[0].width / frames[0].height;

  return (
    <Canvas
      flat
      linear
      frameloop="demand"
      camera={{ position: [0, 0, cameraZ] }}
      className="w-full rounded-lg"
      style={{ width: '100%', aspectRatio: `${aspect}` }}
    >
      <mesh material={material!}>
        {/* Dynamic width adjustment for any arbitrary aspect ratio */}
        <planeGeometry args={[planeSize * aspect, planeSize, 1, 1]} />
      </mesh>
    </Canvas>
  );
};