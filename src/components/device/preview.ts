import { SITE } from "@/lib/site";
import { PHONE_PAGE_ATTRIBUTE } from "./phone-pages";

/**
 * Shared by the boot script and the gate's client components.
 * Preview mode renders the desktop layout at a fixed width, which a phone then
 * scales to fit its screen.
 */
export const PREVIEW_STORAGE_KEY = "scripture:preview";
export const PREVIEW_VALUE = "desktop";
export const PREVIEW_VIEWPORT = `width=${SITE.previewViewportWidth}`;
export const DEVICE_VIEWPORT = "width=device-width, initial-scale=1";

/**
 * Every viewport tag on the page. The server sends one, and the framework can
 * add another while the page hydrates; the browser obeys the last, so all of
 * them must agree.
 */
function viewportMetas(): HTMLMetaElement[] {
  const metas = [...document.querySelectorAll<HTMLMetaElement>('meta[name="viewport"]')];
  if (metas.length > 0) return metas;
  const meta = document.createElement("meta");
  meta.name = "viewport";
  document.head.appendChild(meta);
  return [meta];
}

/** The visitor chose the preview. (It applies everywhere but phone pages.) */
export function chosePreview(): boolean {
  return document.documentElement.getAttribute("data-preview") === PREVIEW_VALUE;
}

/** The scaled desktop preview is on screen now: chosen, and not on a page laid out for phones. */
export function isPreviewing(): boolean {
  return chosePreview() && !document.documentElement.hasAttribute(PHONE_PAGE_ATTRIBUTE);
}

export function applyViewport(content: string): void {
  for (const meta of viewportMetas()) {
    if (meta.getAttribute("content") !== content) meta.setAttribute("content", content);
  }
}

export function enterPreview(): void {
  try {
    localStorage.setItem(PREVIEW_STORAGE_KEY, PREVIEW_VALUE);
  } catch {
    // Private browsing can refuse storage; the preview still works for this visit.
  }
  document.documentElement.setAttribute("data-preview", PREVIEW_VALUE);
  applyViewport(PREVIEW_VIEWPORT);
  window.scrollTo(0, 0);
}

export function exitPreview(): void {
  try {
    localStorage.removeItem(PREVIEW_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
  document.documentElement.removeAttribute("data-preview");
  applyViewport(DEVICE_VIEWPORT);
  window.scrollTo(0, 0);
}
