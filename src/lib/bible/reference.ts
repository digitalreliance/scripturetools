import { BOOKS, getBook, isBookId, type BookMeta } from "./canon";
import type {
  Reference,
  ReferenceInput,
  ReferenceStyle,
  VerseLocation,
} from "./types";
import { isValidVerse, verseCount } from "./versification";

// ── Book names ───────────────────────────────────────────────────────────────

const ORDINAL_WORDS: Readonly<Record<string, string>> = {
  first: "1", second: "2", third: "3",
  "1st": "1", "2nd": "2", "3rd": "3",
  i: "1", ii: "2", iii: "3",
};

/**
 * Lowercase; unify dashes; drop periods that end abbreviations ("Rev." → "rev",
 * "Gen.1.1" → "gen 1.1"); collapse whitespace; leading ordinals to digits
 * ("I John", "First John", "1st John" → "1 john").
 */
function normalizeHuman(input: string): string {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, "-")
    .replace(/([a-z])\./g, "$1 ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(first|second|third|1st|2nd|3rd|iii|ii|i) (?=[a-z])/, (_, w: string) => `${ORDINAL_WORDS[w]} `);
}

const squash = (s: string) => s.toLowerCase().replace(/[\s-]/g, "");

/** Every id, OSIS id, slug, name, short name and alias, without spaces. */
const BOOK_BY_KEY = new Map<string, BookMeta>();
for (const book of BOOKS) {
  for (const key of [book.id, book.osis, book.slug, book.name, book.short, ...book.aliases]) {
    BOOK_BY_KEY.set(squash(key), book);
  }
}
const FULL_NAMES = BOOKS.map((book) => [squash(book.name), book] as const);

function lookupBook(name: string): BookMeta | undefined {
  const key = squash(name);
  const exact = BOOK_BY_KEY.get(key);
  if (exact) return exact;
  // Otherwise a prefix of exactly one full name, at least three letters long ("revel", "phile").
  if (key.replace(/^[1-3]/, "").length < 3) return undefined;
  const matches = FULL_NAMES.filter(([full]) => full.startsWith(key));
  return matches.length === 1 ? matches[0][1] : undefined;
}

/**
 * Resolve a book from its USFM id, OSIS id, slug, name, common abbreviation or
 * a unique prefix of its name: "REV", "Rev.", "revelation", "1 Cor", "I John",
 * "First Samuel", "Song of Songs", "phile". Undefined when unknown or ambiguous.
 */
export function parseBookName(input: string): BookMeta | undefined {
  return getBook(input) ?? lookupBook(normalizeHuman(input));
}

// ── Validation ───────────────────────────────────────────────────────────────

/** Validate a reference and reduce it to one of the normalized shapes; null when invalid. */
function normalizeReference(ref: Reference): Reference | null {
  if (!ref || typeof ref !== "object") return null;
  const { book, chapter, verse, endChapter, endVerse } = ref;
  if (typeof book !== "string" || !isBookId(book)) return null;
  const chapters = getBook(book)!.chapters;
  const isChapter = (c: unknown): c is number => Number.isInteger(c) && (c as number) >= 1 && (c as number) <= chapters;
  if (!isChapter(chapter)) return null;

  if (verse === undefined) {
    if (endVerse !== undefined) return null;
    if (endChapter === undefined || endChapter === chapter) return { book, chapter };
    return isChapter(endChapter) && endChapter > chapter ? { book, chapter, endChapter } : null;
  }
  if (!isValidVerse(book, chapter, verse)) return null;
  if (endChapter === undefined || endChapter === chapter) {
    if (endVerse === undefined || endVerse === verse) return { book, chapter, verse };
    return endVerse > verse && isValidVerse(book, chapter, endVerse) ? { book, chapter, verse, endVerse } : null;
  }
  if (!isChapter(endChapter) || endChapter < chapter || endVerse === undefined) return null;
  return isValidVerse(book, endChapter, endVerse) ? { book, chapter, verse, endChapter, endVerse } : null;
}

/** True when `ref` points at verses that exist in the KJV. */
export function isValidReference(ref: Reference): boolean {
  return normalizeReference(ref) !== null;
}

/**
 * A normalized, validated Reference from a Reference or a reference string.
 * Throws RangeError when the input does not name verses that exist.
 */
export function toReference(input: ReferenceInput): Reference {
  const ref = typeof input === "string" ? parseReference(input) : normalizeReference(input);
  if (!ref) throw new RangeError(`Not a valid KJV reference: ${JSON.stringify(input)}`);
  return ref;
}

// ── Parsing ──────────────────────────────────────────────────────────────────

/** "BOOK C", "BOOK C-C", "BOOK C:V", "BOOK C:V-V", "BOOK C:V-C:V" with an exact USFM id. */
const CANONICAL_RE = /^([1-3A-Z][A-Z]{2}) (\d+)(?::(\d+))?(?:-(\d+)(?::(\d+))?)?$/;
/** The numbers after a book name: "12", "2-3", "12:9", "12:9-11", "4:10-5:1" (":" or "."). */
const NUMBERS_RE = /^(\d+)(?:[:.](\d+))?(?:-(\d+)(?:[:.](\d+))?)?$/;

/**
 * Build a reference from the four number groups of CANONICAL_RE / NUMBERS_RE
 * (start, start verse, end, end verse). When `loneIsVerse`, numbers without a
 * colon are verses of chapter 1 ("Jude 3", "Obad 1-4").
 */
