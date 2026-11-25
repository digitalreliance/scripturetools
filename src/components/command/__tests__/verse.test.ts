import { describe, expect, it } from "vitest";
import { revelationVerse } from "../verse";

describe("revelationVerse", () => {
  it("reads a verse in Revelation, giving a range's first verse", () => {
    expect(revelationVerse("Rev 12:9")).toEqual({ chapter: 12, verse: 9 });
    expect(revelationVerse("revelation 12:9-11")).toEqual({ chapter: 12, verse: 9 });
    expect(revelationVerse("REV 4:10-5:1")).toEqual({ chapter: 4, verse: 10 });
  });

  it("takes a bare chapter and verse as Revelation", () => {
    expect(revelationVerse("12:9")).toEqual({ chapter: 12, verse: 9 });
    expect(revelationVerse(" 1:1 ")).toEqual({ chapter: 1, verse: 1 });
    expect(revelationVerse("12.9")).toEqual({ chapter: 12, verse: 9 });
    expect(revelationVerse("12 : 9-11")).toEqual({ chapter: 12, verse: 9 });
  });

  it.each(["", "12", "12:", "Rev 12", "23:1", "12:18", "0:1", "John 3:16", "1 John 4:8", "3 John 2", "chiasm"])(
    "finds nothing in %j",
    (query) => {
      expect(revelationVerse(query)).toBeNull();
    },
  );
});
