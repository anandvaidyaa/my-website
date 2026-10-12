# CHANGELOG — Anand Vaidya Portfolio (anandvaidya.in)

## 2026-10-12 (7) — Cinematic case studies

The homepage's motion language now carries through the three case studies. As on the homepage, every moment is set by the scroll position, so it replays in reverse.

- **Opening:** the blossom emblem folds through itself as the opening scrolls away and shows its warm inner surface. The opening tilts back into depth as the story begins.
- **Chapter headings:** each heading opens through the glass-membrane mask used for the homepage's About heading.
- **Exhibits wait behind frosted glass:** architecture diagrams, simulations, code and before/after comparisons. The glass opens in the project's own shape, with a luminous band along the edge:
  - orders: a faceted wedge (channels converging);
  - pipeline: four stages promoted in turn;
  - API gateway: doors parting from a checkpoint slit.
- **The frost is an overlay, not a clip on the exhibit:**
  - Clipping the exhibit itself would hide it from the observers that wire it up lazily.
  - It ignores the pointer, and keyboard focus inside an exhibit clears it.
  - Each exhibit opens by mid-screen, or by the furthest point it can scroll to near the page end.
- **The runaway shard (wide screens):** it keeps your place in the chapter list. It rests beside the chapter you are reading, then hops to the next one with a small overshoot and a spin.
- **On phones**, the frost is tinted, not blurred, so it stays cheap.
- **Under reduced motion**, there is no frost, mask, companion or fold.
- **Code:** `initMembranes`, `initFrost` and `initCompanion` in `src/case.js`; styles under "Cinematic layer" in `src/case.css`.

**Tested:**
- Case studies 64/64; new case-study cinematic checks 15/15. They cover:
  - identical states down and back up;
  - everything open after reading;
  - focus clears the frost;
  - the frost ignores the pointer;
  - reduced motion.
- Simulations 11/11, three runs in a row. The test now scrolls instantly and waits for the position to settle; with CSS smooth scrolling it had been tapping the simulation off-screen in both the old and new builds.
- SEO 53/53, functional 46/46 (one intermittent miss on the nav scroll timing, which passed on rerun), homepage motion 23/23 and cinematic 8/8.
- axe: 0 violations on all case studies, both themes, 375 and 1366 px.

## 2026-10-12 (6) — Cinematic scroll pass

Scroll position now drives a continuous story across the homepage, not just entrance animations. Every moment is deterministic: the same scroll position always gives the same picture, so scrolling up replays it in reverse.

| Moment | What happens |
|---|---|
| Hero | The shards tremble and gather, and a luminous contour traces the sculpture. Four letters of the name come loose: one lifts off the baseline, one sinks, one stretches, one turns to outline. Then they fall back into line. The blossom folds through itself, so its silhouette twists and a warm inner surface shows. One shard pulls back, then escapes off the right edge, and the HUD reports `shard-03 detached`. The whole opening folds back into depth as About arrives. |
| About | The escaped shard re-enters from the left, overshoots its place, stops, looks around, turns back and settles as a new shape. The section label is tugged along as it passes, then snaps back. The heading opens through a membrane-shaped mask. |
| Into skills | Staged: the membranes peel away, the form slides into the margin, inner paths stretch into a network, nodes light one at a time, and the paths fill as glass again. |
| Experience | As the timeline's line reaches each milestone, the card opens from the rail side, corner brackets draw around it (all four corners for the current role), the responsibilities branch from one stem, and the year turns from outline to glass. |
| Projects | The shard arrives early at the first project's frame and waits, and the frame opens from it. Each frame opens in a shape that fits its subject: a faceted wedge for the order platform (channels converging), four stages promoted in turn for the deployment pipeline, a checkpoint slit for the API gateway. Titles have their own entrance: words close ranks, step up in discrete stages, or stay an outline until let through. |
| Contact | The shard returns, is pushed back once by the monogram, lines itself up and slots in as its keystone. |

Also:
- On wide screens, supporting content arrives through a slanted glass edge instead of a fade-up.
- The satellite "runaway" on first scroll is retired; the fragment is now the hero's incident (the satellite still responds to clicks).
- The unused About prism styles are removed.

