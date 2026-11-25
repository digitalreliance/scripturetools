/**
 * Builds public/data/xrefs/chapter-arcs.json from OpenBible.info's cross
 * references: every pair of chapters linked by at least one well-voted
 * cross reference, weighted by how many verse-level references join them.
 *
 *   npm run data:xrefs              reuse the cached download
 *   npm run data:xrefs -- --refresh download today's export
 *
 * The per-verse lookup files a future KJV reader needs can be added here from
 * the same resolved rows.
 */
import path from "node:path";
import { strFromU8, unzipSync } from "fflate";
import { BOOKS, TOTAL_CHAPTERS, globalChapterIndex } from "../../src/lib/bible/canon";
import { XREFS_CREDIT } from "../../src/lib/xrefs/credit";
import type { ChapterArcs, ChapterLink } from "../../src/lib/xrefs/types";
import { downloadCached } from "./lib/download";
import { formatBytes, writeFileIfChanged } from "./lib/write";
import { parseXrefFile } from "./xrefs/parse";
import { resolveRows } from "./xrefs/resolve";
import { XREFS_EXPECTED, XREFS_SOURCE } from "./xrefs/source";

const ROOT = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(ROOT, "public/data/xrefs/chapter-arcs.json");
/** Size budget for the hero's data file. */
const MAX_BYTES = 250 * 1024;

function fail(message: string): never {
  console.error(`data:xrefs failed: ${message}`);
  process.exit(1);
}

async function main() {
  const refresh = process.argv.includes("--refresh");
  const file = await downloadCached(XREFS_SOURCE.url, path.join(ROOT, XREFS_SOURCE.cacheFile), { refresh });
  console.log(`source ${file.cached ? "(cached)" : "(downloaded)"} ${formatBytes(file.bytes.length)} sha256 ${file.sha256.slice(0, 12)}…`);

  const tsv = unzipSync(file.bytes)[XREFS_SOURCE.entry];
  if (!tsv) fail(`${XREFS_SOURCE.entry} missing from the archive`);
  const parsed = parseXrefFile(strFromU8(tsv));
  if (parsed.license !== XREFS_SOURCE.licenseMarker) {
    fail(`licence marker is "${parsed.license}", expected "${XREFS_SOURCE.licenseMarker}"; review the licence`);
  }
  const rows = parsed.rows.length;
  if (rows < XREFS_EXPECTED.minRows || rows > XREFS_EXPECTED.maxRows) fail(`unexpected row count ${rows}`);

  const { xrefs, stats } = resolveRows(parsed.rows);
  if (stats.kept / rows < XREFS_EXPECTED.minKeptShare && stats.kept / (rows - stats.dropped.votes) < XREFS_EXPECTED.minKeptShare) {
    fail(`only ${stats.kept} of ${rows} rows survived resolution`);
  }

  // Undirected chapter pairs: a < b, weight = verse-level references in either direction.
  const weights = new Map<number, number>();
  for (const xref of xrefs) {
    const from = globalChapterIndex(xref.from.book, xref.from.chapter);
    for (const target of xref.targets) {
      const to = globalChapterIndex(target.book, target.chapter);
      if (from === to) continue;
      const key = Math.min(from, to) * TOTAL_CHAPTERS + Math.max(from, to);
      weights.set(key, (weights.get(key) ?? 0) + 1);
    }
  }
  const all: ChapterLink[] = [...weights].map(
    ([key, w]) => [Math.floor(key / TOTAL_CHAPTERS), key % TOTAL_CHAPTERS, w] as const,
  );

  const books = BOOKS.map((b) => ({ id: b.id, start: globalChapterIndex(b.id, 1), chapters: b.chapters }));
  const build = (minWeight: number): ChapterArcs => {
    const links = all
      .filter((l) => l[2] >= minWeight)
      .sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    return {
      version: 1,
      chapters: TOTAL_CHAPTERS,
      books,
      links,
      maxWeight: links.reduce((max, l) => (l[2] > max ? l[2] : max), 0),
      minWeight,
      totals: {
        rows,
        kept: stats.kept,
        dropped: rows - stats.kept,
        remapped: stats.remappedRows,
        links: all.length,
        linksKept: links.length,
      },
      source: {
        name: XREFS_CREDIT.name,
        url: XREFS_CREDIT.url,
        license: XREFS_CREDIT.license,
        licenseUrl: XREFS_CREDIT.licenseUrl,
        attribution: XREFS_CREDIT.text,
        retrieved: parsed.exportDate,
        sha256: file.sha256,
      },
    };
  };

  // Raise the threshold until the file fits; every pair at least that strong is kept.
  let minWeight = 1;
  let json = JSON.stringify(build(minWeight));
  while (json.length > MAX_BYTES) json = JSON.stringify(build(++minWeight));

  const written = writeFileIfChanged(OUT, json);
  const out = JSON.parse(json) as ChapterArcs;
  console.log(
    `rows ${rows}, kept ${stats.kept}, remapped ${stats.remappedRows}, chapter pairs ${all.length}; ` +
      `kept ${out.links.length} pairs with weight >= ${minWeight} (max ${out.maxWeight}), ` +
      `${formatBytes(json.length)} ${written ? "written" : "unchanged"}`,
  );
}

main().catch((err) => fail(err instanceof Error ? err.stack ?? err.message : String(err)));
