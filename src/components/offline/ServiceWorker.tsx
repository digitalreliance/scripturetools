"use client";

import { useEffect } from "react";
import {
  isStandalone,
  OFFLINE_ENABLED,
  offlineSupported,
  registerServiceWorker,
  unregisterServiceWorkers,
} from "@/lib/offline/client";

/**
 * Starts offline reading on every page: registers the service worker
 * (public/sw.js), which saves the site to the device. Opened from the home
 * screen, it also asks the browser to keep that copy even when the device
 * runs short of space. Renders nothing.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!offlineSupported()) return;
    if (!OFFLINE_ENABLED) {
      void unregisterServiceWorkers().catch(() => {});
      return;
    }
    registerServiceWorker().then(
      () => {
        // Installed apps get this without asking; in a browser tab, Firefox would ask, so don't.
        if (isStandalone()) void navigator.storage?.persist?.().catch(() => false);
      },
      () => {
        // No worker this time (storage blocked, say): the site still works online.
      },
    );
  }, []);
  return null;
}
