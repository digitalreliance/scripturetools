import type { ReactNode } from "react";
import { LEVEL_COLORS } from "@/studies/revelation-chiasm/colors";
import { B, css, EASE_IN_OUT, FS, H, LINEAR, T, timing, Txt, W, r2, type Ctx } from "./kit";

/**
 * The Revelation chart's seven-colour cycle, outermost level first: red,
 * orange, gold, green, light blue, dark blue, purple. Each holds at least
 * 3:1 against the chart's white canvas. The centre is set in ink.
 */
export const CHIASM_CYCLE = LEVEL_COLORS;

/** Lengths of the passage lines, outer to inner, as on the chart. */
const OUTER_LINES = [104, 96, 112, 90, 118, 100, 86, 108, 120, 94, 110, 100];
const INNER_LINES = [98, 104, 92, 110, 100, 114, 92, 98, 112, 102, 96, 106];

/** The plate's walk to the centre: a beat after drawing, then one pair per step. */
const WALK_BEAT = 400;
const WALK_STEP = 220;
const CENTRE_HOLD = 800;

/** Weight of a passage line, and of one lit by the walk. */
const LINE = 1.7;
const LIT_LINE = 2.5;

/**
 * Revelation's mirror (after the chart in docs): nested brackets, one level
 * per paired passage, folding inward to the centre at 12:9–10. The brackets
 * draw from the outermost pair to the centre. On the plate the chart then
 * dims and lights one pair at a time down to the centre, as the study's
 * "Walk to the centre" does (about 5.5 s in all).
 */
export function chiasm(ctx: Ctx): ReactNode {
  const { p, w, thumb } = ctx;
  const levels = thumb ? 7 : 12;
  const rows = levels * 2 + 2;
  const pitch = (B - T) / (rows - 1);
  const x0 = thumb ? 44 : 40;
  const dx = thumb ? 17 : 6.5;
  const tick = thumb ? 13 : 3.2;
  const y = (row: number) => r2(T + row * pitch);
  const step = thumb ? 120 : 82;
  const centreDelay = levels * step + 80;

  /** Where level i sits: its colour, bracket halves, letters and passage lines. */
  const level = (i: number) => {
    const x = r2(x0 + i * dx);
    const yTop = y(i);
    const yBottom = y(rows - 1 - i);
    const yMid = r2((yTop + yBottom) / 2);
    const lineX = r2(x + tick + (thumb ? 0 : 7.5));
    return {
      color: CHIASM_CYCLE[i % CHIASM_CYCLE.length],
      yTop,
      yBottom,
      letterX: r2(x + tick + 1.2),
      top: `M${r2(x + tick)} ${yTop}H${x}V${yMid}`,
      bottom: `M${r2(x + tick)} ${yBottom}H${x}V${yMid}`,
      outer: `M${lineX} ${yTop}h${OUTER_LINES[i]}`,
      inner: `M${lineX} ${yBottom}h${INNER_LINES[i]}`,
    };
  };

  const letters = (i: number, yTop: number, yBottom: number, x: number, color: string, weight?: number) => (
    <>
      <Txt x={x} y={r2(yTop + 1.9)} size={5.2} fill={color} stroke="none" fontWeight={weight}>
        {String.fromCharCode(65 + i)}
      </Txt>
      <Txt x={x} y={r2(yBottom + 1.9)} size={5.2} fill={color} stroke="none" fontWeight={weight}>
        {String.fromCharCode(65 + i)}′
      </Txt>
    </>
  );

  const parts: ReactNode[] = [];
  for (let i = 0; i < levels; i++) {
    const { color, yTop, yBottom, letterX, top, bottom, outer, inner } = level(i);
    const delay = i * step;
    parts.push(
      <g key={i} stroke={color} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Each bracket closes from both ends toward the centre. */}
        <path d={top} strokeWidth={thumb ? w.fine : w.base} pathLength={1} className={css.draw} style={timing(delay, 440)} />
        <path d={bottom} strokeWidth={thumb ? w.fine : w.base} pathLength={1} className={css.draw} style={timing(delay, 440)} />
        {thumb ? null : (
          <>
            {letters(i, yTop, yBottom, letterX, color)}
            <path d={outer} strokeWidth={LINE} className={css.growX} style={timing(delay + 120, 420)} />
            <path d={inner} strokeWidth={LINE} className={css.growX} style={timing(delay + 120, 420)} />
          </>
        )}
      </g>,
    );
  }

  // The centre: two rows in ink, heavier than everything else.
  const cxStart = r2(x0 + levels * dx + (thumb ? 2 : 4));
  const centreRows = [y(levels), y(levels + 1)];
  const centreLines = [
    `M${r2(cxStart + 17)} ${centreRows[0]}h150`,
    `M${r2(cxStart + 17)} ${centreRows[1]}h${r2(296 - cxStart - 17)}`,
  ];
  const centreLabels = (weight: number) => (
    <>
      <Txt x={cxStart} y={r2(centreRows[0] + 2)} size={5.2} fill={p.ink} stroke="none" fontWeight={weight}>
        12:9
      </Txt>
      <Txt x={cxStart} y={r2(centreRows[1] + 2)} size={5.2} fill={p.ink} stroke="none" fontWeight={weight}>
        12:10
      </Txt>
    </>
  );

  // The walk (plate only): everything dims, then each pair lights in turn,
  // outermost first, ending on the centre.
  const walkStart = centreDelay + 520 + WALK_BEAT;
  const centreLit = walkStart + levels * WALK_STEP;
  const walkEnd = centreLit + CENTRE_HOLD;
  const walk = thumb ? null : (
    <g>
      <g opacity={0.84}>
        <rect
          width={W}
          height={H}
          fill={p.canvas}
          className={css.veil}
          style={timing(walkStart - 240, walkEnd - walkStart + 300, EASE_IN_OUT)}
        />
      </g>
      {Array.from({ length: levels }, (_, i) => {
        const { color, yTop, yBottom, letterX, top, bottom, outer, inner } = level(i);
        return (
          <g
            key={i}
            stroke={color}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={css.veil}
            style={timing(walkStart + i * WALK_STEP, WALK_STEP + 40, LINEAR)}
          >
            <path d={top + bottom} strokeWidth={w.bold} />
            {letters(i, yTop, yBottom, letterX, color, 700)}
            <path d={outer + inner} strokeWidth={LIT_LINE} />
          </g>
        );
      })}
      <g stroke={p.ink} strokeLinecap="round" fill="none" className={css.veil} style={timing(centreLit, CENTRE_HOLD + 60, LINEAR)}>
        {centreLabels(800)}
        <path d={centreLines.join("")} strokeWidth={3} />
      </g>
    </g>
  );

  return (
    <g>
      {parts}
      <g stroke={p.ink} strokeLinecap="round" fill="none">
        {thumb ? (
          <path
            d={`M${cxStart} ${r2((centreRows[0] + centreRows[1]) / 2)}h${r2(296 - cxStart - 20)}`}
            strokeWidth={w.bold}
            className={css.growX}
            style={timing(centreDelay, 420)}
          />
        ) : (
          <>
            {centreLabels(700)}
            <path d={centreLines[0]} strokeWidth={2.3} className={css.growX} style={timing(centreDelay, 460)} />
            <path d={centreLines[1]} strokeWidth={2.3} className={css.growX} style={timing(centreDelay + 60, 460)} />
          </>
        )}
      </g>
      {thumb ? null : (
        <Txt x={296} y={r2(B)} size={FS.small} textAnchor="end" fill={p.muted}>
          Revelation 1–22
        </Txt>
      )}
      {walk}
    </g>
  );
}
