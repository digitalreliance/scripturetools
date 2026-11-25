"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { CornerDownLeft, Search } from "lucide-react";
import { Dialog } from "radix-ui";
import { Kbd } from "@/components/primitives/Kbd";
import { formatReference } from "@/lib/bible/reference";
import { studyHref } from "@/lib/routes";
import { SITE } from "@/lib/site";
import { CATEGORIES, STUDIES, getCategory } from "@/studies/registry";
import { revelationVerse } from "./verse";

export interface CommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What had focus when the palette opened, to return focus to when it closes. */
  opener: HTMLElement | SVGElement | null;
}

const itemClass =
  "flex min-h-11 cursor-default items-center gap-3 rounded-[8px] px-3 py-2 text-[14px] text-ink outline-none select-none data-[disabled=true]:cursor-not-allowed data-[disabled=true]:text-ink-muted data-[selected=true]:bg-paper-sunk";

/**
 * The command palette: find a study, jump to a section, or a verse in
 * Revelation. `CommandPalette` loads this module the first time the palette
 * opens (see ./open.ts) and owns the shortcuts and the open state.
 */
export function CommandDialog({ open, onOpenChange, opener }: CommandDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  // Off while the palette closes to load another page, which then has the focus.
  const returnFocus = useRef(true);

  const revelationRef = useMemo(() => revelationVerse(query), [query]);

  const studies = useMemo(
    () =>
      STUDIES.filter((s) => s.status === "live" || SITE.showPlannedStudies).toSorted(
        (a, b) => Number(b.status === "live") - Number(a.status === "live"),
      ),
    [],
  );

  function close() {
    onOpenChange(false);
    setQuery("");
  }

  /** Close and load another page. The opener is leaving with this one, so focus is left alone. */
  function go(href: string) {
    returnFocus.current = false;
    close();
    router.push(href);
  }

  function goToSection(id: string) {
    if (window.location.pathname === "/") {
      close();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      window.history.replaceState(window.history.state, "", `#${id}`);
    } else {
      go(`/#${id}`);
    }
  }

  // Radix returns focus to a Dialog.Trigger, and this palette has none, so focus
  // would drop to <body>. Return it to the opener, without scrolling: choosing a
  // section has just scrolled the hub away from it.
  function restoreFocus(event: Event) {
    event.preventDefault();
    if (returnFocus.current && opener?.isConnected) opener.focus({ preventScroll: true });
    returnFocus.current = true;
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-[rgb(20_18_16/0.32)] backdrop-blur-[2px]" />
        <Dialog.Content
          onCloseAutoFocus={restoreFocus}
          className="fixed top-[14vh] left-1/2 z-[91] w-[640px] max-w-[calc(100vw-32px)] -translate-x-1/2 overflow-hidden rounded-panel border border-paper-line bg-paper-raised text-ink shadow-float focus:outline-none"
        >
          <Dialog.Title className="sr-only">Search {SITE.name}</Dialog.Title>
          <Dialog.Description className="sr-only">Find a study or a section, or type a verse in Revelation.</Dialog.Description>
          <Command label={`Search ${SITE.name}`} loop>
            <div className="flex items-center gap-3 border-b border-paper-line px-4">
              <Search aria-hidden className="size-4 shrink-0 text-ink-muted" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search studies, or type a verse such as Rev 12:9"
                className="h-14 min-w-0 flex-1 bg-transparent text-[16px] text-ink placeholder:text-ink-faint focus:outline-none"
              />
              <Kbd className="text-ink-muted">Esc</Kbd>
            </div>
            <Command.List className="scroll-thin max-h-[min(56vh,520px)] overflow-y-auto p-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-ink-muted">
              <Command.Empty className="px-3 py-8 text-center text-[14px] text-ink-muted">
                Nothing matches “{query}”. Try a topic such as maps, prophecy or chiasm, or a verse in Revelation such as 12:9.
              </Command.Empty>

              {revelationRef ? (
                <Command.Group heading="In Revelation's mirror" forceMount>
                  <Command.Item
                    forceMount
                    value={`verse ${query}`}
                    onSelect={() => go(`${studyHref("revelation-chiasm")}#verse=${revelationRef.chapter}:${revelationRef.verse}`)}
                    className={itemClass}
                  >
                    <span className="flex-1">
                      Find {formatReference({ book: "REV", chapter: revelationRef.chapter, verse: revelationRef.verse }, "long")} in
                      Revelation&rsquo;s mirror
                    </span>
                    <CornerDownLeft aria-hidden className="size-4 text-ink-muted" />
                  </Command.Item>
                </Command.Group>
              ) : null}

              <Command.Group heading="Studies">
                {studies.map((study) => (
                  <Command.Item
                    key={study.slug}
                    value={study.title}
                    keywords={[study.summary, getCategory(study.category).title, ...study.keywords]}
                    disabled={study.status !== "live" || !study.href}
                    onSelect={() => study.href && go(study.href)}
                    className={itemClass}
                  >
                    <span
                      aria-hidden
                      className={study.status === "live" ? "size-2 shrink-0 rounded-full bg-ink" : "size-2 shrink-0 rounded-full border border-ink-muted"}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{study.title}</span>
                      <span className="block truncate text-[12.5px] text-ink-muted">{study.summary}</span>
                    </span>
                    <span className="shrink-0 text-[12px] text-ink-muted">{study.status === "live" ? "Open" : "Planned"}</span>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Sections of the index">
                {CATEGORIES.map((category) => (
                  <Command.Item
                    key={category.id}
                    value={`section ${category.title}`}
                    keywords={[category.description]}
                    onSelect={() => goToSection(category.id)}
                    className={itemClass}
                  >
                    <span className="flex-1">{category.title}</span>
                    <span className="text-[12px] text-ink-muted">Section</span>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
