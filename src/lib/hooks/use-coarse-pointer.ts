"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(pointer: coarse)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * True when the main pointer is a finger (an iPad, a touchscreen-first
 * device), for sizes that live in script, such as hit areas drawn in SVG.
 * For anything CSS can size, prefer Tailwind's pointer-coarse: variant: it
 * is right from the first paint, where this is false until hydration.
 */
export function useCoarsePointer(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
