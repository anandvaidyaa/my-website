// Assembles the deployable site into _site/ (what GitHub Pages serves).
// Run via `npm run build:site`; used by .github/workflows/deploy.yml.
//
//  - copies only public files (no src/, scripts/, content/, node_modules, docs)
//  - renders case studies from content/projects/*.html into /projects/<slug>/
//    using src/templates/article.html and the homepage's own header/footer
//  - generates sitemap.xml from the pages that actually exist
//  - replaces ?v= cache-busting with a content hash of each asset
//  - optionally injects a Google Search Console tag from $GSC_VERIFICATION
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const SITE = "https://anandvaidya.in";
const OUT = "_site";
const PERSON_ID = `${SITE}/#person`;
const WEBSITE_ID = `${SITE}/#website`;

const FILES = [
    "index.html", "404.html", "CNAME", "robots.txt", "site.webmanifest",
    "favicon.svg", "apple-touch-icon.png", "og-cover.png", "profile.webp", "profile-320.webp",
    "styles.min.css", "script.min.js", "eggs.min.js", "eggs.min.css", "case.min.css", "case.min.js", "Anand-Vaidya-Resume.pdf"
];
const DIRS = ["fonts", "og"];
const HASHED = ["styles.min.css", "script.min.js", "case.min.css", "case.min.js"];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const human = (iso) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const fill = (tpl, map) => tpl.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => {
    if (!(k in map)) throw new Error(`Template token ${m} has no value`);
    return map[k];
});

// ---------- 1. Copy static files ----------
// Empty _site/ rather than deleting it, so a preview server running inside it doesn't block the build
await mkdir(OUT, { recursive: true });
for (const entry of await readdir(OUT)) await rm(`${OUT}/${entry}`, { recursive: true, force: true });
for (const f of FILES) {
    if (!existsSync(f)) throw new Error(`Missing ${f} — did you run "npm run build" and "npm run assets"?`);
    await cp(f, `${OUT}/${f}`);
}
for (const d of DIRS) {
    if (!existsSync(d)) throw new Error(`Missing ${d}/ — run "npm run assets"`);
    await cp(d, `${OUT}/${d}`, { recursive: true });
}
await writeFile(`${OUT}/.nojekyll`, ""); // serve files as-is, no Jekyll

