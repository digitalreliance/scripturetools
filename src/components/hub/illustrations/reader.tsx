import type { ReactNode } from "react";
import { css, FS, L, R, timing, Txt, r2, type Ctx } from "./kit";

/*
 * Luke 5:1–9 as the King James page sets it: each verse its own paragraph,
 * justified in two columns under a three-line chapter numeral. Lines were
 * broken and measured in Libre Baskerville at 5.6 units on a 129-unit
 * column; the number after each line is the extra word spacing that
 * justifies it (0 for the last line of a verse). `^n` opens verse n,
 * *italic* marks the translators' supplied words, [ ] the words of Christ.
 */
const LINES: readonly (readonly [string, number])[] = [
  ["And it came to pass, that, as the people", 0.06],
  ["pressed upon him to hear the word of", 0.39],
  ["God, he stood by the lake of Gen-", 2.12],
  ["nesaret,", 0],
  ["^2 And saw two ships standing by the lake: but", 0.24],
  ["the fishermen were gone out of them, and", 1.26],
  ["were washing *their* nets.", 0],
  ["^3 And he entered into one of the ships, which", 0.09],
  ["was Simon’s, and prayed him that he would", 0.67],
  ["thrust out a little from the land. And he sat", 0.81],
  ["down, and taught the people out of the ship.", 0],
  ["^4 Now when he had left speaking, he said", 1.86],
  ["unto Simon, [Launch out into the deep, and]", 0.8],
  ["[let down your nets for a draught.]", 0],
  ["^5 And Simon answering said unto him, Mas-", 0.56],
  ["ter, we have toiled all the night, and have", 1.56],
  ["taken nothing: nevertheless at thy word I will", 0.07],
  ["let down the net.", 0],
  ["^6 And when they had this done, they inclosed", 0.04],
  ["a great multitude of fishes: and their net", 2.1],
  ["brake.", 0],
  ["^7 And they beckoned unto *their* partners,", 2.8],
  ["which were in the other ship, that they", 2.67],
  ["should come and help them. And they came,", 0.12],
  ["and filled both the ships, so that they began", 0.65],
  ["to sink.", 0],
  ["^8 When Simon Peter saw *it*, he fell down at", 1],
  ["Jesus’ knees, saying, Depart from me; for I", 1.2],
  ["am a sinful man, O Lord.", 0],
  ["^9 For he was astonished, and all that were", 1.79],
  ["with him, at the draught of the fishes which", 0.61],
  ["they had taken:", 0],
];

/** Type, measure and leading of the plate page. */
const SIZE = 5.6;
const COLUMN = 129;
const GUTTER = R - L - 2 * COLUMN;
const LEADING = 8.4;
const FIRST = 42;
const PER_COLUMN = 16;
/** The chapter numeral drops three lines; its cap height spans them. */
const DROP_LINES = 3;
const DROP_INDENT = 18;
const VERSE_SIZE = 3.6;
const VERSE_GAP = 1.6;
/** Advance of a single-figure verse number at VERSE_SIZE (Archivo 600). */
const VERSE_ADVANCE = 1.88;

type Run = { text: string; italic: boolean; red: boolean };

/** Split a line's markup into styled runs. */
function runs(text: string): Run[] {
  const out: Run[] = [];
  let red = false;
  for (const part of text.split(/(\[|\]|\*[^*]+\*)/)) {
    if (part === "[") red = true;
    else if (part === "]") red = false;
    else if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
      out.push({ text: part.slice(1, -1), italic: true, red });
    else if (part) out.push({ text: part, italic: false, red });
  }
  return out;
}

/** The thumb's schematic page: line lengths (1 = full measure), verse starts, red letters. */
const THUMB_LEFT: readonly (readonly [number, "" | "v" | "r"])[] = [
  [1, ""], [1, ""], [1, ""], [1, ""], [0.35, ""],
  [1, "v"], [0.6, ""],
  [1, "v"], [1, "r"], [0.55, "r"],
  [1, "v"], [1, ""],
];
const THUMB_RIGHT: readonly (readonly [number, "" | "v" | "r"])[] = [
  [1, ""], [0.4, ""],
  [1, "v"], [1, ""], [0.25, ""],
  [1, "v"], [1, ""], [0.7, ""],
  [1, "v"], [1, ""], [1, ""], [0.45, ""],
];

/**
 * A King James page: Luke 5 opening under its chapter numeral, small verse
 * numbers, the translators' italics and one line in red letters. Hover sets
 * the page line by line.
 */
export function reader(ctx: Ctx): ReactNode {
  return ctx.thumb ? thumbPage(ctx) : platePage(ctx);
}

