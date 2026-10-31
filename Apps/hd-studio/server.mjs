// HD Studio: giao diện tiếng Việt cho dự án HyperFrames.
// Máy xem trước và máy render vẫn là HyperFrames; máy chủ này chỉ thêm việc đọc/sửa timeline.
import http from "node:http";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { parse, ops, syncAnim, readOverrides } from "./lib/html.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE = path.resolve(HERE, "..", "..");
const VIDEOS = path.join(WORKSPACE, "Videos");
const DATA = path.join(HERE, ".du-lieu");
const PORT = +(process.argv.find((a) => a.startsWith("--port="))?.slice(7) || 4700);
const BACKEND_PORT = PORT + 1;
const HF_VERSION = "0.8.171";
const HF_BIN = path.join(process.env.APPDATA || "", "npm", "node_modules", "hyperframes", "bin", "hyperframes.mjs");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".ttf": "font/ttf", ".otf": "font/otf", ".mp4": "video/mp4", ".jpg": "image/jpeg", ".wav": "audio/wav", ".mp3": "audio/mpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".webm": "video/webm", ".m4v": "video/mp4", ".mov": "video/mp4" };

const HF_REQUIRE = createRequire(path.join(path.dirname(HF_BIN), "..", "package.json"));
// Thư mục tài nguyên: thứ tự ưu tiên là cài đặt trong Studio, thư mục TaiNguyen cạnh Studio, rồi vị trí mặc định.
const PATHS_FILE = path.join(DATA, "duong-dan.json");
const readPaths = () => { try { return JSON.parse(fs.readFileSync(PATHS_FILE, "utf8")); } catch { return {}; } };
const downloads = (name) => path.join(process.env.USERPROFILE || os.homedir(), "Downloads", name);
function resPath(key, packed, fallback) {
  const set = readPaths()[key];
  if (set) return set;
  const inPack = path.join(WORKSPACE, "TaiNguyen", packed);
  return fs.existsSync(inPack) ? inPack : fallback;
}
const FONTS = resPath("fonts", "Fonts", path.join(WORKSPACE, "Fonts", "capcut"));
const SFX_ROOT = resPath("sfx", "SFX", downloads("SOUNDEFFECT TAKING HEARD"));
const FONT_ZIP = resPath("fontZip", "CapCut Text Preset.zip", downloads("CapCut Text Preset.zip"));
// Có khai báo encoder chưa chắc chạy được: thử mã hóa một khung, không có card NVIDIA thì dùng CPU.
let nvencOk = null;
function hasNvenc() {
  if (nvencOk === null) nvencOk = spawnSync("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "color=s=256x256:d=0.1", "-frames:v", "1", "-c:v", "h264_nvenc", "-f", "null", "-"], { stdio: "ignore", windowsHide: true }).status === 0;
  return nvencOk;
}
const WIN_FONTS = "C:\\Windows\\Fonts";
const VN_CHARS = "ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹĂÂĐÊÔƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴỶỸ";

const hfCommand = (args) => (fs.existsSync(HF_BIN) ? [process.execPath, [HF_BIN, ...args]] : ["npx", ["--yes", `hyperframes@${HF_VERSION}`, ...args]]);

function killTree(child) {
  if (!child?.pid) return;
  spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
}

// ---- Dự án ----
function listProjects() {
  const out = [];
  for (const d of fs.readdirSync(VIDEOS, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const file = path.join(VIDEOS, d.name, "hf", "index.html");
    if (fs.existsSync(file)) out.push({ name: d.name, mtime: fs.statSync(file).mtimeMs });
  }
  return out.sort((a, b) => b.mtime - a.mtime);
}

let current = null; // { name, hf, root, file, backend, projectId, ready }

function projectPaths(name) {
  if (!listProjects().some((p) => p.name === name)) throw httpError(404, `Không có dự án "${name}"`);
  const root = path.join(VIDEOS, name), hf = path.join(root, "hf");
  return { name, root, hf, file: path.join(hf, "index.html") };
}

function httpError(status, message) { return Object.assign(new Error(message), { status }); }

// Lần chạy trước có thể để sót máy xem trước trên cổng này.
function freeBackendPort() {
  const out = spawnSync("netstat", ["-ano"], { encoding: "utf8" }).stdout || "";
  for (const line of out.split(/\r?\n/)) {
    const m = new RegExp(`:${BACKEND_PORT}\\s+\\S+\\s+LISTENING\\s+(\\d+)`).exec(line);
    if (m) spawnSync("taskkill", ["/PID", m[1], "/T", "/F"], { stdio: "ignore" });
  }
}

async function openProject(name) {
  if (current?.name === name) { await current.ready; return current; }
  const p = projectPaths(name);
  const goc = path.join(DATA, "goc", `${p.name}.html`);
  if (!fs.existsSync(path.join(p.root, "work", "index_built.html")) && !fs.existsSync(goc)) {
    fs.mkdirSync(path.dirname(goc), { recursive: true });
    fs.copyFileSync(p.file, goc);
  }
  const raw = fs.readFileSync(p.file, "utf8");
  const synced = syncAnim(raw);
  if (synced !== raw) fs.writeFileSync(p.file, synced);
  if (current) killTree(current.backend);
  freeBackendPort();
  const [cmd, args] = hfCommand(["preview", "--no-open", "--foreground", "--force-new", `--port=${BACKEND_PORT}`, p.hf]);
  const backend = spawn(cmd, args, { stdio: "ignore", windowsHide: true, shell: cmd === "npx" });
  current = { ...p, backend, projectId: null, history: historyFor(name) };
  current.ready = (async () => {
    for (let i = 0; i < 120; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${BACKEND_PORT}/api/projects`);
        const list = (await r.json()).projects;
        const hit = list.find((x) => path.resolve(x.dir).toLowerCase() === p.hf.toLowerCase());
        if (hit) { current.projectId = hit.id; return; }
      } catch { /* máy xem trước đang khởi động */ }
      await new Promise((r) => setTimeout(r, 500));
    }
    throw httpError(500, "Máy xem trước HyperFrames không khởi động được");
  })();
  const opening = current;
  opening.ready.catch(() => { if (current === opening) { killTree(backend); current = null; } });
  await current.ready;
  return current;
}

// ---- Lịch sử hoàn tác: chụp file trước mỗi lần sửa, nằm ngoài thư mục dự án ----
function historyFor(name) {
  const dir = path.join(DATA, "lich-su", name);
  fs.mkdirSync(dir, { recursive: true });
  const files = fs.readdirSync(dir).sort();
  for (const f of files.filter((x) => x.startsWith("r-"))) fs.rmSync(path.join(dir, f), { force: true });
  return { dir, undo: files.filter((x) => !x.startsWith("r-")).map((x) => path.join(dir, x)), redo: [] };
}

function snapshot(h, content) {
  const f = path.join(h.dir, `${Date.now()}-${crypto.randomBytes(3).toString("hex")}.html`);
  fs.writeFileSync(f, content);
  h.undo.push(f);
  while (h.undo.length > 200) fs.rmSync(h.undo.shift(), { force: true });
  return f;
}

// ---- Lịch sử: mỗi mục giữ bản trước khi sửa để khôi phục về đúng lúc đó ----
const histDir = (p) => { const d = path.join(DATA, "nhat-ky", p.name); fs.mkdirSync(d, { recursive: true }); return d; };
const histFile = (p) => path.join(histDir(p), "muc.jsonl");
const readHist = (p) => (fs.existsSync(histFile(p)) ? fs.readFileSync(histFile(p), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const OP_NAME = { move: "Dời clip", trim: "Đổi độ dài clip", split: "Tách clip", remove: "Xóa clip", duplicate: "Nhân đôi clip", attrs: "Đổi âm thanh hoặc tốc độ", text: "Sửa chữ", tween: "Đổi chuyển động", cssVar: "Đổi màu chung", style: "Đổi kiểu", setWords: "Sửa màu từng từ", add: "Thêm clip", addFx: "Thêm hiệu ứng", addShape: "Thêm hình", keyframe: "Sửa keyframe", restoreClip: "Hoàn tác hoặc làm lại riêng mục", grade: "Đổi màu video", layerId: "Chọn lớp", rename: "Đổi tên lớp", restoreSeg: "Khôi phục lớp chữ", segStyle: "Đổi kiểu lớp chữ" };
function addHist(p, { loai, mo_ta, before, ...rest }) {
  const list = readHist(p), last = list[list.length - 1], now = Date.now();
  // Kéo liên tục cùng một thứ chỉ tính một mục, giữ bản trước lần kéo đầu.
  if (loai === "sua" && last?.loai === "sua" && last.mo_ta === mo_ta && now - last.at < 3000) last.at = now;
  else {
    const id = `${now}-${crypto.randomBytes(2).toString("hex")}`;
    if (before !== undefined) fs.writeFileSync(path.join(histDir(p), `${id}.html`), before);
    list.push({ id, at: now, loai, mo_ta, ...rest });
  }
  while (list.length > 300) fs.rmSync(path.join(histDir(p), `${list.shift().id}.html`), { force: true });
  fs.writeFileSync(histFile(p), list.map((x) => JSON.stringify(x)).join("\n") + "\n");
}
// Hoàn tác, làm lại riêng từng mục trên timeline.
const clipUndo = new Map();
function clipSteps(p, id) {
  const list = readHist(p).filter((e) => e.clip === id && fs.existsSync(path.join(histDir(p), `${e.id}.html`)));
  const st = clipUndo.get(`${p.name}/${id}`) || { at: list.length, redo: [] };
  return { list, st, undo: Math.min(st.at, list.length), redo: st.redo.length };
}
async function clipStep(p, id, dir) {
  const { list, st } = clipSteps(p, id);
  let from;
  if (dir === "undo") {
    if (st.at <= 0) throw httpError(409, "Mục này không còn gì để hoàn tác");
    from = fs.readFileSync(path.join(histDir(p), `${list[st.at - 1].id}.html`), "utf8");
    st.redo.push(fs.readFileSync(p.file, "utf8"));
    st.at--;
  } else {
    if (!st.redo.length) throw httpError(409, "Mục này không còn gì để làm lại");
    from = st.redo.pop();
    st.at++;
  }
  const r = await mutate(p, "restoreClip", { id, from });
  clipUndo.set(`${p.name}/${id}`, st);
  return r;
}

const trashDir = (p) => { const d = path.join(p.root, "work", "thung_rac"); fs.mkdirSync(d, { recursive: true }); return d; };
function trashAsset(p, rel) {
  const src = inside(p.hf, rel);
  if (!fs.existsSync(src)) throw httpError(404, "Không còn tệp này");
  const to = path.join(trashDir(p), `${Date.now()}-${path.basename(rel)}`);
  fs.renameSync(src, to);
  return to;
}
async function restoreHist(p, id) {
  const e = readHist(p).find((x) => x.id === id);
  if (!e) throw httpError(404, "Không còn mục này trong lịch sử");
  if (e.loai === "them_file") {
    if (fs.readFileSync(p.file, "utf8").includes(e.path)) throw httpError(409, "Tệp này đang dùng trên timeline, hãy xóa clip trước");
    const trash = trashAsset(p, e.path);
    addHist(p, { loai: "xoa_file", mo_ta: `Xóa tệp ${path.basename(e.path)} (khôi phục)`, path: e.path, trash });
    return { changed: false };
  }
  if (e.loai === "xoa_file") {
    if (!e.trash || !fs.existsSync(e.trash)) throw httpError(404, "Tệp không còn trong thùng rác");
    const to = inside(p.hf, e.path);
    if (fs.existsSync(to)) throw httpError(409, "Đã có tệp cùng tên");
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.renameSync(e.trash, to);
    addHist(p, { loai: "them_file", mo_ta: `Lấy lại tệp ${path.basename(e.path)}`, path: e.path });
    return { changed: false };
  }
  const snap = path.join(histDir(p), `${id}.html`);
  if (!fs.existsSync(snap)) throw httpError(404, "Mục này không có bản lưu để khôi phục");
  const now = fs.readFileSync(p.file, "utf8"), next = fs.readFileSync(snap, "utf8");
  parse(next);
  snapshot(p.history, now);
  p.history.redo.length = 0;
  await writeProject(p, next);
  addHist(p, { loai: "sua", mo_ta: `Khôi phục về trước: ${e.mo_ta}`, before: now });
  logEdit(p, { thao_tac: "khoi_phuc", muc: id });
  return { changed: true };
}

function logEdit(p, entry) {
  fs.appendFileSync(path.join(p.root, "studio_chinh_sua.jsonl"), JSON.stringify({ luc: new Date().toISOString(), ...entry }) + "\n");
}

const signature = async (p) => (await (await fetch(`http://127.0.0.1:${BACKEND_PORT}/api/projects/${p.projectId}/signature`)).json()).signature;

// Ghi file rồi chờ máy xem trước nhận bản mới, để khung xem không tải lại bản cũ.
async function writeProject(p, content) {
  const before = await signature(p).catch(() => null);
  fs.writeFileSync(p.file, content);
  for (let i = 0; i < 60 && before; i++) {
    if ((await signature(p).catch(() => before)) !== before) return;
    await new Promise((r) => setTimeout(r, 50));
  }
}

// Bản gốc để khôi phục từng lớp: work/index_built.html của build.py, không có thì bản lúc Studio mở dự án lần đầu.
function baselinePath(p) {
  const built = path.join(p.root, "work", "index_built.html");
  return fs.existsSync(built) ? built : path.join(DATA, "goc", `${p.name}.html`);
}

// Chỉ đổi CSS của Studio hoặc biến màu: khung xem cập nhật tại chỗ, không tải lại.
const OVR_BLOCK = /<style id="hd-studio">[\s\S]*?<\/style>\s*/;
function hotChange(before, after) {
  const strip = (h) => h.replace(OVR_BLOCK, "").replace(/:root\s*\{[^}]*\}/, ":root{}");
  if (strip(before) !== strip(after)) return null;
  const block = OVR_BLOCK.exec(after)?.[0] || "";
  return { css: block.replace(/^<style id="hd-studio">/, "").replace(/<\/style>\s*$/, ""), vars: parse(after).vars };
}

async function mutate(p, op, body) {
  if (op === "restoreSeg") {
    const b = baselinePath(p);
    if (!fs.existsSync(b)) throw httpError(404, "Chưa có bản gốc để khôi phục");
    body = { ...body, from: fs.readFileSync(b, "utf8") };
  }
  const fn = ops[op];
  if (!fn) throw httpError(404, "Thao tác không tồn tại");
  const before = fs.readFileSync(p.file, "utf8");
  const result = fn(before, body);
  const after = syncAnim(typeof result === "string" ? result : result.html);
  if (after === before) return { changed: false, id: result.id };
  parse(after); // tệp hỏng thì dừng trước khi ghi
  snapshot(p.history, before);
  p.history.redo.length = 0;
  await writeProject(p, after);
  const { from, ...logged } = body;
  logEdit(p, { thao_tac: op, ...logged });
  const clipId = op === "restoreClip" ? null : body.id || result.id || null;
  if (clipId) clipUndo.delete(`${p.name}/${clipId}`);
  addHist(p, { loai: "sua", mo_ta: `${OP_NAME[op] || op}${body.id ? ` · ${body.id}` : result.id ? ` · ${result.id}` : ""}`, before, ...(clipId ? { clip: clipId } : {}) });
  return { changed: true, id: result.id, hot: hotChange(before, after) };
}

async function stepHistory(p, from, to, label) {
  if (!from.length) return false;
  const now = fs.readFileSync(p.file, "utf8");
  const target = from.pop();
  const saved = path.join(p.history.dir, `${to === p.history.redo ? "r-" : ""}${Date.now()}-${crypto.randomBytes(3).toString("hex")}.html`);
  fs.writeFileSync(saved, now);
  to.push(saved);
  const next = fs.readFileSync(target, "utf8");
  await writeProject(p, next);
  fs.rmSync(target, { force: true });
  logEdit(p, { thao_tac: label });
  addHist(p, { loai: "sua", mo_ta: label === "hoan_tac" ? "Hoàn tác" : "Làm lại", before: now });
  return { changed: true, hot: hotChange(now, next) };
}

// ---- Tư liệu ----
function walk(dir, base = dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) walk(full, base, out);
    else out.push({ path: path.relative(base, full).split(path.sep).join("/"), size: fs.statSync(full).size });
  }
  return out;
}

function assetKind(f) {
  const e = path.extname(f).toLowerCase();
  if ([".mp4", ".mov", ".webm", ".mkv", ".m4v"].includes(e)) return "video";
  if ([".wav", ".mp3", ".m4a", ".aac", ".flac", ".ogg", ".opus"].includes(e)) return "audio";
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(e)) return "image";
  if ([".ttf", ".otf", ".woff", ".woff2"].includes(e)) return "font";
  return "other";
}

function inside(base, rel) {
  const full = path.resolve(base, rel);
  if (full !== base && !full.startsWith(base + path.sep)) throw httpError(400, "Đường dẫn không hợp lệ");
  return full;
}

function probeDuration(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" });
  return parseFloat(r.stdout) || 3;
}

function thumbnail(p, rel, t) {
  const src = inside(p.hf, rel);
  const key = crypto.createHash("md5").update(`${src}|${fs.statSync(src).mtimeMs}|${t}`).digest("hex");
  const dir = path.join(DATA, "anh-nho");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `${key}.jpg`);
  if (!fs.existsSync(out)) {
    const args = ["-y", "-v", "error"];
    if (assetKind(src) === "video") args.push("-ss", String(t));
    args.push("-i", src, "-frames:v", "1", "-vf", "scale=-2:96", "-q:v", "6", out);
    spawnSync("ffmpeg", args, { stdio: "ignore" });
  }
  return fs.existsSync(out) ? out : null;
}

// ---- Thư viện font: CapCut đã kiểm dấu + font Windows (quét một lần rồi lưu) ----
let fontList = null, zipEntries = null;

function loadFontList() {
  if (fontList) return fontList;
  const out = new Map();
  const meta = path.join(WORKSPACE, "Fonts", "fonts.json");
  if (fs.existsSync(meta)) {
    for (const f of JSON.parse(fs.readFileSync(meta, "utf8"))) {
      if (out.has("c:" + f.file)) continue;
      out.set("c:" + f.file, { id: "c:" + f.file, family: f.family, style: f.style, vn: !!f.vn_ok, nguon: "CapCut" });
    }
  }
  fs.mkdirSync(DATA, { recursive: true });
  const cache = path.join(DATA, "font-windows.json");
  let win = null;
  if (fs.existsSync(cache)) win = JSON.parse(fs.readFileSync(cache, "utf8"));
  else {
    win = [];
    try {
      const fontkit = HF_REQUIRE("fontkit");
      for (const file of fs.readdirSync(WIN_FONTS).filter((x) => /\.(ttf|otf)$/i.test(x))) {
        try {
          const font = fontkit.openSync(path.join(WIN_FONTS, file));
          const vn = [...VN_CHARS].every((ch) => font.hasGlyphForCodePoint(ch.codePointAt(0)));
          win.push({ id: "w:" + file, family: font.familyName, style: font.subfamilyName, vn, nguon: "Windows" });
        } catch { /* bỏ qua file font hỏng */ }
      }
      fs.writeFileSync(cache, JSON.stringify(win));
    } catch { /* không có fontkit thì chỉ dùng thư viện CapCut */ }
  }
  for (const f of win) out.set(f.id, { ...f, family: f.family || f.id.slice(2).replace(/\.[^.]+$/, ""), style: f.style || "Regular" });
  fontList = [...out.values()].map((f) => ({ ...f, family: f.family || f.id.slice(2).replace(/\.[^.]+$/, ""), style: f.style || "Regular" }));
  return fontList;
}

// Bộ zip CapCut hơn 2GB nên lấy từng file bằng Python, không nạp cả zip.
const PY_UNZIP = `
import sys, zipfile, os
z = zipfile.ZipFile(sys.argv[1])
for n in z.namelist():
    if os.path.basename(n.replace(chr(92), "/")) == sys.argv[2]:
        open(sys.argv[3], "wb").write(z.read(n))
        break
`;

async function fontPath(id) {
  const file = path.basename(String(id).slice(2));
  if (id.startsWith("w:")) return inside(WIN_FONTS, file);
  const own = path.join(FONTS, file);
  if (fs.existsSync(own)) return own;
  const dir = path.join(DATA, "font-zip");
  const out = path.join(dir, file);
  if (fs.existsSync(out)) return out;
  if (!fs.existsSync(FONT_ZIP)) throw httpError(404, "Không tìm thấy bộ font CapCut trong Downloads");
  fs.mkdirSync(dir, { recursive: true });
  const venv = path.join(WORKSPACE, "venv", "Scripts", "python.exe");
  const py = fs.existsSync(venv) ? venv : "python";
  await new Promise((ok) => spawn(py, ["-I", "-c", PY_UNZIP, FONT_ZIP, file, out], { stdio: "ignore", windowsHide: true }).on("exit", ok).on("error", ok));
  if (!fs.existsSync(out)) throw httpError(404, "Không tìm thấy file font");
  return out;
}

// ---- Mẫu chữ người dùng lưu (tab Lưu): dùng chung cho mọi dự án ----
const PRESET_FILE = path.join(DATA, "mau-chu.json");
const readPresets = () => (fs.existsSync(PRESET_FILE) ? JSON.parse(fs.readFileSync(PRESET_FILE, "utf8")) : []);
function writePresets(list) { fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(PRESET_FILE, JSON.stringify(list, null, 2)); return list; }

// ---- Thư viện SFX ----
let sfxData = null;

function loadSfx() {
  if (sfxData) return sfxData;
  const cat = path.join(WORKSPACE, "sfx-catalog");
  const assets = path.join(WORKSPACE, "asset", "sfx");
  // Máy chưa có thư viện SFX thì trả danh sách rỗng để Studio vẫn chạy.
  if (!fs.existsSync(path.join(cat, "catalog.json")) || !fs.existsSync(path.join(assets, "roles.json"))) return { files: [], roles: [], thieu: true };
  const catalog = JSON.parse(fs.readFileSync(path.join(cat, "catalog.json"), "utf8"));
  const roles = JSON.parse(fs.readFileSync(path.join(assets, "roles.json"), "utf8"));
  const labels = {};
  const table = path.join(assets, "roles_table.md");
  for (const m of (fs.existsSync(table) ? fs.readFileSync(table, "utf8") : "").matchAll(/^\|\s*`([\w-]+)`\s*\|\s*([^|]+?)\s*\|/gm)) labels[m[1]] = m[2];
  sfxData = {
    files: catalog.map((f) => ({ path: f.path, cat: f.cat, dur: f.dur, peak: f.peak_t, db: f.peak_db })),
    roles: Object.entries(roles).map(([key, list]) => ({ key, label: labels[key] || key.replace(/_/g, " "), paths: list.map((x) => x.path) })),
  };
  return sfxData;
}

// aif/aac trình duyệt không phát được nên đổi sang wav.
function sfxPlayable(rel) {
  const src = inside(SFX_ROOT, rel);
  if (!fs.existsSync(src)) throw httpError(404, "Không tìm thấy file SFX");
  if (!/\.(aif|aiff|aac)$/i.test(src)) return src;
  const dir = path.join(DATA, "sfx-doi");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, crypto.createHash("md5").update(src).digest("hex") + ".wav");
  if (!fs.existsSync(out)) spawnSync("ffmpeg", ["-y", "-v", "error", "-i", src, out], { stdio: "ignore" });
  return out;
}

