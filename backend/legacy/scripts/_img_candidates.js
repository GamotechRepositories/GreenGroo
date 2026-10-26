import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, "_img_work");
const UA = "GreenGroccCatalogBot/1.0 (https://greengrocc.com; greengrocc@gmail.com)";
const TARGET = 3;
const QFILE = process.env.QFILE || "_img_queries.json";
const OUT_JSON = process.env.OUT_JSON || "candidates.json";
const PREFIX = process.env.PREFIX || "";
const EXTRA = Number(process.env.EXTRA || 2);
const queries = JSON.parse(fs.readFileSync(path.join(DIR, QFILE), "utf8"));
const BAD = /(map|logo|diagram|chart|svg|illustration|drawing|engraving|herbarium|plate|botanical|stamp|poster|advert|label|flag|icon|\b1[6-9]\d\d\b|museum|painting|sculpture|cartoon|meme|graph|x-ray|microscop|scan|book|page)/i;
const OK_LICENSE = /^(CC0|Public domain|PD|CC BY|CC-BY|No restrictions)/i;

fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(q) {
  const params = new URLSearchParams({
    action: "query", format: "json", generator: "search", gsrsearch: `${q} filetype:bitmap`, gsrnamespace: "6", gsrlimit: "20",
    prop: "imageinfo", iiprop: "url|extmetadata|size|mime", iiurlwidth: "960",
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { "User-Agent": UA } });
    if (res.ok) {
      const json = await res.json();
      return Object.values(json.query?.pages || {}).sort((a, b) => a.index - b.index);
    }
    await sleep(3000);
  }
  return [];
}

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
const products = await mongoose.connection.db.collection("GreenGroccproducts")
  .find({}, { projection: { name: 1, productImages: 1, specifications: 1 } }).toArray();
await mongoose.disconnect();

const used = new Set();
for (const p of products) for (const s of p.specifications || []) {
  if (/credit/i.test(s.name || "")) for (const m of String(s.value).matchAll(/([^;|,]+?\.(?:jpe?g|png))/gi)) used.add(m[1].trim().toLowerCase());
}

if (OUT_JSON !== "candidates.json") {
  for (const r of JSON.parse(fs.readFileSync(path.join(OUT, "candidates.json"), "utf8"))) for (const c of r.picks) used.add(c.title.toLowerCase());
}

const result = [];
for (const p of products) {
  const need = TARGET - (p.productImages || []).filter(Boolean).length;
  if (need <= 0) continue;
  const qs = queries[p.name];
  if (!qs) { if (QFILE === "_img_queries.json") console.log(`NO QUERY: ${p.name}`); continue; }
  const picks = [];
  for (const q of qs) {
    const pages = await search(q);
    for (const page of pages) {
      if (picks.length >= need + EXTRA) break;
      const ii = page.imageinfo?.[0];
      if (!ii || !/jpeg|png/.test(ii.mime)) continue;
      const title = page.title.replace(/^File:/, "");
      const lic = ii.extmetadata?.LicenseShortName?.value || "";
      if (BAD.test(title) || !OK_LICENSE.test(lic)) continue;
      if (ii.width < 600 || ii.height < 450 || ii.width / ii.height > 2.2 || ii.height / ii.width > 2.2) continue;
      if (used.has(title.toLowerCase())) continue;
      used.add(title.toLowerCase());
      picks.push({ title, license: lic, url: ii.thumburl || ii.url, query: q });
    }
    await sleep(700);
    if (picks.length >= need + EXTRA) break;
  }
  console.log(`${p.name}: need ${need}, candidates ${picks.length}`);
  result.push({ id: String(p._id), name: p.name, need, picks });
}
fs.writeFileSync(path.join(OUT, OUT_JSON), JSON.stringify(result, null, 2));

let n = 0;
for (const r of result) {
  for (const [i, c] of r.picks.entries()) {
    const file = path.join(OUT, `${PREFIX}${r.id}_${i}.jpg`);
    c.file = path.basename(file);
    if (fs.existsSync(file)) continue;
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(c.url, { headers: { "User-Agent": UA } });
      if (res.ok) { fs.writeFileSync(file, Buffer.from(await res.arrayBuffer())); n++; break; }
      await sleep(3000);
    }
    await sleep(400);
  }
}
fs.writeFileSync(path.join(OUT, OUT_JSON), JSON.stringify(result, null, 2));
console.log(`downloaded ${n}`);
