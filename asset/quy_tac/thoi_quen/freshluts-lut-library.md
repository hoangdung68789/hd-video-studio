---
name: freshluts-lut-library
description: "Dũng's classified freshluts.com LUT library (736 files) + the 10/10-tested natural real-estate look recipe to use by default"
metadata:
  node_type: memory
  type: feedback
  originSessionId: c8e56e86-4f28-4c00-b6ed-9aef0984df82
  modified: 2026-10-22T15:56:32.145Z
---

Library (downloaded 2026-10-22): full archive `~\Downloads\freshluts-LUTs.zip` (847 entries, short ASCII paths ≤114 chars — the older `_DAY-DU.zip` failed on Windows with 0x80010135 "Path too long", so never use long Vietnamese-description folder names in zips; Dũng may move it elsewhere — ask where if missing). Layout: 01_BDS-UuTien\A_TuNhien-NoiThat|B_SangAm-NgoaiThat\<camera>, 02_TatCa-TheoCamera\<camera>\<style>, 03_Cinematic\{1_TealOrange-Blockbuster,2_GiaLapFilm,3_Moody-Toi,4_DienAnh-Khac,5_KinhDi-Thriller,6_HongNgoai-IR}\<camera>, 04_VlogDuLich\{1_Ngay-NgoaiTroi,2_GioVang-HoangHon,3_BanDem-ThanhPho}\<camera> (added 2026-10-22 at Dũng's request for cinematic + travel vlog day/night; night/golden groups checked against freshluts sample stills). Files named <id>_<title>.cube; zip has 1468 entries (copies across groups), 339MB. The extracted folder in HDRE AI\LUTs was deleted at his request, and the HDRE AI\LUTs zip got altered to 700 entries, so don't trust it. The two passing look LUTs are kept in `~\Documents\HoangDung_AI\HDRE_Library\luts\freshluts_Interview_2137.cube` / `freshluts_Natural_2043.cube`. Index inside zip: `00_DANH MUC LUT.csv`. Layout: `01_BDS REAL ESTATE (UU TIEN)\A_Chuan mau tu nhien` (natural, interiors) / `\B_Sang am sang trong` (warm, exteriors), split by camera gamma; `02_TAT CA THEO CAMERA\<gamma>\<style group>` holds all 730 .cube.

Dũng asked (2026-10-22) to use these from now on, **prioritising natural colour for real estate**, and to test → score → retry up to 5 rounds, applying only a 10/10 result.

**Passing recipe (5 rounds on DU-AN-MAU, 17 Pocket 4 D-Log clips, 10/10 incl. real ffmpeg render):** per clip: official DJI V1.0 LUT + WB + luma curve (grade_pipeline.py) → blend freshluts `Interview [2137]` at 75% → saturation ×1.5 → re-white-balance per clip to target 1.01/1/0.985 (whites b*≈+1.8). Baked as one LUT/clip by `scripts/bake_natural.py` → `luts/clip_natural/`; scorer `scripts/lut_trial.py` (rubric 5×2 pts: white neutrality, exposure, skin hue 45–65°, chroma 10–22 & no mid cast, clip-to-clip consistency). Runner-up: `Natural [2043]` same settings (wt 1.005/1/0.99). Round notes: LUT alone at 50% scored ≤9.27 (too flat, mid warm cast); the old warm WB target 1.02/1/0.975 caused the yellow mids.

**Update 2026-10-23 (approved by Dũng):** on the full video he still felt it "ám vàng, chưa tự nhiên" with the recipe above. The approved version is the same chain but with whites set to true neutral (target 1/1/1.012, whites b*≈0) and saturation ×1.25 instead of ×1.5. It is baked by `scripts/bake_neutral.py` → `luts/clip_neutral/`. Use this as the default from now on: the 10/10 scorer's warm-white target was wrong for him.

**Why:** Real-estate video sells true whites and real material colours; Dũng wants measured, repeatable quality.

**How to apply:** Copy bake_natural.py + lut_trial.py into the next project, run after grade_pipeline, re-score; if <10 iterate (strength/sat/WB target) max 5 rounds. Always keep [[dji-dlog-official-lut]] as base; never put Sony/Canon/drone LUTs directly on Pocket 4 D-Log; show before/after; see [[bds-grade-pacing-feedback]].
