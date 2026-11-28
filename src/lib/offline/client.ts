"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  OFFLINE_CACHE,
  OFFLINE_RECORD_URL,
  OFFLINE_SAVED_MESSAGE,
  SERVICE_WORKER_URL,
  type OfflineRecord,
} from "./constants";

/**
 * The browser's side of offline reading: registering the service worker
 * (public/sw.js), asking whether the copy is saved, and whether there is a
 * connection. Client components only.
 */

/**
 * Saving for offline reading runs in production builds only: under `next dev`
 * a worker would keep serving yesterday's code.
 */
export const OFFLINE_ENABLED = process.env.NODE_ENV === "production";

/** True where this browser can keep the site: a service worker in a secure context. */
export function offlineSupported(): boolean {
  return typeof window !== "undefined" && window.isSecureContext && "serviceWorker" in navigator && "caches" in window;
}

let registration: Promise<ServiceWorkerRegistration> | undefined;

/**
 * Register the worker once the page has loaded, so saving the copy never
 * competes with the first paint. Every caller shares one registration.
 */
export function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  registration ??= new Promise<void>((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", () => resolve(), { once: true });
  }).then(() =>
    // Always check the network for a new worker, whatever the HTTP cache says.
    navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: "/", updateViaCache: "none" }),
  );
  return registration;
}

/** Remove a worker left by a production build on this origin (`next start` and `next dev` share localhost). */
export async function unregisterServiceWorkers(): Promise<void> {
  for (const worker of await navigator.serviceWorker.getRegistrations()) await worker.unregister();
}

/** Opened from the home screen (or installed), rather than in a browser tab. */
export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** The worker's record of what it saved, or null if nothing is saved yet. */
export async function readOfflineRecord(): Promise<OfflineRecord | null> {
  try {
    const saved = await (await caches.open(OFFLINE_CACHE)).match(OFFLINE_RECORD_URL);
    return saved ? ((await saved.json()) as OfflineRecord) : null;
  } catch {
    // Storage blocked (some private windows) or unreadable: as good as unsaved.
    return null;
  }
}

// Connection -----------------------------------------------------------------

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * False while the device reports no connection. Prerendered as online.
 * (A device can report a connection that doesn't reach the internet; this
 * says only what the device knows.)
 */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

// The saved copy -------------------------------------------------------------

export type OfflineCopy =
  /** Not known until the page is in the browser. */
  | { state: "unknown" }
  /** This browser can't keep the site (no service workers, or not over HTTPS). */
  | { state: "unsupported" }
  /** Saving is switched off: a development build. */
  | { state: "off" }
  /** The worker is saving the copy now. */
  | { state: "saving" }
  /** The last save didn't finish (usually a lost connection); the next visit tries again. */
  | { state: "failed" }
  | { state: "saved"; savedAt: string };

const subscribeNothing = () => () => {};

/** What this browser and build allow, which never changes while the page is open. */
function capability(): "on" | "off" | "unsupported" {
  if (!offlineSupported()) return "unsupported";
  return OFFLINE_ENABLED ? "on" : "off";
}

/** Whether the site is saved on this device for offline reading, kept up to date as the worker works. */
export function useOfflineCopy(): OfflineCopy {
  const can = useSyncExternalStore(subscribeNothing, capability, () => null);
  const [copy, setCopy] = useState<OfflineCopy>({ state: "unknown" });

  useEffect(() => {
    if (can !== "on") return;
    let alive = true;

    /** Saved if the record says so; otherwise `otherwise`. */
    const read = async (otherwise: OfflineCopy) => {
      const record = await readOfflineRecord();
      if (alive) setCopy(record ? { state: "saved", savedAt: record.savedAt } : otherwise);
    };

    // An install that fails (the save couldn't finish) leaves its worker redundant.
    const watch = (worker: ServiceWorker | null) => {
      worker?.addEventListener("statechange", () => {
        if (worker.state === "redundant") void read({ state: "failed" });
      });
    };

    const onMessage = (event: MessageEvent) => {
      if ((event.data as { type?: unknown } | null)?.type === OFFLINE_SAVED_MESSAGE) void read({ state: "saving" });
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    void read({ state: "saving" });
    registerServiceWorker().then(
      (registration) => {
        watch(registration.installing);
        registration.addEventListener("updatefound", () => watch(registration.installing));
      },
      () => void read({ state: "failed" }),
    );

    return () => {
      alive = false;
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, [can]);

  if (can === null) return { state: "unknown" };
  if (can !== "on") return { state: can };
  return copy;
}
