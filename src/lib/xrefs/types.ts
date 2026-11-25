import type { BookId } from "@/lib/bible/canon";

/**
 * Shapes of the generated cross-reference data in public/data/xrefs
 * (written by `npm run data:xrefs`; see docs/data/xrefs.md).
 */

/** A verse within a book, "chapter:verse": "12:9". */
export type VerseKey = `${number}:${number}`;

/**
 * One cross reference: [canonical reference, votes], e.g. ["ISA 14:12", 11].
 * The reference is a canonical string ("REV 12:9", "REV 12:9-11",
 * "REV 4:10-5:1") that `parseReference` from `@/lib/bible` accepts. Votes are
 * OpenBible.info's helpfulness votes, always ≥ 1 here.
 */
export type XrefTarget = readonly [ref: string, votes: number];

/**
 * `public/data/xrefs/books/{ID}.json`: each verse's outgoing references, keyed
 * "chapter:verse" in canon order, at most 12 per verse, strongest first.
 * Verses without references are absent.
 */
export type VerseXrefs = Readonly<Partial<Record<VerseKey, readonly XrefTarget[]>>>;

/**
 * An undirected link between two chapters: [a, b, weight], where a < b are
 * 0-based global chapter indices (`globalChapterIndex` in `@/lib/bible`:
 * Genesis 1 = 0, Revelation 22 = 1188) and weight counts the verse-level
 * references between the two chapters in either direction.
 */
export type ChapterLink = readonly [a: number, b: number, weight: number];

/** Where a book's chapters sit on the 0…1188 chapter axis. */
export interface ChapterArcsBook {
  id: BookId;
  /** Global index of the book's first chapter. */
  start: number;
  /** Number of chapters. */
  chapters: number;
}

export interface ChapterArcsTotals {
  /** Data rows in the source file. */
  rows: number;
  /** Rows used: votes > 0 and every reference a KJV verse (after remapping). */
  kept: number;
  /** rows − kept: non-positive votes, references the KJV lacks, self-references. */
  dropped: number;
  /** Kept rows that needed a versification remap (e.g. 3 John 1:15 → 1:14). */
  remapped: number;
  /** Distinct chapter pairs linked by at least one kept reference. */
  links: number;
  /** Chapter pairs in this file (the strongest `links`). */
  linksKept: number;
}

/** Provenance of the generated data. */
export interface XrefsSourceInfo {
  name: string;
  /** Page that describes the dataset and states its licence. */
  url: string;
  license: string;
  licenseUrl: string;
  /** The credit line to show (`XREFS_CREDIT.text`). */
  attribution: string;
  /** Export date printed in the source file's header (OpenBible regenerates it daily). */
  retrieved: string;
  /** SHA-256 of the downloaded archive. */
  sha256: string;
}

/** `public/data/xrefs/chapter-arcs.json`: the chapter-level arc diagram. */
export interface ChapterArcs {
  version: 1;
  /** Length of the chapter axis: 1189. */
  chapters: number;
  /** All 66 books in canon order. */
  books: readonly ChapterArcsBook[];
  /** The strongest chapter pairs, sorted by `a`, then `b`. */
  links: readonly ChapterLink[];
  /** Largest weight in `links`. */
  maxWeight: number;
  /** Smallest weight in `links`: every pair at least this strong is included. */
  minWeight: number;
  totals: ChapterArcsTotals;
  source: XrefsSourceInfo;
}
