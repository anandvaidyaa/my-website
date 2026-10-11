// Generates responsive/derived images from the sources in the repo root.
// Run with `npm run assets` after changing profile.webp or favicon.svg.
import sharp from "sharp";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const path = (p) => new URL(p, root).pathname.replace(/^\/([A-Za-z]:)/, "$1");

// 1. Responsive portrait (the 450px original stays as the large candidate)
await sharp(path("profile.webp")).resize(320, 320).webp({ quality: 80 }).toFile(path("profile-320.webp"));

// 2. Apple touch icon from the SVG favicon
await sharp(await readFile(path("favicon.svg")), { density: 600 }).resize(180, 180).png().toFile(path("apple-touch-icon.png"));

// 3. Open Graph / social card (1200x630)
const portrait = await sharp(path("profile.webp"))
    .resize(340, 340, { position: "top" })
    .composite([{
        input: Buffer.from('<svg width="340" height="340"><circle cx="170" cy="170" r="170" fill="#fff"/></svg>'),
        blend: "dest-in"
    }])
    .png()
    .toBuffer();

const card = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="a" cx="15%" cy="0%" r="70%"><stop offset="0" stop-color="#5b8cff" stop-opacity=".45"/><stop offset="1" stop-color="#06080f" stop-opacity="0"/></radialGradient>
    <radialGradient id="b" cx="95%" cy="100%" r="60%"><stop offset="0" stop-color="#a78bfa" stop-opacity=".35"/><stop offset="1" stop-color="#06080f" stop-opacity="0"/></radialGradient>
    <linearGradient id="t" x1="0" x2="1"><stop offset="0" stop-color="#2ad4f0"/><stop offset=".5" stop-color="#6b95ff"/><stop offset="1" stop-color="#a78bfa"/></linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#7896ff" stroke-opacity=".08"/></pattern>
  </defs>
  <rect width="1200" height="630" fill="#06080f"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#a)"/>
  <rect width="1200" height="630" fill="url(#b)"/>
  <circle cx="930" cy="315" r="250" fill="none" stroke="#96a5cd" stroke-opacity=".25" stroke-dasharray="3 9"/>
  <circle cx="930" cy="315" r="205" fill="none" stroke="url(#t)" stroke-width="3" stroke-dasharray="300 990" stroke-linecap="round"/>
  <text x="80" y="150" font-family="Consolas, monospace" font-size="24" letter-spacing="4" fill="#2ad4f0">AZURE CLOUD ENGINEER</text>
  <text x="76" y="270" font-family="Segoe UI, Arial, sans-serif" font-weight="700" font-size="112" letter-spacing="-4" fill="#e9edf7">Anand</text>
  <text x="76" y="380" font-family="Segoe UI, Arial, sans-serif" font-weight="700" font-size="112" letter-spacing="-4" fill="none" stroke="#e9edf7" stroke-width="2">Vaidya</text>
  <text x="80" y="455" font-family="Segoe UI, Arial, sans-serif" font-size="24" fill="#a7b1c6">Serverless integrations · secure APIs · infrastructure as code</text>
  <text x="80" y="545" font-family="Consolas, monospace" font-size="24" fill="#e9edf7">anandvaidya.in</text>
</svg>`;

await sharp(Buffer.from(card))
    .composite([{ input: portrait, left: 760, top: 145 }])
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(path("og-cover.png"));

console.log("assets: profile-320.webp, apple-touch-icon.png, og-cover.png");
