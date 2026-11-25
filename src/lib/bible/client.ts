import type { BookId } from "./canon";
import { deepFreeze } from "./freeze";
import { selectPassage } from "./passage";
import { toReference } from "./reference";
import type { BookText, PassageVerse, ReferenceInput } from "./types";

/**
 * Browser-side access to the generated KJV data, fetched from
 * /data/kjv/books/{ID}.json. Use these in client components for text that is
 * not known at build time; prefer `@/lib/bible/server` when it is.
 */

/** Public URL of a book's JSON (also usable for <link rel="preload">). */
export function kjvBookUrl(id: BookId): string {
  return `/data/kjv/books/${id}.json`;
}

const requests = new Map<BookId, Promise<BookText>>();

/**
 * Fetch a whole book. Calls for the same book share one request; a failed
 * request is forgotten so the next call retries. The result is frozen.
 */
export function loadBook(id: BookId): Promise<BookText> {
  let request = requests.get(id);
  if (!request) {
    request = fetch(kjvBookUrl(id)).then(async (res) => {
      if (!res.ok) throw new Error(`Could not load ${id}: HTTP ${res.status}`);
      const book = (await res.json()) as BookText;
      if (book?.id !== id) throw new Error(`Unexpected data for ${id}`);
      return deepFreeze(book);
    });
    requests.set(id, request);
    request.catch(() => requests.delete(id));
  }
  return request;
}

/**
 * The verses of a reference, each tagged with its chapter. Accepts a Reference
 * or any string `parseReference` understands; rejects with RangeError if invalid.
 */
export async function loadPassage(ref: ReferenceInput): Promise<PassageVerse[]> {
  const reference = toReference(ref);
  return selectPassage(await loadBook(reference.book), reference);
}
