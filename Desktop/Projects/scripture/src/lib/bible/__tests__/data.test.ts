import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BOOKS, TOTAL_CHAPTERS } from "@/lib/bible/canon";
import { KJV_TOTALS, KJV_TRANSLATION, VERSE_COUNTS, WORD_COUNTS } from "@/lib/bible/generated/kjv-meta";
import { stripMarkup, validateMarkup } from "@/lib/bible/markup";
import { readBook, readChapter, readPassage } from "@/lib/bible/server";
import type { KjvIndex } from "@/lib/bible/types";

const index = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "public/data/kjv/index.json"), "utf8"),
) as KjvIndex;

const verse = (id: Parameters<typeof readChapter>[0], chapter: number, n: number) =>
  readChapter(id, chapter).verses[n - 1];

describe("generated KJV data", () => {
  it("has the standard totals", () => {
    expect(KJV_TOTALS).toMatchObject({ books: 66, chapters: 1189, verses: 31_102 });
    expect(KJV_TOTALS.chapters).toBe(TOTAL_CHAPTERS);
    expect(index.totals).toEqual(KJV_TOTALS);
    const sum = (ids: typeof BOOKS) =>
      ids.reduce((n, b) => n + VERSE_COUNTS[b.id].reduce((a, c) => a + c, 0), 0);
    expect(sum(BOOKS.filter((b) => b.testament === "OT"))).toBe(23_145);
    expect(sum(BOOKS.filter((b) => b.testament === "NT"))).toBe(7_957);
  });

  it("matches canon.ts and index.json book by book", () => {
    expect(index.books.map((b) => b.id)).toEqual(BOOKS.map((b) => b.id));
    for (const meta of BOOKS) {
      const book = readBook(meta.id);
      const entry = index.books[meta.order - 1];
      expect(book.id).toBe(meta.id);
      expect(book.chapters).toHaveLength(meta.chapters);
      expect(book.chapters.map((c) => c.verses.length)).toEqual(VERSE_COUNTS[meta.id]);
      expect(entry.chapters).toEqual(VERSE_COUNTS[meta.id]);
      expect(entry.words).toBe(WORD_COUNTS[meta.id]);
    }
    expect(Object.values(WORD_COUNTS).reduce((a, b) => a + b, 0)).toBe(KJV_TOTALS.words);
    expect(index.translation).toMatchObject({ ...KJV_TRANSLATION, generatedAt: expect.any(String) });
    expect(KJV_TRANSLATION.license).toBe("Public domain");
  });

  it("has clean, contiguous, well-formed verses everywhere", () => {
    for (const meta of BOOKS) {
      readBook(meta.id).chapters.forEach((chapter, ci) => {
        expect(chapter.n).toBe(ci + 1);
        expect(chapter.verses[0].p).toBe(1); // every chapter opens a paragraph
        for (const text of [chapter.title, chapter.colophon]) {
          if (text !== undefined) expect(validateMarkup(text)).toBeNull();
        }
        chapter.verses.forEach((v, vi) => {
          expect(v.n).toBe(vi + 1);
          expect(stripMarkup(v.t).trim().length).toBeGreaterThan(0);
          expect(validateMarkup(v.t)).toBeNull();
          expect(v.t).not.toMatch(/[\\|¶]|strong=|\s\s|^\s|\s$/);
        });
      });
    }
  });

  it("has the right counts for Revelation, its 12th chapter and 3 John", () => {
    const rev = readBook("REV");
    expect(rev.chapters).toHaveLength(22);
    expect(rev.chapters.reduce((n, c) => n + c.verses.length, 0)).toBe(404);
    expect(readChapter("REV", 12).verses).toHaveLength(17);
    expect(readChapter("3JN", 1).verses).toHaveLength(14);
  });

  it("reproduces exact verse text", () => {
    expect(verse("GEN", 1, 1).t).toBe("In the beginning God created the heaven and the earth.");
    expect(verse("JHN", 11, 35).t).toBe("Jesus wept.");
    expect(verse("REV", 22, 21).t).toBe("The grace of our Lord Jesus Christ <i>be</i> with you all. Amen.");
  });

  it("marks supplied words, words of Christ and the divine name", () => {
    expect(verse("GEN", 1, 2).t).toContain("darkness <i>was</i> upon");
    expect(verse("JHN", 3, 16).t).toBe(
      "<j>For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.</j>",
    );
    expect(verse("MRK", 2, 9).t).toMatch(/^<j>Whether is it easier .* <i>Thy<\/i> sins be forgiven thee;.*<\/j>$/);
    expect(verse("PSA", 23, 1).t).toBe("The <n>LORD</n> <i>is</i> my shepherd; I shall not want.");
    // \nd inside \add is emitted as <n> next to the supplied words (no <n> inside <i>).
    expect(verse("LEV", 24, 11).t).toContain("the name <i>of the</i> <n>LORD</n>, and cursed.");
  });

  it("turns pilcrows and paragraph markers into p", () => {
    const mat513 = verse("MAT", 5, 13);
    expect(mat513.p).toBe(1);
    expect(mat513.t.startsWith("<j>Ye are the salt of the earth")).toBe(true);
    expect(verse("GEN", 1, 6).p).toBe(1);
    expect(verse("GEN", 1, 2).p).toBeUndefined();
    expect(readChapter("PSA", 23).verses.every((v) => v.p === 1)).toBe(true);
  });

  it("keeps Psalm titles, Psalm 119 headings, colophons and notes", () => {
    expect(readChapter("PSA", 23).title).toBe("A Psalm of David.");
    expect(readChapter("PSA", 1).title).toBeUndefined();
    expect(readChapter("PSA", 18).title).toContain("the servant of the <n>LORD</n>");
    expect(readBook("PSA").chapters.filter((c) => c.title)).toHaveLength(116);

    expect(verse("PSA", 119, 1).h).toBe("ALEPH");
    const headings = readChapter("PSA", 119).verses.filter((v) => v.h);
    expect(headings.map((v) => v.n)).toEqual(Array.from({ length: 22 }, (_, i) => i * 8 + 1));
    expect(headings.at(-1)?.h).toBe("TAU");

    expect(readChapter("ROM", 16).colophon).toBe(
      "Written to the Romans from Corinthus, <i>and sent</i> by Phebe servant of the church at Cenchrea.",
    );
    expect(readChapter("ROM", 15).colophon).toBeUndefined();
    expect(BOOKS.filter((b) => readBook(b.id).chapters.at(-1)?.colophon)).toHaveLength(14);

    expect(verse("GEN", 1, 6).notes).toEqual(["firmament: Heb. expansion"]);
    expect(verse("GEN", 1, 1).notes).toBeUndefined();
  });

  it("reads passages across chapters and rejects bad input", () => {
    expect(readPassage("REV 4:10-5:1").map((v) => `${v.chapter}:${v.n}`)).toEqual(["4:10", "4:11", "5:1"]);
    expect(readPassage({ book: "REV", chapter: 12, verse: 9, endVerse: 11 })).toHaveLength(3);
    expect(readPassage("Jude 3")[0]).toMatchObject({ chapter: 1, n: 3 });
    expect(() => readPassage("REV 12:18")).toThrow(RangeError);
    expect(() => readChapter("REV", 23)).toThrow(RangeError);
  });

  it("returns frozen, shared data", () => {
    const book = readBook("JHN");
    expect(readBook("JHN")).toBe(book);
    expect(Object.isFrozen(book.chapters[10].verses[34])).toBe(true);
    expect(() => {
      (book.chapters[10].verses[34] as { t: string }).t = "changed";
    }).toThrow(TypeError);
  });
});
