"use client";

import type { ReactNode } from "react";
import { Tooltip as RadixTooltip } from "radix-ui";
import { cn } from "@/lib/cn";
import styles from "./Tooltip.module.css";

/**
 * A small label that appears on hover and keyboard focus. The trigger must be
 * a single focusable element (it is rendered with asChild). Dark ink on every
 * theme, with a hairline so it separates from dark study canvases too.
 */
export function Tooltip({
  content,
  children,
  side = "bottom",
  align = "center",
  delay = 350,
  className,
}: {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delay?: number;
  className?: string;
}) {
  return (
    <RadixTooltip.Provider delayDuration={delay} skipDelayDuration={250}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            align={align}
            sideOffset={6}
            collisionPadding={8}
            className={cn(
              styles.content,
              "z-50 max-w-72 rounded-[6px] border border-white/10 bg-ink px-2 py-1 text-[12px] leading-4 font-medium text-paper shadow-float",
              className,
            )}
          >
            {content}
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
