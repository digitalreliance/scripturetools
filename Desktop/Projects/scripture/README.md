# Scripture

See how the Bible fits together. An index of interactive, visual Bible studies
(maps, diagrams, timelines, symbols and typography), each a small, self-contained
app built on the public-domain King James text.

Designed for desktop. Phones and tablets get a "best on a computer" screen with
an optional scaled preview.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static production build
npm test             # data and logic tests
npm run typecheck
npm run lint
```

Datasets are committed under `public/data`. To rebuild them from their sources:

```bash
npm run data:kjv     # King James Version from eBible.org
npm run data:xrefs   # cross references from OpenBible.info
```

To screenshot a page (uses your installed Google Chrome):

```bash
npx tsx scripts/dev/shot.ts http://localhost:3000/ shot.png --w 1440 --h 900
```

## Read next

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): the stack, how studies plug in, budgets, roadmap
- [docs/DESIGN.md](docs/DESIGN.md): principles, tokens, type, layout, motion, writing
- [docs/data/](docs/data/): every dataset's source and licence
- [CLAUDE.md](CLAUDE.md): rules for working in this codebase (Next.js 16.4 specifics)
