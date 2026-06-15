# Anand Vaidya — Personal Portfolio (Static Single-Page Site)

This repository contains a single-page static portfolio for Anand Vaidya. It is built with plain HTML, CSS, and JavaScript and focuses on a small, fast, and interactive front-end experience suitable for deployment to any static hosting service.

Workspace root (your environment):

- C:\Users\anand\source\repos\anandvaidyaa\my-website

Summary of what is in the repo

- index.html — complete, self-contained single page. All visible content, SEO meta, JSON-LD, sections, and component markup live here.
- styles.min.css — minified stylesheet. Uses CSS variables for theme colors, typography and responsive layout.
- script.min.js — minified client-side JavaScript that powers the interactive features: preloader, typed hero text, custom cursor, telemetry mockups, terminal simulation, timeline animation, pipeline simulations and contact form UI.
- .gitignore — common ignores for editors, build artifacts and OS files.
- README.md — this file (expanded, detailed project documentation).

Other assets referenced from index.html (check repo root or remote CDN):

- profile.webp — hero/profile image (preloaded for LCP)
- favicon.svg — site icon
- External assets: Google Fonts and Boxicons are loaded from CDN.

Project intent and behavior

- Intent: lightweight, fast single-file portfolio with advanced UI polish (animations, dashboard mockups) and strong SEO metadata.
- Behavior: everything runs client-side. The contact form provides a UI/UX flow but does not implement a server-side mailer. The simulated terminal and telemetry dashboards are purely client-driven for presentation purposes.

Detailed breakdown of key files and important code areas

- index.html
  - Head section: meta description, keywords, Open Graph, Twitter/X cards and JSON-LD Person + Website + ProfilePage graph.
  - Performance: preloads hero image (profile.webp), preloads styles.min.css and script.min.js; uses font preconnect and deferred stylesheet loading pattern (media=print onload) for fonts and boxicons.
  - Sections: hero, metrics, about, experience (timeline), projects (pipeline simulation), education, contact, footer and back-to-top.
  - Accessibility: aria-labels on nav items, buttons and form elements; images include alt attributes. Review color contrast for WCAG compliance if needed.

- styles.min.css
  - Theme variables in :root (dark-mode defaults). Light mode is applied via body.light-mode.
  - Utility classes for glass cards, badges, and responsive grid. Most visuals are driven entirely in this file.
  - If you need to modify styles during development, replace the minified file with an unminified source, or use a local formatter to make edits easier.

- script.min.js
  - Interactive features implemented:
    - Mobile-aware custom cursor (disabled on touch devices)
    - Preloader boot log sequence and hero reveal
    - Typed role effect in hero
    - Reveal on scroll with IntersectionObserver (reveal and staggered reveals)
    - Timeline progress calculation and project pipeline simulation
    - Mini telemetry/dashboard canvas charts and event stream
    - Terminal emulator UI in hero (command history, fake commands like neofetch/about/skills)
    - Contact form: client-side UI that opens mailto: on submit — no backend included
  - Tips: the JS uses many querySelector lookups; when editing, keep element IDs/classes in sync with index.html.

Local development and preview (Windows PowerShell)

1) Quick preview (no server):
   - Open index.html directly in your browser (suitable for basic checks). Some browsers block preload/fetches or service-like behaviors when opening file:// — prefer a local server.

2) Simple HTTP server (recommended):
   - Open PowerShell and run:
     cd C:\Users\anand\source\repos\anandvaidyaa\my-website
     python -m http.server 8000
   - Visit http://localhost:8000

3) Visual Studio / Visual Studio Code
   - You can use Live Server in VS Code or the built-in static site preview in VS 2026. Ensure working directory is repository root.

Editing workflow suggestions

- If you plan to do frequent edits to styles or JS, consider maintaining unminified source files (styles.css, script.js) and adding a small npm toolchain (prettier, terser) to build minified artifacts for production.
- To change text or add sections: edit index.html directly. Keep IDs, classes and data attributes intact for script to continue working.
- To replace hero image: place new file at profile.webp (or update index.html reference) and keep dimensions similar for best LCP.

Performance and SEO notes (what's already implemented and what you can improve)

- Implemented:
  - Meta description, keywords, Open Graph, Twitter card and JSON-LD for Person/ProfilePage — good for search engine result pages and social previews.
  - Preload of hero image and critical assets to improve Largest Contentful Paint (LCP).
  - Defer non-critical font CSS using media=print onload pattern.

- Suggested improvements:
  - Add a small critical inline CSS block for above-the-fold styles to further reduce render-blocking.
  - Add properly sized responsive images (webp/jpg) and srcset for multiple device widths.
  - Provide a sitemap.xml and robots.txt if you publish on a domain.

Accessibility & internationalization

- The document contains ARIA labels and alt text. Recommended next steps:
  - Run Lighthouse (Accessibility audit) and fix contrast and keyboard focus paths.
  - Ensure form controls have explicit labels associated with inputs (index.html uses floating labels; verify screen-reader behavior).

Deployment options (minimal steps)

- GitHub Pages (recommended for simple publishing):
  - Push repo to GitHub (origin already set to https://github.com/anandvaidyaa/my-website).
  - In repo settings, enable Pages to serve from branch main / root folder.
  - Optional: add CNAME for custom domain and configure DNS.

- Netlify or Vercel: connect the repo and deploy as a static site. Set publish directory to repository root.

CI/CD example (GitHub Actions) — brief outline (add .github/workflows/deploy.yml if you want automated deploys):

- Use actions/checkout and a Pages or Netlify action to publish the repo on push to main. Keep build step empty unless you introduce a toolchain.

Troubleshooting

- If fonts or icons don't load: confirm network access to fonts.googleapis.com and unpkg CDN.
- If the hero image does not show: ensure profile.webp exists in repo root or update the URL in index.html.
- Contact form doesn't send emails: expected — the form uses mailto: or a UI overlay. Add a server endpoint or use a service (Formspree, Netlify Forms, or serverless function) to forward messages.

Security and privacy

- No secrets should be committed. Remove any real credentials before sharing.
- JSON-LD contains a public email and phone number intentionally — remove or obfuscate if you prefer to avoid scraping.

Next recommended improvements (roadmap)

1. Add unminified source files (styles.css, script.js) and a small npm-based build step for easier edits and source control readability.
2. Add a lightweight CI that validates HTML and runs Lighthouse audits on pull requests.
3. Provide a serverless endpoint for contact form submissions (Azure Functions or Netlify Functions) and protect with CAPTCHA or rate-limiting.
4. Add a LICENSE file (e.g., MIT) if you want to allow reuse.

Contact & support

- Author: Anand Vaidya
- Email: anand.svaidya24@gmail.com
- GitHub: https://github.com/anandvaidyaa

If you want, I can add a sample GitHub Actions workflow for automatic GitHub Pages deployment or add unminified source files and a simple npm build script. Tell me which you'd prefer.
