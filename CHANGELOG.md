# CHANGELOG — Anand Vaidya Portfolio (anandvaidya.in)

## 2026-10-11 (3) — Futuristic redesign: materials, sculpture, personality

**Visual identity**
- Palette extended with acid lime and restrained magenta; warm off-white light theme.
- Glass material system: dark, iridescent (animated conic edge), crystal (cut corners), frosted and holographic (scan lines + sweeping sheen), with a solid fallback where `backdrop-filter` is unsupported and lighter blur on phones.
- Hero rebuilt as an asymmetric composition: oversized stacked name with an offset outline extrusion, pointer parallax, and a CSS-3D/SVG sculpture (no WebGL): portrait in a morphing blob, a refracting glass orb, chrome torus, iridescent shards, wireframe polyhedron, an orbiting satellite, a rotating stamp, a live HUD (location, pointer coordinates), a holographic sticker and hand-drawn annotations.
- About as an editorial spread with a holographic ID badge; principles as numbered spec rows. Scroll-linked type bands, oversized outline words, floating year labels and a "now shipping" stamp in the timeline, projects as tilted glass exhibition frames with per-project accent colour and animated luminous borders, credentials as stickers, a footer wordmark that fills in when reached.

**Motion & interaction**
- Custom cursor on fine pointers (ring + dot, contextual labels such as VIEW / EXPLORE / INSPECT; the native cursor is kept).
- Chapter lighting that shifts colour per section; architecture diagram assembles itself (edges draw, nodes pop in); headings reveal word by word; project frames reveal through clip masks.
- Skills inspector shows a live mini ecosystem graph, related technologies (clickable) and links to where each one was used.
- Easter eggs: poke the orb (changes material), nudge the satellite (changes orbit), a sparkle button, a cloud mascot whose eyes follow the pointer, a sleepy footer cloud that wakes up, and a hidden "control plane" dialog (footer cloud, Konami code, typing "cloud", or `cloud` in the terminal).

**Performance work in this pass**
- Ambient motion starts ~2 s after load in idle time and pauses off-screen; the architecture explorer initialises only near the viewport; scroll effects only measure elements near the viewport (avoids forcing layout of `content-visibility` sections); state classes scoped to the smallest element (no whole-document style invalidation on hover).

**Measured (Lighthouse 12, local gzip server, same machine, interleaved A/B)**
- Mobile performance: new 89–93 vs. previous build 91–95 (runs vary up to 99 on a cold machine). LCP 1.8–1.9 s, CLS 0. Desktop 99–100. Accessibility, best practices and SEO 100. Case-study pages 100.
- axe-core: 0 WCAG 2.2 AA violations (homepage and case study, both themes, 375 and 1366 px). 46/46 functional checks, 53/53 SEO checks, no horizontal overflow at 320–1920 px.

## 2026-10-11 (2) — SEO foundation

**Audit findings (production, before)**
- Lighthouse SEO 100 / accessibility 100; mobile performance 89, desktop 100. Domain setup correct (HTTPS, `www` and `github.io` → apex 301, real 404s, gzip).
- **High:** the site was still deployed from the branch, so `src/`, `package.json`, `README.md`, `CHANGELOG.md` and `.claude/launch.json` were publicly served and indexable.
- **High:** a single indexable URL — nothing could rank for project or technology queries.
- **Medium:** no Search Console verification path; **low:** title didn't match "portfolio" searches, no per-page entities or breadcrumbs.

**Implemented**
- Three case-study pages at `/projects/<slug>/` (problem, architecture, decisions with trade-offs, verified outcomes, skills), linked from the homepage with descriptive anchors; breadcrumbs, author box, table of contents, next-case links.
- Static page generator in `scripts/build-site.mjs`: reuses the homepage header/footer/sprite, renders `content/projects/*.html`, generates `sitemap.xml` (4 URLs, `lastmod`, images), validates title/description lengths and that every case study is linked from the homepage.
- Structured data per case study: `WebPage` + `Article` (author/publisher = `#person`) + `BreadcrumbList`.
- Per-page Open Graph/Twitter metadata and generated 1200×630 share images (`og/`).
- Homepage title "Anand Vaidya — Azure Cloud Engineer Portfolio"; FAQ names both GitHub and LinkedIn profiles.
- Optional Google Search Console tag via the `GSC_VERIFICATION` repository variable; `docs/SEO.md` with verification, monitoring and authority-building steps.

