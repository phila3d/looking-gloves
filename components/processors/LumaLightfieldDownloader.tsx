import { FC, useState } from 'react';
import { unzip } from 'unzipit';

import { useProgress } from '@/components/editor/useProgress';
import { useSequence } from '@/components/editor/useSequence';
import { useSource } from '@/components/editor/useSource';
import { SequenceProcessorInfo } from '@/components/processors/types';
import { drawBlobToCanvas } from '@/utils/canvas';
import { fetchWithProgress } from '@/utils/fetch';

export const LumaLightfieldDownloader: SequenceProcessorInfo = ({ activated, onDone }) => {
  const { updateProgress } = useProgress();
  const { setSourceInfo } = useSource();
  const { setSourceFrames, setEnforceOrder, setRange } = useSequence();

  const [url, setUrl] = useState('');
  const [fetching, setFetching] = useState(false);

  const getUrlFromClipboard = async () => {
    const text = await navigator.clipboard?.readText();
    if (text.startsWith('https://captures.lumalabs.ai/')) {
      setUrl(text);
    }
  };

  const startFetchingOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      downloadAndUnzipLightFieldFromLuma();
    }
  };

  const downloadAndUnzipLightFieldFromLuma = async () => {
    if (!url || fetching) return;

    setFetching(true);

    try {
      // 1. Fetch info via API proxy
      updateProgress(-1, 'Fetching info ...');
      const resp = await fetch(`/api/luma/getInfo?url=${encodeURIComponent(url)}`);
      if (!resp.ok) throw new Error(`API error: ${resp.status}`);
      
      const json = await resp.json();
      console.log('Luma NeRF info', json);

      // 2. Safe extraction with fallbacks
      const pageProps = json?.pageProps?.props?.pageProps || json?.props?.pageProps || json;
      const lightFieldZipUrl = pageProps?.artifacts?.light_field || pageProps?.light_field;
      const captureName = pageProps?.captureMeta?.captureName || 'Luma Capture';
      const username = pageProps?.captureMeta?.username || 'Anonymous';

      if (!lightFieldZipUrl) {
        throw new Error('Could not find light_field ZIP URL in Luma response.');
      }

      setSourceInfo({ title: captureName, author: username, url, sourceType: 'Luma' });

      // 3. Download light field photos ZIP
      const zipFilePath = new URL(lightFieldZipUrl).pathname;
      const zipDownloadUrl = `/external/luma/lightfield${zipFilePath}`;

      updateProgress(-1, 'Downloading light field photos ...');
      const zipFile = await fetchWithProgress(zipDownloadUrl, undefined, (received, total) => {
        const progress = total > 0 ? received / total : 0;
        const receivedInMB = (received / 1024 / 1024).toFixed(2);
        const totalInMB = total > 0 ? (total / 1024 / 1024).toFixed(2) : '?';
        updateProgress(
          progress * 0.9,
          `Downloading light field photos ${receivedInMB}MB / ${totalInMB}MB ...`
        );
      });

      // 4. Unzip and filter ONLY image files
      const { entries } = await unzip(zipFile);
      const validImageNames = Object.keys(entries)
        .filter((name) => !entries[name].isDirectory && /\.(jpg|jpeg|png|webp)$/i.test(name))
        .sort()
        .reverse();

      if (validImageNames.length === 0) {
        throw new Error('No valid image frames found inside the light field ZIP.');
      }

      // 5. Draw frames into canvas
      const frames: HTMLCanvasElement[] = [];
      for (let i = 0; i < validImageNames.length; i++) {
        const name = validImageNames[i];
        const blob = await entries[name].blob();
        const frame = await drawBlobToCanvas(blob);
        frames.push(frame);
        updateProgress(0.9 + ((i + 1) / validImageNames.length) * 0.1, 'Processing ...');
      }

      updateProgress(1, `Downloaded. There are ${frames.length} frames in total.`);

      setSourceFrames(frames);
      setEnforceOrder(true);

      // Safe range calculation
      const middle = Math.floor(frames.length / 2);
      const halfWindow = Math.min(24, Math.floor(frames.length / 2));
      setRange([Math.max(0, middle - halfWindow), Math.min(frames.length - 1, middle + halfWindow)]);

      // Only advance to next step on SUCCESS
      onDone();
    } catch (e: any) {
      console.error('Failed to fetch from Luma:', e);
      updateProgress(0, `Error: ${e.message || 'Failed to fetch from Luma.'}`);
      // DO NOT call onDone() here! Leaving the user on this step prevents downstream crashes.
    } finally {
      setFetching(false);
    }
  };

  if (!activated) return null;

  return (
    <>
      <h2>Please provide Luma NeRF URL</h2>

      <div className="flex gap-2 w-full sm:w-96">
        <div className="form-control grow">
          <input
            type="url"
            disabled={fetching}
            placeholder="Luma NeRF URL"
            className="input w-full"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={startFetchingOnEnter}
            onClick={getUrlFromClipboard}
          />
        </div>
        <button
          className="btn"
          disabled={!url || fetching}
          onClick={downloadAndUnzipLightFieldFromLuma}
        >
          Fetch
        </button>
      </div>
    </>
  );
};

LumaLightfieldDownloader.title = 'Download light field from Luma';
