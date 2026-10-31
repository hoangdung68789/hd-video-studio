// Đọc và sửa composition HyperFrames (index.html) ngay trên văn bản nguồn,
// không dựng lại toàn bộ HTML để giữ nguyên mọi thứ AI đã viết.
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
const isChars = (node) => node.children.length > 0 && node.children.every((c) => hasClass(c, "c")) && !ownText(htmlRef.v, node).trim();
const htmlRef = { v: "" };

function collectSegments(html, node, out) {
  if (node.name === "svg" || node.name === "script" || node.name === "style") return;
  if (isChars(node)) {
    out.push({ kind: "chars", node, text: decode(node.children.map((c) => html.slice(c.openEnd, c.closeStart)).join("")) });
    return;
  }
  // Nhiều thẻ con mà không có chữ riêng (vd <b>Tên</b><span>phụ</span>) là nhiều dòng riêng, không gộp.
  const splitLines = !ownText(html, node).trim() && node.children.filter((c) => c.name !== "br").length > 1;
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
      const t = decode(html.slice(ch.openEnd, ch.closeStart));
      if (!t.trim()) { flush(); out.push({ w: " ", hi: false, c: null }); continue; }
      col = col || colorOf(ch.attrs.style);
      word += t;
    }
    flush();
    return out;
  }
  const inner = html.slice(seg.node.openEnd, seg.node.closeStart);
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
  if (kind === "chars") return tokens.map((t) => [...t.w].map((ch) => `<span class="c"${safeColor(t.c) ? ` style="color:${t.c}!important"` : ""}>${/\s/.test(ch) ? "&nbsp;" : encode(ch)}</span>`).join("")).join("");
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
    out.push({ n: i, id: n.id || "", tag: n.name, name: n.attrs["data-ten"] || n.id || text || n.name, parent: up });
  });
  return out;
}

// Lớp trên timeline chi tiết hơn loại clip: cùng là âm thanh nhưng tách giọng, nhạc.
function laneOf(node) {
  const has = (k) => new RegExp(`(^|\\s)${k}(\\s|$)`).test(node.attrs.class || "");
  if (has("shape")) return "shape";
  if (has("sticker")) return "sticker";
  if (has("trans")) return "transition";
  if (node.name === "audio" && !has("sfx")) {
    const name = `${node.id || ""} ${node.attrs.src || ""}`.toLowerCase();
    if (/giong|thoai|voice/.test(name)) return "voice";
    if (/nhac|music|bgm/.test(name)) return "music";
  }
  return null;
}

function classify(node, segs) {
  if ((node.attrs.class || "").split(/\s+/).includes("hd-grade")) return "grade";
  if (node.name === "video") return "video";
  if (node.name === "audio") return /(^|\s)sfx(\s|$)/.test(node.attrs.class || "") ? "sfx" : "audio";
  if (node.name === "img") return "image";
  if (segs.length && /(^|\s)(sub|subtitle|caption|cap)(\s|$)/.test(node.attrs.class || "")) return "sub";
  if (segs.length) return "text";
  if (/(^|\s)fx(\s|$)/.test(node.attrs.class || "") || /^(flash|fade|white|black|wipe)/i.test(node.id || "")) return "fx";
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
      else walkIc(c);
    }
  };
  walkIc(node);
  return out;
}

export function parse(html) {
  const nodes = scan(html);
  const root = nodes.find((n) => n.attrs["data-composition-id"]);
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
        return { kind: s.kind, text: s.text, tokens: tokensOf(html, s), layer, auto: !!layer && layer !== node.id && scripts.includes(`"#${layer}"`) && tweens.some((t) => t.id === layer && !t.selector) };
      }),
      icons: iconsOf(node),
      grade: readGrade(node),
      name: node.attrs["data-ten"] || "",
      lane: laneOf(node),
      tweens: list.map(({ i, selector, method, pos, dur, ease, id }) => ({ i, id, selector, method, pos, dur, ease })),
    });
  }
  const rootDur = +root.attrs["data-duration"] || 0;
  for (const c of clips) if (c.end === null) c.end = rootDur;
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
  const root = nodes.find((n) => n.attrs["data-composition-id"]);
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

