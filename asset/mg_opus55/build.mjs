// Lập thư viện MG cho HD Studio từ repo yihui-dev/awesome-opus5-5-videos (MIT).
// Chạy: node build.mjs <đường dẫn data/videos.json của repo>
import fs from "node:fs";
import path from "node:path";

const HERE = import.meta.dirname;
const src = process.argv[2];
if (!src) throw new Error("Thiếu đường dẫn videos.json");
const items = JSON.parse(fs.readFileSync(src, "utf8"));

const LOAI = { motion: "Motion graphics", explainer: "Giải thích", "3d": "3D", interactive: "Tương tác / game" };
// Kiểu hiệu ứng đoán theo từ khóa trong prompt và tiêu đề.
const KIEU = [
  ["Chữ động", /typograph|kinetic|text|title|letter|word|font|文字|テキスト|タイポ/i],
  ["Số liệu, biểu đồ", /chart|graph|data|counter|number|stat|percent|infographic|グラフ|数字|图表/i],
  ["Logo, thương hiệu", /logo|brand|intro|ident|ロゴ/i],
  ["Bản đồ, địa cầu", /map|globe|earth|planet|world|地図|地球/i],
  ["Chuyển cảnh", /transition|wipe|morph|reveal|切り替/i],
  ["Hạt, ánh sáng", /particle|glow|light|neon|spark|firework|粒子|光/i],
  ["Giao diện, sản phẩm", /\bui\b|interface|app|dashboard|website|product|phone|screen|画面/i],
  ["Nhạc, nhịp", /music|beat|audio|sound|rhythm|音楽|BGM/i],
  ["Thiên nhiên, cảnh", /ocean|water|cloud|forest|mountain|sky|volcano|sun|weather|海|空/i],
];

async function head(url) {
  try { return (await fetch(url, { method: "HEAD" })).ok; } catch { return false; }
}

const out = [];
const queue = [...items];
async function worker() {
  for (let x; (x = queue.shift()); ) {
    const base = `https://media.skillry.dev/opus-5-5/${x.slug}`;
    const [goc, lam_lai] = await Promise.all([head(`${base}/original.mp4`), head(`${base}/remake.mp4`)]);
    const text = `${x.title || ""} ${x.prompt}`;
    out.push({
      ma: x.slug, ten: x.title || null, tac_gia: x.author, bai_goc: x.post_url, skillry: x.skillry_url,
      loai: LOAI[x.category] || x.category, cong_nghe: x.tech_tags, kieu: KIEU.filter(([, re]) => re.test(text)).map(([k]) => k),
      prompt: x.prompt, prompt_thieu: x.prompt_partial, anh: x.poster_url,
      video: goc ? `${base}/original.mp4` : null, video_lam_lai: lam_lai ? `${base}/remake.mp4` : null, them_ngay: x.added,
    });
    if (out.length % 100 === 0) console.log(`đã dò ${out.length}/${items.length}`);
  }
}
await Promise.all(Array.from({ length: 16 }, worker));
out.sort((a, b) => String(b.them_ngay).localeCompare(String(a.them_ngay)));
fs.writeFileSync(path.join(HERE, "thu_vien.json"), JSON.stringify(out, null, 1));
const co = out.filter((x) => x.video || x.video_lam_lai).length;
console.log(`xong: ${out.length} mẫu, ${co} có video xem được`);