**Verified locally (built `_site/`)**: 53/53 SEO checks (unique titles/descriptions, self canonicals, single H1, heading order, JSON-LD parses, share images exist, all internal links/anchors and external profile links resolve, sitemap/robots), 46/46 functional checks, axe-core 0 violations on homepage and case study in both themes. Lighthouse: homepage 93 / 100 (mobile / desktop performance), case study 100 / 100; accessibility, best practices and SEO 100 everywhere.

## 2026-10-11 — Redesign, performance & content accuracy

**Design & UX**
- New design system: dark and light token sets of equal depth, editorial type (Space Grotesk / Outfit), consistent spacing, radii, shadows and motion tokens. The 7,000-line override stylesheet was replaced by a ~1,300-line mobile-first one.
- New hero: split editorial layout with the name as the primary element, a verified "currently at FSP Consulting" status, positioning statement, CTAs, profile links, quick facts, and an orbital portrait with service chips over a layered background (mesh light, perspective grid, network lines, pointer-follow glow).
- The blocking preloader is gone; content is interactive immediately.
- New sections: layered skills stack with an inspector panel; an "Architecture lab" (interactive, keyboard-accessible reference architecture with request / identity / delivery flows, labelled illustrative); case-study project layouts with simplified architecture diagrams and outcome stats; credentials grid; a FAQ; a terminal that mirrors page content; a contact section with copy-to-clipboard and a validated mail-client form; a structured footer.
- Responsive at 320–1920px with intentional phone layouts (e.g. a separate vertical architecture layout, inspector that opens under the tapped layer, full-screen numbered mobile menu with `inert` background and focus return).
- Custom 404 page.

**Motion**
- Masked hero entrance, word-by-word heading reveals, staggered scroll reveals, scroll progress bar, timeline progress line, card tilt, magnetic buttons, animated diagram flows.
- Ambient motion uses composited transforms only, starts after `load`, pauses off-screen, and is fully disabled under `prefers-reduced-motion`.

**Content accuracy**
- Removed claims not supported by the experience on the page: the Kubernetes Engineer, Terraform Engineer, SRE and AWS positioning added in the July SEO pass, and the project tech chips swapped from Bicep to Terraform/Kubernetes. Re-anchored the positioning on Azure (Functions, APIM, Logic Apps, Bicep, Azure DevOps).
- Removed invented telemetry (99.99% SLA, "820+" builds, "150+" templates), skill proficiency percentages and fake system specs in the terminal.
- Fixed contradictory dates in the old terminal text; the timeline (FSP Apr 2025 – present, Atharva Feb 2023 – Mar 2025, Parul Sep 2021 – Aug 2022, B.Tech. 2019–2023) is the single source.

**SEO**
- Title (57 chars) and description (156 chars) rewritten around name + Azure Cloud Engineer; one H1; logical heading order; descriptive alt text.
- JSON-LD reduced to entities that match visible content: Person (with real credential, employer, alumni, profiles), WebSite, ProfilePage. Removed the FAQPage (not eligible), the Article and Organization nodes (no such content), the hash-fragment BreadcrumbList and the SearchAction (no site search).
- New 1200×630 Open Graph image; removed an unverified `twitter:site` handle and obsolete meta tags (`keywords`, `revisit-after`, `rating`…).
- Sitemap updated; robots.txt keeps build folders out of the crawl; custom 404 wired for Apache.

**Performance**
- No third-party requests: self-hosted variable fonts (2 files), inline SVG icon sprite instead of the Boxicons font, no externally hot-linked logos.
- Responsive portrait (320/450w) preloaded with `fetchpriority`; `content-visibility: auto` on below-the-fold sections, with anchor scrolling that corrects for lazy layout; non-critical JS initialised in idle time.
- Page weight 461 KiB → 207 KiB uncompressed (99 KiB gzipped). CSS 147 KB → 49 KB, JS 69 KB → 21 KB.

