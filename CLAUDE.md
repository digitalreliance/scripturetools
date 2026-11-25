@AGENTS.md

# Scripture — project guide

A desktop-first web app: one index page of interactive visual Bible studies
(maps, diagrams, timelines, symbols, typography), each study a self-contained
micro-app, all built on the public-domain King James text.

## Commands

- `npm run dev` / `npm run build` / `npm start`
- `npm run typecheck` · `npm run lint` · `npm test`
- `npm run data:kjv` rebuilds `public/data/kjv` from eBible.org (download cached in `.cache/`)
- `npm run data:xrefs` rebuilds `public/data/xrefs` from OpenBible.info

## Next.js 16.4 rules for this repo

Read `node_modules/next/dist/docs/` when unsure; this version differs from older training data.

- Cache Components and Partial Prefetching are on. The root layout exports
  `ensureStatic = 'navigation'`, so every route must prerender completely:
  no `cookies()`, `headers()` or server-side `searchParams`, and no uncached async I/O.
- Server data: `fs.readFileSync` (or module-scope reads) inside `import 'server-only'`
  modules, or functions marked `'use cache'`. Never `await readFile()` inside a component.
- Dynamic routes export `generateStaticParams()` returning every param combination.
- `params` is a Promise; type pages with the global `PageProps<'/route/[param]'>`.
- Browser-only UI (canvas, localStorage, device checks): a client component that calls
  `use(browser())` from `react-dom` inside `<Suspense>`, or renders after mount.
  Avoid `useSearchParams`; keep shareable study state in the URL hash.
- `middleware.ts` is now `proxy.ts`. `next lint` is gone; use `npm run lint`.
- The Tailwind loader rule in `next.config.ts` must skip `*.module.css`: its `as: "*.css"`
  would turn CSS Modules into global CSS and empty their class maps.
- `next dev` and `next build` cannot run twice at once on this project (lockfile).

## Layout

- `src/app` — routes only, kept thin. Hub at `/`, reader at `/read/[book]/[chapter]`,
  studies at `/studies/<slug>`.
- `src/studies/<slug>/` — one feature folder per study (components, data, hooks).
  Every study is registered in `src/studies/registry.ts`.
- `src/components/shell` — `StudyShell`, the shared pro-tool frame all studies use.
- `src/components/primitives` — small primitives (no shadcn; Radix via `radix-ui`). `src/components/bible` — `VerseText` and friends.
- `src/lib/bible` — canon (66 books), references, versification, markup, loaders.
- `public/data` — generated datasets. Never hand-edit; regenerate with `scripts/data`.
- `docs/` — `ARCHITECTURE.md`, `DESIGN.md`, and `data/*.md` source and licence notes.

## Conventions

- Book ids are USFM codes (`GEN`, `1SA`, `PSA`, `JHN`, `REV`…). Canonical reference
  strings: `REV 12:9`, `REV 12:9-11`, `REV 4:10-5:1`, `REV 12`.
- Build every internal URL with `src/lib/routes.ts`.
- A live study has `released` (`YYYY-MM-DD`) in the registry; set `updated` when a change is
  worth a second look. The hub carousel shows the newest five by these dates.
- Verse markup: `<i>` translators' supplied words (italic), `<j>` words of Christ
  (red letter), `<n>` the divine name (LORD in small capitals). Render with
  `<VerseText>`; never `dangerouslySetInnerHTML`.
- Design tokens live in `src/app/globals.css`; follow `docs/DESIGN.md`.
- Credit every non-KJV dataset (source and licence) in `docs/data/` and wherever the UI shows it.
- The project's principles come first (README, "The text stays as it is"): never change
  the KJV text, never write commentary or argue for an interpretation, and credit and
  label everything that comes from outside the text.
- Contribute links (GitHub issue forms in `.github/ISSUE_TEMPLATE`) are built in
  `src/lib/contribute.ts`; keep their field ids in step with the forms.
- The repository's owner is set once, in `SITE.repo` (`src/lib/site.ts`). Docs link to issues
  relatively (`../../issues/...`); `repository.test.ts` lists any file still naming an old owner.
