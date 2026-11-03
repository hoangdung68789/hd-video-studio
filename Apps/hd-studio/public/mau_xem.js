// Hoạt ảnh trên từng thẻ mẫu: chạy bằng Web Animations nên nhẹ, tự dừng khi thẻ cuộn ra khỏi màn hình.
// Thông số lấy đúng từ dữ liệu mẫu; xem chính xác trên video thì bấm vào thẻ.
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = { none: "linear", "back.out(1.5)": "cubic-bezier(.34,1.4,.64,1)", "back.out(1.6)": "cubic-bezier(.34,1.48,.64,1)", "back.out(1.7)": "cubic-bezier(.34,1.56,.64,1)", "back.out(1.8)": "cubic-bezier(.34,1.62,.64,1)", "back.out(2.0)": "cubic-bezier(.34,1.75,.64,1)", "expo.out": "cubic-bezier(.16,1,.3,1)", "expo.in": "cubic-bezier(.7,0,.84,0)", "power3.out": "cubic-bezier(.22,1,.36,1)", "power2.out": "cubic-bezier(.33,1,.68,1)", "power2.in": "cubic-bezier(.55,.06,.68,.19)", "power2.inOut": "cubic-bezier(.65,0,.35,1)", "sine.inOut": "cubic-bezier(.37,0,.63,1)" };
// Đường cong thật của từng easing kiểu GSAP, để ô xem trước chạy đúng như trên video.
const BASE = {
  sine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  power1: (t) => t * t,
  power2: (t) => t ** 3,
  power3: (t) => t ** 4,
  power4: (t) => t ** 5,
  expo: (t) => (t === 0 ? 0 : 2 ** (10 * t - 10)),
  circ: (t) => 1 - Math.sqrt(1 - t * t),
  back: (t, a = 1.7) => t * t * ((a + 1) * t - a),
  elastic: (t, a = 1, p = 0.4) => (t === 0 || t === 1 ? t : -a * 2 ** (10 * t - 10) * Math.sin(((t * 10 - 10.75) * (2 * Math.PI)) / (p * 3.33))),
  bounce: (t) => { const o = (x) => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; }; return 1 - o(1 - t); },
};
export function easeFn(name) {
  const m = /^(\w+)(?:\.(in|out|inOut))?(?:\(([^)]*)\))?$/.exec(name || "");
  if (!m || m[1] === "none" || !BASE[m[1]]) return (t) => t;
  const args = (m[3] || "").split(",").filter(Boolean).map(Number), f = (t) => BASE[m[1]](t, ...args), dir = m[2] || "out";
  if (dir === "in") return f;
  if (dir === "out") return (t) => 1 - f(1 - t);
  return (t) => (t < 0.5 ? f(t * 2) / 2 : 1 - f((1 - t) * 2) / 2);
}
const easeOf = (e) => {
  if (!e || /^steps/.test(e)) return e || "cubic-bezier(.22,1,.36,1)";
  if (e === "none") return "linear";
  const f = easeFn(e);
  return `linear(${Array.from({ length: 41 }, (_, i) => +f(i / 40).toFixed(4)).join(",")})`;
};

const pause = new IntersectionObserver((list) => {
  for (const e of list) for (const a of e.target.getAnimations({ subtree: true })) e.isIntersecting ? a.play() : a.pause();
});

// Nạp đúng phông của mẫu cho ô xem trước; app.js gắn hàm nạp vào đây.
let fontOf = () => "";
export function setFontLoader(fn) { fontOf = fn; }
const useFont = (n, name) => { const f = name && fontOf(name); if (f) { n.style.fontFamily = `"${f}", sans-serif`; n.style.fontWeight = "normal"; } };
const mk = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
function stage(extra) {
  const s = mk("div", `mxStage${extra ? ` ${extra}` : ""}`);
  pause.observe(s);
  return s;
}

