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
    "styles.min.css", "script.min.js"
];
const DIRS = ["fonts", "og"];
const HASHED = ["styles.min.css", "script.min.js"];

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
const footer = toRoot(grab(/<footer class="site-footer">[\s\S]*?<\/footer>/, "site footer"));

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
    for (const key of ["order", "title", "seoTitle", "description", "kicker", "lede", "context", "stack", "outcomes", "ogImage", "datePublished", "dateModified"]) {
        if (meta[key] === undefined) throw new Error(`${file}: meta.${key} is required`);
    }
    if (meta.seoTitle.length > 65) console.warn(`warn: ${file} seoTitle is ${meta.seoTitle.length} chars`);
    if (meta.description.length > 170) console.warn(`warn: ${file} description is ${meta.description.length} chars`);
    const slug = file.replace(/\.html$/, "");
    const body = raw.slice(metaMatch.index + metaMatch[0].length).trim();
    const toc = [...body.matchAll(/<h2 id="([\w-]+)">([\s\S]*?)<\/h2>/g)].map((m) => ({ id: m[1], text: m[2].replace(/<[^>]+>/g, "") }));
    projects.push({ ...meta, slug, body, toc, url: `${SITE}/projects/${slug}/` });
}
projects.sort((a, b) => a.order - b.order);

for (const p of projects) {
    const others = projects.filter((o) => o !== p);
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
        KICKER: esc(p.kicker),
        LEDE: esc(p.lede),
        CONTEXT: esc(p.context),
        STACK_TEXT: esc(p.stack.join(" · ")),
        STACK_TAGS: p.stack.map((s) => `<li>${esc(s)}</li>`).join(""),
        OUTCOMES: p.outcomes.map(([v, l]) => `<li><span class="outcome__val">${esc(v)}</span><span class="outcome__lbl">${esc(l)}</span></li>`).join(""),
        TOC: p.toc.map((t) => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join(""),
        BODY: p.body,
        NEXT: others.map((o) => `<a class="next-card" href="/projects/${o.slug}/"><span>Next case study</span><strong>${esc(o.title)}</strong></a>`).join("")
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
const versions = {};
for (const f of HASHED) versions[f] = createHash("sha256").update(await readFile(f)).digest("hex").slice(0, 10);

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
