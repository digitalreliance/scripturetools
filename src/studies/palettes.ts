import type { CSSProperties } from "react";

/**
 * Every study has its own identity, like a separate instrument. StudyShell
 * exposes the palette as --s-* CSS variables, which Tailwind maps to
 * bg-s-canvas, text-s-ink, border-s-line, bg-s-accent, text-s-on-accent, etc.
 *
 * Text pairs were checked for WCAG AA: muted on chrome >= 4.5:1, onAccent on
 * accent >= 4.5:1.
 */
export interface StudyPalette {
  scheme: "light" | "dark";
  /** Main canvas background. */
  canvas: string;
  /** Top bar, side panels, status bar. */
  chrome: string;
  /** Inputs, selected rows, segmented-control thumb. */
  raised: string;
  /** Hairlines and dividers. */
  line: string;
  /** Primary text. */
  ink: string;
  /** Secondary text. */
  muted: string;
  /** Primary action and selection. */
  accent: string;
  /** Text on accent. */
  onAccent: string;
}

export const PALETTES = {
  /** Thin India paper and rubrication red: the reader. */
  biblePaper: {
    scheme: "light",
    canvas: "#F7F6F1",
    chrome: "#EFEDE6",
    raised: "#FFFFFF",
    line: "#DAD6CC",
    ink: "#1C1A17",
    muted: "#5E594F",
    accent: "#B3261E",
    onAccent: "#FFFFFF",
  },
  /** A scholar's chart on white paper; colour is reserved for the content. */
  chart: {
    scheme: "light",
    canvas: "#FDFDFB",
    chrome: "#F4F3EF",
    raised: "#FFFFFF",
    line: "#E3E0D9",
    ink: "#1B1A18",
    muted: "#67635B",
    accent: "#1B1A18",
    onAccent: "#FDFDFB",
  },
  /** Architect's blueprint: structural studies. */
  blueprint: {
    scheme: "dark",
    canvas: "#133A63",
    chrome: "#0F2F52",
    raised: "#19497A",
    line: "#2B5C8E",
    ink: "#EAF2FB",
    muted: "#A9C3E0",
    accent: "#F2B544",
    onAccent: "#1A1408",
  },
  /** Survey map: sage land, deep green ink. */
  atlas: {
    scheme: "light",
    canvas: "#E9EDE3",
    chrome: "#F5F6F1",
    raised: "#FFFFFF",
    line: "#CCD4C3",
    ink: "#1E2A21",
    muted: "#56655A",
    accent: "#2F6B4F",
    onAccent: "#FFFFFF",
  },
  /** Night-shift timeline: slate with amber bars. */
  chronicle: {
    scheme: "dark",
    canvas: "#0F151D",
    chrome: "#151C26",
    raised: "#1D2632",
    line: "#2A3544",
    ink: "#E9EDF3",
    muted: "#97A3B4",
    accent: "#E5A23A",
    onAccent: "#1B1205",
  },
  /** Family registers: deep green and old gold. */
  lineage: {
    scheme: "dark",
    canvas: "#0E1C17",
    chrome: "#13251F",
    raised: "#1A3129",
    line: "#264237",
    ink: "#E6EFEA",
    muted: "#97AFA5",
    accent: "#D8B25C",
    onAccent: "#1A1406",
  },
  /** Emblems and numbers: royal purple and gold. */
  emblem: {
    scheme: "dark",
    canvas: "#18122A",
    chrome: "#1F1733",
    raised: "#2A2043",
    line: "#3A2E57",
    ink: "#EFEAF8",
    muted: "#ABA0C4",
    accent: "#EFC36A",
    onAccent: "#1C1406",
  },
  /** Type specimen: black on white. */
  glyph: {
    scheme: "light",
    canvas: "#FFFFFF",
    chrome: "#F3F3F2",
    raised: "#FFFFFF",
    line: "#DEDEDC",
    ink: "#111111",
    muted: "#5F5F5F",
    accent: "#111111",
    onAccent: "#FFFFFF",
  },
  /** Visions: night indigo and bronze. */
  visions: {
    scheme: "dark",
    canvas: "#11132A",
    chrome: "#171A35",
    raised: "#20244A",
    line: "#2D3260",
    ink: "#ECEBF7",
    muted: "#A5A7CB",
    accent: "#D58A4C",
    onAccent: "#1C1006",
  },
  /** The cover leather, threaded with canon colours. */
  threads: {
    scheme: "dark",
    canvas: "#141210",
    chrome: "#1B1815",
    raised: "#25211D",
    line: "#332E28",
    ink: "#F2EEE6",
    muted: "#A39C90",
    accent: "#E2553A",
    onAccent: "#1A0E0A",
  },
} as const satisfies Record<string, StudyPalette>;

export type PaletteName = keyof typeof PALETTES;

/** CSS custom properties for a palette, for a style prop on a themed root. */
export function paletteVars(palette: StudyPalette): CSSProperties {
  return {
    "--s-canvas": palette.canvas,
    "--s-chrome": palette.chrome,
    "--s-raised": palette.raised,
    "--s-line": palette.line,
    "--s-ink": palette.ink,
    "--s-muted": palette.muted,
    "--s-accent": palette.accent,
    "--s-on-accent": palette.onAccent,
    "--focus-ring": palette.accent === palette.ink ? palette.ink : palette.accent,
    colorScheme: palette.scheme,
  } as CSSProperties;
}
