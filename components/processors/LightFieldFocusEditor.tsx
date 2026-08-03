import React, { useState } from 'react';
import { IconButton } from '@/components/common/IconButton';
import { LightFieldFocusViewer } from '@/components/common/LightFieldFocusViewer';
import { useSequence } from '@/components/editor/useSequence';
import { SequenceProcessorInfo } from './types';

export const LightFieldFocusEditor: SequenceProcessorInfo = ({ activated, onDone }) => {
  const { focus, setFocus, frames } = useSequence();
  const [adjustedFocus, setAdjustedFocus] = useState<number>(focus || 0);

  const onFocusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdjustedFocus(parseFloat(e.target.value));
  };

  const onConfirm = () => {
    setFocus(adjustedFocus);
    onDone();
  };

  if (!activated) return null;

  return (
    <div className="w-full max-w-3xl flex flex-col items-start gap-4">
      <h2>Adjust light field focus</h2>
      <p>Drag the slider below to focus on your target</p>

      <div className="w-full">
        <LightFieldFocusViewer focus={adjustedFocus} frames={frames} />
      </div>

      <div className="w-full flex items-center gap-4 mt-2">
        <input
          type="range"
          className="range w-full"
          min="-0.025"
          max="0.025"
          step="0.0001"
          value={adjustedFocus}
          onChange={onFocusChange}
        />
        <IconButton
          tooltip="Confirm"
          iconType="tick"
          buttonClassName="btn-success"
          onClick={onConfirm}
        />
      </div>
    </div>
  );
};

LightFieldFocusEditor.title = 'Edit focus';