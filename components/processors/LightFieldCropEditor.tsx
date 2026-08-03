import React, { useState, useEffect } from 'react';
import { Cropper } from '@/components/common/Cropper';
import { IconButton } from '@/components/common/IconButton';
import { LightFieldFocusViewer } from '@/components/common/LightFieldFocusViewer';
import { focusScale, useSequence } from '@components/editor/useSequence';
import { scrollToBottom } from '@/utils/dom';
import { SequenceProcessorInfo } from './types';

export const LightFieldCropEditor: SequenceProcessorInfo = ({ activated, onDone }) => {
  const { focus, frames, cropRegion, setCropRegion } = useSequence();

  // Dynamically calculate native video ratio
  const videoRatio = frames?.[0] ? frames[0].width / frames[0].height : 16 / 9;

  const [aspectPreset, setAspectPreset] = useState<string>('native');
  const [customW, setCustomW] = useState<number>(3);
  const [customH, setCustomH] = useState<number>(4);

  // Determine active ratio number
  const currentRatio =
    aspectPreset === 'native' ? videoRatio :
    aspectPreset === '3:4' ? 3 / 4 :
    aspectPreset === '4:3' ? 4 / 3 :
    aspectPreset === '16:9' ? 16 / 9 :
    aspectPreset === '9:16' ? 9 / 16 :
    aspectPreset === '1:1' ? 1 :
    (customW && customH ? customW / customH : videoRatio);

  const onConfirm = () => {
    onDone();
  };

  useEffect(() => {
    if (frames?.length && activated) {
      scrollToBottom();
    }
  }, [frames, activated]);

  useEffect(() => {
    // Clearing cropRegion lets the Cropper recalculate a proper centered box
    setCropRegion(undefined);
  }, [currentRatio, setCropRegion]);

  if (!activated) return null;

  return (
    <div className="w-full max-w-3xl flex flex-col items-start gap-4">
      <h2>Crop</h2>
      <p>Drag the handles below to crop</p>

      {/* Styled dropdown with explicit dark/light mode and Incognito text contrast */}
      <div className="flex items-center gap-2 my-2 text-sm text-gray-800 dark:text-gray-200">
        <label className="font-medium">Aspect Ratio:</label>
        <select
          value={aspectPreset}
          onChange={(e) => setAspectPreset(e.target.value)}
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="native">Original (Video Aspect Ratio)</option>
          <option value="3:4">3:4 (Looking Glass Portrait)</option>
          <option value="16:9">16:9 (Widescreen)</option>
          <option value="4:3">4:3</option>
          <option value="9:16">9:16 (Looking Glass Go)</option>
          <option value="1:1">1:1 (Square)</option>
        </select>
      </div>

      <div className="w-full relative">
        <Cropper targetRatio={currentRatio}>
          <LightFieldFocusViewer focus={focus} frames={frames} />
        </Cropper>
      </div>

      <div className="w-full flex justify-end mt-2">
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

LightFieldCropEditor.title = 'Crop';