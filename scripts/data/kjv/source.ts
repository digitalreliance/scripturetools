import type { TranslationInfo } from "../../../src/lib/bible/types";

/**
 * The pinned KJV source.
 *
 * eBible.org publishes two USFM builds of the KJV. Their 66 canonical books are
 * byte-identical (checked 2026-11-24) and both mark the words of Christ (\wj);
 * eng-kjv2006 is protocanon only, so nothing has to be filtered out of it.
 *
 * eBible regenerates its archives from time to time. If the download no longer
 * matches `sha256`, inspect the new archive, then update `sha256` (and
 * `edition` if the text changed) or run with --allow-new-source.
 */
export const KJV_SOURCE = {
  url: "https://ebible.org/Scriptures/eng-kjv2006_usfm.zip",
  sha256: "b6faa67117ccaba49df9e7df224a553f11758ae7c5d58f0f7979e2b73ac4480b",
  /** Relative to the repository root (gitignored). */
  cacheFile: ".cache/kjv/eng-kjv2006_usfm.zip",
} as const;

export const KJV_TRANSLATION_INFO: Omit<TranslationInfo, "sha256"> = {
  id: "KJV",
  name: "King James Version",
  edition:
    "Authorized Version, standardized 1769 text, protocanon only " +
    "(eBible.org eng-kjv2006 USFM, source files dated 2026-11-15)",
  license: "Public domain",
  source: "eBible.org, courtesy of the CrossWire Bible Society",
  sourceUrl: KJV_SOURCE.url,
};
