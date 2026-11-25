import { describe, expect, it } from "vitest";
import { lexUsfm, parseUsfmBook, readUsfmBookId } from "./usfm";
import { countWords, validateKjv } from "./validate";

const HEADER = "\\id PSA Psalms\n\\h Psalms\n\\toc1 The Book of Psalms\n\\toc2 Psalms\n\\toc3 Psa\n\\mt1 The Book of Psalms\n";

const parse = (body: string, id = "PSA") => parseUsfmBook(HEADER.replace("PSA", id) + body, "test.usfm");

describe("USFM parser", () => {
  it("reads the book id and lexes markers", () => {
    expect(readUsfmBookId(HEADER)).toBe("PSA");
    expect(readUsfmBookId("\uFEFF\\id 1JN 1 John")).toBe("1JN");
    expect(lexUsfm("a \\+w b|x\\+w* \\f*")).toEqual([
      { kind: "text", text: "a ", line: 1 },
      { kind: "marker", name: "w", nested: true, closing: false, line: 1 },
      { kind: "text", text: " b|x", line: 1 },
      { kind: "marker", name: "w", nested: true, closing: true, line: 1 },
      { kind: "text", text: " ", line: 1 },
      { kind: "marker", name: "f", nested: false, closing: true, line: 1 },
    ]);
  });

  it("parses titles, verse markup, Strong's words, notes and poetic lines", () => {
    const { book, stats } = parse(
      "\\c 1\n\\d To the chief Musician, \\add A Psalm\\add* of David.\n" +
        '\\q1\n\\v 1 The \\nd \\+w LORD|strong="H3068"\\+w*\\nd* \\add is\\add* my \\w shepherd|strong="H7462"\\w*.\\f + \\fr 1.1 \\ft shepherd: Heb. \\+nd LORD\\+nd* feeder\\f*  \n' +
        "\\b\n\\q1\n\\v 2 He   maketh me.\n",
    );
    expect(book).toEqual({
      id: "PSA",
      chapters: [
        {
          n: 1,
          title: "To the chief Musician, <i>A Psalm</i> of David.",
          verses: [
            { n: 1, t: "The <n>LORD</n> <i>is</i> my shepherd.", p: 1, notes: ["shepherd: Heb. LORD feeder"] },
            { n: 2, t: "He maketh me.", p: 1 },
          ],
        },
      ],
    });
    expect(stats).toMatchObject({ titles: 1, notes: 1, paragraphs: 2 });
  });

  it("strips pilcrows (also just inside \\wj) into p", () => {
    const { book } = parse(
      "\\c 1\n\\p\n\\v 1 First.\n\\v 2 Second.\n\\p\n\\v 3 ¶ Third.\n" +
        '\\v 4 \\wj ¶ \\+w Ye|strong="G5210"\\+w* are \\+add the\\+add* salt.\\wj*\n',
      "MAT",
    );
    expect(book.chapters[0].verses).toEqual([
      { n: 1, t: "First.", p: 1 },
      { n: 2, t: "Second." },
      { n: 3, t: "Third.", p: 1 },
      { n: 4, t: "<j>Ye are <i>the</i> salt.</j>", p: 1 },
    ]);
  });

  it("emits the divine name next to supplied words, never inside them", () => {
    const { book, stats } = parse("\\c 1\n\\p\n\\v 1 the name \\add of the \\+nd LORD\\+nd* is\\add*, and.\n", "LEV");
    expect(book.chapters[0].verses[0].t).toBe("the name <i>of the</i> <n>LORD</n> <i>is</i>, and.");
    expect(stats.divineNameInSupplied).toBe(1);
  });

  it("closes a span at the verse end and reopens it in the next verse", () => {
    const { book } = parse("\\c 1\n\\p\n\\v 1 He said, \\wj Follow\n\\v 2 me \\+add now\\+add*.\\wj* And.\n", "MAT");
    expect(book.chapters[0].verses.map((v) => v.t)).toEqual(["He said, <j>Follow</j>", "<j>me <i>now</i>.</j> And."]);
  });

  it("turns acrostic headings into h and trailing headings into colophons", () => {
    const { book, stats } = parse(
      "\\c 1\n\\s1 \\tl  א ALEPH.\\tl*\n\\q1\n\\v 1 Blessed.\n\\s1 \\tl ב BETH.\\tl*\n\\q1\n\\v 2 Wherewithal.\n" +
        "\\c 2\n\\p\n\\v 1 Grace.\n\\s1 Written from Rome, \\add and sent\\add* by Tychicus.\n",
    );
    expect(book.chapters[0].verses.map((v) => v.h)).toEqual(["ALEPH", "BETH"]);
    expect(book.chapters[1].colophon).toBe("Written from Rome, <i>and sent</i> by Tychicus.");
    expect(stats).toMatchObject({ acrostics: 2, colophons: 1 });
  });

  it.each([
    ["an unknown marker", "\\c 1\n\\p\n\\v 1 Text \\x - \\xo 1.1 \\xt Gen 1:1\\x*\n", /unsupported marker \\x/],
    ["a verse gap", "\\c 1\n\\p\n\\v 1 One.\n\\v 3 Three.\n", /verse 1:3 where 1:2 was expected/],
    ["a chapter gap", "\\c 2\n\\p\n\\v 1 One.\n", /chapter 2 where 1 was expected/],
    ["a misplaced note", "\\c 1\n\\p\n\\v 1 One.\\f + \\fr 1.2 \\ft note\\f*\n", /footnote reference 1.2 inside verse 1.1/],
    ["stray text", "\\c 1\nloose words\n\\p\n\\v 1 One.\n", /text outside any verse/],
    ["an unclosed style", "\\c 1\n\\p\n\\v 1 \\add One.\n\\c 2\n\\p\n\\v 1 Two.\n", /\\add still open at \\c/],
    ["a mid-verse pilcrow", "\\c 1\n\\p\n\\v 1 One ¶ two.\n", /pilcrow inside the text/],
    ["a heading before a verse", "\\c 1\n\\s1 The Title\n\\p\n\\v 1 One.\n", /section heading before a verse/],
    ["a non-canonical book", "\\c 1\n\\p\n\\v 1 One.\n", /not a canonical book: TOB/, "TOB"],
  ])("fails loudly on %s", (_, body, message, id = "PSA") => {
    expect(() => parse(body, id)).toThrow(message);
  });
});

describe("validation helpers", () => {
  it("counts words on plain text", () => {
    expect(countWords("The <n>LORD</n> <i>is</i> my shepherd; I shall not want.")).toBe(9);
    expect(countWords("sin—; and")).toBe(2);
  });

  it("rejects incomplete data", () => {
    expect(() => validateKjv([])).toThrow(/expected 66 books, got 0/);
  });
});
