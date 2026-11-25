import { Fragment, type CSSProperties, type ReactNode } from "react";
import { tokenizeVerse, type VerseToken } from "@/lib/bible/markup";

/**
 * Renders KJV marked text (a verse's `t`, a Psalm title or a colophon) without
 * dangerouslySetInnerHTML. Server-component safe (no hooks); usable from
 * client components too.
 *
 *   supplied words   <em data-supplied>              italic, upright when showSupplied={false}
 *   words of Christ  <span data-wj>                  color: var(--scripture-wj, currentColor)
 *   divine name      <span data-divine-name>         small capitals; each word keeps a full-size
 *                                                    initial (L + ᴏʀᴅ) and the DOM text stays "LORD"
 *   highlight        <mark data-phrase="…">          background: var(--scripture-highlight, …)
 *
 * Everything else inherits font and colour from the parent.
 */
export interface VerseTextProps {
  /** Marked text: <i> supplied words, <j> words of Christ, <n> the divine name. */
  text: string;
  /** Italicize the translators' supplied words (default true); false sets them upright. */
  showSupplied?: boolean;
  /** Colour the words of Christ with var(--scripture-wj) (default true). */
  redLetter?: boolean;
  /**
   * Exact, case-sensitive phrases to wrap in <mark data-phrase>, matched on the
   * plain text, so a phrase may span markup ("the <n>LORD</n> <i>is</i>" matches "LORD is").
   * Where matches overlap, the phrase listed first wins.
   */
  highlight?: readonly string[];
  className?: string;
}

const WJ_STYLE: CSSProperties = { color: "var(--scripture-wj, currentColor)" };
const SMALL_CAPS_STYLE: CSSProperties = { fontVariantCaps: "all-small-caps", letterSpacing: "0.04em" };
const MARK_STYLE: CSSProperties = {
  backgroundColor: "var(--scripture-highlight, color-mix(in oklab, currentColor 16%, transparent))",
  color: "inherit",
  borderRadius: "0.2em",
  boxDecorationBreak: "clone",
  WebkitBoxDecorationBreak: "clone",
};

interface Piece extends VerseToken {
  /** Highlight phrase covering this piece. */
  phrase?: string;
  /** The piece starts its token, so a divine name's first letter is a word initial. */
  tokenStart: boolean;
}

/** Split tokens at highlight boundaries; each piece is uniformly styled and highlighted. */
function toPieces(tokens: VerseToken[], highlight: readonly string[] | undefined): Piece[] {
  const plain = tokens.map((t) => t.text).join("");
  const cover: (string | undefined)[] = Array.from({ length: plain.length });
  for (const phrase of highlight ?? []) {
    if (!phrase) continue;
    for (let at = plain.indexOf(phrase); at !== -1; at = plain.indexOf(phrase, at + phrase.length)) {
      for (let k = at; k < at + phrase.length; k++) cover[k] ??= phrase;
    }
  }

  const pieces: Piece[] = [];
  let offset = 0;
  for (const token of tokens) {
    let start = 0;
    for (let k = 1; k <= token.text.length; k++) {
      if (k === token.text.length || cover[offset + k] !== cover[offset + start]) {
        pieces.push({ ...token, text: token.text.slice(start, k), phrase: cover[offset + start], tokenStart: start === 0 });
        start = k;
      }
    }
    offset += token.text.length;
  }
  return pieces;
}

const WHITESPACE = /\s/;

/** "LORD JEHOVAH" → L + small-caps "ORD", space, J + small-caps "EHOVAH". */
function DivineName({ text, tokenStart }: { text: string; tokenStart: boolean }) {
  const runs: { small: boolean; text: string }[] = [];
  for (let k = 0; k < text.length; k++) {
    const ch = text[k];
    const wordInitial = k === 0 ? tokenStart : WHITESPACE.test(text[k - 1]);
    const small = !WHITESPACE.test(ch) && !wordInitial;
    const last = runs[runs.length - 1];
    if (last?.small === small) last.text += ch;
    else runs.push({ small, text: ch });
  }
  return (
    <span data-divine-name="">
      {runs.map((run, k) =>
        run.small ? (
          <span key={k} style={SMALL_CAPS_STYLE}>
            {run.text}
          </span>
        ) : (
          <Fragment key={k}>{run.text}</Fragment>
        ),
      )}
    </span>
  );
}

/** Consecutive items that share `key(item)`, in order. */
function groupBy<T, K>(items: readonly T[], key: (item: T) => K): { key: K; items: T[] }[] {
  const groups: { key: K; items: T[] }[] = [];
  for (const item of items) {
    const k = key(item);
    const last = groups[groups.length - 1];
    if (last && last.key === k) last.items.push(item);
    else groups.push({ key: k, items: [item] });
  }
  return groups;
}

export function VerseText({
  text,
  showSupplied = true,
  redLetter = true,
  highlight,
  className,
}: VerseTextProps) {
  const pieces = toPieces(tokenizeVerse(text), highlight);

  const renderPiece = (piece: Piece, key: number): ReactNode => {
    let node: ReactNode = piece.divineName ? (
      <DivineName text={piece.text} tokenStart={piece.tokenStart} />
    ) : (
      piece.text
    );
    if (piece.italic && showSupplied) node = <em data-supplied="">{node}</em>;
    return <Fragment key={key}>{node}</Fragment>;
  };

  // Words of Christ wrap highlights, which wrap the styled pieces.
  return (
    <span className={className}>
      {groupBy(pieces, (p) => redLetter && p.wj).map((wjGroup, g) => {
        const content = groupBy(wjGroup.items, (p) => p.phrase).map((markGroup, m) => {
          const inner = markGroup.items.map(renderPiece);
          return markGroup.key === undefined ? (
            <Fragment key={m}>{inner}</Fragment>
          ) : (
            <mark key={m} data-phrase={markGroup.key} style={MARK_STYLE}>
              {inner}
            </mark>
          );
        });
        return wjGroup.key ? (
          <span key={g} data-wj="" style={WJ_STYLE}>
            {content}
          </span>
        ) : (
          <Fragment key={g}>{content}</Fragment>
        );
      })}
    </span>
  );
}
