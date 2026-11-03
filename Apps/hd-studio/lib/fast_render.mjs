// Động cơ xuất video siêu tốc (CapCut Hybrid GPU NVENC + FFmpeg Filtergraph + CDP Pipe).
// Tách riêng lớp video/âm thanh gốc chạy thẳng trên FFmpeg + NVIDIA NVENC (400-500 fps),
// còn lớp chữ/đồ họa HTML/SVG/GSAP chỉ chụp đúng những khung hình có thay đổi qua đường ống CDP (không mở cổng mạng, không tua <video> trong Chrome).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse, scan, readOverrides } from "./html.mjs";

const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

export function findBrowser() {
  for (const p of CHROME_PATHS) if (fs.existsSync(p)) return p;
  return null;
}

let hevcOk = null;
export function hasHevcNvenc() {
  if (hevcOk === null) {
    hevcOk = spawnSync("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "color=s=256x256:d=0.1", "-frames:v", "1", "-c:v", "hevc_nvenc", "-f", "null", "-"], { stdio: "ignore", windowsHide: true }).status === 0;
  }
  return hevcOk;
}

// Kiểm tra tệp media có luồng âm thanh thực sự hay không.
function hasAudioStream(file) {
  if (!fs.existsSync(file)) return false;
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_type", "-of", "csv=p=0", file], { encoding: "utf8", windowsHide: true });
  return (r.stdout || "").trim().includes("audio");
}

// Xây chuỗi bộ lọc atempo cho tốc độ bất kỳ (0.25x -> 4x).
function atempoChain(rate) {
  const out = [];
  let r = Math.max(0.25, Math.min(4, +rate || 1));
  while (r > 2.0) { out.push("atempo=2.0"); r /= 2.0; }
  while (r < 0.5) { out.push("atempo=0.5"); r /= 0.5; }
  if (Math.abs(r - 1) > 0.005) out.push(`atempo=${r.toFixed(4)}`);
  return out;
}

// Dịch đường cong âm lượng data-automation sang biểu thức volume của FFmpeg.
function volumeAutomationExpr(node, clip) {
  const raw = node?.attrs?.["data-automation"];
  if (!raw) return null;
  try {
    const auto = JSON.parse(raw.replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
    const lane = (auto?.lanes || []).find((l) => l.target === "volume");
    const pts = lane?.points;
    if (!Array.isArray(pts) || pts.length < 2) return null;
    // Xây biểu thức nội suy từng đoạn theo t (tính từ đầu clip).
    let expr = String((pts[pts.length - 1].v ?? 1).toFixed(3));
    for (let i = pts.length - 2; i >= 0; i--) {
      const a = pts[i], b = pts[i + 1];
      const dt = Math.max(0.001, b.t - a.t);
      const seg = `${a.v.toFixed(3)}+${(b.v - a.v).toFixed(3)}*clip((t-${a.t.toFixed(3)})/${dt.toFixed(3)},0,1)`;
      expr = `if(lte(t,${b.t.toFixed(3)}),${seg},${expr})`;
    }
    return `volume='${expr}':eval=frame`;
  } catch {
    return null;
  }
}

// Trộn toàn bộ các lớp âm thanh (<audio>, sfx, <video> không tắt tiếng) thành 1 tệp AAC bằng FFmpeg.
export async function buildAudioMix(p, comp, nodes, tmpDir, onKillCheck) {
  const dur = Math.max(0.1, +comp.duration || 1);
  const audioOut = path.join(tmpDir, "hd_audio.m4a");
  const valid = [];

  for (const c of comp.clips) {
    if (c.muted || (c.volume !== null && c.volume <= 0)) continue;
    if (!["audio", "sfx", "video"].includes(c.kind) || !c.src) continue;
    const file = path.resolve(p.hf, c.src);
    if (!fs.existsSync(file)) continue;
    if (c.kind === "video" && !hasAudioStream(file)) continue;
    valid.push({ clip: c, file, node: nodes.find((n) => n.id === c.id) });
  }

  if (!valid.length) {
    spawnSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", `anullsrc=r=48000:cl=stereo:d=${dur.toFixed(3)}`, "-c:a", "aac", "-b:a", "192k", audioOut], { windowsHide: true });
    return audioOut;
  }

  const args = ["-y", "-v", "error"];
  const filters = [];
  valid.forEach(({ clip: c, file, node }, idx) => {
    const rate = Math.max(0.25, Math.min(4, +c.rate || 1));
    const clipDur = Math.max(0.05, c.end - c.start);
    const srcDur = clipDur * rate;
    args.push("-ss", String(Math.max(0, +c.mediaStart || 0).toFixed(3)), "-t", String(srcDur.toFixed(3)), "-i", file);
    const chain = [`[${idx}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo`];
    chain.push(...atempoChain(rate));
    chain.push("asetpts=PTS-STARTPTS");
    const autoExpr = volumeAutomationExpr(node, c);
    if (autoExpr) {
      chain.push(autoExpr);
    } else {
      const vol = c.volume ?? 1;
      if (Math.abs(vol - 1) > 0.005) chain.push(`volume=${vol.toFixed(3)}`);
      if (c.fadeIn > 0) chain.push(`afade=t=in:st=0:d=${Math.min(clipDur, c.fadeIn).toFixed(3)}`);
      if (c.fadeOut > 0) chain.push(`afade=t=out:st=${Math.max(0, clipDur - c.fadeOut).toFixed(3)}:d=${Math.min(clipDur, c.fadeOut).toFixed(3)}`);
    }
    const delayMs = Math.max(0, Math.round(c.start * 1000));
    if (delayMs > 0) chain.push(`adelay=${delayMs}:all=1`);
    chain.push(`apad=whole_dur=${dur.toFixed(3)}[a${idx}]`);
    filters.push(chain.join(","));
  });

  const mixInputs = valid.map((_, i) => `[a${i}]`).join("");
  filters.push(`${mixInputs}amix=inputs=${valid.length}:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.98:level=false[aout]`);
  const scriptFile = path.join(tmpDir, "audio_filter.txt");
  const filterStr = filters.join(";");
  const filterArg = filterStr.length > 20000 ? ["-/filter_complex", scriptFile] : ["-filter_complex", filterStr];
  if (filterStr.length > 20000) fs.writeFileSync(scriptFile, filterStr, "utf8");

  await new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", [...args, ...filterArg, "-map", "[aout]", "-t", dur.toFixed(3), "-c:a", "aac", "-b:a", "192k", audioOut], { windowsHide: true });
    onKillCheck?.(ff);
    let err = "";
    ff.stderr.on("data", (b) => { err += b; });
    ff.on("exit", (code) => (code === 0 && fs.existsSync(audioOut) ? resolve() : reject(new Error(err || "Không trộn được âm thanh"))));
    ff.on("error", reject);
  });
  return audioOut;
}