function sfxToProject(p, rel) {
  const info = loadSfx().files.find((f) => f.path === rel);
  if (!info) throw httpError(404, "SFX không có trong danh mục");
  const src = sfxPlayable(rel);
  const dir = path.join(p.hf, "assets", "audio", "sfx");
  fs.mkdirSync(dir, { recursive: true });
  const name = crypto.createHash("md5").update(rel).digest("hex").slice(0, 8) + "_" + path.basename(src).replace(/[^\p{L}\p{N}._-]/gu, "_");
  // Đưa đỉnh âm về -12 dBFS ngay trong tệp như sfxlib, để thanh âm lượng luôn bắt đầu từ 100.
  const wav = name.replace(/\.[^.]+$/, "") + ".wav";
  const db = Math.min(0, -12 - (info.db ?? -12));
  spawnSync("ffmpeg", ["-y", "-v", "error", "-i", src, "-af", `volume=${db.toFixed(2)}dB`, path.join(dir, wav)], { stdio: "ignore" });
  if (!fs.existsSync(path.join(dir, wav))) throw httpError(500, "Không xử lý được tệp SFX");
  return { src: `assets/audio/sfx/${wav}`, duration: info.dur, peak: info.peak || 0, volume: 1, base: path.basename(rel) };
}

// ---- Yêu thích: dùng chung cho mọi dự án ----
const FAV_FILE = path.join(DATA, "yeu-thich.json");
const readFav = () => ({ font: [], sfx: [], template: [], mg: [], capcut: [], ...(fs.existsSync(FAV_FILE) ? JSON.parse(fs.readFileSync(FAV_FILE, "utf8")) : {}) });

