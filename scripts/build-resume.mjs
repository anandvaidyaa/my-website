// Renders src/resume.html to Anand-Vaidya-Resume.pdf (A4) with a local Chrome.
// Run via `npm run resume` after changing the résumé or the facts it mirrors in index.html.
// Not part of the CI build (CI has no browser): the PDF is committed, like the share images.
//   CHROME_PATH=/path/to/chrome npm run resume
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import puppeteer from "puppeteer-core";

const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium"
].filter(Boolean);
const executablePath = candidates.find((p) => existsSync(p));
if (!executablePath) throw new Error("No Chrome found — set CHROME_PATH");

const browser = await puppeteer.launch({ executablePath, headless: "new" });
const page = await browser.newPage();
await page.goto(pathToFileURL(resolve("src/resume.html")).href, { waitUntil: "networkidle0" });
await page.evaluateHandle("document.fonts.ready");
await page.pdf({ path: "Anand-Vaidya-Resume.pdf", format: "A4", printBackground: true, preferCSSPageSize: true, tagged: true });
const pages = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight / 1122));
await browser.close();
console.log(`Anand-Vaidya-Resume.pdf written (~${pages} page${pages > 1 ? "s" : ""} of A4 content)`);
