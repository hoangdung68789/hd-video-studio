---
name: bds-video-edit-rules
description: "Dũng's mandatory rules for real-estate review video edits (TikTok safe zone, fonts, no text boxes, no repeated text, hook, strengths)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: c6903d82-e317-4077-889a-64b3568f4b63
  modified: 2026-10-25T13:43:15.288Z
---

Rules Dũng gave while editing the DU-AN-MAU (Ngã Tư Bốn Xã) review video in HyperFrames, 2026-10-19:
- Every text/MG must sit inside the TikTok/Reels safe zone (avoid top ~230px, bottom ~480px, right ~160px button column); never cover the speaker's face or the main scene.
- No dark background boxes behind text ("phông nền chữ che hết cảnh") — text with soft shadow + thin gold accents only.
- Fonts: do NOT lock to one font (2026-10-24). Mix several fonts (sans + serif nghiêng + display/script/condensed…) into one deliberate, eye-catching style per video — but every font must have full Vietnamese diacritics (check the vietnamese subset; embed via @font-face). Be Vietnam Pro is just one option. Gold `background-clip:text` titles clip stacked marks (MỖI → MÔI) unless given top padding (~.34em).
- Font size "vừa đủ đọc", not huge.
- No repeated text across MG; focus on the house's strengths, nearby amenities and traffic/location.
- Hook in the first 3–5s must grab attention (a plain area title was "quá nhàm chán").
- No subtitles unless asked; effects timed to keywords keep the pacing instead.
- Avoid reusing the same b-roll shot twice; pick the nicest unused shot.
- Remove coughs/fillers so speech stays continuous and natural — but NEVER trim short natural pauses (0.2–0.6s) between phrases; that made his speech sound choppy (2026-10-19). Cut only real errors, join with a 20–40ms crossfade under b-roll.
- Hook SFX/text must land on the exact spoken word (peak of the SFX on the frame); plain/boring hook sounds were rejected.
- Music level: he wants the bed close to the voice — about 3 dB under it while speaking (his CapCut reference: voice ~4.0 dB, music ~1.0 dB), never louder than the voice; full level only where nobody speaks. Use a speech-aware volume lane + light carve (strength ~0.5), not a deep duck.
- Export: match the source footage specs (resolution, e.g. DJI Pocket 4 vertical 1728x3072, codec/bit depth); if source fps < 60, motion-interpolate up to 60fps (2026-10-19). Render only after he approves in Studio.
- Cough detection: pitch/energy guesses were wrong once (cut his emphasized word "năm"); verify with an audio-event model (AST AudioSet, `video-449-29-HL2/scripts/detect_cough.py`) and his reported timestamp before cutting.
- Legal points (sổ hồng riêng, hoàn công) work best near the end; "chủ tặng full nội thất" is a strong selling point to anchor on the matching spoken line.

**Why:** Dũng posts vertical videos on TikTok/Reels and judges by how they look on the phone; badly placed or boxed text hides the property.

**How to apply:** Apply these by default on every future BĐS video edit. Related: [[video-quality-feedback]], [[hoang-dung-skills-location]].
- 2026-10-31: Dũng bỏ luật cấm zoom, Ken Burns, punch-in, rung: AI tự quyết (xem [[free-to-work]]).
- 2026-10-20: End of video = CTA text that follows the host's own spoken words only. Never insert unrelated text (e.g. a price card, phone, slogan) that the host didn't say before/at the CTA; on-screen text everywhere must match what he says (no invented extras like "2 WC", "7M", "100%").
- 2026-10-20: Always keep the location map scene (pin + real routes + travel-time labels to nearby landmarks/center from his listing) — it helps buyers picture where the house is. Its labels are the one allowed exception to "text must match speech".
- 2026-10-25 (DU-AN-MAU, latest — replaces the earlier same-day "light street map" note): the light vector street map had too many errors (labels running off the right edge, labels overlapping), so from now on use a **Google-Maps-style satellite map**: natural-brightness satellite imagery (not darkened) with Vietnamese road/place labels on top (hybrid look), real OSRM routes, pin + travel-time labels. Every label must stay inside x 40–920 / y 230–1440 (1080 frame): flip it to the left of its dot when the dot is right of centre, clamp it to the frame, and never let two labels overlap.
- 2026-10-23: Use ONE map scene only (two map appearances were rejected). Place it where he talks about getting around: in DU-AN-MAU that was around 0:20, right when he says "di chuyển ra chợ vải…". Put the ward and district info into the map's pin label.
- 2026-10-23: No text, MG or map label may stay on screen after a scene change. Every MG and label must end, or fade out, before the next clip starts. If that leaves a key word too short on screen, move the cut later instead.
- 2026-10-25 (DU-AN-MAU): blur ONLY house numbers / address plates (số nhà, biển địa chỉ, bảng tên hẻm có số). Do NOT blur vehicle license plates — Dũng said they do not need covering (overrides the "biển số xe" part of dung-video step 2b).
