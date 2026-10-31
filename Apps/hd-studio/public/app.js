import { overridesCss } from "/lib/html.mjs";

// Giao diện lưu trên máy chủ Studio, mở lại ở cổng nào cũng giữ nguyên. Chuyển dữ liệu cũ từ trình duyệt nếu có.
let uiCache = await fetch("/vn/giao-dien").then((r) => r.json()).catch(() => ({}));
if (!Object.keys(uiCache).length) {
  try {
    const old = JSON.parse(localStorage.getItem("hd-giao-dien") || "null");
    if (old) { uiCache = old; fetch("/vn/giao-dien", { method: "POST", body: JSON.stringify(old) }); localStorage.removeItem("hd-giao-dien"); }
  } catch { /* không có dữ liệu cũ */ }
}
// Giao diện HD Studio. Mọi sửa đổi đi qua máy chủ rồi ghi thẳng vào hf/index.html.
const $ = (s) => document.querySelector(s);
const el = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };

const LANES = [
  { kind: "sub", name: "Phụ đề" }, { kind: "text", name: "Chữ" }, { kind: "sticker", name: "Nhãn dán" }, { kind: "shape", name: "Hình" }, { kind: "graphic", name: "Đồ họa MG" }, { kind: "transition", name: "Chuyển cảnh" }, { kind: "fx", name: "Hiệu ứng" },
  { kind: "grade", name: "Màu, bộ lọc" }, { kind: "video", name: "Video, cảnh" }, { kind: "image", name: "Ảnh" }, { kind: "voice", name: "Lời thoại" }, { kind: "sfx", name: "SFX" }, { kind: "music", name: "Nhạc nền" }, { kind: "audio", name: "Âm thanh" },
];
const EASES = ["none", "power1.out", "power2.out", "power3.out", "power2.in", "power2.inOut", "sine.inOut", "expo.out", "back.out(1.7)", "elastic.out(1,0.5)"];

const state = {
  project: new URLSearchParams(location.search).get("du-an"),
  model: null, sel: null, time: 0, playing: false, pxPerSec: 20, snap: true, loop: false, muted: false, rate: 1,
  hidden: new Set(), range: null, rangeMode: false, shoot: true, picks: new Set(), notes: [], filter: "sub", stopAt: null, frame: null, scale: 1, peaks: new Map(), lastMtime: 0, busy: false, lanes: [],
};

const api = async (url, opts) => {
  const sep = url.includes("?") ? "&" : "?";
  const r = await fetch(`/vn/${url}${sep}du-an=${encodeURIComponent(state.project)}`, opts);
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Có lỗi xảy ra");
  return d;
};
// Đánh dấu lúc đang lưu để bộ theo dõi file không tưởng thay đổi của chính mình là của AI.
const post = async (url, body) => {
  state.saveTick = Date.now();
  try { return await api(url, { method: "POST", body: JSON.stringify(body ?? {}) }); }
  finally { state.saveTick = Date.now(); }
};

function toast(msg, bad) {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false; t.classList.toggle("bad", !!bad);
  clearTimeout(toast.h);
  toast.h = setTimeout(() => (t.hidden = true), bad ? 6000 : 2500);
}
const setStatus = (s) => ($("#status").textContent = s);
const fmtTime = (t) => { const m = Math.floor(t / 60), s = t - m * 60; return `${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`; };
const baseName = (p) => (p || "").split("/").pop();
const clipOf = (id) => state.model?.clips.find((c) => c.id === id);

function clipLabel(c) {
  if (c.name) return c.name;
  if (c.segments.length) return c.segments.map((s) => s.text.replace(/\*\*/g, "")).join(" · ");
  if (c.kind === "grade") return c.grade?.lut ? `Màu · ${baseName(c.grade.lut.src).replace(/\.cube$/i, "")}` : "Lớp màu";
  if (c.src) return baseName(c.src);
  return { map: "Bản đồ", flash: "Lóe trắng", fade: "Tối dần" }[c.id] || c.id || c.tag;
}

// ---- Khung xem ----
function player() { return state.frame?.contentWindow?.__player; }

function loadFrame() {
  const m = state.model;
  const f = el("iframe", { title: "Khung xem video", src: `/api/projects/${m.projectId}/preview?_t=${Date.now()}` });
  f.width = m.width; f.height = m.height;
  f.style.cssText = `width:${m.width}px;height:${m.height}px;visibility:hidden;transform:scale(${state.scale})`;
  $("#frameBox").prepend(f);
  const old = state.frame;
  const started = Date.now();
  const wait = setInterval(() => {
    const p = f.contentWindow?.__player;
    if (!p && Date.now() - started < 30000) return;
    clearInterval(wait);
    if (!p) { toast("Khung xem chưa tải được. Hãy tải lại trang.", true); return; }
    state.frame = f;
    f.style.visibility = "visible";
    old?.remove();
    p.seek(Math.min(state.time, m.duration));
    if (state.afterLoad) { const run = state.afterLoad; state.afterLoad = null; setTimeout(run, 150); }
    f.contentWindow.postMessage({ source: "hf-parent", type: "control", action: "set-muted", muted: state.muted }, "*");
    f.contentWindow.postMessage({ source: "hf-parent", type: "control", action: "set-volume", volume: state.viewVol ?? 1 }, "*");
    if (state.rate !== 1) f.contentWindow.postMessage({ source: "hf-parent", type: "control", action: "set-playback-rate", playbackRate: state.rate }, "*");
    applyHidden();
    studioStyle(f.contentDocument);
    syncFrameGlass();
    drawSel();
    setStatus("Đã lưu");
  }, 120);
}

const RATIOS = [["9:16", "TikTok, Reels, Shorts"], ["16:9", "YouTube, màn hình ngang"], ["1:1", "Vuông, bài đăng"], ["4:5", "Facebook, Instagram"], ["3:4", "Ảnh dọc, Xiaohongshu"], ["4:3", "Trình chiếu, TV cũ"], ["21:9", "Điện ảnh"]];
const RATIO_FITS = [["mo", "Nền mờ", "Giữ đủ hình"], ["cat", "Cắt đầy khung", "Phần tối sẽ bị cắt"], ["den", "Viền đen", "Giữ đủ hình"]];
// Khung hình đích lưu riêng cho từng dự án, dùng khi xem và khi xuất.
function frameChoice() { return { aspect: "goc", fit: "mo", ...readUi().khung?.[state.project] }; }
function setFrameChoice(p) {
  const ui = readUi(), id = state.project;
  saveUi({ ...ui, khung: { ...ui.khung, [id]: { ...frameChoice(), ...p } } });
  fitStage();
}
// Kích thước khung đích tính theo đơn vị của bản dựng; null nếu giữ nguyên.
function frameOut(m) {
  const { aspect, fit } = frameChoice();
  if (aspect === "goc") return null;
  const [a, b] = aspect.split(":").map(Number), r = a / b;
  if (Math.abs(r - m.width / m.height) < 0.005) return null;
  const wider = r > m.width / m.height;
  if (fit === "cat") return wider ? { w: m.width, h: m.width / r } : { w: m.height * r, h: m.height };
  return wider ? { w: m.height * r, h: m.height } : { w: m.width, h: m.width / r };
}
function drawRatio(out, s) {
  const { aspect, fit } = frameChoice();
  const btn = $("#ratioBtn");
  btn.textContent = aspect === "goc" ? "Gốc" : aspect;
  btn.classList.toggle("on", aspect !== "goc");
  const box = $("#ratioBox");
  box.hidden = !out;
  if (!out) return;
  box.className = fit;
  box.style.width = `${out.w * s}px`;
  box.style.height = `${out.h * s}px`;
  $("#ratioTag").textContent = `${aspect} · ${RATIO_FITS.find((f) => f[0] === fit)[1]}`;
}
function fitStage() {
  const m = state.model;
  if (!m) return;
  const box = $("#stage").getBoundingClientRect();
  const out = frameOut(m);
  const s = Math.min((box.width - 16) / Math.max(m.width, out?.w || 0), (box.height - 16) / Math.max(m.height, out?.h || 0));
  state.scale = s;
  drawRatio(out, s);
  $("#frameBox").style.width = `${m.width * s}px`;
  $("#frameBox").style.height = `${m.height * s}px`;
  for (const f of document.querySelectorAll("#frameBox iframe")) f.style.transform = `scale(${s})`;
  drawSel();
}

function seek(t) {
  const m = state.model;
  t = Math.max(0, Math.min(t, m.duration));
  setTimeout(kfRefresh);
  state.time = t;
  player()?.seek(t);
  drawHead();
  drawSel();
}

function togglePlay() {
  const p = player();
  if (!p) return;
  if (p.isPlaying()) { p.pause(); }
  else { if (state.time >= state.model.duration - 0.02) seek(0); p.play(); }
}

function tick() {
  const p = player();
  if (p && state.model) {
    const playing = p.isPlaying();
    if (playing !== state.playing) { state.playing = playing; $("#play").textContent = playing ? "⏸" : "▶"; $("#play").setAttribute("aria-label", playing ? "Dừng" : "Phát"); }
    if (playing) {
      state.time = p.getTime();
      if (state.time >= state.model.duration - 0.02 && state.loop) { p.seek(0); p.play(); }
      if (state.stopAt !== null && state.time >= state.stopAt) { p.pause(); state.stopAt = null; }
      drawHead(true);
      drawSel();
      markNow();
    }
  }
  requestAnimationFrame(tick);
}

function applyHidden() {
  const doc = state.frame?.contentDocument;
  if (!doc) return;
  let st = doc.getElementById("hd-hide");
  if (!st) { st = doc.createElement("style"); st.id = "hd-hide"; doc.head.append(st); }
  const ids = state.model.clips.filter((c) => state.hidden.has(laneKey(c)) && c.id).map((c) => `#${c.id}`);
  st.textContent = ids.length ? `${ids.join(",")}{visibility:hidden!important}` : "";
  for (const c of state.model.clips) {
    if ((c.kind !== "audio" && c.kind !== "sfx") || !c.id) continue;
    const a = doc.getElementById(c.id);
    if (a) a.muted = state.hidden.has(laneKey(c));
  }
}

// ---- Chọn và kéo trực tiếp trên khung xem ----
function targetAt(cx, cy) {
  const doc = state.frame?.contentDocument;
  if (!doc) return null;
  const r = $("#pick").getBoundingClientRect();
  const x = (cx - r.left) / state.scale, y = (cy - r.top) / state.scale;
  const ids = new Set(state.model.clips.map((c) => c.id));
  const hit = [];
  for (let n of doc.elementsFromPoint(x, y)) {
    for (; n && n !== doc.documentElement; n = n.parentElement) {
      if (n.id && ids.has(n.id) && getComputedStyle(n).opacity !== "0" && getComputedStyle(n).visibility !== "hidden") { if (!hit.includes(n.id)) hit.push(n.id); }
    }
  }
  const rank = (id) => ["sub", "text", "graphic", "fx", "image", "video", "audio", "sfx"].indexOf(clipOf(id).kind);
  return hit.sort((a, b) => rank(a) - rank(b))[0] ?? null;
}

function drawSel() {
  const box = $("#selBox");
  const doc = state.frame?.contentDocument;
  const c = clipOf(state.sel);
  if (!c && state.layer && doc) {
    const r = doc.getElementById(state.layer)?.getBoundingClientRect();
    box.hidden = !r?.width;
    if (r?.width) box.style.cssText = `left:${r.left * state.scale - 2}px;top:${r.top * state.scale - 2}px;width:${r.width * state.scale + 4}px;height:${r.height * state.scale + 4}px`;
    return;
  }
  if (!doc || !c || c.kind === "audio" || c.kind === "sfx" || c.kind === "fx") { box.hidden = true; return; }
  const n = doc.getElementById(c.id);
  if (!n || state.time < c.start || state.time > c.end) { box.hidden = true; return; }
  let r = n.getBoundingClientRect();
  if (!r.width) { box.hidden = true; return; }
  box.hidden = false;
  box.style.cssText = `left:${r.left * state.scale - 2}px;top:${r.top * state.scale - 2}px;width:${r.width * state.scale + 4}px;height:${r.height * state.scale + 4}px`;
  const m = state.model;
  if (c.segments.length) { const rg = doc.createRange(); rg.selectNodeContents(n); const t = rg.getBoundingClientRect(); if (t.width) r = t; }
  const unsafe = c.kind !== "video" && c.kind !== "image" && (r.top < m.height * 0.12 || r.bottom > m.height * 0.75 || r.right > m.width * 0.852 || r.left < 0);
  box.classList.toggle("out", unsafe);
}

// Kéo góc khung chọn để đổi kích thước.
for (const corner of ["nw", "ne", "sw", "se"]) {
  const h = el("i", { className: corner });
  $("#selBox").append(h);
  h.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    const id = state.sel, n = state.frame.contentDocument.getElementById(id);
    const r = $("#selBox").getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const d0 = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
    const s0 = state.model.overrides[id]?.scale ?? 1;
    let val = s0;
    h.setPointerCapture(e.pointerId);
    const move = (ev) => {
      val = Math.max(0.05, +(s0 * Math.hypot(ev.clientX - cx, ev.clientY - cy) / d0).toFixed(3));
      n.style.setProperty("scale", String(val), "important");
      drawSel();
    };
    const up = () => {
      h.removeEventListener("pointermove", move);
      h.removeEventListener("pointerup", up);
      if (val !== s0) edit("style", { id, set: { scale: val } });
    };
    h.addEventListener("pointermove", move);
    h.addEventListener("pointerup", up);
  });
}
$("#selBox").append(el("b", { textContent: "Ngoài vùng an toàn TikTok" }));
$("#pick").addEventListener("dblclick", () => document.querySelector("#props textarea")?.focus());

$("#pick").addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  const id = e.target.id === "selBox" ? state.sel : targetAt(e.clientX, e.clientY);
  select(id);
  if (!id) return;
  const c = clipOf(id);
  if (c.kind === "audio" || c.kind === "sfx" || c.kind === "fx") return;
  const doc = state.frame.contentDocument, n = doc.getElementById(id);
  const parent = n.parentElement;
  const ps = parent.getBoundingClientRect().width / parent.offsetWidth || 1;
  const o = state.model.overrides[id] || {};
  const x0 = kfValue(id, "x", o.x || 0), y0 = kfValue(id, "y", o.y || 0), sx = e.clientX, sy = e.clientY;
  let moved = false, nx = x0, ny = y0;
  $("#pick").setPointerCapture(e.pointerId);
  // Khung để canh: mép và tâm thật của phần tử; chữ lấy theo phần chữ, không theo khối bao.
  let box0 = n.getBoundingClientRect();
  if (c.segments.length) { const rg = doc.createRange(); rg.selectNodeContents(n); const t = rg.getBoundingClientRect(); if (t.width) box0 = t; }
  const W = state.model.width, H = state.model.height;
  const reach = 7 / state.scale;
  // Hít vào mép và đường giữa khung hình; trả về độ lệch đã chỉnh và đường canh.
  const snapAxis = (lo, hi, d, size) => {
    let best = null;
    for (const line of [0, size / 2, size]) for (const edge of [lo, (lo + hi) / 2, hi]) {
      const gap = line - (edge + d);
      if (Math.abs(gap) <= reach && (!best || Math.abs(gap) < Math.abs(best.gap))) best = { gap, line };
    }
    return best;
  };
  // Đường canh chỉ lóe lên lúc vừa khớp rồi tự tắt; rời khỏi rồi quay lại mới hiện lần nữa.
  const flash = new Map();
  const showGuide = (el2, prop, value) => {
    const f = flash.get(el2) || {};
    if (value === null) { clearTimeout(f.timer); flash.delete(el2); el2.hidden = true; return; }
    if (f.value === value) return;
    clearTimeout(f.timer);
    el2.style[prop] = `${Math.min(value * state.scale, (prop === "left" ? W : H) * state.scale - 1)}px`;
    el2.hidden = false;
    flash.set(el2, { value, timer: setTimeout(() => { el2.hidden = true; }, 500) });
  };
  const move = (ev) => {
    if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 3) return;
    moved = true;
    let cx = (ev.clientX - sx) / state.scale, cy = (ev.clientY - sy) / state.scale;
    // Giữ Alt để kéo tự do.
    const a = ev.altKey ? null : snapAxis(box0.left, box0.right, cx, W);
    const b = ev.altKey ? null : snapAxis(box0.top, box0.bottom, cy, H);
    if (a) cx += a.gap;
    if (b) cy += b.gap;
    showGuide($("#guideV"), "left", a ? a.line : null);
    showGuide($("#guideH"), "top", b ? b.line : null);
    nx = Math.round(x0 + cx / ps); ny = Math.round(y0 + cy / ps);
    n.style.setProperty("translate", `${nx}px ${ny}px`, "important");
    drawSel();
  };
  const up = () => {
    $("#pick").removeEventListener("pointermove", move);
    $("#pick").removeEventListener("pointerup", up);
    for (const f of flash.values()) clearTimeout(f.timer);
    $("#guideV").hidden = $("#guideH").hidden = true;
    if (moved) setOrKey(id, { x: nx, y: ny }, () => edit("style", { id, set: { x: nx, y: ny } }, true));
  };
  $("#pick").addEventListener("pointermove", move);
  $("#pick").addEventListener("pointerup", up);
});

// ---- Timeline ----
const laneKey = (c) => c.lane || c.kind;
function packLanes() {
  const out = [];
  for (const lane of LANES) {
    const clips = state.model.clips.filter((c) => laneKey(c) === lane.kind).sort((a, b) => a.start - b.start);
    if (!clips.length) continue;
    const rows = [];
    for (const c of clips) {
      let r = rows.find((row) => row[row.length - 1].end <= c.start + 0.001);
      if (!r) rows.push((r = []));
      r.push(c);
    }
    rows.forEach((row, i) => out.push({ ...lane, row, first: i === 0, label: rows.length > 1 ? `${lane.name} ${i + 1}` : lane.name }));
  }
  return out;
}

function drawTimeline() {
  const m = state.model;
  if (!m) return;
  const scrollWidth = Math.max(m.duration * state.pxPerSec + 200, 200);
  $("#tracks").style.width = `${scrollWidth}px`;
  const ruler = $("#ruler");
  ruler.replaceChildren();
  const steps = [1, 2, 5, 10, 15, 30, 60];
  const step = steps.find((s) => s * state.pxPerSec >= 60) || 120;
  for (let t = 0; t <= m.duration + step; t += step) {
    const i = el("i", { textContent: fmtTime(t).slice(0, 5) });
    i.style.left = `${t * state.pxPerSec}px`;
    ruler.append(i);
  }
  for (const n of state.notes) {
    const u = el("u", { title: n.noi_dung });
    u.style.left = `${n.luc_video * state.pxPerSec}px`;
    u.addEventListener("pointerdown", (e) => { e.stopPropagation(); seek(n.luc_video); });
    ruler.append(u);
  }
  state.lanes = packLanes();
  $("#laneRows").replaceChildren(...state.lanes.map((l) => {
    const eye = el("button", { textContent: ["audio", "sfx", "voice", "music"].includes(l.kind) ? "🔊" : "👁", title: `Ẩn / hiện ${l.name} khi xem`, className: state.hidden.has(l.kind) ? "off" : "" });
    eye.setAttribute("aria-label", `Ẩn hoặc hiện ${l.name}`);
    eye.onclick = () => { state.hidden.has(l.kind) ? state.hidden.delete(l.kind) : state.hidden.add(l.kind); applyHidden(); drawTimeline(); };
    return el("div", { className: "lane" }, el("span", { textContent: l.label }), l.first ? eye : "");
  }));
  $("#rows").replaceChildren(...state.lanes.map((l) => {
    const row = el("div", { className: "row-t" });
    for (const c of l.row) row.append(clipEl(c));
    return row;
  }));
  drawHead();
  drawRange();
}

// Tay nắm rõ dần, mờ dần ở hai góc trên của clip, kéo vào trong như CapCut.
function addFadeHandles(c, box) {
  const pps = state.pxPerSec, len = c.end - c.start;
  const mk = (side) => {
    const val = side === "in" ? c.fadeIn : c.fadeOut;
    const shade = el("div", { className: `fo ${side}` });
    shade.style.width = `${val * pps}px`;
    const h = el("div", { className: `fh${val ? " set" : ""}`, title: side === "in" ? "Kéo vào trong để rõ dần" : "Kéo vào trong để mờ dần" });
    const place = (v) => { h.style.left = side === "in" ? `${Math.max(4, v * pps)}px` : `${Math.min(len * pps - 4, (len - v) * pps)}px`; shade.style.width = `${v * pps}px`; };
    place(val);
    h.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      select(c.id);
      h.setPointerCapture(e.pointerId);
      const r = box.getBoundingClientRect();
      let v = val;
      const move = (ev) => {
        const x = (ev.clientX - r.left) / pps;
        v = +Math.max(0, Math.min(Math.min(10, len), side === "in" ? x : len - x)).toFixed(2);
        place(v);
      };
      h.addEventListener("pointermove", move);
      h.addEventListener("pointerup", () => {
        h.removeEventListener("pointermove", move);
        if (v !== val) edit("attrs", { id: c.id, [side === "in" ? "fadeIn" : "fadeOut"]: v });
      }, { once: true });
    });
    box.append(shade, h);
  };
  mk("in"); mk("out");
}

// Kim cương trên clip đang chọn: bấm để nhảy tới, kéo để dời thời điểm.
function kfMark(c, t) {
  const m = el("i", { className: `kf${kfNear(t, state.time - c.start) ? " on" : ""}`, title: `Keyframe ${fmtTime(c.start + t)}` });
  m.style.left = `${t * state.pxPerSec}px`;
  m.addEventListener("pointerdown", (e) => {
    e.stopPropagation(); e.preventDefault();
    m.setPointerCapture(e.pointerId);
    const x0 = e.clientX; let nt = t, moved = false;
    state.dragging = true;
    const mv = (ev) => { if (Math.abs(ev.clientX - x0) < 3 && !moved) return; moved = true; nt = Math.max(0, Math.min(c.end - c.start, t + (ev.clientX - x0) / state.pxPerSec)); m.style.left = `${nt * state.pxPerSec}px`; };
    const up = () => {
      m.removeEventListener("pointermove", mv); m.removeEventListener("pointerup", up);
      state.dragging = false;
      if (moved) edit("keyframe", { id: c.id, from: t, to: nt }); else { player()?.pause(); seek(c.start + t); }
    };
    m.addEventListener("pointermove", mv); m.addEventListener("pointerup", up);
  });
  m.addEventListener("dblclick", (e) => e.stopPropagation());
  return m;
}

// Hoạt ảnh vào, ra hiện ngay trên clip chữ; kéo dải để đổi độ dài.
function animBands(c, box) {
  const a = state.model.overrides[c.id]?.anim;
  if (!a) return;
  for (const [side, key] of [["in", "in"], ["out", "out"]]) {
    if (!a[key]?.on) continue;
    const dur = 0.6 / (a[key].sp || 1);
    const b = el("i", { className: `anB ${side}`, title: `Hoạt ảnh ${side === "in" ? "vào" : "ra"}: ${dur.toFixed(2)} giây. Kéo để đổi` });
    b.style.width = `${dur * state.pxPerSec}px`;
    b.addEventListener("pointerdown", (e) => {
      e.stopPropagation(); e.preventDefault();
      b.setPointerCapture(e.pointerId);
      const x0 = e.clientX; let nd = dur;
      const mv = (ev) => { const dx = (ev.clientX - x0) * (side === "in" ? 1 : -1); nd = Math.max(0.1, Math.min(c.end - c.start, dur + dx / state.pxPerSec)); b.style.width = `${nd * state.pxPerSec}px`; };
      const up = () => { b.removeEventListener("pointermove", mv); b.removeEventListener("pointerup", up); if (nd !== dur) edit("style", { id: c.id, set: { anim: { ...a, [key]: { ...a[key], sp: +(0.6 / nd).toFixed(3) } } } }); };
      b.addEventListener("pointermove", mv); b.addEventListener("pointerup", up);
    });
    box.append(b);
  }
}

function clipEl(c) {
  const narrow = (c.end - c.start) * state.pxPerSec < 26;
  const box = el("div", { className: `clip k-${c.kind}${narrow ? " narrow" : ""}${c.id === state.sel ? " sel" : ""}${state.picks.has(c.id) ? " pick" : ""}`, title: `${clipLabel(c)}\n${fmtTime(c.start)} → ${fmtTime(c.end)}` });
  box.dataset.id = c.id;
  box.style.left = `${c.start * state.pxPerSec}px`;
  box.style.width = `${Math.max(2, (c.end - c.start) * state.pxPerSec)}px`;
  if (c.kind === "video" || c.kind === "image") {
    box.style.backgroundImage = `url("/vn/thumb?du-an=${encodeURIComponent(state.project)}&path=${encodeURIComponent(c.src)}&t=${c.mediaStart.toFixed(2)}")`;
  }
  if (c.kind === "audio" || c.kind === "sfx") { drawWave(c, box); addFadeHandles(c, box); }
  box.append(el("span", { className: "lb", textContent: clipLabel(c) }), el("div", { className: "h l" }), el("div", { className: "h r" }));
  if (c.id === state.sel) for (const t of kfTimes(c.id)) box.append(kfMark(c, t));
  animBands(c, box);
  box.addEventListener("pointerdown", (e) => { if (e.button !== 2) clipDrag(e, c, box); });
  box.addEventListener("dblclick", () => { player()?.pause(); seek(c.start); });
  return box;
}

async function drawWave(c, box) {
  const key = c.src;
  if (!state.peaks.has(key)) {
    state.peaks.set(key, fetch(`/api/projects/${state.model.projectId}/peaks/${c.src}`).then((r) => r.json()).catch(() => null));
  }
  const d = await state.peaks.get(key);
  if (!d?.bins) return;
  const w = Math.min(8000, Math.max(2, (c.end - c.start) * state.pxPerSec)), h = 30;
  const cv = el("canvas", { width: w, height: h });
  const g = cv.getContext("2d");
  g.fillStyle = "#ffffff66";
  for (let x = 0; x < w; x++) {
    const t = c.mediaStart + (x / w) * (c.end - c.start);
    const v = d.bins[Math.floor(t / d.binSeconds)] || 0;
    const y = v * h;
    g.fillRect(x, (h - y) / 2, 1, Math.max(1, y));
  }
  box.prepend(cv);
}

