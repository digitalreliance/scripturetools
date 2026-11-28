"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Tabs, ToggleGroup } from "radix-ui";
import { Kbd } from "@/components/primitives/Kbd";
import { cn } from "@/lib/cn";

/** Interactive StudyShell controls (Radix-based). */

export interface SegmentedItem<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  /** Shown in a tooltip/title, e.g. a keyboard shortcut. */
  hint?: string;
}

/**
 * Single-choice segmented control, e.g. a view switcher in the top bar. In a
 * top bar narrower than 1024 px (an iPad held upright), items with icons name
 * only the chosen one; the rest show their icons, and keep their labels as
 * accessible names and tooltips.
 */
export function Segmented<T extends string>({
  value,
  onValueChange,
  items,
  label,
  className,
}: {
  value: T;
  onValueChange: (value: T) => void;
  items: readonly SegmentedItem<T>[];
  /** Accessible name for the group, e.g. "View". */
  label: string;
  className?: string;
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next as T);
      }}
      aria-label={label}
      className={cn("inline-flex items-center rounded-control border border-s-line bg-s-canvas p-0.5", className)}
    >
      {items.map((item) => (
        <ToggleGroup.Item
          key={item.value}
          value={item.value}
          title={item.hint ?? item.label}
          className="group inline-flex h-7 items-center gap-1.5 rounded-[6px] px-2.5 text-ui font-medium text-s-muted transition-colors duration-120 select-none hover:text-s-ink active:text-s-ink data-[state=on]:bg-s-raised data-[state=on]:text-s-ink data-[state=on]:shadow-[0_0_0_1px_var(--s-line)] pointer-coarse:h-9 pointer-coarse:px-3 [&_svg]:size-3.5 pointer-coarse:[&_svg]:size-4"
        >
          {item.icon}
          <span className={item.icon ? "group-data-[state=off]:@max-[63rem]/bar:sr-only" : undefined}>{item.label}</span>
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

export interface InspectorTab {
  value: string;
  label: string;
  /** Small count or note beside the label. */
  meta?: ReactNode;
  content: ReactNode;
}

/** Tabs across the top of the inspector, like "Pair | Text | Notes". */
export function InspectorTabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  label = "Inspector sections",
  className,
}: {
  tabs: readonly InspectorTab[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  className?: string;
}) {
  return (
    <Tabs.Root
      value={value}
      defaultValue={defaultValue ?? tabs[0]?.value}
      onValueChange={onValueChange}
      className={cn("flex min-h-0 flex-col", className)}
    >
      <Tabs.List
        aria-label={label}
        className="sticky top-0 z-10 flex gap-0.5 border-b border-s-line bg-s-chrome p-2 @2xl/inspector:px-3"
      >
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className="inline-flex h-7 flex-1 items-center justify-center @2xl/inspector:max-w-40 gap-1.5 rounded-[6px] px-2 text-ui font-medium text-s-muted transition-colors duration-120 select-none hover:text-s-ink active:text-s-ink pointer-coarse:h-9 data-[state=active]:bg-s-raised data-[state=active]:text-s-ink data-[state=active]:shadow-[0_0_0_1px_var(--s-line)]"
          >
            {tab.label}
            {tab.meta !== undefined ? <span className="tabular text-[11px] text-s-muted">{tab.meta}</span> : null}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map((tab) => (
        <Tabs.Content key={tab.value} value={tab.value} className="min-h-0 focus-visible:outline-none">
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

/** Search field for the top bar. Controlled or uncontrolled like an <input>. */
export const ShellSearch = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { shortcut?: string; wrapperClassName?: string }
>(function ShellSearch({ shortcut, wrapperClassName, className, ...props }, ref) {
  return (
    <label
      className={cn(
        "flex h-8 w-56 items-center gap-2 rounded-control border border-s-line bg-s-canvas px-2.5 text-s-muted transition-colors focus-within:border-s-muted/70 pointer-coarse:h-10",
        wrapperClassName,
      )}
    >
      <Search aria-hidden className="size-3.5 shrink-0" />
      <input
        ref={ref}
        type="search"
        className={cn(
          "min-w-0 flex-1 bg-transparent text-ui text-s-ink placeholder:text-s-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden",
          className,
        )}
        {...props}
      />
      {shortcut ? <Kbd className="pointer-coarse:hidden">{shortcut}</Kbd> : null}
    </label>
  );
});
