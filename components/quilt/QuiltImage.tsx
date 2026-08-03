import cls from 'classnames';
import { FC, useEffect, useRef, HTMLAttributes } from 'react';

import { useSequence } from '@/components/editor/useSequence';
import { drawSourceOntoDest } from '@/utils/canvas';
import { COLS, FRAME_WIDTH, FRAME_HEIGHT } from '@/utils/constant';

export interface QuiltImageProps extends HTMLAttributes<HTMLCanvasElement> {
  onRendered?: (canvas: HTMLCanvasElement) => void;
}

export const QuiltImage: FC<QuiltImageProps> = ({ className, onRendered, ...props }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { focus, frames, cropRegion } = useSequence();

  useEffect(() => {
    if (frames?.length && onRendered && canvasRef.current) {
      const firstFrame = frames[0];
      
      // 1. Default tile aspect ratio to the native video frame proportions
      let tileAspect = firstFrame ? firstFrame.width / firstFrame.height : 16 / 9;

      // 2. Override tile aspect ratio if a crop region exists
      if (firstFrame && cropRegion?.width && cropRegion?.height) {
        const cropW = cropRegion.unit === '%' 
          ? (firstFrame.width * cropRegion.width) / 100 
          : cropRegion.width;
        const cropH = cropRegion.unit === '%' 
          ? (firstFrame.height * cropRegion.height) / 100 
          : cropRegion.height;

        if (cropW > 0 && cropH > 0) {
          tileAspect = cropW / cropH;
        }
      }

      // 3. Dynamically calculate tile height from active aspect ratio
      const frameHeight = Math.floor(FRAME_WIDTH / tileAspect);

      const rows = Math.ceil(frames.length / COLS);
      canvasRef.current.width = COLS * FRAME_WIDTH;
      canvasRef.current.height = rows * frameHeight;

      const ctx = canvasRef.current.getContext('2d')!;
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Draw frames to quilt canvas
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const col = i % COLS;
        const row = rows - 1 - Math.floor(i / COLS);
        const x = col * FRAME_WIDTH;
        const y = row * frameHeight;

        // Calculate offset according to focus value
        const focusValue = focus / 10;
        const offset = (i - frames.length / 2) * -focusValue * frame.width;

        // Draw actual frame onto quilt
        drawSourceOntoDest(frame, canvasRef.current, cropRegion!, {
          dx: x,
          dy: y,
          dw: FRAME_WIDTH,
          dh: frameHeight, // FIXED: Now uses dynamic frameHeight instead of FRAME_HEIGHT!
          sourceOffsetX: offset,
          fillEdge: true,
        });
      }

      onRendered?.(canvasRef.current);
    }
  }, [frames, focus, cropRegion, onRendered]);

  if (!frames?.length) return null;

  return (
    <div className="max-w-2xl">
      <canvas
        ref={canvasRef}
        className={cls('rounded-lg drop-shadow-lg w-full', className)}
        {...props}
      />
    </div>
  );
};