function platePage(ctx: Ctx): ReactNode {
  const { p, w } = ctx;
  const step = 34;
  const lastBaseline = FIRST + (PER_COLUMN - 1) * LEADING;
  // Cap height of the first line down to the third baseline.
  const dropTop = FIRST - 0.77 * SIZE;
  const dropBottom = FIRST + (DROP_LINES - 1) * LEADING;
  const dropSize = r2((dropBottom - dropTop) / 0.78);

  return (
    <g>
      {/* Running head: chapter and verses on this page, over a rule. */}
      <Txt face="serif" x={160} y={30} size={6.2} textAnchor="middle" fill={p.ink}>
        Luke
      </Txt>
      <Txt x={L} y={30} size={FS.small} fill={p.muted}>
        5:1
      </Txt>
      <Txt x={R} y={30} size={FS.small} textAnchor="end" fill={p.muted}>
        5:9
      </Txt>
      <path d={`M${L} 34H${R}`} stroke={p.ink} strokeWidth={w.hair} />
      <path
        d={`M160 ${r2(FIRST - 5)}V${r2(lastBaseline + 2)}`}
        stroke={p.line}
        strokeWidth={w.hair}
      />

      <Txt
        face="serif"
        x={r2(L - 0.6)}
        y={r2(dropBottom)}
        size={dropSize}
        fontWeight={700}
        fill={p.ink}
        className={css.fade}
        style={timing(0, 320)}
      >
        5
      </Txt>

      {LINES.map(([raw, spacing], i) => {
        const column = Math.floor(i / PER_COLUMN);
        const row = i % PER_COLUMN;
        const verse = /^\^(\d+) (.*)$/.exec(raw);
        const text = verse ? verse[2] : raw;
        const x0 = L + column * (COLUMN + GUTTER) + (i < DROP_LINES ? DROP_INDENT : 0);
        const y = r2(FIRST + row * LEADING);
        const lead = verse ? VERSE_ADVANCE + VERSE_GAP : 0;
        return (
          <g key={i} className={css.fade} style={timing(120 + i * step, 220)}>
            {verse ? (
              <Txt x={r2(x0)} y={r2(y - 1.6)} size={VERSE_SIZE} fontWeight={600} fill={p.muted}>
                {verse[1]}
              </Txt>
            ) : null}
            <Txt
              face="serif"
              x={r2(x0 + lead)}
              y={y}
              size={SIZE}
              fill={p.ink}
              wordSpacing={spacing || undefined}
            >
              {runs(text).map((run, j) => (
                <tspan
                  key={j}
                  fontStyle={run.italic ? "italic" : undefined}
                  fill={run.red ? p.accent : undefined}
                >
                  {run.text}
                </tspan>
              ))}
            </Txt>
          </g>
        );
      })}
    </g>
  );
}

function thumbPage(ctx: Ctx): ReactNode {
  const { p, w } = ctx;
  const column = 128;
  const gutter = R - L - 2 * column;
  const pitch = 13;
  const top = 29;
  const bar = 5.2;
  const drop = 4;
  const indent = 40;
  const tick = 4;
  // Four lines of bars, top of the first to the foot of the last: the numeral's height.
  const dropSize = r2(((drop - 1) * pitch + bar) / 0.78);

  const columnBars = (rows: typeof THUMB_LEFT, c: number) =>
    rows.map(([len, kind], i) => {
      const x0 = L + c * (column + gutter) + (c === 0 && i < drop ? indent : 0);
      const verse = kind.includes("v");
      const start = x0 + (verse ? tick + 3 : 0);
      const end = L + c * (column + gutter) + column;
      const x1 = start + (end - start) * len;
      const y = r2(top + i * pitch);
      return (
        <g key={`${c}-${i}`} className={css.growX} style={timing(80 + (c * rows.length + i) * 45, 260)}>
          {verse ? <rect x={r2(x0)} y={r2(y - bar / 2)} width={tick} height={bar} fill={p.ink} /> : null}
          <path
            d={`M${r2(start + bar / 2)} ${y}H${r2(x1 - bar / 2)}`}
            stroke={kind.includes("r") ? p.accent : p.muted}
            strokeOpacity={kind.includes("r") ? 1 : 0.6}
            strokeWidth={bar}
            strokeLinecap="round"
          />
        </g>
      );
    });

  return (
    <g>
      <path d={`M160 ${top - 4}V${r2(top + 11 * pitch + 4)}`} stroke={p.line} strokeWidth={w.hair} />
      <Txt
        face="serif"
        x={r2(L - 2)}
        y={r2(top + (drop - 1) * pitch + bar / 2)}
        size={dropSize}
        fontWeight={700}
        fill={p.ink}
        className={css.fade}
        style={timing(0, 320)}
      >
        5
      </Txt>
      {columnBars(THUMB_LEFT, 0)}
      {columnBars(THUMB_RIGHT, 1)}
    </g>
  );
}
