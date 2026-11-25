/**
 * USFM → BookText for eBible.org's KJV.
 *
 * Every marker the source uses is handled explicitly; anything else throws with
 * file and line, so a changed source can never be half-understood silently.
 *
 *   \id \h \toc1-3 \mt1-2        book headers (ignored)
 *   \c \v                        chapter and verse numbers (must be contiguous)
 *   \p \q1 \b                    paragraph / poetic line / stanza break → Verse.p
 *   \d                           Psalm superscription → Chapter.title
 *   \s1 \tl…\tl* before a verse  Psalm 119 acrostic heading → Verse.h ("ALEPH")
 *   \s1 after the last verse     epistle subscription → Chapter.colophon
 *   \add \wj \nd (and \+ forms)  → <i> <j> <n>
 *   \w word|strong="…"\w*        word wrapper; Strong's attributes dropped
 *   \f + \fr c.v \ft text\f*     translators' note → Verse.notes (plain text)
 *   ¶ at the start of a verse    paragraph → Verse.p (pilcrow removed)
 */
import { isBookId, type BookId } from "../../../src/lib/bible/canon";
import { validateMarkup } from "../../../src/lib/bible/markup";
import type { BookText, Chapter, Verse } from "../../../src/lib/bible/types";

/** Style bits carried by every run of text. */
const ADD = 1;
const WJ = 2;
const ND = 4;
const TL = 8;

const CHAR_FLAGS: ReadonlyMap<string, number> = new Map([
  ["add", ADD],
  ["wj", WJ],
  ["nd", ND],
  ["tl", TL],
  ["w", 0],
]);
const HEADER_MARKERS = new Set(["id", "h", "toc1", "toc2", "toc3", "mt1", "mt2"]);
const PARAGRAPH_MARKERS = new Set(["p", "q1", "b"]);
const HEADING_MARKERS = new Set(["s1"]);
const NOTE_FIELDS = new Set(["fr", "ft"]);

export type UsfmToken =
  | { kind: "text"; text: string; line: number }
  | { kind: "marker"; name: string; nested: boolean; closing: boolean; line: number };

/** Split USFM into text and marker tokens (`\name`, `\+name`, `\name*`, `\+name*`). */
export function lexUsfm(src: string): UsfmToken[] {
  const tokens: UsfmToken[] = [];
  let line = 1;
  let last = 0;
  const pushText = (text: string) => {
    tokens.push({ kind: "text", text, line });
    for (const ch of text) if (ch === "\n") line++;
  };
  for (const m of src.matchAll(/\\(\+?)([a-z]+[0-9]*)(\*?)/g)) {
    if (m.index > last) pushText(src.slice(last, m.index));
    tokens.push({ kind: "marker", name: m[2], nested: m[1] === "+", closing: m[3] === "*", line });
    last = m.index + m[0].length;
  }
  if (last < src.length) pushText(src.slice(last));
  return tokens;
}

/** The book code from a USFM file's `\id` line, e.g. "GEN". */
export function readUsfmBookId(src: string): string | undefined {
  return /^\uFEFF?\s*\\id\s+([A-Z0-9]{3})\b/.exec(src)?.[1];
}

export interface UsfmStats {
  /** Verses flagged `p`. */
  paragraphs: number;
  titles: number;
  colophons: number;
  acrostics: number;
  notes: number;
  /** Runs where \nd sat inside \add: emitted as <n> (the grammar forbids <n> inside <i>). */
  divineNameInSupplied: number;
  /** Paragraph markers followed by more text of the same verse (not representable). */
  midVerseParagraphs: number;
}

export interface ParsedBook {
  book: BookText;
  stats: UsfmStats;
}

interface Run {
  text: string;
  flags: number;
}

interface VerseDraft {
  n: number;
  runs: Run[];
  notes: string[];
  paragraph: boolean;
  heading?: string;
}

interface ChapterDraft {
  n: number;
  title?: Run[];
  colophon?: Run[];
  verses: VerseDraft[];
}

interface StyleEntry {
  name: string;
  nested: boolean;
}

