import type { ReactNode } from "react";
import { B, css, cx, FS, L, R, T, timing, Txt, r2, type Ctx } from "./kit";

/** The 22 letters in order, with the KJV's own stanza headings (Psalm 119). */
const LETTERS = [
  ["א", "Aleph"], ["ב", "Beth"], ["ג", "Gimel"], ["ד", "Daleth"], ["ה", "He"], ["ו", "Vau"],
  ["ז", "Zain"], ["ח", "Cheth"], ["ט", "Teth"], ["י", "Jod"], ["כ", "Caph"], ["ל", "Lamed"],
  ["מ", "Mem"], ["נ", "Nun"], ["ס", "Samech"], ["ע", "Ain"], ["פ", "Pe"], ["צ", "Tzaddi"],
  ["ק", "Koph"], ["ר", "Resh"], ["ש", "Schin"], ["ת", "Tau"],
] as const;

/**
 * Psalm 119 as a glyph grid, read right to left: one cell per stanza, each
 * numbered by its first verse. Hover steps the highlight through the alphabet.
 */
export function acrostic(ctx: Ctx): ReactNode {
  const { p, w, thumb } = ctx;
  const cols = thumb ? 4 : 8;
  const count = thumb ? 8 : LETTERS.length;
  const rows = Math.ceil(count / cols);
  const cw = (R - L) / cols;
  const ch = (B - T) / rows;
  const step = thumb ? 150 : 64;
  const glyphSize = thumb ? 46 : 23;

  const cells = LETTERS.slice(0, count).map(([glyph, name], i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = r2(R - (col + 1) * cw);
    const y = r2(T + row * ch);
    const gx = r2(x + cw / 2);
    const gy = r2(y + ch * (thumb ? 0.66 : 0.6));
    const last = i === count - 1;
    return (
      <g key={glyph}>
        <Txt face="hebrew" x={gx} y={gy} size={glyphSize} textAnchor="middle" fill={p.ink}>
          {glyph}
        </Txt>
        {thumb ? null : (
          <>
            <Txt x={gx} y={r2(y + ch - 6)} size={5.2} textAnchor="middle" fill={p.muted}>
              {name}
            </Txt>
            <Txt x={r2(x + 3)} y={r2(y + 7.5)} size={5} fill={p.muted}>
              {i * 8 + 1}
            </Txt>
          </>
        )}
        {/* The highlight: ink cell, paper letter. Aleph holds it at rest. */}
        <g
          className={cx(css.flash, i === 0 && css.on, last && css.hold)}
          style={timing(i * step, step)}
        >
          <rect x={x} y={y} width={r2(cw)} height={r2(ch)} fill={p.accent} />
          <Txt face="hebrew" x={gx} y={gy} size={glyphSize} textAnchor="middle" fill={p.onAccent}>
            {glyph}
          </Txt>
          {thumb ? null : (
            <>
              <Txt x={gx} y={r2(y + ch - 6)} size={5.2} textAnchor="middle" fill={p.onAccent}>
                {name}
              </Txt>
              <Txt x={r2(x + 3)} y={r2(y + 7.5)} size={5} fill={p.onAccent}>
                {i * 8 + 1}
              </Txt>
            </>
          )}
        </g>
      </g>
    );
  });

  // Cell rules, drawn over the highlight so the grid stays continuous.
  let grid = "";
  for (let r = 0; r <= rows; r++) {
    const y = r2(T + r * ch);
    const filled = r === rows ? count - (rows - 1) * cols : cols;
    grid += `M${r2(R - (r === rows ? filled : cols) * cw)} ${y}H${R}`;
  }
  for (let c = 0; c <= cols; c++) {
    const x = r2(R - c * cw);
    const depth = c <= count - (rows - 1) * cols ? rows : rows - 1;
    grid += `M${x} ${T}V${r2(T + depth * ch)}`;
  }
  // Close the bottom edge of the short last row's neighbours.
  const spare = rows * cols - count;
  if (spare > 0) grid += `M${L} ${r2(T + (rows - 1) * ch)}H${r2(L + spare * cw)}`;

  return (
    <g>
      {cells}
      <path d={grid} stroke={p.line} strokeWidth={thumb ? w.hair : w.fine} fill="none" />
      {thumb || spare === 0 ? null : (
        <g>
          <Txt face="serif" x={r2(L + 2)} y={r2(T + (rows - 1) * ch + 22)} size={11} fill={p.ink}>
            Psalm 119
          </Txt>
          <Txt x={r2(L + 2)} y={r2(T + (rows - 1) * ch + 34)} size={FS.label} fill={p.muted}>
            22 stanzas of 8 verses
          </Txt>
        </g>
      )}
    </g>
  );
}
