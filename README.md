# Anand Vaidya — Portfolio (anandvaidya.in)

Single-page portfolio for **Anand Vaidya, Azure Cloud Engineer** — serverless integrations, secure APIs,
infrastructure as code and DevOps on Microsoft Azure.

Plain HTML, CSS and JavaScript. No framework, no runtime dependencies, no third-party requests:
fonts and icons are self-hosted / inlined. Node.js is only used at build time.

---

## Project structure

| Path | What it is |
|------|------------|
| `index.html` | The homepage: semantic markup, metadata, JSON-LD, inline SVG icon sprite. Crawlable without JavaScript. Its header/footer are reused by every generated page. |
| `content/projects/*.html` | Case studies (JSON metadata + body), rendered to `/projects/<slug>/` with `src/templates/article.html`. |
| `docs/SEO.md` | Search Console setup, monitoring, authority building, how to add content. |
| `src/styles.css` | **Edit this.** Design system — tokens (dark + light), layout, components, motion. Mobile-first. |
| `src/eggs.js`, `src/eggs.css` | Optional easter-egg module (lazy-loaded, isolated). |
| `src/resume.html` | Source of `Anand-Vaidya-Resume.pdf` (one A4 page, same facts as the site). Re-render with `npm run resume` (needs a local Chrome; set `CHROME_PATH` if it isn't found) and commit the PDF — CI doesn't render it. |
| `src/case.js`, `src/case.css` | Case-study pages only: chapter navigation, interactive architecture diagrams, the scroll-linked deployment journey, the two exhibits (sync race, gateway inspector), code highlighting/copy/tabs. Loaded by `src/templates/article.html`. |
| `src/script.js` | **Edit this.** Interactions, as small independent modules (theme, nav, reveals, skills inspector, architecture explorer, terminal, contact form). |
| `styles.min.css`, `script.min.js` | Build output — don't edit by hand. |
| `fonts/` | Self-hosted variable fonts (Outfit, Space Grotesk — SIL OFL 1.1, licences included). |
| `profile.webp`, `profile-320.webp` | Portrait (450px source + generated 320px). |
| `og-cover.png`, `apple-touch-icon.png` | Generated social card (1200×630) and touch icon. |
| `favicon.svg` | Brand mark. |
| `404.html` | Custom not-found page (GitHub Pages and Apache both serve it). |
| `scripts/build-assets.mjs` | Generates the derived images (portrait, touch icon, social cards incl. one per case study in `og/`) with `sharp`. |
| `scripts/build-site.mjs` | Assembles `_site/`: copies public files, renders case studies, generates `sitemap.xml`, hashes asset URLs, optional Search Console tag. |
| `robots.txt`, `sitemap.xml`, `site.webmanifest`, `CNAME` | Crawling, PWA metadata, custom domain. (`sitemap.xml` here is a fallback; the deploy build generates the full one.) |

## Working on it

```bash
npm install          # build tools only (terser, csso, sharp, fonts)
npm run build        # src/*.{css,js} → *.min.*
npm run build:site   # build + assemble the deployable site in _site/
npm run assets       # regenerate profile-320.webp, og-cover.png, apple-touch-icon.png
npx serve _site      # preview exactly what will be deployed (case-study pages only exist in _site/)
```

## Deployment (GitHub Pages)

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):
`npm ci` → `npm run build:site` → upload `_site/` → deploy to GitHub Pages.

- Only public files are published (`scripts/build-site.mjs` lists them); `src/`, `scripts/`, docs and
  `package.json` stay in the repo but are not served.
- Cache-busting is automatic: the `?v=` on `styles.min.css` / `script.min.js` is replaced with a content hash.
- You can re-run a deployment from the **Actions** tab (**Run workflow**).

**One-time repository settings** (Settings → Pages):

1. **Build and deployment → Source:** `GitHub Actions` (not "Deploy from a branch").
2. **Custom domain:** `anandvaidya.in`, then tick **Enforce HTTPS** once the certificate is issued.
   With Actions deployments, this setting (not the `CNAME` file) decides the domain.
