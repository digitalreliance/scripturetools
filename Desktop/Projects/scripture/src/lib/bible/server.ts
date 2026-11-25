import "server-only";

import fs from "node:fs";
import path from "node:path";
import { isBookId, type BookId } from "./canon";
import { deepFreeze } from "./freeze";
import { selectPassage } from "./passage";
import { toReference } from "./reference";
import type { BookText, Chapter, PassageVerse, ReferenceInput } from "./types";

/**
 * Server-side access to the generated KJV data in public/data/kjv.
 *
 * Synchronous reads, so Server Components can call these during static
 * prerendering without Suspense or 'use cache'. Each book is read once per
 * process and cached; returned objects are frozen and shared, so copy
 * before changing anything.
 */

const BOOKS_DIR = path.join(process.cwd(), "public", "data", "kjv", "books");
const cache = new Map<BookId, BookText>();

/** A whole book, e.g. readBook("REV").chapters[11].verses[8] is Revelation 12:9. */
export function readBook(id: BookId): BookText {
  let book = cache.get(id);
  if (!book) {
    if (!isBookId(id)) throw new RangeError(`Unknown book id: ${String(id)}`);
    const json = fs.readFileSync(path.join(BOOKS_DIR, `${id}.json`), "utf8");
    book = deepFreeze(JSON.parse(json) as BookText);
    cache.set(id, book);
  }
  return book;
}

/** One chapter (1-based). Throws RangeError if the book has no such chapter. */
export function readChapter(id: BookId, n: number): Chapter {
  const chapter = Number.isInteger(n) ? readBook(id).chapters[n - 1] : undefined;
  if (!chapter) throw new RangeError(`${id} has no chapter ${n}`);
  return chapter;
}

/**
 * The verses of a reference, each tagged with its chapter:
 * readPassage("REV 4:10-5:1") → [{ chapter: 4, n: 10, t }, { chapter: 4, n: 11, t }, { chapter: 5, n: 1, t }].
 * Accepts a Reference or any string `parseReference` understands; throws RangeError if invalid.
 */
export function readPassage(ref: ReferenceInput): PassageVerse[] {
  const reference = toReference(ref);
  return selectPassage(readBook(reference.book), reference);
}
