import type { ReactNode } from "react";
import type { IllustrationId } from "@/studies/registry";
import type { Ctx } from "./kit";
import { kjvPage } from "./kjv-page";
import { names } from "./names";
import { reader } from "./reader";
import { wordFrequency } from "./word-frequency";

/**
 * Drawings registered by illustration set A. Each entry maps an
 * IllustrationId to a drawing function (ctx) => <g>…</g>; index.tsx merges
 * this map with the other sets. Ids not listed anywhere fall back to a simple
 * motif (fallback.tsx).
 */
export const SET_A: Partial<Record<IllustrationId, (ctx: Ctx) => ReactNode>> = {
  reader,
  "word-frequency": wordFrequency,
  "kjv-page": kjvPage,
  names,
};
