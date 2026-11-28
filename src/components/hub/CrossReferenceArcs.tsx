"use client";

import { clsx } from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BOOKS } from "@/lib/bible/canon";
import { VERSE_COUNTS } from "@/lib/bible/generated/kjv-meta";
import { loadChapterArcs } from "@/lib/xrefs/client";
import type { ChapterArcs } from "@/lib/xrefs/types";
import { arcAlpha, chapterBook, layout, type Geometry } from "./arc-geometry";
import { ArcLight, arcSeed, FLOATS_PER_ARC, halfEllipseLength, type LightArcs } from "./arc-light";
import { BOOK_GROUPS, CANON_GROUPS, groupColor } from "./canon-groups";

const HEIGHT = 280;
/** Baseline of the spine; arcs rise above it, chapter bars hang below. */
const BASE = 214;
const BAR_MAX = 50;
const WEAVE_MS = 2400;
const MAX_VERSES = 176; // Psalm 119
/** Resting arcs settle to this alpha once the light is running, leaving it room to shine. */
const REST_ALPHA = 0.8;
/** Seconds for the resting arcs to settle. */
const REST_SETTLE = 1.6;
/** Rough width of a canon group's label (12 px Archivo), to keep neighbours from overlapping. */
const labelWidth = (name: string) => name.length * 6 + 4;
/** Labels that would touch the ones before them drop to a line below, this far apart. */
const LABEL_ROW = 17;

/** Canon group colours in the order the light's shader indexes them. */
const PALETTE = CANON_GROUPS.map((g) => g.color);
const BOOK_GROUP_INDEX = BOOK_GROUPS.map((group) => CANON_GROUPS.findIndex((g) => g.id === group));

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
 * coloured by the canon group of the earlier chapter. The arcs weave in once;
 * then light keeps reading through them, Genesis to Revelation and round
 * again (`arc-light.ts`).
 */
