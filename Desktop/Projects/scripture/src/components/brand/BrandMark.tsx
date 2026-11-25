import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";

/**
 * Two cross-reference arcs on an axis. Where they overlap they form a vesica,
 * the shape of the early Christian fish sign.
 */
export function BrandMark({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      className={cn("size-6 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d="M2.75 16.5h18.5" />
      <path d="M4.5 16.5a5.5 5.5 0 0 1 11 0" />
      <path d="M8.5 16.5a5.5 5.5 0 0 1 11 0" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] [font-stretch:112%]",
        className,
      )}
    >
      <BrandMark className="size-[22px]" />
      {SITE.name}
    </span>
  );
}
