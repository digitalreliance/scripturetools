import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { beforeEach, describe, expect, it } from "vitest";
import { OFFLINE_HREF, studyHref } from "@/lib/routes";
import { liveStudies } from "@/studies/registry";
import {
  OFFLINE_CACHE,
  OFFLINE_MANIFEST_URL,
  OFFLINE_RECORD_URL,
  OFFLINE_SAVED_MESSAGE,
  SERVICE_WORKER_URL,
  type OfflineRecord,
} from "../constants";
import { offlineManifest } from "../manifest";

/**
 * public/sw.js, run against stand-ins for a browser: a site served from
 * memory that can go offline, and an in-memory Cache Storage.
 */

const ORIGIN = "https://scripture.test";
const SOURCE = readFileSync(join(process.cwd(), "public", SERVICE_WORKER_URL), "utf8");

// The site -----------------------------------------------------------------

interface File {
  body: string;
  type: string;
  status?: number;
}

/** A page as Next.js writes it. Build output is named by its contents: new contents, new name. */
function html(chunk: string, extra = "", runtime = chunk.endsWith("two.js") ? "runtime-two.js" : "runtime-one.js"): string {
  return `<!DOCTYPE html><html><head>
<link rel="stylesheet" href="/_next/static/chunks/site.css" data-precedence="next"/>
<link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/${runtime}"/>
<script src="/_next/static/chunks/${runtime}" async=""></script>
<script src="/_next/static/chunks/${chunk}" async=""></script>
<link rel="manifest" href="/manifest.webmanifest"/>
<link rel="icon" href="/icon.svg?icon.abc.svg" sizes="any" type="image/svg+xml"/>
<link rel="apple-touch-icon" href="/apple-icon?75af&amp;x=1" type="image/png" sizes="180x180"/>
<link rel="canonical" href="/somewhere-else"/>
<link rel="preconnect" href="https://fonts.example.com"/>
<script src="/_next/static/chunks/polyfills.js" noModule=""></script>
<script src="https://analytics.example.com/a.js"></script>
</head><body><a href="/studies/not-a-file">A link</a>${extra}
<script>self.__next_f.push([1,"0:{\\"f\\":[\\"/_next/static/media/serif.p.woff2\\"]}"])</script>
</body></html>`;
}

function site(version: "one" | "two" = "one"): Map<string, File> {
  const files = new Map<string, File>();
  const page = (body: string) => ({ body, type: "text/html; charset=utf-8" });
  const js = (body: string) => ({ body, type: "application/javascript" });
  files.set(OFFLINE_MANIFEST_URL, {
    body: JSON.stringify({ pages: ["/", "/studies/mirror", "/offline"], data: ["/data/arcs.json"] }),
    type: "application/json",
  });
  files.set("/", page(html(`hub-${version}.js`, "<h1>Index</h1>")));
  files.set("/studies/mirror", page(html(`mirror-${version}.js`, "<h1>Mirror</h1>")));
  files.set("/offline", page(html(`hub-${version}.js`, "<h1>Offline</h1>")));
  files.set("/dev/carousel", page(html("dev.js")));
  files.set(`/_next/static/chunks/runtime-${version}.js`, js(`TURBOPACK.push(["static/chunks/palette-${version}.js"])`));
  files.set(`/_next/static/chunks/hub-${version}.js`, js(`"/_next/static/media/photo.png"; "static/chunks/ghost.js"`));
  files.set(`/_next/static/chunks/mirror-${version}.js`, js("mirror()"));
  files.set(`/_next/static/chunks/palette-${version}.js`, js("palette()"));
  files.set("/_next/static/chunks/polyfills.js", js("polyfills()"));
  files.set("/_next/static/chunks/site.css", {
    body: `@font-face{src:url(../media/sans.woff2) format("woff2")}
.grain{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect filter='url(%23n)'/%3E%3C/svg%3E")}`,
    type: "text/css",
  });
  files.set("/_next/static/media/sans.woff2", { body: "sans", type: "font/woff2" });
  files.set("/_next/static/media/serif.p.woff2", { body: "serif", type: "font/woff2" });
  files.set("/_next/static/media/photo.png", { body: "png", type: "image/png" });
  files.set("/manifest.webmanifest", { body: "{}", type: "application/manifest+json" });
  files.set("/icon.svg?icon.abc.svg", { body: "<svg/>", type: "image/svg+xml" });
  files.set("/apple-icon?75af&x=1", { body: "png", type: "image/png" });
  files.set("/data/arcs.json", { body: `{"arcs":"${version}"}`, type: "application/json" });
  files.set("/data/kjv/books/PSA.json", { body: '{"id":"PSA"}', type: "application/json" });
  return files;
}