export function CrossReferenceArcs() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const arcsLayer = useRef<HTMLCanvasElement | null>(null);
  const [data, setData] = useState<ChapterArcs | null>(null);
  const [failed, setFailed] = useState(false);
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [book, setBook] = useState<number | null>(null);
  /**
   * A finger chose the book. Without hover there is no "pointer left" to
   * clear it, so it stays, readout and all, until a tap lands elsewhere.
   */
  const [pinned, setPinned] = useState(false);
  const woven = useRef(false);
  const lightCanvas = useRef<HTMLCanvasElement>(null);
  /** The light is running (WebGL2 is available and motion is welcome). */
  const [shining, setShining] = useState(false);
  /** Alpha of the resting arcs: 1 until the light starts, then REST_ALPHA. */
  const rest = useRef(1);

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
        target.globalAlpha = Math.min(1, arcAlpha(w, data.maxWeight) * boost);
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
    ctx.globalAlpha = focus === null ? rest.current : 0.13;
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

    // The page's one orchestrated moment opens: arcs weave in, Genesis to
    // Revelation. The light below carries it on.
    let drawn = 0;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      // A frame's timestamp can precede `start`; a negative p would make `drawn`
      // negative and the next frame read links[-n].
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

  /** Every arc as the light's shader reads it, in the same order as `data.links`. */
  const lightArcs = useMemo((): LightArcs | null => {
    if (!data || !geometry) return null;
    const ratio = Math.min(1, (BASE - 8) / (geometry.width / 2));
    const count = data.links.length;
    const out = new Float32Array(count * FLOATS_PER_ARC);
    const x1s = new Float32Array(count);
    let maxLength = 0;
    data.links.forEach(([a, b, w], i) => {
      const x1 = geometry.chapterX[a];
      const x2 = geometry.chapterX[b];
      const r = (x2 - x1) / 2;
      const length = halfEllipseLength(r, Math.max(1.5, r * ratio));
      out.set([x1, x2, arcAlpha(w, data.maxWeight), length, BOOK_GROUP_INDEX[chapterBook[a]], arcSeed(i)], i * FLOATS_PER_ARC);
      x1s[i] = x1;
      maxLength = Math.max(maxLength, length);
    });
    return { data: out, x1: x1s, count, maxLength };
  }, [data, geometry]);

  // The light's loop reads the latest inputs through refs, so a resize or a
  // new compose never restarts it.
  const lightInput = useRef<{ arcs: LightArcs | null; geometry: Geometry | null }>({ arcs: null, geometry: null });
  const composeRef = useRef(compose);
  useEffect(() => {
    lightInput.current = { arcs: lightArcs, geometry };
    composeRef.current = compose;
  }, [lightArcs, geometry, compose]);

  // After the weave, light keeps reading through the arcs, Genesis to
  // Revelation and round again. It pauses while a book is in focus, while the
  // figure is off screen and in background tabs, and never runs under reduced
  // motion or without WebGL2, where the woven figure simply stays still.
  const lightReady = lightArcs !== null;
  useEffect(() => {
    const el = lightCanvas.current;
    const host = wrap.current;
    if (!lightReady || !el || !host || prefersReducedMotion()) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let light: ArcLight | null = null;
    const applied: { arcs: LightArcs | null; geometry: Geometry | null } = { arcs: null, geometry: null };
    let frame = 0;
    let last = 0;
    let clock = 0;
    let done = false;

    const stop = () => {
      done = true;
      cancelAnimationFrame(frame);
      rest.current = 1;
      composeRef.current();
      setShining(false);
    };
    const onMotion = () => {
      if (motion.matches) stop();
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      // Light this slow needs no more than about 60 frames a second, even on faster screens.
      if (last && now - last < 11) return;
      // Clamp the step so a stalled frame or a returning tab never jumps the light.
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const { arcs, geometry: g } = lightInput.current;
      if (!woven.current || !arcs || !g) return;
      if (!light) {
        light = ArcLight.create(el, PALETTE);
        if (!light) return stop();
        setShining(true);
      }
      if (light.lost) return stop();
      if (applied.arcs !== arcs) {
        light.setArcs(arcs);
        applied.arcs = arcs;
      }
      if (applied.geometry !== g) {
        light.setView({ width: g.width, height: HEIGHT, base: BASE, dpr: window.devicePixelRatio || 1 });
        applied.geometry = g;
      }
      // A book in focus has the reader's attention: hold the light where it is.
      if (bookRef.current !== null) return;
      clock += dt;
      if (rest.current > REST_ALPHA) {
        rest.current = Math.max(REST_ALPHA, rest.current - (dt / REST_SETTLE) * (1 - REST_ALPHA));
        composeRef.current();
      }
      light.render(clock);
    };

    const io = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (done || !entry.isIntersecting) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    });
    io.observe(host);
    motion.addEventListener("change", onMotion);
    return () => {
      done = true;
      io.disconnect();
      motion.removeEventListener("change", onMotion);
      cancelAnimationFrame(frame);
      light?.dispose();
      rest.current = 1;
    };
  }, [lightReady]);

  useEffect(() => {
    if (!pinned) return;
    const onDown = (event: PointerEvent) => {
      if (wrap.current?.contains(event.target as Node)) return;
      setPinned(false);
      setBook(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [pinned]);

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

  const readout = ((): { title: string; rows: string[][]; note: ReactNode } => {
    if (book === null) {
      return {
        title: "The whole Bible",
        rows: [
          ["Chapters", "1,189"],
          ["Cross references", data ? data.totals.kept.toLocaleString("en-US") : "…"],
          ["Chapter links drawn", data ? data.links.length.toLocaleString("en-US") : "…"],
        ],
        note: failed ? (
          "The cross references couldn't load. Refresh to try again."
        ) : (
          <>
            <span className="pointer-coarse:hidden">
              Point at a book, or focus the figure and use the arrow keys, to trace its connections.
            </span>
            <span className="hidden pointer-coarse:inline">Touch a book, or slide along them, to trace its connections.</span>
          </>
        ),
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
    // Labels start at their group, except the last one, and any that would
    // run off the right edge (on a phone), which end with their group. Where
    // the figure is too narrow for a label to clear the ones before it, it
    // drops to the first line below where it fits.
    const rowEnds: number[] = [];
    return CANON_GROUPS.map((g, i) => {
      const idx = BOOK_GROUPS.map((x, j) => (x === g.id ? j : -1)).filter((j) => j >= 0);
      const start = geometry.books[idx[0]][0];
      const end = geometry.books[idx[idx.length - 1]][1];
      const w = labelWidth(g.name);
      const alignEnd = i === CANON_GROUPS.length - 1 || start + w > geometry.width;
      const [from, to] = alignEnd ? [end - w, end] : [start, start + w];
      let row = rowEnds.findIndex((rowEnd) => from >= rowEnd + 8);
      if (row === -1) row = rowEnds.length;
      rowEnds[row] = to;
      return { ...g, row, alignEnd, left: (start / geometry.width) * 100, width: ((end - start) / geometry.width) * 100 };
    });
  }, [geometry]);
  const labelRows = Math.max(1, ...groupExtents.map((g) => g.row + 1));

  return (
    <figure className="relative m-0">
      <div className="mb-3 flex min-h-[72px] items-end justify-between gap-10 max-md:flex-col max-md:items-start max-md:gap-3">
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
        <p className="max-w-[340px] text-[13px] leading-relaxed text-cover-muted md:text-right">{readout.note}</p>
      </div>

      <div
        ref={wrap}
        tabIndex={0}
        role="group"
        aria-label="Cross references across the Bible. Use the left and right arrow keys to step through the books."
        // A mouse or pen points at books as it passes. A finger touches one, or
        // slides along the spine to scrub through them (touch-pan-y leaves
        // vertical swipes to scroll the page), and the book stays chosen.
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") return;
          setPinned(e.pointerType === "touch");
          setBook(bookAt(e.clientX - e.currentTarget.getBoundingClientRect().left));
        }}
        onPointerMove={(e) => setBook(bookAt(e.clientX - e.currentTarget.getBoundingClientRect().left))}
        onPointerLeave={(e) => {
          if (e.pointerType !== "touch") setBook(null);
        }}
        onPointerCancel={(e) => {
          // The page took the gesture to scroll: let go of the book it began on.
          if (e.pointerType !== "touch") return;
          setPinned(false);
          setBook(null);
        }}
        onBlur={() => {
          setPinned(false);
          setBook(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            setBook((b) => (b === null ? 0 : Math.min(b + 1, BOOKS.length - 1)));
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            setBook((b) => (b === null ? BOOKS.length - 1 : Math.max(b - 1, 0)));
          } else if (e.key === "Escape") setBook(null);
        }}
        className="relative cursor-crosshair touch-pan-y rounded-[6px] select-none [-webkit-touch-callout:none]"
        style={{ height: HEIGHT }}
      >
        <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />
        {/* The light adds onto the resting arcs; it steps aside while a book is in focus. */}
        <canvas
          ref={lightCanvas}
          aria-hidden
          className={clsx(
            "pointer-events-none absolute inset-0 h-full w-full mix-blend-screen transition-opacity duration-200 ease-out supports-[mix-blend-mode:plus-lighter]:mix-blend-plus-lighter",
            (!shining || book !== null) && "opacity-0",
          )}
        />
        {book !== null && geometry ? (
          <div
            aria-hidden
            className="pointer-events-none absolute top-[calc(100%-62px)] h-[60px] border-x border-cover-ink/40"
            style={{ left: geometry.books[book][0] - 2, width: geometry.books[book][1] - geometry.books[book][0] + 4 }}
          />
        ) : null}
      </div>

      {/* Each canon group's band under the spine, named beneath it; on a phone, where the bands are too narrow to name, a key follows instead. */}
      <div aria-hidden className="relative mt-3 max-sm:h-0.5!" style={{ height: 36 + (labelRows - 1) * LABEL_ROW }}>
        {groupExtents.map((g) => (
          <div key={g.id} className="absolute top-0" style={{ left: `${g.left}%`, width: `${g.width}%` }}>
            <div className="h-[2px] rounded-full" style={{ backgroundColor: g.color }} />
            <p
              className={`mt-1.5 text-[12px] whitespace-nowrap text-cover-muted max-sm:hidden ${g.alignEnd ? "absolute right-0" : ""}`}
              style={g.row ? { marginTop: 6 + g.row * LABEL_ROW } : undefined}
            >
              {g.name}
            </p>
          </div>
        ))}
      </div>

      <ul aria-hidden className="mt-4 hidden flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-cover-muted max-sm:flex">
        {CANON_GROUPS.map((g) => (
          <li key={g.id} className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="size-2 rounded-full" style={{ backgroundColor: g.color }} />
            {g.name}
          </li>
        ))}
      </ul>

      <figcaption className="sr-only">
        An arc diagram of {data ? data.links.length.toLocaleString("en-US") : "the strongest"} links between the Bible&rsquo;s 1,189
        chapters, drawn from {data ? data.totals.kept.toLocaleString("en-US") : "about 340,000"} cross references.
        {top.length ? ` The strongest links: ${top.map(([a, b, w]) => `${chapterName(a)} and ${chapterName(b)} (${w})`).join("; ")}.` : ""}
      </figcaption>
    </figure>
  );
}
