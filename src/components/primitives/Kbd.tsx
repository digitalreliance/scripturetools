import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A keyboard key. Inherits colour, so it works on cover, paper and studies. */
export function Kbd({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] border border-current/20 px-1 font-sans text-[11px] font-medium leading-none opacity-75",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