**Under the hood:**
- `topoFragment()`, `topoFold()` and `topoWake()` live in `src/script.js`, and `CASE_MASKS` holds the project frame shapes.
- Project frames are measured on their untransformed container. Measuring the tilting lens lagged a frame, and Chrome's IntersectionObserver reports a fully clipped element as off-screen, which stalled a frame's scene.
- Under reduced motion, there is no fragment, mask, clipping or loose letter, and all content shows immediately.

**Creative-director pass — weakest moments fixed:**
1. The escape left through the top, hidden under the header. It now crosses to the right edge in screen space and comes forward as it goes.
2. The membrane heading had fully opened before it was seen. Its growth now starts small and accelerates.
3. Midway into skills, tangled petals covered the principles text. That transition is now staged.
4. On phones, the shard waited over project text. It now arrives just in time at the frame corner.

**Tested:**
- Functional 46/46, easter eggs 56/56, SEO 53/53, motion 23/23 (no overflow at 320–1920 px), case studies 64/64, recruiter 24/24, simulations 11/11.
- New cinematic checks 8/8: identical states scrolling down and back up, fragment presence, rest state, frames fully open after reading, deep links, phone, reduced motion.
- axe: 0 violations (homepage and case studies, both themes, 375 and 1366 px).
- Scroll frame times: desktop median/p95 16.7/16.8 ms; phone at 4× CPU 16.7/16.8 ms, with 2 of 252 frames over 50 ms.
- Lighthouse mobile, alternating against the previous build in the same session: before 85–90 (TBT 250–380 ms), after 85–89 (TBT 310–390 ms). LCP 2.0–2.2 s, CLS 0. Desktop 96–99.

## 2026-10-12 (5) — Living Topology

A signature sculpture for the whole homepage: five folded glass ribbons (`initTopology()` in `src/script.js`, styles under "Living Topology" in `src/styles.css`). Each ribbon is a cubic spine with a width that twists through zero — that is what folds it. Scroll position picks the scene and how far it has progressed, and the spines, widths and fold counts are interpolated between states, so the silhouette genuinely changes shape and every scroll position maps to exactly one picture (it reverses when scrolling up).

| Scene | State |
|---|---|
| Hero | **Emergence** — a compact folded blossom crowning the portrait; contours trace in, then the membranes fill |
| About | **Expansion** — the folds open around the glass ID card; one shard misses its slot and clicks in |
| Skills, architecture | **Branching** — ribbons thin into paths between nodes, with signals (in the right margin) |
| Experience | **Trajectory** — one route with milestones along the edge |
| Projects | **Fragmentation** — twisted shards frame the gallery from the page edges |
| Decisions … console | **Stillness** — small and quiet |
| Contact | **Convergence** — the ribbons draw the logo's "A" and ring, with the runaway satellite in orbit around it |

Material: smoked-glass gradient membranes, spectral edge light, a sheen and a light pulse that travel with the story, fine luminous spines. Generic decoration it replaces: the spinning torus and wireframe in the hero, the prism in About, the glass sphere at contact. Case studies carry the blossom as a quiet emblem in their openings. Reduced motion: one still picture in the opening. Decorative only (`aria-hidden`, no pointer events).

**Creative-director pass — three weakest moments:** (1) the hero blossom hid behind the portrait → enlarged so the petals crown it; (2) the branching scene drew long strokes across the skills intro → moved into the right margin, thicker and quieter; (3) projects' shards floated over body text → moved to the page edges. Also: the contact monogram was faint and collided with the heading → bolder, smaller, placed clear inside the orbit.

