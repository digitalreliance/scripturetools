import { describe, expect, it } from "vitest";
import { isBookId } from "@/lib/bible/canon";
import { PALETTES } from "@/studies/palettes";
import { CATEGORIES, STUDIES, getStudy, studiesIn } from "@/studies/registry";

const HEX = /^#[0-9A-F]{6}$/i;

/** WCAG relative luminance and contrast ratio. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("study registry", () => {
  it("has unique slugs", () => {
    const slugs = STUDIES.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("puts every study in a known category, and every category has studies", () => {
    const ids = new Set(CATEGORIES.map((c) => c.id));
    for (const study of STUDIES) expect(ids.has(study.category)).toBe(true);
    for (const category of CATEGORIES) expect(studiesIn(category.id).length).toBeGreaterThan(0);
  });

  it("gives live studies a route and planned studies none", () => {
    for (const study of STUDIES) {
      if (study.status === "live") expect(study.href).toMatch(/^\//);
      else expect(study.href).toBeNull();
    }
  });

  it("only references real books", () => {
    for (const study of STUDIES) {
      if (study.books === "all") continue;
      expect(study.books.length).toBeGreaterThan(0);
      for (const id of study.books) expect(isBookId(id)).toBe(true);
    }
  });

  it("writes summaries as single plain sentences without arrows", () => {
    for (const study of STUDIES) {
      expect(study.summary.length).toBeLessThanOrEqual(160);
      expect(study.summary).not.toMatch(/→|\s·\s/);
    }
  });

  it("finds studies by slug", () => {
    expect(getStudy("revelation-chiasm")?.status).toBe("live");
    expect(getStudy("nope")).toBeUndefined();
  });
});

describe("study palettes", () => {
  for (const [name, p] of Object.entries(PALETTES)) {
    it(`${name} is complete and readable`, () => {
      for (const key of ["canvas", "chrome", "raised", "line", "ink", "muted", "accent", "onAccent"] as const) {
        expect(p[key]).toMatch(HEX);
      }
      // Body text and secondary text meet WCAG AA on the surfaces they sit on.
      expect(contrast(p.ink, p.canvas)).toBeGreaterThanOrEqual(7);
      expect(contrast(p.muted, p.chrome)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.muted, p.canvas)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.onAccent, p.accent)).toBeGreaterThanOrEqual(4.5);
    });
  }
});
