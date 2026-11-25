import { describe, expect, it } from "vitest";
import { readerHref, studyHref } from "@/lib/routes";

describe("readerHref", () => {
  it("links to a chapter by slug", () => {
    expect(readerHref("REV", 12)).toBe("/read/revelation/12");
    expect(readerHref("1-samuel", 3)).toBe("/read/1-samuel/3");
    expect(readerHref("Gen")).toBe("/read/genesis/1");
  });

  it("anchors a verse or a range in the hash", () => {
    expect(readerHref("REV", 12, 9)).toBe("/read/revelation/12#v9");
    expect(readerHref("REV", 12, 9, 10)).toBe("/read/revelation/12#v9-10");
    expect(readerHref("REV", 12, 9, 9)).toBe("/read/revelation/12#v9");
  });

  it("rejects unknown books", () => {
    expect(() => readerHref("XYZ", 1)).toThrow();
  });
});

describe("studyHref", () => {
  it("builds study routes", () => {
    expect(studyHref("revelation-chiasm")).toBe("/studies/revelation-chiasm");
  });
});
