---
name: video-quality-feedback
description: "User's ratings of the Hoàng Dũng Remotion promo (3D buildings, synthesized audio, logo build effect) and what that implies for future videos"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 0f0601cf-c432-4a9f-8621-1c39e5a577fb
  modified: 2026-10-20T02:20:02.106Z
---

User rated the 15s Hoàng Dũng Real Estate promo (my-video/, Remotion + three.js), 2026-10-17:
- Logo line-draw / "dựng lại" build effect: 9/10 — keep this style.
- Procedural 3D buildings (boxes + canvas window textures, no post-processing): smooth but only 4/10 on aesthetics.
- Audio synthesized from scratch with numpy: 3/10, "nghe rất chán".

User rated the 20s FISA KAFÉ promo (fisa-coffee/, Remotion, cutout cups + Unsplash + CSS overlays), 2026-10-19: **3/10 overall**, "lần sau cần cải thiện nhiều"; no rebuild wanted. No specific reasons given. Likely weak points I saw myself: generic Unsplash stock (not the real shop), flat 2.5D cutout "3D" from phone photos (blurry, old hotline printed), first draft built for the wrong audience (B2B) before asking, delivered first without music, heavy dark/letterbox look leaving little product on screen, template-y glass cards & text-heavy scenes.

User rated the DU-AN-MAU BĐS video (HyperFrames, 42.75s, B7), 2026-10-20 — exported as-is "để dùng tạm", overall **3/10**: thời gian làm việc 0/10, số lần chỉnh sửa >10 "quá nhiều", chất lượng 3/10, màu 0/10, thiết kế & bố cục 2/10, giữ chân người xem 1/10, âm thanh & hiệu ứng 1/10. Liked only the satellite location map. Root causes I saw: built full cut before style approval; trusted a wrong Whisper transcript (hook "giếng trời" vs "dưới trệt", CTA hallucinated "đăng ký kênh") → text mismatched speech; reused a modified LUT instead of the official DJI one; oscillated on text/SFX density; too many full re-renders instead of one QA pass up front.

**Why:** The user judges by feel and wants premium, realistic real-estate visuals and sound, not "technically correct" procedural output.

**How to apply:** For future videos, don't rely on numpy-synthesized music; propose real recorded/licensed or AI-generated music and real SFX. For realistic buildings, propose real 3D models/HDRI/post-processing or AI-generated footage instead of procedural boxes. User said not to rebuild after giving feedback; wait for an explicit request.
Next promo: confirm audience/brand/real assets (shop photos, menu, music) BEFORE building; ask for real footage or get AI-generation credits for true 3D/cinematic product shots; show 1–2 styleframes for approval before animating the full piece; less text, more real product and real place on screen.