function toggleFav({ loai, id, bat }) {
  const fav = readFav();
  if (!Array.isArray(fav[loai])) throw httpError(400, "Loại yêu thích không hợp lệ");
  fav[loai] = fav[loai].filter((x) => x !== id);
  if (bat) fav[loai].unshift(id);
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(FAV_FILE, JSON.stringify(fav, null, 2));
  return fav;
}

// ---- Template: kho do learner quản lý, Studio chỉ đọc và ghi lựa chọn ----
const TEMPLATES = path.join(WORKSPACE, "asset", "phong_cach", "template");
const TEMPLATE_PICK = path.join(TEMPLATES, "chon_cho_video_tiep.json");

// Video mẫu lưu ở Downloads\\Template_Video; drive_links.json giữ mã file Drive của từng mẫu.
const TEMPLATE_VIDEOS = resPath("templateVideos", "Template_Video", downloads("Template_Video"));
const DRIVE_LINKS = path.join(TEMPLATE_VIDEOS, "drive_links.json");
const DRIVE_FOLDER = path.join(TEMPLATE_VIDEOS, "drive_folder.json");
const readDriveLinks = () => (fs.existsSync(DRIVE_LINKS) ? JSON.parse(fs.readFileSync(DRIVE_LINKS, "utf8")) : {});

function localTemplateVideo(ma) {
  const hit = walk(TEMPLATE_VIDEOS).find((f) => path.basename(f.path).toLowerCase() === `${String(ma).toLowerCase()}.mp4`);
  return hit ? path.join(TEMPLATE_VIDEOS, hit.path) : null;
}

async function readDriveFolder(id, depth, found) {
  const r = await fetch(`https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(id)}#list`);
  if (!r.ok) throw httpError(400, "Không đọc được thư mục. Hãy kiểm tra đã chia sẻ “Bất kỳ ai có đường liên kết”.");
  const html = await r.text();
  for (const m of html.matchAll(/id="entry-([\w-]+)"[\s\S]*?<a href="([^"]+)"[\s\S]*?flip-entry-title">([^<]+)</g)) {
    if (m[2].includes("/folders/")) {
      if (depth > 0) await readDriveFolder(m[1], depth - 1, found);
    } else {
      const ma = /^(TV-\d+)/i.exec(m[3].trim())?.[1];
      if (ma) found[ma.toUpperCase()] = m[1];
    }
  }
}

async function syncDrive(url) {
  const id = /\/folders\/([\w-]+)/.exec(url || "")?.[1] || /[?&]id=([\w-]+)/.exec(url || "")?.[1];
  if (!id) throw httpError(400, "Link chưa đúng. Hãy dán link thư mục Google Drive.");
  fs.mkdirSync(TEMPLATE_VIDEOS, { recursive: true });
  fs.writeFileSync(DRIVE_FOLDER, JSON.stringify({ url }, null, 2));
  const found = {};
  await readDriveFolder(id, 3, found);
  if (!Object.keys(found).length) throw httpError(400, "Không thấy video TV-xx nào. Hãy kiểm tra quyền chia sẻ và tên file.");
  fs.mkdirSync(TEMPLATE_VIDEOS, { recursive: true });
  fs.writeFileSync(DRIVE_LINKS, JSON.stringify(found, null, 2));
  return found;
}

function listTemplates() {
  if (!fs.existsSync(TEMPLATES)) return [];
  const out = [], links = readDriveLinks();
  for (const d of fs.readdirSync(TEMPLATES, { withFileTypes: true })) {
    const file = path.join(TEMPLATES, d.name, "template.json");
    if (!d.isDirectory() || !fs.existsSync(file)) continue;
    const j = JSON.parse(fs.readFileSync(file, "utf8"));
    const card = path.join(TEMPLATES, d.name, "the.md");
    out.push({
      ma: j.id, ten: j.ten, thu_muc: d.name, co_may: !!localTemplateVideo(j.id), drive: links[j.id] || null, the_loai: j.the_loai || [], url: j.nguon?.url || null, chi_so: j.nguon?.chi_so || "",
      thoi_luong: j.thong_so?.thoi_luong ?? null, shot: j.thong_so?.shot_tb ?? null, bpm: j.thong_so?.bpm ?? null, hook: j.giu_chan?.hook || "",
      doan: (j.doan || []).map((x) => ({ tu: x.tu, den: x.den, vai_tro: x.vai_tro })), su_kien: j.su_kien_do_duoc || {},
      trang_thai: j.trang_thai || "", the: fs.existsSync(card) ? fs.readFileSync(card, "utf8") : "",
    });
  }
  return out.sort((a, b) => String(a.ma).localeCompare(String(b.ma)));
}

// ---- LUT của Dũng: bộ freshluts đã phân loại + asset/lut ----
const LUT_ZIP = resPath("lutZip", "freshluts-LUT-phan-loai.zip", path.join(WORKSPACE, "LUTs", "freshluts-LUT-phan-loai.zip"));
const LUT_DIR = path.join(WORKSPACE, "asset", "lut");
let lutList = null, lutZip = null;
function loadLuts() {
  if (lutList) return lutList;
  const seen = new Set(), out = [];
  if (fs.existsSync(LUT_DIR)) for (const f of fs.readdirSync(LUT_DIR).filter((x) => /\.cube$/i.test(x))) {
    seen.add(f);
    out.push({ key: "a:" + f, ten: f.replace(/\.cube$/i, ""), nhom: "LUT đã duyệt" });
  }
  if (fs.existsSync(LUT_ZIP)) {
    lutZip = new (HF_REQUIRE("adm-zip"))(LUT_ZIP);
    for (const e of lutZip.getEntries()) {
      if (!/\.cube$/i.test(e.entryName)) continue;
      const p = e.entryName.split("/"), f = p[p.length - 1];
      if (seen.has(f)) continue;
      seen.add(f);
      out.push({ key: "z:" + e.entryName, ten: f.replace(/\.cube$/i, "").replace(/\s*\[\d+\]$/, ""), nhom: p[p.length - 2].replace(/^\d+_/, "") });
    }
  }
  return (lutList = out);
}
function useLut(p, key) {
  if (!loadLuts().some((x) => x.key === key)) throw httpError(404, "Không có LUT này");
  const name = path.basename(key.slice(2)).replace(/[^\w.-]+/g, "_");
  const dir = path.join(p.hf, "assets", "luts");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, name);
  if (key[0] === "a") fs.copyFileSync(inside(LUT_DIR, path.basename(key.slice(2))), out);
  else fs.writeFileSync(out, lutZip.getEntry(key.slice(2)).getData());
  return `assets/luts/${name}`;
}

// ---- Danh mục CapCut (asset/capcut): chỉ tên, phân loại và ảnh xem trước ----
const CAPCUT_FILE = path.join(WORKSPACE, "asset", "capcut", "thu_vien.json");
let capcutList = null;
const loadCapcut = () => (capcutList ??= fs.existsSync(CAPCUT_FILE) ? JSON.parse(fs.readFileSync(CAPCUT_FILE, "utf8")) : []);
// Nhãn dán: lưu ảnh xem trước vào dự án rồi đưa lên timeline như một ảnh thường.
async function capcutSticker(p, id) {
  const x = loadCapcut().find((v) => v.id === id);
  if (!x) throw httpError(404, "Không có mục CapCut này");
  const rel = `assets/capcut/${id}.png`, out = path.join(p.hf, rel);
  if (!fs.existsSync(out)) {
    const r = await fetch(x.anh_tinh || x.anh);
    if (!r.ok) throw httpError(502, "Không tải được ảnh nhãn dán, hãy kiểm tra mạng");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const tmp = `${out}.goc`;
    fs.writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
    spawnSync("ffmpeg", ["-y", "-v", "error", "-i", tmp, "-frames:v", "1", out], { stdio: "ignore" });
    fs.rmSync(tmp, { force: true });
    if (!fs.existsSync(out)) throw httpError(502, "Không đọc được ảnh nhãn dán");
  }
  return { src: rel, ten: x.ten };
}

async function capcutRef(p, id) {
  const x = loadCapcut().find((v) => v.id === id);
  if (!x) throw httpError(404, "Không có mục CapCut này");
  const url = x.anh_tinh || x.anh;
  const r = await fetch(url);
  if (!r.ok) throw httpError(502, "Không tải được ảnh mẫu CapCut");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(p.root, "work", "studio_ai", `capcut-${stamp}`);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, "goc");
  fs.writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
  const out = path.join(dir, "mau.jpg");
  spawnSync("ffmpeg", ["-y", "-v", "error", "-i", tmp, "-frames:v", "1", out], { stdio: "ignore" });
  fs.rmSync(tmp, { force: true });
  return { item: x, image: fs.existsSync(out) ? { t: 0, file: path.relative(p.root, out).split(path.sep).join("/"), nhan: "mẫu" } : null };
}

// ---- Thư viện MG Opus 5.5 (asset/mg_opus55, dựng từ repo yihui-dev/awesome-opus5-5-videos) ----
const MG_FILE = path.join(WORKSPACE, "asset", "mg_opus55", "thu_vien.json");
let mgList = null;
const loadMg = () => (mgList ??= fs.existsSync(MG_FILE) ? JSON.parse(fs.readFileSync(MG_FILE, "utf8")) : []);

// Tải video mẫu về máy lần đầu xem, các lần sau phát từ máy.
async function mgVideo(ma, ban) {
  const x = loadMg().find((v) => v.ma === ma);
  const url = x && (ban === "lam_lai" ? x.video_lam_lai : x.video || x.video_lam_lai);
  if (!url) throw httpError(404, "Mẫu này không có video");
  const dir = path.join(DATA, "mg-cache");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `${ma.replace(/[^\w-]/g, "_")}_${ban === "lam_lai" ? "lam_lai" : "goc"}.mp4`);
  if (!fs.existsSync(out)) {
    const r = await fetch(url);
    if (!r.ok) throw httpError(502, "Không tải được video mẫu");
    fs.writeFileSync(out + ".tmp", Buffer.from(await r.arrayBuffer()));
    fs.renameSync(out + ".tmp", out);
  }
  return { file: out, item: x };
}

