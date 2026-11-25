import type { ReactNode } from "react";
import { LEVEL_COLORS } from "@/studies/revelation-chiasm/colors";
import { B, css, FS, T, timing, Txt, r2, type Ctx } from "./kit";

/**
 * The Revelation chart's seven-colour cycle, outermost level first: red,
 * orange, gold, green, light blue, dark blue, purple. Each holds at least
 * 3:1 against the chart's white canvas. The centre is set in ink.
 */
export const CHIASM_CYCLE = LEVEL_COLORS;

/** Lengths of the passage lines, outer to inner, as on the chart. */
const OUTER_LINES = [104, 96, 112, 90, 118, 100, 86, 108, 120, 94, 110, 100];
const INNER_LINES = [98, 104, 92, 110, 100, 114, 92, 98, 112, 102, 96, 106];

/**
 * Revelation's mirror (after the chart in docs): nested brackets, one level
 * per paired passage, folding inward to the centre at 12:9–10. Hover draws
 * the pairs from the outermost to the centre.
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

  const parts: ReactNode[] = [];
  for (let i = 0; i < levels; i++) {
    const color = CHIASM_CYCLE[i % CHIASM_CYCLE.length];
    const x = r2(x0 + i * dx);
    const yTop = y(i);
    const yBottom = y(rows - 1 - i);
    const yMid = r2((yTop + yBottom) / 2);
    const delay = i * step;
    const textX = r2(x + tick + (thumb ? 0 : 7.5));

    parts.push(
      <g key={i} stroke={color} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Each bracket closes from both ends toward the centre. */}
        <path
          d={`M${r2(x + tick)} ${yTop}H${x}V${yMid}`}
          strokeWidth={thumb ? w.fine : w.base}
          pathLength={1}
          className={css.draw}
          style={timing(delay, 440)}
        />
        <path
          d={`M${r2(x + tick)} ${yBottom}H${x}V${yMid}`}
          strokeWidth={thumb ? w.fine : w.base}
          pathLength={1}
          className={css.draw}
          style={timing(delay, 440)}
        />
        {thumb ? null : (
          <>
            <Txt x={r2(x + tick + 1.2)} y={r2(yTop + 1.9)} size={5.2} fill={color} stroke="none">
              {String.fromCharCode(65 + i)}
            </Txt>
            <Txt x={r2(x + tick + 1.2)} y={r2(yBottom + 1.9)} size={5.2} fill={color} stroke="none">
              {String.fromCharCode(65 + i)}′
            </Txt>
            <path
              d={`M${textX} ${yTop}h${OUTER_LINES[i]}`}
              strokeWidth={1.7}
              className={css.growX}
              style={timing(delay + 120, 420)}
            />
            <path
              d={`M${textX} ${yBottom}h${INNER_LINES[i]}`}
              strokeWidth={1.7}
              className={css.growX}
              style={timing(delay + 120, 420)}
            />
          </>
        )}
      </g>,
    );
  }

  // The centre: two rows in ink, heavier than everything else.
  const cxStart = r2(x0 + levels * dx + (thumb ? 2 : 4));
  const centreRows = [y(levels), y(levels + 1)];
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
            <Txt x={cxStart} y={r2(centreRows[0] + 2)} size={5.2} fill={p.ink} stroke="none" fontWeight={700}>
              12:9
            </Txt>
            <Txt x={cxStart} y={r2(centreRows[1] + 2)} size={5.2} fill={p.ink} stroke="none" fontWeight={700}>
              12:10
            </Txt>
            <path
              d={`M${r2(cxStart + 17)} ${centreRows[0]}h150`}
              strokeWidth={2.3}
              className={css.growX}
              style={timing(centreDelay, 460)}
            />
            <path
              d={`M${r2(cxStart + 17)} ${centreRows[1]}h${r2(296 - cxStart - 17)}`}
              strokeWidth={2.3}
              className={css.growX}
              style={timing(centreDelay + 60, 460)}
            />
          </>
        )}
      </g>
      {thumb ? null : (
        <Txt x={296} y={r2(B)} size={FS.small} textAnchor="end" fill={p.muted}>
          Revelation 1–22
        </Txt>
      )}
    </g>
  );
}
