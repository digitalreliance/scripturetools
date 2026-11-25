/**
 * Parsing for OpenBible.info's cross_references.txt:
 *
 *   From Verse⇥To Verse⇥Votes⇥#www.openbible.info CC-BY 2026-11-23
 *   Gen.1.1⇥Rom.1.19-Rom.1.20⇥60
 *   Gen.1.1⇥Jer.10.12⇥79
 *
 * References are OSIS ("Book.Chapter.Verse"; ranges "Start-End", both ends in
 * full). This module checks syntax only and throws with file:line on anything
 * else, because that means the format changed. Mapping books to the canon and
 * checking verses against the KJV happens in resolve.ts.
 */

/** A verse as OpenBible writes it; `book` is the OSIS id ("Gen", "1John", "Ps"). */
export interface OsisVerse {
  book: string;
  chapter: number;
  verse: number;
}

/** An inclusive span; `end` equals `start` for a single verse. Ends may lie in different chapters or books. */
export interface OsisSpan {
  start: OsisVerse;
  end: OsisVerse;
}

export interface XrefRow {
  /** 1-based line in the source file. */
  line: number;
  from: OsisVerse;
  to: OsisSpan;
  /** Net helpfulness votes; may be zero or negative. */
  votes: number;
}

export interface XrefFile {
  /** Licence marker from the header, e.g. "CC-BY". */
  license: string;
  /** Export date from the header, e.g. "2026-11-23". */
  exportDate: string;
  rows: XrefRow[];
}

const OSIS_VERSE_RE = /^([1-4]?[A-Z][A-Za-z]*)\.([1-9]\d{0,2})\.([1-9]\d{0,2})$/;
const VOTES_RE = /^-?\d{1,7}$/;
const HEADER_RE = /^From Verse\tTo Verse\tVotes\t#www\.openbible\.info (\S+) (\d{4}-\d{2}-\d{2})$/;

/** "Gen.1.1" → { book: "Gen", chapter: 1, verse: 1 }. Throws SyntaxError on anything else. */
export function parseOsisVerse(osis: string): OsisVerse {
  const m = OSIS_VERSE_RE.exec(osis);
  if (!m) throw new SyntaxError(`Not an OSIS verse reference: ${JSON.stringify(osis)}`);
  return { book: m[1], chapter: Number(m[2]), verse: Number(m[3]) };
}

/** "Prov.8.22-Prov.8.30", "2Chr.36.22-Ezra.1.3" or a single verse "Gen.1.1". */
export function parseOsisSpan(osis: string): OsisSpan {
  const parts = osis.split("-");
  if (parts.length > 2) throw new SyntaxError(`Not an OSIS range: ${JSON.stringify(osis)}`);
  const start = parseOsisVerse(parts[0]);
  return { start, end: parts.length === 2 ? parseOsisVerse(parts[1]) : start };
}

/** Parse the whole file. Throws SyntaxError with `file:line` on any line that does not fit the format. */
export function parseXrefFile(text: string, file = "cross_references.txt"): XrefFile {
  const lines = text.split("\n");
  const header = HEADER_RE.exec(lines[0].replace(/\r$/, ""));
  if (!header) {
    throw new SyntaxError(`${file}:1: unexpected header ${JSON.stringify(lines[0].slice(0, 120))}`);
  }
  const rows: XrefRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, "");
    if (line === "") continue;
    try {
      const fields = line.split("\t");
      if (fields.length !== 3) throw new SyntaxError(`expected 3 tab-separated fields, found ${fields.length}`);
      const [from, to, votes] = fields;
      if (!VOTES_RE.test(votes)) throw new SyntaxError(`votes is not an integer: ${JSON.stringify(votes)}`);
      rows.push({ line: i + 1, from: parseOsisVerse(from), to: parseOsisSpan(to), votes: Number(votes) });
    } catch (error) {
      throw new SyntaxError(`${file}:${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { license: header[1], exportDate: header[2], rows };
}
