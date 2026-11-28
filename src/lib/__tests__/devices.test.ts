import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SITE } from "../site";

/**
 * Stylesheets can't read SITE, so the device thresholds are written out in
 * CSS as well. These checks keep the two in step: change a number in
 * src/lib/site.ts and they name every stylesheet that still uses the old one.
 */

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

/** Every pixel width a stylesheet's media queries test, e.g. "(width < 500px)" gives 500. */
function mediaWidths(css: string): number[] {
  return [...css.matchAll(/@media[^{]*\(\s*width\s*[<>]=?\s*(\d+)px\s*\)/g)].map((m) => Number(m[1]));
}

describe("device thresholds", () => {
  it("run from the narrowest window, through phones, to docked panels", () => {
    expect(SITE.minWindowWidth).toBeLessThan(SITE.minTabletWidth);
    expect(SITE.minTabletWidth).toBeLessThan(SITE.dockedPanelsWidth);
  });

  it("match SITE.minWindowWidth in the global stylesheet", () => {
    const widths = mediaWidths(read("src/app/globals.css"));
    expect(widths.length).toBeGreaterThan(0);
    expect(new Set(widths)).toEqual(new Set([SITE.minWindowWidth]));
  });

  it("match SITE.dockedPanelsWidth in the study shell's stylesheet", () => {
    const widths = mediaWidths(read("src/components/shell/StudyShell.module.css"));
    expect(widths.length).toBeGreaterThan(0);
    expect(new Set(widths)).toEqual(new Set([SITE.dockedPanelsWidth]));
  });
});
