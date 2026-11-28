/**
 * End-to-end smoke test in the installed Google Chrome (set CHROME_PATH to use
 * another Chromium).
 *
 *   npx tsx scripts/dev/smoke.ts [baseUrl]     (default http://localhost:3000)
 *
 * Visits every key page at desktop size, checks the HTTP status and that the
 * page rendered real content, and fails on console errors, page errors or
 * failed requests. Then checks each device gets the right screen: the app on
 * iPads, the gate on phones and in windows too narrow for the layout. Exits
 * non-zero on any failure.
 */
import { chromium, devices } from "playwright-core";

interface Check {
  path: string;
  /** Text that must be visible once the page has rendered. */
  expect: string | RegExp;
  status?: number;
}

const CHECKS: Check[] = [
  { path: "/", expect: /see how the bible fits together/i },
  { path: "/studies/revelation-chiasm", expect: /Revelation's mirror/ },
  { path: "/studies/revelation-chiasm#view=arcs&level=G", expect: /tree of life/ },
  { path: "/studies/revelation-chiasm#view=text&level=YY", expect: /that old serpent, called the Devil/ },
  { path: "/studies/revelation-chiasm#view=symmetry", expect: /Correlation/ },
  { path: "/read/genesis/1", expect: /./, status: 404 },
  { path: "/no-such-page", expect: /./, status: 404 },
];

const IGNORED = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /\[HMR\]/i,
];

async function main() {
  const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
  const executablePath = process.env.CHROME_PATH;
  const browser = await chromium.launch(executablePath ? { executablePath, headless: true } : { channel: "chrome", headless: true });
  let failures = 0;

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  for (const check of CHECKS) {
    const page = await desktop.newPage();
    const problems: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      // A 404 check legitimately logs the failed document request.
      if (check.status === 404 && /404/.test(text)) return;
      if (!IGNORED.some((re) => re.test(text))) problems.push(`console: ${text}`);
    });
    page.on("pageerror", (err) => problems.push(`pageerror: ${(err.stack ?? err.message).split("\n").slice(0, 4).join(" | ")}`));
    page.on("requestfailed", (req) => {
      const failure = req.failure()?.errorText ?? "";
      if (!/ERR_ABORTED/.test(failure)) problems.push(`requestfailed: ${req.url()} ${failure}`);
    });

    const started = performance.now();
    const response = await page.goto(base + check.path, { waitUntil: "networkidle", timeout: 90_000 });
    const status = response?.status() ?? 0;
    const body = await page.locator("body").innerText().catch(() => "");
    const ms = Math.round(performance.now() - started);

    const expectedStatus = check.status ?? 200;
    if (status !== expectedStatus) problems.push(`status ${status}, expected ${expectedStatus}`);
    const matches = typeof check.expect === "string" ? body.includes(check.expect) : check.expect.test(body);
    if (!matches) problems.push(`missing expected text ${check.expect}`);

    const ok = problems.length === 0;
    if (!ok) failures++;
    console.log(`${ok ? "pass" : "FAIL"}  ${check.path}  (${status}, ${ms} ms)`);
    for (const p of problems) console.log(`      ${p}`);
    await page.close();
  }
  await desktop.close();

  // Desk and iPad get the app; phones, and windows too narrow for it, get the gate.
  const DEVICE_CHECKS: {
    name: string;
    context: Parameters<typeof browser.newContext>[0];
    path: string;
    gate: boolean;
    /** Visible text that proves the right screen rendered. */
    expect: RegExp;
  }[] = [
    { name: "phone, hub", context: devices["iPhone 15"], path: "/", gate: true, expect: /Made for a larger screen/ },
    { name: "phone, study", context: devices["iPhone 15"], path: "/studies/revelation-chiasm", gate: true, expect: /This link opens/ },
    { name: "phone held sideways", context: devices["iPhone 15 landscape"], path: "/", gate: true, expect: /Made for a larger screen/ },
    { name: "iPad, hub", context: devices["iPad Pro 11"], path: "/", gate: false, expect: /see how the bible fits together/i },
    { name: "iPad upright, study", context: devices["iPad Pro 11"], path: "/studies/revelation-chiasm", gate: false, expect: /Walk/ },
    { name: "iPad on its side, study", context: devices["iPad Pro 11 landscape"], path: "/studies/revelation-chiasm", gate: false, expect: /Walk to the centre/ },
    { name: "narrow window", context: { viewport: { width: 420, height: 800 } }, path: "/", gate: true, expect: /Make the window wider/ },
  ];
  for (const check of DEVICE_CHECKS) {
    const context = await browser.newContext(check.context);
    const page = await context.newPage();
    await page.goto(base + check.path, { waitUntil: "networkidle" });
    const gateVisible = await page.locator("[data-device-gate]").isVisible();
    const textVisible = await page.getByText(check.expect).first().isVisible().catch(() => false);
    const ok = gateVisible === check.gate && textVisible;
    if (!ok) failures++;
    console.log(`${ok ? "pass" : "FAIL"}  ${check.name} (gate ${gateVisible ? "shown" : "hidden"}, expected text ${textVisible ? "found" : "missing"})`);
    await context.close();
  }

  await browser.close();
  console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