3. DNS at your registrar (already in place if the site works today): apex `A` records to
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` and a `www` `CNAME`
   to `anandvaidyaa.github.io` — GitHub then redirects `www` to the apex.

## How the page works

- **Sections:** Hero · About · Skills (layered stack + inspector) · Architecture lab · Experience ·
  Projects (case studies) · Credentials · FAQ · Terminal · Contact.
- **Themes:** dark and light token sets on `:root[data-theme]`. An inline script in `<head>` picks the saved
  choice, else the OS preference, before first paint (no flash). The toggle saves the choice in `localStorage`.
- **Motion:** CSS for entrances and ambient motion (transform/opacity only, composited); IntersectionObserver
  for reveals; one rAF-throttled scroll listener for the progress bar, timeline and parallax. Ambient motion
  starts after `load` and pauses when off-screen. `prefers-reduced-motion` turns it all off.
- **Architecture lab:** HTML buttons positioned over a generated SVG; two layouts (wide / phone) chosen by
  container width; keyboard arrows move between nodes. It is labelled illustrative on the page.
- **Performance:** below-the-fold sections use `content-visibility: auto`; in-page links are handled by
  `scrollToId()` in `src/script.js`, which re-measures after lazy sections render so anchors land correctly.
- **Glass materials:** `.glass` plus a modifier (`--dark`, `--iris`, `--crystal`, `--frost`, `--holo`) in `src/styles.css` (Phase 3 section).
- **Hero sculpture:** pure CSS 3D + SVG (`.sculpture`), tilted by `--px/--py` set from the pointer in `initHero()`.
- **Living Topology (signature sculpture):** `initTopology()` in `src/script.js`. Scene states and cameras are in `topoStates()` / `topoCamera()`; the scene order is `TOPO_SCENES` (section ids). Case studies show the same blossom as an emblem. The recurring fragment (one shard that escapes the hero and returns at contact) is `topoFragment()`; project frame shapes are `CASE_MASKS`. Case studies carry the same language in `src/case.js` (`initMembranes`, `initFrost`, `initCompanion`).
- **Cursor:** `initCursor()` in `src/script.js`; only for a mouse with motion allowed (the native cursor stays).
- **Easter eggs ("hidden rooms"):** `src/eggs.js` + `src/eggs.css`, loaded lazily by `loadEggs()` in `src/script.js` and safe to delete. Ten secrets plus a finale — the full list and how to trigger each one is in `CHANGELOG.md`. Spoilers live there, not on the site.
- **Without JavaScript:** everything is visible; the architecture diagram falls back to a list with all details.
- **Contact form:** there is no backend. It validates, then opens the visitor's mail client with the message
  pre-filled and says so. For delivery without a mail client, point the form at a service like Formspree.

## Content rules

Every claim on the page comes from Anand's real experience. Metrics in the case studies are the ones Anand
provided; diagrams are labelled as simplified or illustrative. When editing, keep `index.html`, the terminal
commands in `src/script.js` (`COMMANDS`) and the JSON-LD in sync.

## Hosting & SEO

- Canonical URL: `https://anandvaidya.in/` (apex, HTTPS). `CNAME` points GitHub Pages at the apex.
- GitHub Pages handles HTTPS, `www` → apex redirects and compression. Security headers can't be set there, so the
  Content-Security-Policy is a `<meta>` tag in `index.html`, `404.html` and `src/templates/article.html` — keep them in sync.
- After deploying: submit `https://anandvaidya.in/sitemap.xml` in Google Search Console (Domain property),
  request indexing of the homepage, and check the share card with LinkedIn's Post Inspector.

## Licence & contact

Content © Anand Vaidya. Fonts: SIL Open Font License 1.1 (see `fonts/`).
Contact: [anand.svaidya24@gmail.com](mailto:anand.svaidya24@gmail.com)
