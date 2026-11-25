/**
 * The OpenBible.info cross-reference dataset.
 *
 * OpenBible regenerates the archive every day as readers vote, so unlike the
 * KJV archive it cannot be pinned by SHA-256. Instead the pipeline checks the
 * file's format and licence marker, and records the export date from its
 * header and the archive's SHA-256 in chapter-arcs.json.
 */
export const XREFS_SOURCE = {
  /** A zip holding one TSV file (~2 MB). */
  url: "https://a.openbible.info/data/cross-references.zip",
  /** The TSV inside the archive. */
  entry: "cross_references.txt",
  /** Relative to the repository root (gitignored). */
  cacheFile: ".cache/xrefs/cross-references.zip",
  /**
   * The licence marker the header must carry ("#www.openbible.info CC-BY 2026-11-23").
   * The dataset page links it to CC BY 4.0. If it changes, review the licence
   * before updating this value and XREFS_CREDIT in src/lib/xrefs/credit.ts.
   */
  licenseMarker: "CC-BY",
} as const;

/** Sanity bounds: a truncated or reshaped download fails the run instead of shipping. */
export const XREFS_EXPECTED = {
  /** 344,799 rows on 2026-11-23. */
  minRows: 300_000,
  maxRows: 450_000,
  /** At least this share of rows must survive filtering. */
  minKeptShare: 0.95,
} as const;
