import { referenceBounds } from "@/lib/bible/reference";
import { bookVerseCount, verseOrdinal } from "@/lib/bible/versification";
import { CENTER_LEVEL, LEVELS, type Level, type Member } from "./chiasm";

/**
 * Every number here is computed from KJV verse numbering: Revelation's 404
 * verses counted in order. The centre falls between 12:9 (verse 203) and
 * 12:10 (verse 204). A first-half passage's distance is how many verses it
 * sits before 12:9; a second-half passage's, how many after 12:10.
 */
export const REVELATION_VERSES = bookVerseCount("REV");
export const CENTER = {
  before: verseOrdinal("REV", 12, 9),
  after: verseOrdinal("REV", 12, 10),
} as const;

export interface Span {
  /** Ordinal of the passage's first verse (1-based within Revelation). */
  first: number;
  last: number;
}

export interface Distance {
  min: number;
  max: number;
}

const spanCache = new Map<string, Span>();

export function memberSpan(member: Pick<Member, "ref">): Span {
  const cached = spanCache.get(member.ref);
  if (cached) return cached;
  const { start, end } = referenceBounds(member.ref);
  if (start.book !== "REV" || end.book !== "REV") throw new Error(`Not in Revelation: ${member.ref}`);
  const span = {
    first: verseOrdinal("REV", start.chapter, start.verse),
    last: verseOrdinal("REV", end.chapter, end.verse),
  };
  spanCache.set(member.ref, span);
  return span;
}

export function distanceFromCenter(member: Pick<Member, "ref" | "prime">): Distance {
  const { first, last } = memberSpan(member);
  return member.prime
    ? { min: first - CENTER.after, max: last - CENTER.after }
    : { min: CENTER.before - last, max: CENTER.before - first };
}

export const midpoint = (d: Distance) => (d.min + d.max) / 2;

/** "202", or "152–153" for a passage spanning several verses. */
export function formatDistance(d: Distance): string {
  return d.min === d.max ? String(d.min) : `${d.min}–${d.max}`;
}

export interface PairSymmetry {
  /** Verses before the centre (midpoint for ranges). */
  before: number;
  /** Verses after the centre. */
  after: number;
  /** after − before. */
  delta: number;
}

export function pairSymmetry(level: Level): PairSymmetry {
  const before = midpoint(distanceFromCenter(level.first));
  const after = midpoint(distanceFromCenter(level.second));
  return { before, after, delta: after - before };
}

export interface ChiasmStats {
  levels: number;
  passages: number;
  meanAbsDelta: number;
  maxAbsDelta: number;
  /** Letter of the level with the largest |delta|. */
  maxLetter: string;
  /** Levels whose halves sit within 3 verses of the same distance. */
  withinThree: number;
  /** Pearson correlation of before vs after across all levels. */
  correlation: number;
}

export function chiasmStats(levels: readonly Level[] = LEVELS): ChiasmStats {
  const pairs = levels.map(pairSymmetry);
  const n = pairs.length;
  const deltas = pairs.map((p) => Math.abs(p.delta));
  let maxAbsDelta = 0;
  let maxLetter = levels[0]?.letter ?? "";
  deltas.forEach((d, i) => {
    if (d > maxAbsDelta) {
      maxAbsDelta = d;
      maxLetter = levels[i].letter;
    }
  });
  const meanX = pairs.reduce((s, p) => s + p.before, 0) / n;
  const meanY = pairs.reduce((s, p) => s + p.after, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const p of pairs) {
    sxy += (p.before - meanX) * (p.after - meanY);
    sxx += (p.before - meanX) ** 2;
    syy += (p.after - meanY) ** 2;
  }
  return {
    levels: n,
    passages: n * 2,
    meanAbsDelta: deltas.reduce((s, d) => s + d, 0) / n,
    maxAbsDelta,
    maxLetter,
    withinThree: deltas.filter((d) => d <= 3).length,
    correlation: sxy / Math.sqrt(sxx * syy),
  };
}

/** "152-53" → 152…153, "120-22" → 120…122, "98-100", "6-10", "202". */
export function parsePrinted(printed: string): Distance | null {
  const m = /^(\d+)(?:-(\d+))?$/.exec(printed.trim());
  if (!m) return null;
  const a = Number(m[1]);
  if (!m[2]) return { min: a, max: a };
  const tail = m[2].length < m[1].length ? m[1].slice(0, m[1].length - m[2].length) + m[2] : m[2];
  const b = Number(tail);
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

export interface Discrepancy {
  letter: string;
  prime: boolean;
  ref: string;
  printed: string;
  computed: Distance;
}

/**
 * Members whose printed number disagrees with KJV counting. A single printed
 * number counts as agreeing when it falls inside a multi-verse passage.
 */
export function discrepancies(levels: readonly Level[] = LEVELS): Discrepancy[] {
  const out: Discrepancy[] = [];
  for (const level of levels) {
    for (const member of [level.first, level.second]) {
      if (member.printedDistance === null) continue;
      const printed = parsePrinted(member.printedDistance);
      const computed = distanceFromCenter(member);
      const agrees =
        printed !== null &&
        ((printed.min === computed.min && printed.max === computed.max) ||
          (printed.min === printed.max && printed.min >= computed.min && printed.min <= computed.max));
      if (!agrees) {
        out.push({ letter: member.letter, prime: member.prime, ref: member.ref, printed: member.printedDistance, computed });
      }
    }
  }
  return out;
}

/**
 * The level a verse belongs to: the level with a passage containing it, or
 * failing that the level whose passage is nearest (ties go outward).
 */
export function levelForVerse(chapter: number, verse: number): Level {
  const ordinal = verseOrdinal("REV", chapter, verse);
  let best: Level = CENTER_LEVEL;
  let bestGap = Infinity;
  for (const level of LEVELS) {
    for (const member of [level.first, level.second]) {
      const { first, last } = memberSpan(member);
      const gap = ordinal < first ? first - ordinal : ordinal > last ? ordinal - last : 0;
      if (gap < bestGap) {
        best = level;
        bestGap = gap;
      }
    }
  }
  return best;
}
