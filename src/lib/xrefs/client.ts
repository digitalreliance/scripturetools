import type { ChapterArcs } from "./types";

/** Public URL of the chapter-level arcs (public/data/xrefs/chapter-arcs.json). */
export const CHAPTER_ARCS_URL = "/data/xrefs/chapter-arcs.json";

let arcs: Promise<ChapterArcs> | undefined;

/**
 * The chapter-level cross-reference arcs. Memoised; a failed request is
 * forgotten so the next call retries.
 */
export function loadChapterArcs(): Promise<ChapterArcs> {
  arcs ??= fetch(CHAPTER_ARCS_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Could not load cross references (HTTP ${res.status})`);
      return res.json() as Promise<ChapterArcs>;
    })
    .catch((err: unknown) => {
      arcs = undefined;
      throw err;
    });
  return arcs;
}
