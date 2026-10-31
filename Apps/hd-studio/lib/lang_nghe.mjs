// Cầu nối khung AI của Studio với các phiên Claude. Mỗi phiên có hộp thư riêng, không phiên nào giành của phiên nào.
// Lắng nghe (chạy bằng công cụ Monitor của Claude Code, mỗi dòng in ra là một yêu cầu):
//   node lib/lang_nghe.mjs
// Trả lời về khung AI:
//   node lib/lang_nghe.mjs --tra-loi "đã sửa gì, ở giây nào" [--port=4700]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".du-lieu", "cau-noi", "phien");
const ID = (process.env.CLAUDE_CODE_SESSION_ID || `may-${process.pid}`).replace(/[^\w-]/g, "");
const INBOX = path.join(DIR, `${ID}.jsonl`), BEAT = path.join(DIR, `${ID}.json`);
const arg = process.argv.indexOf("--tra-loi");

if (arg >= 0) {
  // Yêu cầu có thể từ Studio ở cổng khác: trả về đúng cổng ghi trong yêu cầu mới nhất của phiên này.
  let port = process.argv.find((a) => a.startsWith("--port="))?.slice(7);
  if (!port) { try { port = JSON.parse(fs.readFileSync(INBOX, "utf8").trim().split("\n").pop()).cong; } catch { /* dùng mặc định */ } }
  const r = await fetch(`http://127.0.0.1:${port || 4700}/vn/ai-tra-loi`, { method: "POST", body: JSON.stringify({ text: process.argv[arg + 1] || "Xong.", phien: ID }) });
  console.log(r.ok ? "Đã trả lời về Studio" : `Studio báo lỗi ${r.status}: ${(await r.json()).error}`);
  process.exit(r.ok ? 0 : 1);
}

fs.mkdirSync(DIR, { recursive: true });
let pos = fs.existsSync(INBOX) ? fs.statSync(INBOX).size : 0;
let beatAt = 0;
fs.writeFileSync(BEAT, JSON.stringify({ pid: process.pid }));
console.log("STUDIO_DA_NOI Studio đã nối với phiên này");
setInterval(() => {
  // Phiên mở lại lắng nghe thì tiến trình cũ của chính phiên đó tự dừng.
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
