import type { ReactNode } from "react";
import type { IllustrationId } from "@/studies/registry";
import type { Ctx } from "./kit";
import { familyTree } from "./family-tree";
import { parallelReigns } from "./parallel-reigns";
import { passionDays } from "./passion-days";

/**
 * Drawings registered by illustration set B. Each entry maps an
 * IllustrationId to a drawing function (ctx) => <g>…</g>; index.tsx merges
 * this map with the other sets. Ids not listed anywhere fall back to a simple
 * motif (fallback.tsx).
 */
export const SET_B: Partial<Record<IllustrationId, (ctx: Ctx) => ReactNode>> = {
  "parallel-reigns": parallelReigns,
  "passion-days": passionDays,
  "family-tree": familyTree,
};
