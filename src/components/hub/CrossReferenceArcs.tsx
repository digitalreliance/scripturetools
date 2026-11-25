"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BOOKS } from "@/lib/bible/canon";
import { VERSE_COUNTS } from "@/lib/bible/generated/kjv-meta";
import { loadChapterArcs } from "@/lib/xrefs/client";
import type { ChapterArcs } from "@/lib/xrefs/types";
import { BOOK_GROUPS, CANON_GROUPS, groupColor } from "./canon-groups";

const HEIGHT = 280;
/** Baseline of the spine; arcs rise above it, chapter bars hang below. */
const BASE = 214;
const BAR_MAX = 50;
const BOOK_GAP = 2.4; // in chapter widths
const WEAVE_MS = 2400;
const MAX_VERSES = 176; // Psalm 119

interface Geometry {
  width: number;
  /** Centre x of each global chapter index. */
  chapterX: Float32Array;
  unit: number;
  /** [start, end] x of each book. */
  books: [number, number][];
}

function layout(width: number): Geometry {
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

const chapterBook = (() => {
  const out = new Uint8Array(1189);
  let i = 0;
  BOOKS.forEach((book, b) => {
    for (let c = 0; c < book.chapters; c++) out[i++] = b;
  });
  return out;
})();

const chapterNumber = (() => {
  const out = new Uint16Array(1189);
  let i = 0;
  for (const book of BOOKS) for (let c = 1; c <= book.chapters; c++) out[i++] = c;
  return out;
})();

/** "Isaiah 53"; a single psalm is "Psalm 119", not "Psalms 119". */
const chapterName = (index: number) => {
  const book = BOOKS[chapterBook[index]];
  return `${book.id === "PSA" ? "Psalm" : book.name} ${chapterNumber[index]}`;
};

/** The offscreen canvas that caches every arc, created once and resized as needed. */
function sizedLayer(layer: HTMLCanvasElement | null, width: number, height: number): HTMLCanvasElement {
  const out = layer ?? document.createElement("canvas");
  out.width = width;
  out.height = height;
  return out;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface BookStats {
  verses: number;
  links: number;
  strongest: { a: number; b: number; w: number } | null;
}

/**
 * The whole Bible as one figure: 1,189 chapters along a spine, and the
 * strongest chapter-to-chapter cross references rising above it as arcs,
 * coloured by the canon group of the earlier chapter.
 */
export function CrossReferenceArcs() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const arcsLayer = useRef<HTMLCanvasElement | null>(null);
  const [data, setData] = useState<ChapterArcs | null>(null);
  const [failed, setFailed] = useState(false);
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [book, setBook] = useState<number | null>(null);
  const woven = useRef(false);

  useEffect(() => {
    let alive = true;
    loadChapterArcs().then(
      (d) => alive && setData(d),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      // Hidden (e.g. behind the phone gate): nothing to draw until it has a size.
      if (width < 1) return;
      setGeometry((g) => (g && g.width === width ? g : layout(width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const stats = useMemo(() => {
    const perBook: BookStats[] = BOOKS.map((b) => ({
      verses: VERSE_COUNTS[b.id].reduce((s, n) => s + n, 0),
      links: 0,
      strongest: null,
    }));
    const byBook: number[][] = BOOKS.map(() => []);
    if (data) {
      data.links.forEach(([a, b, w], i) => {
        for (const bk of new Set([chapterBook[a], chapterBook[b]])) {
          const s = perBook[bk];
          s.links++;
          byBook[bk].push(i);
          if (!s.strongest || w > s.strongest.w) s.strongest = { a, b, w };
        }
      });
    }
    return { perBook, byBook };
  }, [data]);

  const top = useMemo(() => (data ? [...data.links].sort((x, y) => y[2] - x[2]).slice(0, 5) : []), [data]);

  const drawArcs = useCallback(
    (target: CanvasRenderingContext2D, g: Geometry, from: number, to: number, only?: number[], boost = 1) => {
      if (!data) return;
      const ratio = Math.min(1, (BASE - 8) / (g.width / 2));
      target.globalCompositeOperation = "lighter";
      target.lineWidth = 0.8;
      const indices = only ?? null;
      const count = indices ? indices.length : to;
      for (let k = indices ? 0 : from; k < count; k++) {
        const [a, b, w] = data.links[indices ? indices[k] : k];
        const x1 = g.chapterX[a];
        const x2 = g.chapterX[b];
        const r = (x2 - x1) / 2;
        target.strokeStyle = groupColor(BOOK_GROUPS[chapterBook[a]]);
        target.globalAlpha = Math.min(1, (0.04 + 0.26 * Math.sqrt(w / data.maxWeight)) * boost);
        target.beginPath();
        target.ellipse(x1 + r, BASE, r, Math.max(1.5, r * ratio), 0, Math.PI, 2 * Math.PI);
        target.stroke();
      }
      target.globalAlpha = 1;
      target.globalCompositeOperation = "source-over";
    },
    [data],
  );

  const drawSpine = useCallback((target: CanvasRenderingContext2D, g: Geometry, focus: number | null) => {
    target.fillStyle = "rgba(242, 238, 230, 0.16)";
    target.fillRect(0, BASE, g.width, 1);
    const barW = Math.max(0.6, g.unit * 0.72);
    let i = 0;
    BOOKS.forEach((bk, b) => {
      target.fillStyle = groupColor(BOOK_GROUPS[b]);
      target.globalAlpha = focus === null || focus === b ? 0.92 : 0.28;
      for (let c = 0; c < bk.chapters; c++) {
        const h = 4 + (VERSE_COUNTS[bk.id][c] / MAX_VERSES) * BAR_MAX;
        target.fillRect(g.chapterX[i] - barW / 2, BASE + 3, barW, h);
        i++;
      }
    });
    target.globalAlpha = 1;
  }, []);

  const bookRef = useRef<number | null>(null);
  const ctxRef = useRef<{ ctx: CanvasRenderingContext2D; el: HTMLCanvasElement; dpr: number } | null>(null);

  /** Paint the visible canvas: the cached arcs, the focused book's arcs, the spine. */
  const compose = useCallback(() => {
    const target = ctxRef.current;
    const layer = arcsLayer.current;
    if (!target || !layer || !geometry) return;
    const { ctx, el, dpr } = target;
    if (el.width === 0 || el.height === 0 || layer.width === 0 || layer.height === 0) return;
    const focus = bookRef.current;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, el.width, el.height);
    ctx.globalAlpha = focus === null ? 1 : 0.13;
    ctx.drawImage(layer, 0, 0);
    ctx.globalAlpha = 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (focus !== null && data) drawArcs(ctx, geometry, 0, 0, stats.byBook[focus], 3.2);
    drawSpine(ctx, geometry, focus);
  }, [geometry, data, stats, drawArcs, drawSpine]);

  // Build the arcs layer: the spine draws at once; the arcs weave in once.
  useEffect(() => {
    const el = canvas.current;
    if (!el || !geometry) return;
    const dpr = window.devicePixelRatio || 1;
    el.width = Math.round(geometry.width * dpr);
    el.height = Math.round(HEIGHT * dpr);
    const ctx = el.getContext("2d");
    const layer = sizedLayer(arcsLayer.current, el.width, el.height);
    arcsLayer.current = layer;
    const lctx = layer.getContext("2d");
    if (!ctx || !lctx) return;
    ctxRef.current = { ctx, el, dpr };
    lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lctx.clearRect(0, 0, geometry.width, HEIGHT);

    if (!data) {
      compose();
      return;
    }
    const total = data.links.length;
    if (woven.current || prefersReducedMotion()) {
      drawArcs(lctx, geometry, 0, total);
      woven.current = true;
      compose();
      return;
    }

    // The page's one orchestrated moment: arcs weave in, Genesis to Revelation.
    let drawn = 0;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      // A frame can be stamped just before `start`; a negative p would index links[-n].
      const p = Math.min(1, Math.max(0, (now - start) / WEAVE_MS));
      const next = Math.round(total * (1 - (1 - p) ** 2));
      drawArcs(lctx, geometry, drawn, next);
      drawn = next;
      compose();
      if (p < 1) frame = requestAnimationFrame(tick);
      else woven.current = true;
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      // An interrupted weave finishes instantly next time instead of replaying.
      woven.current = true;
    };
  }, [geometry, data, drawArcs, compose]);

  // Hover and keyboard focus only recompose; they never rebuild the arcs.
  useEffect(() => {
    bookRef.current = book;
    compose();
  }, [book, compose]);

  const bookAt = useCallback(
    (x: number) => {
      if (!geometry) return null;
      const { books } = geometry;
      for (let b = 0; b < books.length; b++) {
        const next = books[b + 1]?.[0] ?? Infinity;
        if (x < (books[b][1] + next) / 2) return b;
      }
      return books.length - 1;
    },
    [geometry],
  );

  const readout = (() => {
    if (book === null) {
      return {
        title: "The whole Bible",
        rows: [
          ["Chapters", "1,189"],
          ["Cross references", data ? data.totals.kept.toLocaleString("en-US") : "…"],
          ["Chapter links drawn", data ? data.links.length.toLocaleString("en-US") : "…"],
        ],
        note: failed ? "The cross references couldn't load. Refresh to try again." : "Point at a book, or focus the figure and use the arrow keys, to trace its connections.",
      };
    }
    const s = stats.perBook[book];
    const b = BOOKS[book];
    return {
      title: b.name,
      rows: [
        ["Chapters", String(b.chapters)],
        ["Verses", s.verses.toLocaleString("en-US")],
        ["Links drawn", s.links.toLocaleString("en-US")],
      ],
      note: s.strongest
        ? `Strongest link: ${chapterName(s.strongest.a)} and ${chapterName(s.strongest.b)}, ${s.strongest.w} cross references.`
        : "No links strong enough to draw.",
    };
  })();


  const groupExtents = useMemo(() => {
    if (!geometry) return [];
    return CANON_GROUPS.map((g) => {
      const idx = BOOK_GROUPS.map((x, i) => (x === g.id ? i : -1)).filter((i) => i >= 0);
      const start = geometry.books[idx[0]][0];
      const end = geometry.books[idx[idx.length - 1]][1];
      return { ...g, left: (start / geometry.width) * 100, width: ((end - start) / geometry.width) * 100 };
    });
  }, [geometry]);

  return (
    <figure className="relative m-0">
      <div className="mb-3 flex min-h-[72px] items-end justify-between gap-10">
        <div aria-live="polite">
          <p className="text-[15px] font-semibold tracking-[-0.01em] text-cover-ink [font-stretch:108%]">{readout.title}</p>
          <dl className="mt-2 flex gap-7 text-[13px]">
            {readout.rows.map(([label, value]) => (
              <div key={label}>
                <dt className="text-cover-muted">{label}</dt>
                <dd className="mt-0.5 font-medium text-cover-ink tabular">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="max-w-[340px] text-right text-[13px] leading-relaxed text-cover-muted">{readout.note}</p>
      </div>

      <div
        ref={wrap}
        tabIndex={0}
        role="group"
        aria-label="Cross references across the Bible. Use the left and right arrow keys to step through the books."
        onPointerMove={(e) => setBook(bookAt(e.clientX - e.currentTarget.getBoundingClientRect().left))}
        onPointerLeave={() => setBook(null)}
        onBlur={() => setBook(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            setBook((b) => (b === null ? 0 : Math.min(b + 1, BOOKS.length - 1)));
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            setBook((b) => (b === null ? BOOKS.length - 1 : Math.max(b - 1, 0)));
          } else if (e.key === "Escape") setBook(null);
        }}
        className="relative cursor-crosshair rounded-[6px]"
        style={{ height: HEIGHT }}
      >
        <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />
        {book !== null && geometry ? (
          <div
            aria-hidden
            className="pointer-events-none absolute top-[calc(100%-62px)] h-[60px] border-x border-cover-ink/40"
            style={{ left: geometry.books[book][0] - 2, width: geometry.books[book][1] - geometry.books[book][0] + 4 }}
          />
        ) : null}
      </div>

      <div aria-hidden className="relative mt-3 h-9">
        {groupExtents.map((g, i) => (
          <div key={g.id} className="absolute top-0" style={{ left: `${g.left}%`, width: `${g.width}%` }}>
            <div className="h-[2px] rounded-full" style={{ backgroundColor: g.color }} />
            <p
              className={`mt-1.5 text-[12px] whitespace-nowrap text-cover-muted ${i === CANON_GROUPS.length - 1 ? "absolute right-0" : ""}`}
            >
              {g.name}
            </p>
          </div>
        ))}
      </div>

      <figcaption className="sr-only">
        An arc diagram of {data ? data.links.length.toLocaleString("en-US") : "the strongest"} links between the Bible&rsquo;s 1,189
        chapters, drawn from {data ? data.totals.kept.toLocaleString("en-US") : "about 340,000"} cross references.
        {top.length ? ` The strongest links: ${top.map(([a, b, w]) => `${chapterName(a)} and ${chapterName(b)} (${w})`).join("; ")}.` : ""}
      </figcaption>
    </figure>
  );
}