// The browser ---------------------------------------------------------------

type Key = { url: string } | string;
const urlOf = (key: Key) => new URL(typeof key === "string" ? key : key.url, ORIGIN);

interface Stored {
  body: ArrayBuffer;
  status: number;
  headers: [string, string][];
}

class FakeCache {
  readonly entries = new Map<string, Stored>();

  private find(key: Key, options: { ignoreSearch?: boolean } = {}): string | undefined {
    const url = urlOf(key);
    if (this.entries.has(url.href)) return url.href;
    if (!options.ignoreSearch) return undefined;
    return [...this.entries.keys()].find((stored) => new URL(stored).pathname === url.pathname);
  }

  async match(key: Key, options?: { ignoreSearch?: boolean }) {
    const found = this.find(key, options);
    if (!found) return undefined;
    const { body, status, headers } = this.entries.get(found)!;
    return new Response(body.slice(0), { status, headers });
  }

  async put(key: Key, response: Response) {
    const body = await response.arrayBuffer();
    this.entries.set(urlOf(key).href, { body, status: response.status, headers: [...response.headers] });
  }

  async delete(key: Key) {
    return this.entries.delete(urlOf(key).href);
  }

  async keys() {
    return [...this.entries.keys()].map((url) => ({ url }));
  }

  /** Saved keys as paths, sorted. */
  paths(): string[] {
    return [...this.entries.keys()].map((url) => url.slice(ORIGIN.length)).sort();
  }

  async text(path: string) {
    return (await this.match(path))?.text();
  }
}

class FakeCacheStorage {
  readonly stores = new Map<string, FakeCache>();
  async open(name: string) {
    if (!this.stores.has(name)) this.stores.set(name, new FakeCache());
    return this.stores.get(name)!;
  }
  async keys() {
    return [...this.stores.keys()];
  }
  async delete(name: string) {
    return this.stores.delete(name);
  }
}

interface FetchEventStandIn {
  request: { url: string; method: string; mode: string; headers: Headers };
  preloadResponse: Promise<Response | undefined>;
  responded?: Promise<Response>;
  respondWith(response: Promise<Response>): void;
  waitUntil(promise: Promise<unknown>): void;
}

