// Cầu nối khung AI của Studio với phiên Claude đang mở.
// Lắng nghe (chạy bằng công cụ Monitor của Claude Code, mỗi dòng in ra là một yêu cầu):
//   node lib/lang_nghe.mjs
// Trả lời về khung AI:
//   node lib/lang_nghe.mjs --tra-loi "đã sửa gì, ở giây nào" [--port=4700]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".du-lieu", "cau-noi");
const INBOX = path.join(DIR, "hop-thu.jsonl"), BEAT = path.join(DIR, "song.json");
const arg = process.argv.indexOf("--tra-loi");

if (arg >= 0) {
  const port = process.argv.find((a) => a.startsWith("--port="))?.slice(7) || 4700;
  const r = await fetch(`http://127.0.0.1:${port}/vn/ai-tra-loi`, { method: "POST", body: JSON.stringify({ text: process.argv[arg + 1] || "Xong." }) });
  console.log(r.ok ? "Đã trả lời về Studio" : `Studio báo lỗi ${r.status}: ${(await r.json()).error}`);
  process.exit(r.ok ? 0 : 1);
}

fs.mkdirSync(DIR, { recursive: true });
let pos = fs.existsSync(INBOX) ? fs.statSync(INBOX).size : 0;
let beatAt = 0;
fs.writeFileSync(BEAT, JSON.stringify({ pid: process.pid }));
console.log("STUDIO_DA_NOI Studio đã nối với phiên này");
setInterval(() => {
  // Phiên mới lắng nghe thì phiên cũ tự dừng, tránh hai phiên cùng nhận một yêu cầu.
  try { if (JSON.parse(fs.readFileSync(BEAT, "utf8")).pid !== process.pid) process.exit(0); } catch { /* đang ghi dở */ }
  if (Date.now() - beatAt > 5000) { fs.writeFileSync(BEAT, JSON.stringify({ pid: process.pid })); beatAt = Date.now(); }
  if (!fs.existsSync(INBOX)) return;
  const size = fs.statSync(INBOX).size;
  if (size <= pos) return;
  const fd = fs.openSync(INBOX, "r"), buf = Buffer.alloc(size - pos);
  fs.readSync(fd, buf, 0, buf.length, pos);
  fs.closeSync(fd);
  pos = size;
  for (const line of buf.toString("utf8").split("\n").filter(Boolean)) console.log(`STUDIO_YEU_CAU ${line}`);
}, 700);