// ---------- 2. Shared chrome from the homepage ----------
const home = await readFile("index.html", "utf8");
const grab = (re, what) => {
    const m = home.match(re);
    if (!m) throw new Error(`Could not find ${what} in index.html`);
    return m[0];
};
// Point the homepage's in-page links at the homepage; leave SVG <use href="#icon"> alone
const toRoot = (html) => html
    .replace(/(<a[^>]*?href=")#home"/g, '$1/"')
    .replace(/(<a[^>]*?href=")#([\w-]+)"/g, '$1/#$2"');

const themeScript = grab(/<script>\s*\/\/ Set the theme[\s\S]*?<\/script>/, "theme script");
const sprite = grab(/<svg width="0" height="0" class="sprite"[\s\S]*?<\/svg>/, "icon sprite");
const header = toRoot(grab(/<header class="site-header"[\s\S]*?<\/header>/, "site header"))
    .replace('<a href="/#projects">Projects</a>', '<a href="/#projects" class="is-active">Projects</a>');
const footer = toRoot(grab(/<footer class="site-footer"[\s\S]*?<\/footer>/, "site footer"));
const egg = grab(/<dialog class="egg[\s\S]*?<\/dialog>/, "easter-egg dialog");
const quick = grab(/<dialog class="qv"[\s\S]*?<\/dialog>/, "quick-view dialog");

// ---------- 3. Case studies ----------
const template = await readFile("src/templates/article.html", "utf8");
const pages = [{ loc: `${SITE}/`, lastmod: home.match(/"dateModified":\s*"([\d-]+)"/)?.[1], images: [`${SITE}/profile.webp`, `${SITE}/og-cover.png`] }];

const projectFiles = (await readdir("content/projects")).filter((f) => f.endsWith(".html") && !f.startsWith("_"));
const projects = [];
for (const file of projectFiles) {
    const raw = await readFile(`content/projects/${file}`, "utf8");
    const metaMatch = raw.match(/<script type="application\/json" data-meta>([\s\S]*?)<\/script>/);
    if (!metaMatch) throw new Error(`${file}: missing data-meta block`);
    const meta = JSON.parse(metaMatch[1]);
    for (const key of ["order", "title", "seoTitle", "description", "kicker", "lede", "context", "stack", "outcomes", "accent", "status", "ogImage", "datePublished", "dateModified"]) {
        if (meta[key] === undefined) throw new Error(`${file}: meta.${key} is required`);
    }
    if (meta.seoTitle.length > 65) console.warn(`warn: ${file} seoTitle is ${meta.seoTitle.length} chars`);
    if (meta.description.length > 170) console.warn(`warn: ${file} description is ${meta.description.length} chars`);
    const slug = file.replace(/\.html$/, "");
    let body = raw.slice(metaMatch.index + metaMatch[0].length).trim();
    // The hero visual is authored in the content file between <!-- hero --> markers
    const heroMatch = body.match(/<!-- hero -->([\s\S]*?)<!-- \/hero -->/);
    if (!heroMatch) throw new Error(`${file}: missing <!-- hero --> visual`);
    body = body.replace(heroMatch[0], "").trim();
    // Chapters: <section class="chapter" id="…" data-toc="…">
    const toc = [...body.matchAll(/<section class="chapter[^"]*" id="([\w-]+)" data-toc="([^"]+)"/g)].map((m) => ({ id: m[1], text: m[2] }));
    if (toc.length < 3) throw new Error(`${file}: expected at least 3 chapters`);
    projects.push({ ...meta, slug, body, hero: heroMatch[1].trim(), toc, url: `${SITE}/projects/${slug}/` });
}
projects.sort((a, b) => a.order - b.order);

const pad = (n) => String(n).padStart(2, "0");
// The homepage mascot peeks over the "next case study" card (continuity between pages)
const CLOUDLET = '<svg class="cloudlet cloudlet--peek-next" viewBox="0 0 120 80" aria-hidden="true"><path class="cloudlet__body" d="M28 70h62a22 22 0 0 0 2-44 30 30 0 0 0-57-6A24 24 0 0 0 28 70z"/><g class="cloudlet__eyes"><ellipse cx="50" cy="44" rx="5" ry="6.5"/><ellipse cx="72" cy="44" rx="5" ry="6.5"/></g></svg>';
for (const p of projects) {
    // Next case study first, then the rest in order
    const others = projects.filter((o) => o !== p).sort((a, b) => ((a.order - p.order + projects.length) % projects.length) - ((b.order - p.order + projects.length) % projects.length));
    const breadcrumb = {
        "@type": "BreadcrumbList",
        "@id": `${p.url}#breadcrumb`,
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE}/` },
            { "@type": "ListItem", "position": 2, "name": "Projects", "item": `${SITE}/#projects` },
            { "@type": "ListItem", "position": 3, "name": p.title, "item": p.url }
        ]
    };
    const jsonld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                "@id": `${p.url}#webpage`,
                "url": p.url,
                "name": p.seoTitle,
                "description": p.description,
                "isPartOf": { "@id": WEBSITE_ID },
                "breadcrumb": { "@id": `${p.url}#breadcrumb` },
                "primaryImageOfPage": `${SITE}/${p.ogImage}`,
                "inLanguage": "en-IN",
                "datePublished": p.datePublished,
                "dateModified": p.dateModified
            },
            {
                "@type": "Article",
                "@id": `${p.url}#article`,
                "headline": p.title,
                "description": p.description,
                "image": `${SITE}/${p.ogImage}`,
                "datePublished": p.datePublished,
                "dateModified": p.dateModified,
                "inLanguage": "en-IN",
                "mainEntityOfPage": { "@id": `${p.url}#webpage` },
                "author": { "@type": "Person", "@id": PERSON_ID, "name": "Anand Vaidya", "url": `${SITE}/` },
                "publisher": { "@type": "Person", "@id": PERSON_ID, "name": "Anand Vaidya", "url": `${SITE}/` },
                "about": p.stack.map((name) => ({ "@type": "Thing", name })),
                "keywords": p.stack.join(", ")
            },
            breadcrumb
        ]
    };

    const html = fill(template, {
        THEME_SCRIPT: themeScript,
        SEO_TITLE: esc(p.seoTitle),
        TITLE: esc(p.title),
        DESCRIPTION: esc(p.description),
        CANONICAL: p.url,
        OG_IMAGE: `${SITE}/${p.ogImage}`,
        PUBLISHED: p.datePublished,
        MODIFIED: p.dateModified,
        MODIFIED_HUMAN: human(p.dateModified),
        JSONLD: JSON.stringify(jsonld, null, 2).replace(/<\//g, "<\\/"),
        SPRITE: sprite,
        HEADER: header,
        FOOTER: footer,
        EGG: egg,
        QUICK: quick,
        KICKER: esc(p.kicker),
        LEDE: esc(p.lede),
        CONTEXT: esc(p.context),
        STACK_TEXT: esc(p.stack.join(" · ")),
        STACK_TAGS: p.stack.map((s) => `<li>${esc(s)}</li>`).join(""),
        OUTCOMES: p.outcomes.map(([v, l]) => `<li class="reveal"><span class="cs-result__val">${esc(v)}</span><span class="cs-result__lbl">${esc(l)}</span></li>`).join(""),
        TOC: p.toc.map((t, i) => `<li><a href="#${t.id}" data-nav="${t.id}"><span class="cs-nav__no">${pad(i + 1)}</span><span class="cs-nav__txt">${esc(t.text)}</span><i class="cs-nav__bar" aria-hidden="true"></i></a></li>`).join(""),
        FIRST: p.toc[0].id,
        HERO: p.hero,
        ACCENT: esc(p.accent),
        STATUS: esc(p.status),
        INDEX: pad(p.order),
        TOTAL: pad(projects.length),
        BODY: p.body,
        NEXT: others.map((o, i) => `<a class="next-card next-card--${esc(o.accent)}${i === 0 ? " next-card--lead" : ""}" href="/projects/${o.slug}/">${i === 0 ? CLOUDLET : ""}<span>${i === 0 ? "Next case study" : "Also read"} · ${pad(o.order)}</span><strong>${esc(o.title)}</strong><em>${esc(o.kicker)}</em><svg class="i" aria-hidden="true"><use href="#i-arrow-right"/></svg></a>`).join("")
    });

    await mkdir(`${OUT}/projects/${p.slug}`, { recursive: true });
    await writeFile(`${OUT}/projects/${p.slug}/index.html`, html);
    pages.push({ loc: p.url, lastmod: p.dateModified, images: [`${SITE}/${p.ogImage}`] });
}

