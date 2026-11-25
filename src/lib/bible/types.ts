import type { BookId } from "./canon";

/**
 * Text carrying the KJV inline markup:
 *
 *   <i>…</i>  words supplied by the translators (printed in italics)
 *   <j>…</j>  words of Christ (red letter)
 *   <n>…</n>  the divine name: LORD, GOD, JEHOVAH (printed in small capitals)
 *
 * `<i>` and `<n>` may nest inside `<j>`; nothing else nests, and tags are
 * balanced within each string. Parse with `tokenizeVerse`, flatten with
 * `stripMarkup`, render with `<VerseText>`. Never inject it as HTML.
 */
export type MarkedText = string;

/** One verse of `public/data/kjv/books/{ID}.json`. */
export interface Verse {
  /** Verse number, 1-based. */
  n: number;
  /** Verse text with inline markup (see `MarkedText`). */
  t: MarkedText;
  /**
   * 1 when a paragraph starts at this verse: a paragraph marker or pilcrow in
   * the source, the first verse of every chapter, and every verse of Psalms
   * (each Psalm verse is its own poetic line).
   */
  p?: 1;
  /** Psalm 119 acrostic heading printed before this verse, e.g. "ALEPH". */
  h?: string;
  /** Translators' marginal notes as plain text, e.g. "firmament: Heb. expansion". */
  notes?: string[];
}

export interface Chapter {
  /** Chapter number, 1-based. */
  n: number;
  /** Psalm superscription, e.g. "A Psalm of David." (inline markup like `Verse.t`). */
  title?: MarkedText;
  /** Subscription after an epistle's last verse (inline markup like `Verse.t`). */
  colophon?: MarkedText;
  verses: Verse[];
}

/** A whole book: `public/data/kjv/books/{ID}.json`. `chapters[i].n === i + 1`. */
export interface BookText {
  id: BookId;
  chapters: Chapter[];
}

/** A verse inside a passage, tagged with its chapter. */
export interface PassageVerse extends Verse {
  chapter: number;
}

/** A single verse position. */
export interface VerseLocation {
  book: BookId;
  chapter: number;
  verse: number;
}

/**
 * A validated Bible reference. The normalized shapes are:
 *
 *   { book, chapter }                                   "REV 12"       whole chapter
 *   { book, chapter, endChapter }                       "REV 2-3"      whole chapters
 *   { book, chapter, verse }                            "REV 12:9"     one verse
 *   { book, chapter, verse, endVerse }                  "REV 12:9-11"  range in a chapter
 *   { book, chapter, verse, endChapter, endVerse }      "REV 4:10-5:1" cross-chapter range
 *
 * `parseReference` only returns these shapes (ends strictly after starts).
 */
export interface Reference {
  book: BookId;
  chapter: number;
  /** First verse; omitted when the reference names whole chapters. */
  verse?: number;
  /** Last chapter of a multi-chapter reference; omitted otherwise. */
  endChapter?: number;
  /** Last verse (inclusive) of a verse range; omitted otherwise. */
  endVerse?: number;
}

/** Anything the reference helpers accept: a `Reference` or a string `parseReference` understands. */
export type ReferenceInput = Reference | string;

/**
 * "long": "Revelation 12:9–10" · "short": "Rev 12:9–10" · "canonical": "REV 12:9-10".
 * Long and short use an en dash and omit the chapter of single-chapter books ("Jude 3").
 */
export type ReferenceStyle = "long" | "short" | "canonical";

export interface KjvTotals {
  books: number;
  chapters: number;
  verses: number;
  words: number;
}

export interface TranslationInfo {
  id: "KJV";
  name: string;
  edition: string;
  license: string;
  source: string;
  sourceUrl: string;
  /** SHA-256 of the source archive the data was generated from. */
  sha256: string;
}

/** `public/data/kjv/index.json`. */
export interface KjvIndex {
  schemaVersion: number;
  translation: TranslationInfo & { generatedAt: string };
  /** `chapters` holds the verse count of each chapter; `words` counts verse text only. */
  books: { id: BookId; chapters: number[]; words: number }[];
  totals: KjvTotals;
}
