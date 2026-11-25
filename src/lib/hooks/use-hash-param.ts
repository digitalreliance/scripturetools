"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Shareable study state lives in the URL hash as key=value pairs
 * (e.g. "#view=arcs&level=RR"). Unlike search params, the hash never reaches
 * the server, so pages stay fully static.
 *
 * history.replaceState does not fire "hashchange", so writes dispatch a custom
 * event that every subscriber also listens to.
 */
const HASH_EVENT = "scripture:hashparam";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener(HASH_EVENT, onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener(HASH_EVENT, onChange);
  };
}

function readParams(): URLSearchParams {
  return new URLSearchParams(window.location.hash.slice(1));
}

export function readHashParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return readParams().get(key);
}

export function writeHashParam(key: string, value: string | null): void {
  const params = readParams();
  if (value === null || value === "") params.delete(key);
  else params.set(key, value);
  const hash = params.toString();
  const url = `${window.location.pathname}${window.location.search}${hash ? `#${hash}` : ""}`;
  window.history.replaceState(window.history.state, "", url);
  window.dispatchEvent(new Event(HASH_EVENT));
}

/**
 * Read and write one hash parameter. Returns `fallback` during prerendering and
 * until the browser value is known.
 */
export function useHashParam(
  key: string,
  fallback: string | null = null,
): [string | null, (value: string | null) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => readHashParam(key),
    () => null,
  );
  const setValue = useCallback(
    (next: string | null) => writeHashParam(key, next),
    [key],
  );
  return [value ?? fallback, setValue];
}
