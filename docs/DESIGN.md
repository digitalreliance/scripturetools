# Design system

Scripture Tools is a set of precise instruments for studying the Bible, presented the
way a technology company presents its products: crisp, fast, keyboard-friendly.
What keeps it from looking like every other dark SaaS page is that its devices
come from the printed Bible itself.

## Principles

1. **Color belongs to Scripture Tools.** Chrome is leather, paper and ink. Hue appears
   only where it encodes data (canon sections, chiasm levels, map regions) or a
   study's own identity. Never as decoration, never as a gradient wash.
2. **The book is the interface.** Borrow devices from printed Bibles and make each
   one do a job: the cover (hero), the contents page (index), the thumb index
   (category navigation), running heads (study top bars), red letters, italic
   supplied words, LORD in small capitals.
3. **Instruments, not cards.** Each study is a pro tool with its own palette and the
   same frame: top bar, outline, canvas, inspector, status bar (`StudyShell`).
4. **One moment of motion per screen.** On the hub's cover it is the
   cross-reference arcs weaving in, then light reading through them, Genesis to
   Revelation, in a slow seamless loop; on its pages, the carousel presenting
   the newest studies, each with a short demo of what it does. Both yield to the
   reader: they hold under the pointer or keyboard focus and rest off screen.
   Everything else moves only in answer to the user. Respect
   `prefers-reduced-motion` everywhere.
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

- **Desk and iPad.** Designed at 1440, and built to work on a computer or a
  tablet, from a 500 px window (half an iPad in Split View) up, by mouse,
  trackpad, keyboard, pencil or finger. Phones can browse the index; a study
  shows them the device gate, then an optional scaled desktop preview. See
  **Desk and iPad** below.
- Hub: the **cover** (dark hero with the cross-reference arcs) opens onto the
  **pages** (paper). The contents of the pages are navigated by a **thumb index**
  fixed to the right edge: one tab per category, the current one pulled out.
- The cover's **navigation** is one row of 36 px controls on the control
  radius, every item on one centre line: the wordmark (home), then Studies,
  Sources and **Contribute**, a hairline, and Search. Contribute is the same
  menu every study has, with GitHub's mark; on the hub it is about the whole
  project and opens by saying plainly that the project is free and open
  source. It is never filled or coloured: the cover's one filled button is
  the hero's call to action.
- Live studies appear as large **plates** (a live preview in the study's own
  palette). Planned studies appear as compact contents rows. Hierarchy comes from
  status, not from identical cards.
- The pages end with **Sources** (every credit) and then the hub's only
  footer, one quiet row: the wordmark (back to the cover), All studies,
  Sources and licences, Contribute, Report a mistake, then X and GitHub, the
  copyright and *Soli Deo Gloria* (linked to Psalm 115:1). In a window too
  narrow for one row, X, GitHub and the copyright wrap to a second row,
  right-aligned; links never break mid-phrase. Studies have no footer; their
  way in is the Contribute menu.
- Under the cover, a **carousel** presents the newest live studies (up to
  `SITE.recentStudyCount`, five; most recently released or updated first) one
  plate at a time. Each plate plays its demo as it arrives. A row of tabs
  beneath names every study in it, the current one's hairline filling as its
  time runs, with a pause button first. With a single study there are no tabs
  and nothing rotates.
- 8 px grid. Radii follow hierarchy: plates 16, panels 10, controls 8, tags 5.
  Shadows only on things that truly float (menus, the command palette, popovers).

## Desk and iPad

Scripture Tools is made for the two places people study at length: a desk and
an iPad. Every page, and every study from now on, works on both. On a phone,
the index works too, so anyone can see what is here; the studies show a phone
the device gate instead (below).

### Who gets what

A blocking script in `<head>` (`DeviceBootScript`) sorts the device before
the first paint, by its screen rather than its window, so turning it or
splitting the screen never changes the answer:

| Device | Rule | Gets |
|---|---|---|
| Computer | anything with a fine pointer (touchscreen laptops included) | the app |
| Tablet | touch-first, shorter screen side at least `SITE.minTabletWidth` (600 px) | the app, tuned for touch (`html[data-device="tablet"]`) |
| Phone | touch-first, shorter side under 600 px, even held sideways | the index, laid out for a phone; on a study, the device gate (`html[data-device="phone"]`) |

Pages a phone can browse are listed in `PHONE_PAGES`
(`src/components/device/phone-pages.ts`); today that is the index. While one is
on screen, `<html>` carries `data-phone-page` (set by the boot script on first
load and by `DeviceRoute` as the reader moves between pages), and the gate
stays away. A new page that works at phone width joins the list; a study
never does.

A window narrower than `SITE.minWindowWidth` (500 px: Slide Over, a squeezed
browser) shows the gate's other face on a study, asking for a wider window;
widening it brings everything back as it was. The index fits any width.

### Layout by width

- **1024 px and up** (`SITE.dockedPanelsWidth`; a computer, an iPad on its
  side): the full layout. A study's outline, canvas and inspector sit side by
  side.
