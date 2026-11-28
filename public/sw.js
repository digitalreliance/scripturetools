/*
 * Scripture Tools' service worker: keeps the site readable without a
 * connection, so a study opened from an iPad's home screen on a plane still
 * works. See "Offline reading" in docs/ARCHITECTURE.md.
 *
 * What it keeps, in one cache:
 *   - every page /offline.json lists: the index, each live study, and the
 *     offline page;
 *   - everything those pages load (scripts, stylesheets, fonts, icons), found
 *     by reading their HTML and following each script and stylesheet to the
 *     files it names, so code that loads later, like the ⌘K palette, is kept
 *     too;
 *   - the datasets /offline.json lists, and any dataset a page fetches.
 *
 * How it answers:
 *   - A page comes from the network, so a connected reader always gets the
 *     current site. With no connection, or no answer within NETWORK_TIMEOUT,
 *     the saved copy is shown; a page that isn't kept leads to the offline
 *     page, which lists what is.
 *   - Next.js's build output (/_next/static/) comes from the saved copy
 *     first: its file names change whenever their contents do.
 *   - Other files (datasets, icons) come from the network, or the saved copy
 *     when there is no network.
 *   - Next.js's own data requests (RSC) pass straight through. When one
 *     fails, Next.js loads the whole page instead, and that is answered here.
 *
 * Keeping up to date: when a kept page arrives from the network, the worker
 * compares the files it loads with the saved copy's. The same files: the
 * fresh page replaces the saved one. Different files (a new deploy), or a
 * copy older than MAX_AGE: everything is saved again, files first, pages
 * second, and only then is anything no page uses deleted, so a saved page
 * never points at a file that isn't there. A save cut short by a lost
 * connection leaves the previous copy whole.
 *
 * A plain script with no build step. The names in the first block are
 * repeated in src/lib/offline/constants.ts and src/lib/routes.ts;
 * src/lib/offline/__tests__/sw.test.ts checks they agree and runs this file
 * against stand-ins for a browser.
 */
"use strict";

const CACHE = "scripture-tools-offline-v1";
const CACHE_PREFIX = "scripture-tools-offline-";
const MANIFEST_URL = "/offline.json";
const RECORD_URL = "/__offline__/saved.json";
const FALLBACK_URL = "/offline";
const SAVED_MESSAGE = "scripture-tools:offline-saved";

/** Next.js's build output: named by content, so a saved copy never goes stale. */
const STATIC_PREFIX = "/_next/static/";
/** How long a page may take to start arriving before the saved copy is shown. */
const NETWORK_TIMEOUT = 3000;
/** Save everything again at least this often, even when no page's files changed. */
const MAX_AGE = 24 * 60 * 60 * 1000;
/** The <link rel> values that load something a page needs. */
const LINK_RELS = ["stylesheet", "preload", "modulepreload", "icon", "apple-touch-icon", "manifest"];
/** Next.js varies pages on its own request headers; a saved copy answers them all. */
const MATCH = { ignoreVary: true };
/** Build output may carry a deployment query (?dpl=); its name alone says what it is. */
const MATCH_STATIC = { ignoreVary: true, ignoreSearch: true };

// What a page loads ------------------------------------------------------

/**
 * A same-origin URL as the worker stores it: path and query, or for build
 * output the path alone. Null for anything on another origin.
 */
function keyOf(url, base) {
  let parsed;
  try {
    parsed = new URL(url, base);
  } catch {
    return null;
  }
  if (parsed.origin !== self.location.origin) return null;
  return parsed.pathname.startsWith(STATIC_PREFIX) ? parsed.pathname : parsed.pathname + parsed.search;
}

/** One attribute's value from an HTML tag, entities in URLs decoded. */
function attribute(tag, name) {
  const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i").exec(tag);
  if (!match) return null;
  return (match[1] ?? match[2] ?? match[3]).replace(/&amp;/g, "&");
}

/**
 * The files a page's HTML loads: its scripts, stylesheets, icons and web app
 * manifest, plus the scripts and fonts named in Next.js's inline data.
 */
