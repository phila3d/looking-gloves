import styled from '@emotion/styled';
import { Slider } from '@mui/material';
import React, { useState, useEffect, useRef } from 'react';

import { IconButton } from '@/components/common/IconButton';
import { useProgress } from '@/components/editor/useProgress';
import { useSequence } from '@/components/editor/useSequence';
import { SequenceProcessorInfo } from '@/components/processors/types';
import { drawSourceToCanvas } from '@/utils/canvas';
import { COLS } from '@/utils/constant';

import { useSource } from '../editor/useSource';

const NoFrames: HTMLCanvasElement[] = [];
const maxFrameWidth = 1000;
const ASSUMED_FPS = 30;
const FRAME_STEP = 1 / ASSUMED_FPS;

const StyledSlider = styled(Slider)<{ showcenter: string }>`
  .MuiSlider-rail {
    height: 0.6rem;
    background-color: rgba(100, 116, 139, 0.3);
    opacity: 1;
  }

  .MuiSlider-track {
    height: 0.6rem;
    border-radius: 4px;
    border: none;
    background-color: #3b82f6;
  }

  .MuiSlider-thumb {
    width: 20px;
    height: 28px;
    border-radius: 4px;
    border: 2px solid #ffffff;
    background-color: #3b82f6;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);

    &:hover,
    &.Mui-active {
      box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2);
    }

    ${(props) =>
      props.showcenter === 'true' &&
      `
      &[data-index="1"] {
        background-color: #f59e0b;
        border-color: #ffffff;
        width: 22px;
        height: 32px;
        z-index: 2;

        &:hover,
        &.Mui-active {
          box-shadow: 0 0 0 8px rgba(245, 158, 11, 0.25);
        }
      }
    `}
  }

  .MuiSlider-valueLabel {
    background-color: #1e293b;
    font-size: 0.75rem;
    border-radius: 4px;
    padding: 2px 6px;
  }
`;

