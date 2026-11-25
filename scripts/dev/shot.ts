/**
 * Screenshot a page in the installed Google Chrome and report console errors.
 *
 *   npx tsx scripts/dev/shot.ts <url> <out.png> [options]
 *
 * Options
 *   --w 1440 --h 900       viewport (default 1440x900)
 *   --full                 full-page screenshot
 *   --device "iPhone 15"   emulate a Playwright device (touch, UA, viewport)
 *   --wait 1200            extra milliseconds to wait after load (default 800)
 *   --reduced-motion       emulate prefers-reduced-motion: reduce
 *   --steps '<json>'       actions before the shot, e.g.
 *                          '[{"click":"text=Arcs"},{"wait":400},{"press":"ArrowDown"},
 *                            {"hover":"[data-level=RR]"},{"type":["input[type=search]","rev 12"]},
 *                            {"scroll":1200},{"eval":"document.title"}]'
 *
 * Exit code 0 even with console errors; they are printed so you can fix them.
 */
import { chromium, devices, type Page } from "playwright-core";

type Step =
  | { click: string }
  | { hover: string }
  | { press: string }
  | { type: [string, string] }
  | { wait: number }
  | { scroll: number }
  | { eval: string };

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function run(page: Page, steps: Step[]) {
  for (const step of steps) {
    if ("click" in step) await page.click(step.click);
    else if ("hover" in step) await page.hover(step.hover);
    else if ("press" in step) await page.keyboard.press(step.press);
    else if ("type" in step) await page.fill(step.type[0], step.type[1]);
    else if ("wait" in step) await page.waitForTimeout(step.wait);
    else if ("scroll" in step) await page.mouse.wheel(0, step.scroll);
    else if ("eval" in step) console.log("eval:", JSON.stringify(await page.evaluate(step.eval)));
  }
}

async function main() {
  const [url, out] = process.argv.slice(2);
  if (!url || !out) {
    console.error("usage: npx tsx scripts/dev/shot.ts <url> <out.png> [options]");
    process.exit(2);
  }
  const deviceName = arg("device");
  const device = deviceName ? devices[deviceName] : undefined;
  if (deviceName && !device) throw new Error(`Unknown device: ${deviceName}`);

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext(
    device ?? {
      viewport: { width: Number(arg("w") ?? 1440), height: Number(arg("h") ?? 900) },
      deviceScaleFactor: 1,
    },
  );
  const page = await context.newPage();
  if (process.argv.includes("--reduced-motion")) await page.emulateMedia({ reducedMotion: "reduce" });

  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") problems.push(`[console.${msg.type()}] ${msg.text()}`);
  });
  page.on("pageerror", (err) => problems.push(`[pageerror] ${err.message}`));
  page.on("requestfailed", (req) => problems.push(`[requestfailed] ${req.url()} ${req.failure()?.errorText ?? ""}`));

  const response = await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  console.log(`status: ${response?.status()}`);
  await page.waitForTimeout(Number(arg("wait") ?? 800));
  const steps = arg("steps");
  if (steps) await run(page, JSON.parse(steps) as Step[]);
  await page.screenshot({ path: out, fullPage: process.argv.includes("--full") });
  console.log(`saved: ${out}`);
  console.log(problems.length ? problems.join("\n") : "console: clean");
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