// Biến kiểu GSAP (x, y, scale, opacity, filter...) thành thuộc tính CSS của một khung hình.
function frame(v = {}, keys) {
  const out = { transform: `translate(${v.x || 0}px,${v.y || 0}px) scale(${v.scale ?? 1}) rotate(${v.rotation || 0}deg)`, opacity: v.opacity ?? 1 };
  for (const k of keys) out[k] = v[k] ?? { filter: "blur(0px)", clipPath: "inset(0 0 0% 0)", letterSpacing: "0em" }[k];
  return out;
}
// Một vòng lặp: chờ, vào, giữ, ra, nghỉ.
function loop(node, { from = {}, to = {}, exit, inMs = 300, holdMs = 1000, outMs = 200, gapMs = 400, delay = 0, ease, exitEase, cycle }) {
  if (still) return;
  const end = exit || { opacity: 0 };
  const total = cycle || delay + inMs + holdMs + outMs + gapMs;
  const keys = ["filter", "clipPath", "letterSpacing"].filter((k) => from[k] !== undefined || to[k] !== undefined || end[k] !== undefined);
  const at = (ms) => Math.min(1, ms / total);
  node.animate([
    { offset: 0, ...frame(from, keys), easing: "linear" },
    { offset: at(delay), ...frame(from, keys), easing: easeOf(ease) },
    { offset: at(delay + inMs), ...frame(to, keys), easing: "linear" },
    { offset: at(delay + inMs + holdMs), ...frame(to, keys), easing: easeOf(exitEase || "power2.in") },
    { offset: at(delay + inMs + holdMs + outMs), ...frame(end, keys), easing: "linear" },
    { offset: 1, ...frame(end, keys) },
  ], { duration: total, iterations: Infinity });
}
const pulse = (node, frames, ms = 1800, opts = {}) => { if (!still) node.animate(frames, { duration: ms, iterations: Infinity, easing: "ease-in-out", ...opts }); };

const SAMPLE = "NHÀ ĐẸP";
// Chia chữ theo từ hoặc theo ký tự để thấy nhịp so le.
function textNodes(host, text, mode) {
  const line = mk("div", "mxText");
  host.append(line);
  if (mode === "word" || mode === "letter") {
    const parts = mode === "word" ? text.split(" ") : [...text];
    return { line, parts: parts.map((t) => { const s = mk("span", "mxPart", t === " " ? " " : t); line.append(s); if (mode === "word") line.append(" "); return s; }) };
  }
  line.textContent = text;
  return { line, parts: [line] };
}

export function entrance(p) {
  const s = stage();
  const mode = p.animPatch?.mode || "text";
  const { parts } = textNodes(s, SAMPLE, mode);
  const inMs = (p.gsapTo?.duration || 0.35) * 1000;
  const gap = mode === "word" ? 90 : mode === "letter" ? 45 : 0;
  parts.forEach((n, i) => loop(n, { from: p.gsapFrom, to: { ...p.gsapTo, duration: undefined }, inMs, ease: p.gsapTo?.ease, delay: 150 + i * gap, holdMs: Math.max(300, 1500 - i * gap), cycle: 2400 }));
  return s;
}
export function exit(p) {
  const s = stage();
  const { parts } = textNodes(s, SAMPLE);
  const outMs = (p.gsapTo?.duration || 0.2) * 1000;
  loop(parts[0], { from: { opacity: 0, y: 8 }, to: {}, exit: { ...p.gsapTo, duration: undefined }, inMs: 220, holdMs: 1300, outMs, exitEase: p.gsapTo?.ease, gapMs: 500 });
  return s;
}