// Every case study must be linked from the homepage (crawl path)
for (const p of projects) {
    if (!home.includes(`href="/projects/${p.slug}/"`)) throw new Error(`index.html does not link to /projects/${p.slug}/`);
}

// ---------- 4. Sitemap ----------
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages.map((p) => `  <url>
    <loc>${p.loc}</loc>${p.lastmod ? `\n    <lastmod>${p.lastmod}</lastmod>` : ""}
${p.images.map((i) => `    <image:image><image:loc>${i}</image:loc></image:image>`).join("\n")}
  </url>`).join("\n")}
</urlset>
`;
await writeFile(`${OUT}/sitemap.xml`, sitemap);

// ---------- 5. Cache busting + optional Search Console tag ----------
const hashOf = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 10);
const versions = {};
// The easter-egg module is loaded by script.min.js, so stamp its hashes into that file first
const eggV = { "eggs.min.js": hashOf(await readFile("eggs.min.js")), "eggs.min.css": hashOf(await readFile("eggs.min.css")) };
let mainJs = await readFile(`${OUT}/script.min.js`, "utf8");
for (const [file, v] of Object.entries(eggV)) {
    const re = new RegExp(file.replace(/\./g, "\\.") + "\\?v=[\\w.-]+", "g");
    if (!re.test(mainJs)) throw new Error(`script.min.js does not reference ${file}?v=`);
    mainJs = mainJs.replace(re, `${file}?v=${v}`);
}
await writeFile(`${OUT}/script.min.js`, mainJs);
for (const f of HASHED) versions[f] = hashOf(await readFile(`${OUT}/${f}`));

const htmlFiles = ["index.html", "404.html", ...projects.map((p) => `projects/${p.slug}/index.html`)];
const gsc = (process.env.GSC_VERIFICATION || "").trim();
if (gsc && !/^[\w-]{20,100}$/.test(gsc)) throw new Error("GSC_VERIFICATION does not look like a Search Console token");

for (const page of htmlFiles) {
    let html = await readFile(`${OUT}/${page}`, "utf8");
    for (const [file, v] of Object.entries(versions)) {
        html = html.replace(new RegExp(file.replace(/\./g, "\\.") + "\\?v=[\\w.-]+", "g"), `${file}?v=${v}`);
    }
    if (gsc && page === "index.html") {
        html = html.replace("<meta name=\"author\"", `<meta name="google-site-verification" content="${gsc}">\n    <meta name="author"`);
    }
    await writeFile(`${OUT}/${page}`, html);
}

console.log(`_site ready: ${pages.length} indexable pages (${projects.map((p) => p.slug).join(", ")}), css ${versions["styles.min.css"]}, js ${versions["script.min.js"]}${gsc ? ", GSC tag injected" : ""}`);
