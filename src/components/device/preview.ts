import { SITE } from "@/lib/site";

/**
 * Shared by the boot script and the gate's client components.
 * Preview mode renders the desktop layout at a fixed width, which a phone then
 * scales to fit its screen.
 */
export const PREVIEW_STORAGE_KEY = "scripture:preview";
export const PREVIEW_VALUE = "desktop";
export const PREVIEW_VIEWPORT = `width=${SITE.previewViewportWidth}`;
export const DEVICE_VIEWPORT = "width=device-width, initial-scale=1";

function viewportMeta(): HTMLMetaElement {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "viewport";
    document.head.appendChild(meta);
  }
  return meta;
}

export function isPreviewing(): boolean {
  return document.documentElement.getAttribute("data-preview") === PREVIEW_VALUE;
}

export function applyViewport(content: string): void {
  const meta = viewportMeta();
  if (meta.getAttribute("content") !== content) meta.setAttribute("content", content);
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
