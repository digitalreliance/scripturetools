# King James Version (KJV)

The Bible text behind every study: the Authorized (King James) Version, installed
as local, versioned, validated JSON. No API and no runtime licence are involved.

## Source

| | |
|---|---|
| Edition | Authorized Version, standardized 1769 text, protocanon (66 books) |
| Publisher | eBible.org, courtesy of the CrossWire Bible Society |
| Archive | <https://ebible.org/Scriptures/eng-kjv2006_usfm.zip> (USFM, source files dated 2026-11-15) |
| SHA-256 | `b6faa67117ccaba49df9e7df224a553f11758ae7c5d58f0f7979e2b73ac4480b` (pinned in `scripts/data/kjv/source.ts`) |
| Licence | Public domain |

**Why this archive.** eBible.org publishes two USFM builds of the KJV: `eng-kjv2006`
(protocanon only) and `eng-kjv` (with the Apocrypha). Their 66 canonical books are
byte-identical (checked 2026-11-24), and both mark the words of Christ (`\wj`, 2,038
spans), supplied words (`\add`), the divine name (`\nd`), Psalm titles (`\d`), the
Psalm 119 acrostic headings, the epistle colophons, the translators' marginal notes
(`\f`) and the 1769 pilcrows. We use `eng-kjv2006` because it needs no filtering.

**Licence.** The KJV is in the public domain worldwide. The one caveat is the
United Kingdom, where the Crown's letters patent restrict *printing* the KJV to
licensed printers (Cambridge University Press, Oxford University Press, Collins);
that patent does not cover this web app's use outside the UK.

Credit the text wherever it appears, e.g. "King James Version (public domain), text
from eBible.org". `KJV_TRANSLATION` in `@/lib/bible` has the fields.

## Files

| Path | What |
|---|---|
| `public/data/kjv/books/{ID}.json` | One minified file per book, `ID` = USFM code (`GEN` … `REV`). 4.95 MB in total, 1.51 MB gzipped. Largest: `PSA.json`, 335 KB (95 KB gzipped). |
| `public/data/kjv/index.json` | Translation metadata, per-book verse counts and word counts, totals. |
| `src/lib/bible/generated/kjv-meta.ts` | Generated module: `VERSE_COUNTS`, `WORD_COUNTS`, `KJV_TOTALS`, `KJV_TRANSLATION`. Lets any code (server or browser) do versification without loading text. |

All three are generated. Never edit them by hand.

### `books/{ID}.json`

```jsonc
{
  "id": "REV",
  "chapters": [
    {
      "n": 12,
      "title": "A Psalm of David.",        // Psalms only: the superscription (\d); 116 chapters
      "colophon": "Written to …",          // last chapter of 14 epistles: the subscription
      "verses": [
        {
          "n": 9,
          "t": "And the great dragon …",   // marked text, see below
          "p": 1,                          // a paragraph starts here
          "h": "ALEPH",                    // Psalm 119 only: acrostic heading before this verse
          "notes": ["firmament: Heb. expansion"]  // translators' marginal notes, plain text
        }
      ]
    }
  ]
}
```

- Chapters and verses are complete and contiguous: `chapters[i].n === i + 1` and
  `verses[i].n === i + 1`.
- Optional keys are omitted, never `null`.
- **`p`** is 1 where a paragraph starts: a `\p` marker or a pilcrow (¶) in the source
  (the pilcrow is removed from the text), the first verse of every chapter, and every
  verse of Psalms. In Psalms each verse is its own poetic line (`\q1`). 7,096 verses
  carry it.
- **`title`** and **`colophon`** use the same inline markup as `t`. Psalm 18's title
  contains `<n>LORD</n>` and Romans 16's colophon contains `<i>and sent</i>`. Render
  them with `<VerseText>` or flatten them with `stripMarkup`.
- **`h`** is the transliterated letter name only (`"ALEPH"` … `"TAU"`). The source's
  Hebrew letter is dropped.
- **`notes`** hold 6,959 notes on 5,844 verses. Each note is the source's text: the
  words it glosses, a colon, then the note, e.g. `"the light from…: Heb. between the light and between the darkness"`.

### `index.json`

```jsonc
{
  "schemaVersion": 1,
  "translation": { "id": "KJV", "name", "edition", "license": "Public domain", "source",
                   "sourceUrl", "sha256", "generatedAt" },
  "books": [{ "id": "GEN", "chapters": [31, 25, …], "words": 38262 }, …],  // chapters = verses per chapter
  "totals": { "books": 66, "chapters": 1189, "verses": 31102, "words": 789681 }
}
```

`words` counts whitespace-delimited tokens of verse text that contain a letter or
digit, with markup stripped. Titles, colophons and notes are not counted.
`generatedAt` changes only when the generated data changes.

## Markup in `t`

