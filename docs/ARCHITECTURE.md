# Architecture

Scripture Tools is one index page that opens onto many small, self-contained
"studies": interactive maps, diagrams, timelines and symbol guides, each built
on the public-domain King James text. This document records the stack, how the
pieces fit, and why.

## The stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router), fully static** | Every page is content that doesn't change per visitor, so the whole site is prerendered and served from a CDN: instant loads, near-zero hosting cost, nothing to keep running. Each study is its own route, so its code and data only load when someone opens it. Server features (accounts, AI) can be added later without a rewrite. |
| Hosting | **Vercel** | Static assets on a global CDN, preview deploys per branch, and functions available the day we need them. Cloudflare Pages or Netlify would also work because the build is static. |
| Language | **TypeScript, strict** | The data (66 books, 31,102 verses, cross references) has exact shapes; types catch mistakes before they ship. |
| Styling | **Tailwind CSS v4** + CSS-variable tokens | Tokens in one file (`src/app/globals.css`); each study's palette is swapped in through CSS variables, so one set of components renders in every identity. |
| UI primitives | **Radix** (`radix-ui`), **cmdk**, **lucide-react** | Accessible dialogs, tabs, toggles and a command palette without inheriting someone else's look. No shadcn: the design is bespoke, so we own thin wrappers instead. |
| Motion | **motion** (the Framer Motion successor) | Declarative, interruptible UI transitions. Dense visuals animate on `requestAnimationFrame` directly. Add **GSAP** only for long scroll-choreographed explainers, and **Rive** for illustrated character animation. |
| Diagrams | **SVG + d3 modules** (`d3-scale`, `d3-shape`, `d3-array`) | React renders the marks, d3 does the maths. Right for anything under ~2,000 marks: chiasms, timelines, family trees, outlines. |
| Dense visuals | **Canvas 2D**, plus raw **WebGL2** for marks that animate every frame | 2,000 to 100,000 marks: cross-reference arcs, word frequencies. Static marks are drawn once to a 2D canvas. Marks that change every frame go to the GPU: the cover's moving light is a small WebGL2 overlay (`src/components/hub/arc-light.ts`, no library) that draws only the arcs lit at that moment, and it adds onto the 2D canvas with `mix-blend-mode: plus-lighter`. |
| Maps (next) | **MapLibre GL JS** + **Protomaps PMTiles**, **deck.gl** overlays | Open source, no API key or per-view billing. The basemap is one PMTiles file on the CDN. deck.gl draws journeys and regions on the GPU. Places come from OpenBible.info's Bible geocoding (CC BY). |
| 3D (later) | **React Three Fiber** + drei | The tabernacle and temple built to their stated cubits. Lazy-loaded so no other page pays for three.js. |
| Data | Build-time pipelines in `scripts/data` writing versioned JSON to `public/data` | Sources are downloaded once, validated (counts, schemas) and committed, so builds never depend on a third-party API. |
| Search | ⌘K palette now; full-text verse search later | Today the palette searches studies, books and references with no index. Full-text search will use a prebuilt index (MiniSearch in a Web Worker, or Pagefind), still with no server. |
| State | React state + URL hash | Shareable views (`#view=arcs&level=RR`) without making pages dynamic. Add Zustand only if a study's state outgrows a component tree. |
| Tests | **Vitest** for data and logic; **Playwright** next | Data tests guard the KJV (66 books, 1,189 chapters, 31,102 verses) and every derived dataset. Playwright will smoke-test and screenshot each study. |

## How the pieces fit

```
 eBible.org (KJV, USFM)        OpenBible.info (cross refs)       future: places, Strong's…
          │                              │                                 │
          ▼                              ▼                                 ▼
  scripts/data/kjv.ts           scripts/data/xrefs.ts              scripts/data/<name>.ts
          │   download → parse → validate → write (fails loudly on bad counts)
          ▼
  public/data/kjv/books/REV.json    public/data/xrefs/…    (committed, served by the CDN)
          │                                   │
          ├── build time: src/lib/*/server.ts (readFileSync) → prerendered HTML
          └── in the browser: src/lib/*/client.ts (fetch, memoised) → interactive views
```

### Folders