**Accessibility**
- Skip link, landmarks, visible focus rings, accessible names on all controls, `aria-pressed` / `aria-expanded` / live regions, form errors tied to fields, 24px+ touch targets, no keyboard traps. axe-core: 0 WCAG 2.2 AA violations in both themes.

**Measured (Lighthouse 12, local server with gzip; field data will differ)**

| | Before (mobile / desktop) | After (mobile / desktop) |
|---|---|---|
| Performance | 75 / 92 | 95–98 / 100 |
| Accessibility | 95 / 95 | 100 / 100 |
| Best practices | 100 / 100 | 100 / 100 |
| SEO | 100 / 100 | 100 / 100 |
| LCP | 4.1 s / 1.3 s | 1.7 s / 0.5 s |
| CLS | 0.017 / 0.001 | 0 / 0 |

---

## 2026-10-11 — Bug fixes & maintainability

**Bugs**
- **Theme toggle:** the `<head>` script reset `theme` to `dark` on every load, so a visitor's light-mode choice never persisted. Removed the overwrite; dark stays the default.
- **Broken CSS rules:** four stray literal `\n` lines in the stylesheet silently disabled the rule after each one: light-mode hero fixes, the native-cursor hide rule, and two sets of architecture-diagram alignment rules. These now apply, so the diagram nodes sit slightly differently (centred, max 140px).
- **Contact form:** it showed a fake "Transmission Succeeded" message after timed spinners. It now opens the mail client immediately, says so honestly, keeps the typed text, and offers the address plus a "copy" fallback.
- **Deep links:** `/#contact` and other anchors were forced back to the top after the preloader. Hash links now land on their section, offset below the fixed navbar.
- **Custom cursor on touch devices:** it was never actually disabled. It now only runs with a fine, hover-capable pointer, and the native cursor is hidden only while the custom one is active.
- **Terminal:** unknown commands were echoed into `innerHTML` unescaped; they are now HTML-escaped.
- **CSP:** the `.htaccess` policy blocked the Boxicons font files from unpkg. Fixed that, and added the same policy as a `<meta>` tag so it applies on GitHub Pages.

**Cleanup**
- Removed the dead legacy cursor (`[data-cursor-dot]` JS and `.cursor-dot` / `.cursor-outline` CSS, plus about 120 lines of no-op section-hover code).
- Readable sources now live in `src/`, with `npm run build` producing real minified files: CSS 147 KB to about 109 KB, JS 69 KB to about 64 KB.
- Cache-bust `?v=29` on both CSS and JS (the JS had none).
- Replaced the repeated inline styles in the Roles, FAQ, hero and footer areas with classes (160 to about 100 inline styles; the rest are per-element values such as progress widths and delays). The FAQ chevron now rotates when open, and Safari's default marker is hidden.
- SEO: removed the hidden `.sr-only` keyword text from the H1 and shortened the FAQ intro and footer tagline, which repeated all six role titles. The title, meta, JSON-LD and visible role cards still cover every target role.
- Removed `Crawl-delay` from `robots.txt` (Google ignores it).

---

## 2026-07-06 — SEO overhaul

Build date: 2026-07-06
Target keywords: Anand Vaidya, Anand Vaidya Cloud Engineer, Anand Vaidya DevOps Engineer, Anand Vaidya Platform Engineer, Anand Vaidya Kubernetes Engineer, Anand Vaidya Terraform Engineer, Anand Vaidya Cloud Architect, Anand Vaidya SRE, plus the generic role terms Cloud Engineer / DevOps Engineer / Platform Engineer / Kubernetes Engineer / Terraform Engineer / Cloud Architect / Infrastructure Engineer / CI/CD Engineer / SRE.

---

## 1. Metadata (head)