// Dịch chỉnh màu (data-color-grading / grade) của video sang bộ lọc FFmpeg.
function videoGradeFilters(p, clip, node) {
  const out = [];
  let g = clip.grade;
  const raw = node?.attrs?.["data-color-grading"];
  if (raw) {
    try { g = JSON.parse(raw.replace(/&quot;/g, '"').replace(/&amp;/g, "&")); } catch { /* giữ clip.grade */ }
  }
  if (!g) return out;
  if (g.lut) {
    const lutFile = path.resolve(p.hf, g.lut);
    if (fs.existsSync(lutFile)) {
      const esc = lutFile.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
      out.push(`lut3d=file='${esc}'`);
    }
  }
  const adj = g.adjust || {};
  const det = g.details || {};
  const brightness = ((+adj.exposure || 0) * 0.35 + (+adj.brightness || 0) * 0.25) / 100;
  const contrast = 1 + (+adj.contrast || 0) / 100;
  const saturation = Math.max(0, 1 + (+adj.saturation || 0) / 100);
  if (Math.abs(brightness) > 0.005 || Math.abs(contrast - 1) > 0.005 || Math.abs(saturation - 1) > 0.005) {
    out.push(`eq=brightness=${brightness.toFixed(3)}:contrast=${contrast.toFixed(3)}:saturation=${saturation.toFixed(3)}`);
  }
  const temp = (+adj.temperature || 0) / 200;
  const tint = (+adj.tint || 0) / 200;
  if (Math.abs(temp) > 0.005 || Math.abs(tint) > 0.005) {
    out.push(`colorbalance=rs=${temp.toFixed(3)}:bs=${(-temp).toFixed(3)}:gs=${tint.toFixed(3)}`);
  }
  if ((+det.sharpen || 0) > 2) {
    const amt = Math.min(2.5, (+det.sharpen || 0) / 40);
    out.push(`unsharp=5:5:${amt.toFixed(2)}:5:5:0.0`);
  }
  if ((+det.vignette || 0) > 2) {
    out.push(`vignette=angle=PI/4`);
  }
  return out;
}

// Tìm hiệu ứng chuyển cảnh đầu clip video (mờ dần hoặc trượt ngang/dọc từ GSAP).
function findVideoTransition(html, nodes, clip) {
  const re = new RegExp(`\\.fromTo\\s*\\(\\s*["']#${clip.id}["']\\s*,\\s*\\{([^}]*)\\}\\s*,\\s*\\{([^}]*)\\}\\s*,\\s*([\\d.]+)\\s*\\)`, "g");
  let m;
  while ((m = re.exec(html))) {
    const fromVars = m[1], toVars = m[2], pos = +m[3];
    if (Math.abs(pos - clip.start) > 0.15) continue;
    const dur = +(/\bduration\s*:\s*([\d.]+)/.exec(toVars)?.[1] || 0.3);
    const fade = /\bopacity\s*:\s*0\b/.test(fromVars) && /\bopacity\s*:\s*1\b/.test(toVars);
    const xFrom = +(/\bx\s*:\s*(-?[\d.]+)/.exec(fromVars)?.[1] || 0);
    const yFrom = +(/\by\s*:\s*(-?[\d.]+)/.exec(fromVars)?.[1] || 0);
    return { dur: Math.max(0.05, dur), fade, xFrom, yFrom };
  }
  return null;
}

// Bán kính boxblur tương đương blur(sigma) của CSS, không chạm giới hạn FFmpeg: 2r < cạnh ngắn của từng mặt phẳng (mặt màu 4:2:0 chỉ bằng nửa).
export function boxblurArgs(w, h, sigma) {
  const want = Math.max(1, Math.ceil(Math.sqrt(1.5 * sigma * sigma + 0.25) - 0.5));
  const limit = (side) => Math.max(0, Math.floor((side - 1) / 2));
  const luma = Math.min(want, limit(Math.min(w, h)));
  const chroma = Math.min(want, limit(Math.min(Math.ceil(w / 2), Math.ceil(h / 2))));
  return `boxblur=lr=${luma}:lp=2:cr=${chroma}:cp=2`;
}

// Biểu thức vị trí theo t: giá trị đầu + các đoạn nội suy tuyến tính, cộng phẳng để không vướng giới hạn lồng của FFmpeg.
function trackExpr(base, tracks, scale) {
  const terms = [];
  let total = base;
  for (const { v0, segs } of tracks) {
    total += v0;
    let cur = v0;
    for (const s of [...segs].sort((x, y) => x.p - y.p)) {
      if (Math.abs(s.from - cur) > 0.01) terms.push(`${((s.from - cur) * scale).toFixed(2)}*gte(t,${s.p.toFixed(3)})`);
      if (Math.abs(s.to - s.from) > 0.01) terms.push(`${((s.to - s.from) * scale).toFixed(2)}*clip((t-${s.p.toFixed(3)})/${Math.max(0.001, s.d).toFixed(3)},0,1)`);
      cur = s.to;
    }
  }
  return [(total * scale).toFixed(2), ...terms].join("+").replace(/\+-/g, "-");
}

