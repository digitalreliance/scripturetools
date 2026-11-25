import { BOOKS, TOTAL_CHAPTERS } from "../../../src/lib/bible/canon";
import { stripMarkup, validateMarkup } from "../../../src/lib/bible/markup";
import type { BookText, KjvTotals } from "../../../src/lib/bible/types";

/** Verses in the standard KJV versification. */
export const EXPECTED_VERSES = 31_102;

/** Whitespace-delimited tokens of the plain text that contain a letter or digit. */
export function countWords(t: string): number {
  let n = 0;
  for (const token of stripMarkup(t).split(" ")) if (/[\p{L}\p{N}]/u.test(token)) n++;
  return n;
}

/**
 * Throw, listing the problems, unless `books` is the complete, clean KJV:
 * the 66 books of canon.ts in order with its chapter counts, 1,189 chapters,
 * exactly 31,102 contiguous verses, no empty verse, no leftover USFM, and
 * balanced, grammatical markup everywhere. Returns the totals.
 */
export function validateKjv(books: readonly BookText[]): KjvTotals {
  const problems: string[] = [];
  const problem = (message: string) => problems.push(message);

  const checkPlain = (text: string, at: string) => {
    if (text.includes("\\")) problem(`${at}: leftover backslash marker`);
    if (/[|¶]|strong=/.test(text)) problem(`${at}: leftover USFM residue`);
    if (/\s\s|^\s|\s$|[\t\n\r]/.test(text)) problem(`${at}: whitespace not collapsed`);
  };
  const checkMarked = (text: string, at: string) => {
    if (!stripMarkup(text).trim()) problem(`${at}: empty`);
    const markupProblem = validateMarkup(text);
    if (markupProblem) problem(`${at}: ${markupProblem}`);
    if (/<[ijn]> | <\/[ijn]>/.test(text)) problem(`${at}: space just inside a tag`);
    checkPlain(text, at);
  };

  if (books.length !== BOOKS.length) problem(`expected ${BOOKS.length} books, got ${books.length}`);

  let chapters = 0;
  let verses = 0;
  let words = 0;
  BOOKS.forEach((meta, i) => {
    const book = books[i];
    if (!book) return;
    if (book.id !== meta.id) {
      problem(`book ${i + 1} is ${book.id}; canon.ts expects ${meta.id}`);
      return;
    }
    if (book.chapters.length !== meta.chapters) {
      problem(`${meta.id}: ${book.chapters.length} chapters; canon.ts says ${meta.chapters}`);
    }
    book.chapters.forEach((chapter, ci) => {
      chapters++;
      const where = `${meta.id} ${chapter.n}`;
      if (chapter.n !== ci + 1) problem(`${where}: chapter out of order`);
      if (!chapter.verses.length) problem(`${where}: no verses`);
      if (chapter.title !== undefined) checkMarked(chapter.title, `${where} title`);
      if (chapter.colophon !== undefined) checkMarked(chapter.colophon, `${where} colophon`);
      chapter.verses.forEach((verse, vi) => {
        verses++;
        const at = `${where}:${verse.n}`;
        if (verse.n !== vi + 1) problem(`${at}: verse out of order`);
        checkMarked(verse.t, at);
        words += countWords(verse.t);
        if (verse.p !== undefined && verse.p !== 1) problem(`${at}: p must be 1 when present`);
        if (verse.h !== undefined && !/^[A-Z]+$/.test(verse.h)) problem(`${at}: bad heading "${verse.h}"`);
        for (const note of verse.notes ?? []) {
          if (!note) problem(`${at}: empty note`);
          checkPlain(note, `${at} note`);
        }
      });
    });
  });

  if (chapters !== TOTAL_CHAPTERS) problem(`expected ${TOTAL_CHAPTERS} chapters, got ${chapters}`);
  if (verses !== EXPECTED_VERSES) problem(`expected ${EXPECTED_VERSES} verses, got ${verses}`);

  if (problems.length) {
    const shown = problems.slice(0, 40).join("\n  ");
    const more = problems.length > 40 ? `\n  …and ${problems.length - 40} more` : "";
    throw new Error(`KJV validation failed (${problems.length} problems):\n  ${shown}${more}`);
  }
  return { books: books.length, chapters, verses, words };
}
