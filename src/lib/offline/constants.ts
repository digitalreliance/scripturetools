/**
 * Names the service worker (public/sw.js) and the pages share. The worker is a
 * plain script that can't import these, so it repeats them; the tests in
 * __tests__/sw.test.ts check the two still agree.
 */

/** The service worker's script. Its scope is the whole site. */
export const SERVICE_WORKER_URL = "/sw.js";

/** What to keep for offline reading: built from the registry (src/app/offline.json/route.ts). */
export const OFFLINE_MANIFEST_URL = "/offline.json";

/**
 * The one cache the worker keeps. The suffix changes only when the way it
 * stores things changes; a new deploy refreshes the same cache in place.
 */
export const OFFLINE_CACHE = "scripture-tools-offline-v1";

/** Where in that cache the worker records what it saved, and when. */
export const OFFLINE_RECORD_URL = "/__offline__/saved.json";

/** Posted to every open page when the worker finishes saving. */
export const OFFLINE_SAVED_MESSAGE = "scripture-tools:offline-saved";

/** The worker's record of the copy it keeps. */
export interface OfflineRecord {
  /** When the copy was last brought up to date (an ISO timestamp). */
  savedAt: string;
  /** The pages kept, as paths. */
  pages: string[];
  /** The scripts, styles, fonts and icons those pages load. */
  assets: string[];
  /** Datasets kept with them. */
  data: string[];
}
