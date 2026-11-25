import type { ChapterArcs } from "./types";

let arcs: Promise<ChapterArcs> | undefined;

/**
 * The chapter-level cross-reference arcs (public/data/xrefs/chapter-arcs.json).
 * Memoised; a failed request is forgotten so the next call retries.
 */
export function loadChapterArcs(): Promise<ChapterArcs> {
  arcs ??= fetch("/data/xrefs/chapter-arcs.json")
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
