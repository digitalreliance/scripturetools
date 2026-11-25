import type { ReactNode } from "react";
import type { IllustrationId } from "@/studies/registry";
import { B, L, R, T, type Ctx } from "./kit";

/**
 * Simple motifs for studies whose full illustration hasn't been drawn yet.
 * Each is a quiet, recognisable sketch of the study's kind of view.
 */
type Motif = "page" | "brackets" | "contours" | "bars" | "nodes" | "plan" | "bands" | "arcs";

const MOTIF: Partial<Record<IllustrationId, Motif>> = {
  reader: "page",
  "kjv-page": "page",
  names: "page",
  "word-frequency": "bars",
  "nested-chiasms": "brackets",
  blueprint: "plan",
  wilderness: "contours",
  territories: "contours",
  "city-walls": "plan",
  "parallel-reigns": "bars",
  "passion-days": "bars",
  "seventy-weeks": "bars",
  sevens: "bars",
  numbers: "bars",
  "family-tree": "nodes",
  twelve: "nodes",
  tabernacle: "plan",
  imagery: "bands",
  statue: "bands",
  arcs: "arcs",
  quotations: "arcs",
};

export function fallback(ctx: Ctx): ReactNode {
  const { p, w, id } = ctx;
  const motif = MOTIF[id] ?? "page";
  const ink = { stroke: p.ink, strokeWidth: w.base, fill: "none", strokeLinecap: "round" as const };
  const soft = { stroke: p.muted, strokeWidth: w.fine, fill: "none", strokeLinecap: "round" as const };
  const accent = { stroke: p.accent, strokeWidth: w.bold, fill: "none", strokeLinecap: "round" as const };

  switch (motif) {
    case "page":
      return (
        <g>
          <text x={L + 4} y={T + 46} fill={p.ink} fontSize={52} fontFamily="var(--font-scripture)" fontWeight={700}>3</text>
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M${i < 3 ? L + 48 : L} ${T + 10 + i * 17}H${i % 4 === 3 ? R - 60 : R}`} {...(i === 5 ? accent : soft)} />
          ))}
        </g>
      );
    case "brackets":
      return (
        <g>
          {Array.from({ length: 6 }, (_, i) => (
            <path key={i} d={`M${R - 40} ${T + i * 12}H${L + 30 + i * 18}V${B - i * 12}H${R - 40}`} {...(i === 5 ? accent : ink)} opacity={1 - i * 0.08} />
          ))}
        </g>
      );
    case "contours":
      return (
        <g>
          {Array.from({ length: 5 }, (_, i) => (
            <ellipse key={i} cx={150 + i * 6} cy={100} rx={110 - i * 20} ry={62 - i * 11} {...soft} />
          ))}
          <path d={`M${L + 10} ${B - 10}C110 150 120 70 190 90S260 60 ${R - 6} ${T + 16}`} {...accent} strokeDasharray={`${w.bold * 2} ${w.bold * 2.5}`} />
        </g>
      );
    case "bars":
      return (
        <g>
          {Array.from({ length: 7 }, (_, i) => {
            const len = [150, 210, 120, 240, 180, 90, 200][i];
            return <path key={i} d={`M${L + (i % 2) * 24} ${T + 12 + i * 22}h${len}`} {...(i === 3 ? accent : soft)} strokeWidth={w.bold * 0.9} />;
          })}
        </g>
      );
    case "nodes": {
      const pts: [number, number][] = [[160, 36], [96, 92], [224, 92], [60, 152], [132, 152], [196, 152], [262, 152]];
      const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
      return (
        <g>
          {edges.map(([a, b]) => (
            <path key={`${a}-${b}`} d={`M${pts[a][0]} ${pts[a][1]}V${(pts[a][1] + pts[b][1]) / 2}H${pts[b][0]}V${pts[b][1]}`} {...soft} />
          ))}
          {pts.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 0 ? 9 : 7} fill={i === 0 ? p.accent : p.canvas} stroke={p.ink} strokeWidth={w.base} />
          ))}
        </g>
      );
    }
    case "plan":
      return (
        <g>
          <rect x={L + 8} y={T + 18} width={R - L - 16} height={B - T - 36} {...ink} />
          <rect x={150} y={70} width={110} height={60} {...ink} />
          <rect x={222} y={70} width={38} height={60} {...accent} />
          <path d={`M${L + 8} ${B - 6}H${R - 8}`} {...soft} />
          <path d={`M${L + 8} ${B - 10}v8M${R - 8} ${B - 10}v8`} {...soft} />
        </g>
      );
    case "bands":
      return (
        <g>
          {["#C9A227", "#B9BCC2", "#B07A47", "#6E7480"].map((c, i) => (
            <rect key={c} x={120} y={T + 8 + i * 38} width={80} height={34} rx={4} fill={c} opacity={0.9} />
          ))}
          <path d={`M110 ${T + 4}V${B - 2}M210 ${T + 4}V${B - 2}`} {...soft} />
        </g>
      );
    default:
      return (
        <g>
          <path d={`M${L} ${B - 20}H${R}`} {...ink} />
          {[[40, 140], [70, 250], [120, 200], [150, 280], [210, 260]].map(([a, b], i) => (
            <path key={i} d={`M${a} ${B - 20}Q${(a + b) / 2} ${B - 20 - (b - a) * 0.9} ${b} ${B - 20}`} {...(i === 1 ? accent : soft)} />
          ))}
        </g>
      );
  }
}