interface NoteDraft {
  field: "caller" | "fr" | "ft";
  callerSeen: boolean;
  fr: string;
  ft: string;
  stack: StyleEntry[];
  wordAttrs: boolean;
}

type Context = "none" | "header" | "verse" | "title" | "heading";

export function parseUsfmBook(src: string, file = "<usfm>"): ParsedBook {
  return new BookParser(file).parse(src);
}

class BookParser {
  private id: BookId | undefined;
  private readonly chapters: ChapterDraft[] = [];
  private chapter: ChapterDraft | undefined;
  private verse: VerseDraft | undefined;
  private context: Context = "none";
  /** A number is due next (after \id, \c or \v). */
  private expect: "id" | "c" | "v" | undefined;
  private paragraphPending = false;
  private heading: Run[] | undefined;
  private readonly stack: StyleEntry[] = [];
  /** Inside a \w after its "|": Strong's attributes, dropped. */
  private wordAttrs = false;
  private note: NoteDraft | undefined;
  private line = 0;
  private readonly stats: UsfmStats = {
    paragraphs: 0,
    titles: 0,
    colophons: 0,
    acrostics: 0,
    notes: 0,
    divineNameInSupplied: 0,
    midVerseParagraphs: 0,
  };

  constructor(private readonly file: string) {}

  parse(src: string): ParsedBook {
    for (const token of lexUsfm(src.replace(/^\uFEFF/, ""))) {
      this.line = token.line;
      if (token.kind === "text") this.text(token.text);
      else this.marker(token.name, token.nested, token.closing);
    }
    if (this.note) this.fail("unterminated footnote");
    if (this.expect) this.fail(`missing number after \\${this.expect}`);
    this.endVerse();
    this.endChapter();
    if (this.stack.length) this.fail(`unclosed \\${this.stack[this.stack.length - 1].name}`);
    if (!this.id) this.fail("missing \\id");
    return { book: this.build(this.id), stats: this.stats };
  }

  private fail(message: string): never {
    throw new Error(`${this.file}:${this.line}: ${message}`);
  }

  // ── markers ────────────────────────────────────────────────────────────────

  private marker(name: string, nested: boolean, closing: boolean) {
    if (this.expect) this.fail(`expected a number after \\${this.expect}, got \\${name}`);
    if (this.note) return this.noteMarker(name, nested, closing);
    if (CHAR_FLAGS.has(name)) return this.charMarker(name, nested, closing);
    if (name === "f" && !closing && !nested) return this.startNote();
    if (closing || nested) this.fail(`unexpected \\${nested ? "+" : ""}${name}${closing ? "*" : ""}`);

    if (HEADER_MARKERS.has(name)) {
      this.requireNoOpenStyle(name);
      this.context = "header";
      if (name === "id") this.expect = "id";
    } else if (name === "c") {
      this.endVerse();
      this.endChapter();
      this.requireNoOpenStyle(name);
      this.context = "none";
      this.expect = "c";
    } else if (name === "v") {
      if (!this.chapter) this.fail("\\v before the first \\c");
      this.endVerse();
      this.expect = "v";
    } else if (PARAGRAPH_MARKERS.has(name)) {
      this.paragraphPending = true;
      // An open verse may continue after a paragraph break; titles and headings end here.
      if (this.context !== "verse") this.context = "none";
    } else if (name === "d") {
      this.requireNoOpenStyle(name);
      const chapter = this.chapter;
      if (!chapter) this.fail("\\d before the first \\c");
      if (chapter.verses.length || this.verse) this.fail("\\d after the first verse of a chapter");
      if (chapter.title) this.fail("second \\d in one chapter");
      chapter.title = [];
      this.context = "title";
    } else if (HEADING_MARKERS.has(name)) {
      this.requireNoOpenStyle(name);
      if (!this.chapter) this.fail(`\\${name} before the first \\c`);
      if (this.heading) this.fail(`two headings in a row`);
      this.endVerse();
      this.heading = [];
      this.context = "heading";
    } else {
      this.fail(`unsupported marker \\${name}`);
    }
  }

  private requireNoOpenStyle(name: string) {
    const open = this.stack[this.stack.length - 1];
    if (open) this.fail(`\\${open.name} still open at \\${name}`);
  }

