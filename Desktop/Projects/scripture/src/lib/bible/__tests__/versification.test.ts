import { describe, expect, it } from "vitest";
import { BOOKS } from "@/lib/bible/canon";
import { KJV_TOTALS } from "@/lib/bible/generated/kjv-meta";
import {
  bookVerseCount,
  chapterVerseCounts,
  globalVerseIndex,
  isValidVerse,
  verseAtGlobalIndex,
  verseAtOrdinal,
  verseCount,
  verseOrdinal,
} from "@/lib/bible/versification";

describe("versification", () => {
  it("counts verses", () => {
    expect(verseCount("REV", 12)).toBe(17);
    expect(verseCount("3JN", 1)).toBe(14);
    expect(verseCount("PSA", 119)).toBe(176);
    expect(verseCount("REV", 23)).toBe(0);
    expect(verseCount("REV", 0)).toBe(0);
    expect(verseCount("REV", 1.5)).toBe(0);
    expect(chapterVerseCounts("REV")).toHaveLength(22);
    expect(bookVerseCount("REV")).toBe(404);
    expect(bookVerseCount("GEN")).toBe(1533);
    expect(BOOKS.reduce((n, b) => n + bookVerseCount(b.id), 0)).toBe(KJV_TOTALS.verses);
  });

  it("validates verses", () => {
    expect(isValidVerse("REV", 12, 17)).toBe(true);
    expect(isValidVerse("REV", 12, 18)).toBe(false);
    expect(isValidVerse("REV", 12, 0)).toBe(false);
    expect(isValidVerse("REV", 23, 1)).toBe(false);
    expect(isValidVerse("JUD", 1, 25)).toBe(true);
  });

  it("numbers verses within a book", () => {
    expect(verseOrdinal("REV", 12, 9)).toBe(203);
    expect(verseOrdinal("REV", 12, 10)).toBe(204);
    expect(verseOrdinal("GEN", 1, 1)).toBe(1);
    expect(verseOrdinal("REV", 22, 21)).toBe(404);
    expect(verseAtOrdinal("REV", 203)).toEqual({ chapter: 12, verse: 9 });
    expect(verseAtOrdinal("REV", 1)).toEqual({ chapter: 1, verse: 1 });
    expect(verseAtOrdinal("REV", 404)).toEqual({ chapter: 22, verse: 21 });
    expect(() => verseOrdinal("REV", 12, 18)).toThrow(RangeError);
    expect(() => verseAtOrdinal("REV", 405)).toThrow(RangeError);
    expect(() => verseAtOrdinal("REV", 0)).toThrow(RangeError);
  });

  it("inverts verseOrdinal for every verse of every book", () => {
    for (const book of BOOKS) {
      let ordinal = 0;
      chapterVerseCounts(book.id).forEach((count, c) => {
        for (let v = 1; v <= count; v++) {
          ordinal++;
          expect(verseOrdinal(book.id, c + 1, v)).toBe(ordinal);
          expect(verseAtOrdinal(book.id, ordinal)).toEqual({ chapter: c + 1, verse: v });
        }
      });
    }
  });

  it("numbers verses across the Bible", () => {
    expect(globalVerseIndex("GEN", 1, 1)).toBe(0);
    expect(globalVerseIndex("MAT", 1, 1)).toBe(23_145);
    expect(globalVerseIndex("REV", 22, 21)).toBe(31_101);
    expect(verseAtGlobalIndex(23_145)).toEqual({ book: "MAT", chapter: 1, verse: 1 });
    expect(verseAtGlobalIndex(31_101)).toEqual({ book: "REV", chapter: 22, verse: 21 });
    for (let i = 0; i < KJV_TOTALS.verses; i += 997) {
      const { book, chapter, verse } = verseAtGlobalIndex(i);
      expect(globalVerseIndex(book, chapter, verse)).toBe(i);
    }
    expect(() => verseAtGlobalIndex(31_102)).toThrow(RangeError);
    expect(() => verseAtGlobalIndex(-1)).toThrow(RangeError);
  });
});
