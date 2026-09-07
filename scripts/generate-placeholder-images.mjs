/*
 * Geçici ürün görselleri üretir (public/urunler/*.webp).
 *
 * Gerçek ürün fotoğrafları geldiğinde bu script'e ihtiyaç kalmaz; görseller
 * admin panelinden yüklenir. O zamana kadar vitrin ve ürün sayfası boş görünmesin
 * diye 4:5 oranında, gerçek fotoğrafla aynı ölçülerde yer tutucular üretiyoruz.
 *
 * Çalıştırma: node scripts/generate-placeholder-images.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public", "urunler");
const WIDTH = 1200;
const HEIGHT = 1500; // 4:5

/** Tişört silüeti — göğüs, kol ve yaka çizgileriyle. */
function tshirtPath() {
  return `M 300 320
          L 430 250
          Q 500 300 600 300
          Q 700 300 770 250
          L 900 320
          L 980 520
          L 860 580
          L 860 1180
          Q 600 1215 340 1180
          L 340 580
          L 220 520
          Z`;
}

function collarPath() {
  return `M 430 250 Q 500 320 600 320 Q 700 320 770 250`;
}

/**
 * @param {{ fill: string, stroke: string, bg: string, label: string, view: string }} opts
 */
function buildSvg({ fill, stroke, bg, label, view }) {
  const isBack = view === "arka";
  const isDetail = view === "detay";

  if (isDetail) {
    // Kumaş yakın çekimi: ince dokuma dokusu
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 1200 1500">
  <defs>
    <pattern id="weave" width="16" height="16" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill="${fill}"/>
      <path d="M0 8 H16 M8 0 V16" stroke="${stroke}" stroke-width="1.1" opacity="0.35"/>
    </pattern>
  </defs>
  <rect width="1200" height="1500" fill="url(#weave)"/>
  <rect x="0" y="1330" width="1200" height="170" fill="${bg}" opacity="0.94"/>
  <text x="600" y="1425" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="42" letter-spacing="6" fill="${stroke}">${label} · KUMAŞ DETAYI</text>
</svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 1200 1500">
  <rect width="1200" height="1500" fill="${bg}"/>
  <g>
    <path d="${tshirtPath()}" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
    ${isBack ? "" : `<path d="${collarPath()}" fill="none" stroke="${stroke}" stroke-width="4"/>`}
    ${isBack ? `<path d="M 430 250 Q 600 300 770 250" fill="none" stroke="${stroke}" stroke-width="4"/>` : ""}
    <path d="M 340 580 L 220 520" fill="none" stroke="${stroke}" stroke-width="3"/>
    <path d="M 860 580 L 980 520" fill="none" stroke="${stroke}" stroke-width="3"/>
  </g>
  <text x="600" y="1380" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="38" letter-spacing="8" fill="${stroke}" opacity="0.75">
    ${label} · ${view.toUpperCase()}
  </text>
</svg>`;
}

// Seed ile aynı renkler — lib/seed-data.ts içindeki COLORS ile eşleşmeli.
const COLORS = [
  { slug: "siyah", label: "SİYAH", fill: "#1a1a1a", stroke: "#5a5a5a", bg: "#efefec" },
  { slug: "beyaz", label: "BEYAZ", fill: "#fbfbfa", stroke: "#c9c9c4", bg: "#eceae5" },
  { slug: "gri", label: "GRİ", fill: "#9b9b98", stroke: "#6f6f6c", bg: "#f2f2f0" },
  { slug: "lacivert", label: "LACİVERT", fill: "#1f2a44", stroke: "#5b6480", bg: "#eef0f4" },
  { slug: "bej", label: "BEJ", fill: "#d8cbb4", stroke: "#a2947b", bg: "#f4f1ea" },
  { slug: "haki", label: "HAKİ", fill: "#4d5340", stroke: "#7e8570", bg: "#f0f1ec" },
  { slug: "antrasit", label: "ANTRASİT", fill: "#3a3d40", stroke: "#71757a", bg: "#f0f0ef" },
];

const VIEWS = ["on", "arka", "detay"];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let count = 0;
  for (const color of COLORS) {
    for (const view of VIEWS) {
      const svg = buildSvg({ ...color, view });
      const outPath = path.join(OUT_DIR, `${color.slug}-${view}.webp`);
      await sharp(Buffer.from(svg)).webp({ quality: 82 }).toFile(outPath);
      count++;
    }
  }

  // Marka bloğu için geniş bir görsel
  const brandSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <rect width="1600" height="1000" fill="#f6f6f4"/>
  <g transform="translate(200,50) scale(1)">
    <path d="${tshirtPath()}" fill="#1a1a1a" stroke="#4a4a4a" stroke-width="3" stroke-linejoin="round" transform="scale(0.6) translate(0,120)"/>
  </g>
  <g transform="translate(680,50)">
    <path d="${tshirtPath()}" fill="#fbfbfa" stroke="#c9c9c4" stroke-width="3" stroke-linejoin="round" transform="scale(0.6) translate(0,120)"/>
  </g>
  <text x="800" y="940" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="30" letter-spacing="10" fill="#6b6b6b">ÖZER BUTİK · %100 PAMUK</text>
</svg>`;
  await sharp(Buffer.from(brandSvg))
    .webp({ quality: 82 })
    .toFile(path.join(OUT_DIR, "marka.webp"));
  count++;

  // Paylaşım görseli (OpenGraph, 1200x630)
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#111111"/>
  <text x="600" y="300" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="76" letter-spacing="14" fill="#ffffff">ÖZER BUTİK</text>
  <text x="600" y="380" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="30" letter-spacing="8" fill="#b5b5b0">BASIC T-SHIRT · %100 PAMUK</text>
</svg>`;
  await sharp(Buffer.from(ogSvg))
    .webp({ quality: 85 })
    .toFile(path.join(process.cwd(), "public", "og.webp"));
  count++;

  await writeFile(
    path.join(OUT_DIR, "README.md"),
    "Bu klasördeki görseller `scripts/generate-placeholder-images.mjs` ile üretilmiş geçici yer tutuculardır.\nGerçek ürün fotoğrafları geldiğinde admin panelinden yüklenip bu dosyaların yerini alacaklar.\n",
  );

  console.log(`${count} yer tutucu görsel üretildi → public/urunler/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
