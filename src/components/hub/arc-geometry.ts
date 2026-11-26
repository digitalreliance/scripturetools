import { BOOKS } from "@/lib/bible/canon";

/**
 * Geometry of the cross-reference figure, shared by the cover's canvas
 * (CrossReferenceArcs) and the site's link-preview image (app/opengraph-image),
 * so the two always draw the same picture.
 */

/** Space between books on the chapter axis, in chapter widths. */
export const BOOK_GAP = 2.4;

/** Resting alpha of an arc: stronger links draw brighter. */
export const arcAlpha = (weight: number, maxWeight: number) => 0.04 + 0.26 * Math.sqrt(weight / maxWeight);

export interface Geometry {
  width: number;
  /** Centre x of each global chapter index. */
  chapterX: Float32Array;
  unit: number;
  /** [start, end] x of each book. */
  books: [number, number][];
}

/** Places the 1,189 chapters along a line `width` wide, with a gap between books. */
export function layout(width: number): Geometry {
  const units = BOOKS.reduce((n, b) => n + b.chapters, 0) + (BOOKS.length - 1) * BOOK_GAP;
  const unit = width / units;
  const chapterX = new Float32Array(1189);
  const books: [number, number][] = [];
  let cursor = 0;
  let index = 0;
  BOOKS.forEach((book, b) => {
    if (b > 0) cursor += BOOK_GAP;
    const start = cursor * unit;
    for (let c = 0; c < book.chapters; c++) {
      chapterX[index++] = (cursor + 0.5) * unit;
      cursor += 1;
    }
    books.push([start, cursor * unit]);
  });
  return { width, chapterX, unit, books };
}

/** The book (0-based canon order) of each global chapter index. */
export const chapterBook = (() => {
  const out = new Uint8Array(1189);
  let i = 0;
  BOOKS.forEach((book, b) => {
    for (let c = 0; c < book.chapters; c++) out[i++] = b;
  });
  return out;
})();
