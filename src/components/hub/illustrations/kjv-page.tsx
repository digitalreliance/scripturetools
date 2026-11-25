import type { ReactNode } from "react";
import { Callout, css, FS, L, Leader, R, timing, Txt, r2, type Ctx } from "./kit";

/*
 * Genesis 3:9 as a type specimen: "¶ And the LORD God called unto Adam, and
 * said unto him, Where art thou?" Advance widths are Libre Baskerville's, in
 * ems, measured in the browser; they place the callouts on the right glyphs.
 */
const EM = {
  /** "¶ And the " */
  beforeLord: 5.267,
  /** "L" */
  l: 0.727,
  /** "ORD" at full size; it is set at SMALL_CAPS of the body size. */
  ord: 2.605,
  /** " God called" */
  afterLord: 5.761,
  /** "¶" */
  pilcrow: 0.631,
  /** "him, Where " */
  beforeArt: 6.444,
  /** "art" in italic */
  art: 1.395,
} as const;
/** Small capitals: a little taller than the x-height (0.53 em). */
const SMALL_CAPS = 0.72;
const CAP = 0.77;
const X_HEIGHT = 0.53;

const NOTES = [
  "Pilcrow: a new paragraph begins",
  "Small capitals: the divine name, Jehovah",
  "Italic: a word the translators supplied",
] as const;

/** LORD with true-to-print small capitals. */
function Lord({ size }: { size: number }) {
  return (
    <>
      L<tspan fontSize={r2(size * SMALL_CAPS)} letterSpacing={r2(size * 0.02)}>ORD</tspan>
    </>
  );
}

/**
 * The devices of the King James page, set large and annotated like a type
 * specimen: the pilcrow, LORD in small capitals and an italic supplied word.
 * Hover draws the callouts one by one.
 */
export function kjvPage(ctx: Ctx): ReactNode {
  return ctx.thumb ? thumbSpecimen(ctx) : plateSpecimen(ctx);
}

function plateSpecimen(ctx: Ctx): ReactNode {
  const { p, w } = ctx;
  const S = 17;
  const y1 = 56;
  const lead = 25;
  const y2 = y1 + lead;
  const y3 = y2 + lead;
  const line1End = L + (EM.beforeLord + EM.l + EM.ord * SMALL_CAPS + EM.afterLord) * S;

  // Where the three devices sit.
  const pilcrowX = r2(L + (EM.pilcrow * S) / 2);
  const ordX = r2(L + (EM.beforeLord + EM.l) * S + (EM.ord * SMALL_CAPS * S) / 2);
  const artX = r2(L + EM.beforeArt * S + (EM.art * S) / 2);
  const bubbleY = r2(y1 - CAP * S - 11);
  const artBubbleY = r2(y3 + 16);

  // Each guide's label sits above (cap height) or just below its line.
  const guides: readonly (readonly [number, string, number])[] = [
    [y1 - CAP * S, "Cap height", -1.6],
    [y1 - X_HEIGHT * S, "x-height", 5.4],
    [y1, "Baseline", 5.4],
  ];

  const callouts = [
    { n: 1, x: pilcrowX, y: bubbleY, to: r2(y1 - CAP * S - 2.4) },
    { n: 2, x: ordX, y: bubbleY, to: r2(y1 - CAP * SMALL_CAPS * S - 2.4) },
    { n: 3, x: artX, y: artBubbleY, to: r2(y3 + 3.2) },
  ];
  const step = 260;

  return (
    <g>
      {/* Type guides along the first line. */}
      {guides.map(([y, label, dy], i) => (
        <g key={label}>
          <path
            d={`M${L} ${r2(y)}H${r2(line1End + 4)}`}
            stroke={p.line}
            strokeWidth={w.hair}
            className={css.growX}
            style={timing(i * 60, 520)}
          />
          <Txt x={R} y={r2(y + dy)} size={FS.small} textAnchor="end" fill={p.muted}>
            {label}
          </Txt>
        </g>
      ))}

      <Txt face="serif" x={L} y={y1} size={S} fill={p.ink}>
        ¶ And the <Lord size={S} /> God called
      </Txt>
      <Txt face="serif" x={L} y={y2} size={S} fill={p.ink}>
        unto Adam, and said unto
      </Txt>
      <Txt face="serif" x={L} y={y3} size={S} fill={p.ink}>
        him, Where <tspan fontStyle="italic">art</tspan> thou?
      </Txt>
      <Txt x={R} y={y3} textAnchor="end" fill={p.muted}>
        Genesis 3:9
      </Txt>

      {callouts.map((c, i) => (
        <g key={c.n}>
          <Leader
            ctx={ctx}
            points={[
              [c.x, r2(c.y + (c.y < c.to ? 4.6 : -4.6))],
              [c.x, c.to],
            ]}
            className={css.draw}
            style={timing(300 + i * step, 260)}
          />
          <Callout ctx={ctx} x={c.x} y={c.y} n={c.n} className={css.pop} style={timing(300 + i * step + 160, 280)} />
        </g>
      ))}

      {/* The key, as on an assembly drawing. */}
      <path d={`M${L} 136H${R}`} stroke={p.line} strokeWidth={w.hair} />
      {NOTES.map((note, i) => (
        <g key={note} className={css.fade} style={timing(300 + i * step + 220, 260)}>
          <Callout ctx={ctx} x={L + 4.6} y={r2(146 + i * 12)} n={i + 1} r={4} />
          <Txt x={L + 13} y={r2(148.3 + i * 12)} fill={p.ink}>
            {note}
          </Txt>
        </g>
      ))}
    </g>
  );
}

function thumbSpecimen(ctx: Ctx): ReactNode {
  const { p, w } = ctx;
  const big = 116;
  const S = 54;
  const base = 144;
  const top = 86;
  const x = 114;
  return (
    <g>
      <path
        d={`M${L} ${base}H${R}M${x} ${top}H${R}`}
        stroke={p.line}
        strokeWidth={w.hair}
        className={css.growX}
        style={timing(0, 480)}
      />
      <Txt face="serif" x={L - 2} y={base} size={big} fill={p.ink} className={css.fade} style={timing(0, 300)}>
        ¶
      </Txt>
      <Txt face="serif" x={x} y={top} size={S} fill={p.ink} className={css.fade} style={timing(160, 300)}>
        <Lord size={S} />
      </Txt>
      <Txt face="serif" x={x} y={base} size={S} fontStyle="italic" fill={p.ink} className={css.fade} style={timing(320, 300)}>
        art
      </Txt>
    </g>
  );
}
