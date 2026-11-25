import { Fragment, type CSSProperties } from "react";
import { VerseText } from "./VerseText";

/** The verse fields Passage reads; `readPassage` / `loadPassage` results fit as-is. */
export interface PassageVerseInput {
  chapter: number;
  n: number;
  t: string;
  /** 1 when a paragraph starts here (used by the "paragraphs" layout). */
  p?: 1;
}

export interface PassageProps {
  verses: readonly PassageVerseInput[];
  /** Small verse numbers before each verse (default true). */
  showNumbers?: boolean;
  /** Exact phrases to wrap in <mark data-phrase>; see VerseText. */
  highlight?: readonly string[];
  /**
   * "paragraphs" (default): verses run on, breaking where a paragraph starts
   * (`p`) or the chapter changes. "verses": one verse per line.
   */
  layout?: "paragraphs" | "verses";
  showSupplied?: boolean;
  redLetter?: boolean;
  className?: string;
}

/**
 * A run of verses with small verse numbers. Server-component safe. Font and
 * colour are inherited from the parent; theme it with CSS variables:
 *
 *   --scripture-wj              words of Christ (default currentColor)
 *   --scripture-highlight       <mark> background
 *   --scripture-verse-number    verse number colour (default: currentColor at 55%)
 *   --scripture-paragraph-gap   space between paragraphs (default 0.75em; 0.35em per line in "verses")
 *
 * Markup hooks: [data-passage], [data-paragraph], [data-verse="12:9"],
 * [data-verse-number]. When a passage spans chapters, the first verse of each
 * chapter is numbered "chapter:verse".
 */
export function Passage({
  verses,
  showNumbers = true,
  highlight,
  layout = "paragraphs",
  showSupplied,
  redLetter,
  className,
}: PassageProps) {
  const multiChapter = verses.some((v) => v.chapter !== verses[0].chapter);

  const blocks: { verse: PassageVerseInput; label: string }[][] = [];
  verses.forEach((verse, i) => {
    const prev = verses[i - 1];
    const newChapter = !prev || prev.chapter !== verse.chapter;
    const label = multiChapter && newChapter ? `${verse.chapter}:${verse.n}` : `${verse.n}`;
    if (!prev || layout === "verses" || verse.p === 1 || newChapter) blocks.push([]);
    blocks[blocks.length - 1].push({ verse, label });
  });

  const gap = layout === "verses" ? "var(--scripture-paragraph-gap, 0.35em)" : "var(--scripture-paragraph-gap, 0.75em)";

  return (
    <div className={className} data-passage="">
      {blocks.map((block, b) => (
        <p key={b} data-paragraph="" style={{ margin: 0, marginBlockStart: b ? gap : 0 }}>
          {block.map(({ verse, label }, k) => (
            <Fragment key={k}>
              {k > 0 ? " " : null}
              <span data-verse={`${verse.chapter}:${verse.n}`}>
                {showNumbers ? (
                  <span data-verse-number="" style={NUMBER_STYLE}>
                    {label}
                  </span>
                ) : null}
                <VerseText
                  text={verse.t}
                  highlight={highlight}
                  showSupplied={showSupplied}
                  redLetter={redLetter}
                />
              </span>
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}

const NUMBER_STYLE: CSSProperties = {
  fontSize: "0.62em",
  lineHeight: 0,
  verticalAlign: "super",
  fontVariantNumeric: "lining-nums tabular-nums",
  color: "var(--scripture-verse-number, color-mix(in oklab, currentColor 55%, transparent))",
  marginInlineEnd: "0.3em",
};
