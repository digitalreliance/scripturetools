import { describe, expect, it } from "vitest";
import { BOOKS } from "@/lib/bible/canon";
import {
  expandReference,
  formatReference,
  isValidReference,
  parseBookName,
  parseReference,
  referenceBounds,
  toReference,
} from "@/lib/bible/reference";
import type { Reference } from "@/lib/bible/types";
import { verseCount } from "@/lib/bible/versification";

// input → [canonical, long, short]
const CASES: [string, string, string, string][] = [
  ["Rev 12:9", "REV 12:9", "Revelation 12:9", "Rev 12:9"],
  ["rev12:9", "REV 12:9", "Revelation 12:9", "Rev 12:9"],
  ["Revelation 12:9–10", "REV 12:9-10", "Revelation 12:9–10", "Rev 12:9–10"],
  ["1 Cor 13", "1CO 13", "1 Corinthians 13", "1 Cor 13"],
  ["I John 4:8", "1JN 4:8", "1 John 4:8", "1 John 4:8"],
  ["First Samuel 3:10", "1SA 3:10", "1 Samuel 3:10", "1 Sam 3:10"],
  ["Song of Songs 2:4", "SNG 2:4", "Song of Solomon 2:4", "Song 2:4"],
  ["Ps 23", "PSA 23", "Psalm 23", "Ps 23"],
  ["Jude 3", "JUD 1:3", "Jude 3", "Jude 3"],
  ["Obad 4", "OBA 1:4", "Obadiah 4", "Obad 4"],
  ["Gen 1:1-2:3", "GEN 1:1-2:3", "Genesis 1:1–2:3", "Gen 1:1–2:3"],
  // Canonical strings themselves.
  ["REV 12:9", "REV 12:9", "Revelation 12:9", "Rev 12:9"],
  ["REV 12:9-11", "REV 12:9-11", "Revelation 12:9–11", "Rev 12:9–11"],
  ["REV 4:10-5:1", "REV 4:10-5:1", "Revelation 4:10–5:1", "Rev 4:10–5:1"],
  ["REV 12", "REV 12", "Revelation 12", "Rev 12"],
  ["REV 2-3", "REV 2-3", "Revelation 2–3", "Rev 2–3"],
  ["JUD 1", "JUD 1", "Jude", "Jude"],
  // A few more human spellings.
  ["Rev. 12:9a", "REV 12:9", "Revelation 12:9", "Rev 12:9"],
  ["Gen.1.1", "GEN 1:1", "Genesis 1:1", "Gen 1:1"],
  ["  revelation   12 : 9 - 11 ", "REV 12:9-11", "Revelation 12:9–11", "Rev 12:9–11"],
  ["II Kings 2:11", "2KI 2:11", "2 Kings 2:11", "2 Kgs 2:11"],
  ["1st Peter 5:7", "1PE 5:7", "1 Peter 5:7", "1 Pet 5:7"],
  ["Psalms 120-134", "PSA 120-134", "Psalms 120–134", "Ps 120–134"],
  ["Jude", "JUD 1", "Jude", "Jude"],
  ["Phlm 1:10", "PHM 1:10", "Philemon 10", "Phlm 10"],
  ["3 John 1-4", "3JN 1:1-4", "3 John 1–4", "3 John 1–4"],
];

describe("parseReference / formatReference", () => {
  it.each(CASES)("%s", (input, canonical, long, short) => {
    const ref = parseReference(input);
    expect(ref).not.toBeNull();
    expect(formatReference(ref!, "canonical")).toBe(canonical);
    expect(formatReference(ref!, "long")).toBe(long);
    expect(formatReference(ref!, "short")).toBe(short);
    // Every formatted style parses back to the same reference.
    for (const text of [canonical, long, short]) expect(parseReference(text)).toEqual(ref);
  });

  it("returns the normalized shapes", () => {
    expect(parseReference("REV 12")).toEqual({ book: "REV", chapter: 12 });
    expect(parseReference("REV 2-3")).toEqual({ book: "REV", chapter: 2, endChapter: 3 });
    expect(parseReference("REV 12:9")).toEqual({ book: "REV", chapter: 12, verse: 9 });
    expect(parseReference("REV 12:9-11")).toEqual({ book: "REV", chapter: 12, verse: 9, endVerse: 11 });
    expect(parseReference("REV 4:10-5:1")).toEqual({ book: "REV", chapter: 4, verse: 10, endChapter: 5, endVerse: 1 });
    // Degenerate ranges collapse.
    expect(parseReference("Rev 12:9-9")).toEqual({ book: "REV", chapter: 12, verse: 9 });
    expect(parseReference("Rev 12:9-12:11")).toEqual({ book: "REV", chapter: 12, verse: 9, endVerse: 11 });
    // A lone number is a verse in single-chapter books, a chapter elsewhere.
    expect(parseReference("Jude 1")).toEqual({ book: "JUD", chapter: 1, verse: 1 });
    expect(parseReference("JUD 3")).toEqual({ book: "JUD", chapter: 1, verse: 3 });
    expect(parseReference("Rev 1")).toEqual({ book: "REV", chapter: 1 });
  });

  it.each([
    "", "   ", "12:9", "Revelation", "Rev 23", "Rev 12:18", "Rev 0:1", "Ps 151", "Jude 2:1",
    "Jude 26", "Xyz 1:1", "Rev 12:9-8", "Gen 2:3-1:1", "Rev 12:9,11", "Rev 12-13:2", "Rev 12:9 KJV",
    "phi 1:1", "rev 12::9",
  ])("rejects %j", (input) => {
    expect(parseReference(input)).toBeNull();
  });

  it("round-trips every book in every style", () => {
    for (const book of BOOKS) {
      const refs: Reference[] = [
        { book: book.id, chapter: 1 },
        { book: book.id, chapter: 1, verse: 1 },
        { book: book.id, chapter: 1, verse: 1, endVerse: 2 },
      ];
      if (book.chapters > 1) {
        refs.push({ book: book.id, chapter: 1, endChapter: book.chapters });
        refs.push({ book: book.id, chapter: 1, verse: verseCount(book.id, 1), endChapter: 2, endVerse: 1 });
      }
      for (const ref of refs) {
        for (const style of ["canonical", "long", "short"] as const) {
          expect(parseReference(formatReference(ref, style)), `${book.id} ${style}`).toEqual(ref);
        }
      }
    }
  });

  it("formats and expands string input too", () => {
    expect(formatReference("rev 12:9-10")).toBe("Revelation 12:9–10");
    expect(formatReference("REV 12:9-10", "short")).toBe("Rev 12:9–10");
    expect(() => formatReference({ book: "REV", chapter: 23 })).toThrow(RangeError);
  });
});