  private charMarker(name: string, nested: boolean, closing: boolean) {
    if (closing) {
      const open = this.stack.pop();
      if (open?.name !== name || open.nested !== nested) {
        this.fail(`\\${nested ? "+" : ""}${name}* does not close ${open ? `\\${open.name}` : "anything"}`);
      }
      if (name === "w") this.wordAttrs = false;
      return;
    }
    if (this.context !== "verse" && this.context !== "title" && this.context !== "heading") {
      this.fail(`\\${name} outside verse, title or heading text`);
    }
    if (name === "tl" && this.context !== "heading") this.fail("\\tl outside a heading");
    // USFM requires the "+" form for a style opened inside another one.
    const open = this.stack[this.stack.length - 1];
    if (open && !nested) this.fail(`\\${name} inside \\${open.name} without "+"`);
    if (!open && nested) this.fail(`\\+${name} outside any character style`);
    this.stack.push({ name, nested });
  }

  private startNote() {
    if (this.context !== "verse" || !this.verse) this.fail("footnote outside verse text");
    this.note = { field: "caller", callerSeen: false, fr: "", ft: "", stack: [], wordAttrs: false };
  }

  private noteMarker(name: string, nested: boolean, closing: boolean) {
    const note = this.note!;
    if (name === "f" && closing && !nested) return this.endNote(note);
    if (NOTE_FIELDS.has(name) && !closing && !nested) {
      note.field = name as "fr" | "ft";
      return;
    }
    if (CHAR_FLAGS.has(name)) {
      if (closing) {
        const open = note.stack.pop();
        if (open?.name !== name || open.nested !== nested) this.fail(`mismatched \\${name}* in footnote`);
        if (name === "w") note.wordAttrs = false;
      } else {
        note.stack.push({ name, nested });
      }
      return;
    }
    this.fail(`unsupported marker \\${name} in a footnote`);
  }

  private endNote(note: NoteDraft) {
    if (note.stack.length) this.fail(`\\${note.stack[note.stack.length - 1].name} still open at \\f*`);
    const text = collapseWhitespace(note.ft);
    if (!text) this.fail("empty footnote");
    const verse = this.verse!;
    // "\fr 1.4" must point at the verse that carries the note.
    const fr = note.fr.trim().replace(/:$/, "");
    const here = `${this.chapter!.n}.${verse.n}`;
    if (fr && fr !== here && fr !== here.replace(".", ":")) {
      this.fail(`footnote reference ${fr} inside verse ${here}`);
    }
    verse.notes.push(text);
    this.note = undefined;
  }

  // ── text ───────────────────────────────────────────────────────────────────

  private text(raw: string) {
    if (raw.includes("\\")) this.fail(`stray backslash in ${JSON.stringify(raw.trim())}`);
    if (this.note) return this.noteText(this.note, raw);

    let text = raw;
    if (this.expect) {
      const m = /^\s*(\S+)/.exec(text);
      if (!m) return; // the number is on a later line
      text = text.slice(m[0].length);
      this.number(this.expect, m[1]);
    }

    text = this.stripWordAttrs(text);
    if (!text) return;
    const flags = this.stack.reduce((f, s) => f | (CHAR_FLAGS.get(s.name) ?? 0), 0);

    switch (this.context) {
      case "header":
        return;
      case "none":
        if (text.trim()) this.fail(`text outside any verse: ${JSON.stringify(text.trim())}`);
        return;
      case "verse":
        if (this.paragraphPending && text.trim()) {
          // The paragraph began mid-verse; Verse.p cannot express that.
          this.paragraphPending = false;
          this.stats.midVerseParagraphs++;
        }
        this.verse!.runs.push({ text, flags });
        return;
      case "title":
        this.chapter!.title!.push({ text, flags });
        return;
      case "heading":
        this.heading!.push({ text, flags });
        return;
    }
  }

  /** Keep a \w word, drop the `|strong="…"` attributes that follow it. */
  private stripWordAttrs(text: string): string {
    if (!this.stack.some((s) => s.name === "w")) return text;
    if (this.wordAttrs) return "";
    const bar = text.indexOf("|");
    if (bar < 0) return text;
    this.wordAttrs = true;
    return text.slice(0, bar);
  }