// Kéo tới gần mép timeline thì timeline tự cuộn theo, không phải dừng lại cuộn tay.
function edgeScroll(onScroll) {
  const sc = $("#tracksScroll");
  let last = null, raf = 0;
  const tick = () => {
    if (last) {
      const r = sc.getBoundingClientRect(), zone = 56;
      let d = 0;
      if (last.clientX > r.right - zone) d = (last.clientX - (r.right - zone)) / zone;
      else if (last.clientX < r.left + zone) d = (last.clientX - (r.left + zone)) / zone;
      if (d) {
        const before = sc.scrollLeft;
        sc.scrollLeft += Math.max(-2.5, Math.min(2.5, d)) * 14;
        if (sc.scrollLeft !== before) onScroll(last);
      }
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return { track: (ev) => { last = ev; }, stop: () => cancelAnimationFrame(raf) };
}

function snapPoints(skip) {
  const pts = [state.time];
  for (const c of state.model.clips) if (c.id !== skip) pts.push(c.start, c.end);
  return pts;
}

function snapTo(value, pts) {
  if (!state.snap) return { value };
  const reach = 6 / state.pxPerSec;
  let best = null;
  for (const p of pts) if (Math.abs(p - value) < reach && (best === null || Math.abs(p - value) < Math.abs(best - value))) best = p;
  return best === null ? { value } : { value: best, line: best };
}

function clipDrag(e, c, box) {
  if (e.button !== 0) return;
  e.stopPropagation();
  if (e.shiftKey || e.ctrlKey) {
    if (state.sel && !state.picks.size) state.picks.add(state.sel);
    state.picks.has(c.id) ? state.picks.delete(c.id) : state.picks.add(c.id);
    state.sel = c.id;
    drawTimeline(); drawProps(); syncTools(); drawList();
    return;
  }
  if (!state.picks.has(c.id)) select(c.id);
  const group = state.picks.size > 1 ? [...state.picks] : null;
  const tip = $("#dragTip");
  const edge = e.target.classList.contains("l") ? "start" : e.target.classList.contains("r") ? "end" : null;
  const sx = e.clientX, pts = snapPoints(c.id);
  const line = $("#snapLine");
  let delta = 0, moved = false;
  box.setPointerCapture(e.pointerId);
  const sc0 = $("#tracksScroll").scrollLeft;
  const onMove = (ev) => {
    const raw = (ev.clientX - sx + $("#tracksScroll").scrollLeft - sc0) / state.pxPerSec;
    if (!moved && Math.abs(ev.clientX - sx) < 3) return;
    moved = true;
    let snap;
    if (edge === "start") { snap = snapTo(c.start + raw, pts); delta = snap.value - c.start; }
    else if (edge === "end") { snap = snapTo(c.end + raw, pts); delta = snap.value - c.end; }
    else {
      const a = snapTo(c.start + raw, pts), b = snapTo(c.end + raw, pts);
      if (a.line !== undefined) { snap = a; delta = a.value - c.start; }
      else if (b.line !== undefined) { snap = b; delta = b.value - c.end; }
      else { snap = a; delta = raw; }
    }
    line.hidden = snap.line === undefined;
    if (snap.line !== undefined) line.style.left = `${snap.line * state.pxPerSec}px`;
    const s = edge === "end" ? c.start : c.start + delta;
    const en = edge === "start" ? c.end : c.end + delta;
    box.style.left = `${Math.max(0, s) * state.pxPerSec}px`;
    box.style.width = `${Math.max(2, (en - s) * state.pxPerSec)}px`;
    if (group) for (const id of group) {
      const other = document.querySelector(`.clip[data-id="${CSS.escape(id)}"]`), oc = clipOf(id);
      if (other && other !== box) other.style.left = `${Math.max(0, oc.start + delta) * state.pxPerSec}px`;
    }
    tip.hidden = false;
    tip.style.left = `${Math.max(0, s) * state.pxPerSec}px`;
    tip.textContent = `${fmtTime(Math.max(0, s))} → ${fmtTime(en)} · ${(en - s).toFixed(2)} giây`;
  };
  const onUp = () => {
    auto.stop();
    box.removeEventListener("pointermove", onPointer);
    box.removeEventListener("pointerup", onUp);
    line.hidden = true;
    tip.hidden = true;
    if (!moved || Math.abs(delta) < 0.001) return;
    if (group && !edge) return edit("batch", { items: group.map((id) => ({ op: "move", body: { id, delta } })) });
    if (edge) edit("trim", { id: c.id, edge, delta });
    else edit("move", { id: c.id, delta });
  };
  const auto = edgeScroll(onMove);
  const onPointer = (ev) => { auto.track(ev); onMove(ev); };
  box.addEventListener("pointermove", onPointer);
  box.addEventListener("pointerup", onUp);
}

$("#ruler").addEventListener("pointerdown", (e) => {
  if (e.shiftKey || state.rangeMode) return rangeDrag(e);
  const at = (ev) => {
    const r = $("#ruler").getBoundingClientRect();
    seek((ev.clientX - r.left) / state.pxPerSec);
  };
  player()?.pause();
  at(e);
  const ruler = $("#ruler");
  ruler.setPointerCapture(e.pointerId);
  const auto = edgeScroll(at);
  const move = (ev) => { auto.track(ev); at(ev); };
  ruler.addEventListener("pointermove", move);
  ruler.addEventListener("pointerup", () => { auto.stop(); ruler.removeEventListener("pointermove", move); }, { once: true });
});
$("#rows").addEventListener("pointerdown", (e) => {
  if (e.target.closest(".clip")) return;
  const r = $("#ruler").getBoundingClientRect();
  select(null);
  player()?.pause();
  seek((e.clientX - r.left) / state.pxPerSec);
});

// ---- Chọn vùng cho AI ----
function rangeDrag(e) {
  const t = (ev) => Math.max(0, Math.min(state.model.duration, (ev.clientX - $("#ruler").getBoundingClientRect().left) / state.pxPerSec));
  const a = t(e);
  state.range = [a, a];
  const ruler = $("#ruler");
  ruler.setPointerCapture(e.pointerId);
  const update = (ev) => { state.range = [a, t(ev)].sort((x, y) => x - y); drawRange(); };
  const auto = edgeScroll(update);
  const move = (ev) => { auto.track(ev); update(ev); };
  ruler.addEventListener("pointermove", move);
  ruler.addEventListener("pointerup", () => {
    auto.stop();
    ruler.removeEventListener("pointermove", move);
    if (state.range[1] - state.range[0] < 0.05) state.range = null;
    else { player()?.pause(); seek(state.range[0]); }
    drawRange();
  }, { once: true });
}

function drawRange() {
  const box = $("#rangeBox");
  box.hidden = !state.range;
  if (state.range) { box.style.left = `${state.range[0] * state.pxPerSec}px`; box.style.width = `${(state.range[1] - state.range[0]) * state.pxPerSec}px`; }
  drawAiCtx();
}

function aiShots() {
  if (!state.shoot) return [];
  if (state.range) { const [a, b] = state.range; return [a + 0.02, (a + b) / 2, Math.max(a, b - 0.04)]; }
  return [state.time];
}

function drawAiCtx() {
  const host = $("#aiCtx");
  if (!host || !state.model) return;
  const c = clipOf(state.sel);
  const shoot = el("input", { type: "checkbox", checked: state.shoot });
  shoot.onchange = () => { state.shoot = shoot.checked; drawAiCtx(); };
  const chips = [el("label", { title: "Chụp đúng khung hình như bản xuất rồi gửi kèm AI" }, shoot, `📷 Chụp kèm ${state.shoot ? aiShots().length + " khung" : ""}`)];
  if (state.range) {
    const x = el("button", { textContent: "×", title: "Bỏ chọn vùng" });
    x.setAttribute("aria-label", "Bỏ chọn vùng");
    x.onclick = () => { state.range = null; drawRange(); };
    chips.push(el("span", { className: "chip" }, `Đoạn ${fmtTime(state.range[0])} → ${fmtTime(state.range[1])}`, x));
  } else chips.push(el("span", { className: "chip" }, `Tại ${fmtTime(state.time)}`));
  if (c) chips.push(el("span", { className: "chip" }, `${KIND_NAME[c.kind]}: ${clipLabel(c).slice(0, 28)}`));
  host.replaceChildren(...chips);
}

function drawHead(follow) {
  $("#playhead").style.left = `${state.time * state.pxPerSec}px`;
  if (!state.range && !state.playing) drawAiCtx();
  $("#clock").textContent = `${fmtTime(state.time)} / ${fmtTime(state.model.duration)}`;
  if (follow) {
    const sc = $("#tracksScroll"), x = state.time * state.pxPerSec;
    if (x > sc.scrollLeft + sc.clientWidth - 40 || x < sc.scrollLeft) sc.scrollLeft = x - 40;
  }
}

function setZoom(px) {
  const sc = $("#tracksScroll");
  const center = (sc.scrollLeft + sc.clientWidth / 2) / state.pxPerSec;
  state.pxPerSec = Math.max(1, Math.min(300, px));
  $("#zoom").value = state.pxPerSec;
  drawTimeline();
  sc.scrollLeft = center * state.pxPerSec - sc.clientWidth / 2;
}

function fitZoom() {
  const w = $("#tracksScroll").clientWidth - 16;
  setZoom(w / Math.max(1, state.model.duration));
  $("#tracksScroll").scrollLeft = 0;
}

// ---- Thuộc tính ----
function select(id) {
  state.sel = id;
  state.picks.clear();
  for (const b of document.querySelectorAll(".clip")) { b.classList.remove("pick"); b.classList.toggle("sel", b.dataset.id === id); }
  // Kim cương keyframe chỉ hiện trên clip đang chọn.
  for (const m of document.querySelectorAll(".clip i.kf")) m.remove();
  const picked = clipOf(id), box = id && document.querySelector(`#rows .clip[data-id="${id}"]`);
  if (picked && box) for (const t of kfTimes(id)) box.append(kfMark(picked, t));
  drawList();
  drawProps();
  drawSel();
  syncTools();
  drawAiCtx();
  if ($("#tab-sfx").classList.contains("on")) drawSfx();
}

function syncTools() {
  const c = clipOf(state.sel);
  $("#split").disabled = !!c && !c.timed;
  $("#split").title = c && !c.timed ? "Clip chạy theo hiệu ứng: hãy kéo mép để rút ngắn" : "Tách đoạn tại playhead (S hoặc Ctrl+B). Không chọn gì thì tách cảnh video đang phát";
  $("#dup").disabled = !c;
  $("#del").disabled = !c;
  $("#trimIn").disabled = !c;
  $("#trimOut").disabled = !c;
  $("#zoomSel").disabled = !c;
}

const KIND_NAME = { grade: "Lớp màu", sfx: "SFX", video: "Video", image: "Ảnh", audio: "Âm thanh", sub: "Phụ đề", text: "Chữ", graphic: "Đồ họa", fx: "Hiệu ứng" };

function field(label, control) { return el("div", { className: "field" }, el("label", { textContent: label }), control); }

function numInput(value, onChange, props = {}) {
  const i = el("input", { type: "number", value: value ?? "", step: "any", ...props });
  i.onchange = () => { if (i.value !== "") onChange(+i.value); else onChange(null); };
  return i;
}

// Thanh chỉnh nhanh: các thông số chính của clip đang chọn, ngay trên timeline.
function drawClipBar() {
  const bar = $("#clipBar"), c = clipOf(state.sel);
  bar.hidden = !c;
  if (!c) { bar.replaceChildren(); return; }
  const o = state.model.overrides[c.id] || {};
  const num = (label, val, step, onSet, min = 0) => { const n = el("input", { type: "number", step, min, value: +(+val).toFixed(3) }); n.onchange = () => onSet(+n.value); return el("label", {}, label, n); };
  const items = [el("b", { textContent: clipLabel(c), title: c.id })];
  items.push(num("Lúc", c.start, 0.01, (v) => edit("move", { id: c.id, delta: v - c.start })), num("Dài", c.end - c.start, 0.01, (v) => edit("trim", { id: c.id, edge: "end", delta: c.start + v - c.end }), 0.05));
  const isAudio = c.kind === "audio" || c.kind === "sfx";
  if (c.segments.length === 1) {
    const raw = c.segments[0].text;
    const t = el("input", { type: "text", value: raw.replaceAll("**", "") });
    t.setAttribute("aria-label", "Nội dung chữ");
    // Giữ nguyên các từ đang tô màu nếu chúng còn trong câu mới.
    t.onchange = () => {
      let next = t.value;
      for (const m of raw.matchAll(/\*\*([^*]+)\*\*/g)) next = next.replace(m[1], `**${m[1]}**`);
      edit("text", { id: c.id, index: 0, text: next });
    };
    items.push(t);
  }
  if (c.segments.length) {
    const col = el("input", { type: "color", value: /^#[0-9a-f]{6}$/i.test(o.color || "") ? o.color : "#ffffff", title: "Màu chữ" });
    col.setAttribute("aria-label", "Màu chữ");
    col.onchange = () => edit("style", { id: c.id, set: { color: col.value } });
    const textNode = layerNodes(c).find((n) => n.textContent.trim() && !n.children.length) || state.frame?.contentDocument?.getElementById(c.id);
    const size = textNode ? parseFloat(state.frame.contentWindow.getComputedStyle(textNode).fontSize) : 0;
    items.push(col, num("Cỡ", o.fontSize ?? Math.round(size), 1, (v) => edit("style", { id: c.id, set: { fontSize: v || null } })));
  }
  if (!isAudio && c.kind !== "fx" && c.kind !== "grade") items.push(num("Rõ", kfValue(c.id, "opacity", o.opacity ?? 1), 0.05, (v) => setOrKey(c.id, { opacity: v }, () => edit("style", { id: c.id, set: { opacity: v === 1 ? null : v } }))), num("Cỡ %", kfValue(c.id, "scale", o.scale ?? 1) * 100, 1, (v) => setOrKey(c.id, { scale: v / 100 }, () => edit("style", { id: c.id, set: { scale: v === 100 ? null : v / 100 } }))));
  if (isAudio || c.tag === "video") {
    items.push(num("Âm lượng", gainToPct(kfValue(c.id, "volume", c.volume ?? 1)), 1, (v) => setOrKey(c.id, { volume: pctToGain(v) }, () => edit("attrs", { id: c.id, volume: pctToGain(v) }))));
    items.push(num("Vào", c.fadeIn, 0.1, (v) => edit("attrs", { id: c.id, fadeIn: v })), num("Ra", c.fadeOut, 0.1, (v) => edit("attrs", { id: c.id, fadeOut: v })));
    const sp = el("select", { title: "Tốc độ" });
    sp.setAttribute("aria-label", "Tốc độ");
    for (const r of [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3]) sp.append(el("option", { value: r, textContent: `${r}x`, selected: r === c.rate }));
    sp.onchange = () => edit("attrs", { id: c.id, rate: +sp.value });
    items.push(sp);
  }
  if (c.tag === "video") { const m = el("input", { type: "checkbox", checked: c.muted }); m.onchange = () => edit("attrs", { id: c.id, muted: m.checked }); items.push(el("label", {}, m, "Tắt tiếng")); }
  bar.replaceChildren(...items);
}

function drawProps() {
  drawClipBar();
  const host = $("#props");
  const c = clipOf(state.sel);
  if (!c && state.layer) { host.replaceChildren(el("div", { className: "inspHead" }, el("b", { textContent: "Lớp" }), el("small", { textContent: state.layer })), ...tabDesign(state.layer, null)); return; }
  if (!c) {
    const m = state.model;
    host.replaceChildren(
      el("h3", { className: "propsEmpty", textContent: m?.project || "" }),
      el("p", { className: "hint", textContent: m ? `${m.width}×${m.height} · ${m.fps} khung/giây · ${fmtTime(m.duration)}` : "" }),
      el("p", { className: "hint", textContent: "Bấm một clip trên timeline hoặc trong khung xem để sửa. Kéo thân để dời, kéo mép để rút ngắn, kéo trên khung xem để đổi vị trí." }),
    );
    return;
  }
  const nodes = [el("div", { className: "inspHead" }, el("b", { textContent: KIND_NAME[c.kind] }), el("small", { textContent: c.id }))];
  if (state.picks.size > 1) nodes.push(el("p", { className: "hint", textContent: `Đang chọn ${state.picks.size} clip: kéo một cái để dời cả nhóm, Delete để xóa cả nhóm.` }));
  const fromHere = el("button", { textContent: "▶ Từ đây", title: "Phát từ trước clip 1 giây" });
  fromHere.onclick = () => { state.stopAt = null; seek(Math.max(0, c.start - 1)); player()?.play(); };
  const onlyThis = el("button", { textContent: "Xem clip", title: "Phát đúng đoạn của clip rồi dừng" });
  onlyThis.onclick = () => { seek(c.start); state.stopAt = c.end; player()?.play(); };
  nodes.push(el("div", { className: "view-row" }, fromHere, onlyThis, ...(c.kind !== "audio" && c.kind !== "sfx" ? [compareButton(c)] : [])));
  nodes.push(...inspector(c));
  $("#props").replaceChildren(...nodes);
}

// ---- Yêu thích ----
const isFav = (loai, id) => !!state.fav?.[loai]?.includes(id);
function starBtn(loai, id, name, after) {
  const b = el("button", { className: `star${isFav(loai, id) ? " on" : ""}`, textContent: isFav(loai, id) ? "★" : "☆", title: isFav(loai, id) ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích" });
  b.setAttribute("aria-label", `Yêu thích ${name}`);
  b.setAttribute("aria-pressed", String(isFav(loai, id)));
  b.onclick = async (e) => {
    e.stopPropagation();
    try {
      state.fav = await fetch("/vn/yeu-thich", { method: "POST", body: JSON.stringify({ loai, id, bat: !isFav(loai, id) }) }).then((r) => r.json());
      after?.();
    } catch { toast("Chưa lưu được yêu thích", true); }
  };
  return b;
}

// ---- Chọn font: gõ tên hoặc cuộn, bấm một lần là áp ----
const plain = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();
const loadedFonts = new Set();
const fontFace = (f) => "hdf_" + f.id.replace(/[^\w]/g, "_");
const fontWatch = new IntersectionObserver((list) => {
  for (const e of list) {
    if (!e.isIntersecting) continue;
    fontWatch.unobserve(e.target);
    const f = e.target._font;
    if (loadedFonts.has(f.id)) continue;
    loadedFonts.add(f.id);
    new FontFace(fontFace(f), `url("/vn/font-file?id=${encodeURIComponent(f.id)}")`).load().then((face) => document.fonts.add(face)).catch(() => {});
  }
}, { rootMargin: "150px" });

// ---- Icon minh họa (bản đồ): đổi hình, màu nền, cỡ; ghim: đổi màu ----
const ICONS = {
  school: ["Trường học", "M12 3 1 9l11 6 9-4.9V17h2V9L12 3zm-7 9.2v4L12 20l7-3.8v-4L12 16l-7-3.8z"],
  hospital: ["Bệnh viện", "M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"],
  pharmacy: ["Nhà thuốc", "M21 5h-2.64l1.14-3.14L17.15 1l-1.46 4H3v2l2 6-2 6v2h18v-2l-2-6 2-6V5zm-5 9h-3v3h-2v-3H8v-2h3V9h2v3h3v2z"],
  cart: ["Chợ, siêu thị", "M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"],
  mall: ["Trung tâm mua sắm", "M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"],
  park: ["Công viên", "M17 12h2L12 2 5.05 12H7l-3.9 6h6.92v4h3.96v-4H21z"],
  cafe: ["Cà phê", "M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"],
  food: ["Nhà hàng", "M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"],
  bus: ["Bến xe buýt", "M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"],
  bank: ["Ngân hàng", "M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"],
  gym: ["Thể thao", "M20.57 14.86 22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"],
  home: ["Nhà ở", "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"],
  plane: ["Sân bay", "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"],
  star: ["Điểm nổi bật", "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"],
};
const ICON_BG = { school: "#1a73e8", hospital: "#d93025", pharmacy: "#d93025", cart: "#188038", mall: "#e8710a", park: "#188038", cafe: "#8d6e63", food: "#e8710a", bus: "#1a73e8", bank: "#5f6368", gym: "#9334e6", home: "#ea4335", plane: "#1a73e8", star: "#f2a600" };

function iconPanel(c) {
  const out = [el("h4", { textContent: `Icon minh họa (${c.icons.length})` })];
  for (const ic of c.icons) {
    const ov = state.model.overrides[ic.id] || {};
    const card = el("div", { className: "iconCard" });
    if (ic.kind === "pin") {
      card.append(el("span", { className: "cf-lbl", textContent: "Ghim vị trí" }), colorField("Màu ghim", ov.pinColor || "", (v) => edit("style", { id: ic.id, set: { pinColor: v } })));
    } else {
      card.append(el("span", { className: "cf-lbl", textContent: `${ICONS[ic.name]?.[0] || ic.name} · ${ic.id}` }));
      const grid = el("div", { className: "icons" }, ...Object.entries(ICONS).map(([name, [label, d]]) => {
        const b = el("button", { title: label, className: name === ic.name ? "on" : "" });
        b.setAttribute("aria-label", label);
        b.style.background = ICON_BG[name];
        b.innerHTML = `<svg viewBox="0 0 24 24"><path fill="#fff" d="${d}"/></svg>`;
        b.onclick = () => edit("icon", { id: ic.id, name, path: d, bg: ICON_BG[name] });
        return b;
      }));
      card.append(grid, colorField("Màu nền icon", "", (v) => v && edit("icon", { id: ic.id, name: ic.name, path: (ICONS[ic.name] || ICONS.star)[1], bg: v }), { dots: true }));
      const sc = el("input", { type: "range", min: 0.5, max: 2.5, step: 0.05, value: ov.iconScale ?? 1 });
      sc.setAttribute("aria-label", "Cỡ icon");
      sc.onchange = () => edit("style", { id: ic.id, set: { iconScale: +sc.value === 1 ? null : +sc.value } });
      card.append(el("span", { className: "cf-lbl", textContent: "Cỡ icon" }), el("div", { className: "sizeRow" }, sc));
    }
    out.push(card);
  }
  return out;
}

// ---- Ô màu dùng chung: ô màu + mã hex, 12 chấm màu nhanh ----
const QUICK_BASE = ["#FFFFFF", "#000000", "#FFD36B", "#F2C14E", "#E39B52", "#EA3F40", "#FF5FA2", "#A35DD6", "#201FF0", "#3C9EE8", "#3FBF7F", "#FAE7A7"];
const quickColors = () => [...new Set([...state.model.vars.filter((x) => /^#[0-9a-f]{6}$/i.test(x.value)).map((x) => x.value.toUpperCase()), ...QUICK_BASE])].slice(0, 12);

function colorField(label, value, onPick, { dots = true, live } = {}) {
  const cur = (value || "").toUpperCase();
  const sw = el("label", { className: "cf-sw", title: "Chọn màu bất kỳ" });
  sw.style.background = cur || "repeating-conic-gradient(#444 0 25%, #222 0 50%) 50% / 10px 10px";
  const pick = el("input", { type: "color", value: /^#[0-9a-f]{6}$/i.test(cur) ? cur : "#ffffff" });
  pick.setAttribute("aria-label", label);
  sw.append(pick);
  const hex = el("input", { type: "text", value: cur, placeholder: "Theo mẫu", maxLength: 7, spellcheck: false });
  hex.setAttribute("aria-label", `${label}, mã hex`);
  const go = (v) => {
    v = (v || "").trim();
    if (!v) return onPick(null);
    if (!v.startsWith("#")) v = "#" + v;
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return toast("Mã màu cần dạng #RRGGBB, ví dụ #FFD36B", true);
    if (v.toUpperCase() !== cur) onPick(v.toUpperCase());
  };
  pick.oninput = () => { sw.style.background = pick.value; hex.value = pick.value.toUpperCase(); live?.(pick.value); };
  hex.oninput = () => {
    let v = hex.value.trim();
    if (v && !v.startsWith("#")) v = "#" + v;
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) { sw.style.background = v; live?.(v); }
  };
  pick.onchange = () => go(pick.value);
  hex.onkeydown = (e) => { if (e.key === "Enter") go(hex.value); };
  hex.onchange = () => go(hex.value);
  const row = el("div", { className: "cf-row" }, sw, hex);
  if (cur) { const x = el("button", { className: "cf-x", textContent: "×", title: "Về màu theo mẫu" }); x.setAttribute("aria-label", "Bỏ màu"); x.onclick = () => onPick(null); row.append(x); }
  const box = el("div", { className: "cf" }, el("span", { className: "cf-lbl", textContent: label }), row);
  if (dots) box.append(el("div", { className: "cf-dots" }, ...quickColors().map((h) => {
    const b = el("button", { title: h, className: h === cur ? "on" : "" });
    b.style.background = h;
    b.setAttribute("aria-label", `Màu ${h}`);
    b.onclick = () => go(h);
    b.onmouseenter = () => live?.(h);
    b.onmouseleave = () => live?.(null);
    return b;
  })));
  return box;
}

// ---- Lớp chữ: sửa nội dung, bấm từ để tô màu nhấn, màu và font riêng từng lớp ----
const splitRich = (t) => t.split("**").flatMap((part, i) => part.split(/(\s+)/).filter((w) => w !== "").map((w) => ({ w, hi: i % 2 === 1 && /\S/.test(w) })));
function joinRich(words) {
  let out = "", open = false;
  for (const x of words) {
    const space = !/\S/.test(x.w);
    if (!space && x.hi && !open) { out += "**"; open = true; }
    if (!space && !x.hi && open) { out = out.replace(/(\s*)$/, "**$1"); open = false; }
    out += x.w;
  }
  return open ? out.replace(/(\s*)$/, "**$1") : out;
}
const wordKey = (w) => plain(w.replace(/[.,!?:;]+$/, ""));

// Bấm chọn một hay nhiều từ, rồi tô màu đúng đoạn đó.
function wordPicker(c, sg, index) {
  const key = `${c.id}|${index}`;
  state.wordSel ??= {};
  const sel = (state.wordSel[key] ??= new Set());
  const toks = sg.tokens;
  const chips = el("div", { className: "words" });
  toks.forEach((t, i) => {
    if (!/\S/.test(t.w)) return;
    const b = el("button", { textContent: t.w, className: sel.has(i) ? "sel" : "", title: "Bấm để chọn từ này" });
    if (t.c) b.style.color = t.c;
    if (t.hi) b.style.fontWeight = 800;
    b.setAttribute("aria-pressed", String(sel.has(i)));
    b.onclick = () => { sel.has(i) ? sel.delete(i) : sel.add(i); drawProps(); };
    chips.append(b);
  });
  const save = (fn) => { const tokens = toks.map((t, i) => (sel.has(i) ? fn(t) : t)); clearWordLive(); edit("setWords", { id: c.id, index, tokens }); };
  const words = toks.map((t, i) => [t, i]).filter(([t]) => /\S/.test(t.w));
  const tools = el("div", { className: "wordTools" });
  const all = el("button", { textContent: "Chọn hết" });
  all.onclick = () => { words.forEach(([, i]) => sel.add(i)); drawProps(); };
  tools.append(all);
  const out = [el("small", { className: "hint", textContent: "Bấm từ cần đổi màu, có thể chọn nhiều từ" }), chips, tools];
  if (sel.size) {
    const none = el("button", { textContent: "Bỏ chọn" });
    none.onclick = () => { sel.clear(); clearWordLive(); drawProps(); };
    const clear = el("button", { textContent: "Bỏ màu riêng" });
    clear.onclick = () => save((t) => ({ ...t, c: null }));
    tools.append(none, clear);
    if (sg.kind === "rich") { const hi = el("button", { textContent: "Đậm nhấn", title: "Bật hoặc tắt kiểu nhấn của đoạn đang chọn" }); const on = [...sel].some((i) => toks[i]?.hi); hi.onclick = () => save((t) => ({ ...t, hi: !on })); tools.append(hi); }
    const first = toks[[...sel][0]];
    out.push(colorField(`Màu đoạn đã chọn (${sel.size} từ)`, first?.c || "", (v) => save((t) => ({ ...t, c: v })), { live: (v) => (v ? previewWords(c, sg, sel, v) : clearWordLive()) }));
  }
  return out;
}

// Xem trước màu từng từ bằng Highlight API, không đụng vào nội dung đang chạy hiệu ứng.
function previewWords(c, sg, sel, color) {
  const win = state.frame?.contentWindow, doc = state.frame?.contentDocument;
  if (!win?.CSS?.highlights || !win.Highlight) return;
  showClip(c);
  const root = doc.getElementById(sg.layer || c.id);
  if (!root) return;
  const nodes = [], w = doc.createTreeWalker(root, win.NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode()); ) nodes.push(n);
  const locate = (at) => { let sum = 0; for (const n of nodes) { if (at <= sum + n.nodeValue.length) return [n, at - sum]; sum += n.nodeValue.length; } return null; };
  const ranges = [];
  let pos = 0;
  sg.tokens.forEach((t, i) => {
    const len = t.w.includes("\n") ? 0 : [...t.w].length;
    if (sel.has(i) && /\S/.test(t.w)) {
      const a = locate(pos), b = locate(pos + t.w.length);
      if (a && b) { const r = doc.createRange(); r.setStart(a[0], a[1]); r.setEnd(b[0], b[1]); ranges.push(r); }
    }
    pos += t.w.includes("\n") ? 0 : t.w.length;
    void len;
  });
  win.CSS.highlights.set("hd-word", new win.Highlight(...ranges));
  let st = doc.getElementById("hd-word-css");
  if (!st) { st = doc.createElement("style"); st.id = "hd-word-css"; doc.head.append(st); }
  st.textContent = `::highlight(hd-word){color:${color}!important}`;
}
function clearWordLive() { state.frame?.contentWindow?.CSS?.highlights?.delete("hd-word"); }

function layerCard(c, sg, index) {
  const lo = (sg.layer && state.model.overrides[sg.layer]) || {};
  const segSet = (set) => edit("segStyle", { id: c.id, index, set });
  const words = splitRich(sg.text);
  const plainText = words.map((x) => x.w).join("");
  const card = el("div", { className: "layer" });
  if (lo.hidden) card.classList.add("off");
  const del = el("button", { textContent: lo.hidden ? "Hiện lại" : "Xóa", title: lo.hidden ? "Hiện lại lớp chữ này" : "Xóa lớp chữ này (khôi phục được)" });
  del.onclick = () => segSet({ hidden: lo.hidden ? null : true });
  const back = el("button", { textContent: "↺ Khôi phục", title: "Trả lớp chữ về như bản AI dựng gốc" });
  back.onclick = () => edit("restoreSeg", { id: c.id, index });
  card.append(el("h5", {}, el("span", { textContent: c.segments.length > 1 ? `Lớp ${index + 1}${lo.hidden ? " · đã xóa" : ""}` : (lo.hidden ? "Chữ · đã xóa" : "Chữ") }), el("span", { className: "acts" }, del, back)));
  const multi = plainText.includes("\n");
  const input = el(multi ? "textarea" : "input", { type: "text", value: plainText, disabled: !!sg.auto });
  if (sg.auto) card.append(el("small", { className: "hint", textContent: "Số chạy tự động bằng hiệu ứng: muốn đổi số, nhờ AI sửa." }));
  input.setAttribute("aria-label", `Nội dung lớp ${index + 1}`);
  input.onchange = () => {
    // Giữ nhấn và màu riêng cho những từ vẫn còn trong câu mới.
    const old = new Map(sg.tokens.filter((x) => /\S/.test(x.w)).map((x) => [wordKey(x.w), x]));
    const tokens = input.value.split(/(\s+)/).filter((w) => w !== "").map((w) => { const o = old.get(wordKey(w)); return { w, hi: !!o?.hi && /\S/.test(w), c: /\S/.test(w) ? o?.c || null : null }; });
    edit("setWords", { id: c.id, index, tokens });
  };
  card.append(input);
  if (!sg.auto) card.append(...wordPicker(c, sg, index));
  return card;
}

// ---- Bảng kiểu chữ (giống CapCut): màu, cỡ, B/U/I, hoa thường, giãn chữ, căn lề, font ----
const QUICK_COLORS = ["#FFFFFF", "#000000", "#FFD36B", "#F2C14E", "#E39B52", "#EA3F40", "#FF5FA2", "#A35DD6", "#201FF0", "#3C9EE8", "#3FBF7F", "#FAE7A7"];

function liveNodes(c) {
  const doc = state.frame?.contentDocument;
  const n = doc?.getElementById(c.id);
  return n ? [n, ...n.querySelectorAll("*")] : [];
}

// Lớp đang chỉnh: null là cả clip.
function activeLayer(c) {
  const i = state.layerIdx?.[c.id];
  return i !== undefined && i !== null && c.segments[i] ? i : null;
}
function layerStyle(c) {
  const i = activeLayer(c);
  return (i === null ? state.model.overrides[c.id] : state.model.overrides[c.segments[i].layer]) || {};
}
function layerEl(c) {
  const i = activeLayer(c);
  const id = i === null ? c.id : c.segments[i].layer;
  if (id) return state.frame?.contentDocument?.getElementById(id) || null;
  return null;
}

// Playhead ngoài clip thì sửa xong không thấy gì: đưa về trong clip.
function showClip(c) {
  if (state.time < c.start || state.time >= c.end) { player()?.pause(); seek(Math.min(c.end - 0.01, c.start + Math.min(0.6, (c.end - c.start) / 2))); }
}

function setLayer(c, patch) {
  const i = activeLayer(c);
  showClip(c);
  if (["x", "y", "scale", "rotate"].some((k) => k in patch)) {
    const n = layerEl(c);
    const inline = !n || state.frame.contentWindow.getComputedStyle(n).display === "inline";
    if (inline && i !== null) patch = { ...patch, inl: true };
  }
  return i === null ? edit("style", { id: c.id, set: patch }) : edit("segStyle", { id: c.id, index: i, set: patch });
}
function layerNodes(c) {
  const i = activeLayer(c);
  const id = i === null ? c.id : c.segments[i].layer;
  const n = id && state.frame?.contentDocument?.getElementById(id);
  return n ? [n, ...n.querySelectorAll("*")] : liveNodes(c);
}

// Hàng thanh kéo + ô số.
function sliderRow(label, value, min, max, step, onSet, live) {
  const r = el("input", { type: "range", min, max, step, value });
  const n = el("input", { type: "number", min, max, step, value });
  r.setAttribute("aria-label", label); n.setAttribute("aria-label", `${label}, số`);
  r.oninput = () => { n.value = r.value; live?.(+r.value); };
  r.onchange = n.onchange = (e) => onSet(+e.target.value);
  return el("div", { className: "pr" }, el("label", { textContent: label }), r, n);
}
function pillRow(label, opts, cur, onSet) {
  return el("div", { className: "pr2" }, el("label", { textContent: label }), el("div", { className: "pill" }, ...opts.map(([v, t, title]) => {
    const b = el("button", { textContent: t, title: title || t, className: v === cur ? "on" : "" });
    b.setAttribute("aria-pressed", String(v === cur));
    b.onclick = () => onSet(v === cur ? null : v);
    return b;
  })));
}
function selectRow(label, opts, cur, onSet) {
  const sel = el("select");
  sel.setAttribute("aria-label", label);
  for (const [v, t] of opts) sel.append(el("option", { value: v, textContent: t, selected: v === cur }));
  sel.onchange = () => onSet(sel.value);
  return el("div", { className: "pr2" }, el("label", { textContent: label }), sel);
}
function checkRow(label, on, onSet) {
  const i = el("input", { type: "checkbox", checked: !!on });
  i.onchange = () => onSet(i.checked);
  return el("label", { className: "chk" }, i, label);
}
function accordion(key, label, on, body, openByDefault = false) {
  state.accOpen ??= {};
  const open = state.accOpen[key] ?? openByDefault;
  const b = el("button", { className: `acc${open ? " open" : ""}` }, el("span", { className: "chev", textContent: open ? "▾" : "▸" }), el("span", { textContent: label }), ...(on ? [el("i")] : []));
  b.setAttribute("aria-expanded", String(open));
  b.onclick = () => { state.accOpen[key] = !open; drawProps(); };
  return open ? [b, el("div", { className: "accBody" }, ...body())] : [b];
}

// Danh mục lớn theo loại clip, mỗi danh mục gồm các mục gập.
function inspector(c) {
  const hasText = c.segments.length > 0;
  const isAudio = c.kind === "audio" || c.kind === "sfx";
  const list = hasText
    ? [["text", "Chữ"], ["anim", "Chuyển động"], ["fx", "Hiệu ứng"], ...(c.icons?.length ? [["icon", "Icon"]] : []), ["info", "Thông tin"], ["save", "Lưu"]]
    : c.kind === "grade" ? [["color", "Màu"], ["info", "Thông tin"]]
    : isAudio ? [["audio", "Âm thanh"], ["info", "Thông tin"]]
    : [["video", c.tag === "video" ? "Video" : "Hình"], ...(c.tag === "video" ? [["color", "Màu"], ["audio", "Âm thanh"]] : []), ...(c.icons?.length ? [["icon", "Icon"]] : []), ["info", "Thông tin"]];
  if (!isAudio && c.kind !== "grade") list.splice(1, 0, ["design", "Thiết kế"]);
  const tab = list.some(([k]) => k === state.txtTab) ? state.txtTab : list[0][0];
  const out = [el("div", { className: "ptabs" }, ...list.map(([k, t]) => { const b = el("button", { textContent: t, className: k === tab ? "on" : "" }); b.onclick = () => { state.txtTab = k; drawProps(); }; return b; }))];
  // Chọn lớp nằm trên cùng, áp cho mọi danh mục chữ.
  if (c.segments.length > 1 && ["text", "anim", "fx", "save"].includes(tab)) {
    const idx = activeLayer(c);
    const sel = el("select");
    sel.setAttribute("aria-label", "Lớp chữ đang chỉnh");
    sel.append(el("option", { value: "", textContent: `Tất cả lớp (${c.segments.length})`, selected: idx === null }));
    c.segments.forEach((sg, i) => sel.append(el("option", { value: i, textContent: `Lớp ${i + 1}: ${sg.text.replace(/\*\*/g, "").slice(0, 26)}`, selected: idx === i })));
    sel.onchange = async () => {
      const i = sel.value === "" ? null : +sel.value;
      (state.layerIdx ??= {})[c.id] = i;
      state.fontScope = null;
      if (i !== null && !c.segments[i].layer) await edit("segStyle", { id: c.id, index: i, set: {} });
      drawProps();
    };
    out.push(el("div", { className: "pr2 layerSel" }, el("label", { textContent: "Lớp chữ" }), sel));
  }
  const o = layerStyle(c);
  const set = (p) => setLayer(c, p);
  set.live = (p) => previewLayer(c, p);
  set.clear = clearLive;
  if (tab === "design") out.push(...tabDesign(c.id, c));
  if (tab === "text") out.push(...tabControls(c, o, set), ...accordion("t-frame", "Khung viền chữ", !!state.model.overrides[c.id]?.frame?.on, () => frameRows(c)));
  if (tab === "anim") out.push(...tabAnim(c, o, set));
  if (tab === "fx") out.push(...tabFx(o, set));
  if (tab === "icon") out.push(...iconPanel(c));
  if (tab === "video") out.push(...tabVideo(c));
  if (tab === "color") out.push(...tabColor(c));
  if (tab === "audio") out.push(...tabAudio(c));
  if (tab === "info") out.push(...tabInfo(c, o));
  if (tab === "save") out.push(...tabSave(c, o, set));
  return out;
}

function biuRow(c, o, set) {
  const n = layerNodes(c).find((x) => x.textContent.trim() && !x.children.length);
  const cs = n ? state.frame.contentWindow.getComputedStyle(n) : null;
  const bold = o.bold ?? (cs ? +cs.fontWeight >= 600 : false);
  const ital = o.italic ?? (cs ? cs.fontStyle === "italic" : false);
  const btn = (t, title, on, click) => { const b = el("button", { textContent: t, title, className: on ? "on" : "" }); b.setAttribute("aria-pressed", String(on)); b.onclick = click; return b; };
  return el("div", { className: "pr2" }, el("label", { textContent: "Đậm / nghiêng" }), el("div", { className: "pill" },
    btn("B", "Chữ đậm", bold, () => set({ bold: !bold })),
    btn("I", "Chữ nghiêng", ital, () => set({ italic: !ital })),
    btn("U", "Gạch chân", !!o.underline, () => set({ underline: o.underline ? null : true }))));
}

// ---- Keyframe kiểu CapCut ----
const KF_DEFAULT = { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 };
const KF_EASE = [["none", "Tuyến tính", null], ["in", "Chậm rồi nhanh", [0.42, 0, 1, 1]], ["out", "Nhanh rồi chậm", [0, 0, 0.58, 1]], ["inout", "Chậm hai đầu", [0.42, 0, 0.58, 1]], ["nay", "Vượt rồi về", [0.34, 1.56, 0.64, 1]], ["giu", "Giữ, nhảy tới điểm sau", "hold"]];
const kfOf = (id) => state.model?.overrides?.[id]?.kf || {};
const kfLocal = (c) => +(state.time - c.start).toFixed(3);
const kfNear = (a, b) => Math.abs(a - b) < 0.02;
function bezierY(e, p) {
  if (e === "hold") return p < 1 ? 0 : 1;
  if (!Array.isArray(e)) return p;
  const f = (u, q, r) => 3 * (1 - u) * (1 - u) * u * q + 3 * (1 - u) * u * u * r + u * u * u;
  let lo = 0, hi = 1, u = p;
  for (let i = 0; i < 16; i++) { u = (lo + hi) / 2; if (f(u, e[0], e[2]) < p) lo = u; else hi = u; }
  return f(u, e[1], e[3]);
}
// Giá trị đang có tại playhead.
function kfValue(id, prop, fallback) {
  const a = kfOf(id)[prop], c = clipOf(id);
  if (!a?.length || !c) return fallback;
  const t = kfLocal(c);
  if (t <= a[0].t) return a[0].v;
  for (let i = 0; i + 1 < a.length; i++) {
    if (t < a[i + 1].t) { const q = (t - a[i].t) / (a[i + 1].t - a[i].t); return +(a[i].v + (a[i + 1].v - a[i].v) * bezierY(a[i].e, q)).toFixed(3); }
  }
  return a[a.length - 1].v;
}
// Thuộc tính đã có keyframe thì đổi giá trị là tạo hoặc sửa keyframe tại playhead.
function setOrKey(id, values, plain) {
  const k = kfOf(id), c = clipOf(id);
  const keyed = Object.keys(values).filter((p) => k[p]);
  if (!keyed.length || !c) return plain();
  if (state.time < c.start || state.time > c.end) { toast("Đưa playhead vào trong clip để sửa keyframe", true); return refresh(false); }
  return edit("keyframe", { id, t: kfLocal(c), values: Object.fromEntries(keyed.map((p) => [p, values[p]])) });
}
function kfTimes(id) { return [...new Set(Object.values(kfOf(id)).flat().map((k) => k.t))].sort((a, b) => a - b); }
function kfButtons(c, props, current) {
  const a = props.flatMap((p) => kfOf(c.id)[p] || []).map((k) => k.t).sort((x, y) => x - y);
  const t = kfLocal(c), on = a.some((v) => kfNear(v, t));
  const prev = [...a].reverse().find((v) => v < t - 0.02), next = a.find((v) => v > t + 0.02);
  const nav = (txt, title, to) => { const b = el("button", { textContent: txt, title, disabled: to === undefined }); b.setAttribute("aria-label", title); b.onclick = () => { player()?.pause(); seek(c.start + to); }; return b; };
  const d = el("button", { className: `kfD${on ? " on" : a.length ? " has" : ""}`, textContent: on ? "◆" : "◇", title: on ? "Bỏ keyframe tại đây" : "Thêm keyframe tại đây" });
  d.setAttribute("aria-label", d.title);
  d.onclick = () => {
    if (state.time < c.start || state.time > c.end) return toast("Đưa playhead vào trong clip để thêm keyframe", true);
    if (on) return edit("keyframe", { id: c.id, t, remove: props });
    edit("keyframe", { id: c.id, t, values: current() });
  };
  return el("span", { className: "kfBtns" }, nav("‹", "Keyframe trước", prev), d, nav("›", "Keyframe sau", next));
}
const kfLabel = (text, c, props, current) => el("span", { className: "kfLine" }, el("span", { textContent: text }), kfButtons(c, props, current));
// Đường cong của đoạn bắt đầu từ keyframe tại playhead.
function kfCurveRows(c) {
  const t = kfLocal(c), list = Object.values(kfOf(c.id)).flat().filter((k) => kfNear(k.t, t));
  if (!list.length) return [];
  const e = list[0].e;
  const save = (v) => edit("keyframe", { id: c.id, t, ease: v });
  const cur = KF_EASE.find(([, , v]) => JSON.stringify(v) === JSON.stringify(e ?? null))?.[0] || "tuy";
  const sel = el("select");
  sel.setAttribute("aria-label", "Đường cong");
  for (const [k, name] of KF_EASE) sel.append(el("option", { value: k, textContent: name, selected: k === cur }));
  if (cur === "tuy") sel.append(el("option", { value: "tuy", textContent: "Tự chỉnh", selected: true }));
  sel.onchange = () => save(KF_EASE.find(([k]) => k === sel.value)?.[2] ?? null);
  const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "-20 -60 240 320"); svg.setAttribute("class", "kfCurve");
  const P = (x, y) => [x * 200, 200 - y * 200];
  const pts = Array.isArray(e) ? [...e] : [0.33, 0.33, 0.67, 0.67];
  const path = document.createElementNS(NS, "path"), l1 = document.createElementNS(NS, "line"), l2 = document.createElementNS(NS, "line");
  for (const n of [path, l1, l2]) { n.setAttribute("fill", "none"); n.setAttribute("stroke", n === path ? "currentColor" : "var(--muted)"); n.setAttribute("stroke-width", n === path ? 3 : 1.5); svg.append(n); }
  const hs = [0, 1].map(() => { const h = document.createElementNS(NS, "circle"); h.setAttribute("r", 9); svg.append(h); return h; });
  const paint = () => {
    const [a, b, x, y] = pts, A = P(a, b), B = P(x, y);
    path.setAttribute("d", e === "hold" ? "M0 200H200V0" : `M0 200C${A} ${B} 200 0`);
    l1.setAttribute("x1", 0); l1.setAttribute("y1", 200); l1.setAttribute("x2", A[0]); l1.setAttribute("y2", A[1]);
    l2.setAttribute("x1", 200); l2.setAttribute("y1", 0); l2.setAttribute("x2", B[0]); l2.setAttribute("y2", B[1]);
    hs[0].setAttribute("cx", A[0]); hs[0].setAttribute("cy", A[1]); hs[1].setAttribute("cx", B[0]); hs[1].setAttribute("cy", B[1]);
  };
  hs.forEach((h, i) => {
    h.addEventListener("pointerdown", (ev) => {
      ev.preventDefault(); h.setPointerCapture(ev.pointerId);
      const mv = (m) => {
        const box = svg.getBoundingClientRect(), k = 240 / box.width;
        pts[i * 2] = Math.max(0, Math.min(1, ((m.clientX - box.left) * k - 20) / 200));
        pts[i * 2 + 1] = +Math.max(-0.3, Math.min(1.3, (200 - ((m.clientY - box.top) * k - 60)) / 200)).toFixed(3);
        pts[i * 2] = +pts[i * 2].toFixed(3);
        paint();
      };
      const up = () => { h.removeEventListener("pointermove", mv); h.removeEventListener("pointerup", up); save([...pts]); };
      h.addEventListener("pointermove", mv); h.addEventListener("pointerup", up);
    });
  });
  paint();
  return [el("div", { className: "pr2" }, el("label", { textContent: "Đường cong tới điểm sau" }), sel), svg];
}
let kfLast = null;
function kfRefresh() {
  const c = clipOf(state.sel);
  if (!c || !kfTimes(c.id).length) { kfLast = null; return; }
  const k = `${c.id}@${state.time.toFixed(3)}`;
  if (k === kfLast || state.dragging || document.activeElement?.closest?.("#props input, #props select")) return;
  kfLast = k;
  drawProps();
}

// ---- Thiết kế: Kiểu, Bố cục, Chuyển động như bảng Design của HyperFrames ----
const DESIGN_EASES = ["none", "power1.in", "power1.out", "power1.inOut", "power2.in", "power2.out", "power2.inOut", "power3.in", "power3.out", "power3.inOut", "power4.in", "power4.out", "power4.inOut", "back.in", "back.out", "back.inOut", "elastic.in", "elastic.out", "elastic.inOut", "bounce.in", "bounce.out", "bounce.inOut", "circ.inOut", "expo.in", "expo.out", "expo.inOut", "steps(1)"];
const BLENDS = ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"];
function tabDesign(id, c) {
  const o = state.model.overrides[id] || {}, d = o.d || {};
  const put = (p) => { const n = { ...d, ...p }; for (const k of Object.keys(n)) if (n[k] === null || n[k] === "") delete n[k]; return edit("style", { id, set: { d: Object.keys(n).length ? n : null } }); };
  const color = (label, val, onSet) => { const i = el("input", { type: "color", value: /^#[0-9a-f]{6}$/i.test(val || "") ? val : "#ffffff" }); i.setAttribute("aria-label", label); i.onchange = () => onSet(i.value); return el("div", { className: "pr2" }, el("label", { textContent: label }), i); };
  const box = () => state.frame?.contentDocument?.getElementById(id)?.getBoundingClientRect();
  const hide = el("button", { className: "icon", textContent: o.hidden ? "🙈" : "👁", title: o.hidden ? "Hiện lớp" : "Ẩn lớp" });
  hide.setAttribute("aria-label", hide.title);
  hide.onclick = () => edit("style", { id, set: { hidden: o.hidden ? null : true } });
  const copy = el("button", { className: "icon", textContent: "⧉", title: "Sao chép thông tin lớp" });
  copy.setAttribute("aria-label", copy.title);
  copy.onclick = () => { const r = box(); navigator.clipboard?.writeText(`#${id} · ${r ? `${Math.round(r.width)}×${Math.round(r.height)}` : ""} · ${JSON.stringify(o)}`).then(() => toast("Đã sao chép")).catch(() => toast("Trình duyệt chặn sao chép", true)); };
  const clear = el("button", { className: "icon", textContent: "×", title: "Bỏ chọn" });
  clear.setAttribute("aria-label", clear.title);
  clear.onclick = () => { state.layer = null; state.sel = null; drawProps(); drawSel(); drawLayers(); drawTimeline(); };
  const head = el("div", { className: "dHead" }, el("b", { textContent: `#${id}` }), hide, copy, clear);

  const style = () => {
    const fill = d.fill || "";
    const rows = [pillRow("Tô nền", [["solid", "Màu"], ["gradient", "Chuyển màu"], ["image", "Ảnh"]], fill, (v) => put({ fill: v }))];
    if (fill === "solid") rows.push(color("Màu nền", d.color, (v) => put({ color: v })));
    if (fill === "gradient") rows.push(color("Màu đầu", d.gradFrom, (v) => put({ gradFrom: v })), color("Màu cuối", d.gradTo, (v) => put({ gradTo: v })), sliderRow("Góc", d.gradA ?? 180, 0, 360, 1, (v) => put({ gradA: v })));
    if (fill === "image") {
      const f = el("input", { type: "file", accept: "image/*", hidden: true });
      f.onchange = async () => { if (!f.files[0]) return; try { const up = await api(`upload?ten=${encodeURIComponent(f.files[0].name)}`, { method: "POST", body: f.files[0] }); put({ image: up.path }); } catch (e) { toast(e.message, true); } };
      rows.push(el("label", { className: "btn", textContent: d.image ? "Đổi ảnh nền lớp" : "Chọn ảnh nền lớp" }, f));
    }
    rows.push(color("Màu chữ", o.color, (v) => edit("style", { id, set: { color: v } })));
    rows.push(sliderRow("Viền dày", d.sw ?? 0, 0, 60, 1, (v) => put({ sw: v || null })));
    if (d.sw) rows.push(selectRow("Kiểu viền", [["solid", "Liền"], ["dashed", "Gạch"], ["dotted", "Chấm"], ["double", "Đôi"]], d.ss || "solid", (v) => put({ ss: v })), color("Màu viền", d.sc, (v) => put({ sc: v })));
    const rad = d.radius || [0, 0, 0, 0];
    rows.push(sliderRow("Bo góc", rad[0], 0, 400, 1, (v) => put({ radius: v ? [v, v, v, v] : null })));
    const corner = (i, label) => { const n = el("input", { type: "number", min: 0, value: rad[i], title: label }); n.setAttribute("aria-label", label); n.onchange = () => { const a = [...rad]; a[i] = +n.value || 0; put({ radius: a.some(Boolean) ? a : null }); }; return n; };
    rows.push(el("div", { className: "dCorners" }, corner(0, "Góc trên trái"), corner(1, "Góc trên phải"), corner(2, "Góc dưới phải"), corner(3, "Góc dưới trái")));
    rows.push(selectRow("Bóng", [["", "Không"], ["nho", "Nhỏ"], ["vua", "Vừa"], ["lon", "Lớn"], ["sang", "Phát sáng"]], d.shadow || "", (v) => put({ shadow: v })));
    rows.push(selectRow("Hòa trộn", BLENDS.map((b) => [b, b]), d.blend || "normal", (v) => put({ blend: v === "normal" ? null : v })));
    rows.push(sliderRow("Làm mờ lớp", d.blur ?? 0, 0, 100, 1, (v) => put({ blur: v || null })));
    rows.push(sliderRow("Làm mờ phía sau", d.backdrop ?? 0, 0, 100, 1, (v) => put({ backdrop: v || null })));
    rows.push(selectRow("Tràn", [["", "Mặc định"], ["visible", "Hiện"], ["hidden", "Ẩn"]], d.overflow || "", (v) => put({ overflow: v })));
    rows.push(selectRow("Mặt nạ", [["", "Không"], ["tron", "Tròn"], ["elip", "Elip"], ["vuong", "Chữ nhật"], ["bo", "Bo góc"], ["thoi", "Thoi"]], d.mask || "", (v) => put({ mask: v })));
    if (d.mask) rows.push(sliderRow("Thu mặt nạ", d.maskInset ?? 0, 0, 50, 1, (v) => put({ maskInset: v || null })));
    rows.push(sliderRow("Độ rõ", kfValue(id, "opacity", o.opacity ?? 1), 0, 1, 0.05, (v) => setOrKey(id, { opacity: v }, () => edit("style", { id, set: { opacity: v === 1 ? null : v } }))));
    return rows;
  };

  const layout = () => {
    const rows = [];
    if (c) {
      const set = (p) => edit("style", { id, set: p });
      rows.push(...transformRows(o, set, c));
    } else {
      const num = (label, prop) => { const n = el("input", { type: "number", value: o[prop] ?? 0 }); n.setAttribute("aria-label", label); n.onchange = () => edit("style", { id, set: { [prop]: +n.value } }); return el("div", { className: "pr2" }, el("label", { textContent: label }), n); };
      rows.push(num("X", "x"), num("Y", "y"), num("Góc", "rotate"));
    }
    const r = box(), sc = 1 / (state.scale ? 1 : 1);
    const size = (label, prop, cur) => {
      const n = el("input", { type: "number", min: 0, value: Math.round(kfValue(id, prop, d[prop] ?? cur)) });
      n.setAttribute("aria-label", label);
      n.onchange = () => setOrKey(id, { [prop]: +n.value }, () => put({ [prop]: +n.value }));
      return el("div", { className: "pr2" }, c ? kfLabel(label, c, [prop], () => ({ [prop]: kfValue(id, prop, d[prop] ?? cur) })) : el("label", { textContent: label }), n);
    };
    rows.push(size("Rộng", "w", Math.round((r?.width || 0) * sc)), size("Cao", "h", Math.round((r?.height || 0) * sc)));
    const z = el("input", { type: "number", value: d.z ?? "" , placeholder: "tự động" });
    z.setAttribute("aria-label", "Thứ tự lớp");
    z.onchange = () => put({ z: z.value === "" ? null : +z.value });
    rows.push(el("div", { className: "pr2" }, el("label", { textContent: "Thứ tự lớp" }), z));
    rows.push(sliderRow("Nghiêng dọc 3D", d.rx ?? 0, -180, 180, 1, (v) => put({ rx: v || null })), sliderRow("Nghiêng ngang 3D", d.ry ?? 0, -180, 180, 1, (v) => put({ ry: v || null })), sliderRow("Chiều sâu 3D", d.tz ?? 0, -1000, 1000, 10, (v) => put({ tz: v || null })));
    return rows;
  };

  const motion = () => {
    if (!c) return [el("p", { className: "hint", textContent: "Lớp này không có thời gian riêng, nó chạy theo clip chứa nó." })];
    const num = (label, val, onSet) => { const n = numInput(+val.toFixed(3), (v) => { if (v !== null && v !== undefined) onSet(v); }, { step: 0.01, min: 0 }); n.setAttribute("aria-label", label); return el("div", { className: "pr2" }, el("label", { textContent: label }), n); };
    const rows = [num("Bắt đầu", c.start, (v) => edit("move", { id, delta: v - c.start })), num("Kết thúc", c.end, (v) => edit("trim", { id, edge: "end", delta: v - c.end })), num("Độ dài", c.end - c.start, (v) => edit("trim", { id, edge: "end", delta: c.start + v - c.end }))];
    for (const t of c.tweens) {
      const sel = el("select");
      sel.setAttribute("aria-label", "Đường chuyển động");
      for (const e of DESIGN_EASES) sel.append(el("option", { value: e, textContent: e, selected: e === t.ease }));
      if (t.ease && !DESIGN_EASES.includes(t.ease)) sel.append(el("option", { value: t.ease, textContent: t.ease, selected: true }));
      sel.disabled = !t.ease;
      sel.onchange = () => edit("tween", { i: t.i, ease: sel.value, expectedPos: t.pos });
      rows.push(el("div", { className: "dEase" }, el("b", { textContent: `${t.selector ? t.selector.replace(/^#/, "") : t.id} · ${t.method}` }), num("Bắt đầu lúc", t.pos, (v) => edit("tween", { i: t.i, pos: v, expectedPos: t.pos })), num("Dài", t.dur, (v) => edit("tween", { i: t.i, dur: v, expectedPos: t.pos })), sel));
    }
    return rows;
  };
  return [head, ...accordion("d-style", "Kiểu", false, style, true), ...accordion("d-layout", "Bố cục", false, layout), ...accordion("d-motion", `Chuyển động${c?.tweens.length ? ` (${c.tweens.length})` : ""}`, false, motion)];
}

// ---- Bảng Lớp: cây phần tử trong video ----
state.openLayers = new Set();
function drawLayers() {
  const list = state.model?.layers;
  if (!list) return;
  const q = plain($("#layerSearch").value.trim());
  const kids = new Map();
  list.forEach((l, i) => { if (!kids.has(l.parent)) kids.set(l.parent, []); kids.get(l.parent).push(i); });
  const pick = async (l) => {
    let id = l.id;
    try { if (!id) id = (await edit("layerId", { n: l.n, tag: l.tag }))?.id; } catch (e) { return toast(e.message, true); }
    if (!id) return;
    if (clipOf(id)) { state.layer = null; select(id); }
    else { state.sel = null; state.layer = id; drawTimeline(); drawProps(); drawSel(); }
    drawLayers();
  };
  const row = (i, depth) => {
    const l = list[i], o = state.model.overrides[l.id] || {}, has = kids.has(i), open = state.openLayers.has(i);
    const chev = el("button", { textContent: has ? (open ? "▾" : "▸") : "", title: open ? "Thu gọn" : "Mở rộng" });
    chev.onclick = (e) => { e.stopPropagation(); open ? state.openLayers.delete(i) : state.openLayers.add(i); drawLayers(); };
    const ensure = async () => l.id || (await edit("layerId", { n: l.n, tag: l.tag }))?.id;
    const tool = (txt, title, fn) => { const b = el("button", { textContent: txt, title }); b.setAttribute("aria-label", title); b.onclick = async (e) => { e.stopPropagation(); const id = await ensure(); if (id) fn(id); }; return b; };
    const z = (id, by) => { const d = state.model.overrides[id]?.d || {}; edit("style", { id, set: { d: { ...d, z: (d.z ?? 0) + by } } }); };
    const name = el("span", { className: "lyrName", textContent: l.name, title: `${l.tag}${l.id ? ` #${l.id}` : ""}` });
    const tools = el("span", { className: "lyrTools" }, tool("✎", "Đổi tên", (id) => { const v = window.prompt("Tên lớp", l.name); if (v !== null) edit("rename", { id, ten: v.trim() }); }), tool("▲", "Đưa lên trên", (id) => z(id, 1)), tool("▼", "Đưa xuống dưới", (id) => z(id, -1)));
    const r = el("div", { className: `lyr${l.id && (l.id === state.sel || l.id === state.layer) ? " sel" : ""}${o.hidden ? " off" : ""}` }, chev, el("span", { className: "lyrTag", textContent: l.tag }), name, tools, tool(o.hidden ? "🙈" : "👁", o.hidden ? "Hiện lớp" : "Ẩn lớp", (id) => edit("style", { id, set: { hidden: state.model.overrides[id]?.hidden ? null : true } })));
    r.style.paddingLeft = `${depth * 12}px`;
    r.onclick = () => pick(l);
    return r;
  };
  const out = [];
  if (q) list.forEach((l, i) => { if (plain(`${l.name} ${l.id}`).includes(q)) out.push(row(i, 0)); });
  else { const walk = (p, depth) => { for (const i of kids.get(p) || []) { out.push(row(i, depth)); if (state.openLayers.has(i)) walk(i, depth + 1); } }; walk(-1, 0); }
  $("#layerTree").replaceChildren(...out);
}
$("#layerSearch").oninput = drawLayers;

const FRAME_SHAPES = [["vuong", "Chữ nhật"], ["bo", "Bo góc"], ["vien", "Viên thuốc"], ["elip", "Elip"], ["binhhanh", "Bình hành"], ["catgoc", "Cắt góc"], ["lucgiac", "Lục giác"], ["nhan", "Nhãn"], ["bong", "Bong bóng thoại"], ["kimcuong", "Thoi"], ["gach", "Gạch chân"], ["tuy", "Tự vẽ"]];
function frameRows(c) {
  const f = state.model.overrides[c.id]?.frame || {};
  const put = (p) => edit("style", { id: c.id, set: { frame: { ...f, ...p } } });
  const color = (label, val, key) => { const i = el("input", { type: "color", value: val }); i.setAttribute("aria-label", label); i.onchange = () => put({ [key]: i.value }); return el("div", { className: "pr2" }, el("label", { textContent: label }), i); };
  const on = el("input", { type: "checkbox", checked: !!f.on });
  on.onchange = () => {
    const doc = state.frame?.contentDocument, n = doc?.getElementById(c.id), cs = n && state.frame.contentWindow.getComputedStyle(n);
    const center = !!cs && cs.textAlign === "center" && n.offsetWidth >= n.parentElement.offsetWidth * 0.9;
    put({ on: on.checked, shape: f.shape || "bo", center, rel: cs?.position === "static" });
  };
  const rows = [field("Bật khung", on)];
  if (!f.on) return rows;
  rows.push(selectRow("Dạng khung", FRAME_SHAPES, f.shape || "bo", (v) => put({ shape: v })));
  if (f.shape === "tuy") {
    const p = el("input", { type: "text", value: f.poly || "0 0,100% 0,100% 100%,0 100%", placeholder: "0 0,100% 0,100% 100%,0 100%" });
    p.setAttribute("aria-label", "Các điểm của khung");
    p.onchange = () => put({ poly: p.value });
    rows.push(el("p", { className: "hint", textContent: "Nhập các điểm x y theo %, cách nhau dấu phẩy." }), p);
  }
  rows.push(color("Màu nền", f.fill || "#000000", "fill"), sliderRow("Độ rõ nền", f.alpha ?? 0.6, 0, 1, 0.05, (v) => put({ alpha: v })));
  rows.push(sliderRow("Viền dày", f.sw ?? 0, 0, 40, 1, (v) => put({ sw: v })), color("Màu viền", f.sc || "#ffffff", "sc"), sliderRow("Độ rõ viền", f.sa ?? 1, 0, 1, 0.05, (v) => put({ sa: v })));
  if (f.shape === "bo" || !f.shape) rows.push(sliderRow("Bo góc", f.radius ?? 16, 0, 200, 1, (v) => put({ radius: v })));
  rows.push(sliderRow("Đệm ngang", f.padX ?? 24, 0, 200, 1, (v) => put({ padX: v })), sliderRow("Đệm dọc", f.padY ?? 12, 0, 200, 1, (v) => put({ padY: v })), sliderRow("Nghiêng", f.skew ?? 0, -30, 30, 1, (v) => put({ skew: v || null })));
  return rows;
}

function transformRows(o, set, c) {
  if (c) {
    const cur = (ps) => () => Object.fromEntries(ps.map((p) => [p, kfValue(c.id, p, o[p] ?? KF_DEFAULT[p])]));
    const num = (id, label, ps) => { const n = el("input", { type: "number", step: 1, value: kfValue(c.id, id, o[id] ?? 0) }); n.setAttribute("aria-label", label); n.onchange = () => setOrKey(c.id, { [id]: +n.value }, () => set({ [id]: +n.value })); return n; };
    const line = (label, prop, min, max, step, none) => [kfLabel(label, c, [prop], cur([prop])), sliderRow(label, kfValue(c.id, prop, o[prop] ?? KF_DEFAULT[prop]), min, max, step, (v) => setOrKey(c.id, { [prop]: v }, () => set({ [prop]: v === none ? null : v })), (v) => set.live?.({ [prop]: v }))];
    return [
      kfLabel("Vị trí X / Y", c, ["x", "y"], cur(["x", "y"])),
      el("div", { className: "pair" }, num("x", "Vị trí X"), num("y", "Vị trí Y")),
      ...line("Phóng to", "scale", 0.1, 4, 0.05, 1),
      ...line("Xoay", "rotate", -180, 180, 1, 0),
      ...line("Độ rõ", "opacity", 0, 1, 0.05, 1),
      ...kfCurveRows(c),
    ];
  }
  const px = el("input", { type: "number", step: 1, value: o.x ?? 0 }), py = el("input", { type: "number", step: 1, value: o.y ?? 0 });
  px.setAttribute("aria-label", "Vị trí X"); py.setAttribute("aria-label", "Vị trí Y");
  px.onchange = () => set({ x: +px.value }); py.onchange = () => set({ y: +py.value });
  return [
    el("div", { className: "pr2" }, el("label", { textContent: "Vị trí X / Y" }), el("div", { className: "pair" }, px, py)),
    sliderRow("Phóng to", o.scale ?? 1, 0.1, 4, 0.05, (v) => set({ scale: v === 1 ? null : v }), (v) => set.live?.({ scale: v })),
    sliderRow("Xoay", o.rotate ?? 0, -180, 180, 1, (v) => set({ rotate: v || null }), (v) => set.live?.({ rotate: v })),
    sliderRow("Độ rõ", o.opacity ?? 1, 0, 1, 0.05, (v) => set({ opacity: v === 1 ? null : v }), (v) => set.live?.({ opacity: v })),
  ];
}

// Thang CapCut 0-1000, 100 là mức gốc. HyperFrames tăng tối đa +12 dB (3,98 lần) nên 1000 ứng với mức đó.
const MAX_GAIN = 3.98;
const pctToGain = (p) => +(p <= 100 ? p / 100 : 1 + ((p - 100) / 900) * (MAX_GAIN - 1)).toFixed(4);
const gainToPct = (g) => Math.round(g <= 1 ? g * 100 : 100 + ((Math.min(g, MAX_GAIN) - 1) / (MAX_GAIN - 1)) * 900);

const ADJUST = [["exposure", "Phơi sáng", -2, 2, 0.05], ["contrast", "Tương phản", -1, 1, 0.01], ["highlights", "Vùng sáng", -1, 1, 0.01], ["shadows", "Vùng tối", -1, 1, 0.01], ["whites", "Điểm trắng", -1, 1, 0.01], ["blacks", "Điểm đen", -1, 1, 0.01], ["temperature", "Nhiệt độ", -1, 1, 0.01], ["tint", "Sắc độ", -1, 1, 0.01], ["vibrance", "Độ rực", -1, 1, 0.01], ["saturation", "Bão hòa", -1, 1, 0.01]];

function tabColor(c) {
  const g = c.grade || {};
  const save = (next) => edit("grade", { id: c.id, grading: next });
  // Xem trước: đổi trực tiếp màu các video bị ảnh hưởng trong khung xem.
  const live = (next) => {
    showClip(c);
    const vids = c.kind === "video" ? [c] : state.model.clips.filter((v) => v.kind === "video" && Math.min(c.end, v.end) - Math.max(c.start, v.start) >= (v.end - v.start) / 2);
    for (const v of vids) state.frame?.contentWindow?.postMessage({ source: "hf-parent", type: "control", action: "set-color-grading", target: v.id, grading: { intensity: 1, adjust: next.adjust || {}, details: next.details || {}, ...(next.lut ? { lut: next.lut } : {}) } }, "*");
  };
  const out = [];
  if (c.kind === "video") out.push(el("p", { className: "hint", textContent: "Chỉ áp cho clip này. Muốn áp cho nhiều cảnh, bấm ◐+ Lớp màu trên thanh timeline." }));
  else out.push(el("p", { className: "hint", textContent: "Áp cho các cảnh nằm quá nửa trong lớp này. Kéo mép lớp trên timeline để đổi phạm vi." }));
  out.push(...accordion("c-lut", g.lut ? `LUT: ${baseName(g.lut.src).replace(/\.cube$/i, "")}` : "LUT", !!g.lut, () => lutPicker(c, g, save, live), true));
  out.push(...accordion("c-adj", "Điều chỉnh", Object.values(g.adjust || {}).some(Boolean), () => ADJUST.map(([k, name, min, max, step]) => sliderRow(name, g.adjust?.[k] ?? 0, min, max, step, (v) => { const adjust = { ...g.adjust, [k]: v }; if (!v) delete adjust[k]; save({ ...g, adjust }); }, (v) => live({ ...g, adjust: { ...g.adjust, [k]: v } }))), true));
  out.push(...accordion("c-fin", "Viền tối và hạt", !!(g.details?.vignette || g.details?.grain), () => [["vignette", "Viền tối"], ["grain", "Hạt film"]].map(([k, name]) => sliderRow(name, g.details?.[k] ?? 0, 0, 1, 0.01, (v) => { const details = { ...g.details, [k]: v }; if (!v) delete details[k]; save({ ...g, details }); }, (v) => live({ ...g, details: { ...g.details, [k]: v } })))));
  if (c.grade) { const r = el("button", { className: "reset", textContent: "Bỏ toàn bộ chỉnh màu" }); r.onclick = () => save(null); out.push(r); }
  return out;
}

function lutPicker(c, g, save, live) {
  const box = el("div");
  const search = el("input", { type: "search", placeholder: "Tìm LUT của bạn…", value: state.lutQ || "", style: "width:100%;background:var(--bg);border:1px solid var(--line);border-radius:5px;padding:4px 6px;margin-bottom:4px" });
  search.setAttribute("aria-label", "Tìm LUT");
  const group = el("select", { style: "width:100%" });
  group.setAttribute("aria-label", "Nhóm LUT");
  const list = el("div", { className: "lutList" });
  const amount = sliderRow("Cường độ", g.lut?.intensity ?? 1, 0, 1, 0.05, (v) => g.lut && save({ ...g, lut: { ...g.lut, intensity: v } }), (v) => g.lut && live({ ...g, lut: { ...g.lut, intensity: v } }));
  const draw = () => {
    state.lutQ = search.value; state.lutGroup = group.value;
    const q = plain(search.value.trim());
    const rows = state.luts.filter((l) => (!group.value || l.nhom === group.value) && (!q || plain(l.ten).includes(q)));
    list.replaceChildren();
    if (!rows.length) { list.append(el("p", { className: "hint", textContent: "Không có LUT nào khớp." })); return; }
    let at = 0;
    const more = () => {
      for (const l of rows.slice(at, at + 60)) {
        const b = el("button", { className: `lutRow${g.lut && baseName(g.lut.src).startsWith(l.ten.replace(/[^\w.-]+/g, "_").slice(0, 12)) ? " on" : ""}` }, l.ten, el("small", { textContent: l.nhom }));
        b.onclick = async () => {
          setStatus("Đang lưu…");
          try { const { src } = await post("use-lut", { key: l.key }); await edit("grade", { id: c.id, grading: { ...g, lut: { src, intensity: g.lut?.intensity ?? 1 } } }); }
          catch (e) { toast(e.message, true); setStatus("Chưa lưu"); }
        };
        list.append(b);
      }
      at += 60;
    };
    more();
    list.onscroll = () => { if (at < rows.length && list.scrollTop + list.clientHeight > list.scrollHeight - 200) more(); };
  };
  search.oninput = draw;
  group.onchange = draw;
  const fill = () => {
    group.replaceChildren(el("option", { value: "", textContent: `Tất cả nhóm (${state.luts.length})` }), ...[...new Set(state.luts.map((l) => l.nhom))].map((n) => el("option", { value: n, textContent: n, selected: n === state.lutGroup })));
    draw();
  };
  if (state.luts) fill();
  else fetch("/vn/lut-list").then((r) => r.json()).then((d) => { state.luts = d.luts; fill(); });
  box.append(search, group, list);
  if (g.lut) { const off = el("button", { className: "reset", textContent: "Bỏ LUT" }); off.onclick = () => { const { lut, ...rest } = g; save(rest); }; box.append(amount, off); }
  return [box];
}

function tabVideo(c) {
  const o = state.model.overrides[c.id] || {};
  return accordion("v-tf", "Biến đổi", false, () => transformRows(o, (p) => edit("style", { id: c.id, set: p }), c), true);
}

function tabAudio(c) {
  const rows = [];
  if (c.tag === "video") {
    const mute = el("input", { type: "checkbox", checked: c.muted });
    mute.onchange = () => edit("attrs", { id: c.id, muted: mute.checked });
    rows.push(field("Tắt tiếng", mute));
  }
  rows.push(kfLabel("Âm lượng", c, ["volume"], () => ({ volume: kfValue(c.id, "volume", c.volume ?? 1) })));
  rows.push(sliderRow("Âm lượng", gainToPct(kfValue(c.id, "volume", c.volume ?? 1)), 0, 1000, 1, (v) => setOrKey(c.id, { volume: pctToGain(v) }, () => edit("attrs", { id: c.id, volume: pctToGain(v) }))));
  rows.push(...kfCurveRows(c));
  rows.push(el("p", { className: "hint", textContent: "100 là mức gốc, 1000 là to nhất." }));
  const maxFade = +Math.min(10, c.end - c.start).toFixed(1);
  rows.push(sliderRow("Rõ dần (giây)", c.fadeIn, 0, maxFade, 0.1, (v) => edit("attrs", { id: c.id, fadeIn: v })));
  rows.push(sliderRow("Mờ dần (giây)", c.fadeOut, 0, maxFade, 0.1, (v) => edit("attrs", { id: c.id, fadeOut: v })));
  const sp = el("select");
  for (const r of [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3]) sp.append(el("option", { value: r, textContent: `${r}x`, selected: r === c.rate }));
  sp.onchange = () => edit("attrs", { id: c.id, rate: +sp.value });
  rows.push(el("div", { className: "pr2" }, el("label", { textContent: "Tốc độ" }), sp));
  return rows;
}

function tabControls(c, o, set) {
  const idx = activeLayer(c);
  const content = () => {
    if (c.segments.length === 1) return [layerCard(c, c.segments[0], 0)];
    if (idx !== null) return [layerCard(c, c.segments[idx], idx)];
    return [el("p", { className: "hint", textContent: "Chọn lớp để sửa nội dung:" }), el("div", { className: "layerPick" }, ...c.segments.map((sg, i) => {
      const b = el("button", {}, el("span", { textContent: sg.text.replace(/\*\*/g, "") }), el("small", { textContent: `Lớp ${i + 1}` }));
      b.onclick = () => { (state.layerIdx ??= {})[c.id] = i; drawProps(); };
      return b;
    }))];
  };
  const first = () => layerNodes(c).find((n) => n.textContent.trim() && !n.children.length);
  const fontName = o.fontFamily ? `Font: ${o.fontFamily}` : "Font";
  return [
    ...accordion("t-content", "Nội dung", false, content, true),
    ...accordion("t-font", fontName, !!o.fontFamily, () => [fontPicker(c, o)]),
    ...accordion("t-color", "Màu chữ", !!(o.color || o.fill), () => {
      const rows = [pillRow("Loại màu", [["solid", "Đơn sắc"], ["gradient", "Chuyển sắc"]], o.fill === "gradient" ? "gradient" : "solid", (v) => { if (v) set({ fill: v === "gradient" ? "gradient" : null }); })];
      if (o.fill === "gradient") rows.push(colorField("Màu đầu", o.gradFrom || "#FFFFFF", (v) => set({ gradFrom: v }), { live: (v) => (v ? set.live({ gradFrom: v }) : set.clear()) }), colorField("Màu cuối", o.gradTo || "#FFD36B", (v) => set({ gradTo: v }), { live: (v) => (v ? set.live({ gradTo: v }) : set.clear()) }), sliderRow("Góc màu", o.gradA ?? 180, 0, 360, 5, (v) => set({ gradA: v }), (v) => set.live({ gradA: v })));
      else rows.push(colorField("Màu chữ", o.color || "", (v) => set({ color: v }), { live: (v) => (v ? set.live({ color: v }) : set.clear()) }), sliderRow("Alpha", o.alpha ?? 1, 0, 1, 0.05, (v) => set({ alpha: v === 1 ? null : v }), (v) => set.live({ alpha: v })));
      return rows;
    }),
    ...accordion("t-style", "Kiểu chữ", !!(o.textCase || o.bold || o.italic || o.underline || o.textAlign || o.outlineOnly), () => [
      pillRow("Chữ hoa", [["none", "Aa", "Giữ nguyên"], ["uppercase", "AA", "Viết hoa"], ["lowercase", "aa", "Viết thường"], ["capitalize", "Tt", "Hoa chữ đầu"]], o.textCase || "none", (v) => set({ textCase: !v || v === "none" ? null : v })),
      biuRow(c, o, set),
      pillRow("Căn ngang", [["left", "Trái"], ["center", "Giữa"], ["right", "Phải"]], o.textAlign || "", (v) => set({ textAlign: v })),
      pillRow("Dạng chữ", [["fill", "Đặc"], ["line", "Viền rỗng"]], o.outlineOnly ? "line" : "fill", (v) => set({ outlineOnly: v === "line" ? true : null })),
    ]),
    ...accordion("t-size", "Cỡ chữ và khoảng cách", !!(o.fontSize || o.letterSpacing || o.lineHeight), () => {
      const f = first();
      const seen = o.fontSize || (f ? Math.round(parseFloat(state.frame.contentWindow.getComputedStyle(f).fontSize)) : 60);
      return [
        sliderRow("Cỡ chữ", seen, 8, 300, 1, (v) => set({ fontSize: v }), (v) => set.live({ fontSize: v })),
        sliderRow("Tracking", o.letterSpacing ?? 0, -10, 60, 0.5, (v) => set({ letterSpacing: v || null }), (v) => set.live({ letterSpacing: v })),
        sliderRow("Giãn dòng", o.lineHeight ?? 1.2, 0.6, 3, 0.05, (v) => set({ lineHeight: v }), (v) => set.live({ lineHeight: v })),
      ];
    }),
    ...accordion("t-tf", "Biến đổi", !!(o.x || o.y || o.scale || o.rotate || o.opacity !== undefined || o.kf), () => transformRows(o, set, c)),
  ];
}

const EASE_OPTS = [["none", "None"], ["sine", "Sine"], ["power1", "Quad"], ["power2", "Cubic"], ["power3", "Quart"], ["expo", "Expo"], ["back", "Back"], ["elastic", "Elastic"], ["bounce", "Bounce"]];

function tabAnim(c, o, set) {
  const a = o.anim || {};
  const put = (p) => {
    const next = { ...a, ...p };
    // Đổi thông số mà chưa bật vào/ra thì bật vào, để thấy kết quả ngay.
    const touchedOff = p.in?.on === false || p.out?.on === false || p.strobe?.on === false || p.track?.on === false;
    if (!touchedOff && !next.in?.on && !next.out?.on) next.in = { ...next.in, on: !p.moveOut };
    if (p.moveOut?.on && !next.out?.on) next.out = { ...next.out, on: true };
    if ((next.in?.on || next.out?.on) && !next.moveIn?.on && !next.moveOut?.on && !next.blur?.on && !next.dissolve?.on && !next.track?.on && !next.strobe?.on) next.dissolve = { on: true };
    // Phát thử clip sau khi khung xem nạp lại.
    state.afterLoad = () => { seek(c.start); state.stopAt = Math.min(c.end, c.start + 3); player()?.play(); };
    set({ anim: next });
  };
  const dirBtns = (m, key) => pillRow("Hướng", [["up", "↑ Lên"], ["down", "↓ Xuống"], ["left", "← Trái"], ["right", "→ Phải"]], m.dir || "down", (v) => put({ [key]: { ...m, on: true, dir: v || "down", ang: null } }));
  const moveBlock = (key, title) => {
    const m = a[key] || {};
    const rows = [checkRow(title, m.on, (v) => put({ [key]: { ...m, on: v } }))];
    if (m.on) {
      rows.push(dirBtns(m, key), sliderRow("Khoảng cách", m.dist ?? 0.025, 0, 0.5, 0.005, (v) => put({ [key]: { ...m, dist: v } })));
      rows.push(checkRow("Góc tùy chỉnh", m.ang != null, (v) => put({ [key]: { ...m, ang: v ? 45 : null } })));
      if (m.ang != null) rows.push(sliderRow("Góc", m.ang, -180, 180, 1, (v) => put({ [key]: { ...m, ang: v } })));
    }
    return rows;
  };
  const out = [];
  if (activeLayer(c) !== null && c.segments[activeLayer(c)].auto) out.push(el("p", { className: "hint", textContent: "Lớp số chạy tự động không gắn chuyển động được." }));
  const basic = [];
  basic.push(pillRow("Chế độ", [["text", "Cả câu"], ["letter", "Từng chữ cái"], ["word", "Từng từ"]], a.mode || "text", (v) => put({ mode: v || "text" })));
  basic.push(checkRow("Chuyển động VÀO", a.in?.on, (v) => put({ in: { ...a.in, on: v }, dissolve: a.dissolve ?? { on: true } })));
  basic.push(sliderRow("Tốc độ vào", a.in?.sp ?? 1, 0.1, 5, 0.1, (v) => put({ in: { on: true, ...a.in, sp: v } })));
  basic.push(checkRow("Chuyển động RA", a.out?.on, (v) => put({ out: { ...a.out, on: v }, dissolve: a.dissolve ?? { on: true } })));
  basic.push(sliderRow("Tốc độ ra", a.out?.sp ?? 1, 0.1, 5, 0.1, (v) => put({ out: { on: true, ...a.out, sp: v } })));
  basic.push(selectRow("Nhịp vào", EASE_OPTS, a.easeIn || "expo", (v) => put({ easeIn: v })));
  basic.push(selectRow("Nhịp ra", EASE_OPTS, a.easeOut || "none", (v) => put({ easeOut: v })));
  basic.push(selectRow("Thứ tự", [["start", "Tự động (đầu → cuối)"], ["end", "Cuối → đầu"], ["center", "Giữa ra ngoài"], ["edges", "Ngoài vào giữa"], ["random", "Ngẫu nhiên"]], a.order || "start", (v) => put({ order: v })));
  basic.push(sliderRow("Độ trễ", a.delay ?? 1, 0, 5, 0.1, (v) => put({ delay: v })));
  out.push(...accordion("a-basic", "Vào và ra", !!(a.in?.on || a.out?.on), () => basic, true));
  out.push(...accordion("a-movein", "Di chuyển khi vào", a.moveIn?.on, () => moveBlock("moveIn", "Bật di chuyển khi vào")));
  out.push(...accordion("a-moveout", "Di chuyển khi ra", a.moveOut?.on, () => moveBlock("moveOut", "Bật di chuyển khi ra")));
  const fxAcc = (key, label, body) => accordion(`anim-${key}`, label, a[key]?.on, () => [checkRow(`Bật ${label}`, a[key]?.on, (v) => put({ [key]: { ...a[key], on: v } })), ...body(a[key] || {})]);
  out.push(...fxAcc("dissolve", "Mờ dần (Dissolve)", () => []));
  out.push(...fxAcc("blur", "Nhòe (Blur)", (x) => [sliderRow("Độ nhòe", x.amt ?? 12, 0, 60, 1, (v) => put({ blur: { ...x, amt: v } }))]));
  out.push(...fxAcc("strobe", "Nhấp nháy (Strobe)", (x) => [sliderRow("Độ dài", x.sp ?? 1, 0.2, 4, 0.1, (v) => put({ strobe: { ...x, sp: v } }))]));
  out.push(...fxAcc("track", "Giãn chữ (Tracking)", (x) => [sliderRow("Giãn từ", x.amt ?? 20, 0, 120, 1, (v) => put({ track: { ...x, amt: v } }))]));
  return out;
}

function tabFx(o, set) {
  const acc = (key, label, body) => accordion(`fx-${key}`, label, o[key]?.on, () => {
    const x = o[key] || {};
    const put = (p) => set({ [key]: { ...x, on: true, ...p } });
    const live = (p) => set.live({ [key]: { ...x, on: true, ...p } });
    const sl = (name, k, def, min, max, step) => sliderRow(name, x[k] ?? def, min, max, step, (v) => put({ [k]: v }), (v) => live({ [k]: v }));
    const col = (name, k, def) => colorField(name, x[k] || def, (v) => put({ [k]: v }), { live: (v) => (v ? live({ [k]: v }) : set.clear()) });
    return [checkRow(`Bật ${label}`, x.on, (v) => set({ [key]: { ...x, on: v } })), ...body(sl, col)];
  });
  const shadow = (sl, col) => [sl("Độ đậm", "o", 0.6, 0, 1, 0.05), sl("Khoảng cách", "d", 6, 0, 80, 1), sl("Góc", "a", 135, -180, 360, 5), sl("Nhòe", "b", 8, 0, 80, 1), col("Màu", "c", "#000000")];
  const glow = (dR) => (sl, col) => [sl("Bán kính", "r", dR, 0, 200, 1), sl("Cường độ", "g", 1, 1, 6, 1), sl("Hòa trộn", "b", 1, 0, 1, 0.05), col("Màu", "c", "#FFFFFF")];
  return [
    ...acc("border", "Viền (Border)", (sl, col) => [sl("Độ dày", "w", 2, 0, 30, 0.5), col("Màu viền", "c", "#000000")]),
    ...acc("shadow", "Đổ bóng (Drop Shadow)", shadow),
    ...acc("shadow2", "Đổ bóng 2 (Second Drop Shadow)", shadow),
    ...acc("glow", "Phát sáng (Glow)", glow(20)),
    ...acc("glowPro", "Phát sáng mạnh (Glow Pro)", glow(16)),
    ...acc("halo", "Quầng sáng (Halo Glow)", glow(60)),
    ...acc("rgb", "Tách màu (RGB Split)", (sl) => [sl("Độ lệch", "d", 4, 0, 40, 1)]),
  ];
}

function tabInfo(c, o) {
  const co = state.model.overrides[c.id] || {};
  const out = accordion("i-time", "Thời gian", false, () => [
    field("Bắt đầu", numInput(+c.start.toFixed(3), (v) => edit("move", { id: c.id, delta: v - c.start }), { step: 0.01, min: 0 })),
    field("Độ dài", numInput(+(c.end - c.start).toFixed(3), (v) => edit("trim", { id: c.id, edge: "end", delta: v - (c.end - c.start) }), { step: 0.01, min: 0.05 })),
    el("p", { className: "hint", textContent: `Kết thúc lúc ${fmtTime(c.end)}${c.segments.length ? ` · ${c.segments.length} lớp chữ` : ""}` }),
  ], true);
  if (c.tweens.length) out.push(...accordion("i-tween", `Hiệu ứng gốc của AI (${c.tweens.length})`, false, () => {
    const rows = [el("div", { className: "tween" }, el("span", { textContent: "Nhịp" }), el("span", { textContent: "Lúc (giây)" }), el("span", { textContent: "Dài" }))];
    for (const t of c.tweens) {
      const name = el("span", { textContent: `${t.selector ? t.selector.replace(/^#/, "") : "số đếm"} · ${t.ease || t.method}`, title: `${t.selector || t.id} · ${t.ease}` });
      const pos = numInput(t.pos, (v) => edit("tween", { i: t.i, pos: v ?? t.pos, expectedPos: t.pos }), { step: 0.01, min: 0 });
      const dur = numInput(t.dur, (v) => edit("tween", { i: t.i, dur: v ?? t.dur, expectedPos: t.pos }), { step: 0.01, min: 0 });
      pos.setAttribute("aria-label", "Lúc bắt đầu"); dur.setAttribute("aria-label", "Độ dài");
      rows.push(el("div", { className: "tween" }, name, pos, dur));
    }
    return rows;
  }));
  if (c.kind !== "audio" && c.kind !== "sfx") {
    const hide = el("button", { className: "reset", textContent: co.hidden ? "Hiện lại clip" : "Ẩn clip (không xóa)" });
    hide.onclick = () => edit("style", { id: c.id, set: { hidden: co.hidden ? null : true } });
    out.push(hide);
  }
  if (Object.keys(co).length) {
    const reset = el("button", { className: "reset", textContent: "Bỏ mọi chỉnh sửa của clip" });
    reset.onclick = () => edit("style", { id: c.id, set: Object.fromEntries(Object.keys(co).map((k) => [k, null])) });
    out.push(reset);
  }
  return out;
}

function tabSave(c, o, set) {
  const name = el("input", { type: "text", placeholder: "Tên mẫu, ví dụ: Giá nổi vàng", style: "width:100%;background:var(--bg);border:1px solid var(--line);border-radius:5px;padding:5px 7px" });
  name.setAttribute("aria-label", "Tên mẫu chữ");
  const result = el("div", { className: "resultBox", textContent: "Lưu kiểu chữ, hiệu ứng và chuyển động của lớp đang chọn thành mẫu dùng lại." });
  const list = el("div");
  const draw = (presets) => {
    list.replaceChildren(...presets.map((p) => {
      const use = el("button", { textContent: p.name, title: "Áp mẫu này cho lớp đang chọn" });
      use.onclick = () => set(Object.fromEntries([...Object.keys(o).filter((k) => !["x", "y"].includes(k)).map((k) => [k, null]), ...Object.entries(p.style)]));
      const x = el("button", { className: "icon", textContent: "×", title: "Xóa mẫu" });
      x.setAttribute("aria-label", `Xóa mẫu ${p.name}`);
      x.onclick = async () => draw((await fetch("/vn/mau-chu", { method: "POST", body: JSON.stringify({ remove: p.name }) }).then((r) => r.json())).presets);
      return el("div", { className: "presetRow" }, use, x);
    }));
    if (!presets.length) list.append(el("p", { className: "hint", textContent: "Chưa có mẫu nào." }));
  };
  const save = el("button", { className: "primary", textContent: "Lưu mẫu" });
  save.onclick = async () => {
    const { x, y, ...style } = o;
    const r = await fetch("/vn/mau-chu", { method: "POST", body: JSON.stringify({ name: name.value, style }) });
    const d = await r.json();
    if (!r.ok) { result.textContent = d.error; return; }
    result.textContent = `Đã lưu mẫu “${name.value.trim()}”. Dùng được cho mọi dự án.`;
    name.value = "";
    draw(d.presets);
  };
  fetch("/vn/mau-chu").then((r) => r.json()).then((d) => draw(d.presets));
  return [el("span", { className: "cf-lbl", textContent: "Lưu kiểu hiện tại thành mẫu mới" }), name, el("div", { style: "height:6px" }), save, result, el("h4", { textContent: "Mẫu đã lưu" }), list];
}

function fontPicker(c, o) {
  const box = el("div", { className: "fontPick" });
  const search = el("input", { type: "search", placeholder: "Gõ tên font hoặc cuộn bên dưới…", value: state.fontQuery || "" });
  search.setAttribute("aria-label", "Tìm font");
  const scope = el("select", { title: "Bấm font sẽ áp cho phạm vi này" });
  scope.setAttribute("aria-label", "Phạm vi áp font");
  const opt = (v, t) => scope.append(el("option", { value: v, textContent: t, selected: state.fontScope === v }));
  c.segments.forEach((sg, i) => { if (sg.kind === "rich" && /\*\*/.test(sg.text)) opt(`accent:${i}`, `Chỉ từ nhấn${c.segments.length > 1 ? ` (lớp ${i + 1})` : ""}`); });
  if (c.segments.length > 1) c.segments.forEach((sg, i) => opt(`seg:${i}`, `Chỉ lớp ${i + 1}: ${sg.text.replace(/\*\*/g, "").slice(0, 18)}`));
  opt("one", "Cả clip này");
  opt("kind", `Tất cả ${KIND_NAME[c.kind].toLowerCase()}`);
  opt("all", "Toàn bộ chữ trong video");
  // Mặc định theo lớp đang chọn, không tự nhảy vào "Chỉ từ nhấn".
  const act = activeLayer(c);
  const wanted = state.fontScope && [...scope.options].some((x) => x.value === state.fontScope) ? state.fontScope : act !== null && c.segments.length > 1 ? `seg:${act}` : "one";
  scope.value = wanted;
  scope.onchange = () => (state.fontScope = scope.value);
  const list = el("div", { className: "fontList" });
  const apply = async (f) => {
    const v = scope.value;
    let body = { font: f.id, clips: [c.id] };
    if (v === "kind") body.clips = state.model.clips.filter((x) => x.kind === c.kind).map((x) => x.id);
    else if (v === "all") body.clips = state.model.clips.filter((x) => x.segments.length).map((x) => x.id);
    else if (v.startsWith("seg:")) body = { font: f.id, clips: [], segs: [{ id: c.id, index: +v.slice(4) }] };
    else if (v.startsWith("accent:")) body = { font: f.id, clips: [], segs: [{ id: c.id, index: +v.slice(7) }], field: "accentFont" };
    state.fontScroll = list.scrollTop;
    setStatus("Đang lưu…");
    try { await post("use-font", body); await refresh(); }
    catch (e) { setStatus("Chưa lưu"); toast(e.message, true); }
  };
  const row = (f) => {
    const fam = f.id.slice(2).replace(/\.[^.]+$/, "");
    const r = el("button", { className: `fontRow${o.fontFamily === fam ? " on" : ""}`, title: `${f.family} ${f.style}` });
    const nm = el("span", { className: "nm", textContent: `${f.family}${/^regular$/i.test(f.style) ? "" : " " + f.style}` });
    const smp = el("span", { className: "smp", textContent: f.vn ? "Nhà đẹp giá tốt 5 TỶ" : "Beautiful home 5 BIL" });
    nm.style.fontFamily = smp.style.fontFamily = `"${fontFace(f)}", sans-serif`;
    r.append(nm, smp, el("small", {}, `${f.family} · ${f.style} · ${f.nguon}`, ...(f.vn ? [] : [" · ", el("em", { textContent: "thiếu dấu Việt" })])));
    // Rê chuột: xem thử ngay trên video, chưa lưu.
    r.onmouseenter = () => previewFont(c, f);
    r.onmouseleave = () => previewFont(c, null);
    r._font = f;
    fontWatch.observe(r);
    r.onclick = () => apply(f);
    return el("div", { className: "fontItem" }, r, starBtn("font", f.id, f.family, () => { const y = list.scrollTop; draw(); list.scrollTop = y; }));
  };
  const draw = () => {
    state.fontQuery = search.value;
    const q = plain(search.value.trim());
    const seenKey = new Set();
    const all = (state.fontLib || []).filter((f) => {
      const k = `${f.family}|${f.style}`.toLowerCase();
      if (seenKey.has(k)) return false;
      seenKey.add(k);
      return !q || plain(`${f.family} ${f.style}`).includes(q);
    });
    const vn = all.filter((f) => f.vn), other = all.filter((f) => !f.vn);
    const by = (x, y) => x.family.localeCompare(y.family) || x.style.localeCompare(y.style);
    list.replaceChildren();
    if (!all.length) { list.append(el("p", { className: "hint", textContent: state.fontLib ? "Không tìm thấy font này." : "Đang quét font…" })); return; }
    // Vẽ dần theo cuộn để danh sách dài vẫn mượt.
    const rows = [["★ Yêu thích", all.filter((f) => isFav("font", f.id)).sort(by)], ["Có đủ dấu tiếng Việt", vn.sort(by)], ["Font nước ngoài, thiếu dấu Việt", other.sort(by)]].flatMap(([t, l]) => (l.length ? [{ head: `${t} (${l.length})` }, ...l] : []));
    let at = 0;
    const more = () => {
      for (const it of rows.slice(at, at + 60)) list.append(it.head ? el("h5", { textContent: it.head }) : row(it));
      at += 60;
    };
    more();
    list.onscroll = () => { if (at < rows.length && list.scrollTop + list.clientHeight > list.scrollHeight - 300) more(); };
  };
  search.oninput = draw;
  box.append(search, scope, el("div", { style: "height:4px" }), list);
  draw();
  if (state.fontScroll) { const y = state.fontScroll; while (list.scrollHeight < y + 400 && list.onscroll && list.children.length < 2000) { const n = list.children.length; list.scrollTop = list.scrollHeight; list.onscroll(); if (list.children.length === n) break; } list.scrollTop = y; state.fontScroll = 0; }
  return box;
}

function previewFont(c, f) {
  const doc = state.frame?.contentDocument;
  if (!doc) return;
  if (f) showClip(c);
  let st = doc.getElementById("hd-font-thu");
  if (!f) { st?.remove(); return; }
  if (!st) { st = doc.createElement("style"); st.id = "hd-font-thu"; doc.head.append(st); }
  const i = activeLayer(c);
  const tid = (i !== null && c.segments[i].layer) || c.id;
  st.textContent = `@font-face{font-family:"hd-thu";src:url("/vn/font-file?id=${encodeURIComponent(f.id)}")}#${tid},#${tid} *{font-family:"hd-thu"!important;font-synthesis-weight:none}`;
}

// ---- Lưu ----
// Khung xem bỏ id của thẻ style, nhận ra khối của Studio qua phần đầu nội dung.
// Máy xem trước có thể gộp khối kiểu của Studio vào cuối style của dự án. Khối gộp đó không cập nhật được
// nên kiểu cũ vẫn còn sau khi đổi: tách nó ra thành một thẻ riêng, chỉ giữ một khối duy nhất.
function studioStyle(doc) {
  const all = [...doc.querySelectorAll("style")];
  let own = all.find((x) => x.textContent.startsWith("/*hd:"));
  for (const st of all) {
    const i = st.textContent.indexOf("/*hd:");
    if (i <= 0) continue;
    const block = st.textContent.slice(i);
    st.textContent = st.textContent.slice(0, i);
    if (!own) { own = doc.createElement("style"); own.textContent = block; doc.head.append(own); }
  }
  return own;
}

// Xem trước tức thì: chưa lưu, chỉ đè CSS trong khung xem.
function previewLayer(c, patch, layerId) {
  const doc = state.frame?.contentDocument;
  if (!doc) return;
  showClip(c);
  const i = activeLayer(c);
  const id = layerId || (i === null ? c.id : c.segments[i].layer);
  if (!id) return;
  const next = { ...(state.model.overrides[id] || {}) };
  for (const [k, v] of Object.entries(patch)) { if (v === null || v === undefined) delete next[k]; else next[k] = v; }
  let st = doc.getElementById("hd-live");
  if (!st) { st = doc.createElement("style"); st.id = "hd-live"; doc.head.append(st); }
  st.textContent = overridesCss({ clips: { [id]: next }, fonts: {} });
  drawSel();
}
function clearLive() { state.frame?.contentDocument?.getElementById("hd-live")?.remove(); drawSel(); }

// Giữ nút để xem bản chưa chỉnh của clip, thả ra là về bản hiện tại.
function compareButton(c) {
  const b = el("button", { id: "compare", textContent: "◐ So sánh", title: "Giữ chuột để xem chữ khi chưa chỉnh, thả ra để xem bản hiện tại" });
  const flip = (on) => {
    const doc = state.frame?.contentDocument;
    if (!doc) return;
    showClip(c);
    b.classList.toggle("on", on);
    for (const st of [studioStyle(doc), doc.getElementById("hd-live")]) if (st?.sheet) st.sheet.disabled = on;
    drawSel();
  };
  b.onpointerdown = (e) => { b.setPointerCapture(e.pointerId); flip(true); };
  b.onpointerup = b.onpointercancel = () => flip(false);
  return b;
}

// Đổi màu/font/kiểu: thay CSS ngay trong khung xem, không tải lại.
function applyHot(hot) {
  const doc = state.frame?.contentDocument;
  if (!doc || !hot) return false;
  let st = studioStyle(doc);
  if (!st) { st = doc.createElement("style"); doc.head.append(st); }
  st.textContent = hot.css;
  clearLive();
  for (const v of hot.vars) doc.documentElement.style.setProperty(v.name, v.value);
  return true;
}

async function edit(op, body) {
  setStatus("Đang lưu…");
  try {
    const r = await post(`op/${op}`, body);
    if (r.hot && applyHot(r.hot)) await refresh(false);
    else await refresh();
    return r;
  } catch (e) {
    setStatus("Chưa lưu");
    toast(e.message, true);
    await refresh(true, true);
  }
}

async function refresh(reloadFrame = true, keepStatus) {
  const m = await api("model");
  state.model = m;
  state.lastMtime = m.mtime;
  setTimeout(() => { if ($("#tab-layers").classList.contains("on")) drawLayers(); });
  $("#undo").disabled = !m.canUndo;
  $("#redo").disabled = !m.canRedo;
  if (state.sel && !clipOf(state.sel)) state.sel = null;
  drawTimeline();
  drawProps();
  syncTools();
  drawVars();
  drawList();
  if (reloadFrame) loadFrame();
  else if (!keepStatus) setStatus("Đã lưu");
}

async function watchFile() {
  if (state.model && !document.hidden && Date.now() - (state.saveTick || 0) > 3000) {
    try {
      const { mtime } = await api("mtime");
      if (mtime !== state.lastMtime && Date.now() - (state.saveTick || 0) > 3000) { setStatus("AI vừa cập nhật, đang tải lại…"); await new Promise((r) => setTimeout(r, 800)); await refresh(); await loadCode(); }
    } catch { /* máy chủ đang bận */ }
  }
  setTimeout(watchFile, 1500);
}

// ---- SFX: nghe thử và thêm một nhấn ----
const sfxAudio = new Audio();
let sfxPlaying = null;

function stopSfx() {
  sfxAudio.pause();
  sfxPlaying?.classList.remove("on");
  if (sfxPlaying) sfxPlaying.textContent = "▶";
  sfxPlaying = null;
}
sfxAudio.onended = stopSfx;

async function loadSfx() {
  if (state.sfx) return drawSfx();
  $("#sfxHint").textContent = "Đang tải thư viện…";
  state.sfx = await fetch("/vn/sfx-list").then((r) => r.json());
  if (!state.sfx.roles?.length) { $("#sfxHint").textContent = "Chưa có thư viện SFX. Chọn thư mục ở Công cụ → Thư mục tài nguyên."; state.sfx = null; return; }
  const sel = $("#sfxGroup");
  const g1 = el("optgroup", { label: "Theo mục đích" }), g2 = el("optgroup", { label: "Theo thư mục" });
  for (const r of state.sfx.roles) g1.append(el("option", { value: `r:${r.key}`, textContent: `${r.label} (${r.paths.length})` }));
  const cats = {};
  for (const f of state.sfx.files) cats[f.cat] = (cats[f.cat] || 0) + 1;
  for (const k of Object.keys(cats).sort()) g2.append(el("option", { value: `c:${k}`, textContent: `${k} (${cats[k]})` }));
  sel.append(el("option", { value: "fav", textContent: "★ Yêu thích" }), el("option", { value: "all", textContent: `Tất cả (${state.sfx.files.length})` }), g1, g2);
  sel.value = `r:${state.sfx.roles[0].key}`;
  sel.onchange = drawSfx;
  $("#sfxSearch").oninput = drawSfx;
  drawSfx();
}

function drawSfx() {
  const s = state.sfx;
  if (!s) return;
  const byPath = (s.byPath ??= new Map(s.files.map((f) => [f.path, f])));
  const g = $("#sfxGroup").value, q = plain($("#sfxSearch").value.trim());
  let list;
  if (g === "fav") list = state.fav.sfx.map((p) => byPath.get(p)).filter(Boolean);
  else if (g === "all") list = s.files;
  else if (g[0] === "r") list = s.roles.find((r) => r.key === g.slice(2)).paths.map((p) => byPath.get(p)).filter(Boolean);
  else list = s.files.filter((f) => f.cat === g.slice(2));
  if (q) list = list.filter((f) => plain(f.path).includes(q));
  const c = clipOf(state.sel);
  const swap = c?.kind === "sfx";
  $("#sfxHint").textContent = swap ? `Đang chọn SFX trên timeline: bấm Thay để đổi âm, giữ đúng nhịp.` : `${list.length} âm. Bấm ▶ để nghe, Thêm để đặt đỉnh âm đúng playhead.`;
  const host = $("#sfxItems");
  host.replaceChildren();
  const row = (f) => {
    const play = el("button", { className: "play", textContent: "▶", title: "Nghe thử" });
    play.setAttribute("aria-label", `Nghe thử ${baseName(f.path)}`);
    play.onclick = () => {
      const again = sfxPlaying === play;
      stopSfx();
      if (again) return;
      sfxAudio.src = `/vn/sfx-file?path=${encodeURIComponent(f.path)}`;
      sfxAudio.play().catch(() => toast("Không phát được âm này", true));
      play.classList.add("on"); play.textContent = "■"; sfxPlaying = play;
    };
    const act = el("button", { className: "act", textContent: swap ? "Thay" : "Thêm", title: swap ? "Thay âm của SFX đang chọn" : "Thêm vào timeline tại playhead" });
    act.onclick = async () => {
      setStatus("Đang lưu…");
      try {
        const body = { path: f.path, time: state.time };
        if (clipOf(state.sel)?.kind === "sfx") body.replaceId = state.sel;
        const r = await post("sfx-add", body);
        await refresh();
        if (r.id) select(r.id);
      } catch (e) { setStatus("Chưa lưu"); toast(e.message, true); }
    };
    const info = el("span", { className: "nm", title: f.path }, baseName(f.path).replace(/\.[^.]+$/, ""), el("small", { textContent: `${f.dur.toFixed(2)} giây` }));
    return el("div", { className: "sfx" }, play, info, act, starBtn("sfx", f.path, baseName(f.path), () => { const y = $("#tab-sfx").scrollTop; drawSfx(); $("#tab-sfx").scrollTop = y; }));
  };
  let at = 0;
  const more = () => { host.append(...list.slice(at, at + 80).map(row)); at += 80; };
  more();
  const pane = $("#tab-sfx");
  pane.onscroll = () => { if (at < list.length && pane.scrollTop + pane.clientHeight > pane.scrollHeight - 300) more(); };
}

// ---- Bảng trái ----
for (const b of document.querySelectorAll(".tabs button")) {
  b.onclick = () => {
    document.querySelectorAll(".tabs button").forEach((x) => x.classList.toggle("on", x === b));
    document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("on", x.id === `tab-${b.dataset.tab}`));
    if (b.dataset.tab === "layers") drawLayers();
    if (b.dataset.tab === "history") drawHistory();
    if (b.dataset.tab === "code") loadCode();
    if (b.dataset.tab === "renders") loadRenders();
    if (b.dataset.tab === "sfx") loadSfx();
  };
}

async function loadAssets() {
  const { files } = await api("assets");
  const q = encodeURIComponent(state.project);
  $("#assets").replaceChildren(...files.map((f) => {
    const thumb = f.kind === "audio" ? el("span", { className: "ph", textContent: "♪" }) : el("img", { loading: "lazy", alt: "", src: `/vn/thumb?du-an=${q}&path=${encodeURIComponent(f.path)}&t=0` });
    const b = el("button", { className: "asset", title: f.path, draggable: f.kind !== "font" }, thumb, el("span", { className: "nm", textContent: baseName(f.path) }));
    b.addEventListener("dragstart", (ev) => { ev.dataTransfer.setData("text/hd-asset", f.path); ev.dataTransfer.effectAllowed = "copy"; });
    b.onclick = async () => {
      setStatus("Đang lưu…");
      try { const r = await post("add-asset", { path: f.path, time: state.time }); await refresh(); select(r.id); }
      catch (e) { toast(e.message, true); setStatus("Chưa lưu"); }
    };
    const del = el("button", { className: "assetDel", textContent: "×", title: "Xóa tệp (khôi phục được ở Lịch sử)" });
    del.setAttribute("aria-label", `Xóa ${baseName(f.path)}`);
    del.onclick = async (e) => { e.stopPropagation(); try { await post("xoa-tep", { path: f.path }); loadAssets(); drawHistory(); toast("Đã xóa, khôi phục được ở Lịch sử"); } catch (err) { toast(err.message, true); } };
    return el("div", { className: "assetWrap" }, b, del);
  }));
}

$("#upload").onchange = async (e) => {
  for (const file of e.target.files) {
    setStatus(`Đang tải ${file.name}…`);
    try { await api(`upload?ten=${encodeURIComponent(file.name)}`, { method: "POST", body: file }); }
    catch (err) { toast(err.message, true); }
  }
  e.target.value = "";
  setStatus("Đã lưu");
  loadAssets();
};

$("#addText").onclick = async () => {
  const r = await edit("add", { kind: "text", text: "Chữ mới", time: state.time, duration: 3, newId: "chu" });
  if (r?.id) select(r.id);
};

function drawVars() {
  $("#vars").replaceChildren(...state.model.vars.map((v) => {
    const isHex = /^#[0-9a-f]{6}$/i.test(v.value);
    const input = el("input", isHex ? { type: "color", value: v.value } : { type: "text", value: v.value });
    input.setAttribute("aria-label", v.name);
    input.onchange = () => edit("cssVar", { name: v.name, value: input.value });
    return el("div", { className: "var" }, input, el("span", { textContent: v.name.replace(/^--/, "") }));
  }));
  if (!state.model.vars.length) $("#vars").append(el("p", { className: "hint", textContent: "Dự án này chưa khai báo bảng màu chung." }));
}

async function loadCode() {
  const t = $("#code");
  if (document.activeElement === t) return;
  t.value = (await api("code")).content;
}
$("#saveCode").onclick = async () => {
  setStatus("Đang lưu…");
  try { await post("code", { content: $("#code").value }); await refresh(); toast("Đã lưu mã"); }
  catch (e) { setStatus("Chưa lưu"); toast(e.message, true); }
};

async function loadRenders() {
  const { files } = await api("renders");
  const q = encodeURIComponent(state.project);
  $("#renders").replaceChildren(...(files.length ? files.map((f) => el("div", { className: "render" },
    el("video", { controls: true, preload: "metadata", src: `/vn/final?du-an=${q}&thu-muc=${f.folder}&ten=${encodeURIComponent(f.name)}` }),
    el("div", { textContent: f.name }),
    el("div", { className: "hint", textContent: `${f.folder === "preview" ? "Nháp · " : ""}${(f.size / 1048576).toFixed(0)} MB · ${new Date(f.mtime).toLocaleString("vi-VN")}` }),
  )) : [el("p", { className: "hint", textContent: "Chưa có bản xuất nào." })]));
}
$("#openFolder").onclick = () => post("open-folder");

// ---- Xuất video ----
// Cửa sổ nào có trang trước thì gán modalBack ngay trước khi openModal.
let modalBack = null;
function openModal(...nodes) {
  const back = modalBack;
  modalBack = null;
  $("#modalBack").hidden = !back;
  $("#modalBack").onclick = back;
  $("#modalBody").replaceChildren(...nodes);
  $("#modalBody").scrollTop = 0;
  if (!$("#modal").open) $("#modal").showModal();
}
const closeModal = () => $("#modal").close();
$("#modalX").onclick = closeModal;

$("#export").onclick = async () => {
  const { job } = await fetch("/vn/render").then((r) => r.json());
  if (job?.status === "dang_chay") return watchRender();
  const fps = el("select");
  for (const f of [60, 50, 30]) fps.append(el("option", { value: f, textContent: `${f} khung/giây` }));
  const gpu = el("input", { type: "checkbox", checked: true });
  const m = state.model;
  const pick = (opts) => { const x = el("select"); for (const [v, t] of opts) x.append(el("option", { value: v, textContent: t })); return x; };
  const aspect = pick([["goc", `Giữ nguyên (${m.width}×${m.height})`], ["9:16", "9:16 TikTok, Reels, Shorts"], ["16:9", "16:9 YouTube"], ["1:1", "1:1 Vuông"], ["4:5", "4:5 Facebook, Instagram"], ["3:4", "3:4"], ["4:3", "4:3"], ["21:9", "21:9 Điện ảnh"]]);
  const res = pick([["goc", "Giữ nguyên"], ["720", "720p"], ["1080", "1080p Full HD"], ["1440", "1440p 2K"], ["2160", "2160p 4K"], ["tuy", "Tùy chỉnh rộng × cao"]]);
  const fit = pick([["mo", "Thêm nền mờ, giữ đủ hình"], ["cat", "Cắt cho đầy khung"], ["den", "Thêm viền đen"]]);
  const cw = el("input", { type: "number", min: 16, max: 7680, step: 2, value: m.width, placeholder: "Rộng" });
  const ch = el("input", { type: "number", min: 16, max: 7680, step: 2, value: m.height, placeholder: "Cao" });
  cw.setAttribute("aria-label", "Chiều rộng"); ch.setAttribute("aria-label", "Chiều cao");
  const customRow = field("Rộng × cao", el("div", { className: "pair" }, cw, ch));
  const fitRow = field("Khi lệch khung", fit);
  const outLine = el("p", { className: "hint" });
  const size = () => {
    if (res.value === "tuy") return [+cw.value, +ch.value];
    const r = aspect.value === "goc" ? m.width / m.height : aspect.value.split(":").reduce((a, b) => a / b);
    const side = res.value === "goc" ? Math.min(m.width, m.height) : +res.value;
    const even = (n) => Math.round(n / 2) * 2;
    if (aspect.value === "goc" && res.value === "goc") return [m.width, m.height];
    return r >= 1 ? [even(side * r), even(side)] : [even(side), even(side / r)];
  };
  const sync = () => {
    customRow.hidden = res.value !== "tuy";
    customRow.style.display = res.value === "tuy" ? "" : "none";
    aspect.disabled = res.value === "tuy";
    const [w, h] = size();
    const same = Math.abs(w / h - m.width / m.height) < 0.005;
    fitRow.style.display = same ? "none" : "";
    outLine.textContent = `Video xuất ra: ${w} × ${h}${Math.min(w, h) > Math.min(m.width, m.height) ? " (lớn hơn bản dựng nên sẽ phóng hình, không nét thêm)" : ""}`;
  };
  aspect.value = frameChoice().aspect;
  fit.value = frameChoice().fit;
  aspect.onchange = res.onchange = cw.oninput = ch.oninput = sync;
  const options = () => (res.value === "tuy" ? { width: +cw.value, height: +ch.value, fit: fit.value } : { aspect: aspect.value, short: res.value, fit: fit.value });
  const lint = await fetch(`/api/projects/${state.model.projectId}/lint`).then((r) => r.json()).catch(() => ({}));
  const errs = (lint.findings || []).filter((f) => f.severity === "error").length;
  const checks = [
    [errs === 0, errs ? `Còn ${errs} lỗi kỹ thuật (bấm Kiểm lỗi để xem)` : "Không có lỗi kỹ thuật"],
    [state.notes.length === 0, state.notes.length ? `Còn ${state.notes.length} ghi chú chưa xử lý` : "Không còn ghi chú nào"],
  ].map(([ok, t]) => el("div", { className: `check${ok ? "" : " bad"}`, textContent: `${ok ? "✓" : "!"} ${t}` }));
  const draft = el("button", { textContent: "Dựng nháp", title: "Nhanh, chất lượng thấp, lưu vào thư mục preview" });
  draft.onclick = async () => {
    try { await post("render", { fps: 30, gpu: false, quality: "draft", ...options() }); watchRender(); }
    catch (e) { toast(e.message, true); }
  };
  const go = el("button", { className: "primary", textContent: "Bắt đầu xuất" });
  const cancel = el("button", { textContent: "Đóng" });
  cancel.onclick = closeModal;
  go.onclick = async () => {
    try { await post("render", { fps: +fps.value, gpu: gpu.checked, quality: "delivery", ...options() }); watchRender(); }
    catch (e) { toast(e.message, true); }
  };
  openModal(el("h3", { textContent: "Xuất video cuối" }),
    el("p", { className: "hint", textContent: "H.264 chất lượng bàn giao, lưu vào thư mục final của dự án." }),
    ...checks, el("p"),
    field("Khung hình", aspect), field("Độ phân giải", res), customRow, fitRow, outLine,
    field("Tốc độ", fps), field("Dùng GPU", gpu),
    el("div", { className: "row" }, go, draft, cancel));
  sync();
};

async function watchRender() {
  const pct = el("i"), line = el("p", { className: "hint" }), bar = el("div", { className: "bar" }, pct);
  const stop = el("button", { textContent: "Dừng xuất" }), close = el("button", { textContent: "Ẩn" });
  close.onclick = closeModal;
  stop.onclick = () => fetch("/vn/render/cancel", { method: "POST" });
  const title = el("h3", { textContent: "Đang xuất video" });
  const extra = el("div");
  openModal(title, bar, line, extra, el("div", { className: "row" }, stop, close));
  for (;;) {
    const { job } = await fetch("/vn/render").then((r) => r.json());
    if (!job) return;
    pct.style.width = `${job.percent}%`;
    line.textContent = `${job.percent}% · ${job.gpu ? "GPU" : "CPU"} · ${Math.round(((job.finishedAt || Date.now()) - job.startedAt) / 1000)} giây`;
    $("#export").textContent = job.status === "dang_chay" ? `Đang xuất ${job.percent}%` : "Xuất video";
    if (job.status !== "dang_chay") {
      stop.remove();
      title.textContent = { xong: "Đã xuất xong", loi: "Xuất video bị lỗi", da_dung: "Đã dừng xuất" }[job.status];
      if (job.status === "xong") extra.replaceChildren(el("p", { className: "path", textContent: job.output }));
      if (job.status === "loi") extra.replaceChildren(el("p", { className: "err", textContent: job.log || "Không rõ lỗi" }));
      loadRenders();
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

// ---- Template ----
const ROLE_NAME = { hook: "Mở đầu", van_de: "Vấn đề", gia: "Giá", bang_chung: "Cảnh chứng minh", cta: "Kêu gọi", mo_bai: "Mở bài", cao_trao: "Cao trào", chot: "Chốt", giai_phap: "Giải pháp", vi_tri: "Vị trí", cam_xuc: "Cảm xúc", tien_ich: "Tiện ích", phan_tich_tinh_huong: "Phân tích", can_cu_phap_ly: "Pháp lý", huong_dan: "Hướng dẫn" };
const ROLE_COLOR = ["#a35d3b", "#3c6e9e", "#3f8f8a", "#6f5aa8", "#8a6d3b", "#3f8a5a", "#9a4f6c"];
const roleName = (r) => ROLE_NAME[r] || r.replace(/^cau_hoi_(\d+).*/, "Câu $1").replace(/_/g, " ");
const tplState = { filter: "all", data: null };

function syncTplBtn() {
  const c = tplState.data?.chon;
  $("#tplBtn").textContent = c ? `Template: ${c.ma}` : "Template";
  $("#tplBtn").classList.toggle("on", !!c);
}

async function pickTemplate(ma) {
  try {
    const r = await fetch("/vn/template-chon", { method: "POST", body: JSON.stringify({ ma }) }).then((x) => x.json());
    tplState.data.chon = r.chon;
    syncTplBtn();
    toast(r.chon ? `Video tiếp theo sẽ dựng theo ${r.chon.ma}` : "Đã bỏ chọn, AI sẽ tự chọn cách dựng");
  } catch { toast("Chưa lưu được lựa chọn", true); }
}

function tplPickButton(t, after) {
  const on = tplState.data.chon?.ma === t.ma;
  const b = el("button", { className: on ? "" : "primary", textContent: on ? "Bỏ chọn" : "Dùng cho video tiếp theo" });
  b.onclick = async () => { await pickTemplate(on ? null : t.ma); after(); };
  return b;
}

function drawTemplates() {
  const { templates } = tplState.data;
  const close = el("button", { textContent: "Đóng" });
  close.onclick = () => { $("#modal").classList.remove("wide"); closeModal(); };
  const chip = (k, name) => { const b = el("button", { textContent: name, className: `toggle${tplState.filter === k ? " on" : ""}` }); b.onclick = () => { tplState.filter = k; drawTemplates(); }; return b; };
  const kinds = [...new Set(templates.flatMap((t) => t.the_loai))];
  const onDrive = templates.filter((t) => t.drive).length;
  // Nút này cho biết đã nối được bao nhiêu video.
  const driveBtn = el("button", { textContent: onDrive ? `Drive: ${onDrive}/${templates.length}` : "Nối Google Drive" });
  driveBtn.onclick = drawDriveLink;
  const list = templates.filter((t) => tplState.filter === "all" || (tplState.filter === "fav" ? isFav("template", t.ma) : t.the_loai.includes(tplState.filter)));
  const cards = list.map((t) => {
    const img = el("img", { src: `/vn/template-anh?ma=${encodeURIComponent(t.ma)}`, alt: `Khung hình mẫu ${t.ma}`, loading: "lazy" });
    img.onclick = () => drawTemplateDetail(t);
    const see = el("button", { textContent: "▶ Xem trước" });
    see.onclick = () => drawTemplateDetail(t);
    return el("div", { className: `tplCard${tplState.data.chon?.ma === t.ma ? " on" : ""}` }, img, starBtn("template", t.ma, t.ma, drawTemplates),
      el("div", { className: "bd" }, el("b", { textContent: `${t.ma} · ${t.ten}` }),
        el("small", { textContent: [t.thoi_luong && `${Math.round(t.thoi_luong)} giây`, t.shot && `cảnh TB ${t.shot} giây`, t.bpm && `${Math.round(t.bpm)} BPM`].filter(Boolean).join(" · ") }),
        el("small", { textContent: t.hook }),
        el("div", { className: "row" }, see, tplPickButton(t, drawTemplates))));
  });
  $("#modal").classList.add("wide");
  openModal(el("div", { className: "tplTop" }, el("h3", { textContent: "Chọn template" }), chip("all", "Tất cả"), chip("fav", "★ Yêu thích"), ...kinds.map((k) => chip(k, k)), el("span", { className: "grow" }), driveBtn, close),
    cards.length ? el("div", { className: "tplGrid" }, ...cards) : el("p", { className: "hint", textContent: "Chưa có template nào ở mục này. Bấm ngôi sao trên template để lưu vào đây." }));
}

function drawDriveLink() {
  const input = el("input", { type: "url", placeholder: "https://drive.google.com/drive/folders/…", style: "width:100%;background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:6px" });
  input.setAttribute("aria-label", "Link thư mục Drive");
  const msg = el("p", { className: "hint", textContent: "Dán link thư mục Template_Video đã chia sẻ “Bất kỳ ai có đường liên kết”. Studio tự tìm và khớp từng video." });
  const go = el("button", { className: "primary", textContent: "Nối" }), back = el("button", { textContent: "← Danh sách" });
  back.onclick = drawTemplates;
  go.onclick = async () => {
    msg.textContent = "Đang đọc thư mục…";
    try {
      const r = await fetch("/vn/drive-sync", { method: "POST", body: JSON.stringify({ url: input.value.trim() }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      tplState.data = await fetch("/vn/templates").then((x) => x.json());
      const miss = tplState.data.templates.filter((t) => !t.drive).map((t) => t.ma);
      toast(`Đã nối ${Object.keys(d.found).length} video từ Drive`);
      if (miss.length) msg.textContent = `Đã nối ${Object.keys(d.found).length} video. Còn thiếu: ${miss.join(", ")}.`;
      else drawTemplates();
    } catch (e) { msg.textContent = e.message; }
  };
  modalBack = drawTemplates;
  openModal(el("h3", { textContent: "Nối Google Drive" }), msg, input, el("p"), el("div", { className: "row" }, go, back));
}

function drawTemplateDetail(t) {
  const back = el("button", { textContent: "← Danh sách" });
  back.onclick = drawTemplates;
  const id = /video\/(\d+)/.exec(t.url || "")?.[1];
  const video = el("div", { className: "tplVideo" });
  // Nguồn xem: máy trước, rồi Drive, cuối cùng TikTok; bấm đổi được khi một nguồn lỗi.
  const sources = [
    t.co_may && ["Máy", () => el("video", { src: `/vn/template-video?ma=${encodeURIComponent(t.ma)}`, controls: true, autoplay: true, playsInline: true })],
    t.drive && ["Drive", () => el("iframe", { src: `https://drive.google.com/file/d/${t.drive}/preview`, title: `Drive ${t.ma}`, allow: "autoplay; fullscreen" })],
    id && ["TikTok", () => el("iframe", { src: `https://www.tiktok.com/embed/v2/${id}`, title: `TikTok ${t.ma}`, allow: "autoplay; encrypted-media; fullscreen" })],
  ].filter(Boolean);
  const srcRow = el("div", { className: "row" });
  const show = (i) => {
    video.replaceChildren(sources[i][1]());
    [...srcRow.children].forEach((b, k) => b.classList.toggle("on", k === i));
  };
  sources.forEach(([name], i) => { const b = el("button", { className: "toggle", textContent: name }); b.onclick = () => show(i); srcRow.append(b); });
  if (sources.length) show(0);
  else video.append(el("p", { className: "hint", textContent: "Mẫu này chưa có video." }));
  const total = t.thoi_luong || 1;
  const bar = el("div", { className: "rhythm" }, ...t.doan.map((d, i) => {
    const seg = el("i", { textContent: roleName(d.vai_tro), title: `${roleName(d.vai_tro)}: ${d.tu}–${d.den} giây` });
    seg.style.width = `${((d.den - d.tu) / total) * 100}%`;
    seg.style.background = ROLE_COLOR[i % ROLE_COLOR.length];
    return seg;
  }));
  const ev = t.su_kien;
  const info = el("div", { className: "tplInfo" },
    el("div", { className: "tplTop" }, el("h3", { textContent: `${t.ma} · ${t.ten}` }), starBtn("template", t.ma, t.ma, () => drawTemplateDetail(t))),
    el("small", { className: "hint", textContent: t.chi_so }),
    el("p", { className: "hint", textContent: "Nhịp dựng của mẫu" }), bar,
    el("p", { className: "hint", textContent: `${ev.cat ?? 0} cú cắt · ${ev.chu ?? 0} chữ · ${ev.mg ?? 0} đồ họa · ${ev.sfx ?? 0} SFX` }),
    el("div", { className: "row" }, tplPickButton(t, () => drawTemplateDetail(t)), back, ...(t.url ? [el("a", { href: t.url, target: "_blank", rel: "noreferrer", textContent: "Mở trên TikTok" })] : [])),
    el("img", { src: `/vn/template-anh?ma=${encodeURIComponent(t.ma)}`, alt: `Toàn bộ khung hình ${t.ma}`, onerror: (e) => { const i = e.target; if (!i.dataset.thu) { i.dataset.thu = 1; setTimeout(() => (i.src = i.src + "&lai=1"), 800); } } }),
    el("pre", { textContent: t.the.replace(/\*\*/g, "").replace(/^#.*\n/, "") }));
  modalBack = drawTemplates;
  openModal(el("div", { className: "tplDetail" }, el("div", { className: "tplVideoBox" }, srcRow, video), info));
}

$("#tplBtn").onclick = async () => {
  if (!tplState.data) { try { tplState.data = await fetch("/vn/templates").then((r) => r.json()); } catch { return toast("Không đọc được kho template", true); } }
  drawTemplates();
  // Đã nối thư mục thì tự nhận video mới tải lên Drive.
  if (!tplState.data.co_thu_muc_drive) return;
  const before = tplState.data.templates.filter((t) => t.drive).length;
  const r = await fetch("/vn/drive-sync", { method: "POST", body: "{}" }).catch(() => null);
  if (!r?.ok) return;
  tplState.data = await fetch("/vn/templates").then((x) => x.json());
  if (tplState.data.templates.filter((t) => t.drive).length !== before && $("#modal").open && $(".tplGrid")) drawTemplates();
};

// ---- Yêu cầu AI ----
const ai = { session: null, shown: 0, polling: false, files: [] };

function aiLine(kind, text) { $("#aiLines").append(el("div", { className: kind, textContent: text })); $("#aiLines").scrollTop = 1e9; }

async function aiPoll() {
  if (ai.polling) return;
  ai.polling = true;
  try {
    for (;;) {
      const { job } = await fetch("/vn/ai").then((r) => r.json());
      if (!job) break;
      for (const l of job.lines.slice(ai.shown)) aiLine(l.kind, l.text);
      ai.shown = job.lines.length;
      if (job.images?.length && !ai.imagesShown) {
        ai.imagesShown = true;
        $("#aiLines").append(el("div", { className: "shots" }, ...job.images.map((f) => {
          const img = el("img", { src: `/vn/ai-anh?du-an=${encodeURIComponent(state.project)}&f=${encodeURIComponent(f)}`, alt: "Khung hình gửi kèm AI" });
          img.onclick = () => window.open(img.src, "_blank");
          return img;
        })));
        $("#aiLines").scrollTop = 1e9;
      }
      ai.session = job.sessionId;
      if (job.status !== "dang_chay") {
        setAiBusy(false);
        if (job.status === "xong" && !job.lines.some((l) => l.kind === "ai")) aiLine("ai", "Xong.");
        ai.phienAt = (await api("phien")).at;
        if (job.changed) { await refresh(); aiLine("tool", "Đã cập nhật khung xem. Bấm Hoàn tác nếu chưa ưng."); }
        if (job.status === "loi" && job.project === state.project) {
          state.notes = (await post("notes", { time: state.time, clip: state.sel, text: job.text })).notes;
          drawTimeline(); drawList();
          aiLine("tool", "Đã lưu yêu cầu thành Ghi chú cho AI để xử lý sau.");
        }
        break;
      }
      await new Promise((r) => setTimeout(r, 700));
    }
  } finally { ai.polling = false; }
}

function setAiBusy(on) {
  $("#aiBar").classList.toggle("busy", on);
  $("#aiSend").textContent = on ? "Dừng" : "Gửi";
  $("#aiChatSend").textContent = on ? "Dừng" : "Gửi";
}
// Gửi một yêu cầu; cùng dùng cho thanh AI, khung chat và menu chuột phải.
async function aiSend(text, { clip = state.sel } = {}) {
  text = text.trim();
  if (!text) return false;
  $("#aiLog").hidden = false;
  aiLine("me", text);
  try {
    const tep = ai.files.map((f) => f.info);
    const { job } = await post("ai", { text, time: state.time, clip, range: state.range, shots: aiShots(), session: ai.session, sessionCwd: ai.sessionCwd, chat: ai.chat, tep, hien: tep.length ? `${text} (kèm ${tep.length} tệp)` : text });
    ai.files = [];
    drawAiFiles();
    ai.shown = 0;
    ai.imagesShown = false;
    setAiBusy(true);
    ai.session = job.sessionId;
    ai.chat = job.chatId;
    aiPoll();
    return true;
  } catch (err) { aiLine("err", err.message); return false; }
}
const aiStop = () => fetch("/vn/ai/stop", { method: "POST" });
$("#aiBar").onsubmit = async (e) => {
  e.preventDefault();
  stopMics();
  if ($("#aiBar").classList.contains("busy")) return aiStop();
  if (await aiSend($("#aiInput").value)) $("#aiInput").value = "";
};
$("#aiChat").onsubmit = async (e) => {
  e.preventDefault();
  stopMics();
  if ($("#aiBar").classList.contains("busy")) return aiStop();
  if (await aiSend($("#aiChatInput").value)) { $("#aiChatInput").value = ""; }
};
// Enter để gửi, Shift+Enter xuống dòng; đang gõ dấu tiếng Việt thì không gửi nhầm.
const enterSends = (box, form) => box.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
  e.preventDefault();
  form.requestSubmit();
});
enterSends($("#aiInput"), $("#aiBar"));
enterSends($("#aiChatInput"), $("#aiChat"));

// Lịch sử chat trong Studio và các phiên Claude Code trên máy.
function showChat(lines) {
  $("#aiLines").replaceChildren();
  for (const l of lines) aiLine(l.kind, l.text);
}
async function drawAiHistory() {
  const box = $("#aiLines");
  ai.xemLichSu = true;
  const [chats, claude] = await Promise.all([api("chat-list"), fetch("/vn/phien-claude").then((r) => r.json())]);
  const when = (t) => new Date(t).toLocaleString("vi-VN");
  const pick = (title, sub, fn) => { const b = el("button", { className: "aiPick", type: "button" }, title, el("small", { textContent: sub })); b.onclick = fn; return b; };
  box.replaceChildren(el("h4", { textContent: "Chat trong Studio" }),
    ...(chats.items.length ? chats.items.map((c) => pick(c.title || "(không có tiêu đề)", when(c.at), async () => {
      const d = await api(`chat-doc?id=${encodeURIComponent(c.id)}`);
      ai.xemLichSu = false;
      ai.chat = d.id; ai.session = d.session || null; ai.sessionCwd = d.cwd || null;
      showChat(d.lines);
    })) : [el("p", { className: "hint", textContent: "Chưa có cuộc chat nào." })]),
    el("h4", { textContent: "Phiên Claude trên máy" }),
    el("p", { className: "hint", textContent: "Đọc và làm tiếp ngay tại đây. Không nên chat tiếp một phiên đang chạy ở cửa sổ khác." }),
    ...claude.items.map((c) => pick(c.title, `${when(c.at)} · ${c.cwd}`, async () => {
      const d = await fetch(`/vn/phien-claude-doc?id=${encodeURIComponent(c.id)}`).then((r) => r.json());
      ai.xemLichSu = false;
      ai.chat = null; ai.session = d.id; ai.sessionCwd = d.cwd;
      showChat(d.lines);
      aiLine("tool", "Đang nối với phiên Claude này. Tin nhắn tiếp theo sẽ gửi vào phiên đó.");
    })));
}
$("#aiHist").onclick = () => drawAiHistory().catch((e) => toast(e.message, true));
$("#aiCopy").onclick = async () => {
  const text = $("#aiInput").value.trim();
  if (!text) return toast("Hãy nhập yêu cầu trước");
  const { prompt } = await post("ai-prompt", { text, time: state.time, clip: state.sel, range: state.range });
  await navigator.clipboard.writeText(prompt).then(() => toast("Đã sao chép, dán vào AI bất kỳ"), () => toast("Trình duyệt chặn sao chép", true));
};
$("#askAi").onclick = () => { $("#aiInput").focus(); drawAiCtx(); };
$("#rangeBtn").onclick = (e) => {
  state.rangeMode = !state.rangeMode;
  e.target.classList.toggle("on", state.rangeMode);
  if (!state.rangeMode && state.range) { state.range = null; drawRange(); }
  toast(state.rangeMode ? "Kéo trên thước thời gian để chọn vùng" : "Đã tắt chọn vùng");
};
$("#aiHide").onclick = () => ($("#aiLog").hidden = true);
// Khung AI: kéo đầu khung để dời, kéo góc dưới phải để đổi cỡ, nhớ vị trí cho lần sau.
const aiBox = $("#aiLog");
const saveAiBox = () => saveUi({ ...readUi(), aiBox: { l: aiBox.offsetLeft, t: aiBox.offsetTop, w: aiBox.offsetWidth, h: aiBox.classList.contains("min") ? null : aiBox.offsetHeight, min: aiBox.classList.contains("min") } });
try {
  const k = readUi().aiBox;
  if (k) { aiBox.style.left = `${k.l}px`; aiBox.style.top = `${k.t}px`; aiBox.style.width = `${k.w}px`; if (k.h) aiBox.style.height = `${k.h}px`; aiBox.classList.toggle("min", !!k.min); }
} catch { /* bỏ qua */ }
$("#aiMin").onclick = () => { aiBox.classList.toggle("min"); $("#aiMin").textContent = aiBox.classList.contains("min") ? "+" : "–"; saveAiBox(); };
$("#aiMin").textContent = aiBox.classList.contains("min") ? "+" : "–";
new ResizeObserver(() => { if (!aiBox.hidden) saveAiBox(); }).observe(aiBox);
$("#aiHead").addEventListener("pointerdown", (e) => {
  if (e.target.closest("button")) return;
  const wrap = $("#stageWrap").getBoundingClientRect();
  const sx = e.clientX - aiBox.offsetLeft, sy = e.clientY - aiBox.offsetTop;
  $("#aiHead").setPointerCapture(e.pointerId);
  const move = (ev) => {
    aiBox.style.left = `${Math.max(0, Math.min(wrap.width - 80, ev.clientX - sx))}px`;
    aiBox.style.top = `${Math.max(0, Math.min(wrap.height - 32, ev.clientY - sy))}px`;
  };
  $("#aiHead").addEventListener("pointermove", move);
  $("#aiHead").addEventListener("pointerup", () => { $("#aiHead").removeEventListener("pointermove", move); saveAiBox(); }, { once: true });
});
$("#aiNew").onclick = async () => { await post("phien-moi"); ai.session = null; ai.sessionCwd = null; ai.chat = null; ai.phienAt = null; ai.xemLichSu = false; $("#aiLines").replaceChildren(); toast("Tin nhắn tiếp theo sẽ mở phiên Claude mới cho dự án"); };
// Phiên Claude của dự án: mở lại dự án là thấy tiếp cuộc chat, tin nhắn gửi từ Claude cũng tự hiện ở đây.
async function syncPhien() {
  const d = await api("phien");
  if (!d.id || $("#aiBar").classList.contains("busy") || ai.xemLichSu || d.at === ai.phienAt) return;
  if (ai.session && d.id !== ai.session) return;
  ai.session = d.id; ai.sessionCwd = d.cwd; ai.chat = d.chat; ai.phienAt = d.at;
  showChat(d.lines);
}
setInterval(() => { if (state.project && !$("#aiLog").hidden) syncPhien().catch(() => {}); }, 4000);
// Cho biết tin nhắn sẽ vào phiên Claude đang mở hay phiên riêng của dự án.
async function syncNoi() {
  if (!state.project) return;
  const { ds, chon, dang } = await api("cau-noi");
  const b = $("#aiNoi");
  const cur = ds.find((x) => x.id === dang);
  b.classList.toggle("on", !!cur);
  if (document.activeElement === b) return;
  const opt = (value, textContent) => el("option", { value, textContent, selected: value === chon });
  b.replaceChildren(opt("auto", cur && chon === "auto" ? `● Tự động: ${cur.ten}` : "Tự động: chưa có phiên nối"), ...ds.map((x) => opt(x.id, x.ten)), opt("rieng", "Phiên riêng của dự án"));
}
$("#aiNoi").onchange = (e) => { post("cau-noi-chon", { chon: e.target.value }).then(() => { e.target.blur(); return syncNoi(); }).catch((err) => toast(err.message, true)); };
syncNoi().catch(() => {});
setInterval(() => syncNoi().catch(() => {}), 4000);
$("#aiLink").onclick = async () => {
  const d = await api("phien");
  if (!d.lenh) return toast("Dự án chưa có phiên Claude. Gửi tin nhắn đầu tiên để tạo.");
  await navigator.clipboard.writeText(d.lenh).then(() => toast("Đã chép lệnh, dán vào PowerShell để mở phiên này"), () => toast(d.lenh));
};

// ---- CapCut: nhãn dán, hiệu ứng, chuyển tiếp ----
const cc = { items: null, loai: "Hiệu ứng", nhom: "", q: "" };
async function openCapcut() {
  if (!cc.items) {
    try { cc.items = (await fetch("/vn/capcut-list").then((r) => r.json())).items; }
    catch { return toast("Không đọc được danh mục CapCut", true); }
  }
  drawCapcut();
}
// Thêm thẳng vào timeline, không cần AI. Chuyển tiếp tự canh vào điểm cắt gần playhead nếu có.
async function applyCapcut(x) {
  const start = state.range ? state.range[0] : state.time;
  const len = state.range ? state.range[1] - state.range[0] : 0;
  let r;
  if (x.loai === "Nhãn dán") {
    try {
      const a = await post("capcut-nhan-dan", { id: x.id });
      r = await edit("add", { kind: "image", src: a.src, ten: a.ten, sticker: true, time: start, duration: len || 3, newId: "nhan-dan" });
    } catch (e) { return toast(e.message, true); }
  } else {
    let time = start, duration = len;
    if (x.loai === "Chuyển tiếp" && !len) {
      duration = 0.6;
      const cuts = state.model.clips.filter((c) => c.kind === "video").flatMap((c) => [c.start, c.end]).filter((t) => t > 0);
      const near = cuts.sort((a, b) => Math.abs(a - start) - Math.abs(b - start))[0];
      time = Math.max(0, (near !== undefined && Math.abs(near - start) <= 1.5 ? near : start) - duration / 2);
    }
    r = await edit("addFx", { ten: x.ten, nhom: x.nhom, loai: x.loai, time, duration: duration || undefined });
  }
  if (r?.id) { const at = state.model?.clips.find((c) => c.id === r.id)?.start ?? start; seek(at); $("#tracksScroll").scrollLeft = Math.max(0, at * state.pxPerSec - 120); toast(`Đã thêm “${x.ten}” vào timeline`); }
}
function drawCapcut() {
  const tabs = el("div", { className: "row" }, ...["Nhãn dán", "Hiệu ứng", "Chuyển tiếp"].map((l) => { const b = el("button", { className: `toggle${cc.loai === l ? " on" : ""}`, textContent: `${l} (${cc.items.filter((x) => x.loai === l).length})` }); b.onclick = () => { cc.loai = l; cc.nhom = ""; drawCapcut(); }; return b; }));
  const groups = [...new Set(cc.items.filter((x) => x.loai === cc.loai).map((x) => x.nhom))];
  const sel = el("select");
  sel.setAttribute("aria-label", "Nhóm");
  sel.append(el("option", { value: "", textContent: "Tất cả nhóm" }), el("option", { value: "★", textContent: "★ Yêu thích", selected: cc.nhom === "★" }), ...groups.map((g) => el("option", { value: g, textContent: g, selected: g === cc.nhom })));
  sel.onchange = () => { cc.nhom = sel.value; drawGrid(); };
  const search = el("input", { type: "search", placeholder: "Tìm theo tên…", value: cc.q });
  search.setAttribute("aria-label", "Tìm trong CapCut");
  search.oninput = () => { cc.q = search.value; drawGrid(); };
  const note = el("textarea", { placeholder: "Ghi thêm cho AI nếu muốn (không bắt buộc)", style: "width:100%;background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:6px;min-height:36px" });
  note.setAttribute("aria-label", "Ghi chú cho AI");
  const hint = el("p", { className: "hint", textContent: "Bấm một mục là thêm ngay vào timeline tại " + (state.range ? "vùng đã chọn" : "playhead") + ", kéo clip để căn chỉnh. Tệp của CapCut chạy bằng engine riêng nên hiệu ứng được dựng gần giống. Có ghi chú thì AI sẽ dựng theo ghi chú." });
  const grid = el("div", { className: "ccGrid" });
  const drawGrid = () => {
    const q = plain(cc.q.trim());
    const list = cc.items.filter((x) => x.loai === cc.loai && (!cc.nhom || (cc.nhom === "★" ? isFav("capcut", x.id) : x.nhom === cc.nhom)) && (!q || plain(x.ten).includes(q)));
    grid.replaceChildren();
    let at = 0;
    const more = () => {
      for (const x of list.slice(at, at + 60)) {
        const card = el("div", { className: "ccCard", title: `${x.ten} · ${x.nhom}` }, el("img", { src: x.anh, alt: "", loading: "lazy", onerror: (e) => { if (x.anh_tinh && e.target.src !== x.anh_tinh) e.target.src = x.anh_tinh; } }), starBtn("capcut", x.id, x.ten, drawGrid), el("div", { className: "bd", textContent: x.ten }));
        card.onclick = async (e) => {
          if (e.target.closest(".star")) return;
          closeModal();
          if (!note.value.trim()) return applyCapcut(x);
          $("#aiLog").hidden = false;
          aiLine("me", `Áp dụng ${x.loai.toLowerCase()} CapCut “${x.ten}”`);
          try {
            const { job } = await post("ai", { text: note.value.trim(), capcut: x.id, time: state.time, clip: state.sel, range: state.range, shots: aiShots(), session: ai.session });
            ai.shown = 0; ai.imagesShown = false; ai.session = job.sessionId; ai.chat = job.chatId;
            setAiBusy(true);
            aiPoll();
          } catch (err) { aiLine("err", err.message); }
        };
        grid.append(card);
      }
      at += 60;
    };
    more();
    grid.onscroll = () => { if (at < list.length && grid.scrollTop + grid.clientHeight > grid.scrollHeight - 300) more(); };
  };
  $("#modal").classList.add("wide");
  openModal(el("h3", { textContent: "Danh mục CapCut" }), tabs, el("div", { className: "mgFilters", style: "margin-top:8px" }, search, sel), hint, note, el("div", { style: "height:8px" }), grid);
  drawGrid();
}
$("#capcutBtn").onclick = openCapcut;

// ---- Giao diện: sáng tối, màu, hình nền, ẩn bảng ----
const THEMES = {
  toi: { "--bg": "#111317", "--panel": "#1a1d23", "--panel2": "#23272f", "--line": "#30353f", "--text": "#e9ebef", "--muted": "#9aa1ad", "--stage": "#0b0c0f" },
  sang: { "--bg": "#f4f5f7", "--panel": "#ffffff", "--panel2": "#eceef2", "--line": "#d5d8df", "--text": "#1b1e24", "--muted": "#5f6672", "--stage": "#dfe2e8" },
  xam: { "--bg": "#26282c", "--panel": "#32353a", "--panel2": "#3d4147", "--line": "#4b5058", "--text": "#eceef1", "--muted": "#aeb4bd", "--stage": "#1d1f22" },
};
// Rút màu từ ảnh: sáng hay tối, màu bảng theo tông ảnh, màu nhấn là màu rực phổ biến nhất.
function paletteFromImage(src, isVideo) {
  return new Promise((ok, fail) => {
    const img = isVideo ? document.createElement("video") : new Image();
    img.onerror = () => fail(new Error(isVideo ? "Trình duyệt không phát được video này, hãy dùng MP4 H.264" : "Không đọc được ảnh"));
    const run = () => {
      const n = 64, cv = document.createElement("canvas");
      cv.width = cv.height = n;
      const g = cv.getContext("2d", { willReadFrequently: true });
      g.drawImage(img, 0, 0, n, n);
      const d = g.getImageData(0, 0, n, n).data;
      let sr = 0, sg = 0, sb = 0, sl = 0;
      const bins = Array.from({ length: 24 }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
      for (let i = 0; i < d.length; i += 4) {
        const [r, gr, b] = [d[i], d[i + 1], d[i + 2]];
        sr += r; sg += gr; sb += b;
        sl += (0.299 * r + 0.587 * gr + 0.114 * b) / 255;
        const max = Math.max(r, gr, b), min = Math.min(r, gr, b), c = max - min;
        if (c < 40 || max < 60) continue;
        let h = max === r ? ((gr - b) / c + 6) % 6 : max === gr ? (b - r) / c + 2 : (r - gr) / c + 4;
        const bin = bins[Math.floor((h / 6) * 24) % 24], w = c / 255;
        bin.w += w; bin.r += r * w; bin.g += gr * w; bin.b += b * w;
      }
      const px = n * n, lum = sl / px, mode = lum > 0.58 ? "sang" : "toi";
      const hex = (r, gr, b) => "#" + [r, gr, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
      // Màu bảng: tông trung bình của ảnh, kéo về rất tối hoặc rất sáng để chữ dễ đọc.
      const [ar, ag, ab] = [sr / px, sg / px, sb / px];
      const k = mode === "sang" ? 0.2 : 0.22;
      const panel = mode === "sang" ? hex(255 - (255 - ar) * k, 255 - (255 - ag) * k, 255 - (255 - ab) * k) : hex(ar * k + 10, ag * k + 10, ab * k + 10);
      const top = bins.reduce((a, b) => (b.w > a.w ? b : a));
      let accent = "#e8b64c";
      if (top.w > 0) {
        const [r, gr, b] = [top.r / top.w, top.g / top.w, top.b / top.w];
        const max = Math.max(r, gr, b) || 1, boost = mode === "sang" ? Math.min(1, 170 / max) : 235 / max;
        accent = hex(r * boost, gr * boost, b * boost);
      }
      ok({ mode, panel, accent });
    };
    if (isVideo) {
      img.muted = true;
      img.preload = "auto";
      img.onloadeddata = () => { img.currentTime = Math.min(1, (img.duration || 0) / 2); };
      img.onseeked = run;
    } else img.onload = run;
    img.src = src;
  });
}

function readUi() { return { ...uiCache }; }
function saveUi(ui) {
  uiCache = ui;
  fetch("/vn/giao-dien", { method: "POST", body: JSON.stringify(ui) }).catch(() => toast("Chưa lưu được giao diện", true));
}
function stageGlassOf(ui) { return ui.stageGlass ?? (ui.stage ? 0 : 100); }
// Chỉ đổi trong khung xem của Studio, video xuất vẫn giữ nền gốc.
function syncFrameGlass(ui = readUi()) {
  const doc = state.frame?.contentDocument;
  if (!doc?.head) return;
  let st = doc.getElementById("hd-glass");
  if (!ui.bg) { st?.remove(); return; }
  if (!st) { st = doc.createElement("style"); st.id = "hd-glass"; st.textContent = "html, body { background: transparent !important; }"; doc.head.append(st); }
}
// Lớp nền nằm sau toàn bộ Studio. Video giữ nguyên đang phát nếu tệp không đổi.
function drawUiBg(ui) {
  const box = $("#uiBg");
  box.classList.toggle("phu", (ui.bgFit || (ui.bgKind ? "dung" : "phu")) === "phu");
  if (!ui.bg) { box.replaceChildren(); return; }
  if (box.dataset.src !== ui.bg || !box.firstChild) {
    box.dataset.src = ui.bg;
    if (ui.bgKind === "video") {
      const v = el("video", { src: ui.bg, loop: true, autoplay: true, playsInline: true });
      v.muted = true;
      box.replaceChildren(v);
      v.play().catch(() => {});
    } else box.replaceChildren(el("img", { src: ui.bg, alt: "" }));
  }
  const v = box.querySelector("video");
  if (!v) return;
  // Mặc định không có tiếng, chỉ phát tiếng khi người dùng bật trong Giao diện.
  v.volume = (ui.bgVol ?? 50) / 100;
  v.muted = !ui.bgSound;
  if (ui.bgSound) v.play().catch(() => {
    // Trình duyệt chặn tự phát có tiếng lúc mới mở: phát không tiếng, bấm lần đầu sẽ có tiếng.
    v.muted = true;
    v.play().catch(() => {});
    document.addEventListener("pointerdown", () => { if (readUi().bgSound) v.muted = false; }, { once: true });
  });
}
const XUYEN_VUNG = [["top", "#top", "Thanh trên"], ["left", "#left", "Bảng trái"], ["right", "#right", "Bảng thuộc tính"], ["stage", "#stage", "Khung xem"], ["ai", "#aiBar,#aiCtx", "Thanh AI"], ["transport", "#transport", "Thanh phát"], ["timeline", "#timeline", "Timeline"]];
const XUYEN_KIEU = [["thongminh", "Thông minh"], ["trong", "Trong hẳn"], ["mo", "Làm mờ"]];
function applyXuyen(ui) {
  for (const [k, sel] of XUYEN_VUNG) {
    const v = ui.xuyen?.[k];
    for (const n of document.querySelectorAll(sel)) { if (v && v !== "thongminh") n.dataset.xuyen = v; else delete n.dataset.xuyen; }
  }
  const stageClear = ui.xuyen?.stage === "trong";
  if (stageClear) document.documentElement.style.setProperty("--frame-glass", "transparent");
  $("#xuyenBtn").classList.toggle("on", Object.values(ui.xuyen || {}).some((v) => v !== "thongminh"));
}
function drawXuyenMenu() {
  const ui = readUi(), menu = $("#xuyenMenu");
  if (!ui.bg) { menu.replaceChildren(el("b", { textContent: "Chưa có nền" }), el("p", { textContent: "Vào Giao diện, chọn ảnh hoặc video nền trước." })); return; }
  const set = (p) => { const n = { ...readUi(), xuyen: p }; saveUi(n); applyUi(n); drawXuyenMenu(); };
  const reset = el("button", { textContent: "Đưa tất cả về Thông minh" });
  reset.onclick = () => set({});
  menu.replaceChildren(el("b", { textContent: "Nhìn xuyên theo từng vùng" }), el("p", { textContent: "Thông minh: vùng trống thì trong hẳn, vùng có nội dung thì mờ. Tự lưu." }),
    ...XUYEN_VUNG.map(([k, , name]) => el("div", { className: "xuyenRow" }, el("span", { textContent: name }), el("div", { className: "pill" }, ...XUYEN_KIEU.map(([v, t]) => { const b = el("button", { textContent: t, className: (ui.xuyen?.[k] || "thongminh") === v ? "on" : "" }); b.onclick = () => set({ ...ui.xuyen, [k]: v }); return b; })))),
    reset);
}
$("#xuyenMenu").onclick = (e) => e.stopPropagation(); // Menu vẽ lại khi chọn, không để lệnh đóng ở ngoài bắt nhầm.
function closeXuyen() { $("#xuyenMenu").hidden = true; $("#xuyenBtn").setAttribute("aria-expanded", "false"); }
$("#xuyenBtn").onclick = (e) => {
  e.stopPropagation();
  const m = $("#xuyenMenu");
  if (!m.hidden) return closeXuyen();
  drawXuyenMenu();
  m.hidden = false;
  $("#xuyenBtn").setAttribute("aria-expanded", "true");
};
document.addEventListener("click", (e) => { if (!e.target.closest(".platWrap")) closeXuyen(); });
function applyUi(ui = readUi()) {
  const root = document.documentElement.style;
  const base = THEMES[ui.mode] || THEMES.toi;
  for (const [k, v] of Object.entries(base)) root.setProperty(k, v);
  const toward = ui.mode === "sang" ? "#000" : "#fff";
  if (ui.panel) {
    root.setProperty("--panel", ui.panel);
    root.setProperty("--panel2", `color-mix(in srgb, ${ui.panel} 88%, ${toward})`);
    root.setProperty("--line", `color-mix(in srgb, ${ui.panel} 76%, ${toward})`);
    root.setProperty("--bg", `color-mix(in srgb, ${ui.panel} 80%, ${ui.mode === "sang" ? "#fff" : "#000"})`);
    root.setProperty("--stage", `color-mix(in srgb, ${ui.panel} 60%, ${ui.mode === "sang" ? "#fff" : "#000"})`);
  }
  root.setProperty("--panel-solid", ui.panel || base["--panel"]);
  // Có ảnh giao diện: làm bảng trong suốt một phần để ảnh hiện qua.
  if (ui.bg) {
    const solid = ui.panel || base["--panel"];
    // Hiệu ứng kính: độ nhìn xuyên 0-90%, mặc định 45%.
    const keep = 100 - (ui.glass ?? 45);
    root.setProperty("--panel", `color-mix(in srgb, ${solid} ${keep}%, transparent)`);
    root.setProperty("--panel2", `color-mix(in srgb, color-mix(in srgb, ${solid} 86%, ${toward}) ${Math.round(keep * 0.8)}%, transparent)`);
    root.setProperty("--bg", `color-mix(in srgb, ${solid} ${Math.round(keep * 0.8)}%, transparent)`);
  }
  // Màu khung xem do người dùng chọn thì hiện đúng màu đó, kể cả khi có ảnh giao diện.
  if (ui.stage) root.setProperty("--stage", ui.stage);
  // Nhìn xuyên khung xem: phần trống quanh và trong khung video để lộ ảnh giao diện.
  const stageKeep = ui.bg ? 100 - stageGlassOf(ui) : 100;
  root.setProperty("--stage-glass", `color-mix(in srgb, ${root.getPropertyValue("--stage")} ${stageKeep}%, transparent)`);
  root.setProperty("--frame-glass", `color-mix(in srgb, #000 ${stageKeep}%, transparent)`);
  syncFrameGlass(ui);
  root.setProperty("--accent", ui.accent || "#e8b64c");
  const hex =(ui.accent || "#e8b64c").replace("#", "");
  const lum = (0.299 * parseInt(hex.slice(0, 2), 16) + 0.587 * parseInt(hex.slice(2, 4), 16) + 0.114 * parseInt(hex.slice(4, 6), 16)) / 255;
  root.setProperty("--accent-ink", lum > 0.55 ? "#1b1608" : "#ffffff");
  document.documentElement.style.colorScheme = ui.mode === "sang" ? "light" : "dark";
  document.body.classList.toggle("has-bg", !!ui.bg);
  root.setProperty("--glass-blur", `${ui.glassBlur ?? 10}px`);
  drawUiBg(ui);
  applyXuyen(ui);
  document.body.classList.toggle("hide-right", !!ui.hideRight);
  document.body.classList.toggle("hide-left", !!ui.hideLeft);
  const leftTab = $("#leftTab"), leftText = ui.hideLeft ? "Mở bảng trái" : "Tắt bảng trái";
  leftTab.textContent = ui.hideLeft ? "›" : "‹";
  leftTab.title = leftText;
  leftTab.setAttribute("aria-label", leftText);
  const tab = $("#rightTab"), onLeft = (ui.layout || {}).rightPos === "left", tabText = ui.hideRight ? "Mở bảng thuộc tính" : "Tắt bảng thuộc tính";
  tab.classList.toggle("benTrai", onLeft);
  tab.textContent = !ui.hideRight === onLeft ? "›" : "‹";
  tab.title = tabText;
  tab.setAttribute("aria-label", tabText);
  document.body.classList.toggle("hide-tl", !!ui.hideTimeline);
  document.body.classList.toggle("hide-stage", !!ui.hideStage);
  document.body.classList.toggle("hide-meters", !!ui.hideMeters);
  $("#metersBtn").classList.toggle("on", !ui.hideMeters);
  if (ui.tlH) document.body.style.setProperty("--tl-h", `${ui.tlH}px`);
  // Bố cục: giữ nguyên cho đến khi người dùng đổi.
  const lay = ui.layout || {};
  const lw = ui.hideLeft ? 0 : lay.leftW || 270, rw = ui.hideRight ? 0 : lay.rightW || 300;
  const lp = lay.leftPos || "left", rp = lay.rightPos || "right";
  const cols = [];
  const put = (w, order, el2) => { el2.style.order = order; if (w) cols.push([order, `${w}px`]); };
  const leftFirst = lp === "left" && rp === "left";
  put(lw, lp === "left" ? (leftFirst ? 0 : 0) : 3, $("#left"));
  put(rw, rp === "left" ? 1 : 4, $("#right"));
  $("#stageWrap").style.order = 2;
  cols.push([2, "minmax(0, 1fr)"]);
  $("#work").style.gridTemplateColumns = cols.sort((a, b) => a[0] - b[0]).map((x) => x[1]).join(" ");
  const top = lay.timelinePos === "top";
  const tlRow = ui.hideTimeline ? "0px" : `var(--tl-h, ${lay.timelineH || 312}px)`;
  document.body.style.gridTemplateRows = top ? `44px ${tlRow} minmax(0, 1fr)` : `44px minmax(0, 1fr) ${tlRow}`;
  $("#timeline").style.order = top ? 1 : 2;
  $("#work").style.order = top ? 2 : 1;
}
$("#toggleRight").onclick = () => { const ui = readUi(); ui.hideRight = !ui.hideRight; saveUi(ui); applyUi(ui); };
$("#toggleLeft").onclick = () => { const ui = readUi(); ui.hideLeft = !ui.hideLeft; saveUi(ui); applyUi(ui); };
// Kéo thanh dọc để đổi độ rộng bảng, giống cách kéo chiều cao timeline.
function dragSizer(bar, key, sign) {
  bar.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    bar.setPointerCapture(e.pointerId);
    const ui0 = readUi(), lay = ui0.layout || {}, w0 = lay[key] || (key === "leftW" ? 270 : 300), x0 = e.clientX;
    let w = w0;
    bar.classList.add("dragging");
    document.body.classList.add("sizing");
    const mv = (ev) => { w = Math.round(Math.max(180, Math.min(window.innerWidth * 0.45, w0 + (ev.clientX - x0) * sign))); applyUi({ ...ui0, layout: { ...lay, [key]: w } }); fitStage(); };
    const up = () => {
      bar.removeEventListener("pointermove", mv);
      bar.removeEventListener("pointerup", up);
      bar.classList.remove("dragging");
      document.body.classList.remove("sizing");
      const ui = readUi();
      saveUi({ ...ui, layout: { ...ui.layout, [key]: w } });
    };
    bar.addEventListener("pointermove", mv);
    bar.addEventListener("pointerup", up);
  });
  bar.addEventListener("dblclick", () => { const ui = readUi(), lay = { ...ui.layout }; delete lay[key]; saveUi({ ...ui, layout: lay }); applyUi(readUi()); fitStage(); });
}
dragSizer($("#leftSize"), "leftW", 1);
dragSizer($("#rightSize"), "rightW", -1);
$("#leftTab").onclick = () => $("#toggleLeft").click();
$("#rightTab").onclick = () => $("#toggleRight").click();
$("#metersBtn").onclick = () => { const ui = readUi(); ui.hideMeters = !ui.hideMeters; saveUi(ui); applyUi(ui); };
$("#toggleStage").onclick = () => { const ui = readUi(); ui.hideStage = !ui.hideStage; saveUi(ui); applyUi(ui); };
$("#toggleTimeline").onclick = () => { const ui = readUi(); ui.hideTimeline = !ui.hideTimeline; saveUi(ui); applyUi(ui); };
$("#themeBtn").onclick = () => {
  const draw = () => {
    const ui = readUi();
    const update = (p) => { const n = { ...readUi(), ...p }; saveUi(n); applyUi(n); draw(); };
    const mode = el("div", { className: "pill" }, ...[["toi", "Tối"], ["xam", "Xám"], ["sang", "Sáng"]].map(([k, t]) => { const b = el("button", { textContent: t, className: (ui.mode || "toi") === k ? "on" : "" }); b.onclick = () => update({ mode: k, panel: null }); return b; }));
    const accent = el("input", { type: "color", value: ui.accent || "#e8b64c" });
    accent.setAttribute("aria-label", "Màu nhấn");
    accent.oninput = () => applyUi({ ...readUi(), accent: accent.value });
    accent.onchange = () => update({ accent: accent.value });
    const panel = el("input", { type: "color", value: ui.panel || THEMES[ui.mode || "toi"]["--panel"] });
    panel.setAttribute("aria-label", "Màu bảng");
    panel.oninput = () => applyUi({ ...readUi(), panel: panel.value });
    panel.onchange = () => update({ panel: panel.value });
    const stage = el("input", { type: "color", value: ui.stage || THEMES[ui.mode || "toi"]["--stage"] });
    stage.setAttribute("aria-label", "Màu khung xem video");
    stage.oninput = () => applyUi({ ...readUi(), stage: stage.value });
    stage.onchange = () => update({ stage: stage.value });
    const stageAuto = el("button", { textContent: "Tự động" });
    stageAuto.title = "Bỏ màu tự chọn, khung xem theo màu giao diện";
    stageAuto.onclick = () => update({ stage: null });
    const pickBtn = (text, onFile, accept = "image/*") => {
      const input = el("input", { type: "file", accept, hidden: true });
      input.onchange = () => { if (input.files[0]) onFile(input.files[0]); input.value = ""; };
      return el("label", { className: "btn fileBtn" }, text, input);
    };
    const bgBtn = pickBtn(ui.bg ? "Đổi ảnh hoặc video" : "Chọn ảnh hoặc video", async (f) => {
      let saved;
      try {
        toast("Đang tải nền giao diện…");
        const r = await fetch(`/vn/nen?ten=${encodeURIComponent(f.name)}`, { method: "POST", body: f });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        saved = d;
        const colors = await paletteFromImage(d.url, d.kind === "video");
        // Giữ màu cũ để lúc bỏ nền trả về đúng như trước.
        const cur = readUi();
        update({ ...colors, bg: d.url, bgKind: d.kind, bgInfo: { width: d.width, height: d.height, fps: d.fps }, bgSound: false, beforeBg: cur.bg ? cur.beforeBg : { mode: cur.mode, panel: cur.panel, accent: cur.accent } });
        fetch(`/vn/nen?giu=${encodeURIComponent(d.url.split("ten=")[1])}`, { method: "DELETE" });
        toast("Đã đổi nền giao diện");
      } catch (e) {
        if (saved) fetch(`/vn/nen?giu=${encodeURIComponent((readUi().bg || "").split("ten=")[1] || "")}`, { method: "DELETE" });
        toast(e.message, true);
      }
    }, "image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.m4v");
    const off = el("button", { textContent: "Bỏ nền, về màu cũ" });
    off.onclick = () => { const b4 = readUi().beforeBg || {}; update({ bg: null, bgKind: null, bgInfo: null, beforeBg: null, mode: b4.mode, panel: b4.panel, accent: b4.accent }); fetch("/vn/nen", { method: "DELETE" }); };
    const picMsg = el("p", { textContent: ui.layout?.mode ? "Đang dùng bố cục theo ảnh, giữ nguyên cho đến khi bạn tải ảnh mới hoặc về bố cục gốc." : "Chưa dùng." });
    const picBtn = pickBtn(ui.layout?.mode ? "Tải ảnh mẫu khác" : "Tải ảnh mẫu", async (f) => {
      picMsg.textContent = "AI đang đọc ảnh…";
      try {
        const r = await fetch(`/vn/bo-cuc?ten=${encodeURIComponent(f.name)}`, { method: "POST", body: f });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        const l = d.layout;
        update({ layout: l, mode: l.mode, ...(l.accent ? { accent: l.accent } : {}), ...(l.panel ? { panel: l.panel } : {}) });
        toast("Đã xếp giao diện theo ảnh");
      } catch (e) { picMsg.textContent = `Chưa xếp được: ${e.message}`; }
    });
    const layOff = el("button", { textContent: "Về bố cục gốc" });
    layOff.onclick = () => update({ layout: null });
    const reset = el("button", { textContent: "Về mặc định" });
    reset.onclick = () => { saveUi({}); applyUi({}); draw(); fetch("/vn/nen", { method: "DELETE" }); };
    const row = (t, c2) => el("div", { className: "themeRow" }, el("label", { textContent: t }), c2);
    openModal(el("h3", { textContent: "Giao diện Studio" }), row("Chế độ", mode), row("Màu nhấn", accent), row("Màu bảng", panel), row("Khung xem video", el("div", { className: "row" }, stage, ...(ui.stage ? [stageAuto] : []))), row("Bảng trái", checkRow("Hiện", !ui.hideLeft, (v) => update({ hideLeft: !v }))), row("Bảng thuộc tính", checkRow("Hiện", !ui.hideRight, (v) => update({ hideRight: !v }))), row("Timeline", checkRow("Hiện", !ui.hideTimeline, (v) => update({ hideTimeline: !v }))), row("Hiện khung xem", checkRow("Hiện", !ui.hideStage, (v) => update({ hideStage: !v }))),
      el("div", { className: "themeGroup" }, el("b", { textContent: "Nền giao diện: ảnh hoặc video" }), el("p", { textContent: "Nền nằm sau toàn bộ Studio, màu các bảng và màu nhấn tự đổi theo nền. Giữ nguyên tệp gốc, tối đa 4K (3840×2160), video tối đa 60 khung/giây. Không có trong video xuất." }),
        el("div", { className: "row" }, ...(ui.bg ? [ui.bgKind === "video" ? el("video", { className: "themeThumb", src: ui.bg, muted: true, preload: "metadata" }) : el("img", { className: "themeThumb", src: ui.bg, alt: "Ảnh giao diện đang dùng" })] : []), bgBtn, ...(ui.bg ? [off] : [])),
        ...(ui.bg ? [el("div", { style: "height:8px" }),
          ...(ui.bgInfo ? [el("p", { className: "hint", textContent: `${ui.bgKind === "video" ? "Video" : "Ảnh"} ${ui.bgInfo.width}×${ui.bgInfo.height}${ui.bgKind === "video" ? ` · ${Math.round(ui.bgInfo.fps)} khung/giây` : ""}` })] : []),
          row("Hiển thị nền", el("div", { className: "pill" }, ...[["dung", "Đúng khung hình"], ["phu", "Phủ kín"]].map(([k, t]) => { const b = el("button", { textContent: t, className: (ui.bgFit || (ui.bgKind ? "dung" : "phu")) === k ? "on" : "" }); b.onclick = () => update({ bgFit: k }); return b; }))),
          ...(ui.bgKind === "video" ? [row("Âm thanh video nền", checkRow("Bật", !!ui.bgSound, (v) => update({ bgSound: v }))), ...(ui.bgSound ? [sliderRow("Âm lượng video nền", ui.bgVol ?? 50, 0, 100, 1, (v) => update({ bgVol: v }), (v) => applyUi({ ...readUi(), bgVol: v }))] : [])] : []),
          el("p", { className: "hint", textContent: "Mặc định nhìn xuyên thông minh: vùng trống tự trong suốt, vùng có nội dung thì mờ. Muốn đổi từng vùng, dùng nút Nhìn xuyên trên thanh trên cùng." }), sliderRow("Nhìn xuyên vùng có nội dung", ui.glass ?? 45, 0, 100, 1, (v) => update({ glass: v }), (v) => applyUi({ ...readUi(), glass: v })),
          sliderRow("Độ nhòe sau nội dung", ui.glassBlur ?? 10, 0, 20, 1, (v) => update({ glassBlur: v }), (v) => applyUi({ ...readUi(), glassBlur: v })), sliderRow("Nhìn xuyên khung xem", stageGlassOf(ui), 0, 100, 1, (v) => update({ stageGlass: v }), (v) => applyUi({ ...readUi(), stageGlass: v })), el("p", { className: "hint", textContent: "Kéo video ra khỏi khung để thấy ảnh ở phần trống. Chỉ để xem trong Studio, phần trống trong video xuất vẫn là nền gốc." })] : [])),
      el("div", { className: "themeGroup" }, el("b", { textContent: "Xếp bố cục theo ảnh mẫu" }), el("p", { textContent: "Tải ảnh chụp một giao diện bạn thích, ví dụ màn hình CapCut. AI đọc ảnh rồi sắp lại vị trí bảng, cỡ bảng và màu của Studio cho giống. Ảnh này không hiện lên Studio." }),
        picMsg, el("div", { className: "row" }, picBtn, ...(ui.layout?.mode ? [layOff] : []))),
      el("p", { className: "hint", textContent: "Mọi thay đổi tự lưu và giữ nguyên ở các lần mở sau." }), reset);
  };
  draw();
};
applyUi();

$("#newText").onclick = async () => {
  const r = await edit("add", { kind: "text", text: "Chữ mới", time: state.time, duration: 3, newId: "chu" });
  if (r?.id) { state.txtTab = "text"; select(r.id); }
};
$("#newGrade").onclick = async () => {
  let a, b;
  const c = clipOf(state.sel);
  if (state.range) [a, b] = state.range;
  else if (c?.kind === "video") { a = c.start; b = c.end; }
  else {
    const v = state.model.clips.filter((x) => x.kind === "video" && x.start <= state.time && x.end > state.time).sort((p, q) => q.start - p.start)[0];
    if (!v) return toast("Playhead không nằm trên cảnh video nào");
    a = v.start; b = v.end;
  }
  const r = await edit("add", { kind: "grade", time: a, duration: b - a, newId: "mau" });
  if (r?.id) { state.txtTab = "color"; select(r.id); }
};

// ---- Thư viện MG ----
const mg = { items: null, loai: "all", kieu: "all", q: "", shown: 0 };

async function openMg() {
  if (!mg.items) {
    try { mg.items = (await fetch("/vn/mg-list").then((r) => r.json())).items; }
    catch { return toast("Không đọc được thư viện MG", true); }
  }
  drawMgList();
}

function drawMgList() {
  const close = el("button", { textContent: "Đóng" });
  close.onclick = closeModal;
  const loais = ["all", ...new Set(mg.items.map((x) => x.loai))];
  const kieus = ["all", ...new Set(mg.items.flatMap((x) => x.kieu))];
  const sel = (opts, cur, set, label) => {
    const s = el("select");
    s.setAttribute("aria-label", label);
    for (const o of opts) s.append(el("option", { value: o, textContent: o === "all" ? `${label}: tất cả` : o === "fav" ? "★ Yêu thích" : o, selected: o === cur }));
    s.onchange = () => { set(s.value); drawMgList(); };
    return s;
  };
  const search = el("input", { type: "search", placeholder: "Tìm tên, tác giả, prompt…", value: mg.q });
  search.setAttribute("aria-label", "Tìm mẫu MG");
  search.oninput = () => { mg.q = search.value; drawGrid(); };
  const onlyVideo = el("label", {}, el("input", { type: "checkbox", checked: mg.onlyVideo !== false, onchange: (e) => { mg.onlyVideo = e.target.checked; drawGrid(); } }), " Chỉ mẫu có video");
  const grid = el("div", { className: "mgGrid" });
  const count = el("small", { className: "hint" });
  const drawGrid = () => {
    const q = plain(mg.q.trim());
    const list = mg.items.filter((x) => (mg.loai === "all" || x.loai === mg.loai)
      && (mg.kieu === "all" || (mg.kieu === "fav" ? isFav("mg", x.ma) : x.kieu.includes(mg.kieu)))
      && (mg.onlyVideo === false || x.video || x.video_lam_lai)
      && (!q || plain(`${x.ten || ""} ${x.tac_gia} ${x.prompt}`).includes(q)));
    count.textContent = `${list.length} mẫu`;
    grid.replaceChildren();
    let at = 0;
    const more = () => {
      for (const x of list.slice(at, at + 60)) {
        const img = el("img", { src: x.anh, alt: "", loading: "lazy" });
        const card = el("div", { className: "mgCard", title: x.ten || x.prompt.slice(0, 120) }, img,
          starBtn("mg", x.ma, x.ten || x.ma, drawGrid),
          ...(x.video || x.video_lam_lai ? [] : [el("span", { className: "nov", textContent: "chỉ có ảnh" })]),
          el("div", { className: "bd" }, el("b", { textContent: x.ten || x.prompt.split("\n")[0].slice(0, 60) }), el("small", { textContent: `${x.loai} · @${x.tac_gia}` })));
        card.onclick = (e) => { if (!e.target.closest(".star")) drawMgDetail(x); };
        grid.append(card);
      }
      at += 60;
    };
    more();
    grid.onscroll = () => { if (at < list.length && grid.scrollTop + grid.clientHeight > grid.scrollHeight - 300) more(); };
  };
  $("#modal").classList.add("wide");
  openModal(el("div", { className: "tplTop" }, el("h3", { textContent: "Thư viện MG (Opus 5.5)" }), el("span", { className: "grow" }), close),
    el("div", { className: "mgFilters" }, search, sel(loais, mg.loai, (v) => (mg.loai = v), "Loại"), sel(["all", "fav", ...kieus.slice(1)], mg.kieu, (v) => (mg.kieu = v), "Kiểu"), onlyVideo, count),
    grid);
  drawGrid();
}

function drawMgDetail(x) {
  const back = el("button", { textContent: "← Danh sách" });
  back.onclick = drawMgList;
  const hasVideo = x.video || x.video_lam_lai;
  const v = el("video", { controls: true, playsInline: true, loop: true, poster: x.anh });
  const pick = { tu: 0, den: 0, ban: x.video ? "goc" : "lam_lai" };
  const load = () => { v.src = `/vn/mg-video?ma=${encodeURIComponent(x.ma)}&ban=${pick.ban}`; };
  if (hasVideo) load();
  const verRow = el("div", { className: "row" });
  for (const [k, name, ok] of [["goc", "Video gốc", x.video], ["lam_lai", "Bản làm lại", x.video_lam_lai]]) {
    if (!ok) continue;
    const b = el("button", { className: `toggle${pick.ban === k ? " on" : ""}`, textContent: name });
    b.onclick = () => { pick.ban = k; [...verRow.children].forEach((c) => c.classList.toggle("on", c === b)); load(); };
    verRow.append(b);
  }
  // Chọn đoạn mẫu: bấm nút theo vị trí đang xem, hoặc gõ số giây.
  const tu = el("input", { type: "number", min: 0, step: 0.1, value: 0 });
  const den = el("input", { type: "number", min: 0, step: 0.1, value: 0 });
  tu.setAttribute("aria-label", "Từ giây"); den.setAttribute("aria-label", "Đến giây");
  const seg = el("div", { className: "mgSeg", title: "Bấm để tua video mẫu" }, el("i"), el("u"));
  const drawSeg = () => {
    const d = v.duration || 1;
    pick.tu = Math.max(0, Math.min(+tu.value || 0, d));
    pick.den = Math.max(pick.tu, Math.min(+den.value || d, d));
    const i = seg.querySelector("i");
    i.style.left = `${(pick.tu / d) * 100}%`; i.style.width = `${((pick.den - pick.tu) / d) * 100}%`;
    seg.querySelector("u").style.left = `${((v.currentTime || 0) / d) * 100}%`;
    info.textContent = `Lấy hiệu ứng từ ${pick.tu.toFixed(1)} đến ${pick.den.toFixed(1)} giây của mẫu (${(pick.den - pick.tu).toFixed(1)} giây)`;
  };
  const info = el("p", { className: "hint" });
  v.addEventListener("loadedmetadata", () => { if (!+den.value) den.value = v.duration.toFixed(1); drawSeg(); });
  v.addEventListener("timeupdate", () => { drawSeg(); if (pick.loop && v.currentTime >= pick.den) v.currentTime = pick.tu; });
  tu.oninput = den.oninput = drawSeg;
  seg.onclick = (e) => { const r = seg.getBoundingClientRect(); v.currentTime = ((e.clientX - r.left) / r.width) * (v.duration || 0); };
  const setTu = el("button", { textContent: "Đặt đầu = đang xem" });
  setTu.onclick = () => { tu.value = v.currentTime.toFixed(1); if (+den.value < +tu.value) den.value = tu.value; drawSeg(); };
  const setDen = el("button", { textContent: "Đặt cuối = đang xem" });
  setDen.onclick = () => { den.value = v.currentTime.toFixed(1); drawSeg(); };
  const loopBtn = el("button", { className: "toggle", textContent: "Xem lặp đoạn đã chọn" });
  loopBtn.onclick = () => { pick.loop = !pick.loop; loopBtn.classList.toggle("on", pick.loop); if (pick.loop) { v.currentTime = pick.tu; v.play(); } };
  const whole = el("button", { textContent: "Lấy toàn bộ" });
  whole.onclick = () => { tu.value = 0; den.value = (v.duration || 0).toFixed(1); drawSeg(); };
  const note = el("textarea", { placeholder: "Ghi thêm nếu muốn (không bắt buộc): ví dụ chữ hiện “Giá 5 tỷ”, màu vàng…" });
  note.setAttribute("aria-label", "Ghi chú thêm cho AI");
  const target = el("p", { className: "hint" });
  const drawTarget = () => { target.textContent = state.range ? `Áp vào đoạn đã khoanh: ${fmtTime(state.range[0])} → ${fmtTime(state.range[1])}` : `Chưa chọn vùng: sẽ đặt tại playhead ${fmtTime(state.time)}. Muốn chọn đoạn khác, đóng lại và khoanh trên timeline.`; };
  drawTarget();
  const apply = el("button", { className: "primary", textContent: "✦ Áp dụng vào video" });
  apply.disabled = !hasVideo || !state.project;
  apply.onclick = async () => {
    drawSeg();
    closeModal();
    $("#aiLog").hidden = false;
    aiLine("me", `Áp dụng MG “${x.ten || x.ma}” (giây ${pick.tu.toFixed(1)}–${pick.den.toFixed(1)} của mẫu)${note.value.trim() ? `: ${note.value.trim()}` : ""}`);
    try {
      const { job } = await post("ai", { text: note.value.trim(), mg: { ma: x.ma, ban: pick.ban, tu: pick.tu, den: pick.den }, time: state.time, clip: state.sel, range: state.range, shots: aiShots(), session: ai.session });
      ai.shown = 0; ai.imagesShown = false; ai.session = job.sessionId; ai.chat = job.chatId;
      setAiBusy(true);
      aiPoll();
    } catch (err) { aiLine("err", err.message); }
  };
  const side = el("div", { className: "mgSide" },
    el("div", { className: "tplTop" }, el("h3", { textContent: x.ten || x.ma }), starBtn("mg", x.ma, x.ten || x.ma, () => drawMgDetail(x))),
    el("small", { className: "hint", textContent: `${x.loai} · ${x.kieu.join(", ") || "chưa phân kiểu"} · @${x.tac_gia}` }),
    el("p", { className: "hint", textContent: "1. Chọn đoạn hiệu ứng muốn lấy trong video mẫu" }),
    el("div", { className: "row" }, setTu, setDen, whole), field("Từ giây", tu), field("Đến giây", den), info, loopBtn,
    el("p", { className: "hint", textContent: "2. Nơi áp dụng trong video của bạn" }), target,
    note, el("div", { className: "row" }, apply, back),
    el("p", { className: "hint", textContent: `Prompt gốc${x.prompt_thieu ? " (tác giả chia sẻ chưa đủ)" : ""}:` }), el("pre", { textContent: x.prompt }),
    el("div", { className: "row" }, el("a", { href: x.skillry, target: "_blank", rel: "noreferrer", textContent: "Mở trên Skillry" }), el("a", { href: x.bai_goc, target: "_blank", rel: "noreferrer", textContent: "Bài gốc" })));
  modalBack = drawMgList;
  openModal(el("div", { className: "mgDetail" }, el("div", {}, verRow, hasVideo ? v : el("img", { src: x.anh, alt: "", style: "width:100%" }), seg), side));
  drawSeg();
}

$("#mgBtn").onclick = openMg;

// ---- Kiểm lỗi và phím tắt ----
$("#lint").onclick = async () => {
  const close = el("button", { textContent: "Đóng" });
  close.onclick = closeModal;
  openModal(el("h3", { textContent: "Đang kiểm lỗi…" }));
  const d = await fetch(`/api/projects/${state.model.projectId}/lint`).then((r) => r.json());
  const list = d.findings || [];
  const nodes = list.slice(0, 40).map((f) => el("p", { className: "hint", textContent: `${f.severity === "error" ? "Lỗi" : "Lưu ý"}: ${f.message}${f.elementId ? ` (${f.elementId})` : ""}` }));
  openModal(el("h3", { textContent: list.length ? `Có ${list.length} mục cần xem` : "Không phát hiện lỗi" }), ...nodes, close);
};

$("#help").onclick = () => {
  const close = el("button", { textContent: "Đóng" });
  close.onclick = closeModal;
  const rows = [["Space", "Phát / dừng"], ["← →", "Lùi / tiến 1 khung"], ["Shift + ← →", "Lùi / tiến 1 giây"], ["Home / End", "Về đầu / cuối"], ["↑ ↓", "Nhảy tới điểm chuyển cảnh trước / sau"], ["S", "Cắt đôi tại playhead"], ["Q / W", "Trim đầu / đuôi về playhead"], [", .", "Dời clip 1 khung (Shift: 10 khung)"], ["Shift + bấm", "Chọn nhiều clip"], ["Z", "Phóng vào clip đang chọn"], ["N", "Ghi chú cho AI"], ["Delete", "Xóa clip đang chọn"], ["Ctrl + D", "Nhân bản"], ["Ctrl + Z / Ctrl + Y", "Hoàn tác / làm lại"], ["+ / −", "Phóng to / thu nhỏ timeline"], ["Ctrl + K", "Nhờ AI sửa"], ["Shift + kéo thước", "Chọn vùng cho AI"], ["Esc", "Bỏ chọn"]];
  openModal(el("h3", { textContent: "Phím tắt" }), el("div", { className: "keys" }, ...rows.flatMap(([k, v]) => [el("kbd", { textContent: k }), el("span", { textContent: v })])), el("p"), close);
};

const doSplit = async () => {
  let c = clipOf(state.sel);
  // Không chọn gì: tách cảnh video đang phát ở playhead, như CapCut.
  if (!c || state.time <= c.start || state.time >= c.end) {
    const under = state.model.clips.filter((x) => x.kind === "video" && x.timed && x.start < state.time - 0.01 && x.end > state.time + 0.01).sort((a, b) => b.start - a.start);
    if (!under.length) return toast("Playhead không nằm trên cảnh video nào");
    c = under[0];
  }
  await edit("split", { id: c.id, time: state.time, newId: `${c.id}_b` });
};
const doDup = () => state.sel && edit("duplicate", { id: state.sel });
const doDel = () => {
  if (state.picks.size > 1) { const items = [...state.picks].map((id) => ({ op: "remove", body: { id } })); state.picks.clear(); return edit("batch", { items }); }
  return state.sel && edit("remove", { id: state.sel });
};
const doTrim = (edge) => {
  const c = clipOf(state.sel);
  if (!c) return toast("Hãy chọn một clip trước");
  if (state.time <= c.start || state.time >= c.end) return toast("Playhead phải nằm trong clip");
  edit("trim", { id: c.id, edge, delta: state.time - (edge === "start" ? c.start : c.end) });
};
const zoomSel = () => {
  const c = clipOf(state.sel);
  if (!c) return;
  setZoom(($("#tracksScroll").clientWidth * 0.5) / Math.max(0.5, c.end - c.start));
  $("#tracksScroll").scrollLeft = c.start * state.pxPerSec - 80;
};
const jumpCut = (dir) => {
  const pts = [...new Set(state.model.clips.filter((c) => c.kind === "video").flatMap((c) => [c.start, c.end]))].sort((a, b) => a - b);
  const t = dir > 0 ? pts.find((p) => p > state.time + 0.01) : pts.reverse().find((p) => p < state.time - 0.01);
  if (t !== undefined) { player()?.pause(); seek(t); }
};
const nudge = (d) => {
  if (state.picks.size > 1) return edit("batch", { items: [...state.picks].map((id) => ({ op: "move", body: { id, delta: d } })) });
  if (state.sel) edit("move", { id: state.sel, delta: d });
};

// ---- Danh sách nội dung ----
const FILTERS = [["sub", "Phụ đề", ["sub"]], ["mg", "Chữ & hình", ["text", "graphic", "fx", "image"]], ["scene", "Cảnh", ["video"]], ["audio", "Âm thanh", ["audio", "sfx"]], ["note", "Ghi chú", []]];
for (const [key, name] of FILTERS) {
  const b = el("button", { textContent: name, className: key === state.filter ? "on" : "" });
  b.onclick = () => { state.filter = key; [...$("#chips").children].forEach((x) => x.classList.toggle("on", x === b)); drawList(); };
  $("#chips").append(b);
}
$("#search").oninput = () => drawList();

function focusClip(c) {
  player()?.pause();
  select(c.id);
  seek(Math.min(c.end, c.start + Math.min(0.4, (c.end - c.start) / 2)));
  const sc = $("#tracksScroll"), x = c.start * state.pxPerSec;
  if (x < sc.scrollLeft || x > sc.scrollLeft + sc.clientWidth - 60) sc.scrollLeft = x - 80;
}

function drawList() {
  if (!state.model) return;
  const q = $("#search").value.trim().toLowerCase();
  const host = $("#items");
  if (state.filter === "note") {
    const rows = state.notes.filter((n) => n.noi_dung.toLowerCase().includes(q)).map((n) => {
      const b = el("button", { className: "item" }, el("small", { textContent: fmtTime(n.luc_video) }), el("span", { textContent: n.noi_dung }));
      b.onclick = () => { player()?.pause(); seek(n.luc_video); };
      const x = el("button", { className: "icon", textContent: "×", title: "Xóa ghi chú" });
      x.setAttribute("aria-label", "Xóa ghi chú");
      x.onclick = async () => { state.notes = (await post("notes", { remove: n.id })).notes; drawTimeline(); drawList(); };
      return el("div", { className: "item-row" }, b, x);
    });
    host.replaceChildren(...(rows.length ? rows : [el("p", { className: "hint", textContent: "Chưa có ghi chú. Bấm “Ghi chú cho AI” ở chỗ muốn AI sửa." })]));
    return;
  }
  const kinds = FILTERS.find((f) => f[0] === state.filter)[2];
  const list = state.model.clips.filter((c) => kinds.includes(c.kind) && clipLabel(c).toLowerCase().includes(q)).sort((a, b) => a.start - b.start);
  host.replaceChildren(...list.map((c, i) => {
    const b = el("button", { className: `item${c.id === state.sel ? " sel" : ""}` }, el("small", { textContent: `${String(i + 1).padStart(2, "0")} · ${fmtTime(c.start)}` }), el("span", { textContent: clipLabel(c) }));
    b.dataset.start = c.start; b.dataset.end = c.end;
    b.onclick = () => focusClip(c);
    return b;
  }));
  if (!list.length) host.append(el("p", { className: "hint", textContent: "Không có mục nào khớp." }));
  markNow();
}

function markNow() {
  let hit = null;
  for (const b of document.querySelectorAll("#items .item[data-start]")) {
    const on = state.time >= +b.dataset.start && state.time < +b.dataset.end;
    if (on !== b.classList.contains("now")) b.classList.toggle("now", on);
    if (on && !hit) hit = b;
  }
  if (hit && state.playing && hit !== markNow.last) hit.scrollIntoView({ block: "nearest" });
  markNow.last = hit;
}

const addNote = () => {
  const c = clipOf(state.sel);
  const t = el("textarea", { placeholder: "Ví dụ: chữ này che mặt, đổi sang cảnh khác…", rows: 3 });
  t.style.cssText = "width:100%;background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:6px";
  const save = el("button", { className: "primary", textContent: "Lưu ghi chú" }), cancel = el("button", { textContent: "Đóng" });
  cancel.onclick = closeModal;
  save.onclick = async () => {
    if (!t.value.trim()) return;
    state.notes = (await post("notes", { time: state.time, clip: state.sel, text: t.value.trim() })).notes;
    closeModal(); drawTimeline(); drawList(); toast("Đã ghi. AI sẽ đọc khi bạn yêu cầu sửa.");
  };
  openModal(el("h3", { textContent: `Ghi chú tại ${fmtTime(state.time)}` }), el("p", { className: "hint", textContent: c ? `Gắn với: ${clipLabel(c).slice(0, 60)}` : "Cho những chỗ không tự chỉnh được, ví dụ nói vấp, đổi nhạc, thay cảnh." }), t, el("p"), el("div", { className: "row" }, save, cancel));
  t.focus();
};
const stepUndo = async (url) => {
  setStatus("Đang lưu…");
  const r = await post(url);
  if (r.hot && applyHot(r.hot)) await refresh(false); else await refresh();
};
const doUndo = () => stepUndo("undo");
const doRedo = () => stepUndo("redo");

$("#play").onclick = togglePlay;
$("#split").onclick = doSplit;
$("#dup").onclick = doDup;
$("#del").onclick = doDel;
$("#undo").onclick = doUndo;
$("#redo").onclick = doRedo;
$("#fit").onclick = fitZoom;
$("#trimIn").onclick = () => doTrim("start");
$("#trimOut").onclick = () => doTrim("end");
$("#zoomSel").onclick = zoomSel;
$("#note").onclick = addNote;
$("#zoom").oninput = (e) => setZoom(+e.target.value);
$("#zoomIn").onclick = () => setZoom(state.pxPerSec * 1.4);
$("#zoomOut").onclick = () => setZoom(state.pxPerSec / 1.4);
$("#snap").onclick = (e) => { state.snap = !state.snap; e.target.classList.toggle("on", state.snap); };
$("#loop").onclick = (e) => { state.loop = !state.loop; e.target.classList.toggle("on", state.loop); };
$("#safeBtn").onclick = (e) => { const s = $("#safe"); s.hidden = !s.hidden; e.target.classList.toggle("on", !s.hidden); };
$("#full").onclick = () => $("#stageWrap").requestFullscreen?.();
const sendView = (action, extra) => state.frame?.contentWindow?.postMessage({ source: "hf-parent", type: "control", action, ...extra }, "*");
function applyViewVolume() { sendView("set-volume", { volume: state.viewVol ?? 1 }); }
$("#masterVol").oninput = (e) => {
  state.viewVol = +e.target.value / 100;
  applyViewVolume();
  const silent = state.viewVol === 0;
  if (silent !== state.muted) { state.muted = silent; sendView("set-muted", { muted: silent }); }
  $("#mute").textContent = silent ? "🔇" : "🔊";
  $("#monitorVol").value = e.target.value;
  try { localStorage.setItem("hd-am-luong-xem", String(state.viewVol)); } catch { /* không lưu cũng được */ }
};
$("#monitorVol").oninput = (e) => { const m = $("#masterVol"); m.value = e.target.value; m.dispatchEvent(new Event("input")); };
try { const v = localStorage.getItem("hd-am-luong-xem"); if (v !== null) { state.viewVol = +v; $("#masterVol").value = Math.round(+v * 100); $("#monitorVol").value = $("#masterVol").value; } } catch { /* bỏ qua */ }

// Xem trước giao diện mạng xã hội, chỉ hiện khi dựng.
const ico = {
  heart: "M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z",
  chat: "M4 4h16v12H8l-4 4z",
  mark: "M6 3h12v18l-6-4-6 4z",
  share: "M13 5l8 7-8 7v-4c-5 0-8 1.5-10 5 0-6 3-11 10-12z",
  down: "M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z",
  dots: "M5 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
};
// Khung mô phỏng đo theo ảnh chụp 3 khung của CapCut. x, y là tâm phần tử, tính bằng % khung.
const fillIc = (d, extra = "") => `<svg viewBox="0 0 24 24"><path fill="#fff" d="${d}"/>${extra}</svg>`;
const lineIc = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="${d}"/></svg>`;
const P = {
  person: "M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-9 2.2-9 5v3h18v-3c0-2.8-4.6-5-9-5z",
  tiktok: "M16.600 5.800A4.300 4.300 0 0 1 13.400 3h-3.100v12.400a2.600 2.600 0 1 1-1.800-2.500V9.700a5.700 5.700 0 1 0 4.900 5.700V9a7.400 7.400 0 0 0 4.300 1.400V7.300a4.300 4.300 0 0 1-.9-.1z",
  search: "M10.5 3.5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM15.6 15.6 21 21",
  heart: "M12 21s-8.5-5.2-8.5-11.2A4.8 4.8 0 0 1 12 6.9a4.8 4.8 0 0 1 8.5 2.9C20.5 15.8 12 21 12 21z",
  bubble: "M12 3.5c5 0 9 3.4 9 7.7S17 19 12 19c-.9 0-1.7-.1-2.5-.3L5 21l.7-4.1C4 15.5 3 13.5 3 11.2 3 6.9 7 3.5 12 3.5z",
  mark: "M4.500 3h15v18l-7.500-5-7.500 5z",
  share: "M13.5 5l7.5 7-7.5 7v-4.2C8 14.800 5 16.300 3 20c.4-6 3.800-10.500 10.500-11z",
  up: "M7.500 10.500V20H4v-9.500h3.500zm0 0L11.800 3c1.500 0 2.500 1 2.500 2.500V9h5c1.300 0 2.200 1.100 2 2.300l-1.200 6.800c-.2 1.100-1.100 1.900-2.200 1.900H7.500",
  down: "M16.500 13.500V4H20v9.500h-3.500zm0 0L12.200 21c-1.500 0-2.500-1-2.500-2.500V15h-5c-1.300 0-2.200-1.100-2-2.300l1.200-6.800C4.100 4.800 5 4 6.100 4h10.400",
  comment: "M4 4h16v13H9.500L4 21.500zM8 8.500h8M8 12.500h5",
  remix: "M20 12a8 8 0 1 1-2.600-5.900M20 3v4.500h-4.500M12 8.500v7M8.500 12h7",
  circle: "M12 3a9 9 0 1 1-3.800 17.200L3.500 21l.8-4.700A9 9 0 0 1 12 3z",
  send: "M21 3 3 10l7.500 3L13.500 21zM10.500 13 21 3",
  camera: "M4 7.500h4L9.800 5h4.400L16 7.500h4V20H4zM12 10.500a3.300 3.300 0 1 0 0 6.600 3.300 3.300 0 0 0 0-6.600z",
  play: "M7 6h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3zm3 3.500v5l4.500-2.500z",
  insta: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
};
const at = (x, y, size, html, cls = "") => `<span class="pC ${cls}" style="left:${x}cqw;top:${y}cqh;width:${size}cqw;height:${size}cqw">${html}</span>`;
const lbl = (x, y, fs, text, extra = "") => `<span class="pC" style="left:${x}cqw;top:${y}cqh;font-size:${fs}cqw;${extra}">${text}</span>`;
const txt = (x, y, fs, text, extra = "") => `<span class="pL" style="left:${x}cqw;top:${y}cqh;font-size:${fs}cqw;${extra}">${text}</span>`;
const statusIcons = `<span class="pL" style="right:3.800cqw;top:3.600cqh;width:18cqw;height:4cqw"><svg viewBox="0 0 72 16"><g fill="#fff"><rect x="0" y="10" width="3.500" height="5" rx="1"/><rect x="5.500" y="7.500" width="3.500" height="7.500" rx="1"/><rect x="11" y="4.500" width="3.500" height="10.500" rx="1"/><rect x="16.500" y="1.500" width="3.500" height="13.500" rx="1"/><path d="M34 15l-3-3.600a4.500 4.500 0 0 1 6 0zM27 7.500a10.500 10.500 0 0 1 14 0l-2 2.300a7.500 7.500 0 0 0-10 0z"/><rect x="48" y="2" width="21" height="12" rx="3"/></g></svg></span>`;
const avatar = (x, y, size) => at(x, y, size, `<svg viewBox="0 0 24 24"><path fill="#6b6b6b" d="${P.person}"/></svg>`, "pRound");
const PLATFORMS = {
  tiktok: { name: "TikTok", html: [txt(6.500, 3.500, 4.700, "9:41", "font-weight:600"), statusIcons,
      lbl(27.800, 11.300, 4.200, "Explore", "opacity:.75"), lbl(48.900, 11.300, 4.200, "Following", "opacity:.75"), lbl(70.800, 11.300, 4.200, "For You", "font-weight:700"),
      `<span class="pC pBar" style="left:71.300cqw;top:13.800cqh;width:6.800cqw"></span>`, at(90.600, 11.200, 7.600, lineIc(P.search)),
      avatar(91.400, DU-AN-MAU00, 11),
      at(91.200, 55.600, 9.800, fillIc(P.heart)), lbl(91.300, 59, 3.400, "2.8M"),
      at(91.200, 65.400, 9.600, fillIc(P.bubble, '<g fill="#8a8a8a"><circle cx="8" cy="11.300" r="1.300"/><circle cx="12" cy="11.300" r="1.300"/><circle cx="16" cy="11.300" r="1.300"/></g>')), lbl(91.300, 68.800, 3.400, "2.8M"),
      at(91.200, 75.100, 9.400, fillIc(P.mark)), lbl(91.300, 78.500, 3.400, "2.8M"),
      at(91.200, 84.800, 8.900, fillIc(P.share)), lbl(91.300, 88.300, 3.400, "2.8M"),
      at(91.400, 95, 10.200, fillIc(P.tiktok), "pDisc"),
      txt(2.500, 88.300, 5.900, "Your name", "font-weight:500"), txt(2.500, 93, 3.600, "Here are some descriptions about videos"), txt(2.500, 96.800, 3.600, "See original", "opacity:.7")].join("") },
  shorts: { name: "YouTube Shorts", html: [txt(6.200, 3.800, 4.700, "9:41", "font-weight:600"), statusIcons,
      at(80, 12.500, 7.200, lineIc(P.search)), at(92.300, 12.500, 5.800, fillIc("M12 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z")),
      at(90.400, 38.900, 8.800, lineIc(P.up)), lbl(90.400, 42.400, 3.500, "2.8M"),
      at(90.400, 49.900, 8.800, lineIc(P.down)), lbl(90.400, 53.500, 3.600, "Dislike"),
      at(90.400, 61.300, 8.800, lineIc(P.comment)), lbl(90.400, 64.900, 3.500, "2.8M"),
      at(90.400, 72.600, 8.800, lineIc(P.share)), lbl(90.400, 76.100, 3.500, "2.8M"),
      at(90.400, 83.900, 8.800, lineIc(P.remix)), lbl(90.400, 87.300, 3.500, "2.8M"),
      at(90.600, 94.700, 9.600, fillIc(P.play), "pTile"),
      avatar(9, 91.200, 8), txt(14.400, 91, 3.600, "@Your name"), txt(5, 96, 3.600, "Here are some descriptions about videos")].join("") },
  reels: { name: "Instagram Reels", html: [txt(5.800, 3.800, 4.700, "9:41", "font-weight:600"), statusIcons,
      at(9.300, 11.100, 7.200, lineIc(P.search)), at(92.200, 12.400, 7.300, lineIc(P.camera)),
      at(91.900, 58.300, 9.400, lineIc(P.heart)), lbl(91.900, 62.300, 3, "2.8M"),
      at(91.900, 68.700, 8, lineIc(P.circle)), lbl(91.900, 72.200, 3, "2.8M"),
      at(91.900, 78.600, 8.600, lineIc(P.send)), lbl(91.900, 82.300, 3, "2.8M"),
      at(91.900, 88.700, 6.800, fillIc("M5 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z")),
      at(91.900, 94.900, 7.400, lineIc(P.insta), "pTile"),
      avatar(9.300, 85.600, 9.700), txt(15.700, 85.700, 3.700, "@Your name"), txt(4.700, 91.900, 3.600, "Here are some descriptions about videos"),
      `<span class="pC" style="left:6.600cqw;top:96.400cqh;width:3.900cqw;height:3.900cqw;border-radius:50%;background:#ffffff66"></span>`, txt(10, 96.500, 2.800, "Music name", "opacity:.6")].join("") },
};
function setPlatform(key) {
  state.platform = key || null;
  const box = $("#platform");
  box.hidden = !key;
  box.innerHTML = key ? PLATFORMS[key].html : "";
  $("#platBtn").classList.toggle("on", !!key);
  try { localStorage.setItem("hd-nen-tang", key || ""); } catch { /* bỏ qua */ }
}
function drawPlatMenu() {
  const menu = $("#platMenu");
  menu.replaceChildren(el("b", { textContent: "Xem trước cách video hiển thị trên mạng xã hội" }), el("p", { textContent: "Chỉ để xem khi dựng, không có trong video xuất." }),
    ...Object.entries(PLATFORMS).map(([k, p]) => { const b = el("button", {}, el("span", { textContent: p.name }), el("span", { textContent: state.platform === k ? "✓" : "" })); b.onclick = () => { setPlatform(k); closePlat(); }; return b; }),
    el("hr"), (() => { const b = el("button", {}, el("span", { textContent: "Không có" }), el("span", { textContent: state.platform ? "" : "✓" })); b.onclick = () => { setPlatform(null); closePlat(); }; return b; })());
}
function drawRatioMenu() {
  const menu = $("#ratioMenu"), cur = frameChoice();
  const line = (left, right, on, click) => { const b = el("button", {}, el("span", { textContent: `${left}  ${right}` }), el("span", { textContent: on ? "✓" : "" })); b.onclick = (e) => { e.stopPropagation(); click(); drawRatioMenu(); }; return b; };
  menu.replaceChildren(el("b", { textContent: "Khung hình theo nơi đăng" }), el("p", { textContent: "Xem ngay trong khung, Xuất video tự dùng lựa chọn này. Bản dựng gốc không đổi." }),
    line("Gốc", `${state.model.width}×${state.model.height}`, cur.aspect === "goc", () => setFrameChoice({ aspect: "goc" })),
    ...RATIOS.map(([k, t]) => line(k, t, cur.aspect === k, () => setFrameChoice({ aspect: k }))),
    ...(cur.aspect === "goc" ? [] : [el("hr"), el("b", { textContent: "Khi video lệch khung" }), ...RATIO_FITS.map(([k, t, d]) => line(t, d, cur.fit === k, () => setFrameChoice({ fit: k })))]));
}
function closeRatio() { $("#ratioMenu").hidden = true; $("#ratioBtn").setAttribute("aria-expanded", "false"); }
$("#ratioBtn").onclick = (e) => {
  e.stopPropagation();
  const m = $("#ratioMenu");
  if (!m.hidden) return closeRatio();
  drawRatioMenu();
  m.hidden = false;
  $("#ratioBtn").setAttribute("aria-expanded", "true");
};
document.addEventListener("click", (e) => { if (!e.target.closest(".platWrap")) closeRatio(); });
function closePlat() { $("#platMenu").hidden = true; $("#platBtn").setAttribute("aria-expanded", "false"); }
$("#platBtn").onclick = (e) => {
  e.stopPropagation();
  const m = $("#platMenu");
  if (!m.hidden) return closePlat();
  drawPlatMenu();
  m.hidden = false;
  $("#platBtn").setAttribute("aria-expanded", "true");
};
document.addEventListener("click", (e) => { if (!e.target.closest(".platWrap")) closePlat(); });
try { const k = localStorage.getItem("hd-nen-tang"); if (k && PLATFORMS[k]) setPlatform(k); } catch { /* bỏ qua */ }

$("#mute").onclick = (e) => {
  state.muted = !state.muted;
  e.target.textContent = state.muted ? "🔇" : "🔊";
  state.frame?.contentWindow?.postMessage({ source: "hf-parent", type: "control", action: "set-muted", muted: state.muted }, "*");
};
$("#speed").onchange = (e) => {
  state.rate = +e.target.value;
  state.frame?.contentWindow?.postMessage({ source: "hf-parent", type: "control", action: "set-playback-rate", playbackRate: state.rate }, "*");
};

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); $("#aiInput").focus(); return; }
  if (e.target.matches("input,textarea,select") || $("#modal").open) return;
  const fr = 1 / (state.model?.fps || 30);
  const ctrl = e.ctrlKey || e.metaKey;
  const k = e.key.toLowerCase();
  if (e.code === "Space") { e.preventDefault(); togglePlay(); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); player()?.pause(); seek(state.time - (e.shiftKey ? 1 : fr)); }
  else if (e.key === "ArrowRight") { e.preventDefault(); player()?.pause(); seek(state.time + (e.shiftKey ? 1 : fr)); }
  else if (e.key === "Home") seek(0);
  else if (e.key === "End") seek(state.model.duration);
  else if (ctrl && k === "z" && e.shiftKey) { e.preventDefault(); doRedo(); }
  else if (ctrl && k === "z") { e.preventDefault(); doUndo(); }
  else if (ctrl && k === "y") { e.preventDefault(); doRedo(); }
  else if (ctrl && k === "d") { e.preventDefault(); doDup(); }
  else if (e.key === "ArrowUp") { e.preventDefault(); jumpCut(-1); }
  else if (e.key === "ArrowDown") { e.preventDefault(); jumpCut(1); }
  else if (!ctrl && k === "s") doSplit();
  else if (ctrl && k === "b") { e.preventDefault(); doSplit(); }
  else if (!ctrl && k === "q") doTrim("start");
  else if (!ctrl && k === "w") doTrim("end");
  else if (!ctrl && k === "z") zoomSel();
  else if (!ctrl && k === "n") { e.preventDefault(); addNote(); }
  else if (e.key === ",") nudge(e.shiftKey ? -10 * fr : -fr);
  else if (e.key === ".") nudge(e.shiftKey ? 10 * fr : fr);
  else if (e.key === "Delete" || e.key === "Backspace") doDel();
  else if (e.key === "+" || e.key === "=") setZoom(state.pxPerSec * 1.4);
  else if (e.key === "-") setZoom(state.pxPerSec / 1.4);
  else if (e.key === "Escape") { if (state.range) { state.range = null; drawRange(); } else select(null); }
});

$("#timeline").addEventListener("pointerdown", (e) => {
  const r = $("#timeline").getBoundingClientRect();
  if (e.clientY > r.top + 3 || e.target !== $("#timeline")) return;
  const move = (ev) => { document.body.style.setProperty("--tl-h", `${Math.max(120, Math.min(innerHeight - 200, innerHeight - ev.clientY))}px`); fitStage(); };
  const up = () => {
    removeEventListener("pointermove", move);
    removeEventListener("pointerup", up);
    const h = parseInt(document.body.style.getPropertyValue("--tl-h"), 10);
    if (h) saveUi({ ...readUi(), tlH: h });
  };
  addEventListener("pointermove", move);
  addEventListener("pointerup", up);
});

// Cột tên lớp cuộn dọc theo timeline.
$("#tracksScroll").addEventListener("scroll", () => { $("#laneRows").style.transform = `translateY(${-$("#tracksScroll").scrollTop}px)`; });
$("#lanes").addEventListener("wheel", (e) => { $("#tracksScroll").scrollTop += e.deltaY; }, { passive: true });

// Kéo playhead ở bất kỳ độ cao nào.
$("#playhead").addEventListener("pointerdown", (e) => {
  e.stopPropagation();
  const ph = $("#playhead");
  ph.setPointerCapture(e.pointerId);
  ph.classList.add("drag");
  player()?.pause();
  const at = (ev) => seek((ev.clientX - $("#ruler").getBoundingClientRect().left) / state.pxPerSec);
  const auto = edgeScroll(at);
  const move = (ev) => { auto.track(ev); at(ev); };
  ph.addEventListener("pointermove", move);
  ph.addEventListener("pointerup", () => { auto.stop(); ph.removeEventListener("pointermove", move); ph.classList.remove("drag"); }, { once: true });
});

$("#tracksScroll").addEventListener("wheel", (e) => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  const sc = $("#tracksScroll"), mx = e.clientX - sc.getBoundingClientRect().left, at = (sc.scrollLeft + mx) / state.pxPerSec;
  setZoom(state.pxPerSec * (e.deltaY < 0 ? 1.2 : 1 / 1.2));
  sc.scrollLeft = at * state.pxPerSec - mx;
}, { passive: false });

new ResizeObserver(fitStage).observe($("#stage"));

// ---- Khởi động ----
$("#project").onchange = (e) => { location.search = `?du-an=${encodeURIComponent(e.target.value)}`; };

async function start() {
  state.fav = await fetch("/vn/yeu-thich").then((r) => r.json()).catch(() => ({ font: [], sfx: [], template: [] }));
  fetch("/vn/templates").then((r) => r.json()).then((d) => { tplState.data = d; syncTplBtn(); }).catch(() => {});
  const { projects } = await fetch("/vn/projects").then((r) => r.json());
  if (!state.project) state.project = projects[0]?.name;
  if (!state.project) { setStatus("Chưa có dự án nào trong thư mục Videos"); return; }
  $("#project").replaceChildren(...projects.map((p) => el("option", { value: p.name, textContent: p.name, selected: p.name === state.project })));
  document.title = `${state.project} · HD Studio`;
  setStatus("Đang mở dự án…");
  try {
    await refresh(false, true);
    state.notes = (await api("notes")).notes;
    drawTimeline();
  } catch (e) { setStatus("Không mở được"); toast(e.message, true); return; }
  fitStage();
  setZoom(30);
  loadFrame();
  loadAssets();
  fetch("/vn/font-list").then((r) => r.json()).then((d) => { state.fontLib = d.fonts; if (clipOf(state.sel)?.segments.length) drawProps(); });
  requestAnimationFrame(tick);
  watchFile();
  const { job } = await fetch("/vn/render").then((r) => r.json());
  if (job?.status === "dang_chay") watchRender();
  syncPhien().catch(() => {});
  fetch("/vn/ai").then((r) => r.json()).then(({ job: a }) => { if (a?.status === "dang_chay") { $("#aiLog").hidden = false; setAiBusy(true); aiPoll(); } });
}
start();
$("#modal").addEventListener("close", () => $("#modal").classList.remove("wide"));


// ---- Đồng hồ âm thanh: đọc mức thật từ máy phát của HyperFrames, trước bước âm lượng nghe ----
const METER_STOPS = [0, -3, -6, -12, -24, -60];
function meterPos(linear) {
  const db = linear > 0 ? 20 * Math.log10(linear) : -60;
  if (db >= 0) return 1;
  if (db <= -60) return 0;
  const i = METER_STOPS.findIndex((v) => db >= v);
  const hi = METER_STOPS[i - 1], lo = METER_STOPS[i];
  return (METER_STOPS.length - 1 - i + (db - lo) / (hi - lo)) / (METER_STOPS.length - 1);
}
(() => {
  const bars = [...document.querySelectorAll(".mBar")].map((b) => ({ mask: b.querySelector("i"), peak: b.querySelector("b"), level: 0, hold: 0, at: 0 }));
  const light = $("#clipLight");
  light.onclick = () => light.classList.remove("lit");
  let meter = null;
  const tick = (now) => {
    requestAnimationFrame(tick);
    if (document.body.classList.contains("hide-meters")) return;
    let next = null;
    try { next = state.frame?.contentWindow?.__hf?.audioMeter ?? null; } catch { next = null; }
    if (next !== meter) { try { meter?.stop(); } catch { /* khung cũ đã đóng */ } try { next?.start(); } catch { /* chưa sẵn sàng */ } meter = next; }
    let m = null;
    try { m = meter?.read()?.master ?? null; } catch { m = null; }
    [m?.l ?? 0, m?.r ?? 0].forEach((v, i) => {
      const b = bars[i], pos = meterPos(v);
      b.level = Math.max(pos, b.level * 0.9);
      if (pos >= b.hold) { b.hold = pos; b.at = now; } else if (now - b.at > 1200) b.hold = Math.max(0, b.hold - 0.01);
      b.mask.style.height = `${(1 - b.level) * 100}%`;
      b.peak.style.bottom = `${Math.min(99, b.hold * 100)}%`;
      b.peak.style.opacity = b.hold > 0.01 ? 1 : 0;
      if (v >= 0.891) light.classList.add("lit");
    });
  };
  requestAnimationFrame(tick);
})();

// ---- Thả tệp vào timeline hoặc tải lên: tải về dự án rồi đặt đúng chỗ, nhiều tệp nối tiếp nhau ----
async function placeFiles(files, at) {
  let time = at, last = null;
  for (const file of files) {
    setStatus(`Đang tải ${file.name}…`);
    try {
      const up = await api(`upload?ten=${encodeURIComponent(file.name)}`, { method: "POST", body: file });
      if (up.kind === "font") { toast(`Đã tải font ${file.name}`); continue; }
      const r = await post("add-asset", { path: up.path, time });
      await refresh();
      last = r.id;
      time = clipOf(r.id)?.end ?? time;
    } catch (e) { toast(`${file.name}: ${e.message}`, true); }
  }
  setStatus("Đã lưu");
  loadAssets();
  if (last) select(last);
}
$("#tlUpload").onchange = (e) => { const list = [...e.target.files]; e.target.value = ""; if (list.length) placeFiles(list, state.time); };
{
  const tl = $("#timeline");
  const timeAt = (ev) => Math.max(0, (ev.clientX - $("#tracks").getBoundingClientRect().left) / state.pxPerSec);
  const carries = (ev) => [...(ev.dataTransfer?.types || [])].some((t) => t === "Files" || t === "text/hd-asset");
  // Thả trật ra ngoài timeline thì trình duyệt không được mở tệp đè lên Studio.
  for (const name of ["dragover", "drop"]) window.addEventListener(name, (ev) => { if (carries(ev)) ev.preventDefault(); });
  tl.addEventListener("dragover", (ev) => {
    if (!carries(ev)) return;
    ev.preventDefault();
    tl.classList.add("dropOn");
    const tip = $("#dragTip"), t = timeAt(ev);
    tip.hidden = false;
    tip.textContent = `Thả tại ${fmtTime(t)}`;
    tip.style.left = `${t * state.pxPerSec}px`;
    tip.style.top = "24px";
  });
  const clear = () => { tl.classList.remove("dropOn"); $("#dragTip").hidden = true; };
  tl.addEventListener("dragleave", (ev) => { if (!tl.contains(ev.relatedTarget)) clear(); });
  tl.addEventListener("drop", async (ev) => {
    if (!carries(ev)) return;
    ev.preventDefault();
    clear();
    const t = timeAt(ev), asset = ev.dataTransfer.getData("text/hd-asset");
    if (asset) {
      try { const r = await post("add-asset", { path: asset, time: t }); await refresh(); select(r.id); }
      catch (e) { toast(e.message, true); }
      return;
    }
    placeFiles([...ev.dataTransfer.files], t);
  });
}


// ---- Lịch sử chỉnh sửa: tự cập nhật, khôi phục phải xác nhận ----
let histSeen = "";
async function drawHistory() {
  if (!$("#tab-history").classList.contains("on")) return;
  let items;
  try { ({ items } = await api("lich-su")); } catch { return; }
  const key = items.length ? `${items.length}:${items[0].id}:${items[0].at}` : "0";
  if (key === histSeen) return;
  histSeen = key;
  const when = (t) => new Date(t).toLocaleTimeString("vi-VN");
  const wait = (t) => { const d = new Date(t), n = new Date(); return d.toDateString() === n.toDateString() ? when(t) : `${d.toLocaleDateString("vi-VN")} ${when(t)}`; };
  $("#histList").replaceChildren(...(items.length ? items.map((e) => {
    const label = e.loai === "them_file" ? "Bỏ tệp" : e.loai === "xoa_file" ? "Lấy lại" : "Khôi phục";
    const b = el("button", { textContent: label, disabled: !e.co_ban });
    b.onclick = () => confirmRestore(e, label);
    return el("div", { className: "hItem" }, el("span", { textContent: e.mo_ta }), b, el("small", { textContent: wait(e.at) }));
  }) : [el("p", { className: "hint", textContent: "Chưa có thay đổi nào." })]));
}
function confirmRestore(e, label) {
  const yes = el("button", { className: "primary", textContent: label }), no = el("button", { textContent: "Không" });
  no.onclick = closeModal;
  yes.onclick = async () => {
    closeModal();
    try { await post("khoi-phuc", { id: e.id }); await refresh(); loadAssets(); drawHistory(); toast("Đã khôi phục"); }
    catch (err) { toast(err.message, true); }
  };
  const msg = e.loai === "sua" ? "Timeline sẽ quay về đúng lúc trước thao tác này, các sửa đổi sau đó sẽ không còn trên timeline. Bạn vẫn có thể Hoàn tác hoặc khôi phục lại từ Lịch sử." : e.loai === "them_file" ? "Tệp sẽ được chuyển vào thùng rác của dự án." : "Tệp sẽ được đưa lại vào dự án.";
  openModal(el("h3", { textContent: `${label}: ${e.mo_ta}?` }), el("p", { className: "hint", textContent: msg }), el("div", { className: "row" }, yes, no));
}
setInterval(drawHistory, 1500);

// ---- Danh mục tổng và các lối tắt ----
function closeMenus() { for (const m of document.querySelectorAll(".topMenu")) { m.hidden = true; m.parentElement.querySelector(".menuBtn").setAttribute("aria-expanded", "false"); } }
for (const b of document.querySelectorAll(".menuBtn")) {
  b.onclick = (e) => {
    e.stopPropagation();
    const m = b.parentElement.querySelector(".topMenu"), was = m.hidden;
    closeMenus();
    m.hidden = !was;
    b.setAttribute("aria-expanded", String(was));
  };
}
document.addEventListener("click", closeMenus);
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenus(); });
const openTab = (name) => {
  const ui = readUi();
  if (ui.hideLeft) { ui.hideLeft = false; saveUi(ui); applyUi(ui); }
  document.querySelector(`.tabs [data-tab="${name}"]`).click();
};
$("#openHistory").onclick = () => openTab("history");
$("#openCode").onclick = () => openTab("code");
$("#openRenders").onclick = () => openTab("renders");
for (const b of document.querySelectorAll("[data-shape]")) b.onclick = async () => { const r = await edit("addShape", { shape: b.dataset.shape, time: state.time }); if (r?.id) select(r.id); };
for (const b of document.querySelectorAll("[data-cc]")) b.onclick = () => { cc.loai = b.dataset.cc; cc.nhom = ""; openCapcut(); };
document.querySelector("[data-mg]").onclick = () => $("#mgBtn").click();

// ---- Thư mục tài nguyên: để trống là dùng vị trí mặc định ----
$("#openPaths").onclick = async () => {
  const d = await fetch("/vn/duong-dan").then((r) => r.json());
  const rows = [["sfx", "Thư viện SFX"], ["fonts", "Thư mục font"], ["fontZip", "Tệp zip font CapCut"], ["templateVideos", "Video mẫu template"], ["lutZip", "Tệp zip LUT"]];
  const inputs = {};
  const body = rows.map(([k, t]) => { const i = el("input", { type: "text", value: d.saved[k] || "", placeholder: d.dang_dung[k], style: "width:100%" }); i.setAttribute("aria-label", t); inputs[k] = i; return field(t, i); });
  const save = el("button", { className: "primary", textContent: "Lưu" });
  save.onclick = async () => {
    await fetch("/vn/duong-dan", { method: "POST", body: JSON.stringify(Object.fromEntries(rows.map(([k]) => [k, inputs[k].value]))) });
    closeModal();
    toast("Đã lưu, khởi động lại Studio để áp dụng");
  };
  openModal(el("h3", { textContent: "Thư mục tài nguyên" }), el("p", { className: "hint", textContent: "Để trống là dùng vị trí mặc định, hiện mờ trong ô. Đặt tài nguyên vào thư mục TaiNguyen cạnh Apps thì Studio tự nhận." }), ...body, el("div", { className: "row" }, save));
};


// ---- Micro: ưu tiên ghi tại máy bằng FFmpeg + Whisper, không có mới dùng của trình duyệt ----
const micCtl = [];
function stopMics() { for (const m of micCtl) m.stop(); }
function attachMic(btn, input) {
  const label = btn.querySelector(".micText");
  const holder = input.placeholder;
  let mode = null, rec = null, base = "", wanted = false;
  const show = (on, text) => {
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", on ? "Tắt micro" : "Bật micro");
    btn.title = on ? "Đang nghe. Bấm để tắt micro" : "Bật micro để nói thay vì gõ";
    label.textContent = text || (on ? "Đang nghe" : "Micro");
    input.classList.toggle("nghe", on);
    input.placeholder = on ? "Đang nghe, nói xong bấm nút micro lần nữa…" : holder;
  };
  const addText = (t) => { input.value = [input.value.trim(), t.trim()].filter(Boolean).join(" "); input.focus(); };
  const browserStart = () => {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!R) return toast("Máy chưa có micro hoặc Whisper. Có thể bấm Windows + H để nói bằng Windows", true);
    rec = new R();
    rec.lang = "vi-VN"; rec.continuous = true; rec.interimResults = true;
    base = input.value.trim();
    wanted = true;
    rec.onresult = (e) => {
      let done = "", now = "";
      for (let i = e.resultIndex; i < e.results.length; i++) (e.results[i].isFinal ? (done += e.results[i][0].transcript) : (now += e.results[i][0].transcript));
      if (done) base = [base, done.trim()].filter(Boolean).join(" ");
      input.value = [base, now.trim()].filter(Boolean).join(" ");
    };
    rec.onerror = (e) => { if (e.error === "no-speech" || e.error === "aborted") return; wanted = false; toast("Trình duyệt không dùng được micro. Có thể bấm Windows + H để nói bằng Windows", true); };
    rec.onend = () => { if (wanted) { try { rec.start(); return; } catch { wanted = false; } } mode = null; show(false); };
    try { rec.start(); mode = "web"; show(true); } catch { wanted = false; show(false); }
  };
  const start = async () => {
    stopMics();
    let info = {};
    try { info = await fetch("/vn/mic").then((r) => r.json()); } catch { /* máy chủ đang bận */ }
    if (!info.ok) return browserStart();
    try {
      const r = await fetch("/vn/mic/start", { method: "POST" });
      if (!r.ok) throw new Error((await r.json()).error);
      mode = "local";
      show(true);
    } catch (e) { toast(e.message, true); }
  };
  const stop = async () => {
    if (mode === "web") { wanted = false; rec?.stop(); return; }
    if (mode !== "local") return;
    mode = null;
    show(false, "Đang chuyển…");
    btn.disabled = true;
    try {
      const hint = state.model?.clips.flatMap((c) => c.segments.map((x) => x.text)).join(" ").replace(/\*\*/g, "").slice(0, 400);
      const r = await fetch("/vn/mic/stop", { method: "POST", body: JSON.stringify({ hint }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.text) addText(d.text); else toast("Chưa nghe rõ, hãy nói lại");
    } catch (e) { toast(e.message, true); }
    btn.disabled = false;
    show(false);
  };
  btn.onclick = () => (mode ? stop() : start());
  const ctl = { stop: () => { if (mode) stop(); }, remove: () => { const i = micCtl.indexOf(ctl); if (i >= 0) micCtl.splice(i, 1); } };
  micCtl.push(ctl);
  return ctl;
}
attachMic($("#aiMic"), $("#aiInput"));
attachMic($("#aiChatMic"), $("#aiChatInput"));

// ---- Chuột phải trên clip: nhờ AI sửa đúng mục đó, hoàn tác và làm lại riêng mục đó ----
let ctxMic = null;
function closeCtx() { ctxMic?.stop(); ctxMic?.remove(); ctxMic = null; document.getElementById("ctxMenu")?.remove(); }
async function openCtx(c, x, y) {
  closeCtx();
  select(c.id);
  const input = el("textarea", { rows: 2, placeholder: "Nhờ AI sửa mục này… Enter để gửi" });
  input.setAttribute("aria-label", "Yêu cầu AI sửa mục này");
  input.addEventListener("paste", aiPaste);
  const mic = el("button", { className: "micBtn", type: "button" }, el("span", { className: "micText", textContent: "Micro" }));
  const send = el("button", { className: "primary", type: "button", textContent: "Gửi" });
  const go = async () => { const t = input.value; if (!t.trim()) return; closeCtx(); await aiSend(t, { clip: c.id }); };
  send.onclick = go;
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); go(); } if (e.key === "Escape") closeCtx(); });
  const step = (text, dir) => {
    const b = el("button", { className: "ctxBtn", type: "button", textContent: text, disabled: true });
    b.onclick = async () => {
      closeCtx();
      try { const r = await post("clip-buoc", { id: c.id, dir }); await refresh(); select(c.id); toast(dir === "undo" ? "Đã hoàn tác mục này" : "Đã làm lại mục này"); return r; }
      catch (e) { toast(e.message, true); }
    };
    return b;
  };
  const undo = step("↶ Hoàn tác mục này", "undo"), redo = step("↷ Làm lại mục này", "redo");
  const menu = el("div", { id: "ctxMenu" }, el("b", { textContent: clipLabel(c), title: c.id }), input, el("div", { className: "row" }, mic, send), el("hr"), undo, redo);
  document.body.append(menu);
  menu.addEventListener("pointerdown", (e) => e.stopPropagation());
  const r = menu.getBoundingClientRect();
  menu.style.left = `${Math.min(x, innerWidth - r.width - 8)}px`;
  menu.style.top = `${Math.max(8, Math.min(y, innerHeight - r.height - 8))}px`;
  ctxMic = attachMic(mic, input);
  input.focus();
  try { const n = await api(`clip-buoc?id=${encodeURIComponent(c.id)}`); undo.disabled = !n.undo; redo.disabled = !n.redo; } catch { /* để nút tắt */ }
}
$("#rows").addEventListener("contextmenu", (e) => {
  const box = e.target.closest(".clip");
  if (!box) return;
  e.preventDefault();
  const c = clipOf(box.dataset.id);
  if (c) openCtx(c, e.clientX, e.clientY);
});
document.addEventListener("pointerdown", () => closeCtx());

// ---- Đính kèm ảnh, video vào chat AI: nút, Ctrl+Shift+A, Ctrl+V, kéo thả ----
function drawAiFiles() {
  const box = $("#aiFiles");
  box.hidden = !ai.files.length;
  box.replaceChildren(...ai.files.map((f, i) => {
    const x = el("button", { type: "button", textContent: "×", title: "Bỏ tệp này" });
    x.setAttribute("aria-label", `Bỏ ${f.info.ten}`);
    x.onclick = () => { ai.files.splice(i, 1); drawAiFiles(); };
    return el("div", { className: "tepItem", title: f.info.ten }, f.url ? el("img", { src: f.url, alt: f.info.ten }) : el("span", { textContent: "Video" }), x);
  }));
}
async function addAiFiles(list) {
  const files = [...list].filter((f) => /^(image|video)\//.test(f.type));
  if (!files.length) return;
  $("#aiLog").hidden = false;
  for (const f of files) {
    toast(`Đang gắn ${f.name || "ảnh"}…`);
    try {
      const info = await api(`ai-tep?ten=${encodeURIComponent(f.name || "anh-dan.png")}`, { method: "POST", body: f });
      ai.files.push({ info, url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null });
      drawAiFiles();
    } catch (e) { toast(e.message, true); }
  }
  toast("Đã gắn tệp, nhập nội dung rồi Enter để gửi");
}
$("#aiAttach").onclick = () => $("#aiFileInput").click();
$("#aiFileInput").onchange = (e) => { addAiFiles(e.target.files); e.target.value = ""; };
function aiPaste(e) {
  const files = [...(e.clipboardData?.files || [])];
  if (files.length) { e.preventDefault(); addAiFiles(files); }
}
for (const box of [$("#aiChatInput"), $("#aiInput")]) box.addEventListener("paste", aiPaste);
{
  const log = $("#aiLog");
  log.addEventListener("dragover", (e) => { if ([...(e.dataTransfer?.types || [])].includes("Files")) { e.preventDefault(); e.stopPropagation(); log.classList.add("tha"); } });
  log.addEventListener("dragleave", () => log.classList.remove("tha"));
  log.addEventListener("drop", (e) => { e.preventDefault(); e.stopPropagation(); log.classList.remove("tha"); addAiFiles(e.dataTransfer.files); });
}
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "a") { e.preventDefault(); $("#aiLog").hidden = false; $("#aiFileInput").click(); }
});