export const ops = {
  move(html, { id, delta }) {
    const c = ctx(html), clip = need(c, id);
    delta = Math.max(delta, -clip.start);
    const list = tweensOf(c, clip);
    for (const t of list) delta = Math.max(delta, -t.pos);
    const edits = list.map((t) => posEdit(t, t.pos + delta));
    if (clip.timed) edits.push(attrEdit(html, c.node(id), { "data-start": fmt(clip.start + delta) }));
    return finish(html, c, edits, clip.end + delta);
  },

  trim(html, { id, edge, delta }) {
    const c = ctx(html), clip = need(c, id);
    const MIN = 0.05, list = tweensOf(c, clip), edits = [];
    if (edge === "start") {
      delta = Math.min(Math.max(delta, -clip.start), clip.end - clip.start - MIN);
      if (clip.timed && (clip.tag === "video" || clip.tag === "audio")) delta = Math.max(delta, -clip.mediaStart);
      const first = clip.timed ? list.filter((t) => Math.abs(t.pos - clip.start) < 0.02) : list.filter((t) => t.pos - clip.start < 0.001);
      edits.push(...first.map((t) => posEdit(t, t.pos + delta)));
      if (clip.timed) {
        const a = { "data-start": fmt(clip.start + delta), "data-duration": fmt(clip.end - clip.start - delta) };
        if (clip.tag === "video" || clip.tag === "audio") a["data-media-start"] = fmt(clip.mediaStart + delta);
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
    if (clip.tag === "video" || clip.tag === "audio") secondAttrs["data-media-start"] = fmt(clip.mediaStart + time - clip.start);
    const whole = html.slice(node.start, node.closeEnd);
    const openEdit = attrEdit(html, node, secondAttrs);
    const second = openEdit.text + whole.slice(node.openEnd - node.start);
    return apply(html, [
      { start: node.closeEnd, end: node.closeEnd, text: "\n      " + second },
      attrEdit(html, node, { "data-duration": fmt(time - clip.start) }),
      ...tweensOf(c, clip).filter((t) => t.pos >= time).map((t) => ({ start: t.stmtStart, end: t.stmtEnd, text: "" })),
    ]);
  },

  remove(html, { id }) {
    const c = ctx(html), clip = need(c, id), node = c.node(id);
    return apply(html, [
      { start: node.start, end: node.closeEnd, text: "" },
      ...tweensOf(c, clip).map((t) => ({ start: t.stmtStart, end: t.stmtEnd, text: "" })),
    ]);
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
    return finish(html, c, edits, clip.end + shift);
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
    const re = new RegExp(`(${name}\\s*:\\s*)[^;}]+`);
    if (!/^--[\w-]+$/.test(name) || !re.test(html)) throw new Error("Không tìm thấy biến màu");
    return html.replace(re, `$1${value}`);
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
    return apply(html, [{ start: seg.node.openEnd, end: seg.node.closeStart, text: tokensHtml(tokens, seg.kind) }]);
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
  addFx(html, { ten, nhom, loai, time, duration }) {
    const c = ctx(html), W = c.model.width, H = c.model.height;
    const chuyen = loai === "Chuyển tiếp";
    const d = +duration || (chuyen ? 0.6 : 2);
    const t = Math.max(0, +time || 0);
    const id = uniqueId(c, `fx-${plainId(ten)}`);
    const track = Math.max(0, ...c.model.clips.map((x) => x.track)) + 1;
    const tl = /(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*gsap\.timeline\s*\(/.exec(html);
    const hook = html.lastIndexOf("window.__timelines[");
    if (!tl || hook < 0) throw new Error("Dự án không có timeline GSAP để gắn hiệu ứng");
    const r = fxRecipe(fxPreset(ten, nhom, chuyen), { id, t, d, W, H, tl: tl[1] });
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

  add(html, { kind, src, time, duration, text, newId, peak, volume, sticker, ten }) {
    const c = ctx(html), W = c.model.width, H = c.model.height;
    const id = uniqueId(c, newId || kind);
    const t = fmt(time || 0);
    const track = Math.max(0, ...c.model.clips.map((x) => x.track)) + 1;
    let tag, end;
    if (kind === "video") { tag = `<video id="${id}" class="clip" src="${src}" playsinline muted data-start="${t}" data-duration="${fmt(duration)}" data-media-start="0" data-track-index="${track}" style="position:absolute;left:0;top:0;width:${W}px;height:${H}px;object-fit:cover"></video>`; end = +t + duration; }
    else if (kind === "audio") { tag = `<audio id="${id}" class="clip" src="${src}" data-start="${t}" data-duration="${fmt(duration)}" data-track-index="${track}" data-volume="1"></audio>`; end = +t + duration; }
    else if (kind === "sfx") { tag = `<audio id="${id}" class="clip sfx" src="${src}" data-start="${t}" data-duration="${fmt(duration)}" data-track-index="${track}" data-volume="${volume}" data-sfx-peak="${peak}"></audio>`; end = +t + duration; }
    else if (kind === "grade") { const d = duration || 3; tag = `<div id="${id}" class="clip hd-grade" data-start="${t}" data-duration="${fmt(d)}" data-track-index="${track}" style="display:none"></div>`; end = +t + d; }
    else if (kind === "image") { const d = duration || 3; const box = sticker ? `left:${Math.round(W * 0.3)}px;top:${Math.round(H * 0.5 - W * 0.2)}px;width:${Math.round(W * 0.4)}px;height:${Math.round(W * 0.4)}px` : `left:0;top:0;width:${W}px;height:${H}px`; tag = `<img id="${id}" class="clip${sticker ? " sticker" : ""}"${ten ? ` data-ten="${encode(ten)}"` : ""} src="${src}" data-start="${t}" data-duration="${fmt(d)}" data-track-index="${track}" style="position:absolute;${box};object-fit:contain" />`; end = +t + d; }
    else if (kind === "text") { const d = duration || 3; const fs = Math.round(W * 0.07); tag = `<div id="${id}" class="clip" data-start="${t}" data-duration="${fmt(d)}" data-track-index="${track}" style="position:absolute;left:0;width:100%;top:${Math.round(H * 0.4)}px;text-align:center;font-weight:800;font-size:${fs}px;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.8)">${encode(text || "Chữ mới")}</div>`; end = +t + d; }
    else throw new Error("Loại phần tử không hợp lệ");
    const edits = [{ start: c.root.closeStart, end: c.root.closeStart, text: `  ${tag}\n    ` }];
    return { html: finish(html, c, edits, end), id };
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

const ANIM_RE = /<script id="hd-anim">[\s\S]*?<\/script>\s*/;
// Chạy trong khung xem và lúc render: tách chữ thành đơn vị rồi gắn hiệu ứng vào timeline.
const ANIM_RUNTIME = `(function(){
var tl=window.__timelines&&(window.__timelines.main||Object.values(window.__timelines)[0]);if(!tl||!window.gsap)return;
function split(el,mode){var out=[];
 if(mode==="text"){var w=document.createElement("span");w.style.display="inline-block";while(el.firstChild)w.appendChild(el.firstChild);el.appendChild(w);return[w];}
 var walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),ns=[],n;while((n=walk.nextNode()))if(n.nodeValue.trim())ns.push(n);
 ns.forEach(function(t){var f=document.createDocumentFragment();
  (mode==="letter"?Array.from(t.nodeValue):t.nodeValue.split(/(\\s+)/)).forEach(function(p){if(!p)return;
   if(/^\\s+$/.test(p)){f.appendChild(document.createTextNode(p));return;}
   var s=document.createElement("span");s.style.display="inline-block";s.textContent=p;f.appendChild(s);out.push(s);});
  t.parentNode.replaceChild(f,t);});return out;}
function mv(m,H){if(!m||!m.on)return null;var a=m.ang!=null?m.ang:{up:-90,down:90,left:180,right:0}[m.dir||"down"],d=(m.dist==null?0.025:m.dist)*H,r=a*Math.PI/180;return{x:Math.cos(r)*d,y:Math.sin(r)*d};}
var H=document.querySelector("[data-composition-id]").offsetHeight;
HD_ANIM.forEach(function(c){var el=document.getElementById(c.id);if(!el)return;var u=split(el,c.mode||"text");if(!u.length)return;
 var st=(c.delay==null?1:c.delay)*0.04,from={center:"center",end:"end",edges:"edges",random:"random"}[c.order]||"start",stag=u.length>1?{each:st,from:from}:0,span=u.length>1?st*(u.length-1):0;
 function eas(n,dir){return !n||n==="none"?"none":n+"."+dir;}
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
var tl=window.__timelines&&(window.__timelines.main||Object.values(window.__timelines)[0]);if(!tl||!window.gsap)return;
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
    else if (s.scale !== undefined) own.push(`scale:${s.scale}!important`);
    if (k.rotate) own.push(`rotate:calc(var(--hd-rotate,${s.rotate || 0})*1deg)!important`);
    else if (s.rotate !== undefined) own.push(`rotate:${s.rotate}deg!important`);
    const fl = [];
    if (k.opacity) fl.push(`opacity(var(--hd-opacity,${s.opacity ?? 1}))`);
    else if (s.opacity !== undefined) fl.push(`opacity(${s.opacity})`);
    const d = s.d || {};
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
    if (d.blend) own.push(`mix-blend-mode:${d.blend}`);
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