// Tìm các lớp che mờ (backdrop-filter: blur) trên nền video (vd: #che-0803 che biển số nhà), gồm cả đường bám chuyển động x, y.
export function findBlurMasks(html, nodes, comp, scaleX, scaleY, overrides = {}) {
  const out = [];
  for (const c of comp.clips) {
    if (c.kind !== "fx") continue;
    const n = nodes.find((x) => x.id === c.id);
    const st = n?.attrs?.style || "";
    if (!/backdrop-filter\s*:\s*blur/i.test(st)) continue;
    const num = (re) => +(re.exec(st)?.[1] || 0);
    const ov = overrides[c.id] || {};
    const left = num(/\bleft\s*:\s*(-?[\d.]+)px/i);
    const top = num(/\btop\s*:\s*(-?[\d.]+)px/i);
    const kfMax = (list) => Math.max(...(list || []).map((k) => +k.v || 0), 0);
    const width = Math.max(+ov.d?.w || num(/(?:^|;)\s*width\s*:\s*([\d.]+)px/i), kfMax(ov.kf?.w));
    const height = Math.max(+ov.d?.h || num(/(?:^|;)\s*height\s*:\s*([\d.]+)px/i), kfMax(ov.kf?.h));
    if (width <= 0 || height <= 0) continue;
    const esc = c.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const setVars = new RegExp(`gsap\\.set\\s*\\(\\s*["']#${esc}["']\\s*,\\s*\\{([^}]*)\\}`).exec(html)?.[1] || "";
    const tweens = [...html.matchAll(new RegExp(`\\.fromTo\\s*\\(\\s*["']#${esc}["']\\s*,\\s*\\{([^}]*)\\}\\s*,\\s*\\{([^}]*)\\}\\s*,\\s*([\\d.]+)\\s*\\)`, "g"))];
    const axis = (name) => {
      const re = new RegExp(`\\b${name}\\s*:\\s*(-?[\\d.]+)`);
      const segs = [];
      for (const t of tweens) {
        const from = re.exec(t[1]), to = re.exec(t[2]);
        if (from && to) segs.push({ p: +t[3], d: +(/\bduration\s*:\s*([\d.]+)/.exec(t[2])?.[1] || 0.001), from: +from[1], to: +to[1] });
      }
      const sorted = segs.sort((a, b) => a.p - b.p);
      const preset = re.exec(setVars);
      const tracks = [{ v0: preset ? +preset[1] : (sorted[0]?.from ?? 0), segs: sorted }];
      // Chỉnh tay trong Studio (kéo vị trí, khóa hình) cộng thêm lên chuyển động GSAP.
      const kf = ov.kf?.[name];
      if (kf?.length) tracks.push({ v0: +kf[0].v || 0, segs: kf.slice(0, -1).map((k, i) => ({ p: c.start + k.t, d: kf[i + 1].t - k.t, from: +k.v || 0, to: k.e === "hold" ? +k.v || 0 : +kf[i + 1].v || 0 })) });
      else if (ov[name]) tracks.push({ v0: +ov[name], segs: [] });
      return tracks;
    };
    const ovScale = Math.max(+ov.scale || 1, kfMax(ov.kf?.scale));
    const fullW = width * ovScale, fullH = height * ovScale;
    // CSS phóng quanh tâm ô. Làm chẵn cạnh để crop và mặt màu 4:2:0 không lệch.
    const w = Math.max(8, Math.ceil((fullW * scaleX) / 2) * 2);
    const h = Math.max(8, Math.ceil((fullH * scaleY) / 2) * 2);
    const sigma = Math.max(1, (+/backdrop-filter\s*:\s*blur\(\s*([\d.]+)px/i.exec(st)?.[1] || 14) * Math.max(scaleX, scaleY));
    out.push({
      id: c.id,
      start: c.start,
      end: c.end,
      w,
      h,
      sigma,
      feather: /mask-image\s*:\s*radial-gradient/i.test(st),
      xExpr: trackExpr(left - (fullW - width) / 2, axis("x"), scaleX),
      yExpr: trackExpr(top - (fullH - height) / 2, axis("y"), scaleY),
    });
  }
  return out;
}

// Lớp che mờ bám chuyển động: mỗi khung lấy đúng vùng đang che, làm mờ, viền mềm hình elip như mask-image của bản xem trước.
export function blurMaskFilter(m, inLabel, outLabel, idx) {
  const on = `between(t,${m.start.toFixed(3)},${m.end.toFixed(3)})`;
  const chain = [`crop=${m.w}:${m.h}:'${m.xExpr}':'${m.yExpr}'`, `${boxblurArgs(m.w, m.h, m.sigma)}:enable='${on}'`];
  if (m.feather) {
    const rx = m.w / 2, ry = m.h / 2;
    chain.push("format=yuva420p", `geq=lum='lum(X,Y)':cb='cb(X,Y)':cr='cr(X,Y)':a='255*clip((1-hypot((X-${rx})/${rx},(Y-${ry})/${ry}))/0.4,0,1)':enable='${on}'`);
  }
  return `[${inLabel}]split[bm_a${idx}][bm_b${idx}];[bm_b${idx}]${chain.join(",")}[bm_c${idx}];` +
    `[bm_a${idx}][bm_c${idx}]overlay=x='${m.xExpr}':y='${m.yExpr}':enable='${on}'[${outLabel}]`;
}

// Cờ giữ nét chi tiết của NVENC. Đo 03/11 trên RTX 4060: tốc độ mã hóa còn 119 so với 131 fps. Card không hỗ trợ thì bỏ qua, không làm hỏng lần xuất.
const NVENC_DETAIL = ["-multipass", "qres", "-spatial-aq", "1", "-temporal-aq", "1", "-aq-strength", "8", "-rc-lookahead", "32", "-bf", "3", "-b_ref_mode", "middle"];
const detailOk = {};
function nvencDetail(name) {
  if (detailOk[name] === undefined) {
    detailOk[name] = spawnSync("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "color=s=256x256:d=0.5", "-c:v", name, "-preset", "p4", "-tune", "hq", "-rc", "vbr", "-cq", "18", "-b:v", "0", ...NVENC_DETAIL, "-f", "null", "-"], { stdio: "ignore", windowsHide: true }).status === 0;
  }
  return detailOk[name] ? NVENC_DETAIL : [];
}

// Chọn bộ mã hóa. NVENC có giới hạn kích thước (đo trên RTX 4060, 03/11/2026): ngoài khoảng đó dùng CPU thay vì xuất lỗi.
export function pickEncoder({ codec, gpu, quality, w, h, hevcOk }) {
  const draft = quality === "draft";
  const useHevc = codec === "hevc";
  const cq = quality === "master" ? "15" : quality === "standard" ? "22" : draft ? "26" : "18";
  const tag = useHevc ? ["-tag:v", "hvc1"] : [];
  const fits = useHevc ? w >= 129 && h >= 33 && w <= 8192 && h <= 8192 : w >= 145 && h >= 49 && w <= 4096 && h <= 4096;
  if (gpu && fits && (!useHevc || hevcOk)) {
    const preset = draft ? "p1" : quality === "master" ? "p6" : "p4";
    const name = useHevc ? "hevc_nvenc" : "h264_nvenc";
    return { gpu: true, args: ["-c:v", name, "-preset", preset, "-tune", "hq", "-rc", "vbr", "-cq", cq, "-b:v", "0", ...(draft ? [] : nvencDetail(name)), ...tag] };
  }
  return { gpu: false, args: ["-c:v", useHevc ? "libx265" : "libx264", "-preset", draft ? "ultrafast" : "veryfast", "-crf", cq, ...tag] };
}

// Thư viện CDN dự án khai báo (GSAP...) được lưu lại máy một lần: bản dựng chạy đúng thư viện như lúc xem, không cần mạng ở lần sau.
const CDN_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".du-lieu", "cdn");
async function localizeCdn(html) {
  let out = html;
  for (const m of html.matchAll(/<script\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["'][^>]*>\s*<\/script>/gi)) {
    const url = m[1];
    const file = path.join(CDN_DIR, `${crypto.createHash("md5").update(url).digest("hex").slice(0, 10)}_${path.basename(new URL(url).pathname)}`);
    if (!fs.existsSync(file)) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!r.ok) continue;
        fs.mkdirSync(CDN_DIR, { recursive: true });
        fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
      } catch { continue; } // Không tải được thì để Chrome tự thử; không dựng được timeline sẽ báo lỗi rõ.
    }
    out = out.replace(m[0], `<script src="${pathToFileURL(file).href}"></script>`);
  }
  return out;
}