| Field | Before | After |
|---|---|---|
| `<title>` | "Anand Vaidya \| Cloud Integration Engineer & Azure Specialist" | "Anand Vaidya — Cloud Engineer, DevOps & Platform Engineer \| Kubernetes & Terraform" |
| meta description | Azure-integration focused | Establishes Anand Vaidya as Cloud/DevOps/Platform/Kubernetes/Terraform Engineer and Cloud Architect (3+ yrs, Vadodara) |
| meta keywords | Pivoted to brand-qualified keywords + target roles (Cloud/DevOps/Platform/Kubernetes/Terraform/Cloud Architect/Infrastructure/CI-CD/SRE) |
| Added tags | — | `theme-color`, `bingbot`, `rating`, `distribution`, `geo.position`, `ICBM`, `referrer`, `format-detection`, `max-autoplay:-1` |
| `<html>` | `lang="en" prefix="og: ..."` | Added `dir="ltr"` + `profile:` OG namespace |
| OG / Twitter | Updated title/desc/alt to target entities; added `og:image:secure_url`, `og:image:type`, `og:locale:alternate`, `profile:username` | Removed **incorrect** `og:image:width/height`: the photo is a square avatar, not 1200×630, so declaring those dims triggered crawler warnings. |

## 2. Structured data (JSON-LD graph)

Replaced the 3-node graph with 8 nodes, all validated as parseable JSON:

- **Person** — given/family name, gender, nationality, postal address, `jobTitle: "Cloud Engineer"`, `hasOccupation[]` with **6 Occupation nodes** (Cloud Engineer, DevOps Engineer, Platform Engineer, Kubernetes Engineer, Terraform Engineer, Cloud Architect), `knowsAbout` covering Kubernetes/Terraform/CI-CD/SRE/IaC, `knowsLanguage`, `sameAs` (GitHub + LinkedIn).
- **WebSite** — official personal website description + `potentialAction` SearchAction.
- **WebPage** — `datePublished`/`dateModified`, `primaryImageOfPage`, links to Person.
- **ProfilePage** — mainEntity Person.
- **BreadcrumbList** — Home → About → Experience → Projects → Education → Contact.
- **Article** — `about` arrays the Cloud/DevOps/Platform/Kubernetes/Terraform Engineer + Cloud Architect entities.
- **Organization** — founder = Person.
- **FAQPage** — 6 Q&A pairs (Who is Anand Vaidya? / What does he do as a Cloud Engineer? / Is he a DevOps Engineer? / Does he work with Kubernetes and Terraform? / Is he a Platform Engineer? / Where is he located?).

## 3. Content / on-page SEO

- **Hero**: subtitle -> "CLOUD & DEVOPS ENGINEER"; H1 visually "Anand Vaidya" with `.sr-only` extension naming all six target roles; description rewritten to name Cloud/DevOps/Platform Engineer, CI/CD, Kubernetes, Terraform; hero-metrics rewritten for keyword coverage.
- **Profile image**: alt updated to the target-role phrase; added `decoding="async"`.
- **Floating badges**: Azure -> Kubernetes, DevOps -> Terraform.
- **About**: opening paragraph + 3 bullet groups rewritten to cover Cloud Engineering/Architecture, DevOps/CI-CD, Platform/Kubernetes Engineering.
- **NEW section `#roles` "What I Do"**: 6-card role grid (Cloud Engineer, DevOps Engineer, Platform Engineer, Kubernetes Engineer, Terraform Engineer, Cloud Architect & SRE) using semantic `<article>`/`<h3>` and icon associations — establishes entity->profession without keyword stuffing.
- **NEW section `#faq`**: native `<details>`/`<summary>` FAQ block matching the FAQPage schema (rich-result eligible). Intro names all target roles.
- **Project 2 tech chips**: Azure Bicep/ARM -> Terraform/Kubernetes (title "Zero-Downtime Cloud Deployment Pipeline" already aligns with CI/CD/Terraform).
- **Footer**: tagline rewritten to the full six-role positioning + location.
- **JS typed-roles**: Scalable Web Apps / Azure Cloud Solutions / Seamless APIs / Performant UIs -> Cloud Platforms / Kubernetes Clusters / Terraform Pipelines / CI/CD Automation.

## 4. Technical SEO / performance

