/**
 * The 66-book Protestant canon in KJV order.
 *
 * Ids are USFM book codes. They are the canonical book id everywhere in this
 * codebase (data files, references, URLs-by-lookup). Do not change ids, order,
 * slugs or chapter counts: generated data and tests depend on them.
 */

export const BOOK_IDS = [
  "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA",
  "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO",
  "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO",
  "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL",
  "MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH",
  "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS",
  "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV",
] as const;

export type BookId = (typeof BOOK_IDS)[number];
export type Testament = "OT" | "NT";
export type SectionId =
  | "law"
  | "history"
  | "wisdom"
  | "major-prophets"
  | "minor-prophets"
  | "gospels"
  | "acts"
  | "pauline"
  | "general"
  | "apocalypse";

export interface SectionMeta {
  id: SectionId;
  name: string;
  testament: Testament;
}

export const SECTIONS: readonly SectionMeta[] = [
  { id: "law", name: "Law", testament: "OT" },
  { id: "history", name: "History", testament: "OT" },
  { id: "wisdom", name: "Poetry & Wisdom", testament: "OT" },
  { id: "major-prophets", name: "Major Prophets", testament: "OT" },
  { id: "minor-prophets", name: "Minor Prophets", testament: "OT" },
  { id: "gospels", name: "Gospels", testament: "NT" },
  { id: "acts", name: "Acts", testament: "NT" },
  { id: "pauline", name: "Pauline Epistles", testament: "NT" },
  { id: "general", name: "General Epistles", testament: "NT" },
  { id: "apocalypse", name: "Revelation", testament: "NT" },
];

export interface BookMeta {
  /** USFM code; the canonical id. */
  id: BookId;
  /** OSIS id (used by OpenBible.info and many open datasets). */
  osis: string;
  /** URL slug, e.g. "1-samuel". */
  slug: string;
  /** Display name, e.g. "1 Samuel". */
  name: string;
  /** Short display name, e.g. "1 Sam". */
  short: string;
  /** 1-based position in the canon. */
  order: number;
  testament: Testament;
  section: SectionId;
  chapters: number;
  /** Lowercase lookup aliases (periods removed, single spaces). */
  aliases: readonly string[];
}

type Row = [
  id: BookId,
  osis: string,
  slug: string,
  name: string,
  short: string,
  section: SectionId,
  chapters: number,
  aliases: string[],
];

const numbered = (n: 1 | 2 | 3, stems: string[]) =>
  stems.flatMap((s) => [`${n} ${s}`, `${n}${s}`]);

