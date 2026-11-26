/**
 * Retakes every picture in the README and docs/STUDIES.md from the running
 * site: the README's cover (the top of the index page), and each live study's
 * canvas, panels hidden, in the view named by its `preview` hash.
 *
 *   npm run build && npm start          # in one terminal
 *   npm run docs:shots                  # in another
 *
 * Options
 *   --base http://localhost:3000        where the site is running
 *   --only revelation-chiasm            one picture: a study's slug, or "cover"
 *
 * Uses the installed Google Chrome; set CHROME_PATH to use another Chromium.
 */
import path from "node:path";
import { chromium } from "playwright-core";
import { STUDIES } from "../../src/studies/registry";
import { COVER_IMAGE, liveOf, previewImagePath } from "./catalogue";

const root = path.resolve(import.meta.dirname, "../..");

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const base = (arg("base") ?? "http://localhost:3000").replace(/\/$/, "");
  const only = arg("only");
  const studies = liveOf(STUDIES).filter((s) => !only || s.slug === only);
  if (only && only !== "cover" && studies.length === 0) throw new Error(`No live study named ${only}`);

  const executablePath = process.env.CHROME_PATH;
  const browser = await chromium.launch(executablePath ? { executablePath } : { channel: "chrome" });

  if (!only || only === "cover") {
    // The index page as a visitor first sees it, once the arcs have woven in.
    const cover = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const page = await cover.newPage();
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(6000);
    const out = path.join(root, COVER_IMAGE);
    await page.screenshot({ path: out, type: "jpeg", quality: 82 });
    console.log(`wrote  ${path.relative(root, out)}  (${base}/)`);
    await cover.close();
  }
  if (only === "cover") {
    await browser.close();
    return;
  }
  // 16:10 at a size that stays sharp as a 280-pixel thumbnail on a retina screen.
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });

  for (const study of studies) {
    const page = await context.newPage();
    const url = `${base}${study.href}${study.preview ? `#${study.preview}` : ""}`;
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    // Every study: Escape closes a first-visit introduction; [ and ] hide the panels.
    await page.keyboard.press("Escape");
    await page.keyboard.press("[");
    await page.keyboard.press("]");
    // Let panels settle and any drawing-in animation finish.
    await page.waitForTimeout(3500);
    const out = path.join(root, previewImagePath(study.slug));
    await page.locator("main").first().screenshot({ path: out, type: "jpeg", quality: 82 });
    console.log(`wrote  ${path.relative(root, out)}  (${url})`);
    await page.close();
  }
  await browser.close();
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  console.error(`\nIs the site running? Start it with npm run build && npm start, or pass --base.`);
  process.exit(1);
});
