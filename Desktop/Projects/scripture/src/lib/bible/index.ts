/**
 * Isomorphic Bible library. Server data access lives in `@/lib/bible/server`
 * (server-only); browser data access in `@/lib/bible/client`.
 */
export * from "./canon";
export * from "./types";
export * from "./versification";
export * from "./reference";
export * from "./markup";
export * from "./passage";
export { KJV_TOTALS, KJV_TRANSLATION, VERSE_COUNTS, WORD_COUNTS } from "./generated/kjv-meta";