- **`site.webmanifest`** (new) — PWA manifest, `theme_color`/`background_color`, SVG maskable icon, `start_url:/`.
- **`sitemap.xml`** — single canonical entry, `lastmod` 2026-07-06, added `xhtml:link` hreflang alternates + `image:image` (profile.webp with target-role caption) for Google Image Search.
- **`robots.txt`** — explicit `Allow: /`, `Disallow:` (empty), AI bot allows (GPTBot, Google-Extended), single Sitemap line.
- **`.htaccess`** — added HTTPS + www->apex 301 redirect, GZIP, security headers (HSTS preload, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP), dotfile/sensitive-file deny, correct MIME for `.webp`/`.webmanifest`/`.jsonld`, UTF-8 default.
- **`<head>` link relations** — added `apple-touch-icon`, `mask-icon`, `<link rel="manifest">`, `dns-prefetch` for unpkg, `fetchpriority="high"` on profile preload.
- **Fonts** — Google Fonts stylesheet moved from a render-blocking `<link>` to a `preload` + async-swap pattern (cuts one render-blocking request), with a `<noscript>` fallback.
- **CSS cache-bust**: `?v=27` -> `?v=28` so browsers fetch the rewritten asset set.
- **Images**: profile.webp is WebP + eager + preloaded; remote logos already `loading="lazy"`.

## 5. Accessibility / semantics

- `<article>` + `<h3>` for role cards (landmark content).
- Native disclosure `<details>` for the FAQ (keyboard + screen-reader friendly, no JS dependency).
- New sections use semantic `<section>` + `<h2>`; no skipped heading levels introduced.

## 6. Heading hierarchy

Only one `<h1>` (hero). Section titles are `<h2>`, card titles `<h3>`/`<h4>`. No skipped levels introduced.

---

## Before / After summary

| Metric | Before | After |
|---|---|---|
| Brand-qualified target keywords in title/desc/schema | 0 | Cloud/DevOps/Platform/Kubernetes/Terraform/Cloud Architect/SRE all present |
| JSON-LD graph nodes | 3 | 8 (Person, WebSite, WebPage, ProfilePage, BreadcrumbList, Article, Organization, FAQPage) |
| FAQ rich-result eligibility | No | Yes (visible FAQ + FAQPage schema) |
| Breadcrumb rich-result | No | Yes |
| OG image-width declared (incorrect) | Yes (1200x630 on a square avatar) | No (honest image metadata) |
| Security headers | None | HSTS + nosniff + CSP + frame-options + referrer + permissions |
| www/HTTP canonical enforcement | hreflang only | hreflang + .htaccess 301 + canonical |
| Render-blocking Google Fonts request | Yes | No (preload + async swap) |
| Manifest / PWA | No | Yes |
| Sitemap image data | No | Yes |

## Manual recommendations (cannot be auto-applied)

1. **Open Graph banner image.** Create a 1200x630 PNG/WebP banner titled "Anand Vaidya — Cloud Engineer, DevOps & Platform Engineer", upload as `og-cover.webp`, and point `og:image` / `twitter:image` at it, re-adding `og:image:width=1200` / `og:image:height=630`. The current `profile.webp` is a square avatar and works but is not the ideal social card.
2. **Google Search Console.** Submit `https://anandvaidya.in/sitemap.xml`, request indexing, and run the URL Inspection tool on the homepage to confirm hreflang and JSON-LD are parsed.
3. **`www` redirect on GitHub Pages.** `.htaccess` is ignored on GitHub Pages; configure apex-vs-www preference via your DNS/registrar (apex is canonical). The `CNAME` already points to apex.
4. **Backlinks / `sameAs`.** Add canonical links from LinkedIn and GitHub back to `https://anandvaidya.in/` to reinforce entity identity (helps Google's Knowledge Graph link the Person entity to this official site).
5. **OG security:** once the banner (rec #1) exists, also reference it in the Article schema `image` if you want the Article card to use it.
6. **Hreflang note:** this is a single-language, single-region personal site; hreflang `x-default`/`en`/`en-IN` are declared for canonical consolidation only — no alternate-language pages are required.
