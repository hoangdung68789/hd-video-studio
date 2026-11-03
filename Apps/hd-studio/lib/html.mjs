// Đọc và sửa composition HyperFrames (index.html) ngay trên văn bản nguồn,
// không dựng lại toàn bộ HTML để giữ nguyên mọi thứ AI đã viết.
import { ANIMATED_ICONS, TEXT_VFX_PRESETS, MOTION_PRESETS, MG_TEMPLATES, BDS_COLOR_PALETTES } from "./pro_presets.mjs";
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const TAG = /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^'">])*?)(\/?)>/gi;
const ATTR = /([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

export function scan(html) {
  const nodes = [], stack = [];
  TAG.lastIndex = 0;
  let m;
  while ((m = TAG.exec(html))) {
    if (m[1]) {
      const name = m[1].toLowerCase();
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].name !== name) continue;
        for (let j = stack.length - 1; j > i; j--) { stack[j].closeStart = stack[j].closeEnd = m.index; }
        stack[i].closeStart = m.index;
        stack[i].closeEnd = m.index + m[0].length;
        stack.length = i;
        break;
      }
      continue;
    }
    if (!m[2]) continue;
    const name = m[2].toLowerCase();
    const attrs = {};
    ATTR.lastIndex = 0;
    let a;
    while ((a = ATTR.exec(m[3]))) attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4] ?? "";
    const node = { name, attrs, id: attrs.id, start: m.index, openEnd: m.index + m[0].length, closeStart: m.index + m[0].length, closeEnd: m.index + m[0].length, parent: stack[stack.length - 1] || null, children: [] };
    if (node.parent) node.parent.children.push(node);
    nodes.push(node);
    if (name === "script" || name === "style") {
      const re = new RegExp(`</${name}\\s*>`, "gi");
      re.lastIndex = node.openEnd;
      const c = re.exec(html);
      if (c) { node.closeStart = c.index; node.closeEnd = c.index + c[0].length; TAG.lastIndex = node.closeEnd; }
      continue;
    }
    if (!m[4] && !VOID.has(name)) stack.push(node);
  }
  return nodes;
}

function skipString(s, i) {
  const q = s[i];
  for (i++; i < s.length; i++) {
    if (s[i] === "\\") i++;
    else if (s[i] === q) return i;
  }
  return i;
}

// Tách đối số của lời gọi bắt đầu ngay sau dấu "(": trả về vị trí từng đối số và dấu ")" đóng.
function splitArgs(s, open) {
  let depth = 0, from = open;
  const args = [];
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (c === '"' || c === "'" || c === "`") i = skipString(s, i);
    else if ("([{".includes(c)) depth++;
    else if (")]}".includes(c)) {
      if (depth === 0) { args.push([from, i]); return { args, close: i }; }
      depth--;
    } else if (c === "," && depth === 0) { args.push([from, i]); from = i + 1; }
  }
  return null;
}