// Cắt các khung hình trong đoạn mẫu Dũng chọn để AI nhìn đúng hiệu ứng cần lấy.
async function mgFrames(p, { ma, ban, tu, den }, job) {
  const { file } = await mgVideo(ma, ban);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const out = path.join(p.root, "work", "studio_ai", `mau-${stamp}`);
  fs.mkdirSync(out, { recursive: true });
  const a = Math.max(0, +tu || 0), b = Math.max(a + 0.2, +den || a + 3), n = 6;
  const shots = [];
  for (let i = 0; i < n; i++) {
    const t = a + ((b - a) * i) / (n - 1);
    const f = path.join(out, `mau-${String(i).padStart(2, "0")}-at-${t.toFixed(2)}s.jpg`);
    spawnSync("ffmpeg", ["-y", "-v", "error", "-ss", t.toFixed(3), "-i", file, "-frames:v", "1", "-vf", "scale=640:-2", "-q:v", "4", f], { stdio: "ignore" });
    if (fs.existsSync(f)) shots.push({ t, file: path.relative(p.root, f).split(path.sep).join("/"), nhan: "mẫu" });
    if (job.status !== "dang_chay") break;
  }
  return shots;
}

// ---- Bố cục theo ảnh: AI đọc ảnh Dũng tải lên, chỉ được trả cấu hình bố cục, không sửa mã ----
const LAYOUT_PROMPT = (img) => `Xem ảnh giao diện tại ${img} (đọc bằng Read). Đây là mẫu Dũng muốn cho HD Studio, một trình dựng video có: bảng trái (danh sách, tư liệu), khung xem video ở giữa, bảng thuộc tính, timeline.
Chỉ trả về đúng một khối JSON, không giải thích, theo mẫu:
{"leftPos":"left|right","rightPos":"left|right","leftW":270,"rightW":300,"timelinePos":"bottom|top","timelineH":312,"mode":"toi|xam|sang","accent":"#RRGGBB","panel":"#RRGGBB"}
leftPos là vị trí bảng danh sách, rightPos là vị trí bảng thuộc tính, chiều rộng và chiều cao tính bằng px theo màn hình 1440x860. Nếu ảnh không phải giao diện phần mềm, trả về {"loi":"lý do ngắn"}.`;

function layoutFromImage(buf, ext) {
  const bin = findClaude();
  if (!bin) throw httpError(500, "Không tìm thấy Claude Code trên máy");
  fs.mkdirSync(DATA, { recursive: true });
  const img = path.join(DATA, `bo-cuc-mau${ext}`);
  fs.writeFileSync(img, buf);
  const args = ["-p", LAYOUT_PROMPT(img), "--output-format", "json", "--allowedTools", "Read"];
  const [cmd, full] = bin.endsWith(".mjs") ? [process.execPath, [bin, ...args]] : [bin, args];
  return new Promise((ok, fail) => {
    const child = spawn(cmd, full, { cwd: DATA, windowsHide: true });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.on("error", () => fail(httpError(500, "Không chạy được AI")));
    child.on("exit", () => {
      let result = "";
      try { const j = JSON.parse(out); if (j.is_error) return fail(httpError(503, j.result || "AI báo lỗi")); result = j.result || ""; }
      catch { result = out; }
      const m = /\{[\s\S]*\}/.exec(result);
      if (!m) return fail(httpError(502, "AI không trả về bố cục"));
      try {
        const v = JSON.parse(m[0]);
        if (v.loi) return fail(httpError(400, v.loi));
        const num = (x, a, b, d) => (Number.isFinite(+x) ? Math.max(a, Math.min(b, Math.round(+x))) : d);
        const hex = (x) => (/^#[0-9a-f]{6}$/i.test(x || "") ? x : null);
        ok({ leftPos: v.leftPos === "right" ? "right" : "left", rightPos: v.rightPos === "left" ? "left" : "right", leftW: num(v.leftW, 180, 460, 270), rightW: num(v.rightW, 220, 480, 300), timelinePos: v.timelinePos === "top" ? "top" : "bottom", timelineH: num(v.timelineH, 140, 520, 312), mode: ["toi", "xam", "sang"].includes(v.mode) ? v.mode : "toi", accent: hex(v.accent), panel: hex(v.panel) });
      } catch { fail(httpError(502, "AI trả về bố cục không đọc được")); }
    });
  });
}

// ---- Yêu cầu AI: chạy Claude Code ngay trong thư mục dự án ----
function findClaude() {
  if (process.env.HD_CLAUDE_BIN) return process.env.HD_CLAUDE_BIN;
  const onPath = spawnSync("where", ["claude"], { encoding: "utf8" }).stdout?.split(/\r?\n/).find((x) => x.trim());
  if (onPath) return onPath.trim();
  const base = path.join(process.env.LOCALAPPDATA || "", "Claude-Data");
  const found = [];
  const scan = (d, depth) => {
    if (depth < 0 || !fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) scan(full, depth - 1);
      else if (e.name.toLowerCase() === "claude.exe") found.push({ full, t: fs.statSync(full).mtimeMs });
    }
  };
  scan(base, 5);
  return found.sort((a, b) => b.t - a.t)[0]?.full || null;
}

let aiJob = null;

function aiPrompt(p, { text, time, clip, range, images, tep }) {
  const model = parse(fs.readFileSync(p.file, "utf8"));
  const c = clip && model.clips.find((x) => x.id === clip);
  const sel = c ? `Phần tử đang chọn: id="${c.id}", loại ${c.kind}, từ ${c.start.toFixed(2)} đến ${c.end.toFixed(2)} giây${c.segments.length ? `, chữ: "${c.segments.map((x) => x.text).join(" / ")}"` : ""}${c.src ? `, nguồn ${c.src}` : ""}.` : "Không chọn phần tử nào.";
  return [
    `Bạn là AI dựng video làm việc trong HD Studio của Dũng. Dự án: ${p.root}. Composition HyperFrames: hf/index.html (${model.width}×${model.height}, ${model.duration.toFixed(2)} giây).`,
    `Đầu phát đang ở ${(+time || 0).toFixed(2)} giây. ${sel}`,
    ...(range ? [`Đoạn Dũng khoanh trên timeline: ${(+range[0]).toFixed(2)} đến ${(+range[1]).toFixed(2)} giây.`] : []),
    ...(images?.some((x) => x.nhan === "mẫu") ? [`Ảnh khung hình của VIDEO MẪU, chỉ lấy hiệu ứng trong đoạn này (đọc bằng Read): ${images.filter((x) => x.nhan === "mẫu").map((x) => `${x.file} (giây ${x.t.toFixed(2)} của mẫu)`).join("; ")}.`] : []),
    ...(tep?.length ? [`Dũng gửi kèm các tệp sau, đọc bằng Read trước khi trả lời: ${tep.map((x) => `${x.ten}: ${x.files.join(", ")}${x.video ? ` (khung hình trích từ video ${x.video})` : ""}`).join("; ")}.`] : []),
    ...(images?.some((x) => x.nhan === "cảnh") ? [`Ảnh khung hình cảnh quay, chưa có chữ và đồ họa (đọc bằng Read): ${images.filter((x) => x.nhan === "cảnh").map((x) => `${x.file} (giây ${x.t.toFixed(2)})`).join(", ")}. Chữ và đồ họa xem trong hf/index.html.`] : []),
    ...(images?.some((x) => x.nhan === undefined) ? [`Ảnh chụp video của Dũng đúng như bản xuất (đọc bằng Read trước khi sửa): ${images.filter((x) => x.nhan === undefined).map((x) => `${x.file} (giây ${x.t.toFixed(2)})`).join("; ")}.`] : []),
    `Yêu cầu của Dũng: «${text}»`,
    "Luật bắt buộc:",
    "- Chỉ làm đúng việc được yêu cầu. Thấy lỗi khác thì báo 1 dòng, không tự sửa.",
    "- Không chắc Dũng muốn gì thì không đoán: không sửa file, trả lời bằng 1 câu hỏi có lựa chọn.",
    "- Đọc README.md và LOI_CAN_TRANH.md của dự án nếu có trước khi sửa.",
    "- Sửa trực tiếp hf/index.html, giữ id, data-start, data-duration, data-track-index và các lệnh tl.* hợp lệ. Không chạy build.py, không render, không xóa file.",
    "- Trả lời tiếng Việt, tối đa 5 dòng: đã sửa gì, ở giây nào.",
  ].join("\n");
}

// Chụp nhanh: lấy thẳng khung hình của cảnh video tại thời điểm đó bằng FFmpeg, dưới 1 giây.
// Ảnh chỉ có cảnh quay; chữ và đồ họa AI đọc trong hf/index.html.
function snapFast(p, times) {
  const model = parse(fs.readFileSync(p.file, "utf8"));
  const out = path.join(p.root, "work", "studio_ai", `nhanh-${Date.now()}`);
  const shots = [];
  for (const t of times) {
    const c = model.clips.filter((x) => x.kind === "video" && x.src && t >= x.start && t < x.end).sort((a, b) => b.track - a.track)[0];
    if (!c) continue;
    fs.mkdirSync(out, { recursive: true });
    const f = path.join(out, `${t.toFixed(2)}.jpg`);
    spawnSync("ffmpeg", ["-y", "-v", "error", "-ss", ((c.mediaStart || 0) + (t - c.start) * (c.rate || 1)).toFixed(3), "-i", path.join(p.hf, c.src), "-frames:v", "1", "-vf", "scale=720:-2", "-q:v", "4", f], { stdio: "ignore", windowsHide: true });
    if (fs.existsSync(f)) shots.push({ t, file: path.relative(p.root, f).split(path.sep).join("/"), nhan: "cảnh" });
  }
  return shots;
}

