# 🧤🖼️ Looking Gloves

Create and display holograms on Looking Glass spatial displays.

---

## 🚀 Enhancements & Feature Updates

This fork updates the entire spatial processing pipeline (Video, Images, and Luma NeRF) for modern 3D hardware (such as the Looking Glass Go and spatial displays), bringing precise timeline control, hardware-accurate depth alignment, and bulletproof pipeline stability.

### ✂️ Precision Video Trimming & Frame Extraction
Import raw video sweeps and trim exact start/end extraction points directly in the browser.
* **Timeline Boundary Control:** Set custom **Start** and **End** handles on the interactive scrubber to sample only the ideal parallax sweep from your raw video clip.
* **Playback Controls:** Preview your trimmed selection using full transport controls (`▶ Play`, `⏸ Pause`) and variable speed playback (`1x`, `1.25x`, `1.5x`, `2x`).

### 🎯 Adjust Center Frame (Head-On Alignment)
When a subject isn't physically centered in your raw video sweep, the resulting hologram can look off-axis or create uneven motion blur when viewed head-on.
* **Set Center View:** Lock any frame as your middle ($N/2$) head-on view using **`🎯 Set Center`**.
* **⚖️ Balance Trim:** Automatically equalizes left and right panning durations to ensure uniform panning speed across the entire parallax arc.

### 👁️ Blink Removal (Micro-Shift Engine)
Portrait video holograms can suffer from closed-eye artifacts if a sampled step lands on a subject blinking.
* **Interactive Flagging:** Step frame-by-frame (`◀ -1` / `+1 ▶`) and click **`👁️ Flag Blink`** on any frame where eyelids droop or close.
* **Non-Destructive Micro-Shift:** During quilt extraction, if a target sample falls within a known blink window ($\sim 0.12\text{s}$), the engine automatically shifts that sample outward by $\sim 5$ video frames ($\pm 0.16\text{s}$) to grab a frame with wide-open eyes—without distorting the overall camera panning sweep.

---

### 🎨 Rendering & Alignment Improvements

* **Dynamic Aspect Ratio Support:** Replaced fixed/squished CSS containers across the Video pipeline (`LightFieldFocusViewer.tsx`) with dynamic aspect-ratio calculation based on source video frames, preserving true widescreen framing without forced vertical cropping or letterbox distortion.
* **1:1 Quilt Focus Scaling:** Synchronized the focus math (`QuiltImage.tsx`) directly with the active focus state. This removes the previous 10x scale mismatch between the WebGL shader preview and 2D canvas exports, ensuring exported quilts match the on-screen preview 1-to-1.
* **Host-Agnostic Blocks Metadata:** Replaced hardcoded domain strings in `PublishToBlocksButton.tsx` with dynamic `window.location.origin` resolution for seamless Block publishing from custom domains, local setups, or community forks.

---

### 🛠️ Luma NeRF Pipeline Stability Fixes

* **Prevent Infinite Re-render Loops (React Error #185):** Removed premature `onDone()` calls inside the fetch `catch` block in `LumaLightfieldDownloader.tsx` that previously caused downstream components to loop infinitely when frame extraction failed.
* **Safe Payload & ZIP Extraction:** Added defensive chaining guards around Luma API metadata parsing and filtered ZIP contents strictly for valid image files (`.jpg`, `.png`, `.webp`), preventing silent failures on unexpected archive structures.
* **Safe Range Calculation:** Fixed negative index frame range calculations when processing small or empty frame sequences.

---

## 🧪 Pipeline Testing & Validation

All input modes have been verified for stability and hardware compatibility:

* **Video Pipeline:** Tested widescreen video sweeps end-to-end on Looking Glass Go hardware, verifying custom trim bounds, center alignment, and blink micro-shifting.
* **Image Sequences:** Verified image sequence upload, frame selection, focus editing, cropping, and export with no regressions.
* **Luma NeRF:** Verified with public Luma NeRF capture URLs (verified successful frame unzipping, range selection, cropping, and focus editing without crashes).