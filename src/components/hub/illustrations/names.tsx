import type { ReactNode } from "react";
import { css, FS, L, R, T, timing, Txt, r2, type Ctx } from "./kit";

/*
 * Names with the meanings the King James translators gave in their margins
 * ("Abraham: that is, Father of a great multitude"), set like a lexicon.
 * Name and meaning widths are Libre Baskerville advances in ems (bold and
 * italic), measured in the browser, so the leaders meet each word.
 */
const ENTRIES: readonly {
  name: string;
  meaning: string;
  ref: string;
  nameEm: number;
  meaningEm: number;
}[] = [
  { name: "Benjamin", meaning: "The son of the right hand", ref: "Genesis 35:18", nameEm: 5.208, meaningEm: 11.512 },
  { name: "Israel", meaning: "A prince of God", ref: "Genesis 32:28", nameEm: 2.907, meaningEm: 7.204 },
  { name: "Jacob", meaning: "A supplanter", ref: "Genesis 27:36", nameEm: 2.852, meaningEm: 5.919 },
  { name: "Mara", meaning: "Bitter", ref: "Ruth 1:20", nameEm: 2.791, meaningEm: 2.703 },
  { name: "Moses", meaning: "Drawn out", ref: "Exodus 2:10", nameEm: 3.299, meaningEm: 5.047 },
  { name: "Naomi", meaning: "Pleasant", ref: "Ruth 1:20", nameEm: 3.607, meaningEm: 3.943 },
  { name: "Samuel", meaning: "Asked of God", ref: "1 Samuel 1:20", nameEm: 3.992, meaningEm: 5.96 },
  { name: "Solomon", meaning: "Peaceable", ref: "1 Chronicles 22:9", nameEm: 4.831, meaningEm: 4.442 },
];

/** Bold "Abraham", in ems. */
const ABRAHAM_EM = 4.949;
/** Italic "Father of a great multitude", in ems. */
const FATHER_EM = 12.339;

/**
 * A lexicon of names: Abraham as the headword with its Hebrew and its
 * meaning, then name and meaning pairs joined by leaders. Hover reads each
 * name across to what it means.
 */
export function names(ctx: Ctx): ReactNode {
  return ctx.thumb ? thumbLexicon(ctx) : plateLexicon(ctx);
}

function plateLexicon(ctx: Ctx): ReactNode {
  const { p, w } = ctx;
  const head = 21;
  const size = 7.4;
  const meaningRight = R - 52;
  const top = 96;
  const pitch = 10.4;
  const step = 110;

  return (
    <g>
      {/* The headword entry. */}
      <Txt face="serif" x={L} y={T + 22} size={head} fontWeight={700} fill={p.ink}>
        Abraham
      </Txt>
      <Txt face="hebrew" x={r2(L + ABRAHAM_EM * head + 8)} y={T + 22} size={17} fill={p.muted}>
        אַבְרָהָם
      </Txt>
      <Txt
        face="serif"
        x={L}
        y={T + 40}
        size={10.5}
        fontStyle="italic"
        fill={p.ink}
        className={css.fade}
        style={timing(80, 360)}
      >
        Father of a great multitude
      </Txt>
      <path
        d={`M${r2(L + FATHER_EM * 10.5 + 5)} ${T + 37}H${R}`}
        stroke={p.muted}
        strokeWidth={w.fine}
        strokeDasharray="0.01 2.4"
        strokeLinecap="round"
        className={css.growX}
        style={timing(80, 420)}
      />
      <Txt x={L} y={T + 52} size={FS.small} fill={p.muted}>
        Formerly Abram. Genesis 17:5, in the margin
      </Txt>
      <path d={`M${L} ${T + 61}H${R}`} stroke={p.ink} strokeWidth={w.hair} />

      {ENTRIES.map((e, i) => {
        const y = r2(top + i * pitch);
        const nameEnd = L + e.nameEm * size;
        const meaningStart = meaningRight - e.meaningEm * size;
        const delay = 360 + i * step;
        return (
          <g key={e.name}>
            <Txt face="serif" x={L} y={y} size={size} fontWeight={700} fill={p.ink}>
              {e.name}
            </Txt>
            <path
              d={`M${r2(nameEnd + 3)} ${r2(y - 1.3)}H${r2(meaningStart - 3)}`}
              stroke={p.muted}
              strokeWidth={w.fine}
              strokeDasharray="0.01 2.2"
              strokeLinecap="round"
              className={css.growX}
              style={timing(delay, 300)}
            />
            <g className={css.fade} style={timing(delay + 240, 260)}>
              <Txt face="serif" x={meaningRight} y={y} size={size} fontStyle="italic" textAnchor="end" fill={p.ink}>
                {e.meaning}
              </Txt>
              <Txt x={R} y={y} size={FS.small} textAnchor="end" fill={p.muted}>
                {e.ref}
              </Txt>
            </g>
          </g>
        );
      })}
    </g>
  );
}

function thumbLexicon(ctx: Ctx): ReactNode {
  const { p, w } = ctx;
  const head = 54;
  const rows = [
    [0.36, 0.42],
    [0.26, 0.3],
    [0.3, 0.46],
  ] as const;
  return (
    <g>
      <Txt face="serif" x={L - 2} y={T + 44} size={head} fontWeight={700} fill={p.ink}>
        Abraham
      </Txt>
      <path d={`M${L} ${T + 62}H${R}`} stroke={p.ink} strokeWidth={w.hair} />
      {rows.map(([name, meaning], i) => {
        const y = r2(T + 86 + i * 26);
        const span = R - L;
        const nameEnd = L + span * name;
        const meaningStart = R - span * meaning;
        return (
          <g key={i}>
            <path d={`M${L + 4} ${y}H${r2(nameEnd)}`} stroke={p.ink} strokeWidth={10} strokeLinecap="round" />
            <path
              d={`M${r2(nameEnd + 14)} ${y}H${r2(meaningStart - 14)}`}
              stroke={p.muted}
              strokeWidth={w.base}
              strokeDasharray="0.01 14"
              strokeLinecap="round"
              className={css.growX}
              style={timing(200 + i * 160, 320)}
            />
            <path
              d={`M${r2(meaningStart)} ${y}H${R - 4}`}
              stroke={p.muted}
              strokeOpacity={0.6}
              strokeWidth={8}
              strokeLinecap="round"
              className={css.fade}
              style={timing(420 + i * 160, 260)}
            />
          </g>
        );
      })}
    </g>
  );
}
