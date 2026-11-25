"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export interface ThumbTab {
  id: string;
  label: string;
  count: number;
}

/**
 * The cut tabs on a printed Bible's fore-edge, as navigation: one tab per
 * section, fixed to the right edge once the pages begin. The current section's
 * tab is pulled out.
 */
export function ThumbIndex({ tabs }: { tabs: ThumbTab[] }) {
  const [current, setCurrent] = useState<string | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const cover = document.getElementById("cover");
    const coverObserver = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting), { rootMargin: "0px 0px -55% 0px" });
    if (cover) coverObserver.observe(cover);

    const visible = new Map<string, boolean>();
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting);
        const first = tabs.find((t) => visible.get(t.id));
        if (first) setCurrent(first.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const tab of tabs) {
      const el = document.getElementById(tab.id);
      if (el) sectionObserver.observe(el);
    }
    return () => {
      coverObserver.disconnect();
      sectionObserver.disconnect();
    };
  }, [tabs]);

  return (
    <nav
      aria-label="Sections"
      className={cn(
        "fixed top-1/2 right-0 z-40 -translate-y-1/2 transition-[opacity,translate] duration-300 ease-out-quint",
        shown ? "opacity-100" : "pointer-events-none translate-x-6 opacity-0",
      )}
    >
      <ul className="flex flex-col items-end gap-1.5">
        {tabs.map((tab, i) => {
          const active = tab.id === current;
          return (
            <li key={tab.id}>
              <a
                href={`#${tab.id}`}
                aria-current={active ? "location" : undefined}
                tabIndex={shown ? 0 : -1}
                className={cn(
                  "flex h-9 items-center gap-3 rounded-l-[10px] border border-r-0 pr-4 pl-4 text-[13px] font-medium transition-[width,background-color,color] duration-200 ease-out-quint",
                  active
                    ? "w-[158px] border-ink bg-ink text-paper"
                    : "w-[140px] border-paper-line bg-paper-raised text-ink-muted hover:w-[148px] hover:text-ink",
                )}
                style={{ marginRight: 0, transitionDelay: shown ? `${i * 18}ms` : "0ms" }}
              >
                <span className="truncate">{tab.label}</span>
                <span className="ml-auto text-[12px] tabular opacity-70">{tab.count}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
