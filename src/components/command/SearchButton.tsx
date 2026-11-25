"use client";

import { Search } from "lucide-react";
import { Kbd } from "@/components/primitives/Kbd";
import { cn } from "@/lib/cn";
import { openCommandPalette } from "./CommandPalette";

/** Opens the command palette; styled for the cover or for paper. */
export function SearchButton({ tone = "paper", className }: { tone?: "cover" | "paper"; className?: string }) {
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      className={cn(
        "inline-flex h-9 items-center gap-2.5 rounded-control border pr-2 pl-3 text-[13px] transition-colors",
        tone === "cover"
          ? "border-cover-line bg-cover-raised/60 text-cover-muted hover:border-cover-muted/50 hover:text-cover-ink"
          : "border-paper-line bg-paper-raised text-ink-muted hover:border-ink-faint hover:text-ink",
        className,
      )}
    >
      <Search aria-hidden className="size-3.5" />
      <span>Search studies</span>
      <Kbd className="ml-3">⌘K</Kbd>
    </button>
  );
}
