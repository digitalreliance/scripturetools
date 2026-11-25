import type { ReactNode } from "react";
import { B, css, FS, L, R, T, timing, Txt, r2, type Ctx } from "./kit";

/**
 * Verses each Gospel gives to each day (Matthew, Mark, Luke, John), counted in
 * the installed KJV from a common harmony: Sunday Matthew 21:1–17, Mark
 * 11:1–11, Luke 19:28–44, John 12:12–19; Monday Mt 21:18–22, Mk 11:12–19, Lk
 * 19:45–48; Tuesday Mt 21:23–26:5, Mk 11:20–13:37, Lk 20:1–21:38, Jn
 * 12:20–50; Wednesday Mt 26:6–16, Mk 14:1–11, Lk 22:1–6; Thursday Mt
 * 26:17–75, Mk 14:12–72, Lk 22:7–65, Jn 13:1–18:27; Friday Mt 27:1–61, Mk 15,
 * Lk 22:66–23:55, Jn 18:28–19:42; the sabbath Mt 27:62–66, Lk 23:56; the
 * first day of the week Mt 28, Mk 16, Lk 24, Jn 20.
 */
const DAYS = [
  { day: "Sun", event: "Entry", verses: [17, 11, 17, 8] },
  { day: "Mon", event: "Temple", verses: [5, 8, 4, 0] },
  { day: "Tue", event: "Teaching", verses: [211, 95, 85, 31] },
  { day: "Wed", event: "Plot", verses: [11, 11, 6, 0] },
  { day: "Thu", event: "Supper", verses: [59, 61, 59, 182] },
  { day: "Fri", event: "Cross", verses: [61, 47, 61, 55] },
  { day: "Sat", event: "Sabbath", verses: [5, 0, 1, 0] },
  { day: "Sun", event: "Risen", verses: [20, 20, 53, 31] },
] as const;

const TOTALS = DAYS.map((d) => d.verses.reduce((a: number, b: number) => a + b, 0));

/** The two longest passages, named so the order within each group reads. */
const NOTES: readonly { day: number; gospel: number; name: string }[] = [
  { day: 2, gospel: 0, name: "Matthew" },
  { day: 4, gospel: 3, name: "John" },
];

/**
 * The last week as eight day columns, from the entry into Jerusalem to the
 * first day of the week, each with the verses Matthew, Mark, Luke and John
 * give it (the thumb shows each day's total). The eighth day's head is lit.
 * Hover raises the days in order.
 */
export function passionDays(ctx: Ctx): ReactNode {
  const { p, w, thumb } = ctx;
  const n = DAYS.length;
  const cw = (R - L) / n;
  const headH = thumb ? 16 : 24;
  const baseY = thumb ? B : 170;
  const topY = T + headH + (thumb ? 8 : 16);
  const most = thumb ? Math.max(...TOTALS) : Math.max(...DAYS.flatMap((d) => d.verses));
  const k = (baseY - topY) / most;
  const step = thumb ? 130 : 115;
  const bw = 4.2;
  const pitch = 5.6;
  const groupW = pitch * 3 + bw;
  const lit = n - 1;

  const barTop = (i: number, g: number) => baseY - Math.max(0.8, DAYS[i].verses[g] * k);
  const barX = (i: number, g: number) => L + (i + 0.5) * cw - groupW / 2 + g * pitch;

  return (
    <g>
      {/* Alternate day columns are shaded, like a calendar strip. */}
      {DAYS.map((_, i) =>
        i % 2 === 1 ? (
          <rect
            key={i}
            x={r2(L + i * cw)}
            y={T}
            width={r2(cw)}
            height={r2(baseY - T)}
            fill={thumb ? p.raised : p.chrome}
          />
        ) : null,
      )}
      {thumb ? (
        // A tab for each day; the first day of the week is lit.
        DAYS.map((_, i) => (
          <rect
            key={i}
            x={r2(L + i * cw + 3)}
            y={T}
            width={r2(cw - 6)}
            height={headH}
            rx={2}
            fill={i === lit ? p.accent : p.line}
          />
        ))
      ) : (
        <rect x={r2(L + lit * cw)} y={T} width={r2(cw)} height={headH} fill={p.accent} />
      )}
      <path d={`M${L} ${baseY}H${R}`} stroke={p.muted} strokeWidth={thumb ? w.fine : w.hair} fill="none" />

      {DAYS.map(({ day, event, verses }, i) => {
        const cx = r2(L + (i + 0.5) * cw);
        const delay = i * step;
        if (thumb) {
          const h = Math.max(3, TOTALS[i] * k);
          return (
            <rect
              key={i}
              x={r2(cx - 10)}
              y={r2(baseY - h)}
              width={20}
              height={r2(h)}
              rx={1.5}
              fill={p.accent}
              className={css.growY}
              style={timing(delay, 460)}
            />
          );
        }
        const top = Math.min(...verses.map((_, g) => barTop(i, g)));
        const headInk = i === lit ? p.onAccent : p.ink;
        return (
          <g key={i}>
            {verses.map((count, g) =>
              count === 0 ? null : (
                <rect
                  key={g}
                  x={r2(barX(i, g))}
                  y={r2(barTop(i, g))}
                  width={bw}
                  height={r2(baseY - barTop(i, g))}
                  rx={0.6}
                  fill={p.accent}
                  className={css.growY}
                  style={timing(delay + g * 35, 460)}
                />
              ),
            )}
            <Txt x={cx} y={T + 10} textAnchor="middle" fill={headInk}>
              {day}
            </Txt>
            <Txt x={cx} y={T + 18.5} textAnchor="middle" fill={i === lit ? p.onAccent : p.muted} size={FS.small}>
              {event}
            </Txt>
            <Txt
              x={cx}
              y={r2(top - 3)}
              textAnchor="middle"
              fill={p.muted}
              size={FS.small}
              className={css.fade}
              style={timing(delay + 300, 240)}
            >
              {TOTALS[i]}
            </Txt>
          </g>
        );
      })}

      {thumb
        ? null
        : NOTES.map(({ day, gospel, name }) => {
            const right = gospel === 0;
            const x = right ? barX(day, gospel) + bw + 2 : barX(day, gospel) - 2;
            return (
              <Txt
                key={name}
                x={r2(x)}
                y={r2(barTop(day, gospel) + 9)}
                textAnchor={right ? "start" : "end"}
                fill={p.ink}
                size={FS.small}
                className={css.fade}
                style={timing(day * step + 360, 240)}
              >
                {name}
              </Txt>
            );
          })}
    </g>
  );
}
