# Anand Vaidya — Enterprise Cloud Portfolio

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Status: Production](https://img.shields.io/badge/Status-Production-success)
![Tech Stack: HTML/CSS/JS](https://img.shields.io/badge/Tech-Vanilla_HTML_CSS_JS-orange)

A highly polished, ultra-performant single-page developer portfolio tailored specifically for a **Cloud Integration Engineer and Azure Specialist**. 

This project completely eschews heavy modern frameworks (like React, Vue, or Next.js) in favor of **Vanilla HTML, CSS, and JavaScript**. This guarantees absolute maximum performance, instantaneous load times, and a deeply customized, native-feeling User Experience (UX). 

The visual design language is heavily inspired by **Azure Portal, Linear, and Apple Vision Pro**, incorporating glassmorphism, dynamic 3D architecture diagrams, telemetry dashboards, and a custom GPU-accelerated cursor engine.

---

## 🏗️ Project Architecture & File Structure

The entire application runs entirely client-side and is built to be hosted on any static edge network (GitHub Pages, Netlify, Cloudflare Pages, etc.).

| File | Purpose & Analysis |
|------|---------------------|
| **`index.html`** | The core skeleton. Contains all semantic markup, highly optimized SEO metadata (including JSON-LD Structured Data), and the structural definitions for the telemetry dashboards, timeline, and 3D architecture elements. |
| **`styles.min.css`** | The complete design system. It handles CSS variables for theme switching (forced dark mode by default), responsive flexbox/grid layouts, glassmorphism filters, keyframe animations for the data pipelines, and hardware-accelerated transforms (`translate3d`) for 3D elements. |
| **`script.min.js`** | The interaction engine. Bundles all interactive logic including the IntersectionObservers for scroll reveals, the simulated terminal typing effects, the telemetry counters, and the embedded **Premium Custom Cursor Engine**. |
| **`profile.webp`** | Hero/profile image, heavily compressed and preloaded for optimal Largest Contentful Paint (LCP) scoring. |
| **`.htaccess`** | Apache configuration for caching static assets and enforcing security headers. |
| **`robots.txt` / `sitemap.xml`** | Essential SEO routing files ensuring web crawlers properly index the portfolio. |

---

## ✨ Core Features & Technical Highlights

### 1. Ultra-Optimized Custom Cursor Engine
The project features a custom-built, Apple/Linear-inspired "Glass Orb" cursor.
- **GPU Accelerated:** Uses pure `transform: translate3d(x, y, 0)` updated inside a `requestAnimationFrame` loop to guarantee silky smooth 60 FPS without layout thrashing.
- **Magnetic UX:** Snaps to interactive elements (buttons, links) with a subtle gravitational pull, providing premium tactile feedback.
- **Mobile-Aware:** JavaScript strictly evaluates touch interfaces and immediately terminates the cursor engine on mobile devices to save battery and processing power.

### 2. 3D Architecture & Telemetry Mockups
To visually demonstrate cloud engineering skills, the portfolio includes embedded interactive UI modules:
- **Interactive Architecture Diagram:** A CSS-driven representation of an event-driven Azure architecture (APIM ➔ Functions ➔ Cosmos DB) complete with glowing, animated data packets flowing through vertical and horizontal connection lines.
- **Simulated Terminal:** A typing effect that mimics a PowerShell/Bash terminal running Azure CLI diagnostics.
- **Live Metric Dashboards:** IntersectionObserver-triggered counters that simulate server telemetry.

### 3. Absolute SEO & Performance Mastery
- **JSON-LD Structured Data:** Embeds `@type: Person` and `@type: ProfilePage` directly into the DOM so Google creates a Rich Snippet for the profile.
- **Hardcoded Dark Mode:** Injects an override script directly into the `<head>` of the HTML to force `localStorage.setItem('theme', 'dark')` before the page even begins to paint, entirely eliminating flash-of-white (FOUC).
- **Zero Dependencies:** No jQuery, no Tailwind, no React. 

### 4. Smart Interactive Elements
- **Google Maps Integration:** The location card (Vadodara, Gujarat, India) is an active `<a>` tag that instantly opens a precise Google Maps pin in a new tab.
- **Skill Hover States:** Clicking/hovering over Azure skill tags triggers a dynamic UI overlay providing deep-dive explanations of the specific technology.

---

## 🚀 Local Development & Deployment

Because this is a vanilla static site, no `npm install` or build steps are required to run it locally.

### Running Locally
1. Clone the repository.
2. Open a terminal in the root directory.
3. Start a simple web server (e.g., Python or Node):
   ```bash
   python -m http.server 8000
   # OR
   npx serve .
   ```
4. Navigate to `http://localhost:8000`.

### Deployment Instructions
This project is perfectly optimized for free static hosting tiers:
- **GitHub Pages:** Go to Settings -> Pages -> Deploy from Branch (`main` / `root`).
- **Cloudflare Pages / Netlify / Vercel:** Simply connect your GitHub repository and set the build command to empty, and the output directory to the root `/`.

---

## 🎨 Editing Guide (For Future Updates)

- **Changing Colors:** Open `styles.min.css` and modify the `:root` variables (e.g., `--accent`, `--bg-color`).
- **Updating the Architecture Layout:** The connection lines in the "Experience" section use `flexbox` overrides (`justify-content: center !important`). To add new nodes, just copy an existing `<div class="arch-node">` block in `index.html`.
- **Modifying the Cursor:** The cursor logic is tightly packed at the absolute bottom of `script.min.js`. Look for the `Premium Apple/Linear-inspired GPU Accelerated Cursor` comment block.

---

## 🛡️ License & Authorship

- **Author:** Anand Vaidya
- **Role:** Cloud Integration Engineer & Azure Specialist
- **Location:** Vadodara, Gujarat, India
- **Contact:** [anand.svaidya24@gmail.com](mailto:anand.svaidya24@gmail.com)

*Built with raw HTML, CSS, JavaScript, and an obsession for performance.*