// Tệp người dùng gửi vào chat: ảnh giữ nguyên, video lấy 6 khung hình để AI đọc được.
function saveAiFile(p, ten, buf) {
  const ext = path.extname(ten || "").toLowerCase() || ".png";
  const dir = path.join(p.root, "work", "studio_ai", "dinh-kem");
  fs.mkdirSync(dir, { recursive: true });
  const base = `${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;
  const file = path.join(dir, base + ext);
  fs.writeFileSync(file, buf);
  const rel = (f) => path.relative(p.root, f).split(path.sep).join("/");
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) return { kind: "image", ten, files: [rel(file)] };
  if (![".mp4", ".mov", ".webm", ".m4v", ".mkv", ".avi"].includes(ext)) throw httpError(400, "Chỉ nhận ảnh hoặc video");
  const dur = probeDuration(file) || 6, frames = [];
  for (let i = 0; i < 6; i++) {
    const f = path.join(dir, `${base}-${i}.jpg`);
    spawnSync("ffmpeg", ["-y", "-v", "error", "-ss", ((dur * (i + 0.5)) / 6).toFixed(2), "-i", file, "-frames:v", "1", "-vf", "scale=720:-2", "-q:v", "4", f], { stdio: "ignore", windowsHide: true });
    if (fs.existsSync(f)) frames.push(rel(f));
  }
  if (!frames.length) throw httpError(400, "Không đọc được video này");
  return { kind: "video", ten, video: rel(file), files: frames };
}

// Chụp khung hình bằng chính máy render của HyperFrames, thu nhỏ thành JPG để AI đọc nhanh.
function snapFrames(p, times, job) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const out = path.join(p.root, "work", "studio_ai", stamp);
  fs.mkdirSync(out, { recursive: true });
  const [cmd, args] = hfCommand(["snapshot", "--at", times.map((t) => t.toFixed(3)).join(","), "--no-end", "-o", out]);
  return new Promise((ok) => {
    const child = spawn(cmd, args, { cwd: p.hf, windowsHide: true, shell: cmd === "npx" });
    job.child = child;
    child.on("exit", () => {
      const shots = [];
      for (const f of fs.readdirSync(out).filter((x) => /^frame-.*\.png$/.test(x)).sort()) {
        const t = parseFloat(/at-([\d.]+)s/.exec(f)?.[1] || "0");
        const jpg = f.replace(/\.png$/, ".jpg");
        spawnSync("ffmpeg", ["-y", "-v", "error", "-i", path.join(out, f), "-vf", "scale=720:-2", "-q:v", "4", path.join(out, jpg)], { stdio: "ignore" });
        fs.rmSync(path.join(out, f), { force: true });
        if (fs.existsSync(path.join(out, jpg))) shots.push({ t, file: path.relative(p.root, path.join(out, jpg)).split(path.sep).join("/") });
      }
      fs.rmSync(path.join(out, "contact-sheet.jpg"), { force: true });
      ok(shots);
    });
    child.on("error", () => ok([]));
  });
}

function startAi(p, body) {
  if (aiJob?.status === "dang_chay") throw httpError(409, "AI đang làm yêu cầu trước. Chờ xong hoặc bấm Dừng.");
  if (body.mg) body = { ...body, text: mgRequest(body) };
  // Mỗi dự án giữ một phiên Claude: tin nhắn nào cũng nối vào phiên đó, tin đầu tiên sẽ tự tạo phiên.
  if (!body.session) { const link = readLink(p); if (link && claudeFile(link.id)) body = { ...body, session: link.id, sessionCwd: link.cwd, chat: body.chat || link.chat }; }
  const bin = findClaude();
  if (!bin) throw httpError(500, "Không tìm thấy Claude Code trên máy");
  const job = { status: "dang_chay", project: p.name, text: body.text, lines: [], images: [], sessionId: body.session || null, sessionCwd: body.sessionCwd || p.root, startedAt: Date.now() };
  saveChatStart(p, job, body.chat, body.hien || body.text, body);
  const prevSession = null;
  aiJob = job;
  const times = (body.shots || []).map(Number).filter((t) => t >= 0).slice(0, 6);
  (async () => {
    if (body.capcut) {
      job.lines.push({ kind: "tool", text: "Đang lấy ảnh mẫu CapCut…" });
      try {
        const { item, image } = await capcutRef(p, body.capcut);
        if (image) job.images.push(image);
        body = { ...body, text: `Dựng lại bằng HTML/GSAP trong hf/index.html ${item.loai.toLowerCase()} giống mục "${item.ten}" của CapCut (nhóm ${item.nhom}, xem ảnh mẫu). ${body.range ? `Đặt ở đoạn ${(+body.range[0]).toFixed(2)}–${(+body.range[1]).toFixed(2)} giây.` : `Đặt tại giây ${(+body.time || 0).toFixed(2)}${item.loai === "Chuyển tiếp" ? ", vào điểm chuyển cảnh gần nhất" : ""}.`} Không chép tệp của CapCut, không che mặt người dẫn, giữ trong vùng an toàn TikTok.${body.text ? ` Dũng ghi thêm: ${body.text}` : ""}` };
      } catch (e) { job.lines.push({ kind: "err", text: e.message }); }
    }
    if (body.mg) {
      job.lines.push({ kind: "tool", text: "Đang lấy khung hình từ video mẫu…" });
      try { job.images.push(...await mgFrames(p, body.mg, job)); }
      catch (e) { job.lines.push({ kind: "err", text: e.message }); }
    }
    if (times.length) {
      job.lines.push({ kind: "tool", text: `Đang chụp ${times.length} khung hình…` });
      job.images.push(...snapFast(p, times));
      if (!job.images.length) job.images.push(...await snapFrames(p, times, job));
      if (job.status !== "dang_chay") return;
      job.lines.push({ kind: "tool", text: job.images.length ? `Đã chụp ${job.images.length} khung hình gửi kèm AI` : "Không chụp được khung hình, gửi yêu cầu không kèm ảnh" });
    }
    if (bridgeAlive()) sendBridge(p, body, job);
    else runClaude(p, body, bin, job, prevSession);
  })();
  return publicAi(job);
}

function mgRequest({ mg, range, time, text }) {
  const x = loadMg().find((v) => v.ma === mg.ma);
  if (!x) throw httpError(404, "Không có mẫu này");
  const target = range ? `đoạn ${(+range[0]).toFixed(2)}–${(+range[1]).toFixed(2)} giây` : `từ giây ${(+time || 0).toFixed(2)}, dài khoảng ${((+mg.den || 0) - (+mg.tu || 0)).toFixed(1)} giây`;
  return [
    `Áp dụng motion graphics/animation từ mẫu "${x.ten || x.ma}" (${x.skillry}) vào video của tôi, đặt ở ${target}.`,
    `Chỉ lấy hiệu ứng trong giây ${(+mg.tu).toFixed(1)}–${(+mg.den).toFixed(1)} của video mẫu, không lấy phần khác.`,
    "Dựng lại hiệu ứng bằng HTML/GSAP trong hf/index.html, nội dung chữ/số theo video của tôi (bất động sản), không chép chữ của mẫu, không che mặt người dẫn, giữ trong vùng an toàn TikTok.",
    `Prompt gốc tác giả chia sẻ${x.prompt_thieu ? " (có thể không đầy đủ)" : ""}: """${x.prompt.slice(0, 2500)}"""`,
    ...(text ? [`Dũng ghi thêm: ${text}`] : []),
  ].join("\n");
}

// ---- Cầu nối với phiên Claude đang mở: phiên đó chạy lib/lang_nghe.mjs, yêu cầu đi qua hộp thư ----
const BRIDGE = path.join(DATA, "cau-noi");
function bridgeAlive() {
  try { return Date.now() - fs.statSync(path.join(BRIDGE, "song.json")).mtimeMs < 15000; } catch { return false; }
}
function sendBridge(p, body, job) {
  job.before = fs.readFileSync(p.file, "utf8");
  job.p = p;
  job.body = body;
  job.bridge = true;
  fs.mkdirSync(BRIDGE, { recursive: true });
  // Thông báo của Monitor bị cắt nếu dài: lời nhắn đi kèm, bối cảnh đầy đủ nằm trong tệp.
  const detail = path.join(p.root, "work", "studio_ai", `yeu-cau-${Date.now()}.txt`);
  fs.mkdirSync(path.dirname(detail), { recursive: true });
  fs.writeFileSync(detail, aiPrompt(p, { ...body, images: job.images }));
  fs.appendFileSync(path.join(BRIDGE, "hop-thu.jsonl"), JSON.stringify({ du_an: p.name, loi_nhan: String(body.text || "").slice(0, 300), chi_tiet: detail.split(path.sep).join("/") }) + "\n");
  job.lines.push({ kind: "tool", text: "Đã gửi vào phiên Claude đang mở, đang chờ trả lời…" });
}
function bridgeReply(text) {
  const job = aiJob;
  if (job?.status !== "dang_chay" || !job.bridge) throw httpError(409, "Không có yêu cầu nào đang chờ trả lời");
  job.lines.push({ kind: "ai", text: String(text || "Xong.") });
  finishAi(job.p, job, job.body, job.before, 0);
}
// Phiên Claude ngừng nghe khi đang có yêu cầu: báo lỗi, không để khung AI chờ mãi.
function checkBridge() {
  if (aiJob?.status === "dang_chay" && aiJob.bridge && !bridgeAlive()) {
    aiJob.error = "Phiên Claude đã ngừng nghe. Gửi lại để dùng phiên riêng của dự án.";
    aiJob.lines.push({ kind: "err", text: aiJob.error });
    finishAi(aiJob.p, aiJob, aiJob.body, aiJob.before, 1);
  }
}
function finishAi(p, job, body, before, code) {
  job.status = code === 0 && !job.error ? "xong" : "loi";
  if (job.status === "loi" && !job.error) job.lines.push({ kind: "err", text: job.stderr?.trim().split("\n").pop() || "AI dừng giữa chừng" });
  job.finishedAt = Date.now();
  const after = fs.readFileSync(p.file, "utf8");
  if (after !== before) {
    // Lưu bản trước khi AI sửa để nút Hoàn tác trả lại được.
    snapshot(p.history, before);
    p.history.redo.length = 0;
    logEdit(p, { thao_tac: "ai", yeu_cau: body.text });
    addHist(p, { loai: "sua", mo_ta: `AI sửa: ${String(body.text || "").slice(0, 60)}`, before });
    job.changed = true;
  }
  saveChatEnd(p, job);
}

function runClaude(p, body, bin, job, prevSession) {
  const args = ["-p", aiPrompt(p, { ...body, images: job.images }), "--output-format", "stream-json", "--verbose", "--permission-mode", "acceptEdits",
    "--allowedTools", "Read", "Edit", "Write", "Glob", "Grep", "Bash(ffprobe:*)"];
  if (body.session) args.push("--resume", body.session);
  // Tiếp tục phiên Claude ở thư mục khác: phải chạy đúng nơi của phiên đó và cho phép sửa dự án này.
  const cwd = body.sessionCwd && fs.existsSync(body.sessionCwd) ? body.sessionCwd : p.root;
  if (cwd !== p.root) args.push("--add-dir", p.root);
  const before = fs.readFileSync(p.file, "utf8");
  const [cmd, full] = bin.endsWith(".mjs") ? [process.execPath, [bin, ...args]] : [bin, args];
  const child = spawn(cmd, full, { cwd, windowsHide: true });
  job.child = child;
  let buf = "";
  child.stdout.on("data", (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      let ev;
      try { ev = JSON.parse(line); } catch { continue; }
      if (ev.session_id) job.sessionId = ev.session_id;
      if (ev.type === "assistant") {
        for (const b of ev.message?.content || []) {
          if (b.type === "text" && b.text.trim()) job.lines.push({ kind: "ai", text: b.text.trim() });
          if (b.type === "tool_use") {
            const f = b.input?.file_path || b.input?.path || b.input?.pattern || "";
            const verb = { Read: "Đang đọc", Edit: "Đang sửa", Write: "Đang ghi", Glob: "Đang tìm", Grep: "Đang tìm", Bash: "Đang chạy" }[b.name] || b.name;
            job.lines.push({ kind: "tool", text: `${verb} ${path.basename(String(f)) || ""}`.trim() });
          }
        }
      }
      if (ev.type === "result") {
        job.error = ev.is_error ? (ev.result || "AI báo lỗi") : null;
        const last = job.lines[job.lines.length - 1];
        if (ev.is_error && last?.text === job.error) last.kind = "err";
        else if (ev.is_error) job.lines.push({ kind: "err", text: job.error });
      }
    }
  });
  child.stderr.on("data", (d) => { job.stderr = (String(job.stderr || "") + d).slice(-1500); });
  child.on("exit", (code) => {
    if (job.status !== "dang_chay") { saveChatEnd(p, job); return; }
    finishAi(p, job, body, before, code);
  });
}

// ---- Lịch sử chat với AI: mỗi cuộc trò chuyện một tệp, đọc lại và chat tiếp được ----
const chatDir = (p) => { const d = path.join(DATA, "chat", p.name); fs.mkdirSync(d, { recursive: true }); return d; };
const linkFile = (p) => path.join(chatDir(p), "_phien.link");
function readLink(p) { try { return JSON.parse(fs.readFileSync(linkFile(p), "utf8")); } catch { return null; } }
// Phiên Claude hiện tại của dự án, đọc từ chính tệp của Claude nên thấy cả tin nhắn gửi từ Claude.
function projectSession(p) {
  const link = readLink(p), f = link && claudeFile(link.id);
  if (!f) return {};
  return { ...readClaudeSession(link.id), chat: link.chat, at: fs.statSync(f).mtimeMs, lenh: `cd "${link.cwd}"; & "${findClaude() || "claude"}" --resume ${link.id}` };
}
const chatFile = (p, id) => path.join(chatDir(p), `${path.basename(String(id))}.json`);
function saveChatStart(p, job, chatId, text, body) {
  let chat = null;
  try { if (chatId) chat = JSON.parse(fs.readFileSync(chatFile(p, chatId), "utf8")); } catch { chat = null; }
  chat ||= { id: `${Date.now()}`, title: String(text || "").slice(0, 70), lines: [] };
  chat.lines.push({ kind: "me", text: String(text || "") });
  chat.at = Date.now();
  if (body.sessionCwd) chat.cwd = body.sessionCwd;
  job.chat = chat;
  fs.writeFileSync(chatFile(p, chat.id), JSON.stringify(chat));
}
function saveChatEnd(p, job) {
  if (!job.chat || job.chatSaved) return;
  job.chatSaved = true;
  job.chat.lines.push(...job.lines);
  job.chat.session = job.sessionId || job.chat.session;
  if (job.sessionId) fs.writeFileSync(linkFile(p), JSON.stringify({ id: job.sessionId, cwd: job.sessionCwd, chat: job.chat.id }));
  job.chat.at = Date.now();
  fs.writeFileSync(chatFile(p, job.chat.id), JSON.stringify(job.chat));
}
function listChats(p) {
  return fs.readdirSync(chatDir(p)).filter((f) => f.endsWith(".json")).map((f) => { try { const c = JSON.parse(fs.readFileSync(path.join(chatDir(p), f), "utf8")); return { id: c.id, title: c.title, at: c.at, n: c.lines.length }; } catch { return null; } }).filter(Boolean).sort((a, b) => b.at - a.at);
}

// ---- Phiên Claude Code có sẵn trên máy, để đọc và làm tiếp ngay trong Studio ----
const CLAUDE_PROJECTS = path.join(os.homedir(), ".claude", "projects");
function claudeTextOf(ev) {
  const c = ev.message?.content;
  const t = typeof c === "string" ? c : Array.isArray(c) ? c.filter((b) => b.type === "text").map((b) => b.text).join("\n") : "";
  return t.trim();
}
function claudeSessions() {
  const out = [];
  if (!fs.existsSync(CLAUDE_PROJECTS)) return out;
  for (const d of fs.readdirSync(CLAUDE_PROJECTS)) {
    const dir = path.join(CLAUDE_PROJECTS, d);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".jsonl"))) out.push({ id: f.slice(0, -6), file: path.join(dir, f), at: fs.statSync(path.join(dir, f)).mtimeMs });
  }
  return out.sort((a, b) => b.at - a.at).slice(0, 40).map((x) => {
    const fd = fs.openSync(x.file, "r"), buf = Buffer.alloc(300000), n = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    let title = "", cwd = "";
    for (const l of buf.subarray(0, n).toString("utf8").split("\n")) {
      try {
        const ev = JSON.parse(l);
        cwd ||= ev.cwd || "";
        if (!title && ev.type === "user") { const t = claudeTextOf(ev); if (t && !/^(<|This session is being continued|Base directory for this skill)/.test(t)) title = t.slice(0, 70); }
        if (title && cwd) break;
      } catch { /* dòng bị cắt */ }
    }
    return { id: x.id, at: x.at, title: title || "(không có tiêu đề)", cwd };
  }).filter((x) => !x.title.startsWith("Bạn là AI dựng video")).slice(0, 15); // bỏ phiên do chính Studio tạo
}
function claudeFile(id) {
  if (!/^[\w-]+$/.test(id) || !fs.existsSync(CLAUDE_PROJECTS)) return null;
  for (const d of fs.readdirSync(CLAUDE_PROJECTS)) {
    const f = path.join(CLAUDE_PROJECTS, d, `${id}.jsonl`);
    if (fs.existsSync(f)) return f;
  }
  return null;
}
function readClaudeSession(id) {
  if (!/^[\w-]+$/.test(id)) throw httpError(400, "Mã phiên không hợp lệ");
  const f = claudeFile(id);
  if (f) {
    const lines = [];
    let cwd = "";
    for (const l of fs.readFileSync(f, "utf8").split("\n")) {
      try {
        const ev = JSON.parse(l);
        cwd = ev.cwd || cwd;
        if (ev.type !== "user" && ev.type !== "assistant") continue;
        let t = claudeTextOf(ev);
        // Tin gửi từ Studio có kèm hướng dẫn: chỉ hiện đúng lời của Dũng.
        t = /Yêu cầu của Dũng: «([\s\S]*?)»\nLuật bắt buộc:/.exec(t)?.[1] || t;
        if (t && !t.startsWith("<")) lines.push({ kind: ev.type === "user" ? "me" : "ai", text: t.slice(0, 4000) });
      } catch { /* bỏ dòng hỏng */ }
    }
    return { id, cwd, lines: lines.slice(-40) };
  }
  throw httpError(404, "Không tìm thấy phiên này");
}

// ---- Micro tại máy: ghi bằng FFmpeg, chuyển thành chữ bằng Whisper, không qua trình duyệt ----
const HERE_PY = () => { const v = path.join(WORKSPACE, "venv", "Scripts", "python.exe"); return fs.existsSync(v) ? v : "python"; };
let micInfo = null, micJob = null;
function micStatus() {
  if (micInfo) return micInfo;
  const list = spawnSync("ffmpeg", ["-hide_banner", "-list_devices", "true", "-f", "dshow", "-i", "dummy"], { encoding: "utf8", windowsHide: true });
  const names = [...String(list.stderr || "").matchAll(/"([^"]+)" \(audio\)/g)].map((m) => m[1]);
  const device = readPaths().mic || names[0] || null;
  const whisper = spawnSync(HERE_PY(), ["-c", "import faster_whisper"], { stdio: "ignore", windowsHide: true }).status === 0;
  micInfo = { ok: !!device && whisper, device, devices: names, whisper };
  return micInfo;
}
function micStart() {
  if (micJob) throw httpError(409, "Micro đang ghi âm");
  const info = micStatus();
  if (!info.device) throw httpError(404, "Không tìm thấy micro trên máy");
  const dir = path.join(DATA, "mic");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `${Date.now()}.wav`);
  const child = spawn("ffmpeg", ["-y", "-v", "error", "-f", "dshow", "-i", `audio=${info.device}`, "-ac", "1", "-ar", "16000", out], { stdio: ["pipe", "ignore", "pipe"], windowsHide: true });
  const job = { child, out, err: "", ended: false };
  child.stderr.on("data", (d) => { job.err = (job.err + d).slice(-500); });
  child.on("exit", () => { job.ended = true; });
  micJob = job;
  return { ok: true, device: info.device };
}
function micStop(hint) {
  const job = micJob;
  if (!job) throw httpError(409, "Micro chưa bật");
  micJob = null;
  return new Promise((ok, fail) => {
    const after = () => {
      if (!fs.existsSync(job.out) || fs.statSync(job.out).size < 2000) return fail(httpError(500, job.err.trim() || "Không ghi được âm thanh từ micro"));
      const py = spawn(HERE_PY(), [path.join(HERE, "lib", "nghe.py"), job.out, hint || ""], { windowsHide: true, env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
      let text = "", err = "";
      py.stdout.on("data", (d) => { text += d; });
      py.stderr.on("data", (d) => { err = (err + d).slice(-500); });
      py.on("error", (e) => fail(httpError(500, e.message)));
      py.on("exit", (c) => {
        fs.rmSync(job.out, { force: true });
        if (c === 0) ok({ text: text.trim() }); else fail(httpError(500, err.trim().split("\n").pop() || "Không chuyển được giọng nói thành chữ"));
      });
    };
    if (job.ended) return after();
    const stopKill = setTimeout(() => { try { job.child.kill(); } catch { /* đã tắt */ } }, 3000);
    job.child.on("exit", () => { clearTimeout(stopKill); after(); });
    job.child.stdin.write("q");
  });
}

const publicAi = (j) => j && { status: j.status, project: j.project, text: j.text, lines: j.lines, images: j.images.map((x) => x.file), sessionId: j.sessionId, chatId: j.chat?.id, changed: !!j.changed, startedAt: j.startedAt, finishedAt: j.finishedAt };

// ---- Xuất video: đúng lệnh bước 7 của /dung-video, mỗi lúc chỉ 1 lần ----
let renderJob = null;

// Tính kích thước đích từ tùy chọn xuất; trả null nếu giữ nguyên bản gốc.
function outputSize(comp, { aspect = "goc", short = "goc", width, height }) {
  const even = (n) => Math.max(2, Math.round(n / 2) * 2);
  if (width && height) {
    if (+width < 16 || +height < 16 || +width > 7680 || +height > 7680) throw httpError(400, "Độ phân giải tùy chỉnh phải từ 16 đến 7680");
    return { w: even(+width), h: even(+height) };
  }
  if (aspect === "goc" && short === "goc") return null;
  let ratio = comp.width / comp.height;
  if (aspect !== "goc") {
    const m = /^(\d+):(\d+)$/.exec(aspect);
    if (!m) throw httpError(400, "Khung hình không hợp lệ");
    ratio = +m[1] / +m[2];
  }
  const side = short === "goc" ? Math.min(comp.width, comp.height) : +short;
  if (!side) throw httpError(400, "Độ phân giải không hợp lệ");
  return ratio >= 1 ? { w: even(side * ratio), h: even(side) } : { w: even(side), h: even(side / ratio) };
}

function reframeFilter({ w, h }, fit) {
  const over = `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`;
  const under = `scale=${w}:${h}:force_original_aspect_ratio=decrease`;
  if (fit === "cat") return over;
  if (fit === "den") return `${under},pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`;
  return `split[a][b];[a]${over},boxblur=30:2[nen];[b]${under}[hinh];[nen][hinh]overlay=(W-w)/2:(H-h)/2`;
}

function startRender(p, { fps = 60, quality = "delivery", gpu = true, aspect, short, width, height, fit = "mo" }) {
  if (renderJob?.status === "dang_chay") throw httpError(409, "Đang có một video được xuất. Chờ xong hoặc dừng nó trước.");
  const draft = quality === "draft";
  const finalDir = path.join(p.root, draft ? "preview" : "final");
  fs.mkdirSync(finalDir, { recursive: true });
  const comp = parse(fs.readFileSync(p.file, "utf8"));
  const size = outputSize(comp, { aspect, short, width, height });
  const suffix = size ? `_${size.w}x${size.h}` : "";
  const output = path.join(finalDir, draft ? `${p.name}_nhap${suffix}.mp4` : `${p.name}${suffix}.mp4`);
  if (gpu && !hasNvenc()) gpu = false;
  const rendered = size ? output.replace(/\.mp4$/, ".__goc.mp4") : output;
  const args = ["render", "--quality", String(quality), "--fps", String(+fps), "-o", rendered];
  if (gpu) args.push("--gpu");
  const [cmd, full] = hfCommand(args);
  const child = spawn(cmd, full, { cwd: p.hf, windowsHide: true, shell: cmd === "npx" });
  const job = { status: "dang_chay", percent: 0, stage: "Đang chuẩn bị", output, project: p.name, gpu, startedAt: Date.now(), log: "", child };
  const onData = (buf) => {
    const s = buf.toString();
    job.log = (job.log + s).slice(-4000);
    const m = [...s.matchAll(/(\d{1,3})%/g)].pop();
    if (m) job.percent = Math.min(100, +m[1]);
  };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);
  const finish = (ok) => {
    job.status = ok && fs.existsSync(output) ? "xong" : "loi";
    if (job.status === "xong") job.percent = 100;
    job.finishedAt = Date.now();
    if (size) fs.rmSync(rendered, { force: true });
  };
  child.on("exit", (code) => {
    if (job.status !== "dang_chay") { if (size) fs.rmSync(rendered, { force: true }); return; }
    if (code !== 0 || !size) return finish(code === 0);
    // Đổi khung hình/độ phân giải sau khi render xong bản gốc.
    job.percent = 99;
    const enc = gpu ? ["-c:v", "h264_nvenc", "-preset", "p6", "-cq", "17"] : ["-c:v", "libx264", "-crf", "16"];
    const ff = spawn("ffmpeg", ["-y", "-v", "error", "-i", rendered, "-filter_complex", reframeFilter(size, fit), ...enc, "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", output], { windowsHide: true });
    job.child = ff;
    ff.stderr.on("data", (b) => { job.log = (job.log + b).slice(-4000); });
    ff.on("exit", (c) => { if (job.status === "dang_chay") finish(c === 0); else fs.rmSync(rendered, { force: true }); });
  });
  renderJob = job;
  return publicJob(job);
}

const publicJob = (j) => j && { status: j.status, percent: j.percent, output: j.output, project: j.project, gpu: j.gpu, startedAt: j.startedAt, finishedAt: j.finishedAt, log: j.status === "loi" ? j.log.slice(-800) : undefined };

// ---- HTTP ----
function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(body);
}

// Nền giao diện: giữ nguyên tệp gốc, không nén lại. Tối đa 4K (3840×2160, dọc hoặc ngang), video tối đa 60 khung/giây.
const NEN = path.join(DATA, "nen");
const NEN_ANH = [".jpg", ".jpeg", ".png", ".webp"], NEN_VIDEO = [".mp4", ".m4v", ".webm", ".mov"];
function probeNen(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,avg_frame_rate", "-of", "json", file], { encoding: "utf8" });
  const st = JSON.parse(r.stdout || "{}").streams?.[0];
  if (!st?.width) throw httpError(400, "Không đọc được tệp này");
  const [a, b] = String(st.avg_frame_rate || "0/1").split("/").map(Number);
  return { width: st.width, height: st.height, fps: b ? a / b : 0 };
}
function saveNen(req, ten) {
  const ext = path.extname(ten || "").toLowerCase();
  const kind = NEN_ANH.includes(ext) ? "image" : NEN_VIDEO.includes(ext) ? "video" : null;
  if (!kind) throw httpError(400, "Chỉ nhận ảnh JPG, PNG, WEBP hoặc video MP4, M4V, WEBM, MOV");
  fs.mkdirSync(NEN, { recursive: true });
  const name = `nen-${Date.now()}${ext}`, file = path.join(NEN, name), tmp = `${file}.tmp`;
  return new Promise((ok, fail) => {
    const out = fs.createWriteStream(tmp);
    const bad = (e) => { out.destroy(); fs.rmSync(tmp, { force: true }); fail(e); };
    req.on("error", bad);
    out.on("error", bad);
    out.on("finish", () => {
      try {
        const info = probeNen(tmp);
        if (Math.max(info.width, info.height) > 3840 || Math.min(info.width, info.height) > 2160) throw httpError(400, `Tệp ${info.width}×${info.height} vượt quá 4K (3840×2160)`);
        if (kind === "video" && info.fps > 60.5) throw httpError(400, `Video ${info.fps.toFixed(0)} khung/giây vượt quá 60`);
        fs.renameSync(tmp, file);
        ok({ url: `/vn/nen-tep?ten=${name}`, kind, ...info });
      } catch (e) { fs.rmSync(tmp, { force: true }); fail(e); }
    });
    req.pipe(out);
  });
}
function clearNen(keep) {
  if (!fs.existsSync(NEN)) return;
  for (const f of fs.readdirSync(NEN)) if (f !== keep) fs.rmSync(path.join(NEN, f), { force: true });
}

function sendFile(req, res, file) {
  const stat = fs.statSync(file);
  const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
  if (range) {
    const start = +range[1] || 0, end = range[2] ? +range[2] : stat.size - 1;
    res.writeHead(206, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": stat.size, "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(res);
}

const readBody = (req, limit = 4e9) => new Promise((ok, fail) => {
  const parts = [];
  let n = 0;
  req.on("data", (c) => { n += c.length; if (n > limit) { fail(httpError(413, "Tệp quá lớn")); req.destroy(); } else parts.push(c); });
  req.on("end", () => ok(Buffer.concat(parts)));
  req.on("error", fail);
});
const readJson = async (req) => JSON.parse((await readBody(req, 5e7)).toString() || "{}");

function proxy(req, res) {
  const up = http.request({ host: "127.0.0.1", port: BACKEND_PORT, path: req.url, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${BACKEND_PORT}` } }, (r) => {
    res.writeHead(r.statusCode, r.headers);
    r.pipe(res);
  });
  up.on("error", () => { if (!res.headersSent) res.writeHead(502); res.end(); });
  req.pipe(up);
}

