import { BOOKS, type SectionId } from "@/lib/bible/canon";

/**
 * Seven canon groups for data colour, named after manuscript pigments.
 * Hex values mirror the --color-canon-* tokens in globals.css (canvas code
 * can't read Tailwind utilities). Each sits near luminance 0.2, holding 3:1+
 * against both the cover leather and the paper.
 */
export type CanonGroup = "law" | "history" | "wisdom" | "prophets" | "gospels" | "epistles" | "revelation";

export const CANON_GROUPS: readonly { id: CanonGroup; name: string; color: string }[] = [
  { id: "law", name: "Law", color: "#E2553A" },
  { id: "history", name: "History", color: "#B07714" },
  { id: "wisdom", name: "Poetry and wisdom", color: "#3C9A5F" },
  { id: "prophets", name: "Prophets", color: "#2B93A0" },
  { id: "gospels", name: "Gospels and Acts", color: "#D24A72" },
  { id: "epistles", name: "Letters", color: "#4A63D9" },
  { id: "revelation", name: "Revelation", color: "#9A4FC4" },
];

const GROUP_OF_SECTION: Record<SectionId, CanonGroup> = {
  law: "law",
  history: "history",
  wisdom: "wisdom",
  "major-prophets": "prophets",
  "minor-prophets": "prophets",
  gospels: "gospels",
  acts: "gospels",
  pauline: "epistles",
  general: "epistles",
  apocalypse: "revelation",
};

const COLOR = new Map(CANON_GROUPS.map((g) => [g.id, g.color]));

/** Group of each book, in canon order (index = book order − 1). */
export const BOOK_GROUPS: readonly CanonGroup[] = BOOKS.map((b) => GROUP_OF_SECTION[b.section]);

export const groupColor = (group: CanonGroup): string => COLOR.get(group) ?? "#999";
