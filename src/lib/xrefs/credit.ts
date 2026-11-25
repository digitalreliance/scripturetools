/**
 * Credit for the cross-reference data. OpenBible.info publishes it under
 * Creative Commons Attribution 4.0, which requires the attribution, the
 * licence and a note that the data was modified wherever it is shown.
 *
 * Render `text` with links: "OpenBible.info" → `url`, "CC BY 4.0" → `licenseUrl`.
 */
export const XREFS_CREDIT = {
  /** The exact line the UI shows wherever cross-reference data appears. */
  text: "Cross references from OpenBible.info, licensed CC BY 4.0; adapted for the KJV.",
  name: "OpenBible.info Bible Cross References",
  url: "https://www.openbible.info/labs/cross-references/",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
} as const;