export function parseTweens(html, nodes) {
  const tweens = [];
  for (const script of nodes.filter((n) => n.name === "script" && n.closeStart > n.openEnd)) {
    const body = html.slice(0, script.closeStart);
    const re = /([A-Za-z_$][\w$]*)\s*\.\s*(fromTo|from|to|set)\s*\(/g;
    re.lastIndex = script.openEnd;
    let m;
    while ((m = re.exec(body))) {
      if (m[1] === "gsap") continue;
      const parsed = splitArgs(body, m.index + m[0].length);
      if (!parsed || parsed.args.length < 2) continue;
      const text = (r) => body.slice(r[0], r[1]);
      const lastArg = parsed.args[parsed.args.length - 1];
      const raw = text(lastArg);
      if (!/^\s*-?\d*\.?\d+\s*$/.test(raw)) continue;
      const lead = raw.length - raw.trimStart().length;
      const posStart = lastArg[0] + lead, posEnd = posStart + raw.trim().length;
      const varsArg = parsed.args[m[2] === "fromTo" ? 2 : 1];
      const vars = text(varsArg);
      const d = /\bduration\s*:\s*(\d*\.?\d+)/.exec(vars);
      const e = /\bease\s*:\s*["']([^"']+)["']/.exec(vars);
      const rep = /\brepeat\s*:\s*(\d+)/.exec(vars);
      const first = text(parsed.args[0]).trim();
      let id = null, selector = null;
      if (/^["'`]/.test(first)) {
        selector = first.slice(1, -1);
        id = /#([\w-]+)/.exec(selector)?.[1] ?? null;
      } else {
        id = /["']#([\w-]+)["']/.exec(body.slice(m.index, parsed.close))?.[1] ?? (first === "cam" ? "map" : null);
      }
      // Hiệu ứng tác động lên phần tử khác (zoom, rung cảnh...) ghi data: "<id clip hiệu ứng>" để thuộc về clip đó trên timeline.
      const fx = /\bdata\s*:\s*["']([\w-]+)["']/.exec(vars)?.[1];
      if (fx && nodes.some((n) => n.id === fx)) id = fx;
      if (!id) { re.lastIndex = parsed.close; continue; }
      let stmtEnd = parsed.close + 1;
      if (body[stmtEnd] === ";") stmtEnd++;
      const dur = d ? +d[1] : 0;
      tweens.push({
        i: tweens.length, id, selector, method: m[2], pos: +raw, dur, total: dur * (1 + (rep ? +rep[1] : 0)), ease: e?.[1] ?? "",
        posStart, posEnd,
        durStart: d ? varsArg[0] + d.index + d[0].length - d[1].length : -1, durEnd: d ? varsArg[0] + d.index + d[0].length : -1,
        easeStart: e ? varsArg[0] + e.index + e[0].indexOf(e[1]) : -1, easeEnd: e ? varsArg[0] + e.index + e[0].indexOf(e[1]) + e[1].length : -1,
        stmtStart: m.index, stmtEnd,
      });
      re.lastIndex = parsed.close;
    }
  }
  return tweens;
}

const fmt = (n) => (Math.round(n * 1000) / 1000).toFixed(3);
const decode = (s) => s.replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const encode = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const hasClass = (n, c) => (n.attrs.class || "").split(/\s+/).includes(c);

function ownText(html, node) {
  let out = "", at = node.openEnd;
  for (const c of node.children) { out += html.slice(at, c.start); at = c.closeEnd; }
  return out + html.slice(at, node.closeStart);
}

const SIMPLE = new Set(["b", "strong", "i", "em", "br", "span"]);
function isSimple(node) {
  return node.children.every((c) => SIMPLE.has(c.name) && !c.id && !hasClass(c, "c") && isSimple(c));
}
const isChars = (node) => node.children.some((c) => hasClass(c, "c")) && node.children.every((c) => hasClass(c, "c") || c.name === "br") && !ownText(htmlRef.v, node).trim();
const htmlRef = { v: "" };

function collectSegments(html, node, out) {
  if (node.name === "svg" || node.name === "script" || node.name === "style") return;
  if (isChars(node)) {
    out.push({ kind: "chars", node, text: decode(node.children.map((c) => (c.name === "br" ? "\n" : html.slice(c.openEnd, c.closeStart))).join("")) });
    return;
  }
  const nonBr = node.children.filter((c) => c.name !== "br");
  // Cặp chữ viền + chuyển sắc (.gs + .gf) trong cùng một dòng: gộp làm một lớp để sửa chữ không bị lệch hai lớp.
  if (!ownText(html, node).trim() && nonBr.length === 2 && hasClass(nonBr[0], "gs") && hasClass(nonBr[1], "gf") && isSimple(nonBr[0]) && isSimple(nonBr[1])) {
    const inner = html.slice(nonBr[0].openEnd, nonBr[0].closeStart)
      .replace(/<br\s*\/?>/gi, "\n").replace(/<\/?(b|strong)\b[^>]*>/gi, "**").replace(/<[^>]+>/g, "");
    out.push({ kind: "rich", node, dual: [nonBr[0], nonBr[1]], text: decode(inner).trim() });
    return;
  }
  // Nhiều thẻ con mà không có chữ riêng (vd <b>Tên</b><span>phụ</span>) là nhiều dòng riêng, không gộp.
  const splitLines = !ownText(html, node).trim() && nonBr.length > 1;
  if (isSimple(node) && !splitLines && html.slice(node.openEnd, node.closeStart).trim()) {
    let holder = node;
    while (holder.children.length === 1 && holder.children[0].name === "span" && !ownText(html, holder).trim()) holder = holder.children[0];
    const inner = html.slice(holder.openEnd, holder.closeStart)
      .replace(/<br\s*\/?>/gi, "\n").replace(/<\/?(b|strong)\b[^>]*>/gi, "**").replace(/<[^>]+>/g, "");
    out.push({ kind: "rich", node: holder, text: decode(inner).trim() });
    return;
  }
  for (const c of node.children) collectSegments(html, c, out);
}

function segmentsOf(html, node) {
  htmlRef.v = html;
  const out = [];
  collectSegments(html, node, out);
  return out;
}

// Từng từ của một lớp chữ: nội dung, có nhấn không, màu riêng.
const colorOf = (style) => /(?:^|;)\s*color\s*:\s*(#[0-9a-f]{3,8})/i.exec(style || "")?.[1] || null;
export function tokensOf(html, seg) {
  const out = [];
  const push = (text, hi, c) => { for (const w of text.split(/(\s+)/)) if (w) out.push({ w, hi: /\S/.test(w) && hi, c: /\S/.test(w) ? c : null }); };
  if (seg.kind === "chars") {
    let word = "", col = null;
    const flush = () => { if (word) out.push({ w: word, hi: false, c: col }); word = ""; col = null; };
    for (const ch of seg.node.children) {
      if (ch.name === "br") { flush(); out.push({ w: "\n", hi: false, c: null }); continue; }
      const t = decode(html.slice(ch.openEnd, ch.closeStart));
      if (!t.trim()) { flush(); out.push({ w: " ", hi: false, c: null }); continue; }
      col = col || colorOf(ch.attrs.style);
      word += t;
    }
    flush();
    return out;
  }
  const srcNode = seg.dual ? seg.dual[0] : seg.node;
  const inner = html.slice(srcNode.openEnd, srcNode.closeStart);
  let hi = 0;
  const colors = [];
  for (const m of inner.matchAll(/<[^>]+>|[^<]+/g)) {
    const t = m[0];
    if (t[0] !== "<") { push(decode(t), hi > 0, colors.filter(Boolean).pop() || null); continue; }
    if (/^<\/(b|strong)/i.test(t)) hi--;
    else if (/^<(b|strong)\b/i.test(t)) hi++;
    else if (/^<br/i.test(t)) out.push({ w: "\n", hi: false, c: null });
    else if (/^<\/span/i.test(t)) colors.pop();
    else if (/^<span/i.test(t)) colors.push(colorOf(/style="([^"]*)"/i.exec(t)?.[1]));
  }
  return out;
}

const safeColor = (c) => (/^#[0-9a-f]{3,8}$/i.test(c || "") ? c : null);
export function tokensHtml(tokens, kind) {
  // Xuống dòng trong chữ tách từng ký tự là thẻ <br>, không phải ký tự cách.
  if (kind === "chars") return tokens.map((t) => (t.w.includes("\n") && !/\S/.test(t.w) ? "<br>" : [...t.w].map((ch) => `<span class="c"${safeColor(t.c) ? ` style="color:${t.c}!important"` : ""}>${/\s/.test(ch) ? "&nbsp;" : encode(ch)}</span>`).join(""))).join("");
  let out = "", i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (!/\S/.test(t.w)) { out += t.w.includes("\n") ? "<br>" : encode(t.w); i++; continue; }
    let run = t.w, j = i + 1;
    // Gộp các từ liền nhau cùng kiểu thành một đoạn.
    while (j + 1 < tokens.length && !/\S/.test(tokens[j].w) && !tokens[j].w.includes("\n") && !!tokens[j + 1].hi === !!t.hi && (tokens[j + 1].c || null) === (t.c || null) && /\S/.test(tokens[j + 1].w)) { run += tokens[j].w + tokens[j + 1].w; j += 2; }
    let h = encode(run);
    if (safeColor(t.c)) h = `<span style="color:${t.c}!important">${h}</span>`;
    if (t.hi) h = `<b>${h}</b>`;
    out += h;
    i = j;
  }
  return out;
}

// Cây lớp cho bảng Lớp. Bỏ thẻ không hiện hình và từng ký tự đã tách để cây dễ đọc.
function buildLayers(html, nodes, root) {
  const SKIP = new Set(["script", "style", "link", "meta", "br", "title", "defs", "source"]);
  const keep = new Map(), out = [];
  nodes.forEach((n, i) => {
    if (n === root || !n.parent || SKIP.has(n.name) || out.length >= 3000) return;
    if (/(^|\s)c(\s|$)/.test(n.attrs.class || "")) return;
    const up = n.parent === root ? -1 : keep.get(n.parent);
    if (up === undefined) return;
    const leaf = n.closeStart > n.openEnd && !nodes.some((x) => x.parent === n);
    const text = leaf ? html.slice(n.openEnd, n.closeStart).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 28) : "";
    keep.set(n, out.length);
    out.push({ n: i, id: n.id || "", tag: n.name, name: n.attrs["data-ten"] || n.attrs["data-name"] || n.id || text || n.name, parent: up });
  });
  return out;
}

// Lớp trên timeline chi tiết hơn loại clip: phân tách đầy đủ các thành phần tạo nên video hoàn chỉnh.
function laneOf(node) {
  if (node.attrs["data-lane"]) return node.attrs["data-lane"];
  const has = (k) => new RegExp(`(^|\\s)${k}(\\s|$)`).test(node.attrs.class || "");
  const id = (node.id || "").toLowerCase();
  if (has("hd-grade") || has("grade")) return "grade";
  if (has("shape")) return "shape";
  if (has("sticker")) return "sticker";
  if (has("trans") || /^fx-trans|^trans[_-]/.test(id)) return "transition";
  if (has("vfx") || /^fx-vfx|^vfx[_-]/.test(id)) return "vfx";
  if (has("mg") || /^fx-mg|^fx-an|^mg[_-]|^ic[_-]/.test(id) || node.attrs["data-mg-id"]) return "mg";
  if (has("broll") || node.attrs["data-role"] === "broll" || /^broll[_-]/.test(id)) return "broll";
  if (node.name === "audio" && !has("sfx")) {
    const name = `${node.id || ""} ${node.attrs.src || ""}`.toLowerCase();
    if (/giong|thoai|voice|vo[_-]/.test(name)) return "voice";
    if (/nhac|music|bgm/.test(name)) return "music";
  }
  return null;
}

function classify(node, segs) {
  const cls = (node.attrs.class || "").split(/\s+/);
  if (cls.includes("hd-grade")) return "grade";
  if (node.name === "video") return "video";
  if (node.name === "audio") return cls.includes("sfx") ? "sfx" : "audio";
  if (node.name === "img") return "image";
  if (cls.includes("vfx") || cls.includes("trans") || /^fx-(vfx|trans)/i.test(node.id || "")) return "fx";
  if (segs.length && /(^|\s)(sub|subtitle|caption|cap)(\s|$)/.test(node.attrs.class || "")) return "sub";
  if (segs.length) return "text";
  if (cls.includes("fx") || /^(flash|fade|white|black|wipe)/i.test(node.id || "")) return "fx";
  return "graphic";
}

// Icon minh họa trong phần tử: <i class="ic tên"> (nằm trong điểm có id) và ghim bản đồ svg#pin.
function readGrade(node) {
  const raw = node.attrs["data-hd-grade"];
  if (!raw) return null;
  try { return JSON.parse(decode(raw)); } catch { return null; }
}
const attrJson = (o) => JSON.stringify(o).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Màu cuối của mỗi video = màu riêng của clip + các lớp Màu phủ quá nửa clip đó.
export function syncGrade(html) {
  const model = parse(html);
  const nodes = scan(html);
  const layers = model.clips.filter((c) => c.kind === "grade" && c.grade);
  const edits = [];
  for (const v of model.clips.filter((c) => c.kind === "video" && c.id)) {
    const node = nodes.find((n) => n.id === v.id);
    const parts = [v.grade, ...layers.filter((l) => Math.min(l.end, v.end) - Math.max(l.start, v.start) >= (v.end - v.start) / 2).map((l) => l.grade)].filter(Boolean);
    const managed = node.attrs["data-hd-graded"] !== undefined;
    if (!parts.length) {
      if (managed) edits.push(attrEdit(html, node, { "data-color-grading": null, "data-hd-graded": null }));
      continue;
    }
    const merged = { intensity: 1, adjust: {}, details: {} };
    for (const p of parts) { Object.assign(merged.adjust, p.adjust); Object.assign(merged.details, p.details); if (p.lut) merged.lut = p.lut; }
    const value = attrJson(merged);
    if (node.attrs["data-color-grading"] !== value || !managed) edits.push(attrEdit(html, node, { "data-color-grading": value, "data-hd-graded": "1" }));
  }
  return edits.length ? apply(html, edits) : html;
}

// Rõ dần, mờ dần: viết lại làn âm lượng theo độ dài clip hiện tại. Giữ các làn khác nếu có.
// Đường cong keyframe: mảng bezier [x1,y1,x2,y2], "hold" là giữ nguyên tới điểm sau, không có là tuyến tính.
function bezierAt(e, p) {
  if (e === "hold") return p < 1 ? 0 : 1;
  if (!Array.isArray(e)) return p;
  const [a, b, c, d] = e;
  const f = (u, q, r) => 3 * (1 - u) * (1 - u) * u * q + 3 * (1 - u) * u * u * r + u * u * u;
  let lo = 0, hi = 1, u = p;
  for (let i = 0; i < 16; i++) { u = (lo + hi) / 2; if (f(u, a, c) < p) lo = u; else hi = u; }
  return f(u, b, d);
}
// Âm lượng chỉ nội suy thẳng trong HyperFrames nên lấy mẫu 0,1 giây để giữ đúng đường cong.
function sampleVolume(list, d) {
  const r = (n) => +n.toFixed(3);
  const a = [...list].sort((x, y) => x.t - y.t), pts = [];
  if (a[0].t > 0) pts.push({ t: 0, v: a[0].v });
  a.forEach((k, i) => {
    pts.push({ t: r(k.t), v: k.v });
    const n = a[i + 1];
    if (!n || !k.e) return;
    const steps = Math.min(40, Math.ceil((n.t - k.t) / 0.1));
    for (let j = 1; j < steps; j++) { const q = j / steps; pts.push({ t: r(k.t + (n.t - k.t) * q), v: r(k.v + (n.v - k.v) * bezierAt(k.e, q)) }); }
  });
  const last = a[a.length - 1];
  if (last.t < d) pts.push({ t: r(d), v: last.v });
  return pts;
}

export function syncFade(html) {
  const model = parse(html);
  const nodes = scan(html);
  const edits = [];
  for (const c of model.clips.filter((x) => x.id && (x.tag === "audio" || x.tag === "video"))) {
    const node = nodes.find((n) => n.id === c.id);
    let auto = null;
    const raw = node.attrs["data-automation"];
    if (raw) { try { auto = JSON.parse(decode(raw)); } catch { auto = null; } }
    const managed = node.attrs["data-hd-fade-auto"] !== undefined;
    const kfVol = readOverrides(html).clips?.[c.id]?.kf?.volume;
    if (kfVol?.length) {
      const pts = sampleVolume(kfVol, Math.max(0.01, c.end - c.start));
      const lanes = [...(auto?.lanes || []).filter((l) => l.target !== "volume"), { target: "volume", points: pts }];
      const value = attrJson({ version: 1, lanes });
      if (raw !== value || !managed) edits.push(attrEdit(html, node, { "data-automation": value, "data-hd-fade-auto": "1" }));
      continue;
    }
    if (!c.fadeIn && !c.fadeOut) {
      if (managed) {
        const lanes = (auto?.lanes || []).filter((l) => l.target !== "volume");
        edits.push(attrEdit(html, node, { "data-automation": lanes.length ? attrJson({ version: 1, lanes }) : null, "data-hd-fade-auto": null }));
      }
      continue;
    }
    const d = Math.max(0.01, c.end - c.start), v = c.volume ?? 1;
    let fi = Math.min(c.fadeIn, d), fo = Math.min(c.fadeOut, d);
    if (fi + fo > d) { const k = d / (fi + fo); fi *= k; fo *= k; }
    const r = (n) => +n.toFixed(3);
    const pts = [];
    if (fi) pts.push({ t: 0, v: 0 }, { t: r(fi), v });
    else pts.push({ t: 0, v });
    if (fo) { if (r(d - fo) > r(fi)) pts.push({ t: r(d - fo), v }); pts.push({ t: r(d), v: 0 }); }
    else pts.push({ t: r(d), v });
    const lanes = [...(auto?.lanes || []).filter((l) => l.target !== "volume"), { target: "volume", points: pts }];
    const value = attrJson({ version: 1, lanes });
    if (raw !== value || !managed) edits.push(attrEdit(html, node, { "data-automation": value, "data-hd-fade-auto": "1" }));
  }
  return edits.length ? apply(html, edits) : html;
}

function iconsOf(node) {
  const out = [];
  const walkIc = (n) => {
    for (const c of n.children) {
      const cls = (c.attrs.class || "").split(/\s+/);
      if (c.name === "i" && cls.includes("ic")) {
        let p = c.parent;
        while (p && !p.id) p = p.parent;
        if (p) out.push({ kind: "ic", id: p.id, name: cls.find((x) => x !== "ic") || "" });
      } else if (c.name === "svg" && c.id === "pin") out.push({ kind: "pin", id: "pin", name: "pin" });
      else if (cls.includes("tx-icon-badge") || c.attrs["data-icon-id"]) {
        out.push({ kind: "pro_icon", id: c.id || node.id, iconId: c.attrs["data-icon-id"] || "IC-DIAMOND-LUX", name: c.attrs["data-name"] || c.attrs["data-icon-id"] || "Icon động" });
      } else walkIc(c);
    }
  };
  walkIc(node);
  return out;
}

function findRoot(nodes) {
  return nodes.find((n) => "data-composition-id" in n.attrs)
    || nodes.find((n) => n.id === "stage" || "data-duration" in n.attrs);
}

export function parse(html) {
  const nodes = scan(html);
  const root = findRoot(nodes);
  if (!root) throw new Error("Không tìm thấy composition gốc (data-composition-id) trong index.html");
  const byId = new Map(nodes.filter((n) => n.id).map((n) => [n.id, n]));
  const tweens = parseTweens(html, nodes);
  const scripts = nodes.filter((n) => n.name === "script").map((n) => html.slice(n.openEnd, n.closeStart)).join("\n");
  const direct = new Set(tweens.map((t) => t.id));
  const owner = (node) => {
    let top = null;
    for (let n = node; n && n !== root; n = n.parent) {
      if (n.attrs["data-start"] !== undefined) return n;
      if (n.id && direct.has(n.id)) top = n;
    }
    return top;
  };
  const clipTweens = new Map();
  for (const t of tweens) {
    const node = byId.get(t.id);
    if (!node) continue;
    const clip = owner(node);
    if (!clip) continue;
    if (!clipTweens.has(clip)) clipTweens.set(clip, []);
    clipTweens.get(clip).push(t);
  }
  const clips = [];
  for (const node of nodes) {
    if (node === root) continue;
    const timed = node.attrs["data-start"] !== undefined;
    if (timed && owner(node.parent === root ? node : node) !== node) continue;
    if (!timed && !clipTweens.has(node)) continue;
    if (!node.id && !timed) continue;
    const list = clipTweens.get(node) || [];
    const segs = segmentsOf(html, node);
    let start, end;
    if (timed) {
      start = +node.attrs["data-start"] || 0;
      const d = node.attrs["data-duration"];
      end = d !== undefined ? start + +d : null;
    } else {
      start = Math.min(...list.map((t) => t.pos));
      end = Math.max(...list.map((t) => t.pos + t.total));
    }
    clips.push({
      id: node.id || null, kind: classify(node, segs), timed, start, end,
      tag: node.name, src: node.attrs.src || null,
      track: +node.attrs["data-track-index"] || 0,
      mediaStart: +node.attrs["data-media-start"] || 0,
      volume: node.attrs["data-volume"] !== undefined ? +node.attrs["data-volume"] : null,
      rate: +node.attrs["data-playback-rate"] || 1,
      fadeIn: +node.attrs["data-hd-fade-in"] || 0,
      fadeOut: +node.attrs["data-hd-fade-out"] || 0,
      muted: node.attrs.muted !== undefined,
      className: node.attrs.class || "",
      // layer: id gần nhất để tô màu/đổi font riêng cho lớp chữ này.
      segments: segs.map((s) => {
        const layer = s.node.id || (segs.length === 1 ? node.id : null);
        // Số chạy bằng hiệu ứng (vd money("#k0_1n")) bị script ghi đè, sửa chữ ở đây không có tác dụng.
        return { kind: s.kind, text: s.text, tokens: tokensOf(html, s), layer, auto: !!layer && layer !== node.id && new RegExp(`["']#${layer}(?![\\w-])`).test(scripts) && tweens.some((t) => t.id === layer && !t.selector) };
      }),
      icons: iconsOf(node),
      grade: readGrade(node),
      name: node.attrs["data-ten"] || node.attrs["data-name"] || "",
      lane: laneOf(node),
      presetId: node.attrs["data-preset-id"] || null,
      iconId: node.attrs["data-icon-id"] || null,
      iconPos: node.attrs["data-icon-pos"] || null,
      vfxType: node.attrs["data-vfx-type"] || null,
      mgId: node.attrs["data-mg-id"] || null,
      tweens: list.map(({ i, selector, method, pos, dur, ease, id }) => ({ i, id, selector, method, pos, dur, ease })),
    });
  }
  const rootDur = +root.attrs["data-duration"] || 0;
  for (const c of clips) if (c.end === null) c.end = rootDur;
  // Lớp hiển thị AI đặt trực tiếp trong khung gốc mà không có thời gian (#cam, #vig, #flash...) vẫn phải lên timeline.
  const clipIds = new Set(clips.map((c) => c.id));
  const hasClipInside = (n) => nodes.some((x) => { if (!x.id || !clipIds.has(x.id)) return false; for (let p = x.parent; p; p = p.parent) if (p === n) return true; return false; });
  for (const node of nodes) {
    if (node.parent !== root || !node.id || clipIds.has(node.id) || node.name === "script" || node.name === "style" || node.name === "template" || hasClipInside(node)) continue;
    clips.push({
      id: node.id, kind: /(^|\s)fx(\s|$)/.test(node.attrs.class || "") || /^(flash|fade|white|black|wipe|vig|cam)/i.test(node.id) ? "fx" : "graphic", timed: false, whole: true, start: 0, end: rootDur,
      tag: node.name, src: node.attrs.src || null, track: +node.attrs["data-track-index"] || 0, mediaStart: 0, volume: null, rate: 1, fadeIn: 0, fadeOut: 0, muted: false,
      className: node.attrs.class || "", segments: [], icons: [], grade: null, name: node.attrs["data-ten"] || node.attrs["data-name"] || "", lane: laneOf(node), tweens: [],
    });
  }
  const vars = [];
  const varBlock = /:root\s*\{([^}]*)\}/.exec(html);
  if (varBlock) for (const v of varBlock[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);?/g)) vars.push({ name: v[1], value: v[2].trim() });
  const fonts = [...new Set([...html.matchAll(/@font-face\s*\{[^}]*font-family\s*:\s*["']?([^"';]+)/g)].map((m) => m[1].trim()))];
  return {
    width: +root.attrs["data-width"] || 1080, height: +root.attrs["data-height"] || 1920, fps: +root.attrs["data-fps"] || 30,
    duration: rootDur, clips, vars, fonts, overrides: readOverrides(html).clips, layers: buildLayers(html, nodes, root),
  };
}

function ctx(html) {
  const nodes = scan(html);
  const root = findRoot(nodes);
  const tweens = parseTweens(html, nodes);
  const model = parse(html);
  return { nodes, root, tweens, model, node: (id) => nodes.find((n) => n.id === id) };
}

function apply(html, edits) {
  const sorted = [...edits].sort((a, b) => b.start - a.start || b.end - a.end);
  for (const e of sorted) html = html.slice(0, e.start) + e.text + html.slice(e.end);
  return html;
}

function attrEdit(html, node, attrs) {
  let open = html.slice(node.start, node.openEnd);
  for (const [k, v] of Object.entries(attrs)) {
    const re = new RegExp(`(\\s${k})(\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+))?(?=[\\s/>])`, "i");
    if (v === null) open = open.replace(re, "");
    else if (re.test(open)) open = open.replace(re, `$1="${v}"`);
    else open = open.replace(/\s*(\/?)>$/, ` ${k}="${v}"$1>`);
  }
  return { start: node.start, end: node.openEnd, text: open };
}

const tweensOf = (c, clip) => c.tweens.filter((t) => clip.tweens.some((x) => x.i === t.i));
const posEdit = (t, pos) => ({ start: t.posStart, end: t.posEnd, text: fmt(pos) });

function need(c, id) {
  const clip = c.model.clips.find((x) => x.id === id);
  if (!clip) throw new Error(`Không tìm thấy phần tử "${id}"`);
  return clip;
}

// Làm mượt đường bám: lọc trung bình hai lượt, bán kính tính theo giây.
function smoothTrack(samples, smooth, fps) {
  const r = Math.round((+smooth || 0) * (fps || 30) * 0.5);
  if (r < 1) return samples;
  const keys = ["a", "b", "tx", "ty", "cx", "cy"];
  const pass = (list) => list.map((_, i) => {
    const lo = Math.max(0, i - r), hi = Math.min(list.length - 1, i + r);
    const out = { ...list[i] };
    for (const k of keys) { let t = 0; for (let j = lo; j <= hi; j++) t += list[j][k]; out[k] = t / (hi - lo + 1); }
    return out;
  });
  return pass(pass(samples));
}
// Giá trị đường bám tại thời điểm t, nội suy giữa hai mẫu.
function trackAt(list, t) {
  if (t <= list[0].t) return list[0];
  const last = list[list.length - 1];
  if (t >= last.t) return last;
  let lo = 0, hi = list.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (list[m].t <= t) lo = m; else hi = m; }
  const A = list[lo], B = list[hi], u = (t - A.t) / (B.t - A.t || 1), out = { t };
  for (const k of ["a", "b", "tx", "ty", "cx", "cy"]) out[k] = A[k] + (B[k] - A[k]) * u;
  return out;
}
const TRACK_PROPS = ["x", "y", "scale", "rotate"];
const r3 = (v) => +(+v).toFixed(3);
// Thứ tự lớp cao nhất đang có trong dự án, cộng thêm một.
function topZIndex(html) {
  return Math.max(0, ...[...html.matchAll(/z-index\s*:\s*(-?\d+)/g)].map((m) => +m[1])) + 1;
}
function setZIndex(html, id, z) {
  const n = scan(html).find((x) => x.id === id);
  if (!n) return html;
  let open = html.slice(n.start, n.openEnd);
  if (/\bz-index\s*:\s*-?\d+/.test(open)) open = open.replace(/\bz-index\s*:\s*-?\d+/, `z-index:${z}`);
  else if (/\sstyle="/.test(open)) open = open.replace(/\sstyle="/, ` style="z-index:${z};`);
  else open = open.replace(/\s*(\/?)>$/, ` style="z-index:${z}"$1>`);
  return html.slice(0, n.start) + open + html.slice(n.openEnd);
}
function dropTrackKf(cur) {
  const kf = { ...(cur.kf || {}) };
  for (const p of TRACK_PROPS) delete kf[p];
  if (Object.keys(kf).length) cur.kf = kf; else delete cur.kf;
}
function restoreBase(cur) {
  const b = cur.track?.base;
  if (!b) return;
  for (const p of TRACK_PROPS) { if (b[p] === undefined || b[p] === null) delete cur[p]; else cur[p] = b[p]; }
}

export const ops = {
  // Đưa layer lên trên cùng, không bị video hay layer khác che.
  bringFront(html, { id }) {
    need(ctx(html), id);
    return { html: setZIndex(html, id, topZIndex(html)), id };
  },

  // Thông số hòa trộn của layer: chế độ, độ rõ, lọc trước khi trộn, Luma Key, Gradient Matte, fade.
  blendSet(html, { id, mode, opacity, bl, fadeIn, fadeOut }) {
    const o = readOverrides(html), cur = { ...(o.clips[id] || {}) }, d = { ...(cur.d || {}) };
    if (mode !== undefined) d.blend = mode;
    if (bl !== undefined) {
      const DEF = { bright: 100, contrast: 100, sat: 100, hue: 0, gray: 0, invert: 0, blur: 0 };
      const clean = {};
      for (const [k, v] of Object.entries(bl)) {
        if (v === undefined || v === null || DEF[k] === v) continue;
        if (k === "key" && !v?.mode) continue;
        if (k === "ramp" && !v?.type) continue;
        clean[k] = v;
      }
      if (Object.keys(clean).length) d.bl = clean; else delete d.bl;
    }
    if (opacity !== undefined) { if (+opacity === 1) delete cur.opacity; else cur.opacity = +opacity; }
    if (fadeIn !== undefined || fadeOut !== undefined) {
      const clip = parse(html).clips.find((c) => c.id === id), dur = clip ? clip.end - clip.start : 0;
      const a = Math.min(dur, Math.max(0, +fadeIn || 0)), b = Math.min(dur - a, Math.max(0, +fadeOut || 0));
      const peak = cur.opacity ?? 1, kf = { ...(cur.kf || {}) };
      if (a > 0 || b > 0) {
        const list = a > 0 ? [{ t: 0, v: 0 }, { t: +a.toFixed(3), v: peak }] : [{ t: 0, v: peak }];
        if (b > 0) list.push({ t: +(dur - b).toFixed(3), v: peak }, { t: +dur.toFixed(3), v: 0 });
        else list.push({ t: +dur.toFixed(3), v: peak });
        kf.opacity = list;
        d.fade = { in: a, out: b };
      } else if (d.fade) { delete kf.opacity; delete d.fade; }
      if (Object.keys(kf).length) cur.kf = kf; else delete cur.kf;
    }
    if (Object.keys(d).length) cur.d = d; else delete cur.d;
    if (Object.keys(cur).length) o.clips[id] = cur; else delete o.clips[id];
    return { html: writeOverrides(html, o), id };
  },

  // Cho layer bám theo đường đã phân tích: dời, phóng, xoay bằng keyframe, giữ tâm layer đúng chỗ.
  applyTrack(html, { targets, track, params = {} }) {
    const o = readOverrides(html), model = parse(html);
    if (!track?.samples?.length) throw new Error("Chưa có dữ liệu tracking");
    if (!targets?.length) throw new Error("Hãy chọn layer để bám");
    const S = smoothTrack(track.samples, params.smooth, track.fps), map = track.map, ref = track.ref;
    const mult = (params.mult ?? 100) / 100, zoom = +params.zoom || 1;
    const step = 1 / Math.max(1, Math.min(+params.rate || 15, track.fps || 30));
    const tStart = S[0].t, tEnd = S[S.length - 1].t;
    let done = null;
    for (const g of targets) {
      const clip = model.clips.find((c) => c.id === g.id);
      if (!clip) continue;
      const a = Math.max(clip.start, tStart), b = Math.min(clip.end, tEnd);
      if (b <= a) throw new Error("Layer không nằm trong đoạn đã phân tích");
      const cur = { ...(o.clips[g.id] || {}) };
      const base = cur.track?.base || { x: cur.x, y: cur.y, scale: cur.scale, rotate: cur.rotate };
      cur.track = { base };
      restoreBase(cur);
      dropTrackKf(cur);
      const rigid = params.scale || params.rot || track.mode === "scene";
      const px = (g.cx - map.x) / map.w, py = (g.cy - map.y) / map.w;
      const rx = map.x + ref.cx * map.w, ry = map.y + ref.cy * map.w;
      const snapX = params.snap ? rx - g.cx : 0, snapY = params.snap ? ry - g.cy : 0;
      const kf = { x: [], y: [], scale: [], rotate: [] };
      for (let t = a; ; t += step) {
        const at = Math.min(t, b), m = trackAt(S, at);
        let k = params.scale ? Math.hypot(m.a, m.b) : 1, th = params.rot ? Math.atan2(m.b, m.a) : 0;
        if (mult < 0) { k = 1 / k; th = -th; }
        k *= zoom;
        let dx, dy;
        if (rigid) {
          dx = map.x + (m.a * px - m.b * py + m.tx) * map.w - g.cx;
          dy = map.y + (m.b * px + m.a * py + m.ty) * map.w - g.cy;
        } else {
          dx = (m.cx - ref.cx) * map.w;
          dy = (m.cy - ref.cy) * map.w;
        }
        dx = dx * mult + snapX + (+params.offX || 0);
        dy = dy * mult + snapY + (+params.offY || 0);
        // Bù điểm gốc của layer: phóng, xoay quanh góc thì tâm vẫn phải nằm đúng chỗ.
        const cos = Math.cos(th) * k, sin = Math.sin(th) * k;
        const ox = g.vx - (cos * g.vx - sin * g.vy), oy = g.vy - (sin * g.vx + cos * g.vy);
        const local = +(at - clip.start).toFixed(3);
        if (params.pos !== false) {
          kf.x.push({ t: local, v: r3(g.x0 + (dx + ox) / g.ps) });
          kf.y.push({ t: local, v: r3(g.y0 + (dy + oy) / g.ps) });
        }
        if (params.scale || zoom !== 1) kf.scale.push({ t: local, v: r3(g.s0 * k) });
        if (params.rot) kf.rotate.push({ t: local, v: +(g.r0 + (th * 180) / Math.PI).toFixed(2) });
        if (at >= b) break;
      }
      const next = { ...(cur.kf || {}) };
      for (const p of TRACK_PROPS) if (kf[p].length) next[p] = kf[p];
      cur.kf = next;
      cur.track = { kind: "bam", mode: track.mode, tid: track.tid, base, params };
      o.clips[g.id] = cur;
      done ??= g.id;
    }
    return { html: writeOverrides(html, o), id: done };
  },

  // Camera bám người dẫn: phóng cảnh lên rồi dời khung để người dẫn luôn ở vị trí đã chọn, không lộ mép cảnh.
  cameraFollow(html, { items, params = {} }) {
    const o = readOverrides(html), model = parse(html), W = model.width, H = model.height;
    const Z = Math.max(1, +params.zoom || 1.15);
    const TX = ((params.tx ?? 50) / 100) * W, TY = ((params.ty ?? 32) / 100) * H;
    const dead = ((params.dead ?? 2) / 100) * W;
    let done = null;
    for (const it of items || []) {
      const clip = model.clips.find((c) => c.id === it.id);
      if (!clip || !it.samples?.length) continue;
      const cur = { ...(o.clips[it.id] || {}) };
      const base = cur.track?.base || { x: cur.x, y: cur.y, scale: cur.scale, rotate: cur.rotate };
      cur.track = { base };
      restoreBase(cur);
      dropTrackKf(cur);
      // Vùng chết: người dẫn nhúc nhích nhẹ thì khung đứng yên, tránh rung.
      let hx = it.samples[0].cx * it.map.w, hy = it.samples[0].cy * it.map.w;
      const held = it.samples.map((s) => {
        const sx = s.cx * it.map.w, sy = s.cy * it.map.w, ex = sx - hx, ey = sy - hy, d = Math.hypot(ex, ey);
        if (d > dead && d > 0) { hx += (ex * (d - dead)) / d; hy += (ey * (d - dead)) / d; }
        return { ...s, cx: hx / it.map.w, cy: hy / it.map.w, a: 1, b: 0, tx: 0, ty: 0 };
      });
      const S = smoothTrack(held, params.smooth ?? 0.5, it.fps);
      const step = 1 / Math.max(1, Math.min(+params.rate || 10, it.fps || 30));
      const a = Math.max(clip.start, S[0].t), b = Math.min(clip.end, S[S.length - 1].t);
      const [Ox, Oy] = it.O;
      const fit = (d, O, start, size, frame) => {
        const lo = frame - Z * size - (O + Z * (start - O)), hi = -(O + Z * (start - O));
        return lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, d));
      };
      const kx = [], ky = [];
      for (let t = a; ; t += step) {
        const at = Math.min(t, b), m = trackAt(S, at);
        const Px = it.map.x + m.cx * it.map.w, Py = it.map.y + m.cy * it.map.w;
        const dx = fit(TX - Ox - Z * (Px - Ox), Ox, it.map.x, it.map.w, W);
        const dy = fit(TY - Oy - Z * (Py - Oy), Oy, it.map.y, it.map.h, H);
        const local = +(at - clip.start).toFixed(3);
        kx.push({ t: local, v: r3(it.x0 + dx / it.ps) });
        ky.push({ t: local, v: r3(it.y0 + dy / it.ps) });
        if (at >= b) break;
      }
      cur.kf = { ...(cur.kf || {}), x: kx, y: ky };
      cur.scale = r3(it.s0 * Z);
      cur.track = { kind: "camera", mode: "person", tid: it.tid, base, params };
      o.clips[it.id] = cur;
      done ??= it.id;
    }
    if (!done) throw new Error("Không có cảnh nào theo được người dẫn");
    return { html: writeOverrides(html, o), id: done };
  },

  // Gỡ tracking: trả layer về vị trí, cỡ, góc như trước khi bám.
  clearTrack(html, { id }) {
    const o = readOverrides(html), cur = { ...(o.clips[id] || {}) };
    if (!cur.track) return html;
    restoreBase(cur);
    dropTrackKf(cur);
    delete cur.track;
    if (Object.keys(cur).length) o.clips[id] = cur; else delete o.clips[id];
    return writeOverrides(html, o);
  },

  // Dời cả đường bám: kéo layer đang tracking trên khung xem chỉ đổi khoảng lệch.
  shiftTrack(html, { id, dx = 0, dy = 0 }) {
    const o = readOverrides(html), cur = { ...(o.clips[id] || {}) };
    if (!cur.kf) return html;
    const kf = { ...cur.kf };
    if (kf.x) kf.x = kf.x.map((k) => ({ ...k, v: r3(k.v + dx) }));
    if (kf.y) kf.y = kf.y.map((k) => ({ ...k, v: r3(k.v + dy) }));
    cur.kf = kf;
    o.clips[id] = cur;
    return writeOverrides(html, o);
  },

  move(html, { id, delta }) {
    const c = ctx(html), clip = need(c, id);
    delta = Math.max(delta, -clip.start);
    const list = tweensOf(c, clip);
    for (const t of list) delta = Math.max(delta, -t.pos);
    const edits = list.map((t) => posEdit(t, t.pos + delta));
    if (clip.timed) edits.push(attrEdit(html, c.node(id), { "data-start": fmt(clip.start + delta) }));
    else if (clip.whole) edits.push(attrEdit(html, c.node(id), { "data-start": fmt(clip.start + delta), "data-duration": fmt(clip.end - clip.start) }));
    return finish(html, c, edits, clip.end + delta);
  },

  trim(html, { id, edge, delta }) {
    const c = ctx(html), clip = need(c, id);
    const MIN = 0.05, list = tweensOf(c, clip), edits = [];
    if (clip.whole) {
      const s = edge === "start" ? Math.min(Math.max(clip.start + delta, 0), clip.end - MIN) : clip.start;
      const e = edge === "start" ? clip.end : Math.max(clip.end + delta, clip.start + MIN);
      return finish(html, c, [attrEdit(html, c.node(id), { "data-start": fmt(s), "data-duration": fmt(e - s) })], e);
    }
    if (edge === "start") {
      delta = Math.min(Math.max(delta, -clip.start), clip.end - clip.start - MIN);
      const rate = clip.rate || 1;
      if (clip.timed && (clip.tag === "video" || clip.tag === "audio")) delta = Math.max(delta, -clip.mediaStart / rate);
      const first = clip.timed ? list.filter((t) => Math.abs(t.pos - clip.start) < 0.02) : list.filter((t) => t.pos - clip.start < 0.001);
      edits.push(...first.map((t) => posEdit(t, t.pos + delta)));
      if (clip.timed) {
        const a = { "data-start": fmt(clip.start + delta), "data-duration": fmt(clip.end - clip.start - delta) };
        if (clip.tag === "video" || clip.tag === "audio") a["data-media-start"] = fmt(Math.max(0, clip.mediaStart + delta * rate));
        edits.push(attrEdit(html, c.node(id), a));
      }
      const done = finish(html, c, edits, clip.end);
      const ov = readOverrides(done), kf = ov.clips?.[id]?.kf;
      if (!kf) return done;
      for (const p of Object.keys(kf)) kf[p] = kf[p].map((k) => ({ ...k, t: +(k.t - delta).toFixed(3) }));
      return writeOverrides(done, ov);
    }
    delta = Math.max(delta, MIN - (clip.end - clip.start));
    const lastEnd = clip.timed ? clip.end : Math.max(...list.map((t) => t.pos));
    const last = list.filter((t) => (clip.timed ? Math.abs(t.pos + t.total - clip.end) < 0.02 : t.pos >= lastEnd - 0.001));
    edits.push(...last.map((t) => posEdit(t, t.pos + delta)));
    if (clip.timed) edits.push(attrEdit(html, c.node(id), { "data-duration": fmt(clip.end - clip.start + delta) }));
    return finish(html, c, edits, clip.end + delta);
  },

  split(html, { id, time, newId }) {
    const c = ctx(html), clip = need(c, id);
    if (!clip.timed) throw new Error("Phần tử này chạy theo hiệu ứng nên chưa cắt đôi được. Hãy kéo mép để rút ngắn.");
    if (time <= clip.start + 0.01 || time >= clip.end - 0.01) throw new Error("Đầu phát phải nằm trong phần tử muốn cắt");
    const node = c.node(id);
    const fresh = uniqueId(c, newId || `${id}_b`);
    const secondAttrs = { id: fresh, "data-start": fmt(time), "data-duration": fmt(clip.end - time) };
    if (clip.tag === "video" || clip.tag === "audio") secondAttrs["data-media-start"] = fmt(clip.mediaStart + (time - clip.start) * (clip.rate || 1));
    const whole = html.slice(node.start, node.closeEnd);
    const openEdit = attrEdit(html, node, secondAttrs);
    const second = openEdit.text + whole.slice(node.openEnd - node.start);
    let out = apply(html, [
      { start: node.closeEnd, end: node.closeEnd, text: "\n      " + second },
      attrEdit(html, node, { "data-duration": fmt(time - clip.start) }),
      ...tweensOf(c, clip).filter((t) => t.pos >= time).map((t) => ({ start: t.stmtStart, end: t.stmtEnd, text: "" })),
    ]);
    const ov = readOverrides(out);
    if (ov.clips?.[id]) {
      const copy = structuredClone(ov.clips[id]);
      if (copy.kf) {
        const dt = time - clip.start;
        for (const p of Object.keys(copy.kf)) copy.kf[p] = copy.kf[p].map((k) => ({ ...k, t: +Math.max(0, k.t - dt).toFixed(3) }));
      }
      ov.clips[fresh] = copy;
      out = writeOverrides(out, ov);
    }
    return out;
  },

  remove(html, { id }) {
    const c = ctx(html), clip = need(c, id), node = c.node(id);
    const insideIds = c.nodes.filter((n) => n.id && n.start >= node.start && n.closeEnd <= node.closeEnd).map((n) => n.id);
    let out = apply(html, [
      { start: node.start, end: node.closeEnd, text: "" },
      ...tweensOf(c, clip).map((t) => ({ start: t.stmtStart, end: t.stmtEnd, text: "" })),
    ]);
    const ov = readOverrides(out);
    let dirty = false;
    for (const k of insideIds) if (ov.clips?.[k]) { delete ov.clips[k]; dirty = true; }
    return dirty ? writeOverrides(out, ov) : out;
  },

  delete(html, body) {
    return ops.remove(html, body);
  },

  duplicate(html, { id, offset }) {
    const c = ctx(html), clip = need(c, id), node = c.node(id);
    const shift = offset ?? clip.end - clip.start;
    const inside = c.nodes.filter((n) => n.id && n.start >= node.start && n.closeEnd <= node.closeEnd);
    const map = new Map(inside.map((n) => [n.id, uniqueId(c, `${n.id}_sao`)]));
    const rename = (s) => s
      .replace(/(\sid\s*=\s*["'])([^"']+)(["'])/g, (m, a, v, b) => (map.has(v) ? a + map.get(v) + b : m))
      .replace(/#([\w-]+)/g, (m, v) => (map.has(v) ? "#" + map.get(v) : m));
    let copy = rename(html.slice(node.start, node.closeEnd));
    if (clip.timed) copy = copy.replace(/(\sdata-start\s*=\s*["'])[^"']*(["'])/, `$1${fmt(clip.start + shift)}$2`);
    const edits = [{ start: node.closeEnd, end: node.closeEnd, text: "\n      " + copy }];
    const list = tweensOf(c, clip);
    if (list.length) {
      const lastStmt = Math.max(...list.map((t) => t.stmtEnd));
      const copies = list.map((t) => rename(html.slice(t.stmtStart, t.posStart)) + fmt(t.pos + shift) + html.slice(t.posEnd, t.stmtEnd));
      edits.push({ start: lastStmt, end: lastStmt, text: "\n      " + copies.join("\n      ") });
    }
    let out = finish(html, c, edits, clip.end + shift);
    const ov = readOverrides(out);
    let dirty = false;
    for (const [oldId, newId] of map.entries()) {
      if (ov.clips?.[oldId]) { ov.clips[newId] = structuredClone(ov.clips[oldId]); dirty = true; }
    }
    return dirty ? writeOverrides(out, ov) : out;
  },

  // Tách mỗi lớp chữ (dòng có id) thành một khối riêng, giữ nguyên vị trí và hiệu ứng.
  // offsets: độ lệch dọc (px) của từng lớp so với lớp đầu, đo từ khung xem.
  splitLayers(html, { id, offsets = {} }) {
    const c = ctx(html), clip = need(c, id), node = c.node(id);
    const layers = clip.segments.map((s) => s.layer).filter((l, i, a) => l && l !== id && a.indexOf(l) === i).map((l) => c.node(l)).filter(Boolean);
    if (layers.length < 2) throw new Error("Khối chữ này chỉ có một lớp, không cần tách");
    const whole = html.slice(node.start, node.closeEnd);
    const cut = (keep) => {
      let s = whole;
      for (const n of [...layers].reverse()) if (n !== keep) s = s.slice(0, n.start - node.start) + s.slice(n.closeEnd - node.start);
      return s;
    };
    const own = new RegExp(`#${id}(?![\\w-])`, "g");
    const shared = tweensOf(c, clip).filter((t) => { own.lastIndex = 0; return own.test(html.slice(t.stmtStart, t.posStart)); });
    const ov = readOverrides(html), base = ov.clips[id] || {};
    const named = (s, n) => s.replace(/(\sdata-ten\s*=\s*["'])[^"']*/, `$1${encode(`Chữ: ${decode(segmentsOf(html, n).map((x) => x.text).join(" ").replace(/\*\*/g, "")).trim()}`)}`);
    const edits = [{ start: node.start, end: node.closeEnd, text: named(cut(layers[0]), layers[0]) }];
    const added = [], tws = [];
    layers.slice(1).forEach((n) => {
      const fresh = uniqueId({ nodes: [...c.nodes, ...added.map((x) => ({ id: x }))] }, `${n.id}_khoi`);
      added.push(fresh);
      const piece = named(cut(n).replace(/^(<[^>]*\sid\s*=\s*["'])[^"']+/, `$1${fresh}`), n);
      edits.push({ start: node.closeEnd, end: node.closeEnd, text: "\n      " + piece });
      for (const t of shared) tws.push(html.slice(t.stmtStart, t.stmtEnd).replace(own, `#${fresh}`));
      const { kf, ...rest } = base;
      ov.clips[fresh] = { ...rest, y: Math.round((base.y || 0) + (+offsets[n.id] || 0)) };
    });
    if (tws.length) {
      const last = Math.max(...tweensOf(c, clip).map((t) => t.stmtEnd));
      edits.push({ start: last, end: last, text: "\n      " + tws.join("\n      ") });
    }
    return writeOverrides(apply(html, edits), ov);
  },

  // Sửa âm lượng/thời gian bằng số trong bảng Thuộc tính.
  attrs(html, { id, volume, muted, rate, fadeIn, fadeOut }) {
    const c = ctx(html), node = c.node(id);
    need(c, id);
    const a = {};
    if (volume !== undefined) a["data-volume"] = String(volume);
    if (rate !== undefined) a["data-playback-rate"] = rate === 1 ? null : String(rate);
    if (muted !== undefined) a.muted = muted ? "" : null;
    if (fadeIn !== undefined) a["data-hd-fade-in"] = fadeIn > 0 ? String(fadeIn) : null;
    if (fadeOut !== undefined) a["data-hd-fade-out"] = fadeOut > 0 ? String(fadeOut) : null;
    return apply(html, [attrEdit(html, node, a)]);
  },

  text(html, { id, index, text }) {
    const c = ctx(html), node = c.node(id);
    need(c, id);
    const seg = segmentsOf(html, node)[index];
    if (!seg) throw new Error("Không tìm thấy đoạn chữ");
    let inner;
    if (seg.kind === "chars") {
      inner = [...text].map((ch) => `<span class="c">${ch === " " ? "&nbsp;" : encode(ch)}</span>`).join("");
    } else {
      inner = encode(text).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
    }
    if (seg.dual) {
      return apply(html, seg.dual.map((n) => ({ start: n.openEnd, end: n.closeStart, text: inner })));
    }
    return apply(html, [{ start: seg.node.openEnd, end: seg.node.closeStart, text: inner }]);
  },

  tween(html, { i, pos, dur, ease, expectedPos }) {
    const { tweens } = ctx(html);
    const t = tweens[i];
    if (!t || (expectedPos !== undefined && Math.abs(t.pos - expectedPos) > 0.0015)) throw new Error("Tệp vừa thay đổi. Hãy thử lại sau khi tải lại.");
    const edits = [];
    if (pos !== undefined) edits.push(posEdit(t, Math.max(0, pos)));
    if (dur !== undefined && t.durStart >= 0) edits.push({ start: t.durStart, end: t.durEnd, text: String(Math.max(0, dur)) });
    if (ease !== undefined && t.easeStart >= 0) edits.push({ start: t.easeStart, end: t.easeEnd, text: ease });
    return apply(html, edits);
  },

  cssVar(html, { name, value }) {
    if (!/^--[\w-]+$/.test(name)) throw new Error("Tên biến màu không hợp lệ");
    const re = new RegExp(`(${name}\\s*:\\s*)[^;}]+`);
    if (re.test(html)) return html.replace(re, `$1${value}`);
    const rootRe = /(:root\s*\{)/;
    if (rootRe.test(html)) return html.replace(rootRe, `$1\n      ${name}: ${value};`);
    const styleRe = /(<style[^>]*>)/i;
    if (styleRe.test(html)) return html.replace(styleRe, `$1\n    :root { ${name}: ${value}; }`);
    throw new Error("Không tìm thấy biến màu");
  },

  setPalette(html, { paletteId, vars }) {
    const pal = BDS_COLOR_PALETTES.find((p) => p.id === paletteId);
    const map = vars || pal?.vars;
    if (!map) throw new Error("Không tìm thấy bảng màu");
    const colors = Object.values(map);
    const own = parse(html).vars.map((v) => v.name).filter((n) => !(n in map) && !/^--mau-/.test(n));
    own.forEach((name, i) => { html = ops.cssVar(html, { name, value: colors[i % colors.length] }); });
    for (const [name, value] of Object.entries(map)) html = ops.cssVar(html, { name, value });
    return html;
  },

  // x/y/scale/rotate/opacity/color/fontFamily/fontSize: lưu ở khối riêng, không đụng vào hiệu ứng GSAP.
  style(html, { id, set }) {
    const o = readOverrides(html);
    const cur = { ...(o.clips[id] || {}) };
    for (const [k, v] of Object.entries(set)) {
      if (v === null || v === "") delete cur[k]; else cur[k] = v;
    }
    if (Object.keys(cur).length) o.clips[id] = cur; else delete o.clips[id];
    return writeOverrides(html, o);
  },

  // Đổi nội dung, nhấn và màu riêng của từng từ trong một lớp chữ.
  setWords(html, { id, index, tokens }) {
    const c = ctx(html), node = c.node(id);
    need(c, id);
    const seg = segmentsOf(html, node)[index];
    if (!seg) throw new Error("Không tìm thấy lớp chữ");
    const inner = tokensHtml(tokens, seg.kind);
    if (seg.dual) {
      return apply(html, seg.dual.map((n) => ({ start: n.openEnd, end: n.closeStart, text: inner })));
    }
    return apply(html, [{ start: seg.node.openEnd, end: seg.node.closeStart, text: inner }]);
  },

  // Tách một đồ họa SVG (bản đồ, sơ đồ) thành từng layer: nền, đường, ghim, chữ... để chỉnh riêng.
  splitMgLayers(html, { id }) {
    const c = ctx(html), clip = need(c, id), node = c.node(id);
    const svg = node.children.find((n) => n.name === "svg");
    if (!svg) throw new Error("Đồ họa này không có SVG để tách");
    const src = (n) => html.slice(n.start, n.closeEnd).replace(/\sdata-hf-id="[^"]*"/g, "");
    const kids = svg.children;
    const defs = kids.filter((n) => n.name === "defs");
    const cls = (n) => n.attrs.class || "";
    const textOf = (n) => decode(html.slice(n.openEnd, n.closeStart).replace(/<[^>]*>/g, "")).trim();
    const pieces = [];
    const counts = {};
    const nameOf = (base) => { counts[base] = (counts[base] || 0) + 1; return counts[base] > 1 ? `${base} ${counts[base]}` : base; };
    for (const n of kids) {
      if (n.name === "defs") continue;
      const last = pieces[pieces.length - 1];
      if (n.name === "text" && /nguon/i.test(cls(n)) && pieces.some((x) => x.image)) { pieces.find((x) => x.image).parts.push(src(n)); continue; }
      if (n.name === "image") { pieces.push({ name: nameOf("Ảnh nền"), parts: [src(n)], image: true }); continue; }
      if (n.name === "text") { pieces.push({ name: `Chữ: ${textOf(n).slice(0, 28)}`, parts: [src(n)] }); continue; }
      if (n.name === "g" && n.attrs["clip-path"] && n.children.length > 1) {
        for (const k of n.children) pieces.push({ name: nameOf(/duong|road|line/i.test(cls(k)) ? "Đường" : "Hình"), parts: [`<g clip-path="${n.attrs["clip-path"]}">${src(k)}</g>`] });
        continue;
      }
      // Vòng tỏa cùng kiểu đi chung một layer.
      if (n.name === "circle" && last?.ring === cls(n) && cls(n)) { last.parts.push(src(n)); continue; }
      if (n.name === "circle") { pieces.push({ name: nameOf("Vòng tỏa"), parts: [src(n)], ring: cls(n) }); continue; }
      const label = /ghim|pin/i.test(`${n.id || ""} ${cls(n)}`) ? "Ghim" : /duong|road|line/i.test(cls(n)) ? "Đường" : "Hình";
      pieces.push({ name: nameOf(label), parts: [src(n)] });
    }
    if (pieces.length < 2) throw new Error("Đồ họa này chỉ có một phần, không cần tách");
    const open = html.slice(node.start, node.openEnd).replace(/\sdata-hf-id="[^"]*"/g, "");
    const svgOpen = html.slice(svg.start, svg.openEnd).replace(/\sdata-hf-id="[^"]*"/g, "");
    const track0 = clip.track, z0 = +(/\bz-index\s*:\s*(-?\d+)/.exec(node.attrs.style || "")?.[1] || 0);
    const seen = new Set(c.nodes.map((n) => n.id));
    const fresh = (base) => { let v = base, k = 2; while (seen.has(v)) v = `${base}_${k++}`; seen.add(v); return v; };
    const clones = [];
    const ov = readOverrides(html), base = ov.clips[id] || {};
    const out = pieces.map((pc, i) => {
      const pid = i === 0 ? id : fresh(`${id}_l${i}`);
      let body = pc.parts.join("");
      // Mặt nạ hiện dần: mỗi layer có bản riêng để kéo layer không ảnh hưởng layer khác.
      let defsHtml = "";
      for (const m of [...body.matchAll(/url\(#([\w-]+)\)/g)]) {
        const d = defs.find((x) => html.slice(x.start, x.closeEnd).includes(`id="${m[1]}"`));
        if (!d) continue;
        let copy = src(d);
        for (const inner of [...copy.matchAll(/\sid="([\w-]+)"/g)].map((x) => x[1])) {
          const renamed = `${inner}_l${i}`;
          copy = copy.split(`id="${inner}"`).join(`id="${renamed}"`);
          body = body.split(`url(#${inner})`).join(`url(#${renamed})`);
          clones.push([inner, renamed]);
        }
        defsHtml += copy;
      }
      if (i > 0) { const { kf, ...rest } = base; if (Object.keys(rest).length) ov.clips[pid] = { ...rest }; }
      const wrap = open
        .replace(/(\sid\s*=\s*["'])[^"']+/, `$1${pid}`)
        .replace(/(\sdata-ten\s*=\s*["'])[^"']*/, `$1${encode(pc.name)}`)
        .replace(/(\sdata-track-index\s*=\s*["'])[^"']*/, `$1${track0 + i}`)
        .replace(/(\sstyle\s*=\s*["'])/, `$1`)
        .replace(/>$/, ` data-mg-tach="1">`)
        .replace(/z-index\s*:\s*-?\d+/, `z-index:${z0 + i}`);
      return { pid, html: `${wrap}${svgOpen}${defsHtml}${body}</svg></div>` };
    });
    let next = apply(html, [{ start: node.start, end: node.closeEnd, text: out.map((x) => x.html).join("\n      ") }]);
    // Hiệu ứng trên khối cũ và trên mặt nạ được nhân cho từng layer.
    const ownLine = new RegExp(`^[ \\t]*[\\w$]+\\.(?:fromTo|from|to|set)\\(["']#${id.replace(/[.*+?^\${}()|[\]\\]/g, "\\$&")}["'][^\\n]*\\n`, "gm");
    const ownTweens = next.match(ownLine) || [];
    let extra = "";
    for (const line of ownTweens) for (const x of out.slice(1)) extra += line.split(`#${id}`).join(`#${x.pid}`);
    const masks = [...new Set(clones.map((x) => x[0]))];
    for (const inner of masks) {
      const re = new RegExp(`^[ \\t]*[\\w$]+\\.(?:fromTo|from|to|set)\\(["']#${inner}["'][^\\n]*\\n`, "gm");
      for (const line of next.match(re) || []) for (const [o, r] of clones) if (o === inner) extra += line.split(`#${inner}`).join(`#${r}`);
      next = next.replace(re, "");
    }
    let hook = next.lastIndexOf("window.__timelines[");
    if (hook < 0) hook = next.lastIndexOf("window.__timelines");
    if (hook >= 0 && extra) next = next.slice(0, hook) + extra.replace(/^[ \t]*/gm, "      ").trimStart() + "      " + next.slice(hook);
    if (Object.keys(ov.clips).length) next = writeOverrides(next, ov);
    return { html: next, id, ids: out.map((x) => x.pid) };
  },

  // Chỉnh màu, độ dày, chữ trong một layer đã tách.
  mgLayerStyle(html, { id, fill, stroke, strokeWidth, fontSize, text }) {
    const c = ctx(html), node = c.node(id);
    need(c, id);
    const svg = node.children.find((n) => n.name === "svg");
    if (!svg) throw new Error("Layer này không có SVG");
    const edits = [];
    const walk = (n) => {
      for (const k of n.children) {
        if (k.name === "defs") continue;
        if (k.name === "g") { walk(k); continue; }
        const set = [];
        const isText = k.name === "text";
        if (isText && text !== undefined && !/nguon/i.test(k.attrs.class || "")) edits.push({ start: k.openEnd, end: k.closeStart, text: encode(text) });
        // Chấm trắng trong ghim giữ nguyên màu.
        if (fill && k.attrs.fill === undefined && k.name !== "image" && (isText || !/duong/i.test(k.attrs.class || ""))) set.push(`fill:${fill}`);
        if (stroke && !isText && k.name !== "image") set.push(`stroke:${stroke}`);
        if (strokeWidth && !isText && k.name !== "image") set.push(`stroke-width:${+strokeWidth}`);
        if (fontSize && isText) set.push(`font-size:${+fontSize}px`);
        if (set.length) {
          const old = String(k.attrs.style || "").split(";").map((x) => x.trim()).filter((x) => x && !set.some((y) => y.split(":")[0] === x.split(":")[0]));
          edits.push(attrEdit(html, k, { style: [...old, ...set].join(";") }));
        }
      }
    };
    walk(svg);
    if (!edits.length) throw new Error("Layer này không có gì để đổi");
    return { html: apply(html, edits), id };
  },

  // Chữ nghiêng 3D bám tường: phối cảnh, xoay 3 trục, độ dày, viền, bóng, hòa trộn với nền.
  addWallText(html, { params = {}, time = 0, duration = 3, replaceId, fonts }) {
    for (const [family, url] of Object.entries(fonts || {})) html = ops.addFont(html, { family, url });
    if (replaceId) {
      const prev = parse(html).clips.find((x) => x.id === replaceId);
      if (prev) { time = prev.start; duration = prev.end - prev.start; html = ops.remove(html, { id: replaceId }); }
    }
    const c = ctx(html), W = c.model.width, H = c.model.height, k = W / 1080;
    const p = { text: "CHỮ TRÊN TƯỜNG", font: "BEB", size: 120, weight: 800, color: "#FFFFFF", spacing: 0, stroke_w: 0, stroke_c: "#000000", depth: 8, depth_c: "#333333", shadow: 0.5, opacity: 1, blend: "normal", rot_x: 0, rot_y: -28, rot_z: 0, persp: 1400, skew: 0, x_pct: 50, y_pct: 40, anim: "fade", behind: false, ...params };
    const id = replaceId && !c.node(replaceId) ? replaceId : uniqueId(c, "tuong");
    const t = fmt(Math.max(0, +time || 0)), d = Math.max(0.3, +duration || 3);
    const track = Math.max(60, ...c.model.clips.map((x) => x.track)) + 1;
    const depth = Math.round(+p.depth * k);
    const layers = Array.from({ length: Math.min(40, depth) }, (_, i) => `${i + 1}px ${i + 1}px 0 ${p.depth_c}`);
    if (+p.shadow > 0) layers.push(`${depth + 8 * k}px ${depth + 14 * k}px ${28 * k}px ${hexA("#000000", +p.shadow)}`);
    const size = fitTextPx(p.text, +p.size * k, W * 0.92, 2, 0.6);
    const tr = `translate(-50%,-50%) perspective(${Math.round(+p.persp * k)}px) rotateX(${+p.rot_x}deg) rotateY(${+p.rot_y}deg) rotateZ(${+p.rot_z}deg) skewX(${+p.skew}deg)`;
    const tag = `<div id="${id}" class="clip tx-wall" data-lane="text" data-ten="${encode(`Chữ 3D: ${String(p.text).slice(0, 28)}`)}" data-wall="${encode(JSON.stringify(p))}" data-start="${t}" data-duration="${fmt(d)}" data-track-index="${track}" style="position:absolute;left:${+p.x_pct}%;top:${+p.y_pct}%;width:max-content;max-width:${Math.round(W * 0.92)}px;transform:${tr};transform-origin:50% 50%;z-index:${p.behind ? 59 : 70};opacity:${+p.opacity};mix-blend-mode:${p.blend};text-align:center"><div id="${id}_m" class="tx-main" style="font-family:'${p.font}',sans-serif;font-size:${size}px;font-weight:${+p.weight};line-height:1.1;letter-spacing:${+p.spacing}em;color:${p.color};${+p.stroke_w > 0 ? `-webkit-text-stroke:${Math.round(+p.stroke_w * k)}px ${p.stroke_c};paint-order:stroke fill;` : ""}text-shadow:${layers.join(",") || "none"};text-wrap:balance">${encode(p.text)}</div></div>`;
    const edits = [{ start: c.root.closeStart, end: c.root.closeStart, text: `  ${tag}\n    ` }];
    const tl = /(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*gsap\.timeline\s*\(/.exec(html);
    let hook = html.lastIndexOf("window.__timelines[");
    if (hook < 0) hook = html.lastIndexOf("window.__timelines");
    if (tl && hook >= 0 && p.anim !== "none") {
      const from = p.anim === "rise" ? "{ opacity: 0, y: 50 }" : p.anim === "wipe" ? `{ opacity: 1, clipPath: "inset(0 100% 0 0)" }` : "{ opacity: 0 }";
      const to = p.anim === "rise" ? "opacity: 1, y: 0" : p.anim === "wipe" ? `opacity: 1, clipPath: "inset(0 0% 0 0)"` : "opacity: 1";
      edits.push({ start: hook, end: hook, text: `${tl[1]}.fromTo("#${id}_m", ${from}, { ${to}, duration: 0.45, ease: "power2.out", immediateRender: false, data: "${id}" }, ${t});\n      ${tl[1]}.to("#${id}_m", { opacity: 0, duration: 0.25, ease: "power2.in", immediateRender: false, data: "${id}" }, ${fmt(+t + d - 0.25)});\n      ` });
    }
    return { html: finish(html, c, edits, +t + d), id };
  },

  // Thêm layer người đã tách nền, nằm ngay trên video gốc.
  addMatteLayer(html, { src, time, duration, fromId }) {
    const c = ctx(html);
    const id = uniqueId(c, `tachnen_${fromId}`);
    const track = Math.max(0, ...c.model.clips.map((x) => x.track)) + 1;
    const tag = `<video id="${id}" class="clip v" src="${src}" muted playsinline data-lane="broll" data-ten="${encode(`Người đã tách nền (${fromId})`)}" data-matte-of="${fromId}" data-start="${fmt(time)}" data-duration="${fmt(duration)}" data-media-start="0" data-track-index="${track}" style="z-index:60"></video>`;
    return { html: finish(html, c, [{ start: c.root.closeStart, end: c.root.closeStart, text: `  ${tag}\n    ` }], +time + +duration), id };
  },

  // Đưa layer xuống sau người đã tách nền, hoặc trả lại phía trước.
  setBehindPerson(html, { id, behind }) {
    const c = ctx(html), node = c.node(id);
    need(c, id);
    const st = node.attrs.style || "";
    const saved = /\bdata-z-goc\b/.test(html.slice(node.start, node.openEnd)) ? node.attrs["data-z-goc"] : (/\bz-index\s*:\s*(-?\d+)/.exec(st)?.[1] ?? "70");
    const z = behind ? 59 : +saved;
    const style = /\bz-index\s*:/.test(st) ? st.replace(/\bz-index\s*:\s*-?\d+/, `z-index:${z}`) : `${st.replace(/;?\s*$/, ";")}z-index:${z}`;
    return { html: apply(html, [attrEdit(html, node, { style, "data-z-goc": behind ? saved : null })]), id };
  },

  // Tô màu từ quan trọng trên nhiều phụ đề, màu chuyển mượt khi phụ đề hiện. Từ khóa cách nhau bằng dấu phẩy.
  highlightSubs(html, { ids, words, color, fade = 0.3, clear }) {
    const norm = (t) => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    const phrases = String(words || "").split(/[,;\n]/).map((x) => x.trim().split(/\s+/).map(norm).filter(Boolean)).filter((x) => x.length);
    if (!clear && !phrases.length) throw new Error("Hãy nhập từ cần tô màu");
    const safe = /^#[0-9a-f]{6}$/i.test(color || "") ? color : "#FFD147";
    let out = html, first = null, count = 0;
    for (const id of ids || []) {
      const clip = parse(out).clips.find((x) => x.id === id);
      if (!clip) continue;
      const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(`[ \\t]*[\\w$]+\\.fromTo\\("#${esc} \\[style\\*='color:[^\\n]*\\n`, "g"), "");
      let hit = false;
      clip.segments.forEach((sg, index) => {
        if (!sg.tokens) return;
        const toks = sg.tokens.map((t) => ({ ...t }));
        if (clear) { if (toks.some((t) => t.c)) { for (const t of toks) t.c = null; out = ops.setWords(out, { id, index, tokens: toks }); } return; }
        const seq = toks.map((t, i) => [t, i]).filter(([t]) => /\S/.test(t.w));
        let changed = false;
        for (let a = 0; a < seq.length; a++) for (const ph of phrases) {
          if (a + ph.length <= seq.length && ph.every((w, k) => norm(seq[a + k][0].w) === w)) {
            for (let k = 0; k < ph.length; k++) seq[a + k][0].c = safe;
            for (let i = seq[a][1]; i < seq[a + ph.length - 1][1]; i++) if (!/\S/.test(toks[i].w)) toks[i].c = safe;
            changed = true; count++;
          }
        }
        if (changed) { out = ops.setWords(out, { id, index, tokens: toks }); hit = true; }
      });
      if (hit) {
        first ??= id;
        const tl = /(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*gsap\.timeline\s*\(/.exec(out);
        let hook = out.lastIndexOf("window.__timelines[");
        if (hook < 0) hook = out.lastIndexOf("window.__timelines");
        if (tl && hook >= 0) {
          const line = `${tl[1]}.fromTo("#${id} [style*='color:${safe}']",{color:"#ffffff"},{color:"${safe}",duration:${+fade || 0.3},ease:"power2.out",immediateRender:false,data:"${id}"},${fmt(clip.start + 0.08)});\n      `;
          out = out.slice(0, hook) + line + out.slice(hook);
        }
      }
    }
    if (!clear && !count) throw new Error("Không thấy từ này trong các phụ đề đã chọn");
    return { html: out, id: first, count };
  },

  // Lưu màu của clip video hoặc lớp Màu.
  grade(html, { id, grading }) {
    const c = ctx(html);
    need(c, id);
    const empty = !grading || (!grading.lut && !Object.keys(grading.adjust || {}).length && !Object.keys(grading.details || {}).length);
    return apply(html, [attrEdit(html, c.node(id), { "data-hd-grade": empty ? null : attrJson(grading) })]);
  },

  // Kiểu riêng cho một lớp chữ; lớp chưa có id thì gắn id để tô màu/đổi font riêng.
  segStyle(html, { id, index, set }) {
    const c = ctx(html), node = c.node(id);
    need(c, id);
    const segs = segmentsOf(html, node);
    const seg = segs[index];
    if (!seg) throw new Error("Không tìm thấy lớp chữ");
    let lid = seg.node.id || (segs.length === 1 ? id : null);
    if (!lid) {
      lid = uniqueId(c, `${id}_l${index}`);
      html = apply(html, [attrEdit(html, seg.node, { id: lid })]);
    }
    return { html: ops.style(html, { id: lid, set }), id: lid };
  },

  // Trả một lớp chữ về như bản dựng gốc của AI.
  restoreSeg(html, { id, index, from }) {
    const c = ctx(html), node = c.node(id);
    need(c, id);
    const seg = segmentsOf(html, node)[index];
    const bn = scan(from).find((n) => n.id === id);
    const bseg = bn && segmentsOf(from, bn)[index];
    if (!seg || !bseg) throw new Error("Bản gốc không có lớp chữ này");
    let out = apply(html, [{ start: seg.node.openEnd, end: seg.node.closeStart, text: from.slice(bseg.node.openEnd, bseg.node.closeStart) }]);
    const lid = seg.node.id || (segmentsOf(html, node).length === 1 ? id : null);
    if (lid) {
      const o = readOverrides(out);
      if (o.clips[lid]) { delete o.clips[lid]; out = writeOverrides(out, o); }
    }
    return out;
  },

  // Đổi icon minh họa trong điểm có id (vd p_hvn): hình, màu nền.
  icon(html, { id, name, path, bg }) {
    if (!/^[\w-]+$/.test(name || "") || !/^[\d\s.,MmLlHhVvCcSsQqTtAaZz-]+$/.test(path || "")) throw new Error("Icon không hợp lệ");
    if (bg && !/^#[0-9a-f]{3,8}$/i.test(bg)) throw new Error("Màu không hợp lệ");
    const c = ctx(html), host = c.node(id);
    if (!host) throw new Error("Không tìm thấy điểm minh họa");
    const ic = c.nodes.find((n) => n.name === "i" && (n.attrs.class || "").split(/\s+/).includes("ic") && n.start > host.start && n.closeEnd <= host.closeEnd);
    if (!ic) throw new Error("Điểm này không có icon");
    const style = bg ? ` style="background:${bg}"` : (ic.attrs.style ? ` style="${ic.attrs.style}"` : "");
    return apply(html, [{ start: ic.start, end: ic.closeEnd, text: `<i class="ic ${name}"${style}><svg viewBox="0 0 24 24"><path fill="#fff" d="${path}"/></svg></i>` }]);
  },

  // Đổi hàng của clip trên timeline (kéo lên, xuống như CapCut).
  track(html, { id, track }) {
    const c = ctx(html);
    need(c, id);
    return apply(html, [attrEdit(html, c.node(id), { "data-track-index": String(Math.max(0, Math.round(track))) })]);
  },

  // Nhiều thao tác gộp thành một lần lưu, một bước hoàn tác.
  batch(html, { items }) {
    for (const { op, body } of items) {
      const r = ops[op](html, body);
      html = typeof r === "string" ? r : r.html;
    }
    return html;
  },

  addFont(html, { family, url }) {
    const o = readOverrides(html);
    o.fonts[family] = url;
    return writeOverrides(html, o);
  },

  // Thay âm SFX tại chỗ, giữ đỉnh âm đúng khung hình cũ.
  replaceSfx(html, { id, src, duration, peak, volume }) {
    const c = ctx(html), clip = need(c, id), node = c.node(id);
    const oldPeak = +node.attrs["data-sfx-peak"] || 0;
    const start = Math.max(0, clip.start + oldPeak - peak);
    return finish(html, c, [attrEdit(html, node, { src, "data-start": fmt(start), "data-duration": fmt(duration), "data-media-start": "0", "data-sfx-peak": String(peak), "data-volume": String(volume) })], start + duration);
  },

  // Hiệu ứng / chuyển tiếp dựng tại máy: một clip riêng trên lớp Hiệu ứng, không cần AI.
  addFx(html, { ten, nhom, loai, time, duration, kieu }) {
    const c = ctx(html), W = c.model.width, H = c.model.height;
    const chuyen = loai === "Chuyển tiếp";
    const d = +duration || (chuyen ? 0.6 : 2);
    const t = Math.max(0, +time || 0);
    const id = uniqueId(c, `fx-${plainId(ten)}`);
    const track = Math.max(0, ...c.model.clips.map((x) => x.track)) + 1;
    const tl = /(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*gsap\.timeline\s*\(/.exec(html);
    let hook = html.lastIndexOf("window.__timelines[");
    if (hook < 0) hook = html.lastIndexOf("window.__timelines");
    if (!tl || hook < 0) throw new Error("Dự án không có timeline GSAP để gắn hiệu ứng");
    const r = fxRecipe(kieu || fxPreset(ten, nhom, chuyen), { id, t, d, W, H, tl: tl[1] });
    const tag = `<div id="${id}" class="clip fx${chuyen ? " trans" : ""}" data-ten="${encode(ten)}" data-start="${fmt(t)}" data-duration="${fmt(d)}" data-track-index="${track}" style="position:absolute;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none;z-index:900;${r.style}"></div>`;
    const edits = [{ start: c.root.closeStart, end: c.root.closeStart, text: `  ${tag}\n    ` }, { start: hook, end: hook, text: `${r.tweens.join("\n      ")}\n      ` }];
    return { html: finish(html, c, edits, t + d), id, preset: r.preset };
  },

  addShape(html, { shape, time, duration }) {
    const c = ctx(html), W = c.model.width, H = c.model.height;
    const SH = { vuong: "", bo: "border-radius:12%;", tron: "border-radius:50%;", tamgiac: "clip-path:polygon(50% 0,100% 100%,0 100%);", sao: "clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);", duong: "" };
    if (!(shape in SH)) throw new Error("Hình không hợp lệ");
    const id = uniqueId(c, `hinh-${shape}`), t = +time || 0, d = +duration || 3;
    const track = Math.max(0, ...c.model.clips.map((x) => x.track)) + 1;
    const w = Math.round(W * 0.4), h = shape === "duong" ? Math.max(4, Math.round(W * 0.008)) : w;
    const tag = `<div id="${id}" class="clip shape" data-start="${fmt(t)}" data-duration="${fmt(d)}" data-track-index="${track}" style="position:absolute;left:${Math.round((W - w) / 2)}px;top:${Math.round((H - h) / 2)}px;width:${w}px;height:${h}px;background:#ffffff;${SH[shape]}"></div>`;
    return { html: finish(html, c, [{ start: c.root.closeStart, end: c.root.closeStart, text: `  ${tag}\n    ` }], t + d), id };
  },

  // Đưa riêng một mục về như trong bản khác, không đụng các mục còn lại.
  restoreClip(html, { id, from }) {
    const c = ctx(html), f = ctx(from);
    const was = f.nodes.find((n) => n.id === id), now = c.nodes.find((n) => n.id === id);
    if (!was) throw new Error("Bản trước chưa có mục này");
    const text = from.slice(was.start, was.closeEnd);
    const edits = [];
    if (now) edits.push({ start: now.start, end: now.closeEnd, text });
    else edits.push({ start: c.root.closeStart, end: c.root.closeStart, text: `  ${text}\n    ` });
    const clipNow = c.model.clips.find((x) => x.id === id), clipWas = f.model.clips.find((x) => x.id === id);
    if (clipNow && clipWas) {
      const a = tweensOf(c, clipNow), b = tweensOf(f, clipWas);
      if (a.length === b.length) a.forEach((t, i) => edits.push({ start: t.stmtStart, end: t.stmtEnd, text: from.slice(b[i].stmtStart, b[i].stmtEnd) }));
    }
    const done = apply(html, edits);
    const o = readOverrides(done), fo = readOverrides(from);
    if (fo.clips?.[id]) o.clips[id] = fo.clips[id]; else delete o.clips[id];
    return writeOverrides(done, o);
  },

  // Lớp chưa có id thì đặt id để chỉnh riêng được; GSAP và phần còn lại không bị ảnh hưởng.
  layerId(html, { n, tag }) {
    const nodes = scan(html), node = nodes[n];
    if (!node || node.name !== tag) throw new Error("Tệp vừa thay đổi. Hãy thử lại sau khi tải lại.");
    if (node.id) return { html, id: node.id };
    const taken = new Set(nodes.map((x) => x.id));
    let id = `lop-${tag}-${n}`;
    for (let k = 2; taken.has(id); k++) id = `lop-${tag}-${n}-${k}`;
    return { html: apply(html, [attrEdit(html, node, { id })]), id };
  },
  rename(html, { id, ten }) {
    const node = scan(html).find((x) => x.id === id);
    if (!node) throw new Error("Không tìm thấy lớp");
    return apply(html, [attrEdit(html, node, { "data-ten": ten ? encode(ten) : null })]);
  },
  // Keyframe lưu theo giây tính từ đầu clip nên dời clip là đi theo.
  // values: đặt giá trị tại t; remove: bỏ các thuộc tính tại t; from + to: dời điểm; ease: đổi đường cong tại t.
  keyframe(html, { id, t, values, remove, from, to, ease }) {
    const o = readOverrides(html);
    const cur = { ...(o.clips[id] || {}) }, kf = { ...(cur.kf || {}) };
    const same = (a, b) => Math.abs(a - b) < 0.02;
    const round = (n) => +Math.max(0, n).toFixed(3);
    for (const [p, v] of Object.entries(values || {})) {
      const list = (kf[p] || []).filter((k) => !same(k.t, t));
      const old = (kf[p] || []).find((k) => same(k.t, t));
      list.push({ t: round(t), v, ...(old?.e ? { e: old.e } : {}) });
      kf[p] = list.sort((a, b) => a.t - b.t);
    }
    for (const p of remove || []) {
      const old = (kf[p] || []).find((k) => same(k.t, t));
      const list = (kf[p] || []).filter((k) => !same(k.t, t));
      if (list.length) kf[p] = list;
      else { delete kf[p]; if (old && p !== "volume") cur[p] = old.v; }
    }
    if (from !== undefined) for (const p of Object.keys(kf)) kf[p] = kf[p].map((k) => (same(k.t, from) ? { ...k, t: round(to) } : k)).sort((a, b) => a.t - b.t);
    if (ease !== undefined) for (const p of Object.keys(kf)) kf[p] = kf[p].map((k) => { if (!same(k.t, t)) return k; const { e, ...rest } = k; return ease ? { ...rest, e: ease } : rest; });
    if (Object.keys(kf).length) cur.kf = kf; else delete cur.kf;
    if (Object.keys(cur).length) o.clips[id] = cur; else delete o.clips[id];
    return writeOverrides(html, o);
  },

  add(html, { kind, src, time, duration, text, newId, peak, volume, sticker, ten, lane }) {
    const c = ctx(html), W = c.model.width, H = c.model.height;
    const id = uniqueId(c, newId || kind);
    const t = fmt(time || 0);
    const track = Math.max(0, ...c.model.clips.map((x) => x.track)) + 1;
    const laneAttr = lane ? ` data-lane="${encode(lane)}"` : "";
    let tag, end;
    if (kind === "video" || kind === "broll") {
      const isBroll = kind === "broll" || lane === "broll";
      tag = `<video id="${id}" class="clip${isBroll ? " broll" : ""}"${isBroll ? ' data-lane="broll" data-role="broll"' : laneAttr}${ten ? ` data-ten="${encode(ten)}"` : ""} src="${src || ""}" playsinline muted data-start="${t}" data-duration="${fmt(duration || 3)}" data-media-start="0" data-track-index="${track}" style="position:absolute;left:0;top:0;width:${W}px;height:${H}px;object-fit:cover"></video>`;
      end = +t + (duration || 3);
    } else if (kind === "audio") {
      tag = `<audio id="${id}" class="clip"${laneAttr}${ten ? ` data-ten="${encode(ten)}"` : ""} src="${src || ""}" data-start="${t}" data-duration="${fmt(duration || 3)}" data-track-index="${track}" data-volume="1"></audio>`;
      end = +t + (duration || 3);
    } else if (kind === "sfx") {
      tag = `<audio id="${id}" class="clip sfx" src="${src}" data-start="${t}" data-duration="${fmt(duration)}" data-track-index="${track}" data-volume="${volume}" data-sfx-peak="${peak}"></audio>`;
      end = +t + duration;
    } else if (kind === "grade") {
      const d = duration || 3;
      tag = `<div id="${id}" class="clip hd-grade" data-ten="${encode(ten || "Lớp màu LUT")}" data-start="${t}" data-duration="${fmt(d)}" data-track-index="${track}" style="display:none"></div>`;
      end = +t + d;
    } else if (kind === "image") {
      const d = duration || 3;
      const box = sticker ? `left:${Math.round(W * 0.3)}px;top:${Math.round(H * 0.5 - W * 0.2)}px;width:${Math.round(W * 0.4)}px;height:${Math.round(W * 0.4)}px` : `left:0;top:0;width:${W}px;height:${H}px`;
      tag = `<img id="${id}" class="clip${sticker ? " sticker" : ""}"${laneAttr}${ten ? ` data-ten="${encode(ten)}"` : ""} src="${src}" data-start="${t}" data-duration="${fmt(d)}" data-track-index="${track}" style="position:absolute;${box};object-fit:contain" />`;
      end = +t + d;
    } else if (kind === "sub") {
      const d = duration || 2.4;
      const fs = Math.round(W * 0.048);
      tag = `<div id="${id}" class="clip sub" data-lane="sub" data-ten="${encode(ten || "Phụ đề")}" data-start="${t}" data-duration="${fmt(d)}" data-track-index="${track}" style="position:absolute;left:6%;width:88%;top:${Math.round(H * 0.78)}px;text-align:center;font-weight:800;font-size:${fs}px;line-height:1.3;color:#ffffff;text-shadow:0 3px 10px rgba(0,0,0,0.88);z-index:65"><span>${encode(text || "Phụ đề câu thoại mới").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")}</span></div>`;
      end = +t + d;
    } else if (kind === "text") {
      const d = duration || 3;
      const fs = Math.round(W * 0.07);
      tag = `<div id="${id}" class="clip"${laneAttr}${ten ? ` data-ten="${encode(ten)}"` : ""} data-start="${t}" data-duration="${fmt(d)}" data-track-index="${track}" style="position:absolute;left:0;width:100%;top:${Math.round(H * 0.4)}px;text-align:center;font-weight:800;font-size:${fs}px;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.8)">${encode(text || "Chữ mới")}</div>`;
      end = +t + d;
    } else throw new Error("Loại phần tử không hợp lệ");
    const edits = [{ start: c.root.closeStart, end: c.root.closeStart, text: `  ${tag}\n    ` }];
    return { html: finish(html, c, edits, end), id };
  },

  // Chèn hoặc cập nhật Mẫu VFX/Effects Text cài sẵn tùy chỉnh (TX-01 .. TX-08 + 24 Icon động IC-xx)
  addTextVfxPreset(html, { presetId = "TX-01", overrides = {}, time = 0, duration, replaceId, fonts }) {
    for (const [family, url] of Object.entries(fonts || {})) html = ops.addFont(html, { family, url });
    const preset = TEXT_VFX_PRESETS.find((x) => x.id.toUpperCase() === String(presetId).toUpperCase()) || TEXT_VFX_PRESETS[0];
    const p = { ...preset.customizable_params, ...Object.fromEntries(Object.entries(overrides || {}).filter(([, v]) => v !== undefined && v !== null)) };
    if (p.hide_sub) p.text_sub = "";
    let workHtml = html;
    let targetTime = Math.max(0, +time || 0);
    if (replaceId) {
      const prevClip = parse(workHtml).clips.find((x) => x.id === replaceId);
      if (prevClip) {
        targetTime = prevClip.start;
        if (!duration) duration = prevClip.end - prevClip.start;
        workHtml = ops.remove(workHtml, { id: replaceId });
      }
    }
    const c = ctx(workHtml), W = c.model.width, H = c.model.height;
    const scaleK = W / 1080;
    const id = replaceId && !c.node(replaceId) ? replaceId : uniqueId(c, `tx_${preset.id.toLowerCase().replace(/[^a-z0-9]/g, "")}`);
    const inDur = Math.max(0.08, +p.in_duration_s || 0.28);
    const outDur = Math.max(0.08, +p.out_duration_s || 0.16);
    const holdDur = Math.max(0.4, +p.hold_min_s || 1.6);
    const totalDur = Math.max(inDur + outDur + 0.2, +(duration || (inDur + holdDur + outDur)).toFixed(2));
    const track = Math.max(60, ...c.model.clips.map((x) => x.track)) + 1;

    // Tự co cỡ chữ để không tràn khung, kể cả chữ dài, khung ngang hay khổ nhỏ.
    const rowIcon = (String(p.icon_pos || "top").toLowerCase() === "left" || String(p.icon_pos || "top").toLowerCase() === "right") ? (+p.icon_size_px || 72) * scaleK + 48 * scaleK : 0;
    const roomW = W * 0.86 - 64 * scaleK - rowIcon;
    const mainPx = fitTextPx(p.text_main, ((+p.size_main_pct || 8.0) / 100) * H * 0.82, roomW, 2, 0.66);
    const subPx = fitTextPx(p.text_sub, ((+p.size_sub_pct || 4.2) / 100) * H * 0.82, roomW, 2, 0.58);
    const iconId = String(p.icon_id || "IC-DIAMOND-LUX").toUpperCase();
    const iconPos = String(p.icon_pos || "top").toLowerCase();
    const iconSize = Math.round((+p.icon_size_px || 72) * scaleK);
    const iconColor = p.icon_color || p.color_primary || "#FFD147";
    const iconInfo = ANIMATED_ICONS[iconId] || ANIMATED_ICONS["IC-DIAMOND-LUX"];
    const vfxType = String(p.vfx_type || "none");
    const flexDir = iconPos === "left" || iconPos === "right" ? "row" : "column";
    const gapPx = Math.round((iconPos === "left" || iconPos === "right" ? 24 : 12) * scaleK);
    const strokeW = Math.round((+p.stroke_width_px ?? 3) * scaleK);
    const glowOp = Math.max(0, Math.min(1, +p.glow_opacity ?? 0.35));
    const glowHex = hexA(p.glow_color || p.color_primary || "#FFD147", glowOp);
    const blendCss = p.blend_mode ? (p.blend_mode === "normal" ? "" : `mix-blend-mode:${p.blend_mode};`) : vfxType === "difference_blend" ? "mix-blend-mode:difference;" : "";
    const glassCss = vfxType === "underline_stroke_draw" || vfxType === "glass_badge"
      ? `background:rgba(10,14,22,0.72);backdrop-filter:blur(12px);border:2px solid ${hexA(p.color_secondary || "#FFD147", 0.55)};border-radius:${Math.round(22 * scaleK)}px;padding:${Math.round(20 * scaleK)}px ${Math.round(32 * scaleK)}px;box-shadow:0 12px 32px rgba(0,0,0,0.65);`
      : `padding:${Math.round(12 * scaleK)}px ${Math.round(20 * scaleK)}px;`;

    const iconBadgeHtml = iconPos !== "none" && iconInfo
      ? `<div id="${id}_ic" class="tx-icon-badge" data-icon-id="${iconId}" data-name="${encode(iconInfo.ten_pho_bien)}" style="display:flex;align-items:center;justify-content:center;width:${iconSize + Math.round(24 * scaleK)}px;height:${iconSize + Math.round(24 * scaleK)}px;border-radius:${Math.round(20 * scaleK)}px;background:rgba(0,0,0,0.42);border:2px solid ${hexA(iconColor, 0.65)};box-shadow:0 6px 20px rgba(0,0,0,0.65),0 0 22px ${hexA(iconColor, 0.35)};flex-shrink:0"><svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${iconInfo.svg_paths}</svg></div>`
      : "";

    let vfxDom = "";
    if (vfxType === "light_sweep") {
      vfxDom = `<div id="${id}_vfx" style="position:absolute;inset:-10% -35%;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,0.88) 50%,transparent 65%);transform:translateX(-130%);pointer-events:none;mix-blend-mode:overlay"></div>`;
    } else if (vfxType === "underline_stroke_draw") {
      const lineW = Math.round(580 * scaleK);
      vfxDom = `<svg id="${id}_vfx" width="${lineW}" height="${Math.round(16 * scaleK)}" viewBox="0 0 600 16" style="margin-top:${Math.round(8 * scaleK)}px;overflow:visible"><path id="${id}_line" d="M 10 8 L 590 8" stroke="${p.color_secondary || "#FFD147"}" stroke-width="6" stroke-linecap="round" stroke-dasharray="580" stroke-dashoffset="580" fill="none"/></svg>`;
    } else if (vfxType === "stamp_shockwave_ring") {
      vfxDom = `<div id="${id}_vfx" style="position:absolute;inset:-8px;border:3px solid ${p.color_primary || "#4ADE80"};border-radius:24px;opacity:0;pointer-events:none"></div>`;
    }

    const mainHtml = `<div id="${id}_m" class="tx-main" style="font-family:'${p.font_main || "Montserrat"}',sans-serif;font-size:${mainPx}px;font-weight:${fonts ? "normal" : 900};line-height:1.22;text-wrap:balance;color:${p.color_primary || "#FFD147"};${strokeW > 0 ? `-webkit-text-stroke:${strokeW}px ${p.stroke_color || "#000000"};paint-order:stroke fill;` : ""}text-shadow:0 4px 16px rgba(0,0,0,0.82),0 0 28px ${glowHex}">${encode(String(p.text_main || "CHỮ CHÍNH")).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>")}</div>`;
    const subHtml = String(p.text_sub || "").trim()
      ? `<div id="${id}_s" class="tx-sub" style="margin-top:${Math.round(8 * scaleK)}px;font-family:'${p.font_sub || "Be Vietnam Pro"}',sans-serif;font-size:${subPx}px;font-weight:${fonts ? "normal" : 800};line-height:1.25;text-wrap:balance;color:${p.color_secondary || "#FFFFFF"};${strokeW > 0 ? `-webkit-text-stroke:${Math.max(1, Math.round(strokeW * 0.7))}px ${p.stroke_color || "#000000"};paint-order:stroke fill;` : ""}text-shadow:0 3px 12px rgba(0,0,0,0.78)">${encode(String(p.text_sub)).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>")}</div>`
      : "";

    const label = `${preset.id}: ${String(p.text_main || preset.ten_pho_bien).replace(/\*\*/g, "").slice(0, 32)}`;
    const mainLines = Math.min(2, Math.ceil(textWidth(p.text_main, mainPx, 0.66) / roomW) || 1);
    const estH = mainLines * mainPx * 1.22 + (String(p.text_sub || "").trim() ? subPx * 2.5 : 0) + (iconPos === "top" ? (+p.icon_size_px || 72) * scaleK + 48 * scaleK : 0) + 40 * scaleK;
    const box = placeBox(+p.pos_x_pct || 50, +p.pos_y_pct || 36, Math.min(W * 0.86, roomW + rowIcon + 64 * scaleK), estH, W, H, overrides?.pos_y_pct === undefined);
    const tag = `<div id="${id}" class="clip tx-container" data-lane="text" data-preset-id="${preset.id}" data-icon-id="${iconPos === "none" ? "NONE" : iconId}" data-icon-pos="${iconPos}" data-vfx-type="${vfxType}" data-ten="${encode(label)}" data-start="${fmt(targetTime)}" data-duration="${fmt(totalDur)}" data-track-index="${track}" style="position:absolute;left:${box.x}%;top:${box.y}%;transform:translate(-50%,-50%);width:max-content;max-width:${Math.round(W * 0.86)}px;box-sizing:border-box;display:flex;flex-direction:${flexDir};align-items:center;justify-content:center;gap:${gapPx}px;text-align:center;z-index:68;overflow:hidden;${glassCss}${blendCss}">${iconPos !== "right" ? iconBadgeHtml : ""}<div class="tx-text-stack" style="position:relative;display:flex;flex-direction:column;align-items:center">${p.hide_main ? "" : mainHtml}${subHtml}${vfxDom}</div>${iconPos === "right" ? iconBadgeHtml : ""}</div>`;

    const edits = [{ start: c.root.closeStart, end: c.root.closeStart, text: `  ${tag}\n    ` }];
    const tlMatch = /(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*gsap\.timeline\s*\(/.exec(workHtml);
    let hook = workHtml.lastIndexOf("window.__timelines[");
    if (hook < 0) hook = workHtml.lastIndexOf("window.__timelines");
    if (hook < 0) hook = workHtml.lastIndexOf("window.__hdTimeline");
    if (tlMatch && hook >= 0) {
      const tl = tlMatch[1];
      const n = (v) => +v.toFixed(3);
      const tw = [];
      const inEase = p.in_easing || "back.out(1.7)";
      const outEase = p.out_easing || "power2.in";
      const textDelay = iconPos !== "none" ? 0.04 : 0;
      const staggerS = +((textDelay + (+p.stagger_ms || 50) / 1000)).toFixed(3);
      const inEff = String(p.in_effect || "").toLowerCase();
      const outEff = String(p.out_effect || "").toLowerCase();

      if (iconPos !== "none") {
        tw.push(`${tl}.fromTo("#${id}_ic", { opacity: 0, scale: 0.45, rotation: -12 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.26, ease: "back.out(1.7)", immediateRender: false, data: "${id}" }, ${n(targetTime)});`);
      }
      let fromVars = `{ opacity: 0, y: 26, scale: 0.84, filter: "blur(5px)" }`;
      let toVars = `{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: ${n(inDur)}, ease: "${inEase}", immediateRender: false, data: "${id}" }`;
      if (inEff.includes("stamp")) {
        fromVars = `{ opacity: 0, scale: 1.42, filter: "blur(4px)" }`;
        toVars = `{ opacity: 1, scale: 1, filter: "blur(0px)", duration: ${n(inDur)}, ease: "${inEase}", immediateRender: false, data: "${id}" }`;
      } else if (inEff.includes("blur")) {
        fromVars = `{ opacity: 0, y: 16, filter: "blur(12px)" }`;
        toVars = `{ opacity: 1, y: 0, filter: "blur(0px)", duration: ${n(inDur)}, ease: "${inEase}", immediateRender: false, data: "${id}" }`;
      } else if (inEff.includes("mask")) {
        fromVars = `{ opacity: 0, y: 38 }`;
        toVars = `{ opacity: 1, y: 0, duration: ${n(inDur)}, ease: "${inEase}", immediateRender: false, data: "${id}" }`;
      }
      if (inEff !== "none" && !p.hide_main) tw.push(`${tl}.fromTo("#${id}_m", ${fromVars}, ${toVars}, ${n(targetTime + textDelay)});`);
      if (String(p.text_sub || "").trim()) {
        tw.push(`${tl}.fromTo("#${id}_s", { opacity: 0, y: 18, filter: "blur(3px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: ${n(inDur)}, ease: "power3.out", immediateRender: false, data: "${id}" }, ${n(targetTime + staggerS)});`);
      }
      if (vfxType === "light_sweep") {
        tw.push(`${tl}.fromTo("#${id}_vfx", { x: "-130%" }, { x: "230%", duration: 0.55, ease: "power2.inOut", immediateRender: false, data: "${id}" }, ${n(targetTime + inDur + 0.08)});`);
      } else if (vfxType === "underline_stroke_draw") {
        tw.push(`${tl}.fromTo("#${id}_line", { strokeDashoffset: 580 }, { strokeDashoffset: 0, duration: 0.32, ease: "expo.out", immediateRender: false, data: "${id}" }, ${n(targetTime + Math.max(0.05, inDur - 0.04))});`);
      } else if (vfxType === "stamp_shockwave_ring") {
        tw.push(`${tl}.fromTo("#${id}_vfx", { opacity: 0.85, scale: 0.92 }, { opacity: 0, scale: 1.18, duration: 0.42, ease: "expo.out", immediateRender: false, data: "${id}" }, ${n(targetTime + inDur * 0.7)});`);
      }
      const exitStart = n(Math.max(targetTime + inDur + 0.1, targetTime + totalDur - outDur));
      let exitVars = `{ opacity: 0, y: -14, duration: ${n(outDur)}, ease: "${outEase}", immediateRender: false, data: "${id}" }`;
      if (outEff.includes("evaporate")) exitVars = `{ opacity: 0, filter: "blur(6px)", duration: ${n(outDur)}, ease: "${outEase}", immediateRender: false, data: "${id}" }`;
      else if (outEff.includes("scale")) exitVars = `{ opacity: 0, scale: 0.9, duration: ${n(outDur)}, ease: "${outEase}", immediateRender: false, data: "${id}" }`;
      if (outEff !== "none") tw.push(`${tl}.to("#${id}", ${exitVars}, ${exitStart});`);
      edits.push({ start: hook, end: hook, text: `${tw.join("\n      ")}\n      ` });
    }
    return { html: finish(workHtml, c, edits, targetTime + totalDur), id, presetId: preset.id };
  },

  // Chèn Đồ họa Motion Graphics (MG29 Spec Card, MG26 Counter, Map Pin, Dimension Ruler) hoặc 1 trong 24 Icon động SVG (IC-xx)
  addMgPreset(html, { mgId, iconId, params = {}, time = 0, duration, replaceId, fonts }) {
    for (const [family, url] of Object.entries(fonts || {})) html = ops.addFont(html, { family, url });
    if (replaceId) {
      const prev = parse(html).clips.find((x) => x.id === replaceId);
      if (prev) {
        time = prev.start;
        if (!duration) duration = prev.end - prev.start;
        html = ops.remove(html, { id: replaceId });
      }
    }
    const c = ctx(html), W = c.model.width, H = c.model.height;
    const scaleK = W / 1080;
    const t = Math.max(0, +time || 0);
    const track = Math.max(55, ...c.model.clips.map((x) => x.track)) + 1;
    const tlMatch = /(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*gsap\.timeline\s*\(/.exec(html);
    let hook = html.lastIndexOf("window.__timelines[");
    if (hook < 0) hook = html.lastIndexOf("window.__timelines");
    if (hook < 0) hook = html.lastIndexOf("window.__hdTimeline");

    // Trường hợp 1: Chèn riêng 1 Icon động SVG (IC-xx) kèm nhãn tùy chọn
    if (iconId && !mgId) {
      const icKey = String(iconId).toUpperCase();
      const ic = ANIMATED_ICONS[icKey] || ANIMATED_ICONS["IC-DIAMOND-LUX"];
      const d = Math.max(0.5, +(duration || params.duration_s || 2.5));
      const id = uniqueId(c, `ic_${icKey.toLowerCase().replace(/[^a-z0-9]/g, "_")}`);
      const color = params.color || ic.default_color || "#FFD147";
      const sizePx = Math.round((+params.size_px || 88) * scaleK);
      const strokeW = Math.max(0.5, Math.min(5, +params.stroke_w || 2.4));
      const badge = params.badge !== false;
      const badgeBg = params.badge_color ? hexA(params.badge_color, params.badge_alpha ?? 0.72) : `rgba(10,14,22,${params.badge_alpha ?? 0.72})`;
      const labelPx = Math.round((+params.label_size || 36) * scaleK);
      const labelColor = params.label_color || "#ffffff";
      const anim = String(params.anim || "pop");
      const labelText = params.label !== undefined ? String(params.label) : ic.ten_pho_bien.split("(")[0].trim();
      const posX = +params.pos_x_pct || 50;
      const posY = +params.pos_y_pct || 45;
      const labelHtml = labelText.trim()
        ? `<div id="${id}_lbl" style="font-family:'${params.font_label || "Be Vietnam Pro"}',sans-serif;font-size:${labelPx}px;font-weight:${fonts ? "normal" : 800};color:${labelColor};text-shadow:0 3px 10px rgba(0,0,0,0.85)">${encode(labelText)}</div>`
        : "";
      const tag = `<div id="${id}" class="clip mg" data-lane="mg" data-icon-id="${icKey}" data-ten="${encode(`Icon: ${ic.ten_pho_bien}`)}" data-start="${fmt(t)}" data-duration="${fmt(d)}" data-track-index="${track}" style="${params.blend_mode && params.blend_mode !== "normal" ? `mix-blend-mode:${params.blend_mode};` : ""}position:absolute;left:${posX}%;top:${posY}%;transform:translate(-50%,-50%);transform-origin:50% 50%;width:max-content;height:auto;right:auto;bottom:auto;display:flex;flex-direction:column;align-items:center;gap:${Math.round(12 * scaleK)}px;z-index:62"><div id="${id}_ic" class="tx-icon-badge" data-icon-id="${icKey}" data-name="${encode(ic.ten_pho_bien)}" style="display:flex;align-items:center;justify-content:center;width:${sizePx + Math.round(28 * scaleK)}px;height:${sizePx + Math.round(28 * scaleK)}px;border-radius:${Math.round((+params.badge_radius ?? 24) * scaleK)}px;${badge ? `background:${badgeBg};backdrop-filter:blur(10px);border:2.5px solid ${hexA(color, 0.8)};box-shadow:0 10px 28px rgba(0,0,0,0.7),0 0 26px ${hexA(color, 0.4)}` : ""}"><svg width="${sizePx}" height="${sizePx}" style="position:static;inset:auto;display:block;flex:none;width:${sizePx}px;height:${sizePx}px" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round">${ic.svg_paths}</svg></div>${labelHtml}</div>`;
      const edits = [{ start: c.root.closeStart, end: c.root.closeStart, text: `  ${tag}\n    ` }];
      if (tlMatch && hook >= 0) {
        const tl = tlMatch[1], n = (v) => +v.toFixed(3);
        const tw = [
          ...(anim === "fade" ? [`${tl}.fromTo("#${id}", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "sine.inOut", immediateRender: false, data: "${id}" }, ${n(t)});`]
            : anim === "slide" ? [`${tl}.fromTo("#${id}", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.32, ease: "expo.out", immediateRender: false, data: "${id}" }, ${n(t)});`]
            : anim === "spin" ? [`${tl}.fromTo("#${id}", { opacity: 0, scale: 0.5, rotation: -90 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.42, ease: "back.out(1.6)", immediateRender: false, data: "${id}" }, ${n(t)});`]
            : [`${tl}.fromTo("#${id}", { opacity: 0, scale: 0.45, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.28, ease: "back.out(1.8)", immediateRender: false, data: "${id}" }, ${n(t)});`]),
          `${tl}.to("#${id}", { opacity: 0, scale: 0.88, duration: 0.18, ease: "power2.in", immediateRender: false, data: "${id}" }, ${n(t + d - 0.18)});`,
        ];
        edits.push({ start: hook, end: hook, text: `${tw.join("\n      ")}\n      ` });
      }
      return { html: finish(html, c, edits, t + d), id };
    }

    // Trường hợp 2: Chèn Thẻ Đồ họa MG (MG-SPEC-CARD, MG-COUNTER, MG-MAP-PIN, MG-RULER)
    const tpl = MG_TEMPLATES.find((x) => x.id === mgId || x.ma_goc === mgId) || MG_TEMPLATES[0];
    const p = { ...tpl.default_params, ...Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null)) };
    const d = Math.max(0.6, +(duration || p.duration_s || 3.0));
    const id = uniqueId(c, `mg_${tpl.id.toLowerCase().replace(/[^a-z0-9]/g, "_")}`);
    const icKey = String(iconId || p.icon_id || tpl.icon_id || "IC-HOUSE-VILLA").toUpperCase();
    const ic = ANIMATED_ICONS[icKey] || ANIMATED_ICONS["IC-HOUSE-VILLA"];
    const accent = p.accent_color || "#FFD147";
    const sizeK = Math.max(0.5, Math.min(1.6, +p.size_scale || 1));
    const icSize = Math.round((+p.icon_size_px || 64) * scaleK * sizeK);
    const lines = [p.line1, p.line2, p.line3].map((x) => String(x || "").trim()).filter(Boolean);
    // Thẻ tự co theo nội dung và luôn nằm trọn trong khung.
    const cardW = W * 0.9, roomW = cardW - icSize - (22 + 24 + 68) * scaleK;
    const titlePx = fitTextPx(p.title || tpl.ten, 46 * scaleK * sizeK, roomW, 2, 0.66);
    const linePx = Math.max(10, Math.min(...[36 * scaleK * sizeK, ...lines.map((ln) => fitTextPx(ln, 36 * scaleK * sizeK, roomW, 2, 0.54))]));
    const estH = titlePx * 2.4 + lines.length * linePx * 2.7 + 48 * scaleK;
    const box = placeBox(+p.pos_x_pct || 50, +p.pos_y_pct || 72, cardW, estH, W, H, params?.pos_y_pct === undefined);
    const linesHtml = lines.map((ln, idx) => `<div id="${id}_l${idx + 1}" style="font-family:'${p.font_line || "Be Vietnam Pro"}',sans-serif;font-size:${linePx}px;font-weight:${fonts ? "normal" : 700};color:#ffffff;line-height:1.35">${encode(ln).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")}</div>`).join("");
    let tag = `<div id="${id}" class="clip mg" data-lane="mg" data-mg-id="${tpl.id}" data-icon-id="${icKey}" data-ten="${encode(`MG: ${p.title || tpl.ten}`)}" data-start="${fmt(t)}" data-duration="${fmt(d)}" data-track-index="${track}" style="position:absolute;left:${box.x}%;top:${box.y}%;transform:translate(-50%,-50%);transform-origin:50% 50%;width:max-content;height:auto;right:auto;bottom:auto;max-width:${Math.round(cardW)}px;box-sizing:border-box;display:flex;align-items:center;gap:${Math.round(24 * scaleK)}px;padding:${Math.round(24 * scaleK)}px ${Math.round(34 * scaleK)}px;border-radius:${Math.round(24 * scaleK)}px;background:rgba(12,16,24,0.78);backdrop-filter:blur(14px);border:2px solid ${hexA(accent, 0.65)};box-shadow:0 16px 40px rgba(0,0,0,0.72),0 0 28px ${hexA(accent, 0.25)};${p.blend_mode && p.blend_mode !== "normal" ? `mix-blend-mode:${p.blend_mode};` : ""}z-index:62"><div id="${id}_ic" class="tx-icon-badge" data-icon-id="${icKey}" data-name="${encode(ic.ten_pho_bien)}" style="display:flex;align-items:center;justify-content:center;width:${icSize + Math.round(22 * scaleK)}px;height:${icSize + Math.round(22 * scaleK)}px;border-radius:${Math.round(18 * scaleK)}px;background:${hexA(accent, 0.16)};border:2px solid ${hexA(accent, 0.7)};flex-shrink:0"><svg width="${icSize}" height="${icSize}" style="position:static;inset:auto;display:block;flex:none;width:${icSize}px;height:${icSize}px" viewBox="0 0 24 24" fill="none" stroke="${accent}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${ic.svg_paths}</svg></div><div style="display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:${Math.round(6 * scaleK)}px"><div id="${id}_t" style="font-family:'${p.font_title || "Montserrat"}',sans-serif;font-size:${titlePx}px;font-weight:${fonts ? "normal" : 900};color:${accent};letter-spacing:0.02em">${encode(String(p.title || tpl.ten))}</div>${linesHtml}</div></div>`;
    if (p.hide_title) tag = tag.replace(new RegExp(`<div id="${id}_t"[^>]*>[\\s\\S]*?</div>`), "");
    const edits = [{ start: c.root.closeStart, end: c.root.closeStart, text: `  ${tag}\n    ` }];
    if (tlMatch && hook >= 0) {
      const tl = tlMatch[1], n = (v) => +v.toFixed(3);
      const tw = [
        `${tl}.fromTo("#${id}", { opacity: 0, y: 34, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: "expo.out", immediateRender: false, data: "${id}" }, ${n(t)});`,
        `${tl}.fromTo("#${id}_ic", { scale: 0.4, rotation: -15 }, { scale: 1, rotation: 0, duration: 0.3, ease: "back.out(1.8)", immediateRender: false, data: "${id}" }, ${n(t + 0.04)});`,
        `${tl}.to("#${id}", { opacity: 0, y: 18, duration: 0.2, ease: "power2.in", immediateRender: false, data: "${id}" }, ${n(t + d - 0.2)});`,
      ];
      edits.push({ start: hook, end: hook, text: `${tw.join("\n      ")}\n      ` });
    }
    return { html: finish(html, c, edits, t + d), id };
  },

  // Đổi Icon Động SVG (IC-xx) của khối TX-xx hoặc MG-xx đang có trên timeline
  setProIcon(html, { id, iconId, iconColor }) {
    const c = ctx(html), host = c.node(id);
    if (!host) throw new Error("Không tìm thấy khối cần đổi Icon");
    const rawKey = String(iconId || "IC-DIAMOND-LUX").toUpperCase();
    let ic = ANIMATED_ICONS[rawKey];
    if (!ic) {
      const all = Object.values(ANIMATED_ICONS);
      ic = all.find((x) => x.id.toUpperCase() === rawKey || x.id.replace(/^IC-/, "").toUpperCase() === rawKey.replace(/^IC-/, "") || (rawKey.startsWith("IC-") && all[parseInt(rawKey.replace("IC-", ""), 10) - 1]));
    }
    if (!ic) throw new Error("Mã Icon động không hợp lệ");
    const icKey = ic.id;
    const badge = c.nodes.find((n) => (n === host || (n.start > host.start && n.closeEnd <= host.closeEnd)) && ((n.attrs.class || "").includes("tx-icon-badge") || n.attrs["data-icon-id"] && n.name !== "div"));
    const svg = c.nodes.find((n) => n.name === "svg" && n.start > host.start && n.closeEnd <= host.closeEnd);
    if (!svg) throw new Error("Clip này chưa có icon để đổi. Hãy chọn clip có icon, hoặc bấm Thử để chèn icon mới.");
    const edits = [
      attrEdit(html, host, { "data-icon-id": icKey }),
      { start: svg.openEnd, end: svg.closeStart, text: ic.svg_paths },
    ];
    if (iconColor && /^#[0-9a-f]{3,8}$/i.test(iconColor)) {
      edits.push(attrEdit(html, svg, { stroke: iconColor }));
    }
    if (badge && badge !== host) {
      edits.push(attrEdit(html, badge, { "data-icon-id": icKey, "data-name": encode(ic.ten_pho_bien) }));
    }
    return apply(html, edits);
  },

  // Áp kiểu Motion / Animation / VFX / Camera có tên phổ biến lên clip đang chọn
  applyMotionPreset(html, { id, category, presetId, custom = {} }) {
    const list = MOTION_PRESETS[category] || [];
    const preset = list.find((x) => x.id === presetId);
    if (!preset) throw new Error("Không tìm thấy kiểu Motion/Animation này");

    // Chuyển cảnh không gắn vào clip đang chọn: đặt tại điểm cắt gần playhead nhất.
    if (category === "transition") {
      const m = parse(html), at = Math.max(0, +custom.time || 0);
      const d = +custom.duration || preset.duration || 0.4;
      const cuts = m.clips.filter((x) => x.kind === "video" && x.start > 0.01).sort((a, b) => Math.abs(a.start - at) - Math.abs(b.start - at));
      const near = cuts[0] && Math.abs(cuts[0].start - at) <= 1.5 ? cuts[0] : null;
      const ten = preset.ten_pho_bien || preset.name || presetId;
      if (preset.cssEffect === "cross_dissolve" || /dissolve/i.test(presetId)) {
        if (!near) throw new Error("Đưa playhead tới gần một điểm cắt giữa 2 cảnh để hòa tan");
        // Cảnh trước phải còn chạy dưới cảnh sau trong lúc hòa tan.
        const prev = m.clips.filter((x) => x.kind === "video" && x.id !== near.id && x.end <= near.start + 0.01).sort((a, b) => b.end - a.end)[0];
        let out = html;
        if (prev && prev.end < near.start + d) { try { out = ops.trim(out, { id: prev.id, edge: "end", delta: +(near.start + d - prev.end).toFixed(3) }); } catch { /* cảnh trước hết tư liệu: vẫn hòa tan từ nền */ } }
        const cc = ctx(out), tid = uniqueId(cc, "fx-chuyen");
        const tl = /(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*gsap\.timeline\s*\(/.exec(out);
        let hook = out.lastIndexOf("window.__timelines[");
        if (hook < 0) hook = out.lastIndexOf("window.__timelines");
        if (!tl || hook < 0) throw new Error("Dự án không có timeline GSAP để gắn chuyển cảnh");
        const track = Math.max(0, ...cc.model.clips.map((x) => x.track)) + 1;
        const tag = `<div id="${tid}" class="clip fx trans" data-ten="${encode(ten)}" data-start="${fmt(near.start)}" data-duration="${fmt(d)}" data-track-index="${track}" style="display:none"></div>`;
        const tween = `${tl[1]}.fromTo("#${near.id}",{opacity:0},{opacity:1,duration:${fmt(d)},ease:"sine.inOut",immediateRender:false,data:"${tid}"},${fmt(near.start)});`;
        return { html: finish(out, cc, [{ start: cc.root.closeStart, end: cc.root.closeStart, text: `  ${tag}\n    ` }, { start: hook, end: hook, text: `${tween}\n      ` }], near.start + d), id: tid };
      }
      const kieu = { whip_pan: "truot", match_cut: "phong", zoom_through: "phong", hard_cut_beat: "flash", flash_negative: "flash" }[preset.cssEffect] || (/flash/i.test(presetId) ? "flash" : "phong");
      return ops.addFx(html, { ten, loai: "Chuyển tiếp", kieu, time: Math.max(0, (near ? near.start : at) - d / 2), duration: d });
    }

    if (!id) throw new Error("Hãy bấm chọn 1 clip trên timeline hoặc khung xem trước đã");
    const c = ctx(html), clip = need(c, id);

    if (category === "camera") {
      const dur = Math.max(0.2, clip.end - clip.start);
      let out = html;
      for (const kf of preset.keyframes || []) {
        const t = +(kf.pos * dur).toFixed(3);
        const values = {};
        if (kf.scale !== undefined) values.scale = +(kf.scale * (+custom.scaleMult || 1)).toFixed(3);
        if (kf.x !== undefined) values.x = Math.round(kf.x * (+custom.panMult || 1));
        if (kf.y !== undefined) values.y = Math.round(kf.y * (+custom.panMult || 1));
        out = ops.keyframe(out, { id, t, values });
        if (kf.ease) out = ops.keyframe(out, { id, t, ease: kf.ease });
      }
      return out;
    }

    if (category === "vfx") {
      return ops.style(html, { id, set: { ...(preset.stylePatch || {}), ...(custom.stylePatch || {}), vfxId: preset.id } });
    }

    if (category === "entrance" || category === "exit") {
      const o = readOverrides(html);
      const curClip = o.clips[id] || {};
      const curAnim = curClip.anim || {};
      const nextAnim = { ...curAnim, ...(preset.animPatch || {}) };
      if (custom.sp && category === "entrance" && nextAnim.in) nextAnim.in = { ...nextAnim.in, sp: +custom.sp };
      if (custom.sp && category === "exit" && nextAnim.out) nextAnim.out = { ...nextAnim.out, sp: +custom.sp };
      if (custom.easeIn) nextAnim.easeIn = custom.easeIn;
      if (custom.easeOut) nextAnim.easeOut = custom.easeOut;
      if (custom.mode) nextAnim.mode = custom.mode;
      if (custom.dist !== undefined && nextAnim.moveIn) nextAnim.moveIn = { ...nextAnim.moveIn, dist: +custom.dist };
      if (custom.blurAmt !== undefined && nextAnim.blur) nextAnim.blur = { ...nextAnim.blur, amt: +custom.blurAmt };
      if (custom.delay !== undefined) nextAnim.delay = +custom.delay;
      if (custom.order) nextAnim.order = custom.order;
      if (custom.scaleAmt !== undefined && nextAnim.scale) nextAnim.scale = { ...nextAnim.scale, amt: +custom.scaleAmt };
      nextAnim[category === "entrance" ? "inId" : "outId"] = preset.id;
      return ops.style(html, { id, set: { anim: nextAnim } });
    }

    throw new Error("Nhóm hiệu ứng không hợp lệ");
  },

  // Tắt một kiểu Motion hoặc VFX đang áp trên layer (bấm lại vào thẻ đang dùng).
  clearMotion(html, { id, category }) {
    const o = readOverrides(html), cur = o.clips[id] || {};
    if (category === "vfx") {
      const preset = (MOTION_PRESETS.vfx || []).find((x) => x.id === cur.vfxId);
      const off = Object.fromEntries(Object.keys(preset?.stylePatch || {}).map((k) => [k, null]));
      return ops.style(html, { id, set: { ...off, vfxId: null } });
    }
    const anim = { ...(cur.anim || {}) };
    const key = category === "entrance" ? "inId" : "outId";
    const used = (MOTION_PRESETS[category] || []).find((x) => x.id === anim[key]);
    const other = (MOTION_PRESETS[category === "entrance" ? "exit" : "entrance"] || []).find((x) => x.id === anim[category === "entrance" ? "outId" : "inId"]);
    // Bỏ đúng các phần kiểu này đã thêm, giữ phần của kiểu còn lại.
    for (const k of Object.keys(used?.animPatch || {})) if (!(k in (other?.animPatch || {}))) delete anim[k];
    delete anim[key];
    delete anim[category === "entrance" ? "in" : "out"];
    const empty = !anim.in?.on && !anim.out?.on && !anim.strobe?.on && !anim.track?.on;
    return ops.style(html, { id, set: { anim: empty ? null : anim } });
  },

  // Gộp nhiều layer thành một nhóm để kéo, phóng to, dời thời gian chung. Tách lại bằng ungroupLayers.
  groupLayers(html, { ids }) {
    const c = ctx(html), W = c.model.width, H = c.model.height;
    const clips = ids.map((id) => c.model.clips.find((x) => x.id === id)).filter(Boolean);
    if (clips.length < 2) throw new Error("Hãy chọn ít nhất 2 layer để gộp");
    if (clips.some((x) => ["video", "audio", "sfx", "music", "voice"].includes(x.kind))) throw new Error("Chỉ gộp được layer hình: chữ, đồ họa, icon, ảnh, hiệu ứng");
    const start = Math.min(...clips.map((x) => x.start)), end = Math.max(...clips.map((x) => x.end));
    const nodes = clips.map((x) => c.node(x.id)).sort((a, b) => a.start - b.start);
    const zOf = (n) => +(/\bz-index\s*:\s*(-?\d+)/.exec(n.attrs.style || "")?.[1] || 0);
    const inner = nodes.map((n) => {
      const text = html.slice(n.start, n.closeEnd), cut = n.openEnd - n.start;
      const open = text.slice(0, cut)
        .replace(/\sclass="([^"]*)"/, (_, v) => ` class="${v.replace(/(^|\s)clip(?=\s|$)/, "$1").trim()}" data-g-clip="1"`)
        .replace(/\sdata-start=/, " data-g-start=").replace(/\sdata-duration=/, " data-g-duration=").replace(/\sdata-track-index=/, " data-g-track=");
      return open + text.slice(cut);
    }).join("\n        ");
    const id = uniqueId(c, "nhom");
    const track = Math.min(...clips.map((x) => x.track));
    const tag = `<div id="${id}" class="clip nhom" data-lane="mg" data-ten="${encode(`Nhóm ${clips.length} layer`)}" data-start="${fmt(start)}" data-duration="${fmt(end - start)}" data-track-index="${track}" style="position:absolute;left:0;top:0;width:${W}px;height:${H}px;z-index:${Math.max(...nodes.map(zOf))}">\n        ${inner}\n      </div>`;
    const edits = nodes.map((n, i) => ({ start: n.start, end: n.closeEnd, text: i === 0 ? tag : "" }));
    // Layer ngắn hơn nhóm vẫn hiện đúng lúc của nó.
    const tl = /(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*gsap\.timeline\s*\(/.exec(html)?.[1];
    const hook = html.lastIndexOf("window.__timelines[");
    const lines = !tl || hook < 0 ? [] : clips.filter((x) => x.start > start + 0.001 || x.end < end - 0.001).flatMap((x) => [
      `${tl}.set("#${x.id}", { visibility: "hidden", data: "nhom" }, ${fmt(start)});`,
      `${tl}.set("#${x.id}", { visibility: "visible", data: "nhom" }, ${fmt(x.start)});`,
      `${tl}.set("#${x.id}", { visibility: "hidden", data: "nhom" }, ${fmt(x.end)});`,
    ]);
    if (lines.length) edits.push({ start: hook, end: hook, text: `${lines.join("\n      ")}\n      ` });
    return { html: apply(html, edits), id, count: clips.length };
  },
  ungroupLayers(html, { id }) {
    const c = ctx(html), node = c.node(id);
    need(c, id);
    if (!/(^|\s)nhom(\s|$)/.test(node.attrs.class || "")) throw new Error("Layer này không phải nhóm");
    const kids = node.children.filter((k) => k.attrs["data-g-clip"] !== undefined);
    const out = kids.map((k) => {
      const text = html.slice(k.start, k.closeEnd), cut = k.openEnd - k.start;
      const open = text.slice(0, cut)
        .replace(/\sclass="([^"]*)"\s+data-g-clip="1"/, (_, v) => ` class="clip${v ? ` ${v}` : ""}"`)
        .replace(/\sdata-g-start=/, " data-start=").replace(/\sdata-g-duration=/, " data-duration=").replace(/\sdata-g-track=/, " data-track-index=");
      return open + text.slice(cut);
    }).join("\n      ");
    let next = apply(html, [{ start: node.start, end: node.closeEnd, text: out }]);
    for (const k of kids) {
      const esc = k.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      next = next.replace(new RegExp(`^[ \\t]*[\\w$]+\\.set\\("#${esc}", \\{ visibility: "\\w+", data: "nhom" \\}, [\\d.]+\\);\\r?\\n`, "gm"), "");
    }
    return { html: next, id: kids[0]?.id || null, count: kids.length };
  },
  // Tách khối HTML (Chữ VFX, thẻ MG) thành từng phần. Vị trí từng phần do khung xem đo sẵn.
  splitHtmlLayers(html, { id, parts, bg }) {
    const c = ctx(html), clip = need(c, id), node = c.node(id);
    if (!parts || parts.length + (bg ? 1 : 0) < 2) throw new Error("Khối này không có đủ phần để tách");
    const seen = new Set(c.nodes.map((n) => n.id).filter(Boolean));
    const fresh = (base) => { let v = base, k = 2; while (seen.has(v)) v = `${base}_${k++}`; seen.add(v); return v; };
    const z = +(/\bz-index\s*:\s*(-?\d+)/.exec(node.attrs.style || "")?.[1] || 70);
    const lane = clip.kind === "text" ? "text" : "mg";
    const wrap = (name, wid, st, body, i) => `<div id="${wid}" class="clip tx-part" data-lane="${lane}" data-ten="${encode(name)}" data-start="${fmt(clip.start)}" data-duration="${fmt(clip.end - clip.start)}" data-track-index="${clip.track + i}" style="position:absolute;${st}z-index:${z + i}">${body}</div>`;
    const box = (b) => `left:${Math.round(b.x)}px;top:${Math.round(b.y)}px;width:${Math.ceil(b.w) + 2}px;height:${Math.ceil(b.h) + 2}px;`;
    const pieces = [], ids = [];
    if (bg) { const wid = fresh(`${id}_nen`); ids.push(wid); pieces.push(wrap("Nền khối", wid, `${box(bg)}${bg.css || ""}`, "", 0)); }
    parts.forEach((pt, i) => {
      let n = node;
      for (const k of pt.path || []) n = n?.children?.[k];
      if (!n) return;
      const wid = fresh(`${id}_lop${i + 1}`);
      ids.push(wid);
      const src = html.slice(n.start, n.closeEnd).replace(/\sdata-hf-id="[^"]*"/g, "");
      const body = /^<[^>]*?\sstyle="/.test(src) ? src.replace(/^(<[^>]*?\sstyle=")([^"]*)"/, '$1$2;margin:0!important"') : src.replace(/^<([a-z0-9-]+)/i, '<$1 style="margin:0!important"');
      pieces.push(wrap(pt.name, wid, `${box(pt)}display:flex;align-items:center;justify-content:center;`, body, i + 1));
    });
    let next = apply(html, [{ start: node.start, end: node.closeEnd, text: pieces.join("\n      ") }]);
    // Hiệu ứng của khối cũ chuyển sang từng phần để cả khối vẫn vào, ra như trước.
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^[ \\t]*[\\w$]+\\.(?:fromTo|from|to|set)\\(["']#${esc}["'][^\\n]*\\n`, "gm");
    let extra = "";
    for (const line of next.match(re) || []) for (const w of ids) extra += line.split(`#${id}"`).join(`#${w}"`).split(`data: "${id}"`).join(`data: "${w}"`);
    next = next.replace(re, "");
    const hook = next.lastIndexOf("window.__timelines[");
    if (hook >= 0 && extra) next = next.slice(0, hook) + extra.trimStart() + "      " + next.slice(hook);
    return { html: next, id: ids[0], ids };
  },

  // Dựng đầy đủ các tầng / khối thành phần chuẩn 8 Thành Phần lên Timeline (cho những tầng đang trống)
  scaffold8Components(html, { time = 0, paletteId = "luxury_gold_emerald" } = {}) {
    let out = ops.setPalette(html, { paletteId });
    const m = parse(out);
    const hasLane = (key) => m.clips.some((x) => (x.lane || x.kind) === key || (key === "text" && x.kind === "text" && !x.lane));
    const baseT = Math.max(0, +time || 0);
    const addedIds = [];

    if (!hasLane("sub")) {
      const r = ops.add(out, { kind: "sub", text: "Căn biệt thự góc **2 mặt tiền** hiếm có tại trung tâm", time: baseT + 0.2, duration: 2.8, newId: "sub_mau", ten: "Phụ đề câu mở đầu" });
      out = r.html; addedIds.push(r.id);
    }
    if (!hasLane("text")) {
      const r = ops.addTextVfxPreset(out, { presetId: "TX-01", time: baseT + 0.3, duration: 2.6 });
      out = r.html; addedIds.push(r.id);
    }
    if (!hasLane("mg")) {
      const r = ops.addMgPreset(out, { mgId: "MG-SPEC-CARD", time: baseT + 3.1, duration: 3.0 });
      out = r.html; addedIds.push(r.id);
    }
    if (!hasLane("vfx")) {
      const r = ops.addFx(out, { ten: "Halation & Light Sweep", nhom: "Ánh sáng", loai: "Hiệu ứng", time: baseT + 0.3, duration: 2.6 });
      const node = scan(r.html).find((n) => n.id === r.id);
      out = node ? apply(r.html, [attrEdit(r.html, node, { "data-lane": "vfx", class: "clip fx vfx" })]) : r.html;
      addedIds.push(r.id);
    }
    if (!hasLane("transition")) {
      const r = ops.addFx(out, { ten: "Whip Pan / Swish Pan", nhom: "Trượt, kéo", loai: "Chuyển tiếp", time: Math.max(0, baseT + 2.8), duration: 0.4 });
      out = r.html; addedIds.push(r.id);
    }
    if (!hasLane("grade")) {
      const dur = Math.max(6, m.duration || 10);
      const r = ops.add(out, { kind: "grade", time: 0, duration: dur, newId: "mau_lut_bds", ten: "Lớp màu Điện ảnh & 3D LUT" });
      out = ops.grade(r.html, { id: r.id, grading: { intensity: 1, adjust: { contrast: 0.08, vibrance: 0.12, temperature: 0.04 }, details: { vignette: 0.15 } } });
      addedIds.push(r.id);
    }
    return { html: out, addedIds };
  },
};

const plainId = (t) => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "hieu-ung";
const FX_TU_KHOA = [["flash", /loe|chop|nhay|flash|nhap nhay|trang/], ["den", /den\b|toi|tat dan|mo den/], ["glitch", /loi|glitch|nhieu|loan|tach|lech|ma\b|rgb/], ["rung", /rung|giat|lac|dong dat/], ["xoay", /xoay|lat|quay|vong|xoan|xoay/], ["nhip", /nhip|dap|tim dap|pulse/], ["phong", /phong|thu|zoom|keo vao|day/], ["mo", /mo\b|nhoe|lay net|tan|sua/], ["tuyet", /tuyet|hoa|sao|lap lanh|bong bong|kim tuyen|hat/], ["mua", /mua\b/], ["xam", /den trang|xam/], ["co", /co dien|hoai co|film|phim|may anh|retro|vhs|cu\b/], ["neon", /neon|cau vong|sac|mau/], ["am", /sang|anh sang|tia|nang|ruc|phat sang/], ["khung", /khung|man hinh|vien|o\b|luoi/], ["truot", /truot|keo|day ngang/], ["cat", /cat|lat cat|hinh|khoi|da giac/]];
const FX_NHOM = { "Ánh sáng": "am", "Mờ, lấy nét": "mo", "Phóng, thu": "phong", "Thiên nhiên": "tuyet", "Rung, giật": "rung", "Film, cổ điển": "co", "Khung, màn hình": "khung", "Trượt, kéo": "truot", "Phóng, xoay": "phong", "Mờ, tan": "mo", "Hình khối": "cat" };
function fxPreset(ten, nhom, chuyen) {
  const p = plainId(ten).replace(/-/g, " ");
  const hit = FX_TU_KHOA.find(([, re]) => re.test(p))?.[0];
  const k = hit || FX_NHOM[nhom] || (chuyen ? "phong" : "am");
  // Chuyển tiếp chỉ dùng kiểu có chuyển động hoặc che cảnh.
  if (chuyen && !["flash", "den", "glitch", "rung", "xoay", "phong", "mo", "truot", "cat"].includes(k)) return "phong";
  return k;
}
// Mọi kiểu đều tween theo timeline nên tua đến đâu cũng đúng, kéo clip là hiệu ứng dời theo.
function fxRecipe(k, { id, t, d, W, H, tl }) {
  const root = '"[data-composition-id]"';
  const n = (v) => +v.toFixed(3);
  const hien = (o = 1) => {
    const v = n(Math.min(0.25, d / 3));
    return [`${tl}.fromTo("#${id}", { opacity: 0 }, { opacity: ${o}, duration: ${v}, ease: "power1.out", immediateRender: false }, ${n(t)});`, `${tl}.to("#${id}", { opacity: 0, duration: ${v}, ease: "power1.in" }, ${n(t + d - v)});`];
  };
  const camera = (from, to, opts = "") => [`${tl}.fromTo(${root}, ${from}, { ${to}, duration: ${n(d / 2)}, ease: "sine.inOut", yoyo: true, repeat: 1, ${opts}immediateRender: false, data: "${id}" }, ${n(t)});`];
  const rung = (tx, ty, lan) => [`${tl}.fromTo(${root}, { x: 0, y: 0, scale: 1.05 }, { x: ${tx}, y: ${ty}, scale: 1.05, duration: ${n(d / lan)}, ease: "none", yoyo: true, repeat: ${lan - 1}, immediateRender: false, data: "${id}" }, ${n(t)});`, `${tl}.set(${root}, { x: 0, y: 0, scale: 1, data: "${id}" }, ${n(t + d)});`];
  const R = {
    flash: () => ({ style: "background:#fff;opacity:0;", tweens: hien(0.9) }),
    den: () => ({ style: "background:#000;opacity:0;", tweens: hien(1) }),
    mo: () => ({ style: "backdrop-filter:blur(18px);opacity:0;", tweens: hien() }),
    xam: () => ({ style: "backdrop-filter:grayscale(1) contrast(1.1);opacity:0;", tweens: hien() }),
    co: () => ({ style: `backdrop-filter:sepia(.45) contrast(1.12) saturate(.85);background:radial-gradient(ellipse at center,transparent 55%,#0009 100%);opacity:0;`, tweens: hien() }),
    neon: () => ({ style: "backdrop-filter:hue-rotate(70deg) saturate(1.8);opacity:0;", tweens: hien() }),
    am: () => ({ style: `mix-blend-mode:screen;background:radial-gradient(circle at 30% 25%,#ffd9a0cc,#ff9a5a55 35%,transparent 70%);opacity:0;`, tweens: hien() }),
    khung: () => ({ style: `box-sizing:border-box;border:${Math.round(W * 0.03)}px solid #fff;box-shadow:inset 0 0 ${Math.round(W * 0.06)}px #0009;opacity:0;`, tweens: hien() }),
    tuyet: () => ({ style: `background-image:radial-gradient(circle,#fffd 0 ${Math.round(W * 0.004)}px,transparent ${Math.round(W * 0.006)}px),radial-gradient(circle,#fff9 0 ${Math.round(W * 0.003)}px,transparent ${Math.round(W * 0.005)}px);background-size:${Math.round(W * 0.14)}px ${Math.round(W * 0.14)}px,${Math.round(W * 0.09)}px ${Math.round(W * 0.09)}px;opacity:0;`, tweens: [...hien(), `${tl}.fromTo("#${id}", { backgroundPosition: "0px 0px, 0px 0px" }, { backgroundPosition: "0px ${Math.round(W * 0.56)}px, 0px ${Math.round(W * 0.36)}px", duration: ${n(d)}, ease: "none", immediateRender: false }, ${n(t)});`] }),
    mua: () => ({ style: `background-image:repeating-linear-gradient(100deg,transparent 0 ${Math.round(W * 0.03)}px,#ffffff55 ${Math.round(W * 0.03)}px ${Math.round(W * 0.032)}px);background-size:100% ${Math.round(H * 0.2)}px;opacity:0;`, tweens: [...hien(), `${tl}.fromTo("#${id}", { backgroundPosition: "0px 0px" }, { backgroundPosition: "0px ${Math.round(H * 0.6)}px", duration: ${n(d)}, ease: "none", immediateRender: false }, ${n(t)});`] }),
    cat: () => ({ style: "background:#000;clip-path:inset(0 100% 0 0);", tweens: [`${tl}.fromTo("#${id}", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: ${n(d / 2)}, ease: "power2.in", immediateRender: false }, ${n(t)});`, `${tl}.to("#${id}", { clipPath: "inset(0 0% 0 100%)", duration: ${n(d / 2)}, ease: "power2.out" }, ${n(t + d / 2)});`] }),
    phong: () => ({ style: "display:none;", tweens: camera("{ scale: 1 }", "scale: 1.18") }),
    nhip: () => ({ style: "display:none;", tweens: [`${tl}.fromTo(${root}, { scale: 1 }, { scale: 1.07, duration: ${n(d / 8)}, ease: "sine.inOut", yoyo: true, repeat: 7, immediateRender: false, data: "${id}" }, ${n(t)});`] }),
    truot: () => ({ style: "display:none;", tweens: camera("{ x: 0, scale: 1.2 }", `x: ${-Math.round(W * 0.15)}, scale: 1.2`) }),
    xoay: () => ({ style: "display:none;", tweens: camera("{ rotation: 0, scale: 1 }", "rotation: 8, scale: 1.2") }),
    rung: () => ({ style: "display:none;", tweens: rung(Math.round(W * 0.012), Math.round(W * 0.008), Math.max(4, Math.round(d * 16))) }),
    glitch: () => ({ style: "backdrop-filter:hue-rotate(120deg) saturate(2);opacity:0;", tweens: [...hien(), ...rung(Math.round(W * 0.02), 0, Math.max(4, Math.round(d * 12)))] }),
  };
  return { preset: k, ...R[k]() };
}

// Ước lượng bề ngang chữ theo tỉ lệ ký tự, đủ để co cỡ chữ mà không cần đo trên trình duyệt.
function textWidth(text, px, ratio) { return [...String(text || "").replace(/\*\*/g, "")].length * px * ratio; }
function fitTextPx(text, px, roomW, lines, ratio) {
  const t = String(text || "").replace(/\*\*/g, "").trim();
  if (!t) return Math.round(px);
  const longest = Math.max(1, ...t.split(/\s+/).map((w) => [...w].length));
  return Math.max(10, Math.round(Math.min(px, (roomW * lines) / ([...t].length * ratio), roomW / (longest * ratio))));
}
// Giữ khối trọn trong khung; chưa chỉnh tay thì giữ thêm trong vùng an toàn TikTok (12% trên, 25% dưới).
function placeBox(xPct, yPct, w, h, W, H, safe) {
  const clamp = (v, a, b) => (a > b ? (a + b) / 2 : Math.min(b, Math.max(a, v)));
  const top = safe ? 0.12 * H : 0.02 * H, bottom = safe ? 0.75 * H : 0.98 * H;
  return { x: +clamp(xPct, ((w / 2 + 0.02 * W) / W) * 100, (1 - (w / 2 + 0.02 * W) / W) * 100).toFixed(2), y: +clamp(yPct, ((top + h / 2) / H) * 100, ((bottom - h / 2) / H) * 100).toFixed(2) };
}

function uniqueId(c, base) {
  let id = base.replace(/[^\w-]/g, "_"), n = 1;
  const taken = new Set(c.nodes.map((x) => x.id));
  while (taken.has(id)) id = `${base}_${++n}`;
  return id;
}

function finish(html, c, edits, end) {
  if (end > c.model.duration) edits.push(attrEdit(html, c.root, { "data-duration": fmt(end) }));
  return apply(html, edits);
}

// Layer mới phải thấy được ngay: nằm trên cùng thay vì lọt xuống dưới video.
// Mẫu thay cho layer cũ thì giữ đúng thứ tự của layer cũ; video B-roll nằm trên video nhưng dưới chữ.
for (const name of ["add", "addShape", "addTextVfxPreset", "addMgPreset", "addWallText"]) {
  const run = ops[name];
  ops[name] = (html, input = {}) => {
    // Làm tròn xuống: làm tròn lên sẽ bắt đầu sau khung đang hiện, layer chưa kịp thấy.
    const args = input.time === undefined || input.time === null ? input : { ...input, time: Math.floor(+input.time * 1000 + 1e-6) / 1000 };
    const r = run(html, args);
    if (!r?.id) return r;
    if (name === "add" && !["text", "sub", "image", "video"].includes(args.kind)) return r;
    let z;
    if (args.replaceId) {
      const old = scan(html).find((n) => n.id === args.replaceId);
      z = /\bz-index\s*:\s*(-?\d+)/.exec(old?.attrs?.style || "")?.[1];
      if (z === undefined) return r;
    } else if (args.kind === "video") {
      z = Math.max(0, ...scan(html).filter((n) => n.name === "video").map((n) => +(/\bz-index\s*:\s*(-?\d+)/.exec(n.attrs.style || "")?.[1] || 0))) + 1;
    } else z = topZIndex(html);
    return { ...r, html: setZIndex(r.html, r.id, z) };
  };
}

const ANIM_RE = /<script id="hd-anim">[\s\S]*?<\/script>\s*/;
// Chạy trong khung xem và lúc render: tách chữ thành đơn vị rồi gắn hiệu ứng vào timeline.
const ANIM_RUNTIME = `(function(){
var tl=(window.__timelines&&(window.__timelines.main||Object.values(window.__timelines)[0]))||window.__hdTimeline;if(!tl||!window.gsap)return;
function host(el){while(el.children.length===1&&getComputedStyle(el.children[0]).position==="absolute")el=el.children[0];return el;}
function split(el,mode){var out=[];
 if(!el.hasAttribute("data-hd-split")){el.setAttribute("data-hd-split","1");el.__hdHtml=el.innerHTML;}
 if(mode==="text"){var w=document.createElement("span");w.style.display="inline-block";while(el.firstChild)w.appendChild(el.firstChild);el.appendChild(w);return[w];}
 var walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),ns=[],n;while((n=walk.nextNode()))if(n.nodeValue.trim())ns.push(n);
 ns.forEach(function(t){var f=document.createDocumentFragment();
  (mode==="letter"?Array.from(t.nodeValue):t.nodeValue.split(/(\\s+)/)).forEach(function(p){if(!p)return;
   if(/^\\s+$/.test(p)){f.appendChild(document.createTextNode(p));return;}
   var s=document.createElement("span");s.style.display="inline-block";s.textContent=p;f.appendChild(s);out.push(s);});
  t.parentNode.replaceChild(f,t);});return out;}
function mv(m,H){if(!m||!m.on)return null;var a=m.ang!=null?m.ang:{up:-90,down:90,left:180,right:0}[m.dir||"down"],d=(m.dist==null?0.025:m.dist)*H,r=a*Math.PI/180;return{x:Math.cos(r)*d,y:Math.sin(r)*d};}
var rootNode=document.querySelector("[data-composition-id]")||document.getElementById("stage")||document.body;
var H=rootNode?rootNode.offsetHeight:1920;
HD_ANIM.forEach(function(c){var el=document.getElementById(c.id);if(!el)return;var u=split(host(el),c.mode||"text");if(!u.length)return;
 var st=(c.delay==null?1:c.delay)*0.04,from={center:"center",end:"end",edges:"edges",random:"random"}[c.order]||"start",stag=u.length>1?{each:st,from:from}:0,span=u.length>1?st*(u.length-1):0;
 function eas(n,dir){return !n||n==="none"?"none":n.indexOf(".")>=0?n:n+"."+dir;}
 function build(sp,m,dirn,ease){var hid={},vis={x:0,y:0},dur=0.6/(sp||1);var p=mv(m,H);if(p){hid.x=-p.x*dirn;hid.y=-p.y*dirn;}else{delete vis.x;delete vis.y;}
  if(c.dissolve&&c.dissolve.on){hid.opacity=0;vis.opacity=1;}
  if(c.blur&&c.blur.on){hid.filter="blur("+(c.blur.amt==null?12:c.blur.amt)+"px)";vis.filter="blur(0px)";}
  if(c.scale&&c.scale.on){hid.scale=c.scale.amt==null?0.6:c.scale.amt;vis.scale=1;}
  return{hid:hid,vis:vis,dur:dur,ease:ease};}
 if(c.in&&c.in.on){var a=build(c.in.sp,c.moveIn,1,eas(c.easeIn,"out"));a.vis.duration=a.dur;a.vis.ease=a.ease;a.vis.stagger=stag;a.vis.immediateRender=true;tl["fromTo"](u,a.hid,a.vis,c.s);}
 if(c.out&&c.out.on){var b=build(c.out.sp,c.moveOut,-1,eas(c.easeOut,"in"));var to=Object.assign({},b.hid,{duration:b.dur,ease:b.ease,stagger:stag,immediateRender:false});tl["fromTo"](u,b.vis,to,Math.max(c.s,c.e-b.dur-span));}
 if(c.strobe&&c.strobe.on){tl["fromTo"](u,{opacity:0},{opacity:1,duration:0.05,repeat:Math.max(1,Math.round((0.4*(c.strobe.sp||1))/0.05)),yoyo:true,ease:"none",stagger:stag,immediateRender:false},c.s);}
 if(c.track&&c.track.on){tl["fromTo"](el,{letterSpacing:(c.track.amt==null?20:c.track.amt)+"px"},{letterSpacing:getComputedStyle(el).letterSpacing==="normal"?"0px":getComputedStyle(el).letterSpacing,duration:0.6/((c.in&&c.in.sp)||1),ease:eas(c.easeIn,"out"),immediateRender:false},c.s);}
});})();`;

const KF_RE = /<script id="hd-kf">[\s\S]*?<\/script>\s*/;
const KF_RUNTIME = `(function(){
var tl=(window.__timelines&&(window.__timelines.main||Object.values(window.__timelines)[0]))||window.__hdTimeline;if(!tl||!window.gsap)return;
function bz(e){if(e==="hold")return function(p){return p<1?0:1;};if(!e)return "none";var a=e[0],b=e[1],c=e[2],d=e[3];function f(u,q,r){return 3*(1-u)*(1-u)*u*q+3*(1-u)*u*u*r+u*u*u;}
 return function(p){var lo=0,hi=1,u=p;for(var i=0;i<16;i++){u=(lo+hi)/2;if(f(u,a,c)<p)lo=u;else hi=u;}return f(u,b,d);};}
HD_KF.forEach(function(c){var el=document.getElementById(c.id);if(!el)return;
 Object.keys(c.p).forEach(function(p){var a=c.p[p],name="--hd-"+p;el.style.setProperty(name,a[0].v);
  for(var i=0;i+1<a.length;i++){var from={},to={duration:Math.max(0.001,a[i+1].t-a[i].t),ease:bz(a[i].e),immediateRender:false};from[name]=a[i].v;to[name]=a[i+1].v;tl.fromTo(el,from,to,c.s+a[i].t);}
 });
});})();`;

// Viết lại khối chuyển động từ cấu hình đã lưu; gọi sau mỗi lần sửa để bám theo clip khi dời, trim.
export function syncAnim(html) {
  let clean = syncFade(syncGrade(html)).replace(ANIM_RE, "").replace(KF_RE, "");
  const o = readOverrides(clean);
  // Viết lại CSS để file cũ cũng nhận luật mới.
  if (OV_RE.test(clean)) clean = writeOverrides(clean, o);
  const ids = Object.keys(o.clips || {}).filter((k) => { const a = o.clips[k].anim; return a && (a.in?.on || a.out?.on || a.strobe?.on || a.track?.on); });
  const kfIds = Object.keys(o.clips || {}).filter((k) => Object.keys(o.clips[k].kf || {}).some((p) => p !== "volume"));
  if (!ids.length && !kfIds.length) return clean;
  const nodes = scan(clean), model = parse(clean);
  const list = [];
  for (const id of ids) {
    let n = nodes.find((x) => x.id === id), clip = null;
    for (; n && !clip; n = n.parent) clip = model.clips.find((c) => c.id === n.id);
    if (!clip) continue;
    list.push({ id, s: +clip.start.toFixed(3), e: +clip.end.toFixed(3), ...o.clips[id].anim });
  }
  const kfList = kfIds.map((id) => {
    const clip = model.clips.find((c) => c.id === id);
    if (!clip) return null;
    const { volume, ...p } = o.clips[id].kf;
    return { id, s: +clip.start.toFixed(3), p };
  }).filter(Boolean);
  const block = (list.length ? `<script id="hd-anim">var HD_ANIM=${JSON.stringify(list).replace(/</g, "\\u003c")};${ANIM_RUNTIME}</script>\n  ` : "")
    + (kfList.length ? `<script id="hd-kf">var HD_KF=${JSON.stringify(kfList).replace(/</g, "\\u003c")};${KF_RUNTIME}</script>\n  ` : "");
  const at = clean.search(/<\/body\s*>/i);
  return at < 0 ? clean : clean.slice(0, at) + block + clean.slice(at);
}

const OV_RE = /<style id="hd-studio">\/\*hd:([\s\S]*?):hd\*\/[\s\S]*?<\/style>\s*/;

export { writeOverrides, overridesCss };

export function readOverrides(html) {
  const m = OV_RE.exec(html);
  if (!m) return { clips: {}, fonts: {} };
  try { return JSON.parse(m[1]); } catch { return { clips: {}, fonts: {} }; }
}

function hexA(c, a) {
  const h = (c || "#000000").replace("#", "");
  const full = h.length === 3 ? [...h].map((x) => x + x).join("") : h.slice(0, 6);
  return `#${full}${Math.round(Math.max(0, Math.min(1, a ?? 1)) * 255).toString(16).padStart(2, "0")}`;
}

// Hiệu ứng chữ: gộp thành một text-shadow vì CSS chỉ có một thuộc tính này.
function shadowCss(s) {
  const out = [];
  const drop = (x) => {
    const rad = ((x.a ?? 135) * Math.PI) / 180, d = x.d ?? 6;
    out.push(`${(Math.cos(rad) * d).toFixed(1)}px ${(Math.sin(rad) * d).toFixed(1)}px ${x.b ?? 8}px ${hexA(x.c, x.o ?? 0.6)}`);
  };
  if (s.shadow?.on) drop(s.shadow);
  if (s.shadow2?.on) drop(s.shadow2);
  if (s.rgb?.on) { const d = s.rgb.d ?? 4; out.push(`${d}px 0 0 #ff003c`, `${-d}px 0 0 #00e5ff`); }
  if (s.glow?.on) { const r = s.glow.r ?? 20, g = s.glow.g ?? 1; for (let i = 0; i < Math.max(1, Math.round(g)); i++) out.push(`0 0 ${r}px ${hexA(s.glow.c || "#ffffff", s.glow.b ?? 1)}`); }
  if (s.glowPro?.on) { const r = s.glowPro.r ?? 16, c = s.glowPro.c || "#ffd36b", a = s.glowPro.b ?? 1; out.push(`0 0 ${r * 0.4}px ${hexA("#ffffff", a)}`, `0 0 ${r}px ${hexA(c, a)}`, `0 0 ${r * 2.5}px ${hexA(c, a * 0.7)}`, `0 0 ${r * 5}px ${hexA(c, a * 0.4)}`); }
  if (s.halo?.on) { const r = s.halo.r ?? 60, c = s.halo.c || "#ffffff", a = s.halo.b ?? 0.7; out.push(`0 0 ${r}px ${hexA(c, a)}`, `0 0 ${r * 2}px ${hexA(c, a * 0.5)}`); }
  return out.join(",");
}

// Khung chữ vẽ bằng hai lớp giả phía sau chữ: lớp ngoài là viền, lớp trong là nền, nên hình nào cũng có viền.
function frameCss(id, f) {
  const P = { binhhanh: "12% 0,100% 0,88% 100%,0 100%", catgoc: "8% 0,92% 0,100% 22%,100% 78%,92% 100%,8% 100%,0 78%,0 22%", lucgiac: "10% 0,90% 0,100% 50%,90% 100%,10% 100%,0 50%", nhan: "0 0,90% 0,100% 50%,90% 100%,0 100%,6% 50%", bong: "0 0,100% 0,100% 78%,32% 78%,18% 100%,20% 78%,0 78%", kimcuong: "50% 0,100% 50%,50% 100%,0 50%" };
  const poly = f.shape === "tuy" && /^[\d.%,\s-]+$/.test(f.poly || "") ? f.poly : P[f.shape];
  const R = { vuong: 0, bo: f.radius ?? 16, vien: 9999, elip: "50%" };
  const px = f.padX ?? 24, py = f.padY ?? 12, sw = f.sw ?? 0;
  const u = (v) => (typeof v === "number" ? `${v}px` : v);
  const base = `content:"";position:absolute;`;
  const shape = `${poly ? `clip-path:polygon(${poly});` : `border-radius:${u(R[f.shape] ?? 0)};`}${f.skew ? `transform:skewX(${f.skew}deg);` : ""}`;
  const fill = hexA(f.fill || "#000000", f.alpha ?? 0.6);
  if (f.shape === "gach") return [`#${id}::after{${base}left:${-px}px;right:${-px}px;bottom:${-py}px;height:${Math.max(2, sw || 6)}px;background:${hexA(f.sc || f.fill || "#ffffff", f.sa ?? 1)};z-index:-1}`];
  const rules = [`#${id}::after{${base}inset:${-py}px ${-px}px;background:${fill};${shape}z-index:-1}`];
  if (sw) rules.push(`#${id}::before{${base}inset:${-py - sw}px ${-px - sw}px;background:${hexA(f.sc || "#ffffff", f.sa ?? 1)};${shape}z-index:-2}`);
  return rules;
}

// Mặt nạ của một layer: chữ nhật, elip, hoặc mờ dần theo một hướng; có viền mềm và đảo vùng.
function maskCss(m) {
  if (!m?.shape || m.shape === "none") return "";
  const x = +m.x || 50, y = +m.y || 50, w = +m.w || 60, h = +m.h || 60, f = Math.max(0, Math.min(50, +m.feather || 0));
  const on = m.invert ? "transparent" : "#000", off = m.invert ? "#000" : "transparent";
  let image, extra = "";
  if (m.shape === "ellipse") image = `radial-gradient(ellipse ${w / 2}% ${h / 2}% at ${x}% ${y}%,${on} ${100 - f * 2}%,${off} 100%)`;
  else if (/^(top|bottom|left|right)$/.test(m.shape)) image = `linear-gradient(to ${m.shape},${off} ${Math.max(0, x - f)}%,${on} ${Math.min(100, x + f)}%)`;
  else {
    const edge = (c, d) => `${off} ${c - d / 2 - f}%,${on} ${c - d / 2}%,${on} ${c + d / 2}%,${off} ${c + d / 2 + f}%`;
    image = `linear-gradient(to right,${edge(x, w)}),linear-gradient(to bottom,${edge(y, h)})`;
    extra = `mask-composite:${m.invert ? "add" : "intersect"};-webkit-mask-composite:${m.invert ? "source-over" : "source-in"};`;
  }
  return `mask-image:${image};-webkit-mask-image:${image};${extra}`;
}

// Luma Key: bỏ vùng tối hoặc vùng sáng của chính layer trước khi trộn.
function lumaKeyFilter(key) {
  const soft = Math.max(1, +key.soft || 1) / 100, at = (+key.at || 0) / 100;
  const [slope, intercept] = key.mode === "bright" ? [-1 / soft, (at + soft) / soft] : [1 / soft, -at / soft];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg'><filter id='k' color-interpolation-filters='sRGB'><feColorMatrix in='SourceGraphic' type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .2126 .7152 .0722 0 0' result='l'/><feComponentTransfer in='l' result='m'><feFuncA type='linear' slope='${slope.toFixed(3)}' intercept='${intercept.toFixed(3)}'/></feComponentTransfer><feComposite in='SourceGraphic' in2='m' operator='in'/></filter></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}#k")`;
}
// Các thông số hòa trộn: lọc màu chạy trước, rồi mới tới độ rõ và chế độ trộn.
function blendFilters(bl) {
  const out = [];
  if (bl.key?.mode) out.push(lumaKeyFilter(bl.key));
  if (bl.bright !== undefined) out.push(`brightness(${bl.bright / 100})`);
  if (bl.contrast !== undefined) out.push(`contrast(${bl.contrast / 100})`);
  if (bl.sat !== undefined) out.push(`saturate(${bl.sat / 100})`);
  if (bl.hue !== undefined) out.push(`hue-rotate(${bl.hue}deg)`);
  if (bl.gray !== undefined) out.push(`grayscale(${bl.gray / 100})`);
  if (bl.invert !== undefined) out.push(`invert(${bl.invert / 100})`);
  if (bl.blur !== undefined) out.push(`blur(${bl.blur}px)`);
  return out;
}
// Gradient Matte: độ rõ chuyển dần theo hướng hoặc tỏa từ một tâm.
function rampImage(r) {
  if (!r?.type) return "";
  const a = +r.from || 0, b = r.to === undefined ? 100 : +r.to;
  if (r.type === "radial") return `radial-gradient(circle at ${r.cx ?? 50}% ${r.cy ?? 50}%,#000 ${a}%,transparent ${b}%)`;
  return `linear-gradient(${r.angle ?? 90}deg,transparent ${a}%,#000 ${b}%)`;
}
function overridesCss(o) {
  const out = [];
  for (const [family, url] of Object.entries(o.fonts || {})) out.push(`@font-face{font-family:"${family}";src:url("${url}")}`);
  for (const [id, s] of Object.entries(o.clips || {})) {
    const own = [];
    // GSAP tự ghi translate/scale/rotate: none vào thẻ có hiệu ứng, phải dùng !important mới giữ được.
    const k = s.kf || {};
    if (k.x || k.y) own.push(`translate:calc(var(--hd-x,${s.x || 0})*1px) calc(var(--hd-y,${s.y || 0})*1px)!important`);
    else if (s.x !== undefined || s.y !== undefined) own.push(`translate:${s.x || 0}px ${s.y || 0}px!important`);
    if (k.scale) own.push(`scale:var(--hd-scale,${s.scale ?? 1})!important`);
    else if (s.scale !== undefined || s.scaleY !== undefined) own.push(`scale:${s.scale ?? 1} ${s.scaleY ?? s.scale ?? 1}!important`);
    if (k.rotate) own.push(`rotate:calc(var(--hd-rotate,${s.rotate || 0})*1deg)!important`);
    else if (s.rotate !== undefined) own.push(`rotate:${s.rotate}deg!important`);
    const fl = [];
    if (k.opacity) fl.push(`opacity(var(--hd-opacity,${s.opacity ?? 1}))`);
    else if (s.opacity !== undefined) fl.push(`opacity(${s.opacity})`);
    const d = s.d || {};
    const ramp = rampImage(d.bl?.ramp);
    if (ramp) {
      // Có cả Mặt nạ và Gradient Matte thì lấy phần giao của hai bên.
      const base = /mask-image:([^;]*);/.exec(maskCss(s.mask))?.[1];
      const img = base ? `${base},${ramp}` : ramp;
      own.push(`mask-image:${img};-webkit-mask-image:${img}${base ? ";mask-composite:intersect;-webkit-mask-composite:source-in" : ""}`);
    } else if (s.mask) own.push(maskCss(s.mask).replace(/;$/, ""));
    if (d.bl) fl.unshift(...blendFilters(d.bl));
    if (d.blur) fl.push(`blur(${d.blur}px)`);
    // Alpha chưa chọn màu thì không có màu để pha, làm mờ cả chữ.
    if (s.alpha !== undefined && !s.color && s.fill !== "gradient") fl.push(`opacity(${s.alpha})`);
    // Chữ chuyển sắc trong suốt nên text-shadow sẽ đè đen lên chữ: dùng bóng ngoài thay thế.
    if (s.fill === "gradient") fl.push("drop-shadow(0 2px 4px #000000b3)");
    if (fl.length) own.push(`filter:${fl.join(" ")}`);
    if (k.w) own.push(`width:calc(var(--hd-w,${d.w || 0})*1px)!important`);
    else if (d.w !== undefined) own.push(`width:${d.w}px!important`);
    if (k.h) own.push(`height:calc(var(--hd-h,${d.h || 0})*1px)!important`);
    else if (d.h !== undefined) own.push(`height:${d.h}px!important`);
    if (d.fill === "gradient") own.push(`background:linear-gradient(${d.gradA ?? 180}deg,${d.gradFrom || "#ffffff"},${d.gradTo || "#000000"})!important`);
    else if (d.fill === "image" && d.image) own.push(`background:url("${d.image}") center/cover no-repeat!important`);
    else if (d.fill === "solid" && d.color) own.push(`background:${d.color}!important`);
    if (d.sw) own.push(`border:${d.sw}px ${d.ss || "solid"} ${d.sc || "#ffffff"}!important;box-sizing:border-box`);
    if (d.radius) own.push(`border-radius:${d.radius.map((v) => `${v}px`).join(" ")}!important`);
    const SHADOW = { nho: "0 2px 6px #0006", vua: "0 8px 20px #0008", lon: "0 18px 48px #000a", sang: "0 0 28px #ffffffcc" };
    if (SHADOW[d.shadow]) own.push(`box-shadow:${SHADOW[d.shadow]}!important`);
    if (d.blend) own.push(`mix-blend-mode:${d.blend}!important`);
    if (d.backdrop) own.push(`backdrop-filter:blur(${d.backdrop}px)`);
    if (d.overflow) own.push(`overflow:${d.overflow}!important`);
    if (d.mask) {
      const i = d.maskInset || 0;
      const M = { tron: `circle(${50 - i}% at 50% 50%)`, elip: `ellipse(${50 - i}% ${50 - i}% at 50% 50%)`, vuong: `inset(${i}%)`, bo: `inset(${i}% round 12%)`, thoi: `polygon(50% ${i}%,${100 - i}% 50%,50% ${100 - i}%,${i}% 50%)` };
      if (M[d.mask]) own.push(`clip-path:${M[d.mask]}!important`);
    }
    if (d.z !== undefined) own.push(`z-index:${d.z}!important`);
    if (s.frame?.on) {
      const f = s.frame;
      own.push("isolation:isolate", "width:fit-content!important", "max-width:100%");
      if (f.center) own.push("left:0!important", "right:0!important", "margin-inline:auto!important");
      if (f.rel) own.push("position:relative");
      out.push(...frameCss(id, f));
    }
    if (d.rx || d.ry || d.tz) own.push(`transform:perspective(1200px) rotateX(${d.rx || 0}deg) rotateY(${d.ry || 0}deg) translateZ(${d.tz || 0}px)!important`);
    if (s.inl) own.push("display:inline-block");
    if (s.hidden) own.push("display:none!important");
    if (own.length) out.push(`#${id}{${own.join(";")}}`);
    const deep = [];
    if (s.fill === "gradient") deep.push(`background:linear-gradient(${s.gradA ?? 180}deg,${s.gradFrom || "#ffffff"},${s.gradTo || "#ffd36b"})!important;-webkit-background-clip:text!important;background-clip:text!important;color:transparent!important;-webkit-text-fill-color:transparent!important${s.border?.on ? "" : ";-webkit-text-stroke:0!important"}`);
    else if (s.outlineOnly) deep.push("color:transparent!important");
    else if (s.color) deep.push(`color:${s.alpha !== undefined ? hexA(s.color, s.alpha) : s.color}!important;-webkit-text-fill-color:currentColor!important`);
    if (s.border?.on || s.outlineOnly) deep.push(`-webkit-text-stroke:${s.border?.w ?? 2}px ${s.border?.c || s.color || "#ffffff"}!important;paint-order:stroke fill`);
    if (s.fill === "gradient") deep.push("text-shadow:none!important");
    else { const sh = shadowCss(s); if (sh) deep.push(`text-shadow:${sh}!important`); }
    if (s.fontFamily) deep.push(`font-family:"${s.fontFamily}"!important`);
    if (s.fontSize) deep.push(`font-size:${s.fontSize}px!important`);
    // Font riêng thường chỉ có 1 độ đậm: tắt đậm giả để thấy đúng dáng font, trừ khi bật B.
    if (s.fontFamily && !s.bold) deep.push("font-synthesis-weight:none");
    if (s.bold !== undefined) deep.push(`font-weight:${s.bold ? 800 : 400}!important`);
    if (s.italic !== undefined) deep.push(`font-style:${s.italic ? "italic" : "normal"}!important`);
    if (s.underline) deep.push("text-decoration:underline!important");
    if (s.textCase) deep.push(`text-transform:${s.textCase}!important`);
    if (s.letterSpacing !== undefined) deep.push(`letter-spacing:${s.letterSpacing}px!important`);
    if (s.lineHeight !== undefined) deep.push(`line-height:${s.lineHeight}!important`);
    if (s.textAlign) deep.push(`text-align:${s.textAlign}!important`);
    if (deep.length) out.push(`#${id},#${id} *{${deep.join(";")}}`);
    if (s.accent || s.accentFont) out.push(`#${id} b,#${id} strong{${s.accent ? `color:${s.accent}!important;` : ""}${s.accentFont ? `font-family:"${s.accentFont}"!important;font-synthesis-weight:none` : ""}}`);
    if (s.iconScale) out.push(`#${id} .ic{scale:${s.iconScale}}`);
    if (s.pinColor) out.push(`#${id} path:first-of-type{fill:${s.pinColor}!important}`);
  }
  return out.join("\n");
}

function writeOverrides(html, o) {
  const empty = !Object.keys(o.clips).length && !Object.keys(o.fonts).length;
  const block = empty ? "" : `<style id="hd-studio">/*hd:${JSON.stringify(o).replace(/\*\//g, "* /")}:hd*/\n${overridesCss(o)}</style>\n  `;
  if (OV_RE.test(html)) return html.replace(OV_RE, () => block);
  const head = html.search(/<\/head\s*>/i);
  if (head < 0) throw new Error("Không tìm thấy thẻ </head>");
  return html.slice(0, head) + block + html.slice(head);
}
