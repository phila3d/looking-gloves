import styled from '@emotion/styled';
import { Slider } from '@mui/material';
import { useState, useEffect } from 'react';

import { IconButton } from '@/components/common/IconButton';
import { ImageSequenceAnimation } from '@/components/common/ImageSequenceAnimation';
import { useSequence } from '@/components/editor/useSequence';
import { SequenceProcessorInfo } from '@/components/processors/types';
import { scrollToBottom } from '@/utils/dom';

const StyledSlider = styled(Slider)`
  .MuiSlider-rail {
    height: 0.5rem;
    background-color: rgb(31, 41, 55);
    opacity: 0.2;
  }

  .MuiSlider-track {
    height: 1.5rem;
    border-radius: 0;
    border: none;
    background-color: rgb(31, 41, 55);
  }

  .MuiSlider-thumb {
    width: 24px;
    height: 24px;
    border: 3px solid rgb(31, 41, 55);
    background-color: #fff;

    &:hover {
      box-shadow: none;
    }
  }

  @media (prefers-color-scheme: dark) {
    .MuiSlider-rail {
      background-color: #2c3647;
      opacity: 1;
    }

    .MuiSlider-track {
      background-color: #a6adba;
    }

    .MuiSlider-thumb {
      border-color: #a6adba;
      background-color: #2a303c;
    }
  }
`;

export const VideoRangeSelector: SequenceProcessorInfo = ({ activated, onDone }) => {
  const { sourceFrames, range, setRange, setFrames } = useSequence();

  const [framesRange, setFramesRange] = useState<[number, number]>([0, 0]);

  const onRangeChange = (newRange: number[]) => {
    setFramesRange([newRange[0], newRange[1]]);
  };

  const onConfirmFrames = () => {
    setRange([framesRange[0], framesRange[1]]);
    setFrames(sourceFrames!.slice(framesRange[0], framesRange[1]));
    onDone();
  };

  useEffect(() => {
    if (activated && sourceFrames && sourceFrames.length > 0) {
      const start = range && isFinite(range[0]) ? range[0] : 0;
      const end = range && isFinite(range[1]) ? range[1] : sourceFrames.length;
      setFramesRange([start, end]);
      scrollToBottom();
    }
  }, [range, sourceFrames, activated]);

  if (!activated) return null;

  return (
    <div className="flex flex-col items-center md:items-start gap-2 max-w-full">
      <h2>Select range</h2>
      <p>Drag the start and end handles to trim unneeded frames</p>

      <ImageSequenceAnimation
        frames={sourceFrames}
        start={framesRange[0]}
        end={framesRange[1]}
        style={{ width: 600 }}
      />

      <div className="w-full flex items-center gap-4">
        <StyledSlider
          value={framesRange}
          onChange={(e, newValue) => onRangeChange(newValue as number[])}
          step={1}
          min={0}
          max={sourceFrames?.length || 0}
          valueLabelDisplay="auto"
        />
        <IconButton iconType="tick" buttonClassName="btn-success" onClick={onConfirmFrames} />
      </div>
    </div>
  );
};

VideoRangeSelector.title = 'Select range';