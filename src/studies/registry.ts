/**
 * The catalogue of studies (micro-apps). The hub, the command palette and each
 * study's frame all read from here, so adding a study starts with an entry.
 */
import type { BookId } from "@/lib/bible/canon";
import { studyHref } from "@/lib/routes";
import { PALETTES, type StudyPalette } from "./palettes";

export type CategoryId =
  | "text"
  | "structure"
  | "maps"
  | "time"
  | "people"
  | "symbols"
  | "language"
  | "prophecy"
  | "connections";

export interface Category {
  id: CategoryId;
  title: string;
  /** Short label for the thumb-index tab. */
  tab: string;
  description: string;
}

export type StudyStatus = "live" | "planned";

/** Keys into the hub's illustration set (src/components/hub/illustrations). */
export type IllustrationId =
  | "reader"
  | "word-frequency"
  | "chiasm"
  | "nested-chiasms"
  | "blueprint"
  | "route"
  | "wilderness"
  | "territories"
  | "city-walls"
  | "parallel-reigns"
  | "lifespans"
  | "passion-days"
  | "family-tree"
  | "twelve"
  | "numbers"
  | "tabernacle"
  | "imagery"
  | "acrostic"
  | "kjv-page"
  | "names"
  | "statue"
  | "seventy-weeks"
  | "sevens"
  | "arcs"
  | "quotations";

export interface StudySource {
  label: string;
  href?: string;
  license?: string;
}

export interface Study {
  slug: string;
  /** Where the study lives; null while it is only planned. */
  href: string | null;
  title: string;
  /** One sentence: what the reader can see or do. */
  summary: string;
  category: CategoryId;
  status: StudyStatus;
  books: readonly BookId[] | "all";
  /** Extra search terms for the command palette. */
  keywords: readonly string[];
  palette: StudyPalette;
  illustration: IllustrationId;
  featured?: boolean;
  /** Labelled values shown on the index plate, e.g. ["Pairs", "51"]. */
  facts?: readonly (readonly [label: string, value: string])[];
  sources?: readonly StudySource[];
}

export const CATEGORIES: readonly Category[] = [
  {
    id: "text",
    title: "The text",
    tab: "Text",
    description:
      "The King James Bible itself, with the italics, red letters and paragraph marks its printers set.",
  },
  {
    id: "structure",
    title: "Structure",
    tab: "Structure",
    description: "How books are built: mirrored halves, outlines and acrostics.",
  },
  {
    id: "maps",
    title: "Maps and places",
    tab: "Maps",
    description: "Journeys, borders and cities on the land they describe.",
  },
  {
    id: "time",
    title: "Time",
    tab: "Time",
    description: "Reigns, lifespans and events laid out on one scale.",
  },
  {
    id: "people",
    title: "People",
    tab: "People",
    description: "Families, tribes and the twelve, traced through the text.",
  },
  {
    id: "symbols",
    title: "Symbols",
    tab: "Symbols",
    description:
      "Numbers, colours, creatures and objects, and every place they recur.",
  },
  {
    id: "language",
    title: "Language and type",
    tab: "Language",
    description:
      "Hebrew and Greek letters, names, and the typography of the King James page.",
  },
  {
    id: "prophecy",
    title: "Prophecy",
    tab: "Prophecy",
    description:
      "Visions in sequence: Daniel's kingdoms, the seventy weeks, the sevens of Revelation.",
  },
  {
    id: "connections",
    title: "Connections",
    tab: "Connections",
    description:
      "Cross references and quotations that tie the testaments together.",
  },
];

const KJV_SOURCE: StudySource = {
  label: "King James Version (1769 text), eBible.org",
  href: "https://ebible.org/",
  license: "Public domain",
};

const XREF_SOURCE: StudySource = {
  label: "Cross references, OpenBible.info",
  href: "https://www.openbible.info/labs/cross-references/",
  license: "CC BY",
};

