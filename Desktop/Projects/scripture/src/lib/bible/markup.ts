/**
 * The inline markup of KJV text strings (see `MarkedText` in types.ts):
 * `<i>` supplied words, `<j>` words of Christ, `<n>` the divine name.
 */

export interface VerseToken {
  text: string;
  /** Translators' supplied word(s): `<i>`. */
  italic: boolean;
  /** Words of Christ: `<j>`. */
  wj: boolean;
  /** The divine name (LORD, GOD…): `<n>`. */
  divineName: boolean;
}

const TAG_RE = /<(\/?)([ijn])>/g;

/**
 * Split marked text into runs of uniformly styled text. Adjacent runs never
 * share the same styles; empty runs are dropped. Unknown `<…>` sequences are
 * kept as literal text (the KJV data never contains them).
 */
export function tokenizeVerse(t: string): VerseToken[] {
  const tokens: VerseToken[] = [];
  // Depth counters rather than booleans, so malformed input degrades gracefully.
  let italic = 0;
  let wj = 0;
  let divineName = 0;
  let last = 0;

  const push = (text: string) => {
    if (!text) return;
    const style = { italic: italic > 0, wj: wj > 0, divineName: divineName > 0 };
    const prev = tokens[tokens.length - 1];
    if (
      prev &&
      prev.italic === style.italic &&
      prev.wj === style.wj &&
      prev.divineName === style.divineName
    ) {
      prev.text += text;
    } else {
      tokens.push({ text, ...style });
    }
  };

  for (const m of t.matchAll(TAG_RE)) {
    push(t.slice(last, m.index));
    last = m.index + m[0].length;
    const delta = m[1] ? -1 : 1;
    if (m[2] === "i") italic = Math.max(0, italic + delta);
    else if (m[2] === "j") wj = Math.max(0, wj + delta);
    else divineName = Math.max(0, divineName + delta);
  }
  push(t.slice(last));
  return tokens;
}

/** Plain text: the markup tags removed, nothing else changed. */
export function stripMarkup(t: string): string {
  return t.replace(TAG_RE, "");
}

/**
 * Check `t` against the markup grammar: only `<i>`, `<j>`, `<n>`; `<i>` and
 * `<n>` may nest inside `<j>` and nothing else nests; tags are balanced and
 * non-empty; no stray `<` or `>`. Returns null when valid, else the first problem.
 */
export function validateMarkup(t: string): string | null {
  const stack: { tag: string; contentStart: number }[] = [];
  for (const m of t.matchAll(/<(\/?)([a-z]*)>|[<>]/g)) {
    const at = m.index;
    if (m[2] === undefined) return `stray "${m[0]}" at ${at}`;
    const [, close, tag] = m;
    if (tag !== "i" && tag !== "j" && tag !== "n") return `unknown tag "${m[0]}" at ${at}`;
    if (close) {
      const open = stack.pop();
      if (open?.tag !== tag) return `unbalanced </${tag}> at ${at}`;
      if (open.contentStart === at) return `empty <${tag}> at ${at}`;
    } else {
      const top = stack[stack.length - 1]?.tag;
      if (top === "i" || top === "n" || (top === "j" && tag === "j")) {
        return `<${tag}> nested inside <${top}> at ${at}`;
      }
      stack.push({ tag, contentStart: at + m[0].length });
    }
  }
  const unclosed = stack.pop();
  return unclosed ? `unclosed <${unclosed.tag}>` : null;
}
