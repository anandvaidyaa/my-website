// Generates responsive/derived images from the sources in the repo root.
// Run with `npm run assets` after changing profile.webp or favicon.svg.
import sharp from "sharp";
import { mkdir, readFile, readdir } from "node:fs/promises";

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

// 4. One social card per case study, from its data-meta block
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function wrap(text, max) {
    const lines = [];
    let line = "";
    for (const word of text.split(" ")) {
        if ((line + " " + word).trim().length > max) { lines.push(line.trim()); line = word; }
        else line += " " + word;
    }
    if (line.trim()) lines.push(line.trim());
    return lines;
}
await mkdir(path("og"), { recursive: true });
const smallPortrait = await sharp(path("profile.webp"))
    .resize(150, 150, { position: "top" })
    .composite([{ input: Buffer.from('<svg width="150" height="150"><circle cx="75" cy="75" r="75" fill="#fff"/></svg>'), blend: "dest-in" }])
    .png().toBuffer();
const made = [];
for (const file of (await readdir(path("content/projects"))).filter((f) => f.endsWith(".html") && !f.startsWith("_"))) {
    const raw = await readFile(path("content/projects/" + file), "utf8");
    const meta = JSON.parse(raw.match(/<script type="application\/json" data-meta>([\s\S]*?)<\/script>/)[1]);
    const lines = wrap(meta.title, 22).slice(0, 3);
    const titleSvg = lines.map((l, i) => `<text x="80" y="${250 + i * 82}" font-family="Segoe UI, Arial, sans-serif" font-weight="700" font-size="72" letter-spacing="-2" fill="#e9edf7">${esc(l)}</text>`).join("");
    const stackY = 250 + lines.length * 82 + 10;
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="a" cx="85%" cy="0%" r="70%"><stop offset="0" stop-color="#5b8cff" stop-opacity=".40"/><stop offset="1" stop-color="#06080f" stop-opacity="0"/></radialGradient>
    <radialGradient id="b" cx="5%" cy="100%" r="60%"><stop offset="0" stop-color="#2ad4f0" stop-opacity=".22"/><stop offset="1" stop-color="#06080f" stop-opacity="0"/></radialGradient>
    <linearGradient id="t" x1="0" x2="1"><stop offset="0" stop-color="#2ad4f0"/><stop offset=".5" stop-color="#6b95ff"/><stop offset="1" stop-color="#a78bfa"/></linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#7896ff" stroke-opacity=".08"/></pattern>
  </defs>
  <rect width="1200" height="630" fill="#06080f"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#a)"/>
  <rect width="1200" height="630" fill="url(#b)"/>
  <rect x="80" y="120" width="8" height="8" fill="#2ad4f0"/>
  <text x="100" y="130" font-family="Consolas, monospace" font-size="22" letter-spacing="4" fill="#2ad4f0">CASE STUDY · ${esc(meta.kicker.toUpperCase())}</text>
  ${titleSvg}
  <text x="80" y="${stackY + 30}" font-family="Segoe UI, Arial, sans-serif" font-size="26" fill="#a7b1c6">${esc(meta.stack.join("  ·  "))}</text>
  <rect x="80" y="${stackY + 60}" width="320" height="3" rx="1.5" fill="url(#t)"/>
  <circle cx="1060" cy="535" r="84" fill="none" stroke="url(#t)" stroke-width="3" stroke-dasharray="300 230" stroke-linecap="round"/>
  <text x="940" y="545" text-anchor="end" font-family="Segoe UI, Arial, sans-serif" font-weight="600" font-size="26" fill="#e9edf7">Anand Vaidya</text>
  <text x="940" y="578" text-anchor="end" font-family="Consolas, monospace" font-size="20" fill="#a7b1c6">anandvaidya.in</text>
</svg>`;
    await sharp(Buffer.from(svg))
        .composite([{ input: smallPortrait, left: 985, top: 460 }])
        .png({ compressionLevel: 9, palette: true, quality: 90 })
        .toFile(path(meta.ogImage));
    made.push(meta.ogImage);
}

console.log("assets: profile-320.webp, apple-touch-icon.png, og-cover.png, " + made.join(", "));