// Lớp VFX phủ lên một khối chữ.
function vfxLayer(host, text, type, color = "#FFD147") {
  if (type === "light_sweep") {
    const r = mk("div", "mxSweep");
    host.append(r);
    pulse(r, [{ transform: "translateX(-130%)" }, { transform: "translateX(-130%)", offset: 0.35 }, { transform: "translateX(230%)", offset: 0.65 }, { transform: "translateX(230%)" }], 2200);
  } else if (type === "halation_glow" || type === "counter_pulse_glow" || type === "key_word_accent_glow") {
    pulse(text, [{ textShadow: `0 0 2px ${color}55` }, { textShadow: `0 0 16px ${color}, 0 0 34px ${color}aa` }, { textShadow: `0 0 2px ${color}55` }]);
  } else if (type === "underline_stroke_draw") {
    const l = mk("div", "mxLine");
    l.style.background = color;
    text.parentElement.append(l);
    if (!still) l.animate([{ transform: "scaleX(0)", offset: 0 }, { transform: "scaleX(0)", offset: 0.2 }, { transform: "scaleX(1)", offset: 0.45, easing: "linear" }, { transform: "scaleX(1)", offset: 0.85 }, { transform: "scaleX(0)", offset: 1 }], { duration: 2400, iterations: Infinity, easing: "cubic-bezier(.16,1,.3,1)" });
  } else if (type === "glass_badge") {
    text.classList.add("mxGlass");
    text.style.borderColor = `${color}aa`;
  } else if (type === "difference_blend") {
    const b = mk("div", "mxDiff");
    host.append(b);
    pulse(b, [{ transform: "translateX(-110%)" }, { transform: "translateX(0%)", offset: 0.4 }, { transform: "translateX(0%)", offset: 0.7 }, { transform: "translateX(110%)" }], 2400);
  } else if (type === "subtle_vignette_dim") {
    const b = mk("div", "mxDim");
    host.append(b);
    pulse(b, [{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }]);
  } else if (type === "rgb_split") {
    pulse(text, [{ textShadow: "0 0 0 #ff003c, 0 0 0 #00e5ff" }, { textShadow: "4px 0 0 #ff003c, -4px 0 0 #00e5ff" }, { textShadow: "0 0 0 #ff003c, 0 0 0 #00e5ff" }], 1400);
  } else if (type === "stamp_shockwave_ring") {
    const r = mk("div", "mxRing");
    r.style.borderColor = color;
    host.append(r);
    pulse(r, [{ opacity: 0, transform: "translate(-50%,-50%) scale(.6)" }, { opacity: 0, transform: "translate(-50%,-50%) scale(.6)", offset: 0.2 }, { opacity: 0.9, transform: "translate(-50%,-50%) scale(.85)", offset: 0.22 }, { opacity: 0, transform: "translate(-50%,-50%) scale(1.5)", offset: 0.55 }, { opacity: 0, transform: "translate(-50%,-50%) scale(1.5)" }], 2200, { easing: "linear" });
  }
}
export function vfx(type, color) {
  const s = stage();
  const { line } = textNodes(s, SAMPLE);
  line.style.color = color || "#fff";
  vfxLayer(s, line, type, color || "#FFD147");
  return s;
}

