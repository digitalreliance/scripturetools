import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useCoarsePointer } from "@/lib/hooks/use-coarse-pointer";
import { canHover } from "@/lib/pointer";
import { levelColor } from "../colors";
import { CENTER } from "../data/compute";
import { prefersReducedMotion } from "../format";
import styles from "../mirror.module.css";
import type { LevelView } from "../types";

const W = 1000;
const H = 600;
const LEFT = 40;
const RIGHT = 940;
/** Flat: one axis with arcs above it. */
const AXIS = 430;
/** Folded: the first half on top, the second half running backwards beneath it. */
const TOP = 150;
const BOTTOM = 450;
const FOLD_MS = 950;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * The book laid out as its 404 verses. Each level is an arc joining a passage
 * to its mirror. Folding turns the second half back under the first at the
 * centre: the two halves become parallel lines and every pair a near-vertical
 * connector, which is the mirror made literal.
 */
export function ArcsView({
  levels,
  chapterStarts,
  total,
  active,
  folded,
  onHover,
  onSelect,
}: {
  levels: LevelView[];
  chapterStarts: number[];
  total: number;
  active: string | null;
  folded: boolean;
  onHover: (letter: string | null) => void;
  onSelect: (letter: string) => void;
}) {
  const coarse = useCoarsePointer();
  // Fold progress: 0 flat, 1 folded.
  const [t, setT] = useState(folded ? 1 : 0);
  const tRef = useRef(t);
  useEffect(() => {
    const target = folded ? 1 : 0;
    const from = tRef.current;
    const duration = prefersReducedMotion() ? 0 : FOLD_MS;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const next = lerp(from, target, ease(p));
      tRef.current = next;
      setT(next);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [folded]);

  const e = t;
  const half = CENTER.before; // 203 verses before the centre, 201 after
  const mirror = CENTER.before + CENTER.after; // ordinal o' sits across the crease from 407 − o'
  const flatX = (o: number) => LEFT + ((o - 0.5) / total) * (RIGHT - LEFT);
  const foldX = (o: number) => LEFT + ((o - 0.5) / half) * (RIGHT - LEFT);

  /** Position of a verse ordinal (fractional allowed) at the current fold. */
  const at = (o: number): { x: number; y: number } =>
    o <= half + 0.5
      ? { x: lerp(flatX(o), foldX(o), e), y: lerp(AXIS, TOP, e) }
      : { x: lerp(flatX(o), foldX(mirror - o), e), y: lerp(AXIS, BOTTOM, e) };

  const crease = { x: lerp(flatX(half + 0.5), foldX(half + 0.5), e) };

  const chapters = chapterStarts.map((start, i) => ({
    n: i + 1,
    start,
    end: i + 1 < chapterStarts.length ? chapterStarts[i + 1] - 1 : total,
  }));

  const activeLevel = levels.find((l) => l.letter === active);
  const mid = (span: { first: number; last: number }) => (span.first + span.last) / 2;

  return (
    <div className={cn("flex h-full flex-col select-none", styles.paper)} onPointerLeave={(e) => canHover(e) && onHover(null)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="min-h-0 w-full flex-1"
        role="img"
        aria-label={
          folded
            ? "Revelation folded at its centre: the first half runs left to right on top, the second half runs backwards beneath it, and each of the 51 pairs is joined across the fold."
            : `Revelation's ${total} verses on a line, with an arc joining each of the 51 paired passages.`
        }
      >
        {levels.map((level) => {
          const p1 = at(mid(level.first.span));
          const p2 = at(mid(level.second.span));
          // Flat: a tall arch above the axis. Folded: a straight connector.
          const archX = (p1.x + p2.x) / 2;
          const archY = AXIS - Math.abs(p2.x - p1.x) * 0.9;
          const cx = lerp(archX, (p1.x + p2.x) / 2, e);
          const cy = lerp(archY, (p1.y + p2.y) / 2, e);
          const d = `M${p1.x.toFixed(1)} ${p1.y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
          const isActive = active === level.letter;
          const dim = active !== null && !isActive;
          return (
            <g key={level.letter} className={styles.fade} style={{ opacity: dim ? 0.14 : 1 }}>
              <path d={d} fill="none" stroke="transparent" strokeWidth={coarse ? 22 : 9} pointerEvents="stroke" className="cursor-pointer" onPointerEnter={(e) => canHover(e) && onHover(level.letter)} onClick={() => onSelect(level.letter)} />
              <path d={d} fill="none" stroke={levelColor(level.colorIndex)} strokeWidth={isActive ? 2.6 : level.isCenter ? 2 : 1.3} strokeOpacity={isActive ? 1 : 0.85} pointerEvents="none" />
            </g>
          );
        })}

        {/* The two halves of the axis */}
        {(() => {
          const a = at(0.5);
          const b = at(half + 0.5);
          const c = at(half + 0.5001);
          const d = at(total + 0.5);
          return (
            <g stroke="var(--s-ink)" strokeWidth={1.25}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
              <line x1={c.x} y1={c.y} x2={d.x} y2={d.y} />
            </g>
          );
        })()}

        {/* The fold itself, once the halves separate */}
        {e > 0.02 ? (
          <path
            d={`M${crease.x} ${lerp(AXIS, TOP, e)}C${crease.x + 46 * e} ${lerp(AXIS, TOP, e)} ${crease.x + 46 * e} ${lerp(AXIS, BOTTOM, e)} ${crease.x} ${lerp(AXIS, BOTTOM, e)}`}
            fill="none"
            stroke="var(--s-muted)"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        ) : null}

        {/* Passage spans on the axis */}
        {levels.map((level) =>
          [level.first, level.second].map((member) => {
            const p1 = at(member.prime ? member.span.first - 0.45 : member.span.first - 0.45);
            const p2 = at(member.span.last + 0.45);
            const isActive = active === level.letter;
            return (
              <line
                key={`${member.letter}${member.prime ? 1 : 0}`}
                x1={p1.x}
                y1={p1.y + (member.prime && e > 0.5 ? -4 : 4)}
                x2={p2.x}
                y2={p2.y + (member.prime && e > 0.5 ? -4 : 4)}
                stroke={levelColor(level.colorIndex)}
                strokeWidth={isActive ? 5 : 3}
                opacity={active !== null && !isActive ? 0.25 : 0.9}
              />
            );
          }),
        )}

        {/* Chapter ticks and numbers; chapter 12 straddles the centre */}
        {chapters.map((ch) => {
          const parts: { from: number; to: number; prime: boolean }[] = [];
          if (ch.start <= half) parts.push({ from: ch.start, to: Math.min(ch.end, half), prime: false });
          if (ch.end >= CENTER.after) parts.push({ from: Math.max(ch.start, CENTER.after), to: ch.end, prime: true });
          return parts.map((part) => {
            const tick = at(part.prime ? part.from - 0.4999 : part.from - 0.5);
            const label = at((part.from + part.to) / 2);
            const showTick = !(part.prime && part.from === CENTER.after);
            // Labels sit outside the pair of axes when folded, so they never cross the connectors.
            const labelDy = part.prime ? 26 : lerp(26, -16, e);
            return (
              <g key={`${ch.n}-${part.prime ? 2 : 1}`}>
                {showTick ? <line x1={tick.x} y1={tick.y - 5} x2={tick.x} y2={tick.y + 9} stroke="var(--s-muted)" strokeWidth={1} /> : null}
                <text x={label.x} y={label.y + labelDy} textAnchor="middle" className="fill-s-muted text-[11px] tabular">
                  {ch.n}
                </text>
              </g>
            );
          });
        })}

        {/* Centre marker: a dashed line when flat, a label at the fold when folded */}
        <line x1={crease.x} y1={26} x2={crease.x} y2={AXIS + 10} stroke="var(--s-ink)" strokeWidth={1} strokeDasharray="2 5" opacity={0.45 * (1 - e)} />
        <text
          x={lerp(crease.x, RIGHT + 30, e)}
          y={lerp(AXIS + 50, TOP - 34, e)}
          textAnchor={e > 0.5 ? "end" : "middle"}
          className="fill-s-ink text-[11px] font-semibold"
        >
          12:9 | 12:10
        </text>
        {e > 0.5 ? (
          <g className="fill-s-muted text-[11px]">
            <text x={LEFT} y={TOP - 34}>First half, 1:1 to 12:9</text>
            <text x={LEFT} y={BOTTOM + 52}>Second half, read backwards from 22:21 to 12:10</text>
          </g>
        ) : null}

        {/* The active pair's letter at the top of its arch */}
        {activeLevel && e < 0.5 ? (() => {
          const p1 = at(mid(activeLevel.first.span));
          const p2 = at(mid(activeLevel.second.span));
          return (
            <text
              x={(p1.x + p2.x) / 2}
              y={AXIS - Math.abs(p2.x - p1.x) * 0.45 - 10}
              textAnchor="middle"
              className="text-[13px] font-semibold"
              style={{ fill: levelColor(activeLevel.colorIndex) }}
            >
              {activeLevel.letter}
            </text>
          );
        })() : null}
      </svg>
      <p className="px-6 pb-4 text-[12px] leading-relaxed text-s-muted">
        {folded ? (
          "Folded at the centre. Each passage now sits across the fold from its mirror; the more upright a line, the closer the match."
        ) : (
          <>
            Each arc joins a passage to its mirror. Chapters run left to right; the centre falls between 12:9 and 12:10.{" "}
            <span className="pointer-coarse:hidden">Press F to fold.</span>
            <span className="hidden pointer-coarse:inline">Tap Fold, above, to fold it.</span>
          </>
        )}
      </p>
    </div>
  );
}