- **Under 1024 px** (an iPad held upright): the hub's carousel and contents
  stack, the thumb index slims to its names, and in a study the canvas takes
  the width. The outline slides over it from the left. The inspector sits
  beneath it at a height the reader drags, or drags down to put away, and
  choosing something brings it up. A wide inspector can lay content side by
  side (`@container/inspector`), as Revelation's mirror does with a pair's two
  halves.
- **Under 720 px**: the thumb index steps aside, and top-bar buttons with a
  `shortLabel` show only their icons.
- **Under 640 px** (a phone, on the index only): one column with 20 px
  gutters. The cover's navigation keeps Studies and shows Contribute and
  Search as icons; its two buttons stack full width; under the cross-reference
  figure a colour key names the canon groups, since the bands are too narrow
  to label; study rows use smaller thumbnails; the footer stacks.

### Touch rules (for every study)

1. **Size for a finger.** Under `pointer-coarse:` controls grow from 32 to
   40 px, the top bar from 48 to 56, and list rows to at least 36. The shell's
   parts (`ToolButton`, `Segmented`, `InspectorTabs`, `ShellSearch`) do this
   already; size anything new the same way. Marks in a diagram get an
   invisible hit area of at least ~24 px (`useCoarsePointer` for sizes drawn
   in script).
2. **Hover only previews.** Gate hover handlers with `canHover`
   (`src/lib/pointer.ts`) so a tap selects instead of leaving a preview stuck.
   Nothing may be reachable only by hovering.
3. **Every shortcut has a button.** Keys are a shortcut, never the only way:
   arrow keys have step buttons, `[` and `]` have panel toggles, F has Fold.
   Keyboard hints (`⌘K`, "Press F") hide under `pointer-coarse:`, and hint copy
   says what a finger does instead ("Point at a book" becomes "Touch a book").
4. **Gestures stay simple.** Tap to choose; slide to scrub along a scale
   (`touch-pan-y`, so vertical swipes still scroll the page); drag only a
   visible handle. No long-press-only and no multi-finger-only actions.
5. **Text you read stays selectable; chrome doesn't.** Scripture can be
   selected and copied. Diagram labels and controls are `select-none`, so a
   long press doesn't select them.
6. **Feedback without hover.** Hover styles only apply where hover exists
   (Tailwind's `hover:`), so pressed controls also get an `active:` state.
   Taps never flash grey and never wait for a double-tap.
7. **Check it on both.** Look at every change at 1440×900, iPad landscape
   (1180×820) and iPad upright (820×1180), by touch as well as by mouse.

### The phone gate

On a study, a phone sees the gate. It says what the link opens (the study's
name and summary), then offers to send the link to a tablet or computer (the
system share sheet), copy it, preview the desktop layout scaled to fit, or go
back to browse every study on the index. On a phone held sideways it lays out
in two columns. The preview is remembered, and applies to studies only: the
index always shows a phone its own layout.

### On the home screen

Added to an iPad's home screen, the site opens full screen like an app
(`app/manifest.ts`, `app/apple-icon.tsx`). With no address bar there, each
study's **Share** button is how a view gets passed on.

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

Under 1024 px the same frame rearranges (see **Desk and iPad**): the outline
slides over the canvas and the inspector moves beneath it.

The top bar always ends with **Share** and **Contribute** (before the
inspector toggle). Share sends a link to the exact view, hash included: the
share sheet under a finger, the clipboard elsewhere. **Contribute** is
rendered by `StudyShell` from the study's `slug`. It offers to report a mistake or suggest an
improvement (a GitHub issue prefilled with the study and the exact view, hash
included), or read the study's code, then the project on GitHub. The hub's navigation
opens the same menu (`SiteContributeMenu`) for the whole project. Links are built in `src/lib/contribute.ts`
from `SITE.repo`.

Shareable state lives in the URL hash. Every study has a keyboard path through
its main interaction and visible focus, and a touch path through everything
(see the touch rules). Panels collapse with `[` and `]`. Pass the shell the
reader's current choice as `selection`, so that under 1024 px choosing
something brings up the inspector.

## Motion

Use `motion` for UI transitions; canvas animation runs on
`requestAnimationFrame`. Durations: 120 ms for hover/press, 200–280 ms for
panels and popovers, up to 2.4 s for an orchestrated moment.
Ease-out for entrances, ease-in-out for moves. Under reduced motion, render the
final frame.

The cover's light is the one thing that keeps moving, and it follows the same
rules as the data: it is the arcs' own pigment, never a wash laid over them. A
front reads from Genesis to Revelation every 18 s. As it reaches the earlier
chapter of each link, light runs along the arc to the later chapter, at
300 px/s, with a white-hot head, a tail in the arc's colour, and an afterglow
that settles in about 2 s. The resting arcs dim to 80% to give it room. The
strongest links carry the most light; weak links only glow. Each arc starts a
little early or late and runs a little fast or slow, so the heads never march
in step. Pointing at a book fades the light out in 200 ms and holds it in
place until the pointer leaves. It never runs under reduced motion or without
WebGL2; the woven figure then simply stays still.

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
