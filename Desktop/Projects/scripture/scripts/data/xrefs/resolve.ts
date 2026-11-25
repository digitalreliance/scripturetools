import { BOOKS, BOOK_IDS, type BookId } from "../../../src/lib/bible/canon";
import { formatReference, toReference } from "../../../src/lib/bible/reference";
import type { Reference, VerseLocation } from "../../../src/lib/bible/types";
import { chapterVerseCounts, isValidVerse, verseCount } from "../../../src/lib/bible/versification";
import type { OsisVerse, XrefRow } from "./parse";

/**
 * Turn parsed OpenBible rows into KJV references:
 *
 *   1. OSIS book ids map to USFM ids through the `osis` field of canon.ts.
 *   2. Every verse is checked against KJV versification. OpenBible numbers
 *      verses like the ESV, which in two places has a verse the KJV lacks;
 *      VERSE_REMAPS moves those to the KJV verse that holds the same words.
 *      Anything else that is not a KJV verse drops the row.
 *   3. A target range that crosses a book boundary ("2Chr.36.22-Ezra.1.3")
 *      becomes one reference per book, because canonical references stay
 *      within a book.
 *   4. Rows with zero or negative votes are dropped, and so is a target equal
 *      to its own source verse.
 */

const BOOK_BY_OSIS: ReadonlyMap<string, BookId> = new Map(BOOKS.map((b) => [b.osis, b.id]));
const BOOK_ORDER: ReadonlyMap<BookId, number> = new Map(BOOK_IDS.map((id, i) => [id, i]));

/** USFM id for an exact OSIS book id ("1John" → "1JN"); undefined for books outside the canon. */
export function osisBook(osis: string): BookId | undefined {
  return BOOK_BY_OSIS.get(osis);
}

export interface VerseRemap {
  /** The verse as OpenBible numbers it; not a KJV verse. */
  from: VerseLocation;
  /** The KJV verse that holds the same words. */
  to: VerseLocation;
  /** Why the KJV verse holds that text. */
  note: string;
}

/**
 * Verses in OpenBible's (ESV) numbering that the KJV lacks, where the KJV
 * prints the same words in a neighbouring verse. Each rule is documented in
 * docs/data/xrefs.md.
 */
export const VERSE_REMAPS: readonly VerseRemap[] = [
  {
    from: { book: "3JN", chapter: 1, verse: 15 },
    to: { book: "3JN", chapter: 1, verse: 14 },
    note:
      "Modern editions split 3 John 14 after \"face to face\" and number the greetings verse 15; " +
      "the KJV keeps them in verse 14 (\"Peace be to thee. Our friends salute thee. Greet the friends by name.\").",
  },
  {
    from: { book: "REV", chapter: 12, verse: 18 },
    to: { book: "REV", chapter: 13, verse: 1 },
    note:
      "Modern editions number \"And he stood on the sand of the sea\" Revelation 12:18; " +
      "the KJV opens 13:1 with it (\"And I stood upon the sand of the sea\").",
  },
];

/** "REV 12:18": a verse label for logs and lookups. */
export const verseLabel = (v: VerseLocation) => `${v.book} ${v.chapter}:${v.verse}`;
const osisLabel = (v: OsisVerse) => `${v.book}.${v.chapter}.${v.verse}`;

const REMAP_BY_LABEL: ReadonlyMap<string, VerseRemap> = new Map(VERSE_REMAPS.map((r) => [verseLabel(r.from), r]));

export type KjvVerseResult =
  | { ok: true; verse: VerseLocation; remap?: VerseRemap }
  /** `label` names the offending verse: "3JN 1:16", or the OSIS text when the book is not in the canon. */
  | { ok: false; label: string };

/** The KJV verse that holds an OpenBible verse's text, remapping where VERSE_REMAPS says so. */
export function toKjvVerse(v: OsisVerse): KjvVerseResult {
  const book = osisBook(v.book);
  if (!book) return { ok: false, label: osisLabel(v) };
  const verse: VerseLocation = { book, chapter: v.chapter, verse: v.verse };
  if (isValidVerse(book, verse.chapter, verse.verse)) return { ok: true, verse };
  const remap = REMAP_BY_LABEL.get(verseLabel(verse));
  return remap ? { ok: true, verse: remap.to, remap } : { ok: false, label: verseLabel(verse) };
}

/** Negative when `a` comes before `b` in the canon. */
export function compareVerses(a: VerseLocation, b: VerseLocation): number {
  return BOOK_ORDER.get(a.book)! - BOOK_ORDER.get(b.book)! || a.chapter - b.chapter || a.verse - b.verse;
}

/**
 * Normalized references covering the KJV verses start…end, one per book:
 * GEN 1:1…GEN 1:3 → ["GEN 1:1-3"]; 2CH 36:22…EZR 1:3 → ["2CH 36:22-23", "EZR 1:1-3"].
 * Null when `end` comes before `start`. Both ends must be KJV verses.
 */
export function spanToReferences(start: VerseLocation, end: VerseLocation): Reference[] | null {
  if (compareVerses(start, end) > 0) return null;
  const first = BOOK_ORDER.get(start.book)!;
  const last = BOOK_ORDER.get(end.book)!;
  const refs: Reference[] = [];
  for (let i = first; i <= last; i++) {
    const book = BOOK_IDS[i];
    const lastChapter = chapterVerseCounts(book).length;
    const from = i === first ? start : { chapter: 1, verse: 1 };
    const to = i === last ? end : { chapter: lastChapter, verse: verseCount(book, lastChapter) };
    refs.push(toReference({ book, chapter: from.chapter, verse: from.verse, endChapter: to.chapter, endVerse: to.verse }));
  }
  return refs;
}

