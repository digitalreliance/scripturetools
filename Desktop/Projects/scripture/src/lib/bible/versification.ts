import { BOOK_IDS, type BookId } from "./canon";
import { KJV_TOTALS, VERSE_COUNTS } from "./generated/kjv-meta";
import type { VerseLocation } from "./types";

/**
 * KJV versification, from the generated verse counts (no data fetch needed).
 *
 * "Ordinal" numbers are 1-based within a book (Revelation 12:9 is verse 203 of
 * Revelation); "index" numbers are 0-based across the Bible (Genesis 1:1 is 0,
 * Revelation 22:21 is 31,101), matching `globalChapterIndex` in canon.ts.
 */

const NO_CHAPTERS: readonly number[] = [];

/** For each book, the number of verses before each chapter (prefix sums). */
const CHAPTER_OFFSETS = new Map<BookId, readonly number[]>();
/** Number of verses before each book. */
const BOOK_OFFSETS = new Map<BookId, number>();
{
  let before = 0;
  for (const id of BOOK_IDS) {
    BOOK_OFFSETS.set(id, before);
    const offsets: number[] = [];
    let inBook = 0;
    for (const count of VERSE_COUNTS[id]) {
      offsets.push(inBook);
      inBook += count;
    }
    CHAPTER_OFFSETS.set(id, offsets);
    before += inBook;
  }
}

/** Verse count of every chapter of `book` (index 0 is chapter 1). */
export function chapterVerseCounts(book: BookId): readonly number[] {
  return VERSE_COUNTS[book] ?? NO_CHAPTERS;
}

/** Verses in `book` `chapter`; 0 when the chapter does not exist. */
export function verseCount(book: BookId, chapter: number): number {
  return Number.isInteger(chapter) ? (chapterVerseCounts(book)[chapter - 1] ?? 0) : 0;
}

/** Verses in the whole book (Revelation: 404). */
export function bookVerseCount(book: BookId): number {
  const counts = chapterVerseCounts(book);
  const offsets = CHAPTER_OFFSETS.get(book);
  return offsets && counts.length ? offsets[counts.length - 1] + counts[counts.length - 1] : 0;
}

export function isValidVerse(book: BookId, chapter: number, verse: number): boolean {
  return Number.isInteger(verse) && verse >= 1 && verse <= verseCount(book, chapter);
}

function assertVerse(book: BookId, chapter: number, verse: number) {
  if (!isValidVerse(book, chapter, verse)) {
    throw new RangeError(`No such verse in the KJV: ${book} ${chapter}:${verse}`);
  }
}

/** 1-based position of a verse within its book: verseOrdinal("REV", 12, 9) === 203. */
export function verseOrdinal(book: BookId, chapter: number, verse: number): number {
  assertVerse(book, chapter, verse);
  return CHAPTER_OFFSETS.get(book)![chapter - 1] + verse;
}

/** Inverse of `verseOrdinal`: verseAtOrdinal("REV", 203) → { chapter: 12, verse: 9 }. */
export function verseAtOrdinal(book: BookId, ordinal: number): { chapter: number; verse: number } {
  const offsets = CHAPTER_OFFSETS.get(book);
  if (!offsets || !Number.isInteger(ordinal) || ordinal < 1 || ordinal > bookVerseCount(book)) {
    throw new RangeError(`${book} has no verse number ${ordinal}`);
  }
  // Last chapter whose offset is below the ordinal (binary search over ≤150 chapters).
  let lo = 0;
  let hi = offsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (offsets[mid] < ordinal) lo = mid;
    else hi = mid - 1;
  }
  return { chapter: lo + 1, verse: ordinal - offsets[lo] };
}

/** 0-based position across the whole Bible: Genesis 1:1 → 0, Revelation 22:21 → 31101. */
export function globalVerseIndex(book: BookId, chapter: number, verse: number): number {
  return BOOK_OFFSETS.get(book)! + verseOrdinal(book, chapter, verse) - 1;
}

/** Inverse of `globalVerseIndex`. */
export function verseAtGlobalIndex(index: number): VerseLocation {
  if (!Number.isInteger(index) || index < 0 || index >= KJV_TOTALS.verses) {
    throw new RangeError(`Verse index out of range: ${index}`);
  }
  let book: BookId = BOOK_IDS[0];
  for (const id of BOOK_IDS) {
    if (BOOK_OFFSETS.get(id)! > index) break;
    book = id;
  }
  return { book, ...verseAtOrdinal(book, index - BOOK_OFFSETS.get(book)! + 1) };
}
