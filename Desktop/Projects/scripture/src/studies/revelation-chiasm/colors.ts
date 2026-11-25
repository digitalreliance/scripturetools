/**
 * The chart's seven-colour cycle (A red, B orange … G purple, H red …), deepened
 * so each holds at least 3.9:1 against the chart paper (#FDFDFB) as text and
 * lines. The centre pair is printed in ink.
 */
export const LEVEL_COLORS = [
  "#C8342B", // red
  "#C2620F", // orange
  "#A07A06", // gold
  "#2E8540", // green
  "#1F86B5", // light blue
  "#2E4AA8", // dark blue
  "#7E3FA6", // purple
] as const;

export const CENTER_COLOR = "#1B1A18";

export const COLOR_NAMES = ["red", "orange", "gold", "green", "light blue", "dark blue", "purple"] as const;

export function levelColor(colorIndex: number | null): string {
  return colorIndex === null ? CENTER_COLOR : LEVEL_COLORS[colorIndex];
}
