import type { ChartNote, Level, Member, Section } from "./data/chiasm";
import type { ChiasmStats, Discrepancy, Distance, PairSymmetry, Span } from "./data/compute";

/** Everything the client needs, computed once at build time. */
export interface MirrorVerse {
  /** Ordinal within Revelation, 1…404. */
  o: number;
  c: number;
  v: number;
  /** KJV text with <i>/<j>/<n> markup. */
  t: string;
  p?: 1;
}

export interface MemberView extends Member {
  span: Span;
  distance: Distance;
}

export interface LevelView extends Omit<Level, "first" | "second"> {
  first: MemberView;
  second: MemberView;
  symmetry: PairSymmetry;
}

export interface MirrorPayload {
  levels: LevelView[];
  sections: Section[];
  verses: MirrorVerse[];
  /** Ordinal of the first verse of each chapter (index 0 = chapter 1). */
  chapterStarts: number[];
  stats: ChiasmStats;
  discrepancies: Discrepancy[];
  notes: ChartNote[];
  source: { title: string; author: string | null; url: string | null; note: string };
}

export type MirrorView = "chart" | "arcs" | "symmetry" | "text";