function fromNumbers(book: BookMeta, groups: (string | undefined)[], loneIsVerse: boolean): Reference | null {
  const [a, b, c, d] = groups.map((g) => (g === undefined ? undefined : Number(g)));
  if (a === undefined) return null;
  if (b === undefined) {
    if (d !== undefined) return null; // "C-C:V" is not supported
    return normalizeReference(
      loneIsVerse
        ? { book: book.id, chapter: 1, verse: a, endVerse: c }
        : { book: book.id, chapter: a, endChapter: c },
    );
  }
  if (d === undefined) return normalizeReference({ book: book.id, chapter: a, verse: b, endVerse: c });
  return normalizeReference({ book: book.id, chapter: a, verse: b, endChapter: c, endVerse: d });
}

/**
 * Parse a canonical string or human input; null unless it names verses that exist.
 *
 *   canonical   "REV 12", "REV 2-3", "REV 12:9", "REV 12:9-11", "REV 4:10-5:1"
 *   human       "Rev 12:9", "rev12:9", "Revelation 12:9–10", "1 Cor 13", "I John 4:8",
 *               "First Samuel 3:10", "Song of Songs 2:4", "Ps 23", "Gen 1:1-2:3",
 *               "Gen.1.1", "Rev. 12:9a"
 *
 * For single-chapter books (Obadiah, Philemon, 2 John, 3 John, Jude) a number
 * without a colon is a verse ("Jude 3", "Obad 4") and the bare name is the
 * whole book ("Jude"). The one exception is the canonical form, an exact
 * uppercase USFM id, where "JUD 1" means the whole chapter, so canonical
 * strings round-trip.
 */
export function parseReference(input: string): Reference | null {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw || raw.length > 120) return null;

  const canonical = CANONICAL_RE.exec(raw);
  if (canonical && isBookId(canonical[1])) {
    const ref = fromNumbers(getBook(canonical[1])!, canonical.slice(2), false);
    if (ref) return ref;
  }

  const text = normalizeHuman(raw).replace(/[.,;!?]+$/, "");
  const match = /^((?:[1-3] ?)?[a-z][a-z ]*)(.*)$/.exec(text);
  if (!match) return null;
  const book = lookupBook(match[1].trim());
  if (!book) return null;

  // Spaces out; verse-part letters ("9a", "11b") dropped.
  const numbers = match[2].replace(/\s+/g, "").replace(/(\d)[a-d](?=$|-)/g, "$1");
  if (!numbers) return book.chapters === 1 ? { book: book.id, chapter: 1 } : null;
  const groups = NUMBERS_RE.exec(numbers);
  return groups ? fromNumbers(book, groups.slice(1), book.chapters === 1) : null;
}

// ── Formatting and expansion ─────────────────────────────────────────────────

/**
 * Format a reference.
 *
 *   canonical  "REV 12:9-10"   "REV 4:10-5:1"   "REV 2-3"   "JUD 1:3"   "JUD 1"
 *   long       "Revelation 12:9–10"   "Psalm 23"   "Psalms 120–134"   "Jude 3"   "Jude"
 *   short      "Rev 12:9–10"   "Ps 23"   "1 Cor 13"   "Jude 3"
 *
 * Throws RangeError for an invalid reference.
 */
export function formatReference(input: ReferenceInput, style: ReferenceStyle = "long"): string {
  const { book: id, chapter, verse, endChapter, endVerse } = toReference(input);

  if (style === "canonical") {
    if (verse === undefined) return endChapter ? `${id} ${chapter}-${endChapter}` : `${id} ${chapter}`;
    if (endChapter) return `${id} ${chapter}:${verse}-${endChapter}:${endVerse}`;
    return endVerse ? `${id} ${chapter}:${verse}-${endVerse}` : `${id} ${chapter}:${verse}`;
  }

  const book = getBook(id)!;
  // "Psalm 23" for one psalm, "Psalms 120–134" for several.
  const name = style === "short" ? book.short : id === "PSA" && !endChapter ? "Psalm" : book.name;
  const single = book.chapters === 1;
  if (verse === undefined) {
    if (single) return name;
    return endChapter ? `${name} ${chapter}–${endChapter}` : `${name} ${chapter}`;
  }
  const start = single ? `${verse}` : `${chapter}:${verse}`;
  if (endChapter) return `${name} ${start}–${endChapter}:${endVerse}`;
  return endVerse ? `${name} ${start}–${endVerse}` : `${name} ${start}`;
}

/** First and last verse covered by a reference. */
export function referenceBounds(input: ReferenceInput): { start: VerseLocation; end: VerseLocation } {
  const ref = toReference(input);
  const lastChapter = ref.endChapter ?? ref.chapter;
  const lastVerse =
    ref.endVerse ?? (ref.verse !== undefined && ref.endChapter === undefined ? ref.verse : verseCount(ref.book, lastChapter));
  return {
    start: { book: ref.book, chapter: ref.chapter, verse: ref.verse ?? 1 },
    end: { book: ref.book, chapter: lastChapter, verse: lastVerse },
  };
}

/** Every verse a reference covers, in order: "REV 12:9-10" → [12:9, 12:10]. */
export function expandReference(input: ReferenceInput): VerseLocation[] {
  const { start, end } = referenceBounds(input);
  const verses: VerseLocation[] = [];
  for (let chapter = start.chapter; chapter <= end.chapter; chapter++) {
    const first = chapter === start.chapter ? start.verse : 1;
    const last = chapter === end.chapter ? end.verse : verseCount(start.book, chapter);
    for (let verse = first; verse <= last; verse++) verses.push({ book: start.book, chapter, verse });
  }
  return verses;
}