// Những thứ động cơ nhanh chưa dựng lại được bằng FFmpeg. Có một trong số này thì phải dựng bằng trình duyệt để không mất hiệu ứng.
export function fastUnsupported(html, comp, nodes, overrides = {}) {
  const why = new Set();
  const css = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
  if (/mix-blend-mode\s*:\s*(?!normal)/i.test(html) || /mixBlendMode/.test(html)) why.add("chế độ hòa trộn (blend mode)");
  if (/backdrop-filter\s*:/i.test(css.replace(/@keyframes[\s\S]*?\}\s*\}/g, ""))) why.add("kính mờ (backdrop-filter)");
  if (/\.(fromTo|from|to|set)\s*\(\s*["'](\[data-composition-id\]|#root|body|html)/i.test(html)) why.add("camera toàn khung");
  const zOf = (st) => { const m = /\bz-index\s*:\s*(-?\d+)/i.exec(st || ""); return m ? +m[1] : null; };
  const videos = comp.clips.filter((c) => c.kind === "video" && c.src);
  for (const c of comp.clips) {
    const st = nodes.find((n) => n.id === c.id)?.attrs?.style || "";
    // Chỉ ô che mờ tĩnh về độ rõ mới dựng được bằng FFmpeg; lọc màu hay mờ toàn khung có đổi độ rõ thì không.
    if (/backdrop-filter\s*:/i.test(st) && (c.kind !== "fx" || !/backdrop-filter\s*:\s*blur/i.test(st) || /(^|;)\s*opacity\s*:\s*0(\.0+)?\s*(;|$)/.test(st))) why.add("kính mờ (backdrop-filter)");
    if (c.kind === "video" || c.kind === "audio" || c.kind === "sfx" || c.kind === "grade") continue;
    const z = zOf(st);
    if (z !== null && videos.some((v) => { const zv = zOf(nodes.find((n) => n.id === v.id)?.attrs?.style); return zv !== null && zv > z && v.start < c.end && v.end > c.start; })) why.add("lớp nằm dưới video");
  }
  for (const v of videos) {
    const st = nodes.find((n) => n.id === v.id)?.attrs?.style || "";
    const ov = overrides[v.id] || {};
    if (/\b(filter|clip-path|mask-image)\s*:/i.test(st) || /object-fit\s*:\s*(contain|none|fill)/i.test(st)) why.add("bộ lọc hoặc mặt nạ trên video");
    if (/\.webm$/i.test(v.src)) why.add("video nền trong suốt");
    if (ov.mask?.shape && ov.mask.shape !== "none") why.add("mặt nạ trên video");
    if (ov.rotate || ov.d?.blur || ov.anim || ov.frame || Object.keys(ov.kf || {}).some((k) => k !== "volume")) why.add("keyframe hoặc xoay trên video");
    const esc = v.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const tw = [...html.matchAll(new RegExp(`\\.(fromTo|to|from|set)\\s*\\(\\s*["']#${esc}["']\\s*,\\s*\\{([^}]*)\\}(?:\\s*,\\s*\\{([^}]*)\\})?`, "g"))];
    const simple = tw.length === 0 || (tw.length === 1 && tw[0][1] === "fromTo" && !/\b(scale|scaleX|scaleY|rotation|skew|skewX|skewY|filter|clipPath|xPercent|yPercent)\b/.test(`${tw[0][2]} ${tw[0][3]}`));
    if (!simple) why.add("chuyển động phức tạp trên video");
  }
  return [...why];
}

// Chuẩn bị tệp HTML tạm chỉ chứa lớp phủ (hoặc toàn khung nếu dự án không có thẻ <video>).
function buildRenderHtml(rawHtml, comp, { renderW, renderH, transparentOverlay, hideIds, baseDir }) {
  const sx = renderW / comp.width, sy = renderH / comp.height;
  const hideCss = [...hideIds].map((id) => `#${id}{display:none!important}`).join("\n");
  const injectCss = `<style id="hd-fast-render-override">
    html, body {
      width: ${renderW}px !important;
      height: ${renderH}px !important;
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
      ${transparentOverlay ? "background: transparent !important;" : ""}
    }
    #root, [data-composition-id] {
      width: ${comp.width}px !important;
      height: ${comp.height}px !important;
      transform: scale(${sx.toFixed(6)}, ${sy.toFixed(6)}) !important;
      transform-origin: 0 0 !important;
      ${transparentOverlay ? "background: transparent !important;" : ""}
    }
    ${transparentOverlay ? "video, audio { display: none !important; }" : "audio { display: none !important; }"}
    ${hideCss}
  </style>`;
  // Tệp tạm nằm ngoài thư mục dự án: thẻ base giữ đường dẫn assets/ (phông chữ, ảnh) đúng như lúc xem.
  let out = rawHtml.replace(/<head([^>]*)>/i, `<head$1>\n<base href="${pathToFileURL(baseDir).href}/">`);
  if (transparentOverlay) {
    // Ngắt src của <video> và <audio> để Chrome không tốn thời gian nạp/giải mã tệp media.
    out = out.replace(/<(video|audio)\b([^>]*?)\bsrc\s*=\s*(?:"[^"]*"|'[^']*')/gi, "<$1$2data-skipped-src=\"1\"");
  }
  const headClose = out.search(/<\/head\s*>/i);
  if (headClose >= 0) out = out.slice(0, headClose) + injectCss + "\n" + out.slice(headClose);
  else out = injectCss + "\n" + out;
  return out;
}

// Lập lịch chụp thông minh: gộp các khoảng trống (EMPTY) và khoảng đứng yên (STATIC) để giảm 75-90% số lần chụp Chrome.
export function buildOverlaySchedule(comp, ovClips, overrides, fps, animFps, live = {}) {
  // live: đọc từ timeline thật trong trang, gồm cả chuyển động của phần tử con mà tệp không ghi theo clip.
  const windows = live.tweens || [];
  const inTween = (t) => windows.some((w) => t >= w.s - 0.02 && t <= w.e + 0.04);
  const dur = Math.max(0.1, +comp.duration || 1);
  const step = 1 / animFps;
  const totalSteps = Math.max(1, Math.ceil(dur * animFps));
  const rawSteps = [];

  for (let i = 0; i < totalSteps; i++) {
    const t = Math.min(dur - 0.001, +(i * step).toFixed(4));
    const dt = i === totalSteps - 1 ? Math.max(0.001, dur - i * step) : step;
    const active = ovClips.filter((c) => t >= c.start - 0.02 && t <= c.end + 0.02);
    if (!active.length) {
      // Phần tử luôn hiện (không gắn thời gian) thì khoảng trống vẫn phải chụp.
      if (live.base) rawSteps.push(inTween(t) ? { type: "anim", t, dur: dt, key: `ANIM:${i}` } : { type: "static", t, dur: dt, key: "STATIC:nen" });
      else rawSteps.push({ type: "empty", t, dur: dt, key: "EMPTY" });
      continue;
    }
    const isAnim = live.cssAnim || inTween(t) || active.some((c) => {
      const ov = overrides?.[c.id];
      if (ov?.kf && Object.keys(ov.kf).some((k) => k !== "volume")) return true;
      if (ov?.anim && (ov.anim.in?.on || ov.anim.out?.on || ov.anim.strobe?.on || ov.anim.track?.on)) {
        const inDur = 0.8 / (ov.anim.in?.sp || 1);
        const outDur = 0.8 / (ov.anim.out?.sp || 1);
        if ((ov.anim.in?.on && t <= c.start + inDur) || (ov.anim.out?.on && t >= c.end - outDur) || ov.anim.strobe?.on) return true;
      }
      if (c.segments?.some((s) => s.auto)) return true;
      return (c.tweens || []).some((tw) => {
        const twDur = Math.max(0.08, (tw.dur || 0.4) * 1.4);
        return t >= tw.pos - 0.03 && t <= tw.pos + twDur + 0.04;
      });
    });
    const key = isAnim ? `ANIM:${i}` : `STATIC:${active.map((c) => c.id).join(",")}`;
    rawSteps.push({ type: isAnim ? "anim" : "static", t, dur: dt, key });
  }

  // Gộp các bước liên tiếp có cùng key (EMPTY hoặc STATIC cùng tập clip).
  const spans = [];
  for (const s of rawSteps) {
    const last = spans[spans.length - 1];
    if (last && last.key === s.key) {
      last.dur += s.dur;
    } else {
      spans.push({ ...s });
    }
  }
  // Với span STATIC, lấy thời điểm chụp ở giữa khoảng tĩnh (hoặc cách đầu 0.05s) để chữ đã hiện rõ.
  for (const s of spans) {
    if (s.type === "static") s.captureTime = +(s.t + Math.min(0.05, s.dur * 0.5)).toFixed(4);
    else if (s.type === "anim") s.captureTime = s.t;
  }
  return spans;
}

// Chờ trang dựng sẵn sàng và nạp đủ font, ảnh. Trả "ok", "loi" (không có timeline) hoặc "thieu:<tên>" để không xuất ra video mất chữ, mất ảnh.
export function readyExpression(needTimeline) {
  return `new Promise((r) => {
    const started = Date.now();
    const assets = () => {
      const fonts = document.fonts ? [...document.fonts].map((f) => f.load().then(() => "", () => "font " + f.family)) : [];
      const imgs = [...document.querySelectorAll("img[src], svg image")].map((el) => new Promise((done) => {
        const src = el.getAttribute("src") || el.getAttribute("href") || el.getAttribute("xlink:href") || "";
        if (!src) return done("");
        const i = new Image();
        i.onload = () => done("");
        i.onerror = () => done("ảnh " + src);
        i.src = src;
      }));
      Promise.all([...fonts, ...imgs]).then((list) => {
        const miss = [...new Set(list.filter(Boolean))];
        r(miss.length ? "thieu:" + miss.join(", ") : "ok");
      });
    };
    const check = () => {
      const tl = window.__timelines && Object.keys(window.__timelines).length > 0;
      if (document.readyState === "complete" && (tl || !${!!needTimeline})) assets();
      else if (Date.now() - started > 30000) r("loi");
      else setTimeout(check, 15);
    };
    check();
  })`;
}

// Chụp các khung hình cần thiết song song trên nhiều tab Chrome qua đường ống --remote-debugging-pipe.
async function captureSpansWithCdp({ browserPath, htmlPath, renderW, renderH, makeSpans, hideIds, needTimeline, transparent, tmpDir, workers = 4, onProgress, onKillCheck }) {
  const emptyPng = path.join(tmpDir, "empty.png");
  if (transparent) {
    spawnSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", `color=c=black@0.0:s=${renderW}x${renderH},format=rgba`, "-frames:v", "1", emptyPng], { windowsHide: true });
  } else {
    spawnSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", `color=c=black:s=${renderW}x${renderH}`, "-frames:v", "1", emptyPng], { windowsHide: true });
  }

  const userDataDir = path.join(tmpDir, "chrome_profile");
  fs.mkdirSync(userDataDir, { recursive: true });
  const proc = spawn(browserPath, [
    "--headless=new",
    "--use-gl=angle",
    "--use-angle=d3d11",
    "--enable-gpu-rasterization",
    "--ignore-gpu-blocklist",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--hide-scrollbars",
    "--mute-audio",
    "--allow-file-access-from-files",
    "--remote-debugging-pipe",
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], windowsHide: true });
  onKillCheck?.(proc);

  const pipeWrite = proc.stdio[3];
  const pipeRead = proc.stdio[4];
  let msgId = 0, buf = "";
  const pending = new Map();

  pipeRead.setEncoding("utf8");
  pipeRead.on("data", (chunk) => {
    buf += chunk;
    let idx;
    while ((idx = buf.indexOf("\0")) !== -1) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (!raw) continue;
      let msg;
      try { msg = JSON.parse(raw); } catch { continue; }
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      }
    }
  });

  const call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const cid = ++msgId;
    pending.set(cid, { resolve, reject });
    pipeWrite.write(JSON.stringify({ id: cid, method, params, ...(sessionId ? { sessionId } : {}) }) + "\0");
  });

  try {
    const fileUrl = pathToFileURL(htmlPath).href;
    const numWorkers = Math.max(1, workers);
    const sessions = await Promise.all(
      Array.from({ length: numWorkers }, async () => {
        const { targetId } = await call("Target.createTarget", { url: "about:blank" });
        const { sessionId } = await call("Target.attachToTarget", { targetId, flatten: true });
        await call("Page.enable", {}, sessionId);
        await call("Emulation.setDeviceMetricsOverride", { width: renderW, height: renderH, deviceScaleFactor: 1, mobile: false }, sessionId);
        if (transparent) {
          await call("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } }, sessionId);
        }
        await call("Page.navigate", { url: fileUrl }, sessionId);
        // Chờ timeline hiệu ứng, phông chữ và ảnh thật sự sẵn sàng; không chụp trang chưa chạy xong.
        const ready = await call("Runtime.evaluate", {
          expression: readyExpression(needTimeline),
          awaitPromise: true,
          returnByValue: true,
        }, sessionId);
        const state = ready.result?.value || "";
        if (state.startsWith("thieu:")) throw new Error(`Dừng xuất vì trang dựng không nạp được: ${state.slice(6)}. Video sẽ mất chữ hoặc mất ảnh nếu tiếp tục.`);
        if (state !== "ok") throw new Error("Trang dựng không tạo được timeline hiệu ứng, nên không thể xuất đủ nội dung. Hãy bấm Kiểm lỗi, hoặc kiểm tra mạng nếu dự án cần tải GSAP.");
        return sessionId;
      })
    );

    // Đọc chuyển động thật từ timeline, bỏ phần đã dựng bằng FFmpeg (video, ô che).
    const liveInfo = await call("Runtime.evaluate", {
      expression: `(function(hide){
        var tl = window.__timelines && (window.__timelines.main || Object.values(window.__timelines)[0]);
        var skip = function(t){ return t && t.closest && hide.some(function(id){ return t.closest("#" + CSS.escape(id)); }); };
        var tweens = [];
        if (tl && tl.getChildren) tl.getChildren(true, true, false).forEach(function(x){
          var ts = x.targets ? x.targets() : [];
          if (ts.length && ts.every(skip)) return;
          var s = x.startTime(), p = x.parent;
          while (p && p !== tl) { s = p.startTime() + s / (p.timeScale() || 1); p = p.parent; }
          tweens.push({ s: s, e: s + x.totalDuration() });
        });
        var root = document.querySelector("[data-composition-id]");
        var base = root ? Array.prototype.some.call(root.children, function(n){
          if (/^(SCRIPT|STYLE|VIDEO|AUDIO|TEMPLATE)$/.test(n.tagName) || n.hasAttribute("data-start")) return false;
          var b = n.getBoundingClientRect(), c = getComputedStyle(n);
          return b.width > 0 && b.height > 0 && c.visibility !== "hidden" && c.display !== "none" && +c.opacity > 0.01;
        }) : false;
        return JSON.stringify({ tweens: tweens, base: base, cssAnim: !!(document.getAnimations && document.getAnimations().length) });
      })(${JSON.stringify([...hideIds])})`,
      returnByValue: true,
    }, sessions[0]);
    const spans = makeSpans(JSON.parse(liveInfo.result?.value || "{}"));
    const renderSpans = spans.filter((s) => s.type !== "empty");

    const fmt = transparent ? "png" : "jpeg";
    const ext = transparent ? "png" : "jpg";
    let cursor = 0, done = 0;

    const workerLoop = async (sid) => {
      while (cursor < renderSpans.length) {
        const idx = cursor++;
        const span = renderSpans[idx];
        const t = span.captureTime ?? span.t;
        await call("Runtime.evaluate", {
          expression: `(function(t){
            var tl = window.__timelines && (window.__timelines.main || Object.values(window.__timelines)[0]);
            if (tl && tl.seek) tl.seek(t);
            if (document.getAnimations) document.getAnimations().forEach(function(a){ a.pause(); a.currentTime = t * 1000; });
            document.querySelectorAll("[data-start]").forEach(function(el) {
              var s = parseFloat(el.getAttribute("data-start") || "0");
              var d = parseFloat(el.getAttribute("data-duration") || "999999");
              if (el.tagName === "VIDEO" || el.tagName === "AUDIO") return;
              if (t < s - 0.001 || t > s + d + 0.001) el.style.visibility = "hidden";
              else if (el.style.visibility === "hidden") el.style.visibility = "";
            });
          })(${t})`,
        }, sid);
        const { data } = await call("Page.captureScreenshot", {
          format: fmt,
          ...(fmt === "jpeg" ? { quality: 94 } : {}),
          optimizeForSpeed: true,
        }, sid);
        const outFile = path.join(tmpDir, `ov_${String(idx).padStart(5, "0")}.${ext}`);
        fs.writeFileSync(outFile, Buffer.from(data, "base64"));
        span.file = outFile;
        done++;
        onProgress?.(done, renderSpans.length);
      }
    };

    await Promise.all(sessions.map((sid) => workerLoop(sid)));
    for (const s of spans) if (s.type === "empty") s.file = emptyPng;
    return spans;
  } finally {
    try { proc.kill(); } catch { /* đã đóng */ }
    spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
  }
}

