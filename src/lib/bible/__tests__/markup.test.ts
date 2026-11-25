import { describe, expect, it } from "vitest";
import { stripMarkup, tokenizeVerse, validateMarkup } from "@/lib/bible/markup";

const plain = { italic: false, wj: false, divineName: false };

describe("tokenizeVerse", () => {
  it("splits marked text into styled runs", () => {
    expect(tokenizeVerse("The <n>LORD</n> <i>is</i> my shepherd")).toEqual([
      { text: "The ", ...plain },
      { text: "LORD", ...plain, divineName: true },
      { text: " ", ...plain },
      { text: "is", ...plain, italic: true },
      { text: " my shepherd", ...plain },
    ]);
  });

  it("handles <i> and <n> inside <j>", () => {
    expect(tokenizeVerse("said, <j>Say <i>Thy</i> sins, <n>LORD</n>.</j> Then")).toEqual([
      { text: "said, ", ...plain },
      { text: "Say ", ...plain, wj: true },
      { text: "Thy", ...plain, wj: true, italic: true },
      { text: " sins, ", ...plain, wj: true },
      { text: "LORD", ...plain, wj: true, divineName: true },
      { text: ".", ...plain, wj: true },
      { text: " Then", ...plain },
    ]);
  });

  it("merges adjacent runs with the same style and drops empty ones", () => {
    expect(tokenizeVerse("<i>it</i><i> was</i>")).toEqual([{ text: "it was", ...plain, italic: true }]);
    expect(tokenizeVerse("")).toEqual([]);
    expect(tokenizeVerse("Jesus wept.")).toEqual([{ text: "Jesus wept.", ...plain }]);
  });
});

describe("stripMarkup", () => {
  it("removes only the tags", () => {
    expect(stripMarkup("<j>Say <i>Thy</i> sins, <n>LORD</n>.</j>")).toBe("Say Thy sins, LORD.");
    expect(stripMarkup("sin—; and [but]")).toBe("sin—; and [but]");
  });
});

describe("validateMarkup", () => {
  it.each(["plain", "<i>a</i> b <n>C</n>", "<j>a <i>b</i> <n>C</n> d</j>"])("accepts %j", (t) => {
    expect(validateMarkup(t)).toBeNull();
  });

  it.each([
    ["<i>a", "unclosed"],
    ["a</i>", "unbalanced"],
    ["<i>a <n>B</n></i>", "nested"],
    ["<j><j>a</j></j>", "nested"],
    ["<n><i>a</i></n>", "nested"],
    ["<i></i>", "empty"],
    ["<b>a</b>", "unknown"],
    ["a < b", "stray"],
    ["<i>a</j>", "unbalanced"],
  ])("rejects %j", (t, problem) => {
    expect(validateMarkup(t)).toMatch(problem);
  });
});
