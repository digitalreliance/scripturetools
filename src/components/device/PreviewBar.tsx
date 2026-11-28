"use client";

import { useEffect, useRef } from "react";
import { applyViewport, chosePreview, DEVICE_VIEWPORT, exitPreview, isPreviewing, PREVIEW_VIEWPORT } from "./preview";
import { PHONE_PAGE_ATTRIBUTE } from "./phone-pages";

/**
 * Shown only in the scaled desktop preview on phones (CSS decides
 * visibility). The page is laid out 1280 px wide and shrunk to fit, so the bar
 * counter-zooms itself to stay at a normal, tappable size.
 *
 * It also keeps the viewport right: fixed-width for the preview, which the
 * boot script can set before the viewport tag exists and navigation may
 * re-render, and the phone's own width again on a page laid out for phones,
 * such as the index, which never needs the preview.
 */
export function PreviewBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => {
      if (!isPreviewing()) {
        if (chosePreview()) applyViewport(DEVICE_VIEWPORT);
        return;
      }
      applyViewport(PREVIEW_VIEWPORT);
      const deviceWidth = Math.min(window.screen.width, window.innerWidth) || window.innerWidth;
      const zoom = Math.max(1, window.innerWidth / deviceWidth);
      barRef.current?.style.setProperty("zoom", zoom.toFixed(3));
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ["content"] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-preview", PHONE_PAGE_ATTRIBUTE] });
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  return (
    <div
      ref={barRef}
      data-device-preview-bar
      className="theme-cover fixed inset-x-0 bottom-0 z-[100] items-center justify-between gap-3 border-t border-cover-line bg-cover/95 px-4 py-3 text-cover-ink backdrop-blur"
    >
      <p className="min-w-0 text-[14px] leading-snug">
        <span className="font-semibold">Desktop preview</span>
        <span className="block text-cover-muted">Best on a tablet or computer. Pinch to zoom.</span>
      </p>
      <button
        type="button"
        onClick={exitPreview}
        className="h-11 shrink-0 rounded-control bg-cover-ink px-4 text-[14px] font-semibold text-cover active:brightness-90"
      >
        Exit preview
      </button>
    </div>
  );
}
