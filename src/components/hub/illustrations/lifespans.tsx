import type { ReactNode } from "react";
import { css, FS, timing, Txt, r2, type Ctx } from "./kit";

/** Genesis 5: each life starts at his father's age when he was born. */
const LIVES = [
  { name: "Adam", born: 0, age: 930 },
  { name: "Seth", born: 130, age: 912 },
  { name: "Enos", born: 235, age: 905 },
  { name: "Cainan", born: 325, age: 910 },
  { name: "Mahalaleel", born: 395, age: 895 },
  { name: "Jared", born: 460, age: 962 },
  { name: "Enoch", born: 622, age: 365 },
  { name: "Methuselah", born: 687, age: 969 },
  { name: "Lamech", born: 874, age: 777 },
  { name: "Noah", born: 1056, age: 950 },
] as const;

/** Year of the Flood: Noah was 600 (Genesis 7:6). */
const FLOOD = 1656;
const SPAN = 2100;

/**
 * The long lives of Genesis 5 drawn to scale on one year axis, with the
 * Flood marked. Hover grows each life in turn.
 */
export function lifespans(ctx: Ctx): ReactNode {
  const { p, w, thumb } = ctx;
  const x0 = thumb ? 24 : 80;
  const x1 = thumb ? 296 : 290;
  const x = (year: number) => r2(x0 + (year / SPAN) * (x1 - x0));
  const top = thumb ? 30 : 32;
  const pitch = thumb ? 15.6 : 12;
  const barH = thumb ? 9 : 5;
  const rowY = (i: number) => r2(top + i * pitch);
  const axisY = thumb ? 0 : r2(rowY(LIVES.length - 1) + 12);
  const step = thumb ? 90 : 75;

  return (
    <g>
      {thumb ? null : (
        <g>
          {/* Century grid and the year axis. */}
          <path
            d={[0, 500, 1000, 1500, 2000].map((yr) => `M${x(yr)} ${top - 8}V${axisY}`).join("")}
            stroke={p.line}
            strokeWidth={w.hair}
          />
          <path d={`M${x0} ${axisY}H${x1}`} stroke={p.muted} strokeWidth={w.hair} />
          {[0, 500, 1000, 1500, 2000].map((yr) => (
            <g key={yr}>
              <path d={`M${x(yr)} ${axisY}v3`} stroke={p.muted} strokeWidth={w.fine} />
              <Txt x={x(yr)} y={axisY + 10} textAnchor="middle" fill={p.muted} size={FS.small}>
                {yr}
              </Txt>
            </g>
          ))}
          <Txt x={x0 - 6} y={axisY + 10} textAnchor="end" fill={p.muted} size={FS.small}>
            Year of the world
          </Txt>
        </g>
      )}

      {LIVES.map((life, i) => {
        const y = rowY(i);
        const start = x(life.born);
        const end = x(life.born + life.age);
        return (
          <g key={life.name}>
            {/* The link from the father's line to the son's birth. */}
            {i > 0 && !thumb ? (
              <path
                d={`M${start} ${r2(rowY(i - 1) + barH / 2)}V${r2(y - barH / 2)}`}
                stroke={p.muted}
                strokeWidth={w.hair}
                pathLength={1}
                className={css.draw}
                style={timing(i * step - 40, 200)}
              />
            ) : null}
            <rect
              x={start}
              y={r2(y - barH / 2)}
              width={r2(end - start)}
              height={barH}
              rx={thumb ? 1.5 : 1}
              fill={p.accent}
              className={css.growX}
              style={timing(i * step, 620)}
            />
            {thumb ? null : (
              <>
                <Txt x={x0 - 6} y={r2(y + 2.2)} textAnchor="end" fill={p.ink}>
                  {life.name}
                </Txt>
                <Txt
                  x={r2(end + 3)}
                  y={r2(y + 2)}
                  fill={p.muted}
                  size={FS.small}
                  className={css.fade}
                  style={timing(i * step + 420, 240)}
                >
                  {life.age}
                </Txt>
              </>
            )}
          </g>
        );
      })}

      {/* The Flood: Methuselah dies the year it comes. */}
      <g className={css.fade} style={timing(LIVES.length * step + 280, 360)}>
        <path
          d={`M${x(FLOOD)} ${thumb ? 18 : top - 10}V${thumb ? 182 : axisY}`}
          stroke={p.ink}
          strokeWidth={thumb ? w.fine : w.fine}
          strokeDasharray={thumb ? "10 7" : "2.4 2"}
        />
        {thumb ? null : (
          <Txt x={r2(x(FLOOD) + 3.5)} y={top - 4} fill={p.ink}>
            Flood{" "}
            <tspan fill={p.muted} fontSize={FS.small}>
              {FLOOD}
            </tspan>
          </Txt>
        )}
      </g>
    </g>
  );
}
