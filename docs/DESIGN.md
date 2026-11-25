# Design system

Scripture is a set of precise instruments for studying the Bible, presented the
way a technology company presents its products: crisp, fast, keyboard-friendly.
What keeps it from looking like every other dark SaaS page is that its devices
come from the printed Bible itself.

## Principles

1. **Color belongs to Scripture.** Chrome is leather, paper and ink. Hue appears
   only where it encodes data (canon sections, chiasm levels, map regions) or a
   study's own identity. Never as decoration, never as a gradient wash.
2. **The book is the interface.** Borrow devices from printed Bibles and make each
   one do a job: the cover (hero), the contents page (index), the thumb index
   (category navigation), running heads (study top bars), red letters, italic
   supplied words, LORD in small capitals.
3. **Instruments, not cards.** Each study is a pro tool with its own palette and the
   same frame: top bar, outline, canvas, inspector, status bar (`StudyShell`).
4. **One moment of motion per screen.** On the hub's cover it is the
   cross-reference arcs weaving in; on its pages, the carousel presenting the
   newest studies, each with a short demo of what it does. Everything else moves
   only in answer to the user. Respect `prefers-reduced-motion` everywhere.
5. **Two keystrokes to anything.** `⌘K` finds studies, books and verse references.
6. **Show the source.** Every dataset credits its origin and licence where it is
   shown. Numbers are computed from the installed KJV, not typed in.

## Color

### Hub

| Token | Hex | Use |
|---|---|---|
| `cover` | `#141210` | Hero background: black calfskin, warm, never pure black |
| `cover-raised` | `#1E1B18` | Raised surfaces on the cover |
| `cover-ink` | `#F2EEE6` | Text on the cover |
| `cover-muted` | `#A39C90` | Secondary text on the cover (6.7:1) |
| `paper` | `#F6F5F1` | India paper: page background below the cover |
| `paper-raised` | `#FCFBF8` | Plates and panels on paper |
| `paper-sunk` | `#ECEAE4` | Wells, hovered rows |
| `paper-line` | `#DCD9D1` | Hairlines on paper |
| `ink` | `#1C1A17` | Text on paper |
| `ink-muted` | `#5F5A52` | Secondary text on paper (6.4:1) |
| `rubric` | `#B3261E` | Rubrication red: words of Christ, and nothing decorative |

### Canon sections (data colours)

Named after manuscript pigments. All sit near luminance 0.2 so they hold at
least 3:1 against both `cover` and `paper`. Validate any new data palette with
the `dataviz` skill.

| Section | Pigment | Hex |
|---|---|---|
| Law (Genesis–Deuteronomy) | Vermilion | `#E2553A` |
| History (Joshua–Esther) | Orpiment | `#B07714` |
| Poetry & Wisdom (Job–Song) | Malachite | `#3C9A5F` |
| Prophets (Isaiah–Malachi) | Verdigris | `#2B93A0` |
| Gospels & Acts | Madder | `#D24A72` |
| Epistles (Romans–Jude) | Ultramarine | `#4A63D9` |
| Revelation | Tyrian | `#9A4FC4` |

### Study palettes

Each study declares a palette in `src/studies/registry.ts`
(`canvas, chrome, raised, line, ink, muted, accent, onAccent, scheme`).
`StudyShell` exposes it as CSS variables and Tailwind colours:
`bg-s-canvas`, `bg-s-chrome`, `bg-s-raised`, `border-s-line`, `text-s-ink`,
`text-s-muted`, `bg-s-accent`, `text-s-on-accent`.

## Type

Two families, clearly distinct.

- **Archivo** (variable weight 100–900, width 62–125): all UI and display type.
  Headlines run wide (`font-stretch` 112–125%) at medium weight for an engineered
  look; dense data labels run semi-condensed (87.5%) with tabular figures instead
  of a monospace face.
- **Libre Baskerville** (400–700, italic): all Scripture text. Baskerville set the
  famous 1763 Cambridge Bible; the KJV text we use is the 1769 standard of the same
  era. Serif body text gets more leading than sans (18/30).

Scale (Bringhurst's classic scale): 12, 13, 14, 16, 18, 21, 24, 36, 48, 72, 96.
Sentence case everywhere. No all-caps labels, no tracked-out eyebrows, no
single accented word inside a headline, no `→` glued to button text, no
`A · B · C` meta strings — lay metadata out as labelled values.

## Layout

- Desktop first: designed at 1440, works from 1024. Phones and tablets get the
  device gate, then an optional scaled desktop preview.
- Hub: the **cover** (dark hero with the cross-reference arcs) opens onto the
  **pages** (paper). The contents of the pages are navigated by a **thumb index**
  fixed to the right edge: one tab per category, the current one pulled out.
- Live studies appear as large **plates** (a live preview in the study's own
  palette). Planned studies appear as compact contents rows. Hierarchy comes from
  status, not from identical cards.
- Under the cover, a **carousel** presents the newest live studies (up to
  `SITE.recentStudyCount`, five; most recently released or updated first) one
  plate at a time. Each plate plays its demo as it arrives. A row of tabs
  beneath names every study in it, the current one's hairline filling as its
  time runs, with a pause button first. With a single study there are no tabs
  and nothing rotates.
- 8 px grid. Radii follow hierarchy: plates 16, panels 10, controls 8, tags 5.
  Shadows only on things that truly float (menus, the command palette, popovers).

## Studies (micro-apps)

Every study renders inside `StudyShell` (`src/components/shell`):

```
┌────────────────────────────────────────────────────────────────────┐
│ ‹ Index │ Title        [view switch]   [tools]       [find] [action] │ 48
├───────────┬────────────────────────────────────────┬───────────────┤
│ outline   │ canvas                                 │ inspector     │
│ 264       │                                        │ 336, tabs     │
├───────────┴────────────────────────────────────────┴───────────────┤
│ status                                                     status │ 28
└────────────────────────────────────────────────────────────────────┘
```

Shareable state lives in the URL hash. Every study has a keyboard path through
its main interaction and visible focus. Panels collapse with `[` and `]`.

## Motion

Use `motion` for UI transitions; canvas animation runs on
`requestAnimationFrame`. Durations: 120 ms for hover/press, 200–280 ms for
panels and popovers, up to 2.4 s for an orchestrated moment.
Ease-out for entrances, ease-in-out for moves. Under reduced motion, render the
final frame.

The hub carousel holds each study for 8 s: its plate's demo (at most ~6 s; for
Revelation's mirror, the brackets drawing in and then the walk to the centre),
then a rest. The new plate fades in over the old in 500 ms. Rotation runs only
while the carousel is on screen; it holds while the pointer is over it or
keyboard focus is inside it, and the pause button stops it and finishes the
drawing. Under reduced motion it starts stopped and plays no demos. A demo first
plays when the carousel scrolls into view, not on load.

## Writing

Plain, specific, sentence case, active voice. Name things by what they are to a
reader of the Bible, not how they are built. Buttons say what happens: "Open
study", "Copy link", "Show the centre". Errors say what happened and what to do.