```
src/
  app/                 routes only, kept thin
    page.tsx           the hub: cover, contents, thumb index
    read/…             (next) the KJV reader, 1,189 prerendered chapter pages
    studies/<slug>/    one route per study
  studies/
    registry.ts        the catalogue: every study, its category, status, palette
    palettes.ts        study identities (CSS-variable palettes)
    <slug>/            a study's own components, data and hooks
  components/
    shell/             StudyShell: the frame every study shares
    hub/               the index page
    bible/             VerseText, Passage
    device/            the phone and tablet gate
    primitives/        Kbd and other tiny pieces
  lib/
    bible/             canon, references, versification, markup, loaders
    xrefs/             cross-reference loaders
    hooks/             shared hooks (hash state)
    routes.ts          every internal URL
scripts/data/          dataset pipelines
public/data/           generated datasets
docs/                  this file, DESIGN.md, data/ (sources and licences)
```

### The study contract

A study (micro-app) is a feature folder plus a thin route. To add one:

1. Add an entry to `src/studies/registry.ts` (category, palette, illustration, status `planned`).
   The illustration (`src/components/hub/illustrations`) doubles as the study's demo: the hub's
   carousel plays the plate's animation when it presents the study, so let it show what the
   study does, in at most ~6 s.
2. Build it in `src/studies/<slug>/`. Render inside `StudyShell` so it inherits the
   top bar, outline, inspector, status bar, panel shortcuts and palette theming.
3. Put its data in `src/studies/<slug>/data/` (small, hand-curated) or produce it with a
   pipeline into `public/data/<name>/` (large or derived). Test the data.
4. Add `src/app/studies/<slug>/page.tsx`: read whatever the page needs at build time,
   pass only that to the client component, export `metadata`.
5. Keep shareable state in the hash with `useHashParam`.
6. Flip the status to `live` and set `released` to that day (`YYYY-MM-DD`). The hub and the ⌘K
   palette pick it up automatically. (`SITE.showPlannedStudies` in `src/lib/site.ts` controls
   whether planned studies are listed at all.)
7. Later, when a change is worth a second look (a new view, more data, not a fix), set
   `updated` to that day. The hub's carousel shows the `SITE.recentStudyCount` (five) most
   recently released or updated studies, newest first (`recentStudies` in the registry).

Studies never import each other. Shared needs move into `src/lib` or `src/components`.

### Rendering rules (Next.js 16.4)

- The root layout exports `ensureStatic = 'navigation'`: the build fails if any route
  needs request-time rendering. That keeps the whole site CDN-only.
- Server code reads data with `fs.readFileSync` in `server-only` modules.
- Client components are used only where something is interactive. Browser-only
  parts (canvas, localStorage, device checks) render after hydration or behind
  `use(browser())` with a `<Suspense>` fallback.
- Pass the minimum data across the server/client boundary: a study page reads its
  verses at build time and hands the client only those verses.

## Devices

The experience is designed for desktop (1024 px and up). A blocking script in
`<head>` marks phones and tablets before the first paint, so they see a
full-screen "best on a computer" screen instead of a broken layout. It offers to
copy or share the link, and a "Preview anyway" option that renders the desktop
layout at 1280 px wide, scaled to fit the screen. The choice is remembered.

## Budgets

- Hub: under 170 KB of compressed JavaScript before interaction, measured as
  below; largest paint under 2 s on desktop broadband.
- A study: under 250 KB of its own JavaScript; data fetched lazily and cached by
  the CDN.
- 60 fps for hover, pan and zoom. Above ~2,000 marks, draw to canvas.
- Ambient motion costs nothing when no one is looking: the cover's light stops
  when the figure is off screen or the tab is hidden, holds while a book is in
  focus, runs at most about 60 frames a second, and asks the browser for the
  low-power GPU.
- Every visual has a keyboard path, visible focus, a reduced-motion version, and a
  text alternative (a list, table or summary of what it shows).

### Measuring the hub

Build, then add up the gzipped size of every script the hub makes a browser
load (KB here is 1,024 bytes):

```bash
npm run build
grep -oE '<script src="/_next/static/chunks/[^"]+\.js"[^>]*>' .next/server/app/index.html \
  | grep -v noModule | grep -oE '/_next/static/chunks/[^"]+\.js' | sort -u \
  | while read -r chunk; do gzip -9 -c ".next${chunk#/_next}" | wc -c; done \
  | awk '{ total += $1 } END { print total }'
```