async function route(req, res, url) {
  const q = url.searchParams, m = req.method;
  const seg = url.pathname.slice("/vn/".length);

  if (m !== "GET" && req.headers.origin && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.origin)) throw httpError(403, "Chỉ nhận thao tác từ máy này");

  if (seg === "projects" && m === "GET") return send(res, 200, { projects: listProjects(), current: current?.name ?? null });

  if (seg === "render" && m === "GET") return send(res, 200, { job: publicJob(renderJob) });
  if (seg === "ai" && m === "GET") { checkBridge(); return send(res, 200, { job: publicAi(aiJob) }); }
  if (seg === "cau-noi" && m === "GET") { checkBridge(); return send(res, 200, { noi: bridgeAlive() }); }
  if (seg === "ai-tra-loi" && m === "POST") { bridgeReply((await readJson(req)).text); return send(res, 200, { ok: true }); }
  if (seg === "ai/stop" && m === "POST") {
    if (aiJob?.status === "dang_chay") { aiJob.status = "da_dung"; if (aiJob.child) killTree(aiJob.child); else if (aiJob.bridge) saveChatEnd(aiJob.p, aiJob); aiJob.lines.push({ kind: "err", text: "Đã dừng" }); }
    return send(res, 200, { job: publicAi(aiJob) });
  }
  if (seg === "render/cancel" && m === "POST") {
    if (renderJob?.status === "dang_chay") { renderJob.status = "da_dung"; killTree(renderJob.child); }
    return send(res, 200, { job: publicJob(renderJob) });
  }

  if (seg === "mau-chu" && m === "GET") return send(res, 200, { presets: readPresets() });
  if (seg === "mau-chu" && m === "POST") {
    const b = await readJson(req);
    let list = readPresets();
    if (b.remove) list = list.filter((x) => x.name !== b.remove);
    else {
      if (!String(b.name || "").trim()) throw httpError(400, "Hãy đặt tên mẫu");
      list = [{ name: b.name.trim(), style: b.style || {}, luc: new Date().toISOString() }, ...list.filter((x) => x.name !== b.name.trim())];
    }
    return send(res, 200, { presets: writePresets(list) });
  }
  if (seg === "yeu-thich" && m === "GET") return send(res, 200, readFav());
  if (seg === "yeu-thich" && m === "POST") return send(res, 200, toggleFav(await readJson(req)));
  if (seg === "templates" && m === "GET") return send(res, 200, { templates: listTemplates(), chon: fs.existsSync(TEMPLATE_PICK) ? JSON.parse(fs.readFileSync(TEMPLATE_PICK, "utf8")) : null, co_thu_muc_drive: fs.existsSync(DRIVE_FOLDER) });
  if (seg === "template-anh" && m === "GET") {
    const t = listTemplates().find((x) => x.ma === q.get("ma"));
    const img = t && path.join(TEMPLATES, t.thu_muc, "contact.jpg");
    if (!img || !fs.existsSync(img)) throw httpError(404, "Không có ảnh mẫu");
    return sendFile(req, res, img);
  }
  if (seg === "template-video" && m === "GET") {
    const file = localTemplateVideo(q.get("ma"));
    if (!file) throw httpError(404, "Máy chưa có video mẫu này");
    return sendFile(req, res, file);
  }
  if (seg === "drive-sync" && m === "POST") {
    // Không gửi link thì đọc lại thư mục đã lưu.
    const saved = fs.existsSync(DRIVE_FOLDER) ? JSON.parse(fs.readFileSync(DRIVE_FOLDER, "utf8")).url : null;
    return send(res, 200, { found: await syncDrive((await readJson(req)).url || saved) });
  }
  if (seg === "template-chon" && m === "POST") {
    const { ma } = await readJson(req);
    if (!ma) { fs.rmSync(TEMPLATE_PICK, { force: true }); return send(res, 200, { chon: null }); }
    const t = listTemplates().find((x) => x.ma === ma);
    if (!t) throw httpError(404, "Không có template này");
    const chon = { ma: t.ma, ten: t.ten, thu_muc: t.thu_muc, chon_luc: new Date().toISOString() };
    fs.writeFileSync(TEMPLATE_PICK, JSON.stringify(chon, null, 2));
    return send(res, 200, { chon });
  }
  // Giao diện lưu trên máy, không phụ thuộc cổng hay trình duyệt.
  if (seg === "mic" && m === "GET") return send(res, 200, micStatus());
  if (seg === "mic/start" && m === "POST") return send(res, 200, micStart());
  if (seg === "mic/stop" && m === "POST") return send(res, 200, await micStop((await readJson(req)).hint));
  if (seg === "phien-claude" && m === "GET") return send(res, 200, { items: claudeSessions() });
  if (seg === "phien-claude-doc" && m === "GET") return send(res, 200, readClaudeSession(q.get("id") || ""));
  if (seg === "duong-dan") {
    if (m === "GET") return send(res, 200, { saved: readPaths(), dang_dung: { sfx: SFX_ROOT, fonts: FONTS, templateVideos: TEMPLATE_VIDEOS, lutZip: LUT_ZIP, fontZip: FONT_ZIP } });
    const b = await readJson(req);
    fs.mkdirSync(DATA, { recursive: true });
    fs.writeFileSync(PATHS_FILE, JSON.stringify(Object.fromEntries(Object.entries(b).filter(([, v]) => typeof v === "string" && v.trim()))));
    return send(res, 200, { ok: true });
  }
  if (seg === "giao-dien") {
    const f = path.join(DATA, "giao-dien.json");
    if (m === "GET") return send(res, 200, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {});
    const ui = await readJson(req);
    fs.mkdirSync(DATA, { recursive: true });
    fs.writeFileSync(f + ".tmp", JSON.stringify(ui));
    fs.renameSync(f + ".tmp", f);
    return send(res, 200, { ok: true });
  }
  if (seg === "nen" && m === "POST") return send(res, 200, await saveNen(req, q.get("ten")));
  if (seg === "nen" && m === "DELETE") { clearNen(q.get("giu")); return send(res, 200, { ok: true }); }
  if (seg === "nen-tep" && m === "GET") {
    const file = path.join(NEN, path.basename(q.get("ten") || ""));
    if (!fs.existsSync(file)) throw httpError(404, "Không có tệp nền");
    return sendFile(req, res, file);
  }
  if (seg === "bo-cuc" && m === "POST") {
    const ext = /\.(png|jpe?g|webp)$/i.exec(q.get("ten") || "")?.[0] || ".png";
    return send(res, 200, { layout: await layoutFromImage(await readBody(req, 2e7), ext) });
  }
  if (seg === "capcut-list" && m === "GET") return send(res, 200, { items: loadCapcut() });
  if (seg === "lut-list" && m === "GET") return send(res, 200, { luts: loadLuts() });
  if (seg === "mg-list" && m === "GET") return send(res, 200, { items: loadMg() });
  if (seg === "mg-video" && m === "GET") return sendFile(req, res, (await mgVideo(q.get("ma"), q.get("ban"))).file);
  if (seg === "font-list" && m === "GET") return send(res, 200, { fonts: loadFontList() });
  if (seg === "font-file" && m === "GET") { res.setHeader("Cache-Control", "max-age=86400"); return sendFile(req, res, await fontPath(q.get("id"))); }
  if (seg === "sfx-list" && m === "GET") return send(res, 200, loadSfx());
  if (seg === "sfx-file" && m === "GET") return sendFile(req, res, sfxPlayable(q.get("path")));

  const name = q.get("du-an");
  if (!name) throw httpError(400, "Thiếu tên dự án");
  // Chỉ mở dự án hoặc xuất video mới được đổi dự án đang chạy; tab cũ còn mở không được giành lại.
  const mayOpen = seg === "model" || (seg === "render" && m === "POST");
  if (!mayOpen && current?.name !== name) throw httpError(409, "Dự án này đã đóng vì bạn vừa mở dự án khác. Hãy tải lại trang.");
  const p = await openProject(name);

  if (seg === "model" && m === "GET") {
    const html = fs.readFileSync(p.file, "utf8");
    return send(res, 200, { project: p.name, projectId: p.projectId, mtime: fs.statSync(p.file).mtimeMs, canUndo: p.history.undo.length > 0, canRedo: p.history.redo.length > 0, ...parse(html) });
  }
  if (seg === "mtime" && m === "GET") return send(res, 200, { mtime: fs.statSync(p.file).mtimeMs });
  if (seg === "capcut-nhan-dan" && m === "POST") return send(res, 200, await capcutSticker(p, (await readJson(req)).id));
  if (seg === "ai-tep" && m === "POST") return send(res, 200, saveAiFile(p, path.basename(q.get("ten") || "anh.png"), await readBody(req, 5e8)));
  if (seg === "phien" && m === "GET") return send(res, 200, projectSession(p));
  if (seg === "phien-moi" && m === "POST") { fs.rmSync(linkFile(p), { force: true }); return send(res, 200, { ok: true }); }
  if (seg === "chat-list" && m === "GET") return send(res, 200, { items: listChats(p) });
  if (seg === "chat-doc" && m === "GET") return send(res, 200, JSON.parse(fs.readFileSync(chatFile(p, q.get("id")), "utf8")));
  if (seg === "clip-buoc" && m === "GET") { const c = clipSteps(p, q.get("id")); return send(res, 200, { undo: c.undo, redo: c.redo }); }
  if (seg === "clip-buoc" && m === "POST") { const b = await readJson(req); return send(res, 200, await clipStep(p, b.id, b.dir)); }
  if (seg === "lich-su" && m === "GET") return send(res, 200, { items: readHist(p).reverse().map((e) => ({ ...e, co_ban: e.loai !== "sua" || fs.existsSync(path.join(histDir(p), `${e.id}.html`)) })) });
  if (seg === "khoi-phuc" && m === "POST") return send(res, 200, await restoreHist(p, (await readJson(req)).id));
  if (seg === "xoa-tep" && m === "POST") {
    const b = await readJson(req);
    if (fs.readFileSync(p.file, "utf8").includes(b.path)) throw httpError(409, "Tệp này đang dùng trên timeline, hãy xóa clip trước");
    const trash = trashAsset(p, b.path);
    addHist(p, { loai: "xoa_file", mo_ta: `Xóa tệp ${path.basename(b.path)}`, path: b.path, trash });
    return send(res, 200, { ok: true });
  }
  if (seg.startsWith("op/") && m === "POST") {
    const r = await mutate(p, seg.slice(3), await readJson(req));
    return send(res, 200, r);
  }
  if (seg === "undo" && m === "POST") return send(res, 200, (await stepHistory(p, p.history.undo, p.history.redo, "hoan_tac")) || { changed: false });
  if (seg === "redo" && m === "POST") return send(res, 200, (await stepHistory(p, p.history.redo, p.history.undo, "lam_lai")) || { changed: false });

  if (seg === "code" && m === "GET") return send(res, 200, { content: fs.readFileSync(p.file, "utf8") });
  if (seg === "code" && m === "POST") {
    const { content } = await readJson(req);
    parse(content);
    snapshot(p.history, fs.readFileSync(p.file, "utf8"));
    p.history.redo.length = 0;
    await writeProject(p, content);
    logEdit(p, { thao_tac: "sua_ma" });
    addHist(p, { loai: "sua", mo_ta: "Sửa mã" });
    return send(res, 200, { changed: true });
  }

  if (seg === "assets" && m === "GET") {
    const files = walk(path.join(p.hf, "assets"), p.hf).map((f) => ({ ...f, kind: assetKind(f.path) })).filter((f) => f.kind !== "other" && f.kind !== "font");
    return send(res, 200, { files });
  }
  if (seg === "upload" && m === "POST") {
    const file = path.basename(q.get("ten") || "").replace(/[^\p{L}\p{N}._ -]/gu, "_");
    const kind = assetKind(file);
    if (!file || kind === "other") throw httpError(400, "Chỉ nhận video, âm thanh, ảnh hoặc font");
    const dir = path.join(p.hf, "assets", { video: "video", audio: "audio", image: "image", font: "fonts" }[kind]);
    fs.mkdirSync(dir, { recursive: true });
    // Trùng tên thì đặt tên mới, không ghi đè tệp đang dùng trong video.
    const ext = path.extname(file), stem = file.slice(0, file.length - ext.length);
    let name = file;
    for (let n = 2; fs.existsSync(path.join(dir, name)); n++) name = `${stem}-${n}${ext}`;
    fs.writeFileSync(path.join(dir, name), await readBody(req));
    addHist(p, { loai: "them_file", mo_ta: `Thêm tệp ${name}`, path: `assets/${path.basename(dir)}/${name}` });
    return send(res, 200, { path: `assets/${path.basename(dir)}/${name}`, kind });
  }
  if (seg === "add-asset" && m === "POST") {
    const b = await readJson(req);
    const kind = assetKind(b.path);
    const duration = kind === "image" ? 3 : probeDuration(inside(p.hf, b.path));
    return send(res, 200, await mutate(p, "add", { kind, src: b.path, time: b.time, duration, newId: path.basename(b.path).replace(/\.[^.]+$/, "") }));
  }
  if (seg === "thumb" && m === "GET") {
    const out = thumbnail(p, q.get("path"), +q.get("t") || 0);
    if (!out) throw httpError(404, "Không tạo được ảnh nhỏ");
    res.setHeader("Cache-Control", "max-age=86400");
    return sendFile(req, res, out);
  }

  if (seg === "use-font" && m === "POST") {
    const { font, clips, segs = [], field = "fontFamily" } = await readJson(req);
    if (!["fontFamily", "accentFont"].includes(field)) throw httpError(400, "Kiểu áp font không hợp lệ");
    if (!font) throw httpError(400, "Chưa chọn font");
    const src = await fontPath(font);
    const file = path.basename(src);
    const family = file.replace(/\.[^.]+$/, "").replace(/["\\]/g, "");
    const dir = path.join(p.hf, "assets", "fonts");
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(src, path.join(dir, file));
    await mutate(p, "batch", { items: [
      { op: "addFont", body: { family, url: `assets/fonts/${file}` } },
      ...clips.map((id) => ({ op: "style", body: { id, set: { [field]: family } } })),
      ...segs.map(({ id, index }) => ({ op: "segStyle", body: { id, index, set: { [field]: family } } })),
    ] });
    return send(res, 200, { family });
  }
  if (seg === "sfx-add" && m === "POST") {
    const b = await readJson(req);
    const x = sfxToProject(p, b.path);
    if (b.replaceId) return send(res, 200, await mutate(p, "replaceSfx", { id: b.replaceId, src: x.src, duration: x.duration, peak: x.peak, volume: x.volume }));
    // Đỉnh âm rơi đúng đầu phát.
    const time = Math.max(0, b.time - x.peak);
    return send(res, 200, await mutate(p, "add", { kind: "sfx", src: x.src, time, duration: x.duration, peak: x.peak, volume: x.volume, newId: "sfx_" + x.base.replace(/\.[^.]+$/, "") }));
  }

  if (seg === "renders" && m === "GET") {
    const files = [];
    for (const folder of ["final", "preview"]) {
      const dir = path.join(p.root, folder);
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir)) {
        if (!/\.(mp4|mov|webm)$/i.test(f)) continue;
        const st = fs.statSync(path.join(dir, f));
        files.push({ name: f, folder, size: st.size, mtime: st.mtimeMs });
      }
    }
    return send(res, 200, { files: files.sort((a, b) => b.mtime - a.mtime) });
  }
  if (seg === "final" && m === "GET") {
    const folder = q.get("thu-muc") === "preview" ? "preview" : "final";
    return sendFile(req, res, inside(path.join(p.root, folder), path.basename(q.get("ten"))));
  }
  if (seg === "notes") {
    const f = path.join(p.root, "studio_ghi_chu.json");
    const read = () => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : []);
    if (m === "GET") return send(res, 200, { notes: read() });
    const b = await readJson(req);
    let notes = read();
    if (b.remove) notes = notes.filter((n) => n.id !== b.remove);
    else notes.push({ id: crypto.randomBytes(4).toString("hex"), luc_video: b.time, phan_tu: b.clip || null, noi_dung: b.text, tao_luc: new Date().toISOString() });
    fs.writeFileSync(f, JSON.stringify(notes.sort((x, y) => x.luc_video - y.luc_video), null, 2));
    return send(res, 200, { notes });
  }
  if (seg === "open-folder" && m === "POST") {
    spawn("explorer", [path.join(p.root, "final")], { detached: true, stdio: "ignore" }).unref();
    return send(res, 200, {});
  }
  if (seg === "render" && m === "POST") return send(res, 200, { job: startRender(p, await readJson(req)) });
  if (seg === "ai" && m === "POST") {
    const b = await readJson(req);
    if (!String(b.text || "").trim() && !b.mg && !b.capcut) throw httpError(400, "Hãy nhập yêu cầu");
    return send(res, 200, { job: startAi(p, b) });
  }
  if (seg === "use-lut" && m === "POST") return send(res, 200, { src: useLut(p, (await readJson(req)).key) });
  if (seg === "ai-anh" && m === "GET") {
    const rel = String(q.get("f") || "");
    if (!rel.startsWith("work/studio_ai/")) throw httpError(400, "Đường dẫn không hợp lệ");
    return sendFile(req, res, inside(p.root, rel));
  }
  if (seg === "ai-prompt" && m === "POST") return send(res, 200, { prompt: aiPrompt(p, await readJson(req)) });

  throw httpError(404, "Không có đường dẫn này");
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname.startsWith("/vn/")) return await route(req, res, url);
    if (url.pathname.startsWith("/api/")) return proxy(req, res);
    if (url.pathname === "/lib/html.mjs") return sendFile(req, res, path.join(HERE, "lib", "html.mjs"));
    const rel = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const file = inside(path.join(HERE, "public"), rel);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return sendFile(req, res, file);
    send(res, 404, { error: "Không tìm thấy" });
  } catch (e) {
    if (!res.headersSent) send(res, e.status || 500, { error: e.message });
    else res.end();
  }
});

const shutdown = () => { if (aiJob?.status === "dang_chay") killTree(aiJob.child); if (current) killTree(current.backend); if (renderJob?.status === "dang_chay") killTree(renderJob.child); process.exit(0); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.listen(PORT, "127.0.0.1", () => {
  console.log(`HD Studio: http://localhost:${PORT}`);
  setTimeout(() => { try { loadFontList(); } catch { /* lần mở bộ chọn font sẽ thử lại */ } }, 200);
});
