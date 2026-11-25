import type { ReactNode } from "react";
import { css, DimH, FS, LINEAR, timing, Txt, r2, type Ctx } from "./kit";

/*
 * Generations are counted along Luke 3:23–38, Adam 0 to Jesus 75. Matthew 1
 * runs with Luke from Abraham (20) to David (33), parts from it through
 * Solomon (Luke goes through Nathan), meets it again at Salathiel (54) and
 * Zorobabel (55), parts once more and rejoins it at Joseph (74).
 */
const DAVID = 33;
const SALATHIEL = 54;
const ZOROBABEL = 55;
const JOSEPH = 74;
const JESUS = 75;

/** Matthew's names between the meeting points: 14 from David, 10 from Zorobabel. */
const MATTHEW_RUNS = [
  { from: DAVID, to: SALATHIEL, names: 14 },
  { from: ZOROBABEL, to: JOSEPH, names: 9 },
] as const;

/** Brothers not in the line, hung from their father: [generation, above, below]. */
const SIBLINGS: readonly (readonly [number, number, number])[] = [
  [0, 1, 1], // Cain, Abel
  [9, 1, 1], // Ham, Japheth
  [20, 0, 1], // Ishmael
  [21, 1, 0], // Esau
  [22, 6, 5], // Jacob's other eleven sons
];

/** Named on the plate: generation, label, placement. */
const NAMES: readonly { g: number; name: string; side: "above" | "below"; anchor: "start" | "middle" | "end" }[] = [
  { g: 0, name: "Adam", side: "below", anchor: "start" },
  { g: 9, name: "Noah", side: "above", anchor: "middle" },
  { g: 20, name: "Abraham", side: "above", anchor: "end" },
  { g: DAVID, name: "David", side: "above", anchor: "end" },
  { g: 54.5, name: "Zorobabel", side: "above", anchor: "middle" },
  { g: JOSEPH, name: "Joseph", side: "above", anchor: "end" },
  { g: JESUS, name: "Jesus", side: "below", anchor: "end" },
];

/**
 * From Adam to Christ: the line of Luke 3 on a scale of generations, Matthew
 * 1's line braided through it from David, brothers hung from their fathers,
 * and Matthew 1:17's three fourteens. Hover draws the line from Adam on.
 */