describe("toReference / isValidReference / bounds / expand", () => {
  it("validates and normalizes Reference objects", () => {
    expect(toReference({ book: "REV", chapter: 12, verse: 9, endVerse: 9 })).toEqual({ book: "REV", chapter: 12, verse: 9 });
    expect(isValidReference({ book: "REV", chapter: 12, verse: 17 })).toBe(true);
    expect(isValidReference({ book: "REV", chapter: 12, verse: 18 })).toBe(false);
    expect(isValidReference({ book: "REV", chapter: 12, endVerse: 3 })).toBe(false);
    expect(isValidReference({ book: "REV", chapter: 4, verse: 10, endChapter: 5 })).toBe(false);
    expect(() => toReference("not a reference")).toThrow(RangeError);
  });

  it("computes bounds", () => {
    expect(referenceBounds("REV 12")).toEqual({
      start: { book: "REV", chapter: 12, verse: 1 },
      end: { book: "REV", chapter: 12, verse: 17 },
    });
    expect(referenceBounds("REV 2-3").end).toEqual({ book: "REV", chapter: 3, verse: 22 });
    expect(referenceBounds("REV 12:9").end).toEqual({ book: "REV", chapter: 12, verse: 9 });
  });

  it("expands to every verse", () => {
    expect(expandReference("REV 12:9-11")).toEqual([
      { book: "REV", chapter: 12, verse: 9 },
      { book: "REV", chapter: 12, verse: 10 },
      { book: "REV", chapter: 12, verse: 11 },
    ]);
    expect(expandReference("REV 4:10-5:1").map((v) => `${v.chapter}:${v.verse}`)).toEqual(["4:10", "4:11", "5:1"]);
    expect(expandReference("REV 12")).toHaveLength(17);
    expect(expandReference("REV 2-3")).toHaveLength(29 + 22);
    expect(expandReference("Jude")).toHaveLength(25);
  });
});

describe("parseBookName", () => {
  it.each([
    ["REV", "REV"], ["Rev.", "REV"], ["revelation", "REV"], ["Revelations", "REV"], ["revel", "REV"],
    ["1 Cor", "1CO"], ["1cor", "1CO"], ["I John", "1JN"], ["First Samuel", "1SA"], ["II Kings", "2KI"],
    ["Song of Songs", "SNG"], ["song-of-solomon", "SNG"], ["Ps", "PSA"], ["Psalm", "PSA"], ["phile", "PHM"],
    ["Jude", "JUD"], ["judg", "JDG"], ["Ezek", "EZK"], ["1John", "1JN"],
  ])("%s → %s", (input, id) => {
    expect(parseBookName(input)?.id).toBe(id);
  });

  it("rejects unknown and ambiguous names", () => {
    for (const input of ["phi", "jo", "xyz", "", "1 c"]) expect(parseBookName(input)).toBeUndefined();
  });

  it("has no alias that names two books", () => {
    const owner = new Map<string, string>();
    for (const book of BOOKS) {
      for (const key of [book.id, book.osis, book.slug, book.name, book.short, ...book.aliases]) {
        const k = key.toLowerCase().replace(/[\s-]/g, "");
        expect(owner.get(k) ?? book.id, `"${key}"`).toBe(book.id);
        owner.set(k, book.id);
      }
    }
  });
});
