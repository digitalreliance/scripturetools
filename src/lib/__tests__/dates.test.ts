import { describe, expect, it } from "vitest";
import { formatIsoDate, isIsoDate } from "@/lib/dates";

describe("dates", () => {
  it("accepts real YYYY-MM-DD days only", () => {
    expect(isIsoDate("2026-11-25")).toBe(true);
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2100-02-29")).toBe(false);
    expect(isIsoDate("2026-04-31")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("2026-11-5")).toBe(false);
    expect(isIsoDate("25/11/2026")).toBe(false);
  });

  it("prints the day, month name and year", () => {
    expect(formatIsoDate("2026-11-25")).toBe("25 November 2026");
    expect(formatIsoDate("2027-01-03")).toBe("3 January 2027");
    expect(() => formatIsoDate("2026-02-30")).toThrow();
  });
});
