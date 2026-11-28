import { cn } from "@/lib/cn";
import { useCoarsePointer } from "@/lib/hooks/use-coarse-pointer";
import { canHover } from "@/lib/pointer";
import { levelColor } from "../colors";
import { displayLetter } from "../data/chiasm";
import { formatNumber, revRef } from "../format";
import styles from "../mirror.module.css";
import type { LevelView, MirrorPayload } from "../types";

const SIZE = 440;
const M = { left: 64, top: 24, right: 24, bottom: 56 };
const MAX = 210;
const TICKS = [0, 50, 100, 150, 200];

/**
 * Verses before the centre against verses after it, one point per level.
 * A perfect mirror would put every point on the diagonal.
 */
export function SymmetryView({
  levels,
  stats,
  active,
  onHover,
  onSelect,
}: {
  levels: LevelView[];
  stats: MirrorPayload["stats"];
  active: string | null;
  onHover: (letter: string | null) => void;
  onSelect: (letter: string) => void;
}) {
  const coarse = useCoarsePointer();
  const sx = (v: number) => M.left + (v / MAX) * SIZE;
  const sy = (v: number) => M.top + SIZE - (v / MAX) * SIZE;
  const W = M.left + SIZE + M.right;
  const H = M.top + SIZE + M.bottom;
  const activeLevel = levels.find((l) => l.letter === active);
  const maxLevel = levels.find((l) => l.letter === stats.maxLetter);

  return (
    <div className={cn("@container h-full overflow-auto overscroll-contain", styles.paper)} onPointerLeave={(e) => canHover(e) && onHover(null)}>
      <div className="flex min-h-full flex-col items-center justify-center gap-6 px-10 py-8 @3xl:flex-row @3xl:gap-12">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="aspect-[528/520] w-full max-w-[520px] shrink-0 select-none @3xl:h-[min(620px,calc(100dvh-170px))] @3xl:w-auto @3xl:max-w-none"
        role="img"
        aria-label={`Scatter plot of the 51 levels: verses before the centre against verses after it. Correlation ${stats.correlation.toFixed(4)}; the two halves differ by ${formatNumber(stats.meanAbsDelta)} verses on average.`}
      >
        {/* Grid */}
        {TICKS.map((v) => (
          <g key={v}>
            <line x1={sx(v)} y1={sy(0)} x2={sx(v)} y2={sy(MAX)} stroke="var(--s-line)" strokeWidth={1} />
            <line x1={sx(0)} y1={sy(v)} x2={sx(MAX)} y2={sy(v)} stroke="var(--s-line)" strokeWidth={1} />
            <text x={sx(v)} y={sy(0) + 20} textAnchor="middle" className="fill-s-muted text-[11px] tabular">{v}</text>
            <text x={sx(0) - 10} y={sy(v) + 4} textAnchor="end" className="fill-s-muted text-[11px] tabular">{v}</text>
          </g>
        ))}
        {/* The line of a perfect mirror */}
        <line x1={sx(0)} y1={sy(0)} x2={sx(MAX)} y2={sy(MAX)} stroke="var(--s-ink)" strokeWidth={1} strokeDasharray="4 5" opacity={0.55} />
        <text x={sx(178)} y={sy(194)} className="fill-s-muted text-[11px]" transform={`rotate(-45 ${sx(178)} ${sy(194)})`}>
          perfect mirror
        </text>

        <text x={M.left + SIZE / 2} y={H - 12} textAnchor="middle" className="fill-s-ink text-[12px] font-medium">
          Verses before the centre
        </text>
        <text x={16} y={M.top + SIZE / 2} textAnchor="middle" className="fill-s-ink text-[12px] font-medium" transform={`rotate(-90 16 ${M.top + SIZE / 2})`}>
          Verses after the centre
        </text>

        {levels.map((level) => {
          const { before, after } = level.symmetry;
          const isActive = active === level.letter;
          const dim = active !== null && !isActive;
          return (
            <g key={level.letter} className="cursor-pointer" onPointerEnter={(e) => canHover(e) && onHover(level.letter)} onClick={() => onSelect(level.letter)}>
              {/* A larger, invisible target around each point, larger still under a finger. */}
              <circle cx={sx(before)} cy={sy(after)} r={coarse ? 15 : 9} fill="transparent" />
              <circle
                cx={sx(before)}
                cy={sy(after)}
                r={isActive ? 7.5 : 5}
                fill={levelColor(level.colorIndex)}
                stroke="var(--s-canvas)"
                strokeWidth={1.5}
                opacity={dim ? 0.25 : 1}
                pointerEvents="none"
                className={styles.fade}
              />
            </g>
          );
        })}

        {activeLevel ? (
          <g pointerEvents="none">
            <rect
              x={Math.min(sx(activeLevel.symmetry.before) + 12, W - 196)}
              y={Math.max(sy(activeLevel.symmetry.after) - 44, 4)}
              width={184}
              height={40}
              rx={6}
              fill="var(--s-ink)"
            />
            <text x={Math.min(sx(activeLevel.symmetry.before) + 24, W - 184)} y={Math.max(sy(activeLevel.symmetry.after) - 28, 20)} className="fill-s-canvas text-[12px] font-semibold">
              {displayLetter(activeLevel.first)} {revRef(activeLevel.first.ref)} and {revRef(activeLevel.second.ref)}
            </text>
            <text x={Math.min(sx(activeLevel.symmetry.before) + 24, W - 184)} y={Math.max(sy(activeLevel.symmetry.after) - 13, 35)} className="fill-s-canvas text-[11px] tabular">
              {formatNumber(activeLevel.symmetry.before)} before, {formatNumber(activeLevel.symmetry.after)} after
            </text>
          </g>
        ) : null}
      </svg>

      <dl className="grid w-full max-w-[520px] shrink-0 grid-cols-4 gap-5 text-ui @3xl:w-56 @3xl:grid-cols-1">
        <div>
          <dt className="text-s-muted">Correlation</dt>
          <dd className="mt-1 text-[28px] leading-none font-semibold tracking-[-0.02em] tabular [font-stretch:112%]">
            {stats.correlation.toFixed(4)}
          </dd>
        </div>
        <div>
          <dt className="text-s-muted">Average difference</dt>
          <dd className="mt-1 text-[15px] tabular">{formatNumber(stats.meanAbsDelta)} verses</dd>
        </div>
        <div>
          <dt className="text-s-muted">Largest difference</dt>
          <dd className="mt-1 text-[15px] tabular">
            {formatNumber(stats.maxAbsDelta)} verses, level {stats.maxLetter}
            {maxLevel ? (
              <span className="block text-s-muted">
                {revRef(maxLevel.first.ref)} and {revRef(maxLevel.second.ref)}
              </span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-s-muted">Within three verses</dt>
          <dd className="mt-1 text-[15px] tabular">
            {stats.withinThree} of {stats.levels} levels
          </dd>
        </div>
        <p className="col-span-4 text-[12px] leading-relaxed text-s-muted @3xl:col-span-1">
          Each point is one level: how far its first passage sits before the centre, against how far its mirror sits after it.
        </p>
      </dl>
      </div>
    </div>
  );
}
