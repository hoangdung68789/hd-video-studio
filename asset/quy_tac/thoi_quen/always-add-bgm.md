---
name: always-add-bgm
description: Every video I build/render must ship with background music matching its style — never deliver a silent or SFX-only cut
metadata:
  node_type: memory
  type: feedback
  modified: 2026-10-19T12:20:32.798Z
---

Always add background music that matches the video's style (e.g. cinematic → cinematic score) to every video I build, before delivering the render. Do not leave a music slot empty and hand it back as a "todo".

**Why:** On the THUONG-HIEU-MAU promo (2026-10-19) I delivered an MP4 with only SFX and asked the user to supply music; they said they had already asked for cinematic BGM and want me to remember to always include it.

**How to apply:** Source a real track (HeyGen music catalog via `tools\heygen.exe`, see [[sfx-library-and-playbook]]), trim/fade it to the edit, align its hits to the visual beats, then render. Never synthesize music with numpy ([[video-quality-feedback]]). Still may offer alternative tracks after delivering, but the delivered cut must already have music.
