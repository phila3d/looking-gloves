import { useState, useEffect } from 'react';
import { Crop } from 'react-image-crop';

import { Cropper } from '@/components/common/Cropper';
import { IconButton } from '@/components/common/IconButton';
import { LightFieldFocusViewer } from '@/components/common/LightFieldFocusViewer';
import { focusScale, useSequence } from '@/components/editor/useSequence';
import { ASPECT_RATIO } from '@/utils/constant';
import { scrollToBottom } from '@/utils/dom';

import { SequenceProcessorInfo } from './types';

export const LightFieldCropEditor: SequenceProcessorInfo = ({ activated, onDone }) => {
  const { focus, frames, cropRegion, setCropRegion } = useSequence();

// Line 16: Set default preset to match widescreen video
const [aspectPreset, setAspectPreset] = useState<string>('16:9');
const [customW, setCustomW] = useState<number>(3);
const [customH, setCustomH] = useState<number>(4);

// Determine active ratio number
const currentRatio = 
  aspectPreset === '3:4' ? 3 / 4 :
  aspectPreset === '4:3' ? 4 / 3 :
  aspectPreset === '16:9' ? 16 / 9 :
  aspectPreset === '9:16' ? 9 / 16 :
  aspectPreset === '1:1' ? 1 :
  (customW && customH ? customW / customH : 3 / 4);
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
    {/* rest of your crop editor JSX */}
  </div>
);
      <h2>Crop</h2>
      <p>Drag the handles below to crop</p>

<div className="flex items-center gap-2 my-2 text-sm text-white">
  <label className="font-medium">Aspect Ratio:</label>
  <select 
    value={aspectPreset} 
    onChange={(e) => setAspectPreset(e.target.value)}
    className="bg-gray-800 border border-gray-600 text-white rounded px-2 py-1"
  >
    <option value="3:4">3:4 (Portrait / Default)</option>
    <option value="4:3">4:3 (Landscape)</option>
    <option value="16:9">16:9 (Widescreen)</option>
    <option value="9:16">9:16 (Looking Glass Go)</option>
    <option value="1:1">1:1 (Square)</option>
    <option value="custom">Custom...</option>
  </select>

  {aspectPreset === 'custom' && (
    <div className="flex items-center gap-1 ml-2">
      <input 
        type="number" 
        value={customW} 
        onChange={(e) => setCustomW(parseFloat(e.target.value) || 1)}
        className="w-14 bg-gray-800 border border-gray-600 text-white rounded px-1 py-0.5 text-center"
      />
      <span>:</span>
      <input 
        type="number" 
        value={customH} 
        onChange={(e) => setCustomH(parseFloat(e.target.value) || 1)}
        className="w-14 bg-gray-800 border border-gray-600 text-white rounded px-1 py-0.5 text-center"
      />
    </div>
  )}
</div>

      <div className="relative max-w-full">
        <Cropper
          key={currentRatio}
          source={frames?.[0]}
          targetRatio={currentRatio}
          crop={cropRegion}
          onChange={setCropRegion}
        >
          <LightFieldFocusViewer focus={focus / focusScale} frames={frames} />
        </Cropper>
      </div>

      <div className="w-full flex justify-end gap-4">
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
