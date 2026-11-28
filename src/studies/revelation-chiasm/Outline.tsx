import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { canHover } from "@/lib/pointer";
import { levelColor } from "./colors";
import { revRef } from "./format";
import type { LevelView, MirrorPayload } from "./types";

/** The structure as a contents list: sections, then each level's theme. */
export function Outline({
  levels,
  sections,
  filter,
  onFilter,
  selected,
  active,
  onHover,
  onSelect,
}: {
  levels: LevelView[];
  sections: MirrorPayload["sections"];
  filter: string;
  onFilter: (value: string) => void;
  selected: string | null;
  active: string | null;
  onHover: (letter: string | null) => void;
  onSelect: (letter: string) => void;
}) {
  const query = filter.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!query) return null;
    return new Set(
      levels
        .filter((l) =>
          [l.letter, l.theme, l.first.label, l.second.label, revRef(l.first.ref), revRef(l.second.ref), l.first.sourceLabel, l.second.sourceLabel]
            .join(" ")
            .toLowerCase()
            .includes(query),
        )
        .map((l) => l.letter),
    );
  }, [levels, query]);

  return (
    <div className="pb-6" onPointerLeave={(e) => canHover(e) && onHover(null)}>
      <div className="sticky top-0 z-10 border-b border-s-line bg-s-chrome p-3">
        <label className="flex h-8 items-center gap-2 rounded-control border border-s-line bg-s-canvas px-2.5 focus-within:border-s-muted/70 pointer-coarse:h-10">
          <span className="sr-only">Filter levels</span>
          <input
            type="search"
            value={filter}
            onChange={(e) => onFilter(e.target.value)}
            placeholder="Filter by word or verse"
            className="min-w-0 flex-1 bg-transparent text-ui text-s-ink placeholder:text-s-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {matches ? <span className="text-[11px] text-s-muted tabular">{matches.size}</span> : null}
        </label>
      </div>

      {matches && matches.size === 0 ? (
        <p className="px-4 py-6 text-ui text-s-muted">No level mentions “{filter}”. Try a word from the text, such as dragon or throne, or a verse like 12:9.</p>
      ) : null}

      {sections.map((section) => {
        const sectionLevels = levels.filter(
          (l) => l.level >= section.levels[0] && l.level <= section.levels[1] && (!matches || matches.has(l.letter)),
        );
        if (sectionLevels.length === 0) return null;
        return (
          <section key={section.id} className="px-2 pt-4">
            <h2 className="px-2 text-[12px] leading-4 font-semibold text-s-ink">{section.first}</h2>
            <p className="mb-1.5 px-2 text-[12px] leading-4 text-s-muted">mirrored by {section.second.charAt(0).toLowerCase() + section.second.slice(1)}</p>
            <ul>
              {sectionLevels.map((level) => {
                const isSelected = selected === level.letter;
                const isActive = active === level.letter;
                return (
                  <li key={level.letter}>
                    <button
                      type="button"
                      onClick={() => onSelect(level.letter)}
                      onPointerEnter={(e) => canHover(e) && onHover(level.letter)}
                      aria-current={isSelected ? "true" : undefined}
                      className={cn(
                        "flex h-8 w-full items-center gap-2.5 rounded-[6px] px-2 text-left text-ui transition-colors duration-100 select-none pointer-coarse:h-10",
                        isSelected ? "bg-s-raised font-medium text-s-ink shadow-[0_0_0_1px_var(--s-line)]" : isActive ? "bg-s-raised/70" : "text-s-ink hover:bg-s-raised/70 active:bg-s-raised/70",
                      )}
                    >
                      <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: levelColor(level.colorIndex) }} />
                      <span className="w-6 shrink-0 font-semibold tabular" style={{ color: levelColor(level.colorIndex) }}>
                        {level.letter}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{level.theme}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
