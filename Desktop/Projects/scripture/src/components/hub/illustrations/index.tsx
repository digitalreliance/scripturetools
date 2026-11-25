/**
 * Study illustrations for the hub: one drawing per IllustrationId, rendered in
 * the study's own palette.
 *
 * Contract:
 * - Server-safe: no hooks, no "use client". Pure SVG + CSS Modules.
 * - viewBox is 320 x 200 (16:10). The SVG fills its container's width.
 * - variant "plate" is the large, detailed drawing; "thumb" is a simplified
 *   drawing that stays legible at ~96 px wide.
 * - Static by default. A short animation plays while an ancestor with the
 *   class `illo-host` is hovered or contains focus. Reduced motion respected.
 */
import type { ReactNode } from "react";
import type { StudyPalette } from "@/studies/palettes";
import type { IllustrationId } from "@/studies/registry";
import { acrostic } from "./acrostic";
import { chiasm } from "./chiasm";
import { fallback } from "./fallback";
import { H, makeCtx, W, type Ctx } from "./kit";
import { lifespans } from "./lifespans";
import { route } from "./route";
import { SET_A } from "./set-a";
import { SET_B } from "./set-b";

export interface IllustrationProps {
  palette: StudyPalette;
  variant?: "plate" | "thumb";
  className?: string;
  /** Accessible description; when omitted the drawing is decorative. */
  title?: string;
}

const DRAWINGS: Partial<Record<IllustrationId, (ctx: Ctx) => ReactNode>> = {
  ...SET_A,
  ...SET_B,
  chiasm,
  route,
  lifespans,
  acrostic,
};

export function StudyIllustration({
  id,
  palette,
  variant = "plate",
  className,
  title,
}: IllustrationProps & { id: IllustrationId }) {
  const draw = DRAWINGS[id] ?? fallback;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      data-illustration={id}
    >
      {title ? <title>{title}</title> : null}
      <rect width={W} height={H} fill={palette.canvas} />
      {draw(makeCtx(id, palette, variant))}
    </svg>
  );
}
