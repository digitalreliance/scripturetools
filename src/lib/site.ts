/** The live site. */
const LIVE_URL = "https://scripturetools.vercel.app";

/** Brand and site-wide constants. Rename the product here. */
export const SITE = {
  /** The project's name. Rename the project by changing this one value. */
  name: "Scripture Tools",
  tagline: "See how the Bible fits together.",
  description:
    "Interactive maps, diagrams, timelines and symbols for studying the Bible, built on the King James text.",
  /**
   * The address absolute links are built on: link-preview images, the footer's
   * "Report a mistake" link. Production builds use the live site unless
   * NEXT_PUBLIC_SITE_URL says otherwise; `next dev` uses localhost.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === "production" ? LIVE_URL : "http://localhost:3000"),
  /** The live site, for links written into the README and docs. */
  liveUrl: LIVE_URL,
  /**
   * Computers and tablets get the app; phones get the device gate. A touch
   * screen counts as a phone when its shorter side is narrower than this, in
   * CSS pixels: every iPad and almost every tablet is wider, and every phone,
   * even held sideways, is narrower. (Android draws the same line.)
   */
  minTabletWidth: 600,
  /**
   * The narrowest window the layout is made for: half of an iPad in Split
   * View. A narrower window on a tablet or computer (Slide Over, a squeezed
   * browser) is asked to widen. Mirrored in src/app/globals.css; a test checks.
   */
  minWindowWidth: 500,
  /**
   * From this window width up, a study's outline and inspector dock beside the
   * canvas. Below it (an iPad held upright) the outline slides over the canvas
   * and the inspector sits beneath it. Tailwind's `lg`; mirrored in the study
   * shell's stylesheet, and checked by the same test.
   */
  dockedPanelsWidth: 1024,
  /** Layout width used for the scaled desktop preview on phones. */
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
  /**
   * The public repository. Every "Contribute" link is built from it. To move
   * the repository (a renamed account or an organization), change `owner`
   * here; the repository test then lists every other file that names it.
   */
  repo: { owner: "digitalreliance", name: "scripturetools", branch: "main" },
  /**
   * The project's X handle, without the @, for the hub's footer. Until there
   * is one, the footer shows the X mark marked "coming soon", with no link.
   */
  xHandle: null as string | null,
  /**
   * The project's dedication, shown on the cover, in the footer and in the
   * README. The motto is the historic Latin phrase with its English; the verse
   * is read from the KJV data, never copied.
   */
  dedication: {
    motto: "Soli Deo Gloria",
    english: "To God alone be the glory",
    verse: "PSA 115:1",
  },
  /** First year in the copyright line. */
  copyrightYear: 2026,
} as const;
