# 🧤🖼️ Looking Gloves

Create and display holograms on Looking Glass.

...
## Fork Enhancements (Aspect Ratio & Depth Alignment)

This fork updates the video-to-hologram pipeline for modern spatial displays (such as the Looking Glass Go and Landscape displays):

* **Dynamic Aspect Ratio Support:** Replaced fixed/squished CSS containers with dynamic aspect-ratio calculation based on source video frames, preserving true widescreen framing without forced vertical cropping.
* **1:1 Quilt Export Scaling:** Synchronized the parallax math between the WebGL shader preview and the 2D canvas export (`QuiltImage.tsx`), ensuring exported quilt focus matches the on-screen preview 1-to-1.
* **Host-Agnostic Blocks Metadata:** Replaced hardcoded origin URLs with dynamic `window.location.origin` resolution for seamless Block publishing across environments.

*Note: Enhancements currently apply to the **Video** pipeline. NeRF and Image pipelines retain original baseline logic.*
