// Generates the site's icons from one parametric drawing of the glass shard: the same shard
// #frag plays on the homepage (points 0,-22 15,10 2,13 -11,16), with its base notch deepened so the
// silhouette stays a shard, not a triangle, at 16 px.
// Run with `npm run favicon`. Writes, in the repo root:
//   favicon.svg            static vector icon (also the manifest icon)
//   favicon.gif            animated 32x32 loop, 2.4 s: dormant → light runs through the facets →
//                          the lime core lights → the shard turns to show its other facet → settles
//   favicon-16x16.png, favicon-32x32.png, favicon.ico (16/32/48), apple-touch-icon.png (180)
// and src/brand/shard-master.png: a 1024px transparent master for future work.
// The GIF and ICO are encoded here (LZW, global palette, frame differencing) so the output is
// deterministic and small. Nothing is fetched.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const path = (p) => new URL(p, root).pathname.replace(/^\/([A-Za-z]:)/, "$1");

/* ---------------- The drawing ---------------- */
const SHARD = [[0, -22], [15, 10], [2, 8], [-11, 16]];
const CORE = [1.1, -2.5];
const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const bump = (t, a, b) => { const u = (t - a) / (b - a); return u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u) ** 2; };
const n = (v) => +v.toFixed(2);

// The state of the shard at loop time t ∈ [0, 1). Every value returns to its start at t = 1.
function stateAt(t) {
    return {
        glow: bump(t, 0.06, 0.94),                         // facets wake and fall back asleep
        band: -0.35 + 1.7 * smooth((t - 0.1) / 0.42),      // a narrow light crosses the facets
        bandOn: t > 0.1 && t < 0.52 ? 1 : 0,
        core: bump(t, 0.36, 0.7),                          // the lime signal
        turn: bump(t, 0.44, 0.92) * 0.85                   // a slight turn shows the other facet
    };
}
const STATIC = { glow: 0.8, band: 0.3, bandOn: 1, core: 0.75, turn: 0 };

// size: "large" (≥ 32 px) or "small" (16 px: heavier edge, no inner band)
function svg(s, { tile = "round", px = 64, small = false } = {}) {
    // the turn: the right facet narrows, the left widens, about the spine (x = 2)
    const pts = SHARD.map(([x, y]) => [2 + (x - 2) * (x > 2 ? 1 - 0.32 * s.turn : 1 + 0.1 * s.turn), y]);
    const T = (p) => `${n(p[0])},${n(p[1])}`;
    const left = [pts[0], pts[2], pts[3]].map(T).join(" ");
    const right = [pts[0], pts[1], pts[2]].map(T).join(" ");
    const all = pts.map(T).join(" ");
    const g = s.glow, k = s.turn;
    const lOp = n(0.55 + 0.3 * g + 0.3 * k), rOp = n(0.62 + 0.38 * g - 0.3 * k);
    const sc = 1.36, stroke = (small ? 2.6 : 1.5) / sc;
    const b = s.band, w = 0.13;
    const bg = tile === "none" ? "" : `
  <rect width="64" height="64" ${tile === "round" ? 'rx="14"' : ""} fill="#070a12"/>
  <rect width="64" height="64" ${tile === "round" ? 'rx="14"' : ""} fill="url(#halo)"/>
  ${tile === "round" ? '<rect x=".5" y=".5" width="63" height="63" rx="13.5" fill="none" stroke="#24304f" stroke-opacity=".9"/>' : ""}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}">
  <defs>
    <radialGradient id="halo" cx=".5" cy=".52" r=".5"><stop offset="0" stop-color="#3a6cf0" stop-opacity="${n(0.2 + 0.16 * g)}"/><stop offset="1" stop-color="#3a6cf0" stop-opacity="0"/></radialGradient>
    <linearGradient id="lf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3566f0"/><stop offset="1" stop-color="#152a7a"/></linearGradient>
    <linearGradient id="rf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7cefff"/><stop offset="1" stop-color="#2a9be8"/></linearGradient>
    <linearGradient id="band" x1="0" y1="0" x2="1" y2=".8">
      <stop offset="${n(Math.min(1, Math.max(0, b - w)))}" stop-color="#e6fdff" stop-opacity="0"/>
      <stop offset="${n(Math.min(1, Math.max(0, b)))}" stop-color="#e6fdff" stop-opacity="${n(0.8 * s.bandOn)}"/>
      <stop offset="${n(Math.min(1, Math.max(0, b + w)))}" stop-color="#e6fdff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="cg"><stop offset="0" stop-color="#c6ff4a" stop-opacity="${n(0.75 * s.core)}"/><stop offset="1" stop-color="#c6ff4a" stop-opacity="0"/></radialGradient>
    <clipPath id="clip"><polygon points="${all}"/></clipPath>
  </defs>${bg}
  <g transform="translate(29.6 35.6) scale(${sc})">
    <polygon points="${all}" fill="#0b1433"/>
    <polygon points="${left}" fill="url(#lf)" fill-opacity="${lOp}"/>
    <polygon points="${right}" fill="url(#rf)" fill-opacity="${rOp}"/>
    ${small || !s.bandOn ? "" : `<rect x="-12" y="-23" width="28" height="40" fill="url(#band)" clip-path="url(#clip)"/>`}
    <line x1="${n(pts[0][0])}" y1="${n(pts[0][1])}" x2="${n(pts[2][0])}" y2="${n(pts[2][1])}" stroke="#d9fbff" stroke-opacity="${n((small ? 0.35 : 0.45) + 0.35 * g)}" stroke-width="${n(stroke * 0.6)}"/>
    <polygon points="${all}" fill="none" stroke="#9af1ff" stroke-opacity="${n(0.7 + 0.3 * g)}" stroke-width="${n(stroke)}" stroke-linejoin="round"/>
    <circle cx="${CORE[0]}" cy="${CORE[1]}" r="${n(4 + 4 * s.core)}" fill="url(#cg)"/>
    <circle cx="${CORE[0]}" cy="${CORE[1]}" r="${n((small ? 1.4 : 1.5) + (small ? 0.6 : 0.9) * s.core)}" fill="#b8ff3c" fill-opacity="${n(0.45 + 0.55 * s.core)}"/>
  </g>
</svg>`;
}