/** A row ready for aggregation. */
export interface ResolvedXref {
  line: number;
  from: VerseLocation;
  /** Normalized references, one per book the target spans (almost always one). */
  targets: Reference[];
  /** Always ≥ 1. */
  votes: number;
  /** Remaps applied to this row's references (empty for nearly every row). */
  remaps: VerseRemap[];
}

export type DropReason = "invalid" | "votes" | "self";

export type Resolution =
  | { ok: true; xref: ResolvedXref }
  | {
      ok: false;
      reason: DropReason;
      detail: string;
      remaps: VerseRemap[];
      /** Labels of the verses that are not in the KJV (reason "invalid"). */
      invalid: string[];
    };

const isSameVerse = (ref: Reference, v: VerseLocation) =>
  ref.book === v.book && ref.chapter === v.chapter && ref.verse === v.verse &&
  ref.endChapter === undefined && ref.endVerse === undefined;

const sameOsis = (a: OsisVerse, b: OsisVerse) => a.book === b.book && a.chapter === b.chapter && a.verse === b.verse;

/**
 * Resolve one row. References are checked before votes, so references the
 * KJV lacks are found (and logged) even on rows dropped for their votes.
 */
export function resolveRow(row: XrefRow): Resolution {
  const from = toKjvVerse(row.from);
  const start = toKjvVerse(row.to.start);
  const end = sameOsis(row.to.start, row.to.end) ? start : toKjvVerse(row.to.end);
  // Each distinct verse of the row once: a single-verse target has start === end.
  const checked = end === start ? [from, start] : [from, start, end];
  const remaps = checked.flatMap((v) => (v.ok && v.remap ? [v.remap] : []));
  const invalid = [...new Set(checked.flatMap((v) => (v.ok ? [] : [v.label])))];
  if (!from.ok || !start.ok || !end.ok) {
    return { ok: false, reason: "invalid", detail: `not in the KJV: ${invalid.join(", ")}`, remaps, invalid };
  }

  const spans = spanToReferences(start.verse, end.verse);
  if (!spans) {
    const detail = `range ends before it starts: ${verseLabel(start.verse)}-${verseLabel(end.verse)}`;
    return { ok: false, reason: "invalid", detail, remaps, invalid: [`${verseLabel(start.verse)}-${verseLabel(end.verse)}`] };
  }
  if (row.votes <= 0) return { ok: false, reason: "votes", detail: `${row.votes} votes`, remaps, invalid };

  const targets = spans.filter((ref) => !isSameVerse(ref, from.verse));
  if (!targets.length) {
    return { ok: false, reason: "self", detail: `${verseLabel(from.verse)} refers to itself`, remaps, invalid };
  }
  return { ok: true, xref: { line: row.line, from: from.verse, targets, votes: row.votes, remaps } };
}

export interface ResolveStats {
  rows: number;
  kept: number;
  dropped: Record<DropReason, number>;
  /** Kept rows that needed a remap. */
  remappedRows: number;
  /** References remapped by each rule (all rows, kept or not), keyed by the rule's source verse label. */
  remapsByRule: Map<string, number>;
  /** References that are not KJV verses and could not be remapped (all rows), with counts. */
  invalidRefs: Map<string, number>;
  /** Kept rows whose target crossed a book boundary and was split. */
  splitRows: number;
  /** The first few rows dropped for a reason other than votes, for the log. */
  examples: { line: number; reason: DropReason; detail: string }[];
}

/** Resolve every row and count what happened. */
export function resolveRows(rows: readonly XrefRow[]): { xrefs: ResolvedXref[]; stats: ResolveStats } {
  const stats: ResolveStats = {
    rows: rows.length,
    kept: 0,
    dropped: { invalid: 0, votes: 0, self: 0 },
    remappedRows: 0,
    remapsByRule: new Map(VERSE_REMAPS.map((r) => [verseLabel(r.from), 0])),
    invalidRefs: new Map(),
    splitRows: 0,
    examples: [],
  };
  const xrefs: ResolvedXref[] = [];
  for (const row of rows) {
    const result = resolveRow(row);
    for (const remap of result.ok ? result.xref.remaps : result.remaps) {
      const key = verseLabel(remap.from);
      stats.remapsByRule.set(key, (stats.remapsByRule.get(key) ?? 0) + 1);
    }
    if (result.ok) {
      stats.kept++;
      if (result.xref.remaps.length) stats.remappedRows++;
      if (result.xref.targets.length > 1) stats.splitRows++;
      xrefs.push(result.xref);
      continue;
    }
    stats.dropped[result.reason]++;
    for (const label of result.invalid) stats.invalidRefs.set(label, (stats.invalidRefs.get(label) ?? 0) + 1);
    if (result.reason !== "votes" && stats.examples.length < 10) {
      stats.examples.push({ line: row.line, reason: result.reason, detail: result.detail });
    }
  }
  return { xrefs, stats };
}

/** Canonical string of a resolved target: "ISA 14:12-15". */
export const canonical = (ref: Reference) => formatReference(ref, "canonical");