function makeBrowser() {
  const state = {
    files: site(),
    online: true,
    /** A page request that never answers: the slow hotel Wi-Fi. */
    hang: false,
    fetched: [] as string[],
    messages: [] as unknown[],
  };
  const caches = new FakeCacheStorage();
  const listeners = new Map<string, (event: unknown) => void>();
  const pending: Promise<unknown>[] = [];

  async function fetchStandIn(input: Key) {
    const url = urlOf(input);
    const path = url.pathname + url.search;
    state.fetched.push(path);
    if (!state.online) throw new TypeError("Failed to fetch");
    if (state.hang && !url.pathname.startsWith("/_next/")) return new Promise<Response>(() => {});
    const file = state.files.get(path) ?? state.files.get(url.pathname);
    if (!file) return new Response("Not found", { status: 404, headers: { "Content-Type": "text/html" } });
    return new Response(file.body, { status: file.status ?? 200, headers: { "Content-Type": file.type } });
  }

  const self: Record<string, unknown> = {
    location: { origin: ORIGIN, href: `${ORIGIN}${SERVICE_WORKER_URL}` },
    registration: { navigationPreload: { enable: async () => {} } },
    clients: {
      claim: async () => {},
      matchAll: async () => [{ postMessage: (message: unknown) => state.messages.push(message) }],
    },
    skipWaiting: async () => {},
    addEventListener: (type: string, listener: (event: unknown) => void) => listeners.set(type, listener),
    caches,
    fetch: fetchStandIn,
    Response,
    Headers,
    URL,
    URLSearchParams,
    console,
    // Timers run at once, so "no answer within 3 s" takes no time in a test.
    setTimeout: (callback: () => void) => setTimeout(callback, 0),
    clearTimeout,
  };
  self.self = self;
  const context = vm.createContext(self);
  vm.runInContext(SOURCE, context, { filename: "sw.js" });

  async function settle() {
    while (pending.length > 0) await Promise.allSettled(pending.splice(0));
  }

  async function lifecycle(type: "install" | "activate") {
    let done: Promise<unknown> = Promise.resolve();
    listeners.get(type)!({ waitUntil: (promise: Promise<unknown>) => (done = promise) });
    await done;
  }

  /** Dispatch a fetch event; resolves with the worker's answer, or null if it let the request through. */
  async function request(path: string, init: { mode?: string; headers?: Record<string, string> } = {}) {
    const event: FetchEventStandIn = {
      request: { url: new URL(path, ORIGIN).href, method: "GET", mode: init.mode ?? "cors", headers: new Headers(init.headers) },
      preloadResponse: Promise.resolve(undefined),
      respondWith(response) {
        this.responded = response;
      },
      waitUntil(promise) {
        pending.push(promise);
      },
    };
    listeners.get("fetch")!(event);
    return event.responded ? await event.responded : null;
  }

  const navigate = (path: string) => request(path, { mode: "navigate" });

  async function cache() {
    return caches.open(OFFLINE_CACHE);
  }

  async function record(): Promise<OfflineRecord | null> {
    const saved = await (await cache()).match(OFFLINE_RECORD_URL);
    return saved ? saved.json() : null;
  }

  return { state, caches, context, lifecycle, request, navigate, settle, cache, record };
}

type Browser = ReturnType<typeof makeBrowser>;

// The tests -----------------------------------------------------------------

describe("the service worker's names", () => {
  const constant = (name: string) => new RegExp(`const ${name} = "([^"]+)"`).exec(SOURCE)?.[1];

  it("agree with the app's", () => {
    expect(constant("CACHE")).toBe(OFFLINE_CACHE);
    expect(OFFLINE_CACHE.startsWith(constant("CACHE_PREFIX")!)).toBe(true);
    expect(constant("MANIFEST_URL")).toBe(OFFLINE_MANIFEST_URL);
    expect(constant("RECORD_URL")).toBe(OFFLINE_RECORD_URL);
    expect(constant("FALLBACK_URL")).toBe(OFFLINE_HREF);
    expect(constant("SAVED_MESSAGE")).toBe(OFFLINE_SAVED_MESSAGE);
  });
});

describe("the offline manifest", () => {
  const manifest = offlineManifest();

  it("keeps the index, every live study and the offline page", () => {
    expect(manifest.pages[0]).toBe("/");
    for (const study of liveStudies()) expect(manifest.pages).toContain(studyHref(study.slug));
    expect(manifest.pages).toContain(OFFLINE_HREF);
    expect(new Set(manifest.pages).size).toBe(manifest.pages.length);
  });

  it("lists only datasets that exist", () => {
    for (const url of manifest.data) {
      expect(url.startsWith("/data/")).toBe(true);
      expect(existsSync(join(process.cwd(), "public", url))).toBe(true);
    }
  });
});

describe("finding what a page loads", () => {
  let browser: Browser;
  beforeEach(() => {
    browser = makeBrowser();
  });
  const call = <T>(name: string, ...args: unknown[]) => (browser.context[name] as (...a: unknown[]) => T)(...args);

  it("reads scripts, styles, icons and inline font names from HTML, and skips the rest", () => {
    const found = call<Set<string>>("pageAssets", html("hub-one.js"), `${ORIGIN}/`);
    expect([...found].sort()).toEqual([
      "/_next/static/chunks/hub-one.js",
      "/_next/static/chunks/runtime-one.js",
      "/_next/static/chunks/site.css",
      "/_next/static/media/serif.p.woff2",
      "/apple-icon?75af&x=1",
      "/icon.svg?icon.abc.svg",
      "/manifest.webmanifest",
    ]);
  });

  it("stores build output by name alone, whatever deployment query it carries", () => {
    const found = call<Set<string>>("pageAssets", '<script src="/_next/static/chunks/a.js?dpl=dpl_123"></script>', `${ORIGIN}/`);
    expect([...found]).toEqual(["/_next/static/chunks/a.js"]);
  });

  it("follows a script to the chunks it loads later", () => {
    const found = call<Set<string>>("scriptAssets", 'Promise.all(["static/chunks/3-hye.js","static/chunks/2b0z.js"].map(l))');
    expect([...found]).toEqual(["/_next/static/chunks/3-hye.js", "/_next/static/chunks/2b0z.js"]);
  });

  it("follows a stylesheet to its fonts, past inline images", () => {
    const css = site().get("/_next/static/chunks/site.css")!.body;
    const found = call<Set<string>>("styleAssets", css, `${ORIGIN}/_next/static/chunks/site.css`);
    expect([...found]).toEqual(["/_next/static/media/sans.woff2"]);
  });
});

