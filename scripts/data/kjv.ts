/**
 * npm run data:kjv: install the King James Version as local, validated data.
 *
 *   1. Download eBible.org's KJV USFM archive into .cache/ (reused when present)
 *      and check it against the pinned SHA-256 (scripts/data/kjv/source.ts).
 *   2. Parse the 66 canonical books (scripts/data/kjv/usfm.ts).
 *   3. Validate them (scripts/data/kjv/validate.ts); any problem aborts the run.
 *   4. Write public/data/kjv/books/{ID}.json, public/data/kjv/index.json and
 *      src/lib/bible/generated/kjv-meta.ts. Unchanged files are left untouched.
 *
 * Flags:
 *   --refresh           download again even when the archive is cached
 *   --allow-new-source  build from an archive whose SHA-256 differs from the pin
 */
import fs from "node:fs";
import path from "node:path";
import { unzipSync } from "fflate";
import { BOOK_IDS, isBookId, type BookId } from "../../src/lib/bible/canon";
import type { KjvIndex } from "../../src/lib/bible/types";
import { downloadCached } from "./lib/download";
import { formatBytes, writeFileIfChanged } from "./lib/write";
import {
  KJV_SCHEMA_VERSION,
  buildIndex,
  formatBookJson,
  formatIndexJson,
  formatMetaModule,
} from "./kjv/emit";
import { KJV_SOURCE, KJV_TRANSLATION_INFO } from "./kjv/source";
import { parseUsfmBook, readUsfmBookId, type ParsedBook, type UsfmStats } from "./kjv/usfm";
import { validateKjv } from "./kjv/validate";

const FLAGS = new Set(["--refresh", "--allow-new-source"]);
const OUT_DIR = "public/data/kjv";
const META_MODULE = "src/lib/bible/generated/kjv-meta.ts";

const fmt = (n: number) => n.toLocaleString("en-US");

