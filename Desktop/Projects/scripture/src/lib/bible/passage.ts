import { formatReference, referenceBounds, toReference } from "./reference";
import type { BookText, PassageVerse, ReferenceInput } from "./types";

/**
 * The verses of a reference, taken from a book that is already loaded, each
 * tagged with its chapter. `readPassage` (server) and `loadPassage` (browser)
 * are this plus loading. Throws RangeError for an invalid reference or one
 * from another book.
 */
export function selectPassage(book: BookText, input: ReferenceInput): PassageVerse[] {
  const ref = toReference(input);
  if (ref.book !== book.id) {
    throw new RangeError(`${formatReference(ref, "canonical")} is not in ${book.id}`);
  }
  const { start, end } = referenceBounds(ref);
  const verses: PassageVerse[] = [];
  for (let n = start.chapter; n <= end.chapter; n++) {
    const chapter = book.chapters[n - 1];
    const first = n === start.chapter ? start.verse : 1;
    const last = n === end.chapter ? end.verse : chapter.verses.length;
    for (const verse of chapter.verses.slice(first - 1, last)) verses.push({ chapter: n, ...verse });
  }
  return verses;
}
