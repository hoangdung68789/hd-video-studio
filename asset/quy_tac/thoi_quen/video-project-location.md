---
name: video-project-location
description: "Every new video project folder goes under <HD_VIDEO_HOME>\\Videos\\<project-name>, not next to the footage"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 7a7e7c33-0b88-40a1-af2a-8f5461c4df67
  modified: 2026-10-22T13:32:08.342Z
---

Create every new video project (e.g. /video, dung-video) as `<HD_VIDEO_HOME>\Videos\<project-name>\`. Footage can stay where Dũng put it; the project folder (edit-state, transcripts, LUTs, HyperFrames, out) lives there. Dũng set this on 2026-10-22.

**Why:** Dũng wants all his projects in one place. The dung-video skill's default ("next to the footage") put it in Downloads.

**How to apply:** This overrides the skill's default location. Also: if Dũng gives no sample video, build with the skill workflow, and don't copy an older project as the template. See [[always-add-bgm]], [[sfx-library-and-playbook]], [[render-output-path]].
