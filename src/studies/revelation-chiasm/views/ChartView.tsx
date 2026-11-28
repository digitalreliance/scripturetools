import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { useCoarsePointer } from "@/lib/hooks/use-coarse-pointer";
import { canHover } from "@/lib/pointer";
import { levelColor } from "../colors";
import { displayLetter } from "../data/chiasm";
import { formatDistance } from "../data/compute";
import styles from "../mirror.module.css";
import { revRef, scrollBehavior } from "../format";
import type { LevelView, MemberView } from "../types";

/** Row height: 28 px under a mouse, 36 px under a finger. */
const ROW_H = { fine: 28, coarse: 36 };
/** Horizontal spacing of the bracket staircase: generous when there's room, tighter on narrow canvases. */
const MAX_STEP = 5.5;
const MIN_STEP = 3.4;
const PAD = 28;
const TICK = 12;

interface Row {
  level: LevelView;
  member: MemberView;
  index: number;
}

/**
 * The printed chart, made interactive: 102 rows from A down to the centre and
 * back out to A¹, each level's bracket drawn in its colour and indented by
 * depth like the staircase on the page.
 */
export function ChartView({
  levels,
  active,
  selected,
  drawIn,
  onHover,
  onSelect,
}: {
  levels: LevelView[];
  active: string | null;
  selected: string | null;
  drawIn: boolean;
  onHover: (letter: string | null) => void;
  onSelect: (letter: string) => void;
}) {
  const rows = useMemo<Row[]>(() => {
    const down = levels.map((level) => ({ level, member: level.first }));
    const up = [...levels].reverse().map((level) => ({ level, member: level.second }));
    return [...down, ...up].map((row, index) => ({ ...row, index }));
  }, [levels]);

  const coarse = useCoarsePointer();
  const rowH = coarse ? ROW_H.coarse : ROW_H.fine;
  const [width, setWidth] = useState(900);
  const step = Math.max(MIN_STEP, Math.min(MAX_STEP, (Math.min(width, 920) - 560) / (levels.length - 1)));
  const gutter = PAD + (levels.length - 1) * step + TICK;
  const height = rows.length * rowH + PAD * 2;
  const rowY = (i: number) => PAD + i * rowH + rowH / 2;
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (next > 0) setWidth(next);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const row = scroller.current?.querySelector<HTMLElement>(`[data-row="${selected}"]`);
    row?.scrollIntoView({ block: "center", behavior: scrollBehavior() });
  }, [selected]);

  return (
    <div
      ref={scroller}
      className={cn("scroll-thin h-full overflow-y-auto overscroll-contain select-none", styles.paper, drawIn && styles.drawIn)}
      onPointerLeave={(e) => canHover(e) && onHover(null)}
    >
      <div className="relative mx-auto max-w-[920px]" style={{ height }}>
        <svg
          width={gutter}
          height={height}
          className="absolute top-0 left-0"
          role="img"
          aria-label="Brackets joining each of the 51 passages in the first half of Revelation to its mirror in the second half"
        >
          {levels.map((level, i) => {
            const x = PAD + i * step;
            const y1 = rowY(i);
            const y2 = rowY(rows.length - 1 - i);
            const d = `M${gutter - 4} ${y1}H${x}V${y2}H${gutter - 4}`;
            const isActive = active === level.letter;
            const dim = active !== null && !isActive;
            const color = levelColor(level.colorIndex);
            return (
              <g key={level.letter} className={styles.fade} style={{ opacity: dim ? 0.16 : 1 }}>
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={coarse ? 14 : 8}
                  pointerEvents="stroke"
                  onPointerEnter={(e) => canHover(e) && onHover(level.letter)}
                  onClick={() => onSelect(level.letter)}
                  className="cursor-pointer"
                />
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={isActive ? 2.4 : level.isCenter ? 2 : 1.25}
                  strokeLinejoin="round"
                  pathLength={1}
                  pointerEvents="none"
                  className={styles.bracket}
                  style={{ "--d": `${i * 26}ms` } as CSSProperties}
                />
              </g>
            );
          })}
        </svg>

        <ol className="absolute top-0 right-2" style={{ left: gutter, paddingTop: PAD }}>
          {rows.map(({ level, member, index }) => {
            const isActive = active === level.letter;
            const dim = active !== null && !isActive;
            const color = levelColor(level.colorIndex);
            const isSelected = selected === level.letter;
            const depth = member.prime ? rows.length - 1 - index : index;
            return (
              <li key={`${member.letter}${member.prime ? "1" : ""}`} style={{ height: rowH }}>
                <button
                  type="button"
                  data-row={member.prime ? undefined : level.letter}
                  tabIndex={-1}
                  onPointerEnter={(e) => canHover(e) && onHover(level.letter)}
                  onFocus={() => onHover(level.letter)}
                  onClick={() => onSelect(level.letter)}
                  aria-pressed={isSelected}
                  className={cn(
                    styles.row,
                    styles.fade,
                    "group flex h-full w-full items-center gap-3 rounded-[6px] pr-3 pl-2 text-left",
                    isSelected ? "bg-s-raised shadow-[0_0_0_1px_var(--s-line)]" : "hover:bg-s-raised/70 active:bg-s-raised/70",
                  )}
                  style={{ opacity: dim ? 0.35 : 1, "--d": `${depth * 26 + 120}ms` } as CSSProperties}
                >
                  <span
                    className={cn("w-9 shrink-0 text-ui tabular", level.isCenter ? "font-bold" : "font-semibold")}
                    style={{ color }}
                  >
                    {displayLetter(member)}
                  </span>
                  <span className="w-[84px] shrink-0 text-ui tabular" style={{ color }}>
                    {revRef(member.ref)}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate font-scripture text-[14.5px] leading-none",
                      level.isCenter && "font-bold",
                    )}
                  >
                    {member.label}
                  </span>
                  <span className="shrink-0 text-[12px] text-s-muted tabular">
                    {level.isCenter ? "centre" : formatDistance(member.distance)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
