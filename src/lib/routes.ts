import { getBookOrThrow } from "@/lib/bible/canon";

/**
 * URL helpers. Keep every internal URL built here so routes can change in one
 * place.
 *
 * Reader verse anchors use the hash so chapter pages stay fully static:
 *   /read/revelation/12#v9      one verse
 *   /read/revelation/12#v9-10   a range within the chapter
 */
export function readerHref(
  book: string,
  chapter = 1,
  verse?: number,
  endVerse?: number,
): string {
  const { slug } = getBookOrThrow(book);
  const base = `/read/${slug}/${chapter}`;
  if (!verse) return base;
  return endVerse && endVerse > verse
    ? `${base}#v${verse}-${endVerse}`
    : `${base}#v${verse}`;
}

export function studyHref(slug: string): string {
  return `/studies/${slug}`;
}

export const HOME_HREF = "/";
export const READER_HOME_HREF = "/read";

/** What the service worker shows, offline, in place of a page it hasn't kept. */
export const OFFLINE_HREF = "/offline";
