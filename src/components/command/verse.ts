import { parseReference } from "@/lib/bible/reference";

/** A chapter and verse with no book: "12:9", "12.9", "4:10-5:1". */
const BARE = /^\d+\s*[:.]\s*\d/;

/**
 * The verse in Revelation that a palette search names, or null: "Rev 12:9",
 * "revelation 12:9-11", or a bare "12:9", since Revelation is the one book the
 * palette finds verses in. A range gives its first verse.
 */
export function revelationVerse(query: string): { chapter: number; verse: number } | null {
  const text = query.trim();
  if (text.length < 3) return null;
  const ref = parseReference(BARE.test(text) ? `Rev ${text}` : text);
  return ref?.book === "REV" && ref.verse !== undefined ? { chapter: ref.chapter, verse: ref.verse } : null;
}
