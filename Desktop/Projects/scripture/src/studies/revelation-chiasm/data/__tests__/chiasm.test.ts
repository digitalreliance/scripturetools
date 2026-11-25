import { describe, expect, it } from "vitest";
import { stripMarkup } from "@/lib/bible/markup";
import { parseReference } from "@/lib/bible/reference";
import { readPassage } from "@/lib/bible/server";
import { CHART_NOTES, LEVELS, SECTIONS, getLevel } from "../chiasm";
import {
  CENTER,
  REVELATION_VERSES,
  chiasmStats,
  discrepancies,
  distanceFromCenter,
  levelForVerse,
  parsePrinted,
} from "../compute";

const LETTERS = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  ..."ABCDEFGHIJKLMNOPQRSTUVWXY".split("").map((c) => c + c),
];

describe("the chiasm dataset", () => {
  it("has 51 levels lettered A to Z, then AA to YY", () => {
    expect(LEVELS).toHaveLength(51);
    expect(LEVELS.map((l) => l.letter)).toEqual(LETTERS);
    LEVELS.forEach((l, i) => expect(l.level).toBe(i + 1));
  });

  it("cycles the chart's seven colours, with an uncoloured centre", () => {
    LEVELS.forEach((l, i) => {
      if (i === 50) {
        expect(l.isCenter).toBe(true);
        expect(l.colorIndex).toBeNull();
      } else {
        expect(l.isCenter).toBe(false);
        expect(l.colorIndex).toBe(i % 7);
      }
    });
  });

  it("references real verse ranges in Revelation", () => {
    for (const level of LEVELS) {
      for (const member of [level.first, level.second]) {
        const ref = parseReference(member.ref);
        expect(ref, member.ref).not.toBeNull();
        expect(ref?.book).toBe("REV");
        expect(member.label.length, member.label).toBeLessThanOrEqual(60);
        expect(member.prime).toBe(member === level.second);
      }
    }
  });

  it("quotes every highlight phrase exactly from its KJV passage", () => {
    for (const level of LEVELS) {
      for (const member of [level.first, level.second]) {
        const text = readPassage(member.ref).map((v) => stripMarkup(v.t)).join(" ");
        expect(member.phrases.length).toBeGreaterThan(0);
        for (const phrase of member.phrases) {
          expect(text.includes(phrase), `${member.letter}${member.prime ? "¹" : ""} ${member.ref}: "${phrase}"`).toBe(true);
        }
      }
    }
  });

  it("covers every level exactly once in the sections", () => {
    const covered = SECTIONS.flatMap(({ levels: [from, to] }) =>
      Array.from({ length: to - from + 1 }, (_, i) => from + i),
    );
    expect(covered).toEqual(LEVELS.map((l) => l.level));
  });

  it("annotates only real members", () => {
    for (const note of CHART_NOTES) expect(getLevel(note.letter)).toBeDefined();
  });
});

describe("distances from the centre", () => {
  it("places the centre between 12:9 and 12:10 in a 404-verse book", () => {
    expect(REVELATION_VERSES).toBe(404);
    expect(CENTER).toEqual({ before: 203, after: 204 });
  });

  it("matches the chart for the outer and inner pairs", () => {
    const d = (letter: string, half: "first" | "second") => distanceFromCenter(getLevel(letter)![half]);
    expect(d("A", "first")).toEqual({ min: 202, max: 202 });
    expect(d("A", "second")).toEqual({ min: 199, max: 199 });
    expect(d("B", "first")).toEqual({ min: 200, max: 200 });
    expect(d("B", "second")).toEqual({ min: 197, max: 197 });
    expect(d("J", "first")).toEqual({ min: 152, max: 153 });
    expect(d("R", "first")).toEqual({ min: 120, max: 122 });
    expect(d("YY", "first")).toEqual({ min: 0, max: 0 });
    expect(d("YY", "second")).toEqual({ min: 0, max: 0 });
  });

  it("parses the chart's shorthand ranges", () => {
    expect(parsePrinted("152-53")).toEqual({ min: 152, max: 153 });
    expect(parsePrinted("120-22")).toEqual({ min: 120, max: 122 });
    expect(parsePrinted("98-100")).toEqual({ min: 98, max: 100 });
    expect(parsePrinted("6-10")).toEqual({ min: 6, max: 10 });
    expect(parsePrinted("202")).toEqual({ min: 202, max: 202 });
  });

  it("finds exactly the five printed numbers that disagree with KJV counting", () => {
    const found = discrepancies().map((d) => `${d.letter}${d.prime ? "¹" : ""} ${d.printed}→${d.computed.min}`);
    expect(found).toEqual(["O¹ 129→127", "MM¹ 26→25", "NN¹ 21→20", "OO¹ 20→19", "RR¹ 10→7"]);
  });

  it("shows a near-perfect mirror", () => {
    const stats = chiasmStats();
    expect(stats.levels).toBe(51);
    expect(stats.correlation).toBeGreaterThan(0.99);
    expect(stats.maxAbsDelta).toBeLessThanOrEqual(10);
  });

  it("resolves a verse to its level", () => {
    expect(levelForVerse(12, 9).letter).toBe("YY");
    expect(levelForVerse(12, 10).letter).toBe("YY");
    expect(levelForVerse(1, 1).letter).toBe("A");
    expect(levelForVerse(22, 20).letter).toBe("A");
    expect(levelForVerse(4, 11).letter).toBe("R");
  });
});