// Render through a 8x supersample for clean edges at icon sizes
const raster = (svgText, px) => sharp(Buffer.from(svgText), { density: 72 * 8 * px / 64 })
    .resize(px, px, { kernel: "lanczos3" }).ensureAlpha().raw().toBuffer();
const png = (svgText, px) => sharp(Buffer.from(svgText), { density: 72 * 8 * px / 64 })
    .resize(px, px, { kernel: "lanczos3" }).png({ compressionLevel: 9, palette: px <= 48, effort: 10 }).toBuffer();

/* ---------------- GIF encoding ---------------- */
function medianCut(colors, max) {          // colors: [[r,g,b,count]]
    let boxes = [colors];
    while (boxes.length < max) {
        let bi = -1, bestRange = 0, ch = 0;
        boxes.forEach((bx, i) => {
            if (bx.length < 2) return;
            for (let c = 0; c < 3; c++) {
                let lo = 255, hi = 0;
                for (const p of bx) { if (p[c] < lo) lo = p[c]; if (p[c] > hi) hi = p[c]; }
                if (hi - lo > bestRange) { bestRange = hi - lo; bi = i; ch = c; }
            }
        });
        if (bi < 0) break;
        const bx = boxes[bi].sort((a, b) => a[ch] - b[ch]);
        const total = bx.reduce((s, p) => s + p[3], 0);
        let acc = 0, cut = 1;
        for (let i = 0; i < bx.length - 1; i++) { acc += bx[i][3]; if (acc >= total / 2) { cut = i + 1; break; } }
        boxes.splice(bi, 1, bx.slice(0, cut), bx.slice(cut));
    }
    return boxes.map((bx) => {
        const t = bx.reduce((s, p) => s + p[3], 0);
        return [0, 1, 2].map((c) => Math.round(bx.reduce((s, p) => s + p[c] * p[3], 0) / t));
    });
}

function lzw(indices, minSize) {
    const out = [];
    let cur = 0, bits = 0;
    const emit = (code, size) => { cur |= code << bits; bits += size; while (bits >= 8) { out.push(cur & 255); cur >>>= 8; bits -= 8; } };
    const clear = 1 << minSize, eoi = clear + 1;
    let size = minSize + 1, next = eoi + 1, table = new Map();
    emit(clear, size);
    let key = indices[0];
    for (let i = 1; i < indices.length; i++) {
        const k = indices[i], kk = (key << 8) | k;
        const hit = table.get(kk);
        if (hit !== undefined) { key = hit; continue; }
        emit(key, size);
        if (next === 4096) { emit(clear, size); size = minSize + 1; next = eoi + 1; table = new Map(); }
        else { if (next >= (1 << size)) size++; table.set(kk, next++); }
        key = k;
    }
    emit(key, size);
    emit(eoi, size);
    if (bits > 0) out.push(cur & 255);
    const blocks = [];
    for (let i = 0; i < out.length; i += 255) { const c = out.slice(i, i + 255); blocks.push(c.length, ...c); }
    return [...blocks, 0];
}

