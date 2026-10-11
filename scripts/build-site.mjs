// Assembles the deployable site into _site/ (what GitHub Pages serves).
// Run after `npm run build`; used by .github/workflows/deploy.yml.
//  - copies only public files (no src/, scripts/, node_modules, docs)
//  - replaces the manual ?v= cache-busting with a content hash of each asset
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const OUT = "_site";

const FILES = [
    "index.html",
    "404.html",
    "CNAME",
    "favicon.svg",
    "apple-touch-icon.png",
    "og-cover.png",
    "profile.webp",
    "profile-320.webp",
    "robots.txt",
    "sitemap.xml",
    "site.webmanifest",
    "styles.min.css",
    "script.min.js"
];
const DIRS = ["fonts"];
const HASHED = ["styles.min.css", "script.min.js"];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const f of FILES) {
    if (!existsSync(f)) throw new Error(`Missing ${f} — did you run "npm run build"?`);
    await cp(f, `${OUT}/${f}`);
}
for (const d of DIRS) await cp(d, `${OUT}/${d}`, { recursive: true });

// Tell GitHub Pages not to run Jekyll over the files
await writeFile(`${OUT}/.nojekyll`, "");

// Content-hash cache busting: styles.min.css?v=31 → styles.min.css?v=<hash>
const versions = {};
for (const f of HASHED) {
    versions[f] = createHash("sha256").update(await readFile(f)).digest("hex").slice(0, 10);
}
for (const page of ["index.html", "404.html"]) {
    let html = await readFile(`${OUT}/${page}`, "utf8");
    for (const [file, v] of Object.entries(versions)) {
        const re = new RegExp(file.replace(/\./g, "\\.") + "\\?v=[\\w.-]+", "g");
        if (!re.test(html) && page === "index.html") throw new Error(`${page} does not reference ${file}?v=`);
        html = html.replace(re, `${file}?v=${v}`);
    }
    await writeFile(`${OUT}/${page}`, html);
}

console.log(`_site ready: ${FILES.length} files + ${DIRS.join(", ")} (css ${versions["styles.min.css"]}, js ${versions["script.min.js"]})`);
