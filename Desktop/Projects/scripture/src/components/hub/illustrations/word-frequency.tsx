import type { ReactNode } from "react";
import { B, css, FS, L, R, T, timing, Txt, r2, type Ctx } from "./kit";

/**
 * Occurrences of the word "love" in each of the 66 books, in canon order,
 * counted in the installed KJV text (whole word, any case): 311 in all,
 * 131 in the Old Testament and 180 in the New.
 */
const LOVE = [
  3, 2, 2, 0, 16, 2, 2, 0, 1, 4, 1, 0, 0, 1, 0, 1, 0, 0, 23, 16, 3, 26, 5, 4, 0, 4, 2, 7, 0, 1, 0, 0,
  2, 0, 0, 1, 0, 2, 0, 11, 6, 12, 22, 0, 12, 5, 11, 4, 14, 4, 4, 6, 2, 3, 3, 4, 3, 3, 3, 6, 0, 33, 4,
  1, 2, 2,
] as const;
const OT = 39;
const MAX = 33;

/** Peaks named under the axis (plate): book index and short name. */
const PEAKS: readonly (readonly [number, string, "start" | "middle" | "end"])[] = [
  [18, "Psalms", "end"],
  [21, "Song", "start"],
  [42, "John", "middle"],
  [61, "1 John", "middle"],
];

const sum = (a: readonly number[]) => a.reduce((s, n) => s + n, 0);

/**
 * One word counted across the 66 books: a bar per book along the canon,
 * Old Testament in grey, New in ink. Hover grows the bars from Genesis
 * to Revelation.
 */
export function wordFrequency(ctx: Ctx): ReactNode {
  const { p, w, thumb } = ctx;
  const x0 = thumb ? L : L + 12;
  const x1 = R;
  const split = thumb ? 6 : 5;
  const pitch = (x1 - x0 - split) / LOVE.length;
  const barW = r2(pitch * (thumb ? 0.8 : 0.7));
  const base = thumb ? B : 140;
  const height = thumb ? 104 : 92;
  const unit = height / MAX;
  const xAt = (i: number) => x0 + i * pitch + (i >= OT ? split : 0);
  const step = thumb ? 14 : 12;

  const bars = LOVE.map((n, i) => {
    if (n === 0) return null;
    const h = r2(n * unit);
    return (
      <rect
        key={i}
        x={r2(xAt(i) + (pitch - barW) / 2)}
        y={r2(base - h)}
        width={barW}
        height={h}
        fill={i < OT ? p.muted : p.ink}
        fillOpacity={i < OT ? 0.55 : 1}
        className={css.growY}
        style={timing(i * step, 420)}
      />
    );
  });

  const otMid = r2((xAt(0) + xAt(OT - 1) + pitch) / 2);
  const ntMid = r2((xAt(OT) + xAt(LOVE.length - 1) + pitch) / 2);

  return (
    <g>
      {thumb ? null : (
        <g>
          {/* Gridlines every ten occurrences. */}
          <path
            d={[10, 20, 30].map((v) => `M${x0} ${r2(base - v * unit)}H${x1}`).join("")}
            stroke={p.line}
            strokeWidth={w.hair}
          />
          {[10, 20, 30].map((v) => (
            <Txt key={v} x={x0 - 3} y={r2(base - v * unit + 2)} size={FS.small} textAnchor="end" fill={p.muted}>
              {v}
            </Txt>
          ))}
          <Txt face="serif" x={L} y={T + 7} size={15} fontStyle="italic" fill={p.ink}>
            love
          </Txt>
          <Txt x={L + 31} y={T + 7} fill={p.muted}>
            {sum(LOVE)} times in 66 books
          </Txt>
        </g>
      )}

      {thumb ? (
        <Txt face="serif" x={L - 2} y={T + 25} size={38} fontStyle="italic" fill={p.ink}>
          love
        </Txt>
      ) : null}

      {bars}

      {/* Axis, with the testaments split at Malachi and Matthew. */}
      <path
        d={`M${x0} ${base}H${r2(xAt(OT) - split)}M${r2(xAt(OT))} ${base}H${x1}`}
        stroke={p.ink}
        strokeWidth={thumb ? w.hair : w.fine}
      />
      {thumb ? null : (
        <g>
          {PEAKS.map(([i, name, anchor]) => {
            const cx = r2(xAt(i) + pitch / 2);
            const lx = anchor === "end" ? cx + 1.2 : anchor === "start" ? cx - 1.2 : cx;
            return (
              <g key={name} className={css.fade} style={timing(i * step + 380, 240)}>
                <Txt x={cx} y={r2(base - LOVE[i] * unit - 2.6)} size={FS.small} textAnchor="middle" fill={p.ink}>
                  {LOVE[i]}
                </Txt>
                <path d={`M${cx} ${base + 1.5}v3`} stroke={p.ink} strokeWidth={w.hair} />
                <Txt x={r2(lx)} y={base + 11} size={FS.small} textAnchor={anchor} fill={p.ink}>
                  {name}
                </Txt>
              </g>
            );
          })}
          <path
            d={`M${x0} ${base + 17}H${r2(xAt(OT) - split)}M${r2(xAt(OT))} ${base + 17}H${x1}`}
            stroke={p.line}
            strokeWidth={w.hair}
          />
          <Txt x={otMid} y={base + 27} textAnchor="middle" fill={p.muted}>
            Old Testament{" "}
            <tspan fill={p.ink}>{sum(LOVE.slice(0, OT))}</tspan>
          </Txt>
          <Txt x={ntMid} y={base + 27} textAnchor="middle" fill={p.muted}>
            New Testament{" "}
            <tspan fill={p.ink}>{sum(LOVE.slice(OT))}</tspan>
          </Txt>
        </g>
      )}
    </g>
  );
}
