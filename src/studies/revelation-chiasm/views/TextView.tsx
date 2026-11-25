import { Fragment, useEffect, useMemo, useRef } from "react";
import { ArrowDownUp } from "lucide-react";
import { VerseText } from "@/components/bible/VerseText";
import { cn } from "@/lib/cn";
import { levelColor } from "../colors";
import { displayLetter } from "../data/chiasm";
import { revRef, scrollBehavior } from "../format";
import type { LevelView, MirrorVerse } from "../types";

interface Membership {
  level: LevelView;
  prime: boolean;
  /** True on the passage's first verse, where its letter is shown. */
  starts: boolean;
}

/**
 * The whole of Revelation in the KJV, set like a printed page. Every chiasm
 * passage is marked with its letter; the selected pair is tinted in its colour.
 */
export function TextView({
  verses,
  chapterStarts,
  levels,
  active,
  selected,
  focusHalf,
  onSelect,
  onFocusHalf,
}: {
  verses: MirrorVerse[];
  chapterStarts: number[];
  levels: LevelView[];
  active: string | null;
  selected: string | null;
  focusHalf: "first" | "second";
  onSelect: (letter: string) => void;
  onFocusHalf: (half: "first" | "second") => void;
}) {
  const memberships = useMemo(() => {
    const map = new Map<number, Membership[]>();
    for (const level of levels) {
      for (const member of [level.first, level.second]) {
        for (let o = member.span.first; o <= member.span.last; o++) {
          const list = map.get(o) ?? [];
          list.push({ level, prime: member.prime, starts: o === member.span.first });
          map.set(o, list);
        }
      }
    }
    return map;
  }, [levels]);

  const chapters = useMemo(
    () =>
      chapterStarts.map((start, i) => {
        const end = i + 1 < chapterStarts.length ? chapterStarts[i + 1] - 1 : verses.length;
        const chapterVerses = verses.slice(start - 1, end);
        const paragraphs: MirrorVerse[][] = [];
        for (const verse of chapterVerses) {
          if (verse.p || paragraphs.length === 0) paragraphs.push([verse]);
          else paragraphs[paragraphs.length - 1].push(verse);
        }
        return { n: i + 1, paragraphs };
      }),
    [chapterStarts, verses],
  );

  const scroller = useRef<HTMLDivElement>(null);
  const selectedLevel = levels.find((l) => l.letter === selected);

  useEffect(() => {
    if (!selectedLevel) return;
    const member = focusHalf === "second" ? selectedLevel.second : selectedLevel.first;
    const target = scroller.current?.querySelector<HTMLElement>(`[data-o="${member.span.first}"]`);
    target?.scrollIntoView({ block: "center", behavior: scrollBehavior() });
  }, [selectedLevel, focusHalf]);

  function choose(list: Membership[]) {
    // Clicking a verse shared by several passages cycles through them, innermost first.
    const ordered = [...list].sort((a, b) => b.level.level - a.level.level);
    const current = ordered.findIndex((m) => m.level.letter === selected);
    const next = ordered[(current + 1) % ordered.length];
    onSelect(next.level.letter);
    onFocusHalf(next.prime ? "second" : "first");
  }

  return (
    <div className="relative h-full">
      <div ref={scroller} className="scroll-thin h-full overflow-y-auto bg-s-canvas">
        <article className="mx-auto max-w-[68ch] px-10 py-14 font-scripture text-[18px] leading-[1.8] text-s-ink">
          <header className="mb-10 border-b border-s-line pb-6 font-sans">
            <h2 className="text-[28px] leading-tight font-semibold tracking-[-0.015em] [font-stretch:112%]">The Revelation of St. John the Divine</h2>
            <p className="mt-2 text-ui text-s-muted">
              King James Version, 1769 text. Marked passages belong to the mirror; select one to see its pair.
            </p>
          </header>
          {chapters.map((chapter) => (
            <section key={chapter.n} aria-label={`Chapter ${chapter.n}`} className="mb-8">
              {chapter.paragraphs.map((paragraph, pi) => (
                <p key={pi} className="mb-3 [text-wrap:pretty]">
                  {pi === 0 ? (
                    <span aria-hidden className="float-left mt-[0.18em] mr-3 font-scripture text-[3.1em] leading-[0.8] font-bold text-s-ink">
                      {chapter.n}
                    </span>
                  ) : null}
                  {paragraph.map((verse) => {
                    const list = memberships.get(verse.o);
                    const activeHere = list?.find((m) => m.level.letter === active);
                    const tint = activeHere ? levelColor(activeHere.level.colorIndex) : null;
                    const starters = list?.filter((m) => m.starts) ?? [];
                    return (
                      <Fragment key={verse.o}>
                        {starters.map((m) => (
                          <button
                            key={`${m.level.letter}${m.prime ? 1 : 0}`}
                            type="button"
                            onClick={() => {
                              onSelect(m.level.letter);
                              onFocusHalf(m.prime ? "second" : "first");
                            }}
                            className="mr-1 inline-flex -translate-y-[0.12em] items-center rounded-[4px] border px-1 align-middle font-sans text-[11px] leading-[16px] font-semibold tabular"
                            style={{ color: levelColor(m.level.colorIndex), borderColor: `color-mix(in oklab, ${levelColor(m.level.colorIndex)} 45%, transparent)` }}
                            aria-label={`Passage ${displayLetter({ letter: m.level.letter, prime: m.prime })}: ${m.level.theme}`}
                          >
                            {displayLetter({ letter: m.level.letter, prime: m.prime })}
                          </button>
                        ))}
                        <span
                          data-o={verse.o}
                          onClick={list ? () => choose(list) : undefined}
                          className={cn(list && "cursor-pointer", "rounded-[3px] transition-[background-color] duration-150 [box-decoration-break:clone]")}
                          style={
                            tint
                              ? { backgroundColor: `color-mix(in oklab, ${tint} 15%, transparent)` }
                              : list
                                ? { textDecorationLine: "underline", textDecorationStyle: "dotted", textDecorationColor: `color-mix(in oklab, ${levelColor(list[list.length - 1].level.colorIndex)} 55%, transparent)`, textUnderlineOffset: "5px" }
                                : undefined
                          }
                        >
                          {verse.v > 1 ? (
                            <sup className="mr-1 font-sans text-[0.6em] text-s-muted tabular select-none">{verse.v}</sup>
                          ) : null}
                          <VerseText text={verse.t} />{" "}
                        </span>
                      </Fragment>
                    );
                  })}
                </p>
              ))}
            </section>
          ))}
        </article>
      </div>

      {selectedLevel ? (
        <button
          type="button"
          onClick={() => onFocusHalf(focusHalf === "first" ? "second" : "first")}
          className="absolute right-6 bottom-6 inline-flex h-9 items-center gap-2 rounded-control border border-s-line bg-s-raised px-3 text-ui font-medium text-s-ink shadow-float"
        >
          <ArrowDownUp aria-hidden className="size-4" />
          {focusHalf === "first"
            ? `Go to its mirror, ${revRef(selectedLevel.second.ref)}`
            : `Back to ${revRef(selectedLevel.first.ref)}`}
        </button>
      ) : null}
    </div>
  );
}
