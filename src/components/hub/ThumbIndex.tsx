"use client";

import { useEffect, useState } from "react";
// clsx rather than cn: none of these classes conflict, and cn's tailwind-merge
// would add about 9 KB to the hub's JavaScript before interaction.
import { clsx } from "clsx";

export interface ThumbTab {
  id: string;
  label: string;
  count: number;
}

/**
 * The cut tabs on a printed Bible's fore-edge, as navigation: one tab per
 * section, fixed to the right edge once the pages begin. The current section's
 * tab is pulled out. Below 1024 px the tabs slim down to their names; below
 * 720 px, where the pages need every pixel, they step aside.
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
      className={clsx(
        "fixed top-1/2 right-0 z-40 -translate-y-1/2 transition-[opacity,translate] duration-300 ease-out-quint max-[719px]:hidden",
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
                className={clsx(
                  "flex h-9 items-center gap-3 rounded-l-[10px] border border-r-0 pr-4 pl-4 text-[13px] font-medium transition-[width,background-color,color] duration-200 ease-out-quint max-lg:pr-2 max-lg:pl-3",
                  active
                    ? "w-[158px] border-ink bg-ink text-paper max-lg:w-[120px]"
                    : "w-[140px] border-paper-line bg-paper-raised text-ink-muted hover:w-[148px] hover:text-ink max-lg:w-[108px] max-lg:hover:w-[114px]",
                )}
                style={{ marginRight: 0, transitionDelay: shown ? `${i * 18}ms` : "0ms" }}
              >
                <span className="truncate">{tab.label}</span>
                <span className="ml-auto text-[12px] tabular opacity-70 max-lg:hidden">{tab.count}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