export function familyTree(ctx: Ctx): ReactNode {
  const { p, w, thumb } = ctx;
  const x0 = thumb ? 30 : 32;
  const x1 = thumb ? 284 : 286;
  const dx = (x1 - x0) / JESUS;
  const x = (g: number) => r2(x0 + g * dx);
  const y = thumb ? 104 : 90;
  const off = thumb ? 16 : 8;
  const run = thumb ? 1300 : 1450;
  const at = (g: number) => (g / JESUS) * run;
  const half = dx / 2;

  // Luke's route carries the shared spine; Matthew's only where it differs.
  const luke =
    `M${x(0)} ${y}H${x(DAVID + 0.5)}V${y + off}H${x(SALATHIEL - 0.5)}V${y}` +
    `H${x(ZOROBABEL + 0.5)}V${y + off}H${x(JOSEPH - 0.5)}V${y}H${x(JESUS)}`;
  const matthew =
    `M${x(DAVID + 0.5)} ${y}V${y - off}H${x(SALATHIEL - 0.5)}V${y}` +
    `M${x(ZOROBABEL + 0.5)} ${y}V${y - off}H${x(JOSEPH - 0.5)}V${y}`;

  const lineW = thumb ? w.base : w.fine;
  const dotR = thumb ? 0 : 1.05;

  // Dots for every generation on each route.
  const dots: ReactNode[] = [];
  if (!thumb) {
    for (let g = 1; g < JESUS; g++) {
      const onBraid = (g > DAVID && g < SALATHIEL) || (g > ZOROBABEL && g < JOSEPH);
      dots.push(
        <circle
          key={`l${g}`}
          cx={x(g)}
          cy={onBraid ? y + off : y}
          r={dotR}
          fill={p.accent}
          className={css.pop}
          style={timing(at(g), 220)}
        />,
      );
    }
    for (const { from, to, names } of MATTHEW_RUNS) {
      for (let i = 1; i <= names; i++) {
        const g = from + ((to - from) * i) / (names + 1);
        dots.push(
          <circle
            key={`m${from}-${i}`}
            cx={x(g)}
            cy={y - off}
            r={dotR}
            fill={p.accent}
            className={css.pop}
            style={timing(at(g), 220)}
          />,
        );
      }
    }
  }

  // Brothers: a bar beside the father, a short stub to each son.
  const sibPitch = thumb ? 9 : 3.6;
  const sibFirst = thumb ? 14 : 7;
  const siblings = SIBLINGS.map(([g, above, below]) => {
    const bx = x(g + 0.5);
    const cx = x(g + 1);
    const ys = [
      ...Array.from({ length: above }, (_, i) => y - sibFirst - i * sibPitch),
      ...Array.from({ length: below }, (_, i) => y + sibFirst + i * sibPitch),
    ];
    if (thumb && ys.length < 3) return null;
    const top = Math.min(y, ...ys);
    const bottom = Math.max(y, ...ys);
    return (
      <g key={g} className={css.fade} style={timing(at(g) + 60, 300)}>
        <path
          d={`M${bx} ${r2(top)}V${r2(bottom)}${ys.map((sy) => `M${bx} ${r2(sy)}H${cx}`).join("")}`}
          stroke={p.muted}
          strokeWidth={thumb ? w.fine : w.hair}
          fill="none"
        />
        {thumb
          ? null
          : ys.map((sy) => (
              <circle key={sy} cx={cx} cy={r2(sy)} r={0.95} fill={p.canvas} stroke={p.muted} strokeWidth={w.hair} />
            ))}
      </g>
    );
  });

  const babylon = DAVID + ((SALATHIEL - DAVID) * 14) / 15 + 0.5;
  const dimY = y - 32;
  const axisY = y + 46;

  return (
    <g>
      {thumb ? null : (
        <g>
          {/* Matthew 1:17: three fourteens. */}
          {[
            [20, DAVID],
            [DAVID, babylon],
            [babylon, JESUS],
          ].map(([a, b], i) => (
            <DimH
              key={i}
              ctx={ctx}
              x1={x(a)}
              x2={x(b)}
              y={dimY}
              label="14 generations"
              className={css.fade}
              style={timing(run + i * 120, 300)}
            />
          ))}
          <Txt x={x(babylon)} y={r2(dimY + 8.5)} textAnchor="middle" fill={p.muted} size={FS.small}>
            Babylon
          </Txt>

          {/* Generations from Adam. */}
          <path d={`M${x(0)} ${axisY}H${x(JESUS)}`} stroke={p.muted} strokeWidth={w.hair} />
          {Array.from({ length: 16 }, (_, i) => i * 5).map((g) => (
            <path key={g} d={`M${x(g)} ${axisY}v${g % 10 === 0 ? 3 : 1.8}`} stroke={p.muted} strokeWidth={w.fine} />
          ))}
          {[0, 10, 20, 30, 40, 50, 60, 70].map((g) => (
            <Txt key={g} x={x(g)} y={axisY + 10} textAnchor="middle" fill={p.muted} size={FS.small}>
              {g}
            </Txt>
          ))}
          <Txt x={x(JESUS)} y={axisY + 10} textAnchor="end" fill={p.muted} size={FS.small}>
            Generations
          </Txt>
        </g>
      )}

      {siblings}

      <path
        d={luke}
        stroke={p.accent}
        strokeWidth={lineW}
        fill="none"
        strokeLinejoin="round"
        pathLength={1}
        className={css.draw}
        style={timing(0, run, LINEAR)}
      />
      <path
        d={matthew}
        stroke={p.accent}
        strokeWidth={lineW}
        fill="none"
        strokeLinejoin="round"
        pathLength={1}
        className={css.draw}
        style={timing(at(DAVID), at(JOSEPH) - at(DAVID), LINEAR)}
      />
      {dots}

      {/* Adam and the fathers named; Jesus in gold. */}
      {(thumb ? [0, 20, DAVID] : [0, 9, 20, DAVID, SALATHIEL, ZOROBABEL, JOSEPH]).map((g) => (
        <circle
          key={g}
          cx={x(g)}
          cy={y}
          r={thumb ? 6.5 : 2}
          fill={p.canvas}
          stroke={p.accent}
          strokeWidth={thumb ? w.fine : w.fine}
          className={css.pop}
          style={timing(at(g), 260)}
        />
      ))}
      <g className={css.pop} style={timing(run, 320)}>
        <circle cx={x(JESUS)} cy={y} r={thumb ? 11 : 3.4} fill={p.accent} />
      </g>

      {thumb
        ? null
        : NAMES.map(({ g, name, side, anchor }) => (
            <Txt
              key={name}
              x={anchor === "end" ? r2(x(g) + 1.5) : anchor === "start" ? r2(x(g) - 1.5) : x(g)}
              y={side === "above" ? r2(y - (g > DAVID && g < JESUS ? off + 5 : 6)) : r2(y + 12.5)}
              textAnchor={anchor}
              fill={p.ink}
              size={FS.small}
            >
              {name}
            </Txt>
          ))}
      {thumb ? null : (
        <>
          <Txt x={x(43.5)} y={r2(y - off - 4)} textAnchor="middle" fill={p.muted} size={FS.small}>
            Matthew 1
          </Txt>
          <Txt x={x(43.5)} y={r2(y + off + 9)} textAnchor="middle" fill={p.muted} size={FS.small}>
            Luke 3
          </Txt>
        </>
      )}
      {/* Half a generation either side keeps bars clear of the dots. */}
      {half > 0 ? null : null}
    </g>
  );
}
