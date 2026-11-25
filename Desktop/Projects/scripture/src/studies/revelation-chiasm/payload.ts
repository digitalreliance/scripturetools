import "server-only";
import { readBook } from "@/lib/bible/server";
import { CHART_NOTES, CHART_SOURCE, LEVELS, SECTIONS, type Member } from "./data/chiasm";
import { chiasmStats, discrepancies, distanceFromCenter, memberSpan, pairSymmetry } from "./data/compute";
import type { MemberView, MirrorPayload, MirrorVerse } from "./types";

const view = (member: Member): MemberView => ({
  ...member,
  span: memberSpan(member),
  distance: distanceFromCenter(member),
});

/** Built during prerendering; Revelation's text plus the computed structure (~90 KB). */
export function buildMirrorPayload(): MirrorPayload {
  const book = readBook("REV");
  const verses: MirrorVerse[] = [];
  const chapterStarts: number[] = [];
  for (const chapter of book.chapters) {
    chapterStarts.push(verses.length + 1);
    for (const verse of chapter.verses) {
      verses.push({ o: verses.length + 1, c: chapter.n, v: verse.n, t: verse.t, ...(verse.p ? { p: 1 as const } : {}) });
    }
  }

  return {
    levels: LEVELS.map((level) => ({
      ...level,
      first: view(level.first),
      second: view(level.second),
      symmetry: pairSymmetry(level),
    })),
    sections: [...SECTIONS],
    verses,
    chapterStarts,
    stats: chiasmStats(),
    discrepancies: discrepancies(),
    notes: [...CHART_NOTES],
    source: { ...CHART_SOURCE },
  };
}