**Tested:** functional 46/46, easter eggs 56/56, SEO 53/53, motion 23/23, case studies 64/64, recruiter 24/24, simulations 11/11 (10/11 on one run: a carrier click didn't register; rerun clean); axe 0 violations (homepage and case studies, both themes, 375 and 1366 px); no horizontal overflow; no console errors. Lighthouse same-session A/B, homepage mobile: 82–85 before → 88–91 after (desktop unchanged). Scroll frame times: desktop median/p95 16.7/16.8 ms; phone at 4× CPU 16.7/33.4 ms, 2 of 252 frames over 50 ms.

## 2026-10-12 (4) — Production-readiness audit

Full report with evidence, the claim-by-claim table and open questions for the owner: [`docs/AUDIT-2026-10-12.md`](docs/AUDIT-2026-10-12.md).

- **Accuracy:** every metric traced to the owner's own June 2026 commits; wording aligned with what he wrote ("zero-downtime releases enabled", "manual configuration errors eliminated"); figures labelled as reported outcomes on project cards, in the quick view and on every case study; Azure Functions idle cost qualified by hosting plan (7 places); the illustrative architecture's Bicep scope stated; Azure AD B2C's current status noted.
- **Case studies:** a "My part in this project" panel near the top of each; the gateway inspector now covers 200, 401, 403, 429 and a carrier 503, each failing at the right layer; both exhibits say they are frontend simulations; the YAML fragment authenticates through `AzureCLI@2` and is labelled conceptual.
- **Fixes:** homepage JSON-LD `datePublished` (2024 typo → 2026-06-13); stacked project card layout.
- **Tested:** functional 46/46, easter eggs 56/56, SEO 53/53, motion 23/23, case studies 64/64, recruiter 24/24, simulations 11/11; axe 0 violations everywhere tested. Lighthouse same-session A/B: no regression (homepage mobile 87–92, case studies 94–99, desktop 97–99).

## 2026-10-12 (3) — Recruiter quick view, résumé, engineering decisions

An audit against the full brief showed most of it already in place (cinematic hero and scroll system, case studies, architecture explorer, terminal with `sudo hire anand`, ten easter eggs with a finale, 404 portal). This round adds what was missing.

- **Recruiter quick view:** a 30-second profile in a native modal dialog — summary, roles and dates, core skills, selected work with verified outcomes, credentials, and links. Opens from "Résumé" in the header (desktop), "Recruiter? 30-second profile" in the hero, and the mobile menu, on the homepage and every case study. Focus is trapped and returned; Esc or the backdrop closes it. Without JavaScript the buttons are hidden and the same facts stay on the page.
- **Résumé download:** `Anand-Vaidya-Resume.pdf`, one A4 page generated from `src/resume.html` with the same verified facts as the site (`npm run resume`). Linked from the quick view, the contact cards and the footer (all work without JavaScript).
- **Inside my engineering mind:** a new section with four architecture decision records (event-driven vs scheduled sync, identities vs stored secrets, templates as the source of truth, one gateway for every carrier). Each shows the context, constraints, the options on the table (rejected ones struck through, the chosen one lit), the decision, the trade-off accepted and the outcome, with links to the evidence. Native `<details>`, so it works by keyboard and without JavaScript. Only documented options and outcomes are used.
- **Business card** also opens by double-clicking the logo or the footer name (on every page).

**Creative-director pass — the three weakest moments:** (1) the contact section ended the journey on a plain grid → the hero's runaway satellite is back in orbit around a glass core ("sat-01 · back in orbit ✓"), animated only while in view; (2) case studies didn't carry the homepage's signature → a tiny satellite now orbits each case study's status light, and the cloud mascot peeks over the next-case card; (3) adding the résumé card left "Location" orphaned → it now spans the row.

**Fixes found in testing:** reveals now also trigger for content a fast scroll jumps past (the observer watches one viewport above the screen), so nothing stays invisible when scrolling back up; the outlined words in the skills band now have 3:1 contrast.

**Tested:** new recruiter/decision suite 24/24 (résumé served and one page, quick view by header/hero/menu with focus handling, Esc and backdrop close, decision records by keyboard with screen-reader labels, business card from the logo, no-JavaScript fallbacks, no overflow at 1280 px on every page); 46/46 functional, 56/56 easter-egg, 53/53 SEO, 23/23 motion, 64/64 case-study checks; axe-core 0 violations on the homepage, the open quick view, open decision records and all case studies (both themes, 375 and 1366 px). Lighthouse 12 (local): homepage mobile 86–90, desktop 99; case studies mobile 99, desktop 99; CLS 0; accessibility, best practices and SEO 100.

## 2026-10-12 (2) — Case studies as interactive engineering stories

All three case-study pages (`/projects/<slug>/`) rebuilt on a shared case-study design system (`src/case.css`, `src/case.js`, loaded only on those pages). Same facts as before: nothing new is claimed; anything illustrative is labelled as such.

**Shared system:** per-project accent; an opening with an oversized masked title, metadata strip, project-specific hero visual, outcome strip and a witty status line; chapters with outline numbers that fill as you read, lighting that changes per chapter, a sticky chapter navigation with per-chapter progress (a chip row on small screens); before/after bars drawn to scale; decision cards with trade-off panels; results with count-ups; a premium code block (highlighting, copy, keyboard-scrollable, tabs); next-case cards. Built from `content/projects/*.html` (hero slot + `<section class="chapter">` blocks) by `scripts/build-site.mjs`.

**Architecture diagrams:** real buttons laid out from data, edges drawn as animated SVG with directional packets, click/keyboard details (arrows to move, Esc for the overview), "Show everything", a separate small-screen layout, and a readable list without JavaScript. On desktop the diagram is sticky and assembles in story order as each step reaches the middle of the screen (and rewinds when you scroll back); on phones it plays its steps once when it appears.

**One signature interaction per page:**
- Orders — *the sync race*: sell the last unit on Shopify and watch the old scheduled sync oversell on Amazon, then the event-driven design update every channel in under two seconds.
- Pipeline — *the deployment journey*: a release capsule travels commit → build & test → Bicep → staging → approval → production, tied 1:1 to the scroll; environment "drift" cards straighten into one template.
- Carrier — *the gateway inspector*: send a label request with or without an OAuth token and watch the gateway validate, throttle and route it (or reject it with a 401 before any carrier is called), then the tracking webhook arrive.

**Creative-director pass — the three weakest moments:** (1) scrolly steps were tall, mostly empty boxes and faded with opacity → editorial steps with a lit rule and colour-only emphasis (also fixes contrast); (2) the inspector used the page accent for both pass and fail and went quiet mid-run → green passes with ✓, rejected failures, a running commentary; (3) on phones the opening had no visual until after a full screen of text → the visual now sits between the lede and the metadata.

**Performance work:** the first version regressed mobile Lighthouse from 100 to 84–92 (same machine). Fixed by rendering off-screen chapters lazily (`content-visibility`), deferring all measurement to animation frames, wiring diagrams/journey/code only as they approach, starting hero animations after load (and pausing them off-screen), and animating only transforms (masked title, capsule). Also: Chrome's IntersectionObserver treats a fully clipped element as invisible, so reveals no longer use `clip-path` on observed elements.

**Tested:** new case-study suite 64/64 (no overflow at 320–1920 px on every page, story-order assembly and rewind, keyboard on diagrams, focus styles, journey both directions, code highlight/copy/tabs including a hidden tab, full reveal after fast scrolling, reduced motion, no-JavaScript fallbacks, phone autoplay); axe-core 0 violations on all three pages in both themes at 375 and 1366 px with a node selected and an exhibit run; 53/53 SEO, 46/46 functional, 56/56 easter-egg, 23/23 homepage motion checks; no JS errors. Lighthouse 12 (local): case pages mobile 95–99, desktop 100; LCP 1.7 s mobile; CLS ≤ 0.014; accessibility, best practices and SEO 100.

## 2026-10-12 — Cinematic scroll motion

One motion language: things emerge from behind a physical edge (masks and wipes), depth is shown by speed (near layers move faster than the page, far layers slower), and the lighting follows the story. No new dependencies.

**Motion system** (`initScroll` in `src/script.js`): one passive scroll listener, at most one animation frame per tick. Each scene is measured only near the viewport, reads happen before writes, and only transforms, opacity and leaf custom properties are written. Progress follows the scroll position 1:1 (no smoothing), so scrolling back up plays everything in reverse.

- **Hero exit:** the two lines of the name part like a curtain from the first scroll while the outline echo falls behind; the sculpture lags and turns away; the HUD and sticker (foreground glass) travel fastest.
- **Signature moment — the runaway satellite:** on the first scroll the satellite falls off its orbit, tumbles, fires its thrusters (a small particle puff) and snaps back. The orbit glows magenta meanwhile and the HUD reports "sat-01 off orbit → thrusters · correcting → orbit restored ✓". Runs again only after a return to the top and a 12 s pause.
- **Signature type reveal:** headings rise line by line from a mask with a slight tilt; emphasised words arrive as outlines and then fill. Project titles now use it too.
- **About:** the outline word fills in with scroll; a glass prism behind the ID badge drifts the wrong way, then settles.
- **Skills:** a bus line runs down the stack and lights each layer (L1–L6) as it reaches it; chips arrive one after another.
- **Experience:** a comet rides the tip of the timeline and lights each milestone as it passes; cards swing up into place.
- **Projects:** frames hang in a lens that swings in, flattens at centre stage and tips away (hover straightens it); a slanted wipe reveals each frame from the side it sits on; diagrams assemble (components, then connections); the project number fills from the bottom; each project tints the room in its colour; parts of a project arrive in sequence instead of one block fade.
- **Featured project (desktop):** as Problem → Architecture → Key decisions reach the middle of the screen, the diagram beside them highlights the matching components, with a small stage label. Mobile keeps a plain scrolling layout.
- Reduced motion: no scroll-linked transforms, no satellite runaway, everything visible at once; progress indicators still update.

**Fixed along the way:** the `spin` keyframes had gone missing, so the torus, polyhedron and stamp were static; the hero's background parallax no longer re-anchors the glow blobs (would have caused layout shift); the new sculpture wrapper passes pointer events through, so double-clicking the portrait still opens the business card.

**Creative-director pass — the three weakest moments of the first version:** (1) the name split happened after the name had left the screen → now starts on the first scroll; (2) the satellite incident was too subtle → bigger path, tumble, thruster puff, glowing orbit; (3) each project faded in as one block, muddying its own reveals → parts arrive in sequence, with delays short enough that a deep jump never shows an empty screen.

**Tested:** 46/46 functional, 56/56 easter-egg, 53/53 SEO checks; axe-core 0 violations (homepage and case study, both themes, 375 and 1366 px); a new 23-check motion suite (no horizontal overflow at 320/360/390/430/768/1024/1440/1920 px while scrolling through every scene, hero returns to rest on scroll-up, project lens follows scroll both ways, reveals settle after fast scrolling, timeline milestones lit, featured-project stages, keyboard reach and focus ring on project links, reduced-motion behaviour); no JS errors. Lighthouse 12 (same machine, same day): mobile performance 85–87 vs. 85–89 for the previous build, desktop 98–99; CLS 0; accessibility, best practices and SEO 100.

## 2026-10-11 (4) — Hidden rooms (easter eggs)

New isolated module `src/eggs.js` + `src/eggs.css`, lazy-loaded on the first interaction (or ~7 s after load); keys pressed before it arrives are replayed from memory. No network requests, no analytics; only the list of found secrets is kept in `localStorage` (in-memory fallback).

| Secret | How to find it |
|---|---|
| Developer mode | Type `anand` anywhere (not in a form field) |
| Chaos mode (12 s) | Konami code: ↑ ↑ ↓ ↓ ← → ← → B A |
| The cloud's guardian | Pet the cat peeking over the contact form (5 pets: a constellation) |
| Hidden terminal | Ctrl + Shift + K (⌘ + Shift + K on macOS), or click the secrets counter |
| The constellation | In the FAQ column: connect API Management, Azure Functions and Bicep |
| Holographic business card | Double-click (double-tap) the hero portrait or the About ID badge, or `card` in the hidden terminal |
| Name glitch | Click the big name three times quickly |
| Reverse gravity | Click (or Enter) the large crystal in the hero sculpture |
| Coordinates | Click the `loc` line in the hero HUD |
| Control plane | Type `cloud`, click the footer cloud, or `cloud` in the page terminal |

- Discovery toasts and a "Secrets discovered: X / 10" counter (appears after the first find); `reset` in the hidden terminal starts over.
- Finding all ten plays the architect's signature (replay: `signature` in the hidden terminal).
- Also: a note for people who scroll to the very bottom, and a 404 "lost dimension" with a portal that warps home (real 404 status kept).
- Shortcuts ignore form fields and modifier combos; every overlay is a native `<dialog>` (focus trap, Esc to close, focus returned); reduced motion gets static versions.

**Tested:** 56/56 easter-egg checks (every activation, Esc/close, persistence, reset, form-field isolation, reduced motion, 320/375/390/768/1024 px, 404 status + portal), 46/46 functional, 53/53 SEO, axe-core 0 violations (page and open dialogs, both themes). Lighthouse with the module deferred: accessibility, best practices, SEO 100; performance unchanged within run-to-run noise.

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