// frames: [{ rgba: Buffer, delay: centiseconds }]; pixels with alpha < 128 become transparent
function encodeGif(frames, W, H) {
    const counts = new Map();
    for (const f of frames) for (let i = 0; i < W * H; i++) {
        const o = i * 4; if (f.rgba[o + 3] < 128) continue;
        const key = (f.rgba[o] << 16) | (f.rgba[o + 1] << 8) | f.rgba[o + 2];
        counts.set(key, (counts.get(key) || 0) + 1);
    }
    const pal = medianCut([...counts].map(([c, k]) => [c >> 16, (c >> 8) & 255, c & 255, k]), 255);
    const TR = 0, palette = [[0, 0, 0], ...pal];
    while (palette.length < 256) palette.push([0, 0, 0]);
    const cache = new Map();
    const nearest = (r, g, b) => {
        const key = (r << 16) | (g << 8) | b;
        let v = cache.get(key);
        if (v !== undefined) return v;
        let best = 1e9;
        for (let i = 1; i <= pal.length; i++) {
            const p = palette[i], d = (p[0] - r) ** 2 * 3 + (p[1] - g) ** 2 * 4 + (p[2] - b) ** 2 * 2;
            if (d < best) { best = d; v = i; }
        }
        cache.set(key, v);
        return v;
    };
    const idx = frames.map((f) => {
        const a = new Uint8Array(W * H);
        for (let i = 0; i < W * H; i++) { const o = i * 4; a[i] = f.rgba[o + 3] < 128 ? TR : nearest(f.rgba[o], f.rgba[o + 1], f.rgba[o + 2]); }
        return a;
    });
    // merge identical neighbours, keeping their combined time
    const seq = [];
    idx.forEach((a, i) => {
        const last = seq[seq.length - 1];
        if (last && Buffer.compare(Buffer.from(last.a), Buffer.from(a)) === 0) last.delay += frames[i].delay;
        else seq.push({ a, delay: frames[i].delay });
    });
    const b = [];
    const u16 = (v) => b.push(v & 255, v >> 8);
    b.push(...Buffer.from("GIF89a")); u16(W); u16(H);
    b.push(0xf7, TR, 0);
    palette.forEach((p) => b.push(...p));
    b.push(0x21, 0xff, 11, ...Buffer.from("NETSCAPE2.0"), 3, 1, 0, 0, 0);   // loop forever
    let prev = null;
    for (const f of seq) {
        // only the pixels that changed since the previous frame, cropped to their bounds
        let x0 = 0, y0 = 0, x1 = W - 1, y1 = H - 1, data = f.a;
        if (prev) {
            x0 = W; y0 = H; x1 = -1; y1 = -1;
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (prev[y * W + x] !== f.a[y * W + x]) {
                if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
            }
            if (x1 < 0) { x0 = y0 = x1 = y1 = 0; }
            data = new Uint8Array((x1 - x0 + 1) * (y1 - y0 + 1));
            let j = 0;
            for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) data[j++] = prev[y * W + x] === f.a[y * W + x] ? TR : f.a[y * W + x];
        }
        b.push(0x21, 0xf9, 4, 0x05, f.delay & 255, f.delay >> 8, TR, 0);   // dispose: keep; transparency on
        b.push(0x2c); u16(x0); u16(y0); u16(x1 - x0 + 1); u16(y1 - y0 + 1); b.push(0);
        b.push(8, ...lzw(data, 8));
        prev = f.a;
    }
    b.push(0x3b);
    return { buf: Buffer.from(b), frames: seq.length, colors: pal.length };
}

/* ---------------- ICO: PNG entries (supported by every current browser and OS) ---------------- */
function encodeIco(entries) {   // [{ px, png }]
    const head = Buffer.alloc(6 + 16 * entries.length);
    head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(entries.length, 4);
    let off = head.length;
    entries.forEach((e, i) => {
        const o = 6 + 16 * i;
        head[o] = e.px >= 256 ? 0 : e.px; head[o + 1] = e.px >= 256 ? 0 : e.px;
        head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6);
        head.writeUInt32LE(e.png.length, o + 8); head.writeUInt32LE(off, o + 12);
        off += e.png.length;
    });
    return Buffer.concat([head, ...entries.map((e) => e.png)]);
}

/* ---------------- Build ---------------- */
const FRAMES = 60, DELAY = 4;   // 60 × 40 ms = 2.4 s
const G = 32;
const frames = [];
for (let i = 0; i < FRAMES; i++) frames.push({ rgba: await raster(svg(stateAt(i / FRAMES), { px: G }), G), delay: DELAY });
const gif = encodeGif(frames, G, G);
await writeFile(path("favicon.gif"), gif.buf);

await writeFile(path("favicon.svg"), svg(STATIC, { px: 64 }).replace(' width="64" height="64"', "") + "\n");
const p16 = await png(svg(STATIC, { px: 16, small: true }), 16);
const p32 = await png(svg(STATIC, { px: 32 }), 32);
const p48 = await png(svg(STATIC, { px: 48 }), 48);
await writeFile(path("favicon-16x16.png"), p16);
await writeFile(path("favicon-32x32.png"), p32);
await writeFile(path("favicon.ico"), encodeIco([{ px: 16, png: p16 }, { px: 32, png: p32 }, { px: 48, png: p48 }]));
// iOS rounds the corners itself, so the touch icon is a full square
await sharp(Buffer.from(svg(STATIC, { px: 180, tile: "square" })), { density: 72 * 4 * 180 / 64 }).resize(180, 180).png({ compressionLevel: 9 }).toFile(path("apple-touch-icon.png"));
await mkdir(path("src/brand"), { recursive: true });
await sharp(Buffer.from(svg(STATIC, { px: 1024, tile: "none" }))).png({ compressionLevel: 9 }).toFile(path("src/brand/shard-master.png"));

console.log(`favicon.gif: ${gif.frames} frames, ${gif.colors} colours, ${gif.buf.length} bytes`);

export { svg, stateAt, STATIC };