export const VideoFramesExtractor: SequenceProcessorInfo = ({ activated, onDone }) => {
  const { updateProgress } = useProgress();
  const { sourceFrames, setSourceFrames, setFrames } = useSequence();
  const { setSourceInfo } = useSource();

  const inputRef = useRef<HTMLInputElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const [files, setFiles] = useState<FileList | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFrames, setVideoFrames] = useState<HTMLCanvasElement[]>(NoFrames);

  const [processing, setProcessing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [duration, setDuration] = useState(0);

  // Expand Preview State
  const [isExpanded, setIsExpanded] = useState(false);

  const [showCenterControl, setShowCenterControl] = useState(false);
  const [showImbalanceWarning, setShowImbalanceWarning] = useState(false);

  const [blinkTimes, setBlinkTimes] = useState<number[]>([]);

  const [timeRange, setTimeRange] = useState<[number, number, number]>([0, 0, 0]);
  const [currentTime, setCurrentTime] = useState(0);

  const timeRangeRef = useRef<[number, number, number]>([0, 0, 0]);
  timeRangeRef.current = timeRange;

  const expectedNumberOfFrames = useRef(0);
  const frameIndexRef = useRef(0);
  const frameWidth = useRef(0);
  const frameHeight = useRef(0);

  const createFrame = () => {
    return drawSourceToCanvas(videoRef.current!, frameWidth.current, frameHeight.current);
  };

  // Reset internal state cleanly when user clicks "+" to start over
  useEffect(() => {
    if (activated && (!sourceFrames || sourceFrames.length === 0)) {
      setIsLoaded(false);
      setProcessing(false);
      setIsPlaying(false);
      setIsExpanded(false);
      setShowImbalanceWarning(false);
      setFiles(null);
      setBlinkTimes([]);
      setTimeRange([0, 0, 0]);
      timeRangeRef.current = [0, 0, 0];
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      if (videoRef.current?.src) {
        URL.revokeObjectURL(videoRef.current.src);
        videoRef.current.src = '';
      }
    }
  }, [activated, sourceFrames]);

  const onVideoMetadataLoaded = () => {
    const videoDuration = videoRef.current!.duration;
    setDuration(videoDuration);

    const mid = videoDuration / 2;
    const initialRange: [number, number, number] = [0, mid, videoDuration];
    setTimeRange(initialRange);
    timeRangeRef.current = initialRange;
    setIsLoaded(true);

    const { videoWidth, videoHeight } = videoRef.current!;
    frameWidth.current = Math.floor(Math.min(videoWidth, maxFrameWidth));
    frameHeight.current = Math.floor((frameWidth.current / videoWidth) * videoHeight);

    if (videoRef.current) {
      videoRef.current.currentTime = mid;
      videoRef.current.playbackRate = playbackSpeed;
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      const [start, , end] = timeRangeRef.current;
      if (videoRef.current.currentTime >= end || videoRef.current.currentTime < start) {
        videoRef.current.currentTime = start;
      }
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const handleTimeUpdate = () => {
    if (processing || !videoRef.current) return;

    const [start, , end] = timeRangeRef.current;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    if (cur >= end) {
      if (isPlaying) {
        videoRef.current.currentTime = start;
      } else {
        videoRef.current.currentTime = end;
      }
    }
  };

  const handleTrackMouseDownCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('MuiSlider-thumb') || target.closest('.MuiSlider-thumb')) {
      return;
    }

    e.stopPropagation();

    if (!sliderContainerRef.current || duration <= 0) return;

    const rect = sliderContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const clickedTime = percentage * duration;

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      videoRef.current.currentTime = clickedTime;
      setCurrentTime(clickedTime);
    }
  };

  const handleSliderChange = (newValues: number[], activeThumb: number) => {
    if (videoRef.current && isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    if (!showCenterControl) {
      const [newStart, newEnd] = newValues as [number, number];
      const newCenter = (newStart + newEnd) / 2;
      const updatedRange: [number, number, number] = [newStart, newCenter, newEnd];
      setTimeRange(updatedRange);
      timeRangeRef.current = updatedRange;

      if (videoRef.current) {
        videoRef.current.currentTime = activeThumb === 0 ? newStart : newEnd;
      }
    } else {
      let [start, middle, end] = newValues as [number, number, number];

      if (activeThumb === 0) {
        if (start > middle) middle = start;
        if (middle > end) end = middle;
        if (videoRef.current) videoRef.current.currentTime = start;
      } else if (activeThumb === 1) {
        if (middle < start) start = middle;
        if (middle > end) end = middle;
        if (videoRef.current) videoRef.current.currentTime = middle;
      } else if (activeThumb === 2) {
        if (end < middle) middle = end;
        if (middle < start) start = middle;
        if (videoRef.current) videoRef.current.currentTime = end;
      }

      const updatedRange: [number, number, number] = [start, middle, end];
      setTimeRange(updatedRange);
      timeRangeRef.current = updatedRange;
    }
  };

  const isCurrentFrameBlink = blinkTimes.some((b) => Math.abs(b - currentTime) < 0.08);

  const toggleBlinkFlag = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;

    if (isCurrentFrameBlink) {
      setBlinkTimes((prev) => prev.filter((b) => Math.abs(b - cur) >= 0.08));
    } else {
      setBlinkTimes((prev) => [...prev, cur].sort((a, b) => a - b));
    }
  };

  const removeBlinkTime = (targetTime: number) => {
    setBlinkTimes((prev) => prev.filter((b) => Math.abs(b - targetTime) >= 0.02));
  };

  const setAsCenterView = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    let [start, , end] = timeRangeRef.current;

    if (cur < start) start = cur;
    if (cur > end) end = cur;

    const updatedRange: [number, number, number] = [start, cur, end];
    setTimeRange(updatedRange);
    timeRangeRef.current = updatedRange;
  };

  const equalizeDurations = () => {
    const [start, center, end] = timeRangeRef.current;
    const leftDur = center - start;
    const rightDur = end - center;
    const minRadius = Math.min(leftDur, rightDur);

    const newStart = Math.max(0, center - minRadius);
    const newEnd = Math.min(duration, center + minRadius);

    const updatedRange: [number, number, number] = [newStart, center, newEnd];
    setTimeRange(updatedRange);
    timeRangeRef.current = updatedRange;
    return updatedRange;
  };

  const jumpToCenter = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeRangeRef.current[1];
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const stepFrame = (deltaFrames: number) => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + deltaFrames * FRAME_STEP));
    videoRef.current.currentTime = newTime;
  };

  const handleConfirmClick = () => {
    const [start, center, end] = timeRangeRef.current;
    const leftSec = center - start;
    const rightSec = end - center;
    const isImbalanced = Math.abs(leftSec - rightSec) > 0.3;

    if (showCenterControl && isImbalanced) {
      setShowImbalanceWarning(true);
    } else {
      startExtraction(timeRangeRef.current);
    }
  };

  const handleBalanceAndExtract = () => {
    setShowImbalanceWarning(false);
    const balancedRange = equalizeDurations();
    startExtraction(balancedRange);
  };

  const handleExtractImbalanced = () => {
    setShowImbalanceWarning(false);
    startExtraction(timeRangeRef.current);
  };

  const applyBlinkMicroShift = (rawTime: number): number => {
    if (blinkTimes.length === 0) return rawTime;

    const BLINK_WINDOW = 0.12;
    const SHIFT_OFFSET = 0.16;

    for (const bTime of blinkTimes) {
      if (Math.abs(rawTime - bTime) <= BLINK_WINDOW) {
        if (rawTime <= bTime) {
          return Math.max(0, bTime - SHIFT_OFFSET);
        } else {
          return Math.min(duration, bTime + SHIFT_OFFSET);
        }
      }
    }
    return rawTime;
  };

  const startExtraction = (rangeToUse = timeRangeRef.current) => {
    setProcessing(true);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.playbackRate = 1.0;
    }
    setVideoFrames(NoFrames);

    timeRangeRef.current = rangeToUse;
    const [startTime, centerTime, endTime] = rangeToUse;
    const totalDuration = endTime - startTime;

    const totalFramesInSegment = Math.floor(totalDuration * ASSUMED_FPS);
    const numberOfFramesToExtract = Math.ceil(totalFramesInSegment / COLS) * COLS;
    expectedNumberOfFrames.current = Math.min(numberOfFramesToExtract, 48);

    frameIndexRef.current = 0;
    updateProgress(0, 'Extracting video frames ...');

    const initialSeek = applyBlinkMicroShift(startTime);
    videoRef.current!.currentTime = initialSeek;
  };

  const onVideoSeeked = () => {
    if (!processing) return;

    setTimeout(() => {
      const frame = createFrame();
      setVideoFrames((frames) => [...frames, frame]);

      const [startTime, centerTime, endTime] = timeRangeRef.current;
      const totalFrames = expectedNumberOfFrames.current;
      const halfFrames = totalFrames / 2;

      if (frameIndexRef.current < totalFrames - 1) {
        frameIndexRef.current += 1;
        const idx = frameIndexRef.current;

        updateProgress(idx / totalFrames, 'Extracting video frames ...');

        let rawTime = 0;
        if (!showCenterControl) {
          const step = (endTime - startTime) / totalFrames;
          rawTime = startTime + idx * step;
        } else {
          if (idx <= halfFrames) {
            const leftStep = (centerTime - startTime) / halfFrames;
            rawTime = startTime + idx * leftStep;
          } else {
            const rightStep = (endTime - centerTime) / halfFrames;
            rawTime = centerTime + (idx - halfFrames) * rightStep;
          }
        }

        const shiftedTime = applyBlinkMicroShift(rawTime);
        videoRef.current!.currentTime = shiftedTime;
      } else {
        updateProgress(1);
        setProcessing(false);
      }
    }, 20);
  };

  useEffect(() => {
    if (videoRef.current?.src) {
      URL.revokeObjectURL(videoRef.current.src);
      videoRef.current.src = '';
    }

    if (files?.[0]) {
      setIsLoaded(false);
      setIsPlaying(false);
      setIsExpanded(false);
      setShowImbalanceWarning(false);
      setBlinkTimes([]);
      setVideoFrames(NoFrames);

      const file = files[0];
      const url = URL.createObjectURL(file);
      if (videoRef.current) {
        videoRef.current.src = url;
      }

      setSourceInfo({ title: file.name, sourceType: 'file' });
    }
  }, [files]);

  useEffect(() => {
    if (
      videoFrames.length > 0 &&
      videoFrames.length >= expectedNumberOfFrames.current
    ) {
      setSourceFrames(videoFrames);
      setFrames(videoFrames);
      onDone();
    }
  }, [videoFrames]);

  if (!activated) return null;

  const currentFrameNum = Math.floor(currentTime * ASSUMED_FPS);
  const totalVideoFrames = Math.floor(duration * ASSUMED_FPS);
  const selectedDuration = (timeRange[2] - timeRange[0]).toFixed(2);
  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const leftSec = (timeRange[1] - timeRange[0]).toFixed(2);
  const rightSec = (timeRange[2] - timeRange[1]).toFixed(2);
  const isSpeedImbalanced = Math.abs(parseFloat(leftSec) - parseFloat(rightSec)) > 0.3;

  const sliderValues = showCenterControl
    ? timeRange
    : [timeRange[0], timeRange[2]];

  return (
    <div className="flex flex-col items-center md:items-start gap-3 max-w-full">
      <h2>Please select a video file</h2>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        disabled={processing}
        className="file-input h-auto w-full sm:w-96 mt-1"
        onChange={(e) => setFiles(e.target.files)}
      />

      {/* Dynamic Container Width (max-w-xl normally, max-w-4xl when expanded) */}
      <div
        className={`relative flex flex-col items-center w-full transition-all duration-300 ${
          isExpanded ? 'max-w-4xl' : 'max-w-xl'
        }`}
      >
        {isLoaded && !processing && (
          <button
            type="button"
            className={`absolute top-2 right-2 z-20 btn btn-xs shadow-md transition-all ${
              isExpanded
                ? 'btn-accent font-bold'
                : 'btn-neutral opacity-80 hover:opacity-100'
            }`}
            onClick={() => setIsExpanded(!isExpanded)}
            title="Expand video preview size for inspecting facial details and blinks"
          >
            {isExpanded ? '📺 Standard View' : '📺 Expand Preview'}
          </button>
        )}

        <video
          ref={videoRef}
          muted
          playsInline
          controls={false}
          className={`rounded-xl border border-base-300 w-auto transition-all duration-300 ${
            isLoaded ? 'block shadow-sm' : 'hidden'
          } ${isExpanded ? 'max-h-[75vh] max-w-full' : 'max-h-80 max-w-full'}`}
          onLoadedMetadata={onVideoMetadataLoaded}
          onTimeUpdate={handleTimeUpdate}
          onSeeked={onVideoSeeked}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Extraction Progress Overlay */}
        {processing && (
          <div className="absolute inset-0 bg-base-300/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-6 gap-3 z-30">
            <span className="loading loading-spinner loading-lg text-primary" />
            <div className="text-center">
              <p className="font-semibold text-sm">Extracting Spatial Quilt Frames...</p>
              <p className="text-xs opacity-75 mt-1 font-mono">
                Frame {frameIndexRef.current + 1} / {expectedNumberOfFrames.current}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Control Card (Matches container width) */}
      {isLoaded && !processing && (
        <div
          className={`w-full flex flex-col gap-3 p-4 bg-base-200/60 rounded-xl border border-base-300 shadow-sm transition-all duration-300 ${
            isExpanded ? 'max-w-4xl' : 'max-w-xl'
          }`}
        >
          {/* Top Status Header */}
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="flex items-center gap-2">
              <span>Frame:</span>
              <span className="badge badge-primary font-mono">{currentFrameNum} / {totalVideoFrames}</span>
              {blinkTimes.length > 0 && (
                <span className="badge badge-warning text-[10px] gap-1 font-sans">
                  👁️ {blinkTimes.length} {blinkTimes.length === 1 ? 'Blink' : 'Blinks'} Flagged
                </span>
              )}
            </span>

            <div className="flex items-center gap-3">
              {showCenterControl && (
                <span className="text-xs opacity-75 font-mono">
                  L: <strong>{leftSec}s</strong> | R: <strong>{rightSec}s</strong>
                </span>
              )}
              <span className="text-xs opacity-75">
                Clip: <strong>{selectedDuration}s</strong> ({Math.round(parseFloat(selectedDuration) * ASSUMED_FPS)} frames)
              </span>
            </div>
          </div>

          {/* Range Slider Track with Playhead & Blink Markers */}
          <div
            ref={sliderContainerRef}
            className="relative px-2 py-1 cursor-pointer"
            onMouseDownCapture={handleTrackMouseDownCapture}
          >
            {/* Red Playhead Line Overlay */}
            <div
              className="absolute top-1 bottom-1 w-0.5 bg-red-500 z-10 pointer-events-none transition-all duration-75 shadow-sm"
              style={{ left: `calc(${playheadPercent}% + 8px - ${playheadPercent * 0.16}px)` }}
            />

            {/* Amber Blink Markers Overlay */}
            {blinkTimes.map((bTime, idx) => {
              const bPct = duration > 0 ? (bTime / duration) * 100 : 0;
              return (
                <div
                  key={idx}
                  className="absolute top-1 bottom-1 w-1 bg-amber-500 z-10 pointer-events-auto rounded-full shadow-sm hover:scale-125 transition-transform"
                  style={{ left: `calc(${bPct}% + 8px - ${bPct * 0.16}px)` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBlinkTime(bTime);
                  }}
                  title={`Flagged Blink at ${bTime.toFixed(2)}s (Click to unflag)`}
                />
              );
            })}

            <StyledSlider
              showcenter={showCenterControl ? 'true' : 'false'}
              value={sliderValues}
              onChange={(e, val, activeThumb) => handleSliderChange(val as number[], activeThumb)}
              min={0}
              max={duration}
              step={0.01}
              valueLabelDisplay="auto"
              valueLabelFormat={(v, idx) => {
                if (!showCenterControl) {
                  const labelType = idx === 0 ? 'Start' : 'End';
                  return `${labelType}: ${v.toFixed(2)}s (F${Math.floor(v * ASSUMED_FPS)})`;
                }
                const labelType = idx === 1 ? 'Center 🎯' : idx === 0 ? 'Start' : 'End';
                return `${labelType}: ${v.toFixed(2)}s (F${Math.floor(v * ASSUMED_FPS)})`;
              }}
            />
          </div>

          {/* Row 1: Primary Transport Controls */}
          <div className="flex items-center justify-between gap-2 pt-1 border-b border-base-300 pb-3">
            {/* Step & Blink Controls */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="btn btn-xs btn-ghost border border-base-300"
                  onClick={() => stepFrame(-1)}
                  title="Step Back 1 Frame"
                >
                  ◀ -1
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-ghost border border-base-300"
                  onClick={() => stepFrame(1)}
                  title="Step Forward 1 Frame"
                >
                  +1 ▶
                </button>
              </div>

              <button
                type="button"
                className={`btn btn-xs ${
                  isCurrentFrameBlink
                    ? 'btn-error text-white font-bold'
                    : 'btn-ghost border border-base-300 opacity-80 hover:opacity-100'
                }`}
                onClick={toggleBlinkFlag}
                title={
                  isCurrentFrameBlink
                    ? 'Unflag blink at current frame'
                    : 'Flag peak blink frame to prevent closed eyes in extraction'
                }
              >
                {isCurrentFrameBlink ? '❌ Unflag Blink' : '👁️ Flag Blink'}
              </button>
            </div>

            {/* Play & Speed */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`btn btn-sm ${isPlaying ? 'btn-warning' : 'btn-primary'} gap-1 min-w-[5.5rem]`}
                onClick={togglePlay}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost border border-base-300 font-mono text-xs"
                onClick={cycleSpeed}
                title="Change Playback Speed"
              >
                {playbackSpeed}x
              </button>
            </div>

            {/* Confirm Button */}
            <IconButton
              iconType="tick"
              buttonClassName="btn-success btn-sm"
              onClick={handleConfirmClick}
            />
          </div>

          {/* Imbalance Warning Prompt Banner */}
          {showImbalanceWarning && (
            <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-lg flex flex-col gap-2">
              <div className="flex items-start gap-2 text-xs font-medium text-amber-900 dark:text-amber-200">
                <span className="text-base leading-none">⚠️</span>
                <span>
                  <strong>Unbalanced Panning Speed:</strong> Left side ({leftSec}s) and Right side ({rightSec}s) have unequal durations. This may cause motion blur on one side of your hologram.
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="btn btn-xs btn-ghost"
                  onClick={() => setShowImbalanceWarning(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-ghost border border-amber-500/40 text-amber-900 dark:text-amber-200"
                  onClick={handleExtractImbalanced}
                >
                  Extract Anyway
                </button>
                <button
                  type="button"
                  className="btn btn-xs bg-amber-500 hover:bg-amber-600 text-slate-950 border-none font-bold shadow-sm"
                  onClick={handleBalanceAndExtract}
                >
                  ⚖️ Balance & Extract
                </button>
              </div>
            </div>
          )}

          {/* Row 2: Center View Toggle & Tooltip */}
          <div className="flex flex-col gap-2 pt-0.5">
            <div className="flex items-center gap-2 select-none">
              <label className="cursor-pointer flex items-center gap-2 text-xs font-semibold opacity-90 hover:opacity-100">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs checkbox-primary"
                  checked={showCenterControl}
                  onChange={(e) => {
                    setShowCenterControl(e.target.checked);
                    if (!e.target.checked) setShowImbalanceWarning(false);
                  }}
                />
                <span>Adjust Center Frame (Advanced)</span>
              </label>

              <div
                className="tooltip tooltip-right font-normal text-xs"
                data-tip="Locks your subject as the head-on view when they aren't centered in the video clip, keeping depth smooth and balanced."
              >
                <span className="cursor-help opacity-60 hover:opacity-100 text-xs">ℹ️</span>
              </div>
            </div>

            {/* Unified Inset Toolbar */}
            {showCenterControl && (
              <div className="flex items-center justify-between gap-2 p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Center Tools:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-xs bg-amber-500 hover:bg-amber-600 text-slate-950 border-none font-semibold shadow-sm"
                    onClick={setAsCenterView}
                    title="Lock current frame on screen as Center View 🎯"
                  >
                    🎯 Set Center
                  </button>

                  <button
                    type="button"
                    className={`btn btn-xs font-semibold ${
                      isSpeedImbalanced
                        ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 border border-amber-500/40 animate-pulse'
                        : 'btn-ghost opacity-50 cursor-default'
                    }`}
                    onClick={isSpeedImbalanced ? equalizeDurations : undefined}
                    title={
                      isSpeedImbalanced
                        ? 'Balance Left and Right clip durations to ensure uniform panning speed'
                        : 'Clip is balanced!'
                    }
                  >
                    {isSpeedImbalanced ? '⚖️ Balance Trim' : 'Balanced ✓'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-xs btn-ghost border border-amber-500/30 text-amber-900 dark:text-amber-100 hover:bg-amber-500/20 font-medium"
                    onClick={jumpToCenter}
                    title="View Center Frame"
                  >
                    👁 View Center
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

VideoFramesExtractor.title = 'Extract video frames';