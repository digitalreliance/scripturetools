import { formatReference } from "@/lib/bible/reference";
import type { Distance } from "./data/compute";

/** "REV 4:10-5:1" → "4:10–5:1" (every passage here is in Revelation). */
export function revRef(ref: string): string {
  return formatReference(ref, "short").replace(/^Rev\s+/, "");
}

/** "REV 12:9" → "Revelation 12:9". */
export function longRef(ref: string): string {
  return formatReference(ref, "long");
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? "auto" : "smooth";
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** "202 verses before the centre", "152–153 verses after the centre". */
export function distanceSentence(d: Distance, prime: boolean): string {
  if (d.max === 0) return prime ? "Right after the centre" : "Right before the centre";
  const amount = d.min === d.max ? String(d.min) : `${d.min}–${d.max}`;
  return `${amount} ${plural(d.max, "verse", "verses")} ${prime ? "after" : "before"} the centre`;
}

export function formatNumber(n: number, digits = 1): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}
