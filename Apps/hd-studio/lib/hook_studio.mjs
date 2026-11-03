// Hook UserPromptSubmit: chỉ khi người dùng gọi lệnh dựng video mà Studio đang mở và phiên chưa nghe, nhắc phiên bật kết nối.
// Tin nhắn khác, Studio tắt hoặc phiên đã nối thì không in gì, không tốn thêm token.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
let input = {};
try { input = JSON.parse(fs.readFileSync(0, "utf8")); } catch { /* không có đầu vào */ }
const id = String(input.session_id || "").replace(/[^\w-]/g, "");
// Phiên do chính Studio tạo để chạy AI thì không nối.
if (!id || String(input.prompt || "").startsWith("Bạn là AI dựng video")) process.exit(0);
// Chỉ lệnh dựng video mới nối; không dò từ khóa vì câu thường cũng có thể nhắc "dựng video".
if (!/^\s*\/(video|dung-video|dung-studio)(\s|$)/i.test(String(input.prompt || ""))) process.exit(0);

const beat = path.join(HERE, "..", ".du-lieu", "cau-noi", "phien", `${id}.json`);
try { if (Date.now() - fs.statSync(beat).mtimeMs < 15000) process.exit(0); } catch { /* chưa nghe */ }

let open = false;
for (const port of [4700, 4702, 4704]) {
  try { if ((await fetch(`http://127.0.0.1:${port}/vn/projects`, { signal: AbortSignal.timeout(400) })).ok) { open = true; break; } } catch { /* cổng này không có Studio */ }
}
if (open) console.log("HD Studio đang mở và phiên này chưa nối. Dùng skill ket-noi-studio để bật nghe ở nền ngay, không cần hỏi lại, báo 1 dòng rồi làm tiếp yêu cầu của người dùng.");