export const STUDIES: readonly Study[] = [
  // The text
  {
    slug: "reader",
    href: null,
    title: "King James reader",
    summary:
      "All 66 books with the translators' italics, red letters and paragraph marks, plus cross references for every verse.",
    category: "text",
    status: "planned",
    books: "all",
    keywords: ["kjv", "bible", "read", "king james", "authorized version", "1769", "chapter", "verse"],
    palette: PALETTES.biblePaper,
    illustration: "reader",
    sources: [KJV_SOURCE, XREF_SOURCE],
  },
  {
    slug: "word-explorer",
    href: null,
    title: "Word explorer",
    summary: "Every word of the King James text counted and charted across the 66 books.",
    category: "text",
    status: "planned",
    books: "all",
    keywords: ["concordance", "frequency", "words", "strong's", "search"],
    palette: PALETTES.glyph,
    illustration: "word-frequency",
  },

  // Structure
  {
    slug: "revelation-chiasm",
    href: studyHref("revelation-chiasm"),
    title: "Revelation's mirror",
    summary:
      "Revelation is built as a mirror around 12:9–10. Follow 51 paired passages from the first verse to the centre and back out.",
    category: "structure",
    status: "live",
    books: ["REV"],
    keywords: ["chiasm", "chiastic", "mirror", "symmetry", "pattern", "apocalypse", "dragon", "literary structure"],
    palette: PALETTES.chart,
    illustration: "chiasm",
    featured: true,
    facts: [
      ["Book", "Revelation"],
      ["Mirrored pairs", "51"],
      ["Views", "Chart, arcs, symmetry and text"],
    ],
    sources: [KJV_SOURCE],
  },
  {
    slug: "chiasms",
    href: null,
    title: "Chiasms across Scripture",
    summary: "The same mirrored design in the Flood narrative, the Psalms and the Gospels.",
    category: "structure",
    status: "planned",
    books: ["GEN", "PSA", "MAT", "LUK"],
    keywords: ["chiasm", "flood", "noah", "pattern", "literary structure"],
    palette: PALETTES.blueprint,
    illustration: "nested-chiasms",
  },
  {
    slug: "book-blueprints",
    href: null,
    title: "Book blueprints",
    summary: "Each book's outline drawn as a single plan you can zoom from sections to verses.",
    category: "structure",
    status: "planned",
    books: "all",
    keywords: ["outline", "overview", "summary", "sections"],
    palette: PALETTES.blueprint,
    illustration: "blueprint",
  },

  // Maps and places
  {
    slug: "pauls-journeys",
    href: null,
    title: "Paul's journeys",
    summary: "Four voyages across the Roman world, port by port, with the verses for every stop.",
    category: "maps",
    status: "planned",
    books: ["ACT", "ROM", "1CO", "2CO", "GAL"],
    keywords: ["paul", "missionary journeys", "acts", "mediterranean", "rome", "map"],
    palette: PALETTES.atlas,
    illustration: "route",
  },
  {
    slug: "exodus-route",
    href: null,
    title: "The Exodus route",
    summary: "From Rameses to the plains of Moab through the camps listed in Numbers 33.",
    category: "maps",
    status: "planned",
    books: ["EXO", "NUM", "DEU"],
    keywords: ["exodus", "wilderness", "sinai", "moses", "red sea", "map"],
    palette: PALETTES.atlas,
    illustration: "wilderness",
  },
  {
    slug: "twelve-tribes",
    href: null,
    title: "The twelve tribes",
    summary: "The tribal allotments of Joshua 13–21 drawn on the land they describe.",
    category: "maps",
    status: "planned",
    books: ["JOS"],
    keywords: ["tribes", "israel", "allotment", "canaan", "joshua", "map"],
    palette: PALETTES.atlas,
    illustration: "territories",
  },
  {
    slug: "jerusalem",
    href: null,
    title: "Jerusalem through time",
    summary: "The city's walls, gates and temple from David to the Roman siege.",
    category: "maps",
    status: "planned",
    books: ["2SA", "1KI", "NEH", "JHN"],
    keywords: ["jerusalem", "temple", "zion", "walls", "gates", "city"],
    palette: PALETTES.atlas,
    illustration: "city-walls",
  },

  // Time
  {
    slug: "kings",
    href: null,
    title: "Kings of Israel and Judah",
    summary: "Two lines of kings side by side, with the prophets who spoke to each.",
    category: "time",
    status: "planned",
    books: ["1SA", "2SA", "1KI", "2KI", "1CH", "2CH"],
    keywords: ["kings", "monarchy", "reigns", "divided kingdom", "timeline", "chronology"],
    palette: PALETTES.chronicle,
    illustration: "parallel-reigns",
  },
  {
    slug: "patriarchs",
    href: null,
    title: "The long lives of Genesis",
    summary: "The ages in Genesis 5 and 11 drawn to scale, showing whose lives overlapped.",
    category: "time",
    status: "planned",
    books: ["GEN"],
    keywords: ["patriarchs", "methuselah", "lifespans", "ages", "genealogy", "timeline"],
    palette: PALETTES.chronicle,
    illustration: "lifespans",
  },
  {
    slug: "last-week",
    href: null,
    title: "The last week",
    summary: "Each day from the entry into Jerusalem to the empty tomb, across all four Gospels.",
    category: "time",
    status: "planned",
    books: ["MAT", "MRK", "LUK", "JHN"],
    keywords: ["passion week", "holy week", "crucifixion", "resurrection", "harmony", "gospels"],
    palette: PALETTES.chronicle,
    illustration: "passion-days",
  },

  // People
  {
    slug: "adam-to-christ",
    href: null,
    title: "From Adam to Christ",
    summary: "The genealogies of Genesis, Chronicles, Matthew and Luke joined into one tree.",
    category: "people",
    status: "planned",
    books: ["GEN", "1CH", "MAT", "LUK"],
    keywords: ["genealogy", "family tree", "ancestors", "lineage", "begat"],
    palette: PALETTES.lineage,
    illustration: "family-tree",
  },
  {
    slug: "the-twelve",
    href: null,
    title: "The twelve",
    summary: "Each apostle's name, family, calling and every verse that mentions him.",
    category: "people",
    status: "planned",
    books: ["MAT", "MRK", "LUK", "JHN", "ACT"],
    keywords: ["apostles", "disciples", "peter", "john", "james", "andrew"],
    palette: PALETTES.lineage,
    illustration: "twelve",
  },

  // Symbols
  {
    slug: "numbers",
    href: null,
    title: "Numbers in Scripture",
    summary: "Where three, seven, twelve and forty recur, and what each occurrence counts.",
    category: "symbols",
    status: "planned",
    books: "all",
    keywords: ["numbers", "seven", "twelve", "forty", "numerology", "symbolism"],
    palette: PALETTES.emblem,
    illustration: "numbers",
  },
  {
    slug: "tabernacle",
    href: null,
    title: "The tabernacle",
    summary: "Exodus 25–40 built in three dimensions to its stated cubits, piece by piece.",
    category: "symbols",
    status: "planned",
    books: ["EXO"],
    keywords: ["tabernacle", "ark of the covenant", "holy of holies", "altar", "3d"],
    palette: PALETTES.emblem,
    illustration: "tabernacle",
  },
  {
    slug: "revelation-imagery",
    href: null,
    title: "Revelation's imagery",
    summary: "Colours, creatures, metals and stones in Revelation, each traced to its Old Testament source.",
    category: "symbols",
    status: "planned",
    books: ["REV", "EZK", "DAN", "ISA", "ZEC"],
    keywords: ["symbols", "beasts", "colours", "gemstones", "lampstands", "imagery"],
    palette: PALETTES.emblem,
    illustration: "imagery",
  },

  // Language and type
  {
    slug: "alphabet-psalm",
    href: null,
    title: "The alphabet psalm",
    summary: "Psalm 119's twenty-two stanzas, each opening with the next letter of the Hebrew alphabet.",
    category: "language",
    status: "planned",
    books: ["PSA"],
    keywords: ["psalm 119", "acrostic", "hebrew", "alphabet", "aleph", "letters"],
    palette: PALETTES.glyph,
    illustration: "acrostic",
  },
  {
    slug: "kjv-page",
    href: null,
    title: "Reading the KJV page",
    summary: "Why some words are italic, why LORD is set in small capitals, and what the ¶ marks.",
    category: "language",
    status: "planned",
    books: "all",
    keywords: ["typography", "italics", "small caps", "pilcrow", "printing", "1611"],
    palette: PALETTES.glyph,
    illustration: "kjv-page",
  },
  {
    slug: "names",
    href: null,
    title: "Names and meanings",
    summary: "Hebrew and Greek names, what they mean, and everyone who bore them.",
    category: "language",
    status: "planned",
    books: "all",
    keywords: ["names", "meanings", "etymology", "hebrew", "greek"],
    palette: PALETTES.glyph,
    illustration: "names",
  },

  // Prophecy
  {
    slug: "daniels-statue",
    href: null,
    title: "Daniel's statue",
    summary: "The four metals of Daniel 2 beside the four beasts of Daniel 7.",
    category: "prophecy",
    status: "planned",
    books: ["DAN"],
    keywords: ["daniel", "statue", "image", "kingdoms", "beasts", "gold silver bronze iron"],
    palette: PALETTES.visions,
    illustration: "statue",
  },
  {
    slug: "seventy-weeks",
    href: null,
    title: "The seventy weeks",
    summary: "Daniel 9:24–27 as a timeline you can set to each major reading.",
    category: "prophecy",
    status: "planned",
    books: ["DAN"],
    keywords: ["seventy weeks", "daniel 9", "490 years", "messiah", "timeline"],
    palette: PALETTES.visions,
    illustration: "seventy-weeks",
  },
  {
    slug: "sevens",
    href: null,
    title: "Seals, trumpets and bowls",
    summary: "Revelation's three cycles of seven aligned so you can see what repeats.",
    category: "prophecy",
    status: "planned",
    books: ["REV"],
    keywords: ["seals", "trumpets", "bowls", "vials", "judgments", "sevens"],
    palette: PALETTES.visions,
    illustration: "sevens",
  },

  // Connections
  {
    slug: "cross-references",
    href: null,
    title: "Cross-reference atlas",
    summary: "Every chapter's links to the rest of the Bible, filtered by book, chapter or verse.",
    category: "connections",
    status: "planned",
    books: "all",
    keywords: ["cross references", "links", "connections", "parallel passages", "arcs"],
    palette: PALETTES.threads,
    illustration: "arcs",
    sources: [XREF_SOURCE],
  },
  {
    slug: "old-in-new",
    href: null,
    title: "The Old in the New",
    summary: "Every New Testament quotation of the Old, with both passages side by side.",
    category: "connections",
    status: "planned",
    books: "all",
    keywords: ["quotations", "fulfilment", "prophecy fulfilled", "allusions", "septuagint"],
    palette: PALETTES.threads,
    illustration: "quotations",
  },
];

const bySlug = new Map(STUDIES.map((s) => [s.slug, s]));

export function getStudy(slug: string): Study | undefined {
  return bySlug.get(slug);
}

export function getStudyOrThrow(slug: string): Study {
  const study = bySlug.get(slug);
  if (!study) throw new Error(`Unknown study: ${slug}`);
  return study;
}

export function studiesIn(category: CategoryId): Study[] {
  return STUDIES.filter((s) => s.category === category);
}

export function liveStudies(): Study[] {
  return STUDIES.filter((s) => s.status === "live");
}

export function getCategory(id: CategoryId): Category {
  const category = CATEGORIES.find((c) => c.id === id);
  if (!category) throw new Error(`Unknown category: ${id}`);
  return category;
}