describe("saving the copy", () => {
  let browser: Browser;
  beforeEach(async () => {
    browser = makeBrowser();
    await browser.lifecycle("install");
    await browser.lifecycle("activate");
  });

  it("keeps every page, everything they load, and the datasets", async () => {
    const cache = await browser.cache();
    expect(cache.paths()).toEqual([
      "/",
      "/__offline__/saved.json",
      "/_next/static/chunks/hub-one.js",
      "/_next/static/chunks/mirror-one.js",
      "/_next/static/chunks/palette-one.js",
      "/_next/static/chunks/runtime-one.js",
      "/_next/static/chunks/site.css",
      "/_next/static/media/photo.png",
      "/_next/static/media/sans.woff2",
      "/_next/static/media/serif.p.woff2",
      "/apple-icon?75af&x=1",
      "/data/arcs.json",
      "/icon.svg?icon.abc.svg",
      "/manifest.webmanifest",
      "/offline",
      "/studies/mirror",
    ]);
  });

  it("records what it saved and tells open pages", async () => {
    const record = await browser.record();
    expect(record?.pages).toEqual(["/", "/studies/mirror", "/offline"]);
    expect(record?.data).toEqual(["/data/arcs.json"]);
    expect(record?.assets).toContain("/_next/static/chunks/palette-one.js");
    expect(record?.assets).not.toContain("/_next/static/chunks/ghost.js");
    expect(browser.state.messages).toEqual([{ type: OFFLINE_SAVED_MESSAGE, savedAt: record?.savedAt }]);
  });

  it("doesn't install without a connection", async () => {
    const offline = makeBrowser();
    offline.state.online = false;
    await expect(offline.lifecycle("install")).rejects.toThrow();
    expect(await offline.record()).toBeNull();
  });

  it("clears out caches an older worker kept", async () => {
    const fresh = makeBrowser();
    await (await fresh.caches.open("scripture-tools-offline-v0")).put("/", new Response("old"));
    await (await fresh.caches.open("someone-elses-cache")).put("/", new Response("theirs"));
    await fresh.lifecycle("install");
    await fresh.lifecycle("activate");
    expect(await fresh.caches.keys()).toEqual(["someone-elses-cache", OFFLINE_CACHE]);
  });
});

describe("offline", () => {
  let browser: Browser;
  beforeEach(async () => {
    browser = makeBrowser();
    await browser.lifecycle("install");
    await browser.lifecycle("activate");
    browser.state.online = false;
  });

  it("opens a saved study, its code and its fonts", async () => {
    const page = await browser.navigate("/studies/mirror");
    expect(await page?.text()).toContain("<h1>Mirror</h1>");
    expect(await (await browser.request("/_next/static/chunks/mirror-one.js"))?.text()).toBe("mirror()");
    expect(await (await browser.request("/_next/static/chunks/palette-one.js?dpl=x"))?.text()).toBe("palette()");
    expect(await (await browser.request("/_next/static/media/sans.woff2"))?.text()).toBe("sans");
  });

  it("opens a saved page at any address that names it", async () => {
    expect(await (await browser.navigate("/studies/mirror/?ref=home"))?.text()).toContain("<h1>Mirror</h1>");
  });

  it("serves saved datasets", async () => {
    expect(await (await browser.request("/data/arcs.json"))?.json()).toEqual({ arcs: "one" });
  });

  it("sends a page that isn't saved to the offline page, saying where the reader was going", async () => {
    const response = await browser.navigate("/read/psalms/115?x=1");
    expect(response?.status).toBe(302);
    const location = new URL(response!.headers.get("Location")!);
    expect(location.pathname).toBe(OFFLINE_HREF);
    expect(new URLSearchParams(location.hash.slice(1)).get("from")).toBe("/read/psalms/115?x=1");
  });

  it("leaves Next.js's own data requests to Next.js", async () => {
    expect(await browser.request("/studies/mirror?_rsc=abc", { headers: { RSC: "1" } })).toBeNull();
    expect(await browser.request("/studies/mirror?_rsc=abc")).toBeNull();
  });

  it("leaves other sites alone", async () => {
    expect(await browser.request("https://github.com/")).toBeNull();
  });
});