Two things are left out on purpose:

- **The `noModule` polyfill bundle** (38.5 KB), which Next.js adds to every page
  for browsers without JavaScript modules. Browsers with modules, which is every
  browser that can run this site, skip it without downloading it. Counting it
  would put 170 KB out of reach for any page: an empty Next.js 16.4 page with one
  link and our error boundary comes to 177.6 KB with it and 139.1 KB without.
- **Code fetched once the page is interactive**: the ⌘K palette, which loads the
  first time it opens, and the code of studies whose links are on screen, which
  Next.js prefetches at low priority so they open instantly. Prefetched code
  counts against that study's budget.

Those 139.1 KB are Next.js and React, which leaves the hub about 31 KB for its
own code. In November 2026 it used 18 KB, for 156.7 KB in all, about 4 KB of it
the cover's light and 2 KB the carousel; before the ⌘K palette and
tailwind-merge were taken out of the first load, it was 183.8 KB.
To keep it there:

- Render on the server whatever doesn't respond to the visitor. A Client
  Component brings everything it imports into the page's JavaScript, so keep the
  `"use client"` part small and pass server-rendered children into it, as
  `SearchButton` does. lucide-react icons are Client Components even when a
  Server Component renders them.
- Load on first use whatever the first paint doesn't need. Each page ships only a
  small launcher for the ⌘K palette; never import
  `src/components/command/CommandDialog.tsx` (cmdk, Radix Dialog, the registry,
  the reference parser) statically.
- In the hub's Client Components, join classes with `clsx` unless they really
  need merging: `cn` brings in tailwind-merge (about 9 KB).
- `npx next analyze` shows what each chunk holds and which import pulled it in.

## Content and licences

| Content | Source | Licence | Status |
|---|---|---|---|
| King James Version (1769 text) | eBible.org | Public domain (Crown patent applies in the UK only) | Installed |
| Cross references (~340,000) | OpenBible.info | CC BY | Installed |
| Revelation chiasm structure | Chart supplied by the project owner | Attribution being confirmed | Installed |
| Bible places, coordinates | OpenBible.info Bible geocoding | CC BY | Next |
| Strong's numbers and lexicon | Public domain originals (via Open Scriptures) | Public domain / CC BY-SA for the digitisation | Later |
| Hebrew and Greek texts | OSHB (Hebrew), SBLGNT (Greek) | CC BY 4.0 | Later |
| Modern English (optional) | Berean Standard Bible, World English Bible | Public domain | Later |
| Basemap | Protomaps (OpenStreetMap data) | ODbL | Next |

Every dataset gets a note in `docs/data/` and an on-screen credit wherever it appears.

## Roadmap

1. **Now:** the hub (the index), the device gate, the KJV and its cross
   references installed as data, and the first study: Revelation's mirror.
2. **Next:** one study at a time, chosen by the project owner. Candidates: the
   KJV reader (data and library are ready), the cross-reference atlas, the maps
   foundation (MapLibre, places, Paul's journeys), the kings timeline, the word
   explorer. Also Playwright in CI and Vercel Analytics.
3. **Later:** accounts for bookmarks, notes and progress (an auth provider plus
   Postgres from the Vercel Marketplace); an editor-friendly CMS if non-developers
   write studies (MDX in the repo until then); an "ask about this passage" helper
   that answers only from the KJV and the study's data, with citations.
4. **After that:** original-language interlinears, more translations, other
   languages, offline reading.

## Decisions

- **Static over server-rendered.** The content is the same for everyone. Static is
  faster, cheaper and has nothing to break at 3 a.m.
- **Data committed to the repo.** Builds are reproducible and don't depend on
  third-party uptime. Pipelines can be rerun at any time.
- **Hash state over search params.** Search params would force request-time
  rendering in this Next.js version; the hash never leaves the browser.
- **Radix over shadcn.** We want accessibility primitives, not a starting look.
- **Registry dates over git history.** The carousel's order comes from `released` and
  `updated` in the registry, not from commit dates: builds stay reproducible (CI and
  Vercel clone shallowly), and a typo fix doesn't count as news.
- **MapLibre over Mapbox or Cesium.** No keys or metered billing; Cesium's globe
  and terrain are more than a Bible atlas needs.