const ROWS: Row[] = [
  ["GEN", "Gen", "genesis", "Genesis", "Gen", "law", 50, ["gen", "ge", "gn"]],
  ["EXO", "Exod", "exodus", "Exodus", "Exod", "law", 40, ["ex", "exo", "exod"]],
  ["LEV", "Lev", "leviticus", "Leviticus", "Lev", "law", 27, ["lev", "le", "lv"]],
  ["NUM", "Num", "numbers", "Numbers", "Num", "law", 36, ["num", "nu", "nm", "nb"]],
  ["DEU", "Deut", "deuteronomy", "Deuteronomy", "Deut", "law", 34, ["deut", "deu", "de", "dt"]],
  ["JOS", "Josh", "joshua", "Joshua", "Josh", "history", 24, ["josh", "jos", "jsh"]],
  ["JDG", "Judg", "judges", "Judges", "Judg", "history", 21, ["judg", "jdg", "jg", "jdgs"]],
  ["RUT", "Ruth", "ruth", "Ruth", "Ruth", "history", 4, ["ruth", "rut", "rth", "ru"]],
  ["1SA", "1Sam", "1-samuel", "1 Samuel", "1 Sam", "history", 31, numbered(1, ["samuel", "sam", "sa", "sm"])],
  ["2SA", "2Sam", "2-samuel", "2 Samuel", "2 Sam", "history", 24, numbered(2, ["samuel", "sam", "sa", "sm"])],
  ["1KI", "1Kgs", "1-kings", "1 Kings", "1 Kgs", "history", 22, numbered(1, ["kings", "kgs", "ki", "kin"])],
  ["2KI", "2Kgs", "2-kings", "2 Kings", "2 Kgs", "history", 25, numbered(2, ["kings", "kgs", "ki", "kin"])],
  ["1CH", "1Chr", "1-chronicles", "1 Chronicles", "1 Chr", "history", 29, numbered(1, ["chronicles", "chron", "chr", "ch"])],
  ["2CH", "2Chr", "2-chronicles", "2 Chronicles", "2 Chr", "history", 36, numbered(2, ["chronicles", "chron", "chr", "ch"])],
  ["EZR", "Ezra", "ezra", "Ezra", "Ezra", "history", 10, ["ezra", "ezr"]],
  ["NEH", "Neh", "nehemiah", "Nehemiah", "Neh", "history", 13, ["neh", "ne"]],
  ["EST", "Esth", "esther", "Esther", "Esth", "history", 10, ["esth", "est", "es"]],
  ["JOB", "Job", "job", "Job", "Job", "wisdom", 42, ["job", "jb"]],
  ["PSA", "Ps", "psalms", "Psalms", "Ps", "wisdom", 150, ["ps", "psa", "pss", "psm", "pslm", "psalm"]],
  ["PRO", "Prov", "proverbs", "Proverbs", "Prov", "wisdom", 31, ["prov", "pro", "prv", "pr"]],
  ["ECC", "Eccl", "ecclesiastes", "Ecclesiastes", "Eccl", "wisdom", 12, ["eccl", "eccles", "ecc", "ec", "qoh"]],
  ["SNG", "Song", "song-of-solomon", "Song of Solomon", "Song", "wisdom", 8, ["song", "sng", "sos", "song of songs", "canticles", "cant"]],
  ["ISA", "Isa", "isaiah", "Isaiah", "Isa", "major-prophets", 66, ["isa", "is"]],
  ["JER", "Jer", "jeremiah", "Jeremiah", "Jer", "major-prophets", 52, ["jer", "je", "jr"]],
  ["LAM", "Lam", "lamentations", "Lamentations", "Lam", "major-prophets", 5, ["lam", "la"]],
  ["EZK", "Ezek", "ezekiel", "Ezekiel", "Ezek", "major-prophets", 48, ["ezek", "eze", "ezk"]],
  ["DAN", "Dan", "daniel", "Daniel", "Dan", "major-prophets", 12, ["dan", "da", "dn"]],
  ["HOS", "Hos", "hosea", "Hosea", "Hos", "minor-prophets", 14, ["hos", "ho"]],
  ["JOL", "Joel", "joel", "Joel", "Joel", "minor-prophets", 3, ["joel", "jl", "jol"]],
  ["AMO", "Amos", "amos", "Amos", "Amos", "minor-prophets", 9, ["amos", "amo", "am"]],
  ["OBA", "Obad", "obadiah", "Obadiah", "Obad", "minor-prophets", 1, ["obad", "oba", "ob"]],
  ["JON", "Jonah", "jonah", "Jonah", "Jonah", "minor-prophets", 4, ["jonah", "jnh", "jon"]],
  ["MIC", "Mic", "micah", "Micah", "Mic", "minor-prophets", 7, ["mic", "mc"]],
  ["NAM", "Nah", "nahum", "Nahum", "Nah", "minor-prophets", 3, ["nah", "nam", "na"]],
  ["HAB", "Hab", "habakkuk", "Habakkuk", "Hab", "minor-prophets", 3, ["hab", "hb"]],
  ["ZEP", "Zeph", "zephaniah", "Zephaniah", "Zeph", "minor-prophets", 3, ["zeph", "zep", "zp"]],
  ["HAG", "Hag", "haggai", "Haggai", "Hag", "minor-prophets", 2, ["hag", "hg"]],
  ["ZEC", "Zech", "zechariah", "Zechariah", "Zech", "minor-prophets", 14, ["zech", "zec", "zc"]],
  ["MAL", "Mal", "malachi", "Malachi", "Mal", "minor-prophets", 4, ["mal", "ml"]],
  ["MAT", "Matt", "matthew", "Matthew", "Matt", "gospels", 28, ["matt", "mat", "mt"]],
  ["MRK", "Mark", "mark", "Mark", "Mark", "gospels", 16, ["mark", "mrk", "mar", "mk", "mr"]],
  ["LUK", "Luke", "luke", "Luke", "Luke", "gospels", 24, ["luke", "luk", "lk", "lu"]],
  ["JHN", "John", "john", "John", "John", "gospels", 21, ["john", "jhn", "joh", "jn"]],
  ["ACT", "Acts", "acts", "Acts", "Acts", "acts", 28, ["acts", "act", "ac"]],
  ["ROM", "Rom", "romans", "Romans", "Rom", "pauline", 16, ["rom", "ro", "rm"]],
  ["1CO", "1Cor", "1-corinthians", "1 Corinthians", "1 Cor", "pauline", 16, numbered(1, ["corinthians", "cor", "co"])],
  ["2CO", "2Cor", "2-corinthians", "2 Corinthians", "2 Cor", "pauline", 13, numbered(2, ["corinthians", "cor", "co"])],
  ["GAL", "Gal", "galatians", "Galatians", "Gal", "pauline", 6, ["gal", "ga"]],
  ["EPH", "Eph", "ephesians", "Ephesians", "Eph", "pauline", 6, ["eph", "ephes"]],
  ["PHP", "Phil", "philippians", "Philippians", "Phil", "pauline", 4, ["phil", "php", "pp"]],
  ["COL", "Col", "colossians", "Colossians", "Col", "pauline", 4, ["col"]],
  ["1TH", "1Thess", "1-thessalonians", "1 Thessalonians", "1 Thess", "pauline", 5, numbered(1, ["thessalonians", "thess", "thes", "th"])],
  ["2TH", "2Thess", "2-thessalonians", "2 Thessalonians", "2 Thess", "pauline", 3, numbered(2, ["thessalonians", "thess", "thes", "th"])],
  ["1TI", "1Tim", "1-timothy", "1 Timothy", "1 Tim", "pauline", 6, numbered(1, ["timothy", "tim", "ti"])],
  ["2TI", "2Tim", "2-timothy", "2 Timothy", "2 Tim", "pauline", 4, numbered(2, ["timothy", "tim", "ti"])],
  ["TIT", "Titus", "titus", "Titus", "Titus", "pauline", 3, ["titus", "tit"]],
  ["PHM", "Phlm", "philemon", "Philemon", "Phlm", "pauline", 1, ["philem", "phlm", "phm", "pm"]],
  ["HEB", "Heb", "hebrews", "Hebrews", "Heb", "general", 13, ["heb"]],
  ["JAS", "Jas", "james", "James", "Jas", "general", 5, ["jas", "jam", "jm"]],
  ["1PE", "1Pet", "1-peter", "1 Peter", "1 Pet", "general", 5, numbered(1, ["peter", "pet", "pe", "pt"])],
  ["2PE", "2Pet", "2-peter", "2 Peter", "2 Pet", "general", 3, numbered(2, ["peter", "pet", "pe", "pt"])],
  ["1JN", "1John", "1-john", "1 John", "1 John", "general", 5, numbered(1, ["john", "jhn", "jn", "jo"])],
  ["2JN", "2John", "2-john", "2 John", "2 John", "general", 1, numbered(2, ["john", "jhn", "jn", "jo"])],
  ["3JN", "3John", "3-john", "3 John", "3 John", "general", 1, numbered(3, ["john", "jhn", "jn", "jo"])],
  ["JUD", "Jude", "jude", "Jude", "Jude", "general", 1, ["jude", "jud", "jd"]],
  ["REV", "Rev", "revelation", "Revelation", "Rev", "apocalypse", 22, ["rev", "re", "rv", "revelations", "apocalypse", "apoc"]],
];

