/** Brand and site-wide constants. Rename the product here. */
export const SITE = {
  name: "Scripture",
  tagline: "See how the Bible fits together.",
  description:
    "Interactive maps, diagrams, timelines and symbols for studying the Bible, built on the King James text.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Below this width a desktop browser window is considered cramped. */
  minDesktopWidth: 1024,
  /** Layout width used for the scaled desktop preview on phones and tablets. */
  previewViewportWidth: 1280,
  /**
   * Show studies that aren't built yet on the index (as "Planned" rows) and in
   * search. Set to false to list only live studies.
   */
  showPlannedStudies: true,
  /**
   * How many live studies the hub's carousel rotates through, most recently
   * released or updated first.
   */
  recentStudyCount: 5,
} as const;
