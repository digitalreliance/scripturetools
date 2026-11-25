import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Passage, type PassageProps } from "@/components/bible/Passage";
import { VerseText, type VerseTextProps } from "@/components/bible/VerseText";

const verseText = (props: VerseTextProps) => renderToStaticMarkup(createElement(VerseText, props));
const passage = (props: PassageProps) => renderToStaticMarkup(createElement(Passage, props));

const SC = '<span style="font-variant-caps:all-small-caps;letter-spacing:0.04em">';
const WJ = '<span data-wj="" style="color:var(--scripture-wj, currentColor)">';

describe("VerseText", () => {
  it("renders supplied words as <em data-supplied>, or upright", () => {
    expect(verseText({ text: "darkness <i>was</i> upon" })).toBe(
      '<span>darkness <em data-supplied="">was</em> upon</span>',
    );
    expect(verseText({ text: "darkness <i>was</i> upon", showSupplied: false })).toBe("<span>darkness was upon</span>");
  });

  it("colours the words of Christ, unless redLetter is off", () => {
    expect(verseText({ text: "He said, <j>Follow <i>thou</i> me.</j>" })).toBe(
      `<span>He said, ${WJ}Follow <em data-supplied="">thou</em> me.</span></span>`,
    );
    expect(verseText({ text: "<j>Follow me.</j>", redLetter: false })).toBe("<span>Follow me.</span>");
  });

  it("sets the divine name in small capitals with full-size initials", () => {
    expect(verseText({ text: "The <n>LORD</n> is" })).toBe(
      `<span>The <span data-divine-name="">L${SC}ORD</span></span> is</span>`,
    );
    expect(verseText({ text: "the <n>LORD JEHOVAH</n>" })).toBe(
      `<span>the <span data-divine-name="">L${SC}ORD</span> J${SC}EHOVAH</span></span></span>`,
    );
  });

  it("highlights phrases across markup boundaries", () => {
    const out = verseText({ text: "The <n>LORD</n> <i>is</i> my shepherd", highlight: ["LORD is my"] });
    expect(out).toMatch(/^<span>The <mark data-phrase="LORD is my" style="[^"]+">/);
    expect(out).toContain(`L${SC}ORD</span></span> <em data-supplied="">is</em> my</mark> shepherd</span>`);
    expect(out.match(/<mark/g)).toHaveLength(1);
  });

  it("splits a highlight at a words-of-Christ boundary and keeps every occurrence", () => {
    const out = verseText({ text: "said, <j>Follow me.</j>", highlight: ["said, Follow"] });
    expect(out.match(/<mark data-phrase="said, Follow"/g)).toHaveLength(2);
    expect(out).toContain(`${WJ}<mark data-phrase="said, Follow"`);

    const repeated = verseText({ text: "cast out, and cast out", highlight: ["cast out", "out, and"] });
    expect(repeated.match(/data-phrase="cast out"/g)).toHaveLength(2);
    expect(repeated).toContain('data-phrase="out, and"');
  });

  it("ignores phrases that do not occur", () => {
    expect(verseText({ text: "Jesus wept.", highlight: ["Lazarus", ""] })).toBe("<span>Jesus wept.</span>");
  });
});

describe("Passage", () => {
  const verses = [
    { chapter: 12, n: 9, t: "And the great dragon was cast out" },
    { chapter: 12, n: 10, t: "And I heard a loud voice", p: 1 as const },
    { chapter: 12, n: 11, t: "And they overcame him" },
  ];

  it("numbers verses and breaks paragraphs at p", () => {
    const out = passage({ verses, className: "prose" });
    expect(out.startsWith('<div class="prose" data-passage="">')).toBe(true);
    expect(out.match(/<p data-paragraph/g)).toHaveLength(2);
    expect(out.match(/data-verse-number=""/g)).toHaveLength(3);
    expect(out).toContain('<span data-verse="12:9"><span data-verse-number=""');
    expect(out).toContain(">9</span><span>And the great dragon was cast out</span></span>");
  });

  it("supports one verse per line and hiding numbers", () => {
    expect(passage({ verses, layout: "verses" }).match(/<p data-paragraph/g)).toHaveLength(3);
    expect(passage({ verses, showNumbers: false })).not.toContain("data-verse-number");
  });

  it("labels chapter changes in multi-chapter passages", () => {
    const out = passage({
      verses: [
        { chapter: 4, n: 10, t: "The four and twenty elders" },
        { chapter: 4, n: 11, t: "Thou art worthy" },
        { chapter: 5, n: 1, t: "And I saw" },
      ],
    });
    expect(out).toContain(">4:10</span>");
    expect(out).toContain(">11</span>");
    expect(out).toContain(">5:1</span>");
    expect(out.match(/<p data-paragraph/g)).toHaveLength(2);
  });

  it("passes highlights and styling options through", () => {
    const out = passage({ verses, highlight: ["great dragon"] });
    expect(out).toContain('<mark data-phrase="great dragon"');
    expect(passage({ verses: [] })).toBe('<div data-passage=""></div>');
  });
});