const SECTION_TESTAMENT: Record<SectionId, Testament> = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s.testament]),
) as Record<SectionId, Testament>;

export const BOOKS: readonly BookMeta[] = ROWS.map(
  ([id, osis, slug, name, short, section, chapters, aliases], i) => ({
    id,
    osis,
    slug,
    name,
    short,
    order: i + 1,
    testament: SECTION_TESTAMENT[section],
    section,
    chapters,
    aliases: Array.from(new Set([name.toLowerCase(), ...aliases])),
  }),
);

export const TOTAL_CHAPTERS = 1189;

const byId = new Map<string, BookMeta>(BOOKS.map((b) => [b.id, b]));
const bySlug = new Map<string, BookMeta>(BOOKS.map((b) => [b.slug, b]));
const byOsis = new Map<string, BookMeta>(
  BOOKS.map((b) => [b.osis.toLowerCase(), b]),
);

/** Offset of each book's first chapter in the 0-based global chapter index. */
const chapterOffsets = new Map<BookId, number>();
{
  let offset = 0;
  for (const b of BOOKS) {
    chapterOffsets.set(b.id, offset);
    offset += b.chapters;
  }
}

export function isBookId(value: string): value is BookId {
  return byId.has(value);
}

/** Look up a book by USFM id, slug, or OSIS id (case-insensitive). */
export function getBook(key: string): BookMeta | undefined {
  const k = key.trim();
  return (
    byId.get(k.toUpperCase()) ??
    bySlug.get(k.toLowerCase()) ??
    byOsis.get(k.toLowerCase())
  );
}

export function getBookOrThrow(key: string): BookMeta {
  const book = getBook(key);
  if (!book) throw new Error(`Unknown book: ${key}`);
  return book;
}

/** 0-based global chapter index (Genesis 1 = 0, Revelation 22 = 1188). */
export function globalChapterIndex(id: BookId, chapter: number): number {
  return (chapterOffsets.get(id) ?? 0) + chapter - 1;
}

/** Inverse of globalChapterIndex. */
export function chapterAtGlobalIndex(index: number): {
  book: BookMeta;
  chapter: number;
} {
  let remaining = index;
  for (const book of BOOKS) {
    if (remaining < book.chapters) return { book, chapter: remaining + 1 };
    remaining -= book.chapters;
  }
  throw new RangeError(`Chapter index out of range: ${index}`);
}
