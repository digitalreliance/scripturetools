import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BOOKS } from "@/lib/bible/canon";
import { VERSE_COUNTS } from "@/lib/bible/generated/kjv-meta";
import { SITE } from "@/lib/site";
import type { ChapterArcs } from "@/lib/xrefs/types";
import { arcAlpha, chapterBook, layout } from "@/components/hub/arc-geometry";
import { BOOK_GROUPS, groupColor } from "@/components/hub/canon-groups";

/**
 * The picture shown when a link to the site is shared: the cover's own figure,
 * every chapter's cross references as arcs, drawn at build time from the same
 * data, layout and colours as the cover, under the site's name and tagline.
 * It changes whenever they do; nothing here is a screenshot.
 */

export const alt = `${SITE.name}: ${SITE.tagline} The Bible's cross references drawn as arcs between its 1,189 chapters.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COVER = "#141210";
const INK = "#F2EEE6";
const MUTED = "#A39C90";
const MARGIN = 64;

const font = (weight: 400 | 600) =>
  readFileSync(join(process.cwd(), `node_modules/@fontsource/archivo/files/archivo-latin-${weight}-normal.woff`));

const arcs = JSON.parse(
  readFileSync(join(process.cwd(), "public/data/xrefs/chapter-arcs.json"), "utf8"),
) as ChapterArcs;

/** The figure as SVG: arcs above a spine, chapter bars (by verse count) below. */
function figure(width: number): { svg: string; height: number } {
  const base = 250;
  const barMax = 46;
  const height = base + 4 + barMax + 4;
  const g = layout(width);
  const ratio = Math.min(1, (base - 8) / (width / 2));

  // One <path> per arc, so overlapping arcs build up light as they do on the cover.
  const arcPaths = arcs.links.map(([a, b, w]) => {
    const x1 = g.chapterX[a];
    const x2 = g.chapterX[b];
    const r = (x2 - x1) / 2;
    const ry = Math.max(1.5, r * ratio);
    const color = groupColor(BOOK_GROUPS[chapterBook[a]]);
    const alpha = Math.min(1, arcAlpha(w, arcs.maxWeight) * 1.25).toFixed(2);
    return `<path d="M${x1.toFixed(1)} ${base}A${r.toFixed(1)} ${ry.toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${base}" stroke="${color}" stroke-opacity="${alpha}"/>`;
  });

  const barW = Math.max(0.6, g.unit * 0.72);
  const bars = new Map<string, string[]>();
  let i = 0;
  BOOKS.forEach((book, b) => {
    const color = groupColor(BOOK_GROUPS[b]);
    for (let c = 0; c < book.chapters; c++) {
      const h = 3 + (VERSE_COUNTS[book.id][c] / 176) * barMax;
      const x = g.chapterX[i++] - barW / 2;
      (bars.get(color) ?? bars.set(color, []).get(color)!).push(
        `M${x.toFixed(1)} ${base + 3}h${barW.toFixed(2)}v${h.toFixed(1)}h-${barW.toFixed(2)}z`,
      );
    }
  });
  const barPaths = [...bars].map(([color, ds]) => `<path d="${ds.join("")}" fill="${color}" fill-opacity="0.92"/>`);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<g fill="none" stroke-width="0.9">${arcPaths.join("")}</g>` +
    `<rect x="0" y="${base}" width="${width}" height="1" fill="${INK}" fill-opacity="0.16"/>` +
    barPaths.join("") +
    `</svg>`;
  return { svg, height };
}

const dataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

const MARK =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round">` +
  `<path d="M2.75 16.5h18.5"/><path d="M4.5 16.5a5.5 5.5 0 0 1 11 0"/><path d="M8.5 16.5a5.5 5.5 0 0 1 11 0"/></svg>`;

export default function Image() {
  const width = size.width - MARGIN * 2;
  const art = figure(width);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: COVER,
          color: INK,
          fontFamily: "Archivo",
          padding: `52px ${MARGIN}px 0`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, fontWeight: 600 }}>
            <img src={dataUri(MARK)} width={36} height={36} alt="" />
            {SITE.name}
          </div>
          <div style={{ display: "flex", fontSize: 20, fontWeight: 400, color: MUTED }}>
            Free and open source
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            maxWidth: 760,
            fontSize: 66,
            lineHeight: 1.04,
            fontWeight: 600,
            letterSpacing: "-0.03em",
          }}
        >
          {SITE.tagline}
        </div>
        <div style={{ display: "flex", marginTop: "auto", marginBottom: 16 }}>
          <img src={dataUri(art.svg)} width={width} height={art.height} alt="" />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: font(400), weight: 400, style: "normal" },
        { name: "Archivo", data: font(600), weight: 600, style: "normal" },
      ],
    },
  );
}
