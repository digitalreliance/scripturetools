import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Server-safe building blocks for StudyShell panels and bars. All colours come
 * from the study palette (--s-*), so they theme automatically.
 */

/** A titled block inside the outline or inspector. */
export function PanelSection({
  title,
  meta,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  /** Right-aligned detail beside the title: a count, a unit, a small action. */
  meta?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("border-b border-s-line px-3 py-3 last:border-b-0", className)}>
      {title || meta ? (
        <div className="mb-2 flex min-h-5 items-center justify-between gap-2">
          {title ? <h2 className="text-[12px] font-medium text-s-muted">{title}</h2> : <span />}
          {meta ? <div className="tabular text-[12px] text-s-muted">{meta}</div> : null}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** A labelled value for the status bar. Avoids "A · B · C" strings. */
export function StatusItem({
  label,
  children,
  className,
}: {
  label?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-baseline gap-1.5 whitespace-nowrap", className)}>
      {label ? <span className="text-s-muted">{label}</span> : null}
      <span className="tabular truncate text-s-ink">{children}</span>
    </span>
  );
}

/** A label/value row for inspectors, e.g. "Distance from centre — 202 verses". */
export function Field({
  label,
  children,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-8 items-center justify-between gap-3 text-ui pointer-coarse:min-h-9", className)}>
      <span className="text-s-muted">{label}</span>
      <span className="tabular min-w-0 text-right text-s-ink">{children}</span>
    </div>
  );
}

type ToolButtonVariant = "ghost" | "outline" | "primary";

const toolButtonVariants: Record<ToolButtonVariant, string> = {
  ghost: "text-s-ink hover:bg-s-raised active:bg-s-raised",
  outline: "border border-s-line bg-s-raised text-s-ink hover:border-s-muted/60 active:border-s-muted/60 active:brightness-95",
  primary: "bg-s-accent font-semibold text-s-on-accent hover:brightness-110 active:brightness-95",
};

/**
 * Top-bar and panel button: optional icon, optional label. Under a finger
 * (pointer-coarse) it grows from 32 to 40 px.
 *
 * In the top bar, a window narrower than 1024 px (an iPad held upright) has
 * less room: give `shortLabel` to say it in fewer words there ("Walk" for
 * "Walk to the centre"), or an empty string to show only the icon. Below
 * 720 px, a button with a `shortLabel` shows only its icon. The full label
 * stays the button's accessible name and tooltip throughout.
 */
export function ToolButton({
  icon,
  children,
  shortLabel,
  variant = "ghost",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  variant?: ToolButtonVariant;
  shortLabel?: string;
}) {
  const label =
    children && shortLabel !== undefined ? (
      <>
        <span className="@max-[63rem]/bar:sr-only">{children}</span>
        {shortLabel ? (
          <span aria-hidden className="hidden @max-[63rem]/bar:inline @max-[44rem]/bar:hidden">
            {shortLabel}
          </span>
        ) : null}
      </>
    ) : (
      children
    );
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-control px-2.5 text-ui font-medium transition-[background-color,border-color,filter] duration-120 select-none disabled:pointer-events-none disabled:opacity-45 pointer-coarse:h-10 pointer-coarse:px-3 [&_svg]:size-4 [&_svg]:shrink-0",
        !children && "w-8 px-0 pointer-coarse:w-10 pointer-coarse:px-0",
        children && shortLabel === "" && "@max-[63rem]/bar:w-8 @max-[63rem]/bar:px-0 pointer-coarse:@max-[63rem]/bar:w-10 pointer-coarse:@max-[63rem]/bar:px-0",
        children && shortLabel && "@max-[44rem]/bar:w-8 @max-[44rem]/bar:px-0 pointer-coarse:@max-[44rem]/bar:w-10 pointer-coarse:@max-[44rem]/bar:px-0",
        toolButtonVariants[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {label}
    </button>
  );
}

/** A thin vertical rule between toolbar groups. */
export function ToolbarDivider({ className }: { className?: string }) {
  return <span aria-hidden className={cn("mx-1 h-5 w-px shrink-0 bg-s-line", className)} />;
}
