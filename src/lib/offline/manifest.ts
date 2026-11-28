import { CHAPTER_ARCS_URL } from "@/lib/xrefs/client";
import { HOME_HREF, OFFLINE_HREF, studyHref } from "@/lib/routes";
import { liveStudies } from "@/studies/registry";

/** What the service worker keeps on the device for reading without a connection. */
export interface OfflineManifest {
  /**
   * Pages kept whole: the index, every live study, and the page the worker
   * shows, offline, in place of anything else (OFFLINE_HREF).
   */
  pages: string[];
  /**
   * Datasets a kept page fetches after it loads. Everything a page's HTML
   * loads (scripts, styles, fonts, icons) is found by the worker itself.
   */
  data: string[];
}

/**
 * Built from the registry at build time, so a study is kept from the day it
 * goes live. Every live study is kept, which is cheap while studies carry
 * their data in the page (about 1.5 MB for the whole site in November 2026).
 * A study with a large dataset of its own (a map's tiles) should be saved
 * when it is opened instead.
 */
export function offlineManifest(): OfflineManifest {
  return {
    pages: [HOME_HREF, ...liveStudies().map((study) => studyHref(study.slug)), OFFLINE_HREF],
    // The cover's cross-reference arcs.
    data: [CHAPTER_ARCS_URL],
  };
}
