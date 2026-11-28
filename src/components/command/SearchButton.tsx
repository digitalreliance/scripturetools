import { Search } from "lucide-react";
import { Kbd } from "@/components/primitives/Kbd";
import { cn } from "@/lib/cn";
import { OpenPaletteButton } from "./OpenPaletteButton";

/**
 * Opens the command palette; styled for the cover or for paper. A Server
 * Component: the icon, the key hint and the class merging render to HTML, and
 * only the bare button (OpenPaletteButton) ships as JavaScript. With
 * `collapse`, it shows only its icon in a window narrower than 640 px (a
 * phone), keeping its label for screen readers.
 */
export function SearchButton({
  tone = "paper",
  collapse = false,
  className,
}: {
  tone?: "cover" | "paper";
  collapse?: boolean;
  className?: string;
}) {
  return (
    <OpenPaletteButton
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-2.5 rounded-control border pr-2 pl-3 text-[13px] whitespace-nowrap transition-colors pointer-coarse:pr-3",
        collapse && "max-sm:px-2.5",
        tone === "cover"
          ? "border-cover-line bg-cover-raised/60 text-cover-muted hover:border-cover-muted/50 hover:text-cover-ink"
          : "border-paper-line bg-paper-raised text-ink-muted hover:border-ink-faint hover:text-ink",
        className,
      )}
    >
      <Search aria-hidden className="size-3.5" />
      <span className={collapse ? "max-sm:sr-only" : undefined}>Search studies</span>
      {/* A keyboard shortcut means nothing to a finger, or beside a lone icon. */}
      <Kbd className={cn("ml-3 pointer-coarse:hidden", collapse && "max-sm:hidden")}>⌘K</Kbd>
    </OpenPaletteButton>
  );
}