  private noteText(note: NoteDraft, raw: string) {
    let text = raw;
    if (note.stack.some((s) => s.name === "w")) {
      if (note.wordAttrs) return;
      const bar = text.indexOf("|");
      if (bar >= 0) {
        note.wordAttrs = true;
        text = text.slice(0, bar);
      }
    }
    if (note.field === "caller") {
      if (!note.callerSeen) {
        const m = /^\s*\S+/.exec(text);
        if (!m) return;
        note.callerSeen = true;
        text = text.slice(m[0].length);
      }
      if (text.trim()) this.fail("footnote text before \\ft");
      return;
    }
    note[note.field] += text;
  }

  private number(kind: "id" | "c" | "v", value: string) {
    this.expect = undefined;
    if (kind === "id") {
      if (!isBookId(value)) this.fail(`not a canonical book: ${value}`);
      if (this.id) this.fail("second \\id");
      this.id = value;
      return;
    }
    if (!/^\d+$/.test(value)) this.fail(`bad \\${kind} number "${value}"`);
    const n = Number(value);

    if (kind === "c") {
      const expected = this.chapters.length + 1;
      if (n !== expected) this.fail(`chapter ${n} where ${expected} was expected`);
      this.chapter = { n, verses: [] };
      this.paragraphPending = true; // every chapter opens a paragraph
      return;
    }

    const chapter = this.chapter!;
    const expected = chapter.verses.length + 1;
    if (n !== expected) this.fail(`verse ${chapter.n}:${n} where ${chapter.n}:${expected} was expected`);
    const verse: VerseDraft = { n, runs: [], notes: [], paragraph: this.paragraphPending };
    if (this.heading) {
      verse.heading = this.acrosticName(this.heading);
      this.heading = undefined;
    }
    this.paragraphPending = false;
    this.verse = verse;
    this.context = "verse";
  }

  private endVerse() {
    if (!this.verse) return;
    this.chapter!.verses.push(this.verse);
    this.verse = undefined;
  }

  private endChapter() {
    const chapter = this.chapter;
    if (!chapter) return;
    if (this.heading) {
      // A heading with no verse after it is the epistle's subscription.
      if (isAcrostic(this.heading)) this.fail("acrostic heading after the last verse");
      chapter.colophon = this.heading;
      this.heading = undefined;
    }
    if (!chapter.verses.length) this.fail(`chapter ${chapter.n} has no verses`);
    this.chapters.push(chapter);
    this.chapter = undefined;
  }

  /** "\tl א ALEPH.\tl*" → "ALEPH". Only transliterated headings may sit before a verse. */
  private acrosticName(runs: Run[]): string {
    if (!isAcrostic(runs)) {
      this.fail(`section heading before a verse: ${JSON.stringify(collapseWhitespace(runsText(runs)))}`);
    }
    const name = collapseWhitespace(runsText(runs).replace(/[\u0590-\u05FF]/g, "")).replace(/\.$/, "");
    if (!/^[A-Z]+$/.test(name)) this.fail(`unexpected acrostic heading "${name}"`);
    return name;
  }

  // ── output ─────────────────────────────────────────────────────────────────

  private build(id: BookId): BookText {
    const chapters: Chapter[] = this.chapters.map((c) => {
      const where = `${id} ${c.n}`;
      const title = c.title && this.renderMarked(c.title, `${where} title`);
      const colophon = c.colophon && this.renderMarked(c.colophon, `${where} colophon`);
      if (title) this.stats.titles++;
      if (colophon) this.stats.colophons++;

      const verses = c.verses.map((v): Verse => {
        const { text, pilcrow } = this.render(v.runs, `${where}:${v.n}`);
        const p = v.paragraph || pilcrow;
        if (p) this.stats.paragraphs++;
        if (v.heading) this.stats.acrostics++;
        this.stats.notes += v.notes.length;
        return {
          n: v.n,
          t: text,
          ...(p ? { p: 1 as const } : {}),
          ...(v.heading ? { h: v.heading } : {}),
          ...(v.notes.length ? { notes: v.notes } : {}),
        };
      });

      return {
        n: c.n,
        ...(title ? { title } : {}),
        ...(colophon ? { colophon } : {}),
        verses,
      };
    });
    return { id, chapters };
  }