async function main() {
  const root = process.cwd();
  if (!fs.existsSync(path.join(root, "src/lib/bible/canon.ts"))) {
    throw new Error("Run from the repository root: npm run data:kjv");
  }
  const args = process.argv.slice(2);
  const unknown = args.filter((a) => !FLAGS.has(a));
  if (unknown.length) throw new Error(`Unknown flag(s): ${unknown.join(" ")}`);

  // 1. Source archive.
  const archive = await downloadCached(KJV_SOURCE.url, path.join(root, KJV_SOURCE.cacheFile), {
    refresh: args.includes("--refresh"),
  });
  console.log(`source   ${KJV_SOURCE.url}`);
  console.log(`         ${archive.cached ? "cached" : "downloaded"}, ${formatBytes(archive.bytes.length)}, sha256 ${archive.sha256}`);
  if (archive.sha256 !== KJV_SOURCE.sha256) {
    const message =
      `The archive's SHA-256 (${archive.sha256}) differs from the pinned ${KJV_SOURCE.sha256}: ` +
      "eBible.org has republished it. Inspect the new archive, then update scripts/data/kjv/source.ts.";
    if (!args.includes("--allow-new-source")) throw new Error(`${message} (Or rerun with --allow-new-source.)`);
    console.warn(`warning  ${message} Continuing because of --allow-new-source.`);
  }

  // 2. Parse the canonical books; skip anything else in the archive.
  const files = unzipSync(archive.bytes, { filter: (f) => f.name.toLowerCase().endsWith(".usfm") });
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const parsed = new Map<BookId, ParsedBook>();
  const skipped: string[] = [];
  for (const name of Object.keys(files).sort()) {
    const src = decoder.decode(files[name]);
    const id = readUsfmBookId(src);
    if (!id || !isBookId(id)) {
      skipped.push(id ?? name);
      continue;
    }
    if (parsed.has(id)) throw new Error(`Two files for ${id} in the archive`);
    parsed.set(id, parseUsfmBook(src, name));
  }
  const missing = BOOK_IDS.filter((id) => !parsed.has(id));
  if (missing.length) throw new Error(`Books missing from the archive: ${missing.join(", ")}`);
  const books = BOOK_IDS.map((id) => parsed.get(id)!.book);

  // 3. Validate: throws on any problem.
  const totals = validateKjv(books);

  // 4. Write.
  const booksDir = path.join(root, OUT_DIR, "books");
  let changed = 0;
  let bytes = 0;
  for (const book of books) {
    const json = formatBookJson(book);
    bytes += Buffer.byteLength(json);
    if (writeFileIfChanged(path.join(booksDir, `${book.id}.json`), json)) changed++;
  }
  let removed = 0;
  for (const file of fs.readdirSync(booksDir)) {
    if (file.endsWith(".json") && !isBookId(file.slice(0, -5))) {
      fs.rmSync(path.join(booksDir, file));
      removed++;
    }
  }

  // Keep generatedAt when nothing changed, so a rerun leaves git clean.
  const indexFile = path.join(root, OUT_DIR, "index.json");
  const previous = readJson<KjvIndex>(indexFile);
  const unchanged =
    changed === 0 &&
    removed === 0 &&
    previous?.schemaVersion === KJV_SCHEMA_VERSION &&
    previous.translation?.sha256 === archive.sha256 &&
    JSON.stringify(previous.totals) === JSON.stringify(totals);
  const generatedAt = unchanged ? previous.translation.generatedAt : new Date().toISOString();

  const index = buildIndex(books, { ...KJV_TRANSLATION_INFO, sha256: archive.sha256 }, totals, generatedAt);
  const indexChanged = writeFileIfChanged(indexFile, formatIndexJson(index));
  const metaChanged = writeFileIfChanged(path.join(root, META_MODULE), formatMetaModule(index));

  // Summary.
  const stats = [...parsed.values()].reduce<UsfmStats>(
    (sum, { stats: s }) => {
      for (const k of Object.keys(sum) as (keyof UsfmStats)[]) sum[k] += s[k];
      return sum;
    },
    { paragraphs: 0, titles: 0, colophons: 0, acrostics: 0, notes: 0, divineNameInSupplied: 0, midVerseParagraphs: 0 },
  );
  const spans = { i: 0, j: 0, n: 0 };
  for (const book of books) {
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        for (const m of verse.t.matchAll(/<([ijn])>/g)) spans[m[1] as keyof typeof spans]++;
      }
    }
  }
  if (skipped.length) console.log(`skipped  ${skipped.join(", ")}`);
  console.log(
    `valid    ${totals.books} books · ${fmt(totals.chapters)} chapters · ${fmt(totals.verses)} verses · ${fmt(totals.words)} words`,
  );
  console.log(
    `markup   <i> ${fmt(spans.i)} · <j> ${fmt(spans.j)} · <n> ${fmt(spans.n)} spans` +
      ` (${stats.divineNameInSupplied} divine names inside supplied words kept as <n>)`,
  );
  console.log(
    `extras   ${fmt(stats.paragraphs)} paragraph starts · ${stats.titles} Psalm titles · ` +
      `${stats.acrostics} acrostic headings · ${stats.colophons} colophons · ${fmt(stats.notes)} notes`,
  );
  if (stats.midVerseParagraphs) console.log(`note     ${stats.midVerseParagraphs} paragraph breaks fall mid-verse`);
  console.log(
    `wrote    ${OUT_DIR}/books: 66 files, ${formatBytes(bytes)} (${changed} changed${removed ? `, ${removed} removed` : ""})`,
  );
  console.log(`         ${OUT_DIR}/index.json (${indexChanged ? "updated" : "unchanged"})`);
  console.log(`         ${META_MODULE} (${metaChanged ? "updated" : "unchanged"})`);
}

function readJson<T>(file: string): T | undefined {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return undefined;
  }
}

main().catch((error: unknown) => {
  console.error(`\ndata:kjv failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