const scene = (url, cls) => { const n = mk("div", `mxScene${cls ? ` ${cls}` : ""}`); if (url) n.style.backgroundImage = `url("${url}")`; return n; };
export function camera(p, thumbs = []) {
  const s = stage("mxFull");
  const img = scene(thumbs[0], "a");
  s.append(img);
  if (still) return s;
  const kf = p.keyframes || [];
  const toF = (k) => ({ transform: `translate(${(k.x || 0) * 0.5}px,${(k.y || 0) * 0.5}px) scale(${k.scale ?? 1})` });
  const frames = kf.map((k) => ({ offset: k.pos * 0.82, ...toF(k), easing: k.ease ? `cubic-bezier(${k.ease.join(",")})` : "linear" }));
  frames.push({ offset: 1, ...toF(kf[kf.length - 1] || {}) });
  img.animate(frames, { duration: 2800, iterations: Infinity });
  return s;
}
export function transition(p, thumbs = []) {
  const s = stage("mxFull");
  const a = scene(thumbs[0], "a"), b = scene(thumbs[1] || thumbs[0], "b");
  s.append(a, b);
  const fx = p.cssEffect || "";
  const dur = (p.duration || 0.4) * 1000, total = 2400;
  const cut = 1000 / total, end = (1000 + dur) / total;
  const run = (n, from, to, easing = "cubic-bezier(.65,0,.35,1)") => { if (!still) n.animate([{ offset: 0, ...from }, { offset: cut, ...from, easing }, { offset: end, ...to }, { offset: 1, ...to }], { duration: total, iterations: Infinity }); };
  if (fx === "whip_pan") {
    run(a, { transform: "translateX(0)", filter: "blur(0px)" }, { transform: "translateX(-100%)", filter: "blur(8px)" });
    run(b, { transform: "translateX(100%)", filter: "blur(8px)" }, { transform: "translateX(0)", filter: "blur(0px)" });
  } else if (fx === "zoom_through") {
    run(a, { transform: "scale(1)", opacity: 1 }, { transform: "scale(2.6)", opacity: 0 });
    run(b, { transform: "scale(.7)", opacity: 0 }, { transform: "scale(1)", opacity: 1 });
  } else if (fx === "match_cut") {
    run(b, { transform: "scale(1.14)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }, "cubic-bezier(.16,1,.3,1)");
  } else if (fx === "cross_dissolve") {
    run(b, { opacity: 0 }, { opacity: 1 });
  } else {
    // Hard cut, Flash Hit: đổi cảnh tức thì, có chớp sáng tại điểm cắt.
    run(b, { opacity: 0 }, { opacity: 1 }, "steps(1,start)");
    const f = mk("div", "mxFlash");
    s.append(f);
    if (!still) f.animate([{ offset: 0, opacity: 0 }, { offset: cut, opacity: 0 }, { offset: cut + 0.01, opacity: fx === "flash_hit" ? 0.95 : 0.45 }, { offset: end + 0.04, opacity: 0 }, { offset: 1, opacity: 0 }], { duration: total, iterations: Infinity });
  }
  return s;
}

// Icon vẽ nét rồi nảy lên, như cách mẫu mở đầu.
export function iconSvg(ic, color, size) {
  const box = mk("div", "mxIcon");
  if (size) box.style.width = box.style.height = size;
  box.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="${color || ic.default_color || "#FFD147"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ic.svg_paths || ""}</svg>`;
  if (still) return box;
  for (const n of box.querySelectorAll("svg *")) {
    n.setAttribute("pathLength", "1");
    n.style.strokeDasharray = "1";
    n.animate([{ strokeDashoffset: 1, offset: 0 }, { strokeDashoffset: 1, offset: 0.08 }, { strokeDashoffset: 0, offset: 0.34, easing: "linear" }, { strokeDashoffset: 0, offset: 1 }], { duration: 2600, iterations: Infinity, easing: "cubic-bezier(.33,1,.68,1)" });
  }
  box.animate([{ transform: "scale(.6)", opacity: 0, offset: 0 }, { transform: "scale(.6)", opacity: 0, offset: 0.06 }, { transform: "scale(1)", opacity: 1, offset: 0.34, easing: "linear" }, { transform: "scale(1)", opacity: 1, offset: 0.88 }, { transform: "scale(.9)", opacity: 0, offset: 1 }], { duration: 2600, iterations: Infinity, easing: "cubic-bezier(.34,1.56,.64,1)" });
  return box;
}
export function icon(ic, color) {
  const s = stage("mxIconStage");
  s.append(iconSvg(ic, color));
  return s;
}

// Chữ VFX: đúng quy tắc máy chủ dựng theo tên hiệu ứng vào, ra (xem addTextVfxPreset trong lib/html.mjs).
const inVars = (name) => {
  const n = String(name || "").toLowerCase();
  if (n === "none") return { from: {}, to: {} };
  if (n.includes("stamp")) return { from: { opacity: 0, scale: 1.42, filter: "blur(4px)" }, to: { filter: "blur(0px)" } };
  if (n.includes("blur")) return { from: { opacity: 0, y: 16, filter: "blur(12px)" }, to: { filter: "blur(0px)" } };
  if (n.includes("mask")) return { from: { opacity: 0, y: 38 }, to: {} };
  return { from: { opacity: 0, y: 26, scale: 0.84, filter: "blur(5px)" }, to: { filter: "blur(0px)" } };
};
const outVars = (name) => {
  const n = String(name || "").toLowerCase();
  if (n === "none") return { opacity: 1 };
  if (n.includes("evaporate")) return { opacity: 0, filter: "blur(6px)" };
  if (n.includes("scale")) return { opacity: 0, scale: 0.9 };
  return { opacity: 0, y: -14 };
};
export function tx(cp, ic) {
  const s = stage("mxTx");
  const wrap = mk("div", `mxTxWrap${cp.icon_pos === "left" ? " left" : ""}`);
  s.append(wrap);
  const showIcon = ic && cp.icon_pos !== "none";
  if (showIcon) wrap.append(iconSvg(ic, cp.icon_color || cp.color_primary));
  const txt = mk("div", "mxTxText");
  const main = mk("div", "mxMain", cp.text_main || SAMPLE);
  main.style.color = cp.color_primary || "#FFD147";
  const sub = mk("div", "mxSub", cp.text_sub || "");
  sub.style.color = cp.color_secondary || "#fff";
  useFont(main, cp.font_main);
  useFont(sub, cp.font_sub);
  txt.append(main);
  if (cp.text_sub) txt.append(sub);
  wrap.append(txt);
  const a = inVars(cp.in_effect), out = outVars(cp.out_effect);
  const inMs = (cp.in_duration_s || 0.32) * 1000, ease = cp.in_easing, outMs = (cp.out_duration_s || 0.18) * 1000;
  // Tỉ lệ cỡ chữ, viền, phát sáng theo thông số thật của mẫu.
  if (cp.size_main_pct) main.style.fontSize = `${Math.max(9, Math.min(26, cp.size_main_pct * 1.7))}px`;
  if (cp.size_sub_pct) sub.style.fontSize = `${Math.max(7, Math.min(16, cp.size_sub_pct * 2.1))}px`;
  if (+cp.stroke_width_px > 0) { main.style.webkitTextStroke = `${Math.min(2, cp.stroke_width_px * 0.2)}px ${cp.stroke_color || "#000"}`; main.style.paintOrder = "stroke fill"; }
  if (+cp.glow_opacity > 0) main.style.textShadow = `0 0 ${6 + cp.glow_opacity * 12}px ${cp.glow_color || cp.color_primary}`;
  loop(main, { ...a, inMs, ease, delay: showIcon ? 120 : 60, exit: out, holdMs: 1300, outMs, cycle: 2600 + outMs });
  if (cp.text_sub) loop(sub, { from: { opacity: 0, y: 12, filter: "blur(3px)" }, to: { filter: "blur(0px)" }, inMs, ease: "power3.out", delay: 190, exit: out, holdMs: 1230, outMs: 180, cycle: 2600 });
  vfxLayer(s, main, cp.vfx_type, cp.color_primary);
  return s;
}
export function mg(m, ic, params = {}) {
  const p = { ...(m.default_params || {}), ...params };
  const accent = p.accent_color || "#FFD147";
  const s = stage("mxMg");
  const card = mk("div", "mxCard");
  card.style.borderColor = `${accent}99`;
  s.append(card);
  const head = mk("div", "mxCardHead");
  if (ic) head.append(iconSvg(ic, accent, "20px"));
  const title = mk("b", "", p.title || m.name);
  title.style.color = accent;
  useFont(title, p.font_title || "Montserrat-ExtraBold");
  head.append(title);
  card.append(head);
  loop(card, { from: { opacity: 0, scale: 0.86, y: 12 }, to: {}, inMs: 300, ease: "back.out(1.7)", delay: 60, exit: { opacity: 0, y: -8 }, holdMs: 1650, outMs: 200, cycle: 2800 });
  [p.line1, p.line2, p.line3].filter(Boolean).forEach((t, i) => {
    const l = mk("div", "mxCardLine", t);
    useFont(l, p.font_line || "BeVietnamPro-Bold");
    card.append(l);
    loop(l, { from: { opacity: 0, x: -10 }, to: {}, inMs: 240, ease: "power3.out", delay: 280 + i * 130, exit: { opacity: 1 }, holdMs: 1500 - i * 130, outMs: 60, cycle: 2800 });
  });
  return s;
}
// Dùng ở bộ chọn hiệu ứng vào, ra của Chữ VFX.
export function textIn(name, color) {
  const s = stage();
  const { line } = textNodes(s, SAMPLE);
  if (color) line.style.color = color;
  loop(line, { ...inVars(name), inMs: 360, ease: "back.out(1.7)", delay: 120, holdMs: 1300, outMs: 140, cycle: 2300 });
  return s;
}
export function textOut(name, color) {
  const s = stage();
  const { line } = textNodes(s, SAMPLE);
  if (color) line.style.color = color;
  loop(line, { from: { opacity: 0, y: 6 }, to: {}, inMs: 200, holdMs: 1200, exit: outVars(name), outMs: 260, gapMs: 500 });
  return s;
}
// Kết hợp vào + ra trên cùng một chữ.
export function combo(inP, outP) {
  const s = stage();
  const { parts } = textNodes(s, SAMPLE);
  loop(parts[0], { from: inP.gsapFrom, to: { ...inP.gsapTo, duration: undefined }, inMs: (inP.gsapTo?.duration || 0.35) * 1000, ease: inP.gsapTo?.ease, delay: 150, exit: { ...outP.gsapTo, duration: undefined }, exitEase: outP.gsapTo?.ease, holdMs: 1200, outMs: (outP.gsapTo?.duration || 0.2) * 1000, gapMs: 450 });
  return s;
}
// Từ quan trọng chuyển màu mượt.
export function highlight(color) {
  const s = stage();
  const line = mk("div", "mxText");
  line.append("GIÁ ");
  const w = mk("span", "mxPart", "7,6 TỶ");
  line.append(w);
  s.append(line);
  if (!still) w.animate([{ color: "#ffffff", offset: 0 }, { color: "#ffffff", offset: 0.2 }, { color, offset: 0.34 }, { color, offset: 0.9 }, { color: "#ffffff", offset: 1 }], { duration: 2400, iterations: Infinity });
  return s;
}
// Bảng màu: chữ mẫu theo từng màu trong bảng.
export function palette(vars) {
  const s = stage("mxPal");
  Object.values(vars || {}).slice(0, 4).forEach((c, i) => {
    const n = mk("b", "", ["7,6 TỶ", "120 m²", "SỔ HỒNG", "QUẬN 1"][i]);
    n.style.color = c;
    s.append(n);
    loop(n, { from: { opacity: 0, y: 8 }, to: {}, inMs: 280, delay: 100 + i * 120, holdMs: 1400 - i * 120, cycle: 2400, ease: "back.out(1.7)" });
  });
  return s;
}

// ---- Xem trước theo đúng thông số đang chỉnh ----
// Kiểu Vào hoặc Ra với thời lượng, easing, chế độ chữ, biên độ, độ nhòe đang đặt.
export function combo2(inP, outP, mc = {}) {
  const s = stage();
  const { parts } = textNodes(s, SAMPLE, mc.mode || "text");
  const gap = (mc.delay ?? 1) * 40 * (mc.mode === "letter" ? 1 : mc.mode === "word" ? 2 : 0);
  parts.forEach((n, i) => loop(n, { from: inP?.gsapFrom || { opacity: 1 }, to: { ...(inP?.gsapTo || {}), duration: undefined }, inMs: (mc.dur || 0.4) * 1000, ease: mc.ease, delay: 150 + i * gap, exit: outP ? { ...outP.gsapTo, duration: undefined } : { opacity: 1 }, exitEase: outP?.gsapTo?.ease, holdMs: 1100, outMs: (outP?.gsapTo?.duration || 0.2) * 1000, gapMs: 400 }));
  return s;
}
export function motionLive(p, cat, mc = {}) {
  const s = stage();
  const mode = mc.mode || "text";
  const { parts } = textNodes(s, SAMPLE, mode);
  const ms = Math.max(120, (mc.dur || p.gsapTo?.duration || 0.4) * 1000);
  const gap = (mc.delay ?? 1) * (mode === "word" ? 90 : mode === "letter" ? 45 : 0);
  const dist = (mc.dist ?? 0.04) * 620, blur = mc.blur ?? 0;
  const base = { opacity: 0, ...(p.gsapFrom || {}) };
  const from = { ...base, ...(base.y ? { y: Math.sign(base.y) * dist } : {}), ...(base.x ? { x: Math.sign(base.x) * dist } : {}), ...(blur ? { filter: `blur(${blur}px)` } : {}) };
  const end = { ...(p.gsapTo || {}), duration: undefined };
  parts.forEach((n, i) => {
    if (cat === "exit") loop(n, { from: { opacity: 0 }, to: {}, inMs: 180, holdMs: 900, exit: { ...end, ...(blur ? { filter: `blur(${blur}px)` } : {}), ...(end.y ? { y: Math.sign(end.y) * dist } : {}) }, outMs: ms, exitEase: mc.ease, gapMs: 450, delay: i * gap });
    else loop(n, { from, to: blur ? { filter: "blur(0px)" } : {}, inMs: ms, ease: mc.ease, delay: 120 + i * gap, holdMs: Math.max(300, 1000 - i * gap), outMs: 120, gapMs: 400 });
  });
  return s;
}
// Đường chuyển động của easing: chấm chạy qua khung.
export function easing(name) {
  const s = stage("mxEase");
  const f = easeFn(name);
  // Đồ thị đường cong và chấm chạy thật theo đường cong đó.
  const pts = Array.from({ length: 33 }, (_, i) => { const t = i / 32; return `${(4 + t * 92).toFixed(1)},${(36 - f(t) * 24).toFixed(1)}`; }).join(" ");
  const g = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  g.setAttribute("viewBox", "0 0 100 44");
  g.setAttribute("preserveAspectRatio", "none");
  g.setAttribute("class", "mxCurve");
  g.innerHTML = `<line x1="4" y1="36" x2="96" y2="36" /><line x1="4" y1="12" x2="96" y2="12" /><polyline points="${pts}" />`;
  s.append(g);
  const dot = mk("i", "mxDot");
  s.append(dot);
  if (!still) dot.animate([{ left: "6%", offset: 0, easing: easeOf(name) }, { left: "94%", offset: 0.6 }, { left: "94%", offset: 1 }], { duration: 1900, iterations: Infinity });
  return s;
}
// Ô xem trước chế độ hòa trộn: chữ đặt trên nền có ảnh sáng tối để thấy rõ khác biệt.
export function blend(mode) {
  const s = stage("mxBlend");
  s.style.isolation = "isolate";
  const t = mk("div", "mxBlendTx", "NHÀ ĐẸP");
  t.style.mixBlendMode = mode || "normal";
  s.append(t);
  return s;
}
export function textMode(mode) {
  return motionLive({ gsapFrom: { opacity: 0, y: 20 }, gsapTo: { opacity: 1, y: 0 } }, "entrance", { mode, dur: 0.3, ease: "power3.out", dist: 0.03 });
}
// Icon đủ nền, nhãn, độ dày nét, kiểu vào.
export function iconFull(ic, q = {}) {
  const s = stage("mxIconLive");
  const wrap = mk("div", "mxIconWrap");
  s.append(wrap);
  const box = mk("div", "mxBadge");
  const px = Math.max(16, Math.min(64, (q.size || 88) * 0.4));
  box.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="${q.color || ic.default_color || "#FFD147"}" stroke-width="${q.stroke || 2.4}" stroke-linecap="round" stroke-linejoin="round" style="width:${px}px;height:${px}px">${ic.svg_paths || ""}</svg>`;
  if (q.badge !== false) {
    const c = q.badgeColor || "#0a0e16", a = Math.round((q.badgeAlpha ?? 0.72) * 255).toString(16).padStart(2, "0");
    box.style.cssText = `background:${c}${a};border:1.5px solid ${q.color || ic.default_color || "#FFD147"}cc;border-radius:${(q.radius ?? 24) * 0.4}px;padding:6px`;
  }
  wrap.append(box);
  if (q.showLabel !== false) {
    const l = mk("div", "mxIconLabel", q.label || ic.name_vi?.split("(")[0].trim() || "");
    l.style.color = q.labelColor || "#fff";
    useFont(l, q.font_label || "BeVietnamPro-Bold");
    l.style.fontSize = `${Math.max(8, (q.labelSize || 36) * 0.34)}px`;
    wrap.append(l);
  }
  const F = { pop: { opacity: 0, scale: 0.5, y: 8 }, fade: { opacity: 0 }, slide: { opacity: 0, y: 24 }, spin: { opacity: 0, scale: 0.5, rotation: -90 } }[q.anim || "pop"];
  loop(wrap, { from: F, to: {}, inMs: 320, ease: q.anim === "fade" ? "sine.inOut" : "back.out(1.7)", delay: 100, holdMs: 1300, outMs: 160, gapMs: 400 });
  return s;
}
// Chữ 3D bám tường.
export function wall(q = {}) {
  const s = stage("mxWall");
  const t = mk("div", "mxWallText", q.text || SAMPLE);
  const size = Math.max(10, Math.min(38, (q.size || 120) * 0.2));
  const depth = Math.round((q.depth || 0) * 0.2);
  const layers = Array.from({ length: depth }, (_, i) => `${i + 1}px ${i + 1}px 0 ${q.depth_c || "#333"}`);
  if ((q.shadow ?? 0.5) > 0) layers.push(`${depth + 3}px ${depth + 5}px 8px rgba(0,0,0,${q.shadow ?? 0.5})`);
  t.style.cssText = `font-size:${size}px;color:${q.color || "#fff"};letter-spacing:${q.spacing || 0}em;font-weight:${q.weight || 800};opacity:${q.opacity ?? 1};mix-blend-mode:${q.blend || "normal"};text-shadow:${layers.join(",") || "none"};${q.stroke_w ? `-webkit-text-stroke:${Math.max(0.5, q.stroke_w * 0.2)}px ${q.stroke_c || "#000"};` : ""}transform:perspective(${(q.persp || 1400) * 0.3}px) rotateX(${q.rot_x || 0}deg) rotateY(${q.rot_y ?? -28}deg) rotateZ(${q.rot_z || 0}deg) skewX(${q.skew || 0}deg)`;
  useFont(t, q.font);
  s.append(t);
  return s;
}
// Hình mặt nạ trên ảnh mẫu.
export function maskTile(cssText, thumb) {
  const s = stage("mxFull");
  const img = scene(thumb, "a");
  img.style.cssText += `;${cssText}`;
  s.append(img);
  return s;
}