  /** Titles and colophons: same markup as verses, but a pilcrow there is unexpected. */
  private renderMarked(runs: Run[], where: string): string {
    const { text, pilcrow } = this.render(runs, where);
    if (pilcrow) throw new Error(`${this.file}: ${where}: unexpected pilcrow`);
    return text;
  }

  /**
   * Runs → marked text. Whitespace collapses to single spaces, and a collapsed
   * space keeps only the styles shared by the characters on both sides, so
   * tags hug words ("the <i>was</i> upon", never "the<i> was</i>"). A leading
   * pilcrow is removed and reported; any other pilcrow is an error.
   */
  private render(runs: Run[], where: string): { text: string; pilcrow: boolean } {
    const chars: string[] = [];
    const styles: number[] = [];
    let inSuppliedName = false;
    for (const run of runs) {
      const blank = !run.text.trim();
      if (!blank) {
        const suppliedName = (run.flags & ND) !== 0 && (run.flags & ADD) !== 0;
        if (suppliedName && !inSuppliedName) this.stats.divineNameInSupplied++;
        inSuppliedName = suppliedName;
      }
      const style = styleOf(run.flags);
      for (const ch of run.text) {
        chars.push(/\s/.test(ch) ? " " : ch);
        styles.push(style);
      }
    }

    const first = chars.findIndex((ch) => ch !== " ");
    const pilcrow = first >= 0 && chars[first] === "¶";
    if (pilcrow) chars[first] = " ";
    if (chars.includes("¶")) throw new Error(`${this.file}: ${where}: pilcrow inside the text`);

    const out: { ch: string; style: number }[] = [];
    let spacePending = false;
    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === " ") {
        spacePending = out.length > 0;
        continue;
      }
      if (spacePending) {
        out.push({ ch: " ", style: sharedStyle(out[out.length - 1].style, styles[i]) });
        spacePending = false;
      }
      out.push({ ch: chars[i], style: styles[i] });
    }

    // <j> outermost, then at most one of <i>/<n>.
    let text = "";
    let j = false;
    let inner = 0;
    for (const { ch, style } of out) {
      const wantJ = (style & S_J) !== 0;
      const wantInner = style & S_INNER;
      if (inner && (inner !== wantInner || wantJ !== j)) {
        text += inner === S_N ? "</n>" : "</i>";
        inner = 0;
      }
      if (wantJ !== j) {
        text += wantJ ? "<j>" : "</j>";
        j = wantJ;
      }
      if (wantInner && inner !== wantInner) {
        text += wantInner === S_N ? "<n>" : "<i>";
        inner = wantInner;
      }
      text += ch;
    }
    if (inner) text += inner === S_N ? "</n>" : "</i>";
    if (j) text += "</j>";

    const problem = validateMarkup(text);
    if (problem) throw new Error(`${this.file}: ${where}: ${problem}: ${text}`);
    return { text, pilcrow };
  }
}

/** Output styles: the grammar allows <j> plus at most one of <i>/<n>. */
const S_I = 1;
const S_N = 2;
const S_INNER = S_I | S_N;
const S_J = 4;

/**
 * Source flags → output style. When \nd sits inside \add (13 times, e.g.
 * Lev 24:11 "\add of the \+nd LORD\+nd*\add*") the divine name wins, because
 * <n> may not nest inside <i>.
 */
function styleOf(flags: number): number {
  return (flags & WJ ? S_J : 0) | (flags & ND ? S_N : flags & ADD ? S_I : 0);
}

/** The style a space between two characters keeps: only what both sides share. */
function sharedStyle(a: number, b: number): number {
  return (a & b & S_J) | ((a & S_INNER) === (b & S_INNER) ? a & S_INNER : 0);
}

function runsText(runs: Run[]): string {
  return runs.map((r) => r.text).join("");
}

function isAcrostic(runs: Run[]): boolean {
  return runs.some((r) => r.text.trim()) && runs.every((r) => !r.text.trim() || r.flags & TL);
}

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}