function pageAssets(html, base) {
  const found = new Set();
  const skip = new Set();
  for (const [tag] of html.matchAll(/<(?:script|link)\b[^>]*>/gi)) {
    const script = /^<script/i.test(tag);
    const url = attribute(tag, script ? "src" : "href");
    const key = url ? keyOf(url, base) : null;
    if (!key) continue;
    if (script) {
      // Only browsers without JavaScript modules run the nomodule polyfill, and none of them can run this site.
      if (/\snomodule\b/i.test(tag)) skip.add(key);
      else found.add(key);
    } else {
      const rel = (attribute(tag, "rel") ?? "").toLowerCase().split(/\s+/);
      if (rel.some((value) => LINK_RELS.includes(value))) found.add(key);
    }
  }
  for (const [path] of html.matchAll(/\/_next\/static\/[^"'\\\s<>()]+/g)) {
    const key = keyOf(path, base);
    if (key) found.add(key);
  }
  for (const key of skip) found.delete(key);
  return found;
}

/** The build files a script loads by name later on, such as the ⌘K palette's chunks. */
function scriptAssets(js) {
  const found = new Set();
  for (const [, path] of js.matchAll(/["'`](?:\/_next\/)?(static\/(?:chunks|media)\/[^"'`\\\s]+)["'`]/g)) {
    found.add(`/_next/${path}`);
  }
  return found;
}

/** The files a stylesheet loads, fonts mostly, resolved against the stylesheet's own URL. */
function styleAssets(css, base) {
  const found = new Set();
  // Inline images (data: URLs) may hold url() of their own; take them out first.
  const text = css.replace(/url\(\s*(["'])data:[\s\S]*?\1\s*\)/g, "");
  for (const [, , raw] of text.matchAll(/url\(\s*(["']?)([^"')]+)\1\s*\)/g)) {
    const url = raw.trim();
    if (url.startsWith("data:")) continue;
    const key = keyOf(url, base);
    if (key && /\.[a-z0-9]+$/i.test(key.split("?")[0])) found.add(key);
  }
  return found;
}

function sameSet(a, b) {
  return a.size === b.size && [...a].every((item) => b.has(item));
}

function isHtml(response) {
  return (response.headers.get("Content-Type") ?? "").includes("text/html");
}

/** Settles like `promise`, or rejects once `ms` pass without an answer. */
function within(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("No answer in time")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// Saving the copy -------------------------------------------------------

/** A saved page: the HTML alone, so it can answer any navigation to it. */
function pageResponse(html, type) {
  return new Response(html, { headers: { "Content-Type": type || "text/html; charset=utf-8" } });
}

async function readRecord(cache) {
  const saved = await cache.match(RECORD_URL);
  if (!saved) return null;
  try {
    return await saved.json();
  } catch {
    return null;
  }
}

/** Something the copy can't do without: a missing page or list stops the save. */
async function required(key) {
  const response = await fetch(key, { cache: "no-cache" });
  if (!response.ok) throw new Error(`${key}: HTTP ${response.status}`);
  return response;
}

/**
 * Make sure a file is saved, and return it. Build output already saved is
 * kept as it is; anything else is fetched afresh. Null when the server says
 * there is no such file (a name in a script that wasn't one). A lost
 * connection throws, which stops the save.
 */
async function keep(cache, key) {
  const built = key.startsWith(STATIC_PREFIX);
  if (built) {
    const saved = await cache.match(key, MATCH_STATIC);
    if (saved) return saved;
  }
  // Build output may come from the HTTP cache: the page that just loaded it is current.
  const response = await fetch(key, { cache: built ? "default" : "no-cache" });
  if (response.status === 404 || response.status === 410) return null;
  if (!response.ok) throw new Error(`${key}: HTTP ${response.status}`);
  await cache.put(key, response.clone());
  return response;
}

async function saveAll() {
  const manifest = await (await required(MANIFEST_URL)).json();
  const cache = await caches.open(CACHE);
  const before = await readRecord(cache);
  const origin = self.location.origin;

  // 1. The pages, fresh. They wait until everything they load is saved.
  const pages = await Promise.all(
    manifest.pages.map(async (path) => {
      const response = await required(path);
      return { path, type: response.headers.get("Content-Type"), html: await response.text() };
    }),
  );

  // 2. Everything the pages load, then everything that loads, wave by wave.
  const assets = new Set();
  const seen = new Set();
  let wave = [];
  const visit = (key) => {
    if (seen.has(key)) return;
    seen.add(key);
    wave.push(key);
  };
  for (const page of pages) pageAssets(page.html, origin + page.path).forEach(visit);
  while (wave.length > 0) {
    const current = wave;
    wave = [];
    await Promise.all(
      current.map(async (key) => {
        const response = await keep(cache, key);
        if (!response) return;
        assets.add(key);
        const path = key.split("?")[0];
        if (path.endsWith(".js")) scriptAssets(await response.text()).forEach(visit);
        else if (path.endsWith(".css")) styleAssets(await response.text(), origin + key).forEach(visit);
      }),
    );
  }

  // 3. The datasets.
  const data = [];
  for (const key of manifest.data) if (await keep(cache, key)) data.push(key);

  // 4. Now no saved page can point at a file that isn't there.
  await Promise.all(manifest.pages.map((path, i) => cache.put(path, pageResponse(pages[i].html, pages[i].type))));

  // 5. Delete what no saved page uses: build output from earlier deploys, and
  //    pages and files an earlier save kept that this one doesn't. Datasets
  //    a page fetched along the way stay.
  const kept = new Set([...manifest.pages, ...assets, ...data, RECORD_URL]);
  const earlier = new Set(before ? [...before.pages, ...before.assets] : []);
  for (const request of await cache.keys()) {
    const key = keyOf(request.url, origin);
    if (!key || kept.has(key)) continue;
    if (key.startsWith(STATIC_PREFIX) || earlier.has(key)) await cache.delete(request);
  }

  // 6. Record what was saved, and tell any open page.
  const record = { savedAt: new Date().toISOString(), pages: manifest.pages, assets: [...assets].sort(), data };
  await cache.put(RECORD_URL, new Response(JSON.stringify(record), { headers: { "Content-Type": "application/json" } }));
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of windows) client.postMessage({ type: SAVED_MESSAGE, savedAt: record.savedAt });
  return record;
}

let saving = null;

/** Bring the saved copy up to date. One save runs at a time; callers share it. */
function save() {
  saving ??= saveAll().finally(() => {
    saving = null;
  });
  return saving;
}

/**
 * A kept page just arrived from the network. If it loads the same files as
 * the saved copy, keep the fresh page; if not, a new deploy is live, so save
 * everything again.
 */
async function review(path, response) {
  try {
    const cache = await caches.open(CACHE);
    const record = await readRecord(cache);
    if (!record) {
      // No save has finished here yet; this is a good moment, with a connection.
      await save();
      return;
    }
    if (!response.ok || !isHtml(response) || !record.pages.includes(path)) return;
    const html = await response.text();
    const saved = await cache.match(path, MATCH);
    const base = self.location.origin + path;
    const changed = !saved || !sameSet(pageAssets(html, base), pageAssets(await saved.text(), base));
    const old = Date.now() - Date.parse(record.savedAt) > MAX_AGE;
    if (changed || old) await save();
    else await cache.put(path, pageResponse(html, response.headers.get("Content-Type")));
  } catch {
    // Cut off, or out of space: the copy saved before stands.
  }
}

// Answering requests ----------------------------------------------------

async function page(event, url) {
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
  const network = (async () => (await event.preloadResponse) || fetch(event.request))();
  const cache = await caches.open(CACHE);
  const saved = await cache.match(path, MATCH);

  if (saved) {
    const response = await within(network, NETWORK_TIMEOUT).catch(() => null);
    if (response) {
      event.waitUntil(review(path, response.clone()));
      return response;
    }
    // No connection, or none worth waiting for: the saved copy now. A late answer still freshens it.
    event.waitUntil(network.then((late) => review(path, late), () => {}));
    return saved;
  }

  try {
    const response = await network;
    event.waitUntil(review(path, response.clone()));
    return response;
  } catch (error) {
    // Offline and not kept: the offline page says so, and lists what is kept.
    if (await cache.match(FALLBACK_URL, MATCH)) {
      const hash = new URLSearchParams({ from: path + url.search });
      return Response.redirect(new URL(`${FALLBACK_URL}#${hash}`, self.location.origin).href, 302);
    }
    throw error;
  }
}

async function built(event, request) {
  const cache = await caches.open(CACHE);
  const saved = await cache.match(request, MATCH_STATIC);
  if (saved) return saved;
  const response = await fetch(request);
  if (response.ok) {
    const key = keyOf(request.url, self.location.origin);
    event.waitUntil(cache.put(key, response.clone()).catch(() => {}));
  }
  return response;
}

async function file(event, request, store) {
  const cache = await caches.open(CACHE);
  const network = fetch(request);
  const saved = await cache.match(request, MATCH);
  try {
    const response = await (saved ? within(network, NETWORK_TIMEOUT) : network);
    if (store && response.ok) event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
    return response;
  } catch (error) {
    if (!saved) throw error;
    event.waitUntil(network.then((late) => (store && late.ok ? cache.put(request, late) : undefined), () => {}));
    return saved;
  }
}

// Lifecycle -------------------------------------------------------------

self.addEventListener("install", (event) => {
  // Installed only once the whole copy is saved. Without a connection the
  // install fails, and the browser tries again on a later visit.
  event.waitUntil(save().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith(CACHE_PREFIX) && name !== CACHE) await caches.delete(name);
      }
      // Start fetching a page while the worker wakes, rather than after.
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(page(event, url));
  } else if (request.headers.has("RSC") || url.searchParams.has("_rsc")) {
    // Next.js's own requests: left alone (see the top of this file).
  } else if (url.pathname.startsWith(STATIC_PREFIX)) {
    event.respondWith(built(event, request));
  } else {
    event.respondWith(file(event, request, url.pathname.startsWith("/data/")));
  }
});