// Tạo danh sách khoảng thời gian kích hoạt lớp phủ để FFmpeg bỏ qua hoàn toàn phép pha alpha khi màn hình không có chữ/đồ họa.
function buildOverlayEnableExpr(spans) {
  const activeRanges = [];
  let curStart = null, curEnd = 0, t = 0;
  for (const s of spans) {
    const nextT = t + s.dur;
    if (s.type !== "empty") {
      if (curStart === null) curStart = t;
      curEnd = nextT;
    } else if (curStart !== null) {
      activeRanges.push([curStart, curEnd]);
      curStart = null;
    }
    t = nextT;
  }
  if (curStart !== null) activeRanges.push([curStart, curEnd]);
  if (!activeRanges.length) return "0";
  if (activeRanges.length > 45) return "1";
  return activeRanges.map(([a, b]) => `between(t,${Math.max(0, a - 0.02).toFixed(3)},${(b + 0.02).toFixed(3)})`).join("+");
}

const MAX_NVDEC = 8;

// Hàm chính: chạy xuất video siêu tốc theo chế độ "capcut" (Hybrid GPU NVENC) hoặc "nhanh" (Direct FFmpeg GPU).
export function runFastRender(p, opts, { output, size, fit, gpu, codec = "h264", reframeFilter, onFinish }) {
  const fps = Math.max(15, Math.min(120, +opts.fps || 60));
  const quality = opts.quality || "delivery";
  const draft = quality === "draft";
  const rawHtml = fs.readFileSync(p.file, "utf8");
  const comp = parse(rawHtml);
  const nodes = scan(rawHtml);
  const overrides = readOverrides(rawHtml).clips || {};

  // Có chọn kích thước thì dựng thẳng theo đó; "Giữ nguyên" là đúng kích thước gốc, chỉ bản nháp mới tự hạ xuống 720p.
  const compRatio = comp.width / comp.height;
  let renderW = comp.width, renderH = comp.height;
  if (size) {
    const sizeRatio = size.w / size.h;
    if (Math.abs(sizeRatio - compRatio) < 0.02) {
      renderW = size.w;
      renderH = size.h;
      size = null; // Đã dựng thẳng ở đúng kích thước đích, không cần bước reframe!
    } else {
      const shortSide = Math.min(size.w, size.h);
      renderW = compRatio >= 1 ? Math.round((shortSide * compRatio) / 2) * 2 : shortSide;
      renderH = compRatio >= 1 ? shortSide : Math.round((shortSide / compRatio) / 2) * 2;
    }
  } else if (draft && Math.min(comp.width, comp.height) > 720) {
    const s = 720 / Math.min(comp.width, comp.height);
    renderW = Math.round((comp.width * s) / 2) * 2;
    renderH = Math.round((comp.height * s) / 2) * 2;
  }

  const tmpDir = path.join(p.hf, `.hd-render-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  // Ghi ra tệp tạm rồi mới đổi tên: xuất lỗi hoặc dừng giữa chừng không làm hỏng bản cuối đang có.
  const tmpOutput = output.replace(/\.mp4$/, ".__dang-xuat.mp4");
  const encoder = pickEncoder({ codec, gpu, quality, w: size ? size.w : renderW, h: size ? size.h : renderH, hevcOk: gpu && codec === "hevc" && hasHevcNvenc() });

  const job = {
    status: "dang_chay",
    percent: 1,
    stage: "Đang trộn âm thanh đa làn…",
    engine: opts.engine || "capcut",
    codec,
    resolution: size ? `${size.w}×${size.h}` : `${renderW}×${renderH}`,
    fps,
    fpsCurrent: 0,
    speed: "",
    etaSec: null,
    output,
    project: p.name,
    gpu: encoder.gpu,
    startedAt: Date.now(),
    log: "",
    child: null,
  };

  let killed = false;
  const setChild = (proc) => {
    job.child = proc;
    if (killed || job.status !== "dang_chay") {
      try { proc.kill(); } catch { /* ignore */ }
    }
  };

  const cleanup = () => {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
    try { fs.rmSync(tmpOutput, { force: true }); } catch { /* ignore */ }
  };

  // Ghi thời gian từng bước để biết chỗ chậm thật, không đoán.
  const timing = { amThanh: 0, chupChu: 0, maHoa: 0, giaiMaGpu: 0, thuLaiCpu: false };
  const saveTiming = (ketQua) => {
    try {
      fs.appendFileSync(path.join(path.dirname(CDN_DIR), "lich-su-xuat.jsonl"), JSON.stringify({ luc: new Date().toISOString(), duAn: p.name, engine: job.engine, codec, kichThuoc: job.resolution, fps, thoiLuong: +comp.duration, soClip: comp.clips.filter((c) => c.kind === "video").length, ketQua, tongGiay: +((Date.now() - job.startedAt) / 1000).toFixed(1), ...timing }) + "\n");
    } catch { /* không để việc ghi số đo làm hỏng lần xuất */ }
  };

  (async () => {
    try {
      // Bước 1: Trộn âm thanh đa làn bằng FFmpeg.
      const audioStart = Date.now();
      const audioFile = await buildAudioMix(p, comp, nodes, tmpDir, setChild);
      timing.amThanh = +((Date.now() - audioStart) / 1000).toFixed(1);
      if (job.status !== "dang_chay") { cleanup(); return; }
      job.percent = 8;

      // Phân loại clip video thực tế tồn tại trên ổ cứng.
      // Lớp đã tắt mắt trong Studio thì không xuất.
      const shown = (c) => !overrides[c.id]?.hidden;
      const videoClips = comp.clips.filter((c) => c.kind === "video" && c.src && shown(c));
      const missing = videoClips.filter((c) => !fs.existsSync(path.resolve(p.hf, c.src)));
      if (missing.length) throw new Error(`Thiếu tệp video: ${missing.map((c) => c.src).join(", ")}`);
      const blurMasks = findBlurMasks(rawHtml, nodes, comp, renderW / comp.width, renderH / comp.height, overrides).filter((m) => !overrides[m.id]?.hidden);
      const transIds = new Set(
        comp.clips
          .filter((c) => c.kind === "fx" && (c.lane === "transition" || (nodes.find((n) => n.id === c.id)?.attrs?.style || "").includes("display:none")))
          .map((c) => c.id)
      );
      const allMasks = findBlurMasks(rawHtml, nodes, comp, 1, 1, overrides);
      const hideIds = new Set([...comp.clips.filter((c) => c.kind === "video").map((c) => c.id), ...allMasks.map((m) => m.id), ...transIds]);
      const ovClips = comp.clips.filter((c) => !["video", "audio", "sfx", "grade"].includes(c.kind) && !hideIds.has(c.id));

      const browserPath = findBrowser();
      if (!browserPath && (ovClips.length > 0 || videoClips.length === 0)) throw new Error("Không tìm thấy Chrome hoặc Edge để dựng lớp chữ và đồ họa");
      let concatPath = null;
      let ovEnableExpr = "0";

      // Bước 2: Chụp thông minh các khung hình chữ / đồ họa / SVG (hoặc toàn khung nếu dự án không có thẻ <video>).
      if (browserPath && (ovClips.length > 0 || videoClips.length === 0)) {
        job.stage = "Đang dựng lớp chữ & đồ họa thông minh…";
        const transparent = videoClips.length > 0;
        // Mọi chế độ đều đủ chữ và đồ họa; chỉ khác độ mượt của chuyển động chữ.
        const animFps = draft ? Math.min(20, fps) : opts.engine === "nhanh" ? Math.min(15, fps) : quality === "standard" ? Math.min(30, fps) : fps;
        const scheduleClips = videoClips.length > 0 ? ovClips : comp.clips.filter((c) => !["audio", "sfx"].includes(c.kind));
        const renderHtmlPath = path.join(tmpDir, ".hd-ov-render.html");
        fs.writeFileSync(renderHtmlPath, buildRenderHtml(await localizeCdn(rawHtml), comp, { renderW, renderH, transparentOverlay: transparent, hideIds, baseDir: p.hf }), "utf8");

        const workers = Math.max(2, Math.min(6, Math.floor(os.cpus().length / 2) || 4));
        const captureStart = Date.now();
        const spans = await captureSpansWithCdp({
          browserPath,
          htmlPath: renderHtmlPath,
          renderW,
          renderH,
          makeSpans: (live) => buildOverlaySchedule(comp, scheduleClips, overrides, fps, animFps, live),
          hideIds,
          needTimeline: /__timelines/.test(rawHtml),
          transparent,
          tmpDir,
          workers,
          onKillCheck: setChild,
          onProgress: (done, total) => {
            job.percent = Math.min(48, 8 + Math.round((done / Math.max(1, total)) * 40));
            const elapsed = (Date.now() - job.startedAt) / 1000;
            const effFps = Math.round(((done / Math.max(1, total)) * comp.duration * fps) / Math.max(0.2, elapsed));
            job.fpsCurrent = effFps;
            job.speed = `${(effFps / fps).toFixed(1)}x`;
          },
        });
        timing.chupChu = +((Date.now() - captureStart) / 1000).toFixed(1);
        if (job.status !== "dang_chay") { cleanup(); return; }

        let concatTxt = "ffconcat version 1.0\n";
        for (const s of spans) {
          concatTxt += `file '${s.file.replace(/\\/g, "/")}'\nduration ${Math.max(0.005, s.dur).toFixed(4)}\n`;
        }
        const lastFile = spans[spans.length - 1]?.file || path.join(tmpDir, "empty.png");
        concatTxt += `file '${lastFile.replace(/\\/g, "/")}'\n`;
        concatPath = path.join(tmpDir, "ov_concat.txt");
        fs.writeFileSync(concatPath, concatTxt, "utf8");
        ovEnableExpr = transparent ? buildOverlayEnableExpr(spans) : "1";
      }

      if (job.status !== "dang_chay") { cleanup(); return; }
      job.percent = 50;
      job.stage = encoder.gpu ? "Đang mã hóa siêu tốc GPU NVENC…" : "Đang ghép và mã hóa video…";

      // Bước 3: Ghép video gốc + hiệu ứng chuyển cảnh + chỉnh màu/LUT + lớp phủ + âm thanh trong 1 lượt FFmpeg duy nhất.
      const dur = Math.max(0.1, +comp.duration || 1);
      const ffArgs = ["-y", "-v", "error", "-progress", "pipe:1"];
      const filters = [];
      let inputIdx = 0;

      if (videoClips.length === 0 && concatPath) {
        // Dự án thuần đồ họa/chữ (không có thẻ <video>): dùng trực tiếp luồng concat làm hình nền.
        ffArgs.push("-f", "concat", "-safe", "0", "-i", concatPath);
        const ovInp = inputIdx++;
        filters.push(`[${ovInp}:v]fps=${fps},scale=${renderW}:${renderH}:flags=bicubic,setsar=1[base_v]`);
      } else {
        // Khung nền đen chuẩn.
        ffArgs.push("-f", "lavfi", "-i", `color=c=black:s=${renderW}x${renderH}:r=${fps}:d=${dur.toFixed(3)}`);
        const baseInp = inputIdx++;
        let prev = `${baseInp}:v`;

        // Sắp xếp video theo thứ tự z-index và thời điểm bắt đầu.
        const sortedVideos = [...videoClips].sort((a, b) => {
          const za = +(/\bz-index\s*:\s*(-?\d+)/i.exec(nodes.find((n) => n.id === a.id)?.attrs?.style || "")?.[1] || 0);
          const zb = +(/\bz-index\s*:\s*(-?\d+)/i.exec(nodes.find((n) => n.id === b.id)?.attrs?.style || "")?.[1] || 0);
          return za - zb || a.start - b.start;
        });

        // Đo 03/11 trên RTX 4060, clip 1728×3072: CPU 2 luồng 65 fps, NVDEC 203 fps. 8 bộ giải mã cùng lúc chạy tốt, 21 thì lỗi,
        // nên chỉ giao GPU các clip dài nhất, clip còn lại giải mã CPU 4 luồng.
        const hwClips = encoder.gpu ? new Set([...sortedVideos].sort((a, b) => (b.end - b.start) - (a.end - a.start)).slice(0, MAX_NVDEC).map((c) => c.id)) : new Set();
        timing.giaiMaGpu = hwClips.size;

        sortedVideos.forEach((v, idx) => {
          const vNode = nodes.find((n) => n.id === v.id);
          const vFile = path.resolve(p.hf, v.src);
          const rate = Math.max(0.25, Math.min(4, +v.rate || 1));
          const clipDur = Math.max(0.05, v.end - v.start);
          const srcDur = clipDur * rate;
          if (hwClips.has(v.id)) ffArgs.push("-hwaccel", "cuda");
          ffArgs.push("-threads", hwClips.has(v.id) ? "2" : "4", "-ss",String(Math.max(0, +v.mediaStart || 0).toFixed(3)), "-t", String(srcDur.toFixed(3)), "-i", vFile);
          const inp = inputIdx++;
          const ov = overrides[v.id] || {};
          const scaleMul = Math.max(0.1, +ov.scale || 1);
          const targetW = Math.round((renderW * scaleMul) / 2) * 2;
          const targetH = Math.round((renderH * scaleMul) / 2) * 2;

          const vChain = [`[${inp}:v]`];
          if (Math.abs(rate - 1) > 0.005) vChain.push(`setpts=PTS/${rate.toFixed(4)},`);
          vChain.push(`fps=${fps},scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${renderW}:${renderH},setsar=1`);

          const grades = videoGradeFilters(p, v, vNode);
          if (grades.length) vChain.push(`,${grades.join(",")}`);

          const tr = findVideoTransition(rawHtml, nodes, v);
          const needAlpha = (tr && tr.fade) || (ov.opacity !== undefined && +ov.opacity < 0.999);
          if (needAlpha) vChain.push(",format=yuva420p");
          if (tr && tr.fade) vChain.push(`,fade=t=in:st=0:d=${tr.dur.toFixed(3)}:alpha=1`);
          if (ov.opacity !== undefined && +ov.opacity < 0.999) vChain.push(`,colorchannelmixer=aa=${Math.max(0, Math.min(1, +ov.opacity)).toFixed(3)}`);
          vChain.push(`,setpts=PTS-STARTPTS+${v.start.toFixed(3)}/TB[vv${idx}]`);
          filters.push(vChain.join(""));

          const next = `vb${idx}`;
          const dx = Math.round((+ov.x || 0) * (renderW / comp.width));
          const dy = Math.round((+ov.y || 0) * (renderH / comp.height));
          let xExpr = String(dx), yExpr = String(dy);
          if (tr && tr.xFrom) {
            const sxFrom = Math.round(tr.xFrom * (renderW / comp.width));
            xExpr = `'if(lt(t,${(v.start + tr.dur).toFixed(3)}),${dx}+${sxFrom}*(1-(t-${v.start.toFixed(3)})/${tr.dur.toFixed(3)}),${dx})'`;
          }
          if (tr && tr.yFrom) {
            const syFrom = Math.round(tr.yFrom * (renderH / comp.height));
            yExpr = `'if(lt(t,${(v.start + tr.dur).toFixed(3)}),${dy}+${syFrom}*(1-(t-${v.start.toFixed(3)})/${tr.dur.toFixed(3)}),${dy})'`;
          }
          filters.push(`[${prev}][vv${idx}]overlay=x=${xExpr}:y=${yExpr}:enable='between(t,${v.start.toFixed(3)},${v.end.toFixed(3)})':eof_action=pass[${next}]`);
          prev = next;
        });

        // Áp các lớp che mờ (backdrop-filter: blur) lên vùng tương ứng của video.
        blurMasks.forEach((m, idx) => {
          const next = `vblur${idx}`;
          filters.push(blurMaskFilter(m, prev, next, idx));
          prev = next;
        });

        // Ghép lớp phủ chữ & đồ họa trong suốt lên trên nền video.
        if (concatPath && ovEnableExpr !== "0") {
          ffArgs.push("-f", "concat", "-safe", "0", "-i", concatPath);
          const ovInp = inputIdx++;
          const enableOpt = ovEnableExpr === "1" ? "" : `:enable='${ovEnableExpr}'`;
          filters.push(`[${prev}][${ovInp}:v]overlay=0:0:eof_action=pass${enableOpt}[base_v]`);
        } else {
          filters.push(`[${prev}]null[base_v]`);
        }
      }

      // Luồng âm thanh đã trộn.
      ffArgs.push("-i", audioFile);
      const audioInp = inputIdx++;

      // Nếu người dùng đổi khung hình khác tỷ lệ gốc (vd 9:16 -> 16:9), áp bộ lọc reframe ngay trong cùng 1 lượt!
      if (size) {
        filters.push(`[base_v]${reframeFilter(size, fit)}[vfinal]`);
      } else {
        filters.push(`[base_v]null[vfinal]`);
      }

      const vFilterStr = filters.join(";");
      const vFilterFile = path.join(tmpDir, "video_filter.txt");
      const vFilterArg = vFilterStr.length > 20000 ? ["-/filter_complex", vFilterFile] : ["-filter_complex", vFilterStr];
      if (vFilterStr.length > 20000) fs.writeFileSync(vFilterFile, vFilterStr, "utf8");

      ffArgs.push(
        ...vFilterArg,
        "-map", "[vfinal]",
        "-map", `${audioInp}:a`,
        "-t", dur.toFixed(3),
        ...encoder.args,
        "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        "-movflags", "+faststart",
        tmpOutput
      );

      let ffEncodeStart = Date.now();
      const runFfmpeg = (args) => new Promise((resolve, reject) => {
        const ff = spawn("ffmpeg", args, { windowsHide: true });
        setChild(ff);
        let progressBuf = "";
        ff.stdout.on("data", (chunk) => {
          progressBuf += chunk.toString();
          const lines = progressBuf.split(/\r?\n/);
          progressBuf = lines.pop() || "";
          for (const line of lines) {
            const [k, v] = line.split("=");
            if (k === "out_time_us" || k === "out_time_ms") {
              const sec = (+v || 0) / 1e6;
              const pRatio = Math.max(0, Math.min(1, sec / dur));
              job.percent = Math.min(99, 50 + Math.round(pRatio * 49));
              const elapsed = (Date.now() - ffEncodeStart) / 1000;
              if (pRatio > 0.02 && elapsed > 0.2) {
                job.etaSec = Math.max(0, Math.round((elapsed / pRatio) * (1 - pRatio)));
              }
            } else if (k === "fps") {
              job.fpsCurrent = Math.round(+v || 0);
            } else if (k === "speed") {
              job.speed = v.trim();
            }
          }
        });
        ff.stderr.on("data", (b) => { job.log = (job.log + b).slice(-4000); });
        ff.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(job.log || `FFmpeg thoát với mã ${code}`))));
        ff.on("error", reject);
      });

      const encodeStart = Date.now();
      try {
        await runFfmpeg(ffArgs);
      } catch (err) {
        if (job.status !== "dang_chay" || !ffArgs.includes("-hwaccel")) throw err;
        // Giải mã GPU có thể hỏng với định dạng lạ hoặc khi thiếu bộ nhớ card: xuất lại bằng CPU thay vì báo lỗi.
        timing.thuLaiCpu = true;
        job.log = "";
        job.percent = 50;
        job.stage = "Giải mã GPU lỗi, đang xuất lại bằng CPU…";
        ffEncodeStart = Date.now();
        await runFfmpeg(ffArgs.filter((a, i) => a !== "-hwaccel" && ffArgs[i - 1] !== "-hwaccel"));
      }
      timing.maHoa = +((Date.now() - encodeStart) / 1000).toFixed(1);

      if (job.status === "dang_chay") {
        try { fs.renameSync(tmpOutput, output); }
        catch { throw new Error(`Không ghi đè được ${path.basename(output)}. Tệp có thể đang mở trong trình phát, hãy đóng rồi xuất lại.`); }
      }
      cleanup();
      if (job.status === "dang_chay") {
        job.stage = "Hoàn tất";
        job.etaSec = 0;
        saveTiming("xong");
        onFinish(true);
      }
    } catch (err) {
      cleanup();
      job.log = (job.log + "\n" + (err?.message || String(err))).slice(-4000);
      if (job.status === "dang_chay") {
        saveTiming("loi");
        job.stage = "Lỗi khi xuất video";
        onFinish(false);
      }
    }
  })();

  return job;
}