| Tag | Meaning | Source | Spans |
|---|---|---|---|
| `<i>…</i>` | words supplied by the translators (printed in italics) | `\add` | 21,463 |
| `<j>…</j>` | words of Christ (red letter) | `\wj` | 2,038 (2,028 verses) |
| `<n>…</n>` | the divine name (small capitals) | `\nd` | 6,884 |

The `<n>` spans keep the source's spelling: `LORD` 6,459, `GOD` 308, `LORD’s` 108,
`Lord` 10, `JEHOVAH` 2, `LORD JEHOVAH` 2, `Jah` 1. `<VerseText>` renders them all
alike: a full-size initial for each word, then small capitals. The DOM text stays as
spelled, so copy and search still see it.

- `<i>` and `<n>` may nest inside `<j>`. Nothing else nests. Tags are balanced within
  each verse and hug words: `darkness <i>was</i> upon`, never `darkness<i> was</i>`.
- In 13 places the source nests `\nd` inside `\add` (e.g. Leviticus 24:11, "the name
  *of the* LORD"). There the divine name is emitted as `<n>` next to the supplied words
  (`<i>of the</i> <n>LORD</n>`), so those 13 names are not marked as supplied.
- Adjacent spans of the same kind merge (`<n>LORD JEHOVAH</n>`, Isaiah 12:2).
- No other markup: no Strong's numbers, no backslashes, single spaces, no leading
  or trailing space. Punctuation is exactly as the source, including `’`, `—`, and
  the brackets of 1 John 2:23.
- Never inject `t` as HTML. Use `tokenizeVerse(t)` → `{ text, italic, wj, divineName }[]`,
  `stripMarkup(t)`, or `<VerseText text={t} />`.

What the source has but the data leaves out: Strong's numbers (`\w …|strong=`),
book titles (`\mt`, `\toc`; their capitalization is inconsistent in the source), the
Hebrew letters of the Psalm 119 headings, and the 209 stanza breaks (`\b`) inside
Psalms. Every Psalm verse already starts a line, so stanzas cannot be expressed by `p`.

## Using it

```ts
import { parseReference, formatReference, verseCount, stripMarkup, KJV_TOTALS } from "@/lib/bible";
import { readPassage, readChapter, readBook } from "@/lib/bible/server";   // Server Components (sync fs)
import { loadPassage, loadBook } from "@/lib/bible/client";                // browser (fetch, memoized)
import { VerseText } from "@/components/bible/VerseText";
import { Passage } from "@/components/bible/Passage";

const verses = readPassage("REV 12:7-12");   // [{ chapter: 12, n: 7, t, p? }, …]
<Passage verses={verses} highlight={["that old serpent"]} />
```

Canonical reference strings: `REV 12:9`, `REV 12:9-11`, `REV 4:10-5:1`, `REV 12`, and
`REV 2-3` for whole chapters. `parseReference` also accepts human input ("Rev 12:9",
"Revelation 12:9–10", "1 Cor 13", "I John 4:8", "Song of Songs 2:4", "Jude 3").

## Regenerating

```sh
npm run data:kjv                        # uses .cache/kjv/eng-kjv2006_usfm.zip when present
npm run data:kjv -- --refresh           # download again
npm run data:kjv -- --allow-new-source  # build from an archive whose SHA-256 differs from the pin
```

The script (`scripts/data/kjv.ts`, with its parser, validator and writers in
`scripts/data/kjv/`) downloads the archive into the gitignored `.cache/` and checks
the SHA-256 against the pin. It parses only the 66 canonical books. The parser
handles every marker in the source explicitly and fails with file and line on
anything else. It then validates the result and writes only the files whose
content changed. A rerun on unchanged input changes nothing.

eBible.org republishes its archives from time to time without keeping old versions,
so a fresh download may not match the pin. In that case, compare the new archive
before updating `sha256` in `scripts/data/kjv/source.ts`. The committed JSON stays
the reference copy.

## Validation

The script fails unless all of these hold:

- 66 books in canon order, each with the chapter count in `src/lib/bible/canon.ts`
- 1,189 chapters and exactly 31,102 verses (OT 23,145, NT 7,957), numbered contiguously
- no empty verse, title or colophon
- no leftover USFM: no backslash, `|`, `strong=` or pilcrow
- whitespace collapsed
- markup balanced and grammatical in every verse, title and colophon

It also requires each footnote's own reference (`\fr 1.4`) to match the verse that
carries it.

Results for the pinned archive: 66 books, 1,189 chapters, 31,102 verses and
789,681 words. Psalm 119:1 starts "ALEPH", Revelation has 404 verses (Rev 12 has
17), 3 John has 14, and `verseOrdinal("REV", 12, 9)` is 203. The unit tests in
`src/lib/bible/__tests__/` and `scripts/data/kjv/usfm.test.ts` check these and the
other invariants against the committed data.
