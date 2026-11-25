# Cross references

`public/data/xrefs/chapter-arcs.json`, built by `npm run data:xrefs`
(`scripts/data/xrefs.ts`, with `scripts/data/xrefs/{source,parse,resolve}.ts`).

## Source and licence

[OpenBible.info Bible cross references](https://www.openbible.info/labs/cross-references/),
licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The dataset
is regenerated daily as readers vote, so the pipeline records the export date
and the archive's SHA-256 instead of pinning a hash.

Required credit wherever the data appears (`XREFS_CREDIT` in
`src/lib/xrefs/credit.ts`): **"Cross references from OpenBible.info, licensed
CC BY 4.0; adapted for the KJV."** The index page credits it in its Sources
section.

## Processing

1. Parse every row (OSIS references, ranges, net votes). Unexpected syntax
   fails the run with a line number.
2. Keep rows with positive votes whose references are KJV verses, remapping the
   few places where English versifications differ from the KJV (for example
   3 John 1:15 → 1:14). Rows referring to a verse the KJV lacks are dropped.
3. Aggregate to undirected pairs of distinct chapters (global chapter index
   0–1188); the weight is the number of verse-level references between them.
4. Keep every pair at or above the lowest weight that fits a 250 KB budget.

## Numbers (export of 2026-11-23)

- 344,799 rows; 341,389 kept; 5 remapped.
- 141,009 distinct chapter pairs; the file keeps the 14,001 with 5 or more
  references (strongest: 187). 177 KB.
- Checks: Isaiah 53 and 1 Peter 2 share 13 references; Genesis 1 and John 1, 6.

Per-verse lookups for a future KJV reader can be generated from the same
resolved rows.
