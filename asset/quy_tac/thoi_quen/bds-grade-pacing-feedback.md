---
name: bds-grade-pacing-feedback
description: "Dũng's complaints about the DU-AN-MAU HyperFrames edit — grade unbalanced/unnatural/inconsistent, speech unnatural, cuts too fast"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 3dd155e1-96d3-4a6a-b577-4d340776d6c8
  modified: 2026-10-19T17:08:58.433Z
---

On 2026-10-20 (starting the DU-AN-MAU video) Dũng said the previous project (DU-AN-MAU) had: color grading unbalanced, unnatural and not matched between clips; speech that sounded unnatural; cuts that were too fast.

**Why:** He judges on the phone by feel; a flat LUT + global eq on every clip gave casts/contrast jumps, splicing many take fragments made the voice choppy, and 1.4–2s b-roll felt hectic.

**How to apply:** Grade per clip: D-Log→709 base, then measure (neutral white walls should read neutral, skin natural, matched exposure) and show a before/after + cross-clip match sheet; keep saturation modest. Prefer whole continuous phrases from ONE take, cut only real errors/fillers, keep natural pauses. B-roll shots ≥2.5–3s, motion gentle; no rapid-fire montage. Related: [[bds-video-edit-rules]], [[video-quality-feedback]]

2026-10-20 follow-up on DU-AN-MAU: he said bright parts were too bright and dark parts too dark. Fix that worked: per-clip luminance percentiles → pull 75% toward a shared tone frame (p1≈40, p50≈132, p99.5≈226), PCHIP curve applied to LUMA only (scale RGB by f(Y)/Y), baked with WB into one 3D LUT per clip (`video-67-20-36-NTT/scripts/bake_luts.py`). Don't chain ffmpeg curves/lut1d after lut3d on 10-bit DJI footage — channel shifts gave pink skin / green walls.