describe("online", () => {
  let browser: Browser;
  beforeEach(async () => {
    browser = makeBrowser();
    await browser.lifecycle("install");
    await browser.lifecycle("activate");
    browser.state.fetched = [];
  });

  it("always gets the current page from the network, and keeps it", async () => {
    browser.state.files.get("/studies/mirror")!.body = html("mirror-one.js", "<h1>Mirror, corrected</h1>");
    const page = await browser.navigate("/studies/mirror");
    expect(await page?.text()).toContain("Mirror, corrected");
    await browser.settle();
    expect(await (await browser.cache()).text("/studies/mirror")).toContain("Mirror, corrected");
    // The same files as before: no need to save everything again.
    expect(browser.state.fetched).toEqual(["/studies/mirror"]);
  });

  it("shows the saved copy when the network doesn't answer in time", async () => {
    browser.state.hang = true;
    const page = await browser.navigate("/studies/mirror");
    expect(await page?.text()).toContain("<h1>Mirror</h1>");
  });

  it("saves everything again after a deploy, then deletes the old build", async () => {
    browser.state.files = site("two");
    const page = await browser.navigate("/");
    expect(await page?.text()).toContain("hub-two.js");
    await browser.settle();
    const paths = (await browser.cache()).paths();
    expect(paths).toContain("/_next/static/chunks/hub-two.js");
    expect(paths).toContain("/_next/static/chunks/palette-two.js");
    expect(paths).not.toContain("/_next/static/chunks/hub-one.js");
    expect(paths).not.toContain("/_next/static/chunks/palette-one.js");
    expect(await (await browser.cache()).text("/studies/mirror")).toContain("mirror-two.js");
    expect(await (await browser.cache()).text("/data/arcs.json")).toContain("two");
  });

  it("keeps the old copy whole when a save is cut short", async () => {
    browser.state.files = site("two");
    // The new deploy's palette can't be fetched: the save stops part way.
    browser.state.files.get("/_next/static/chunks/palette-two.js")!.status = 500;
    await browser.navigate("/");
    await browser.settle();
    const cache = await browser.cache();
    expect(await cache.text("/")).toContain("hub-one.js");
    expect(await cache.text("/studies/mirror")).toContain("mirror-one.js");
    expect(cache.paths()).toContain("/_next/static/chunks/palette-one.js");
  });

  it("saves everything again once a day even if nothing changed", async () => {
    const cache = await browser.cache();
    const record = (await browser.record())!;
    await cache.put(OFFLINE_RECORD_URL, Response.json({ ...record, savedAt: "2020-01-01T00:00:00.000Z" }));
    await browser.navigate("/studies/mirror");
    await browser.settle();
    expect(browser.state.fetched).toContain(OFFLINE_MANIFEST_URL);
    expect(Date.parse((await browser.record())!.savedAt)).toBeGreaterThan(Date.parse("2020-01-01"));
  });

  it("keeps a dataset a page fetched, for reading offline later", async () => {
    await browser.request("/data/kjv/books/PSA.json");
    await browser.settle();
    browser.state.online = false;
    expect(await (await browser.request("/data/kjv/books/PSA.json"))?.json()).toEqual({ id: "PSA" });
  });

  it("doesn't save pages it wasn't asked to keep", async () => {
    await browser.navigate("/dev/carousel");
    await browser.settle();
    expect((await browser.cache()).paths()).not.toContain("/dev/carousel");
  });
});
