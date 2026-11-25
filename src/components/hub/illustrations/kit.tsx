/**
 * The drawing kit shared by every study illustration: canvas geometry, stroke
 * weights per variant, lettering, and small technical-drawing primitives
 * (grid, dimension lines, callouts, hatching, map projection, water lines).
 *
 * Everything here is a pure function of its props, so the set stays
 * server-safe: no hooks, no client code.
 */
import type { CSSProperties, ReactNode, SVGProps } from "react";
import type { StudyPalette } from "@/studies/palettes";
import type { IllustrationId } from "@/studies/registry";
import css from "./illustrations.module.css";

export { css };

export type Variant = "plate" | "thumb";
export type Pt = readonly [number, number];

/* ------------------------------------------------------------------ */
/* Canvas                                                              */
/* ------------------------------------------------------------------ */

/** viewBox size. */
export const W = 320;
export const H = 200;
/** Margin every drawing keeps its content inside (an 8-unit grid inside it). */
export const M = 24;
/** Edges of the live area and its centre. */
export const L = M;
export const T = M;
export const R = W - M;
export const B = H - M;
export const CX = W / 2;
export const CY = H / 2;

/** The on-screen widths each variant is drawn for. */
const SCREEN_WIDTH: Record<Variant, number> = { plate: 560, thumb: 96 };

/** Stroke weights in viewBox units. */
export interface Weights {
  /** Construction lines, hatching, grids. */
  hair: number;
  /** Secondary line work. */
  fine: number;
  /** Primary line work. */
  base: number;
  /** Emphasis and data strokes. */
  bold: number;
}

/** viewBox units that render as `screenPx` at the variant's expected width. */
function px(v: Variant, screenPx: number): number {
  return (screenPx * W) / SCREEN_WIDTH[v];
}

/**
 * One set of weights for the whole set: 0.75 / 1.25 / 1.5 / 2.5 px on a plate,
 * 1.25 / 2 / 2.5 / 3.5 px on a thumb.
 */
export function weightsFor(v: Variant): Weights {
  return v === "plate"
    ? { hair: px(v, 0.75), fine: px(v, 1.25), base: px(v, 1.5), bold: px(v, 2.5) }
    : { hair: px(v, 1.25), fine: px(v, 2), base: px(v, 2.5), bold: px(v, 3.5) };
}

/** Type sizes for plate lettering (thumbs carry no small text). */
export const FS = {
  /** Technical labels: about 11 px on a plate. */
  label: 6.5,
  /** Axis figures and indices. */
  small: 5.75,
} as const;

/** Everything one drawing needs. */
export interface Ctx {
  id: IllustrationId;
  p: StudyPalette;
  v: Variant;
  thumb: boolean;
  w: Weights;
  /** A document-unique id for this drawing's defs (patterns, masks). */
  uid: (name: string) => string;
}

export function makeCtx(id: IllustrationId, p: StudyPalette, v: Variant): Ctx {
  return {
    id,
    p,
    v,
    thumb: v === "thumb",
    w: weightsFor(v),
    uid: (name) => `illo-${id}-${v}-${name}`,
  };
}

/** Join class names, skipping empty ones. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/* Motion                                                              */
/* ------------------------------------------------------------------ */

export const LINEAR = "linear";
export const EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";

/** Inline timing for one animated part: delay and duration in ms, easing. */
export function timing(delay = 0, duration?: number, easing?: string): CSSProperties {
  const style: Record<string, string> = { "--d": `${Math.round(delay)}ms` };
  if (duration !== undefined) style["--t"] = `${Math.round(duration)}ms`;
  if (easing) style["--e"] = easing;
  return style as CSSProperties;
}

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

/** Round to 2 decimals so the markup stays small. */
export function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Straight segments through the points. */
export function line(points: readonly Pt[], close = false): string {
  const d = points.map(([x, y], i) => `${i ? "L" : "M"}${r2(x)} ${r2(y)}`).join("");
  return close ? `${d}Z` : d;
}

/** A smooth curve through the points (Catmull-Rom as cubic Béziers). */
export function smooth(points: readonly Pt[], close = false, tension = 1): string {
  const n = points.length;
  if (n < 3) return line(points, close);
  const at = (i: number) => (close ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${r2(points[0][0])} ${r2(points[0][1])}`;
  const segments = close ? n : n - 1;
  for (let i = 0; i < segments; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const k = tension / 6;
    d +=
      `C${r2(p1[0] + (p2[0] - p0[0]) * k)} ${r2(p1[1] + (p2[1] - p0[1]) * k)}` +
      ` ${r2(p2[0] - (p3[0] - p1[0]) * k)} ${r2(p2[1] - (p3[1] - p1[1]) * k)}` +
      ` ${r2(p2[0])} ${r2(p2[1])}`;
  }
  return close ? `${d}Z` : d;
}

/** Cumulative length fraction (0..1) at each vertex of a polyline. */
export function fractions(points: readonly Pt[]): number[] {
  const acc = [0];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    acc.push(acc[i - 1] + Math.hypot(x1 - x0, y1 - y0));
  }
  const total = acc[acc.length - 1] || 1;
  return acc.map((a) => a / total);
}

/** Point on a circle; angle in degrees, 0 at twelve o'clock, clockwise. */
export function polar(cx: number, cy: number, r: number, deg: number): Pt {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/**
 * Equirectangular projection centred on (lon0, lat0), drawn at (cx, cy) with
 * `k` viewBox units per degree of latitude. Good enough at these scales.
 */
export function projection(lon0: number, lat0: number, cx: number, cy: number, k: number) {
  const kx = k * Math.cos((lat0 * Math.PI) / 180);
  return ([lon, lat]: Pt): Pt => [cx + (lon - lon0) * kx, cy - (lat - lat0) * k];
}

/* ------------------------------------------------------------------ */
/* Lettering                                                           */
/* ------------------------------------------------------------------ */

type TxtProps = Omit<SVGProps<SVGTextElement>, "fontSize"> & {
  size?: number;
  face?: "sans" | "serif" | "hebrew";
};

/** Text in one of the set's faces. Sans is Archivo, serif is Baskerville. */
export function Txt({ size = FS.label, face = "sans", className, children, ...rest }: TxtProps) {
  return (
    <text fontSize={size} className={cx(css[face], className)} {...rest}>
      {children}
    </text>
  );
}

/* ------------------------------------------------------------------ */
/* Technical-drawing primitives                                        */
/* ------------------------------------------------------------------ */

/** A square grid of hairlines. */
export function Grid({
  ctx,
  step = 8,
  x0 = 0,
  y0 = 0,
  x1 = W,
  y1 = H,
  color,
  opacity = 1,
}: {
  ctx: Ctx;
  step?: number;
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
  color?: string;
  opacity?: number;
}) {
  let d = "";
  for (let x = x0; x <= x1 + 0.01; x += step) d += `M${r2(x)} ${y0}V${y1}`;
  for (let y = y0; y <= y1 + 0.01; y += step) d += `M${x0} ${r2(y)}H${x1}`;
  return <path d={d} stroke={color ?? ctx.p.line} strokeWidth={ctx.w.hair} opacity={opacity} fill="none" />;
}

/** Architect's tick: a short 45° slash across a dimension line's end. */
function tick(x: number, y: number, s = 2.4): string {
  return `M${r2(x - s)} ${r2(y + s)}L${r2(x + s)} ${r2(y - s)}`;
}

/**
 * A horizontal dimension line from x1 to x2 at height y, with architect's
 * ticks, optional extension lines down to `extTo`, and a label above it.
 */
export function DimH({
  ctx,
  x1,
  x2,
  y,
  label,
  extTo,
  color,
  labelColor,
  className,
  style,
}: {
  ctx: Ctx;
  x1: number;
  x2: number;
  y: number;
  label?: ReactNode;
  extTo?: number;
  color?: string;
  labelColor?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const { p, w } = ctx;
  const c = color ?? p.muted;
  const ext =
    extTo === undefined
      ? ""
      : `M${r2(x1)} ${r2(y + Math.sign(y - extTo) * 2)}V${r2(extTo)}M${r2(x2)} ${r2(y + Math.sign(y - extTo) * 2)}V${r2(extTo)}`;
  return (
    <g className={className} style={style}>
      <path d={`M${r2(x1)} ${r2(y)}H${r2(x2)}${ext}`} stroke={c} strokeWidth={w.hair} fill="none" />
      <path d={tick(x1, y) + tick(x2, y)} stroke={c} strokeWidth={w.fine} fill="none" />
      {label !== undefined && !ctx.thumb ? (
        <Txt x={r2((x1 + x2) / 2)} y={r2(y - 2.4)} textAnchor="middle" fill={labelColor ?? c} size={FS.small}>
          {label}
        </Txt>
      ) : null}
    </g>
  );
}

/** A vertical dimension line from y1 to y2 at x, label set beside it. */
export function DimV({
  ctx,
  y1,
  y2,
  x,
  label,
  extTo,
  side = "left",
  color,
  className,
  style,
}: {
  ctx: Ctx;
  y1: number;
  y2: number;
  x: number;
  label?: ReactNode;
  extTo?: number;
  side?: "left" | "right";
  color?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const { p, w } = ctx;
  const c = color ?? p.muted;
  const ext =
    extTo === undefined
      ? ""
      : `M${r2(x + Math.sign(x - extTo) * 2)} ${r2(y1)}H${r2(extTo)}M${r2(x + Math.sign(x - extTo) * 2)} ${r2(y2)}H${r2(extTo)}`;
  return (
    <g className={className} style={style}>
      <path d={`M${r2(x)} ${r2(y1)}V${r2(y2)}${ext}`} stroke={c} strokeWidth={w.hair} fill="none" />
      <path d={tick(x, y1) + tick(x, y2)} stroke={c} strokeWidth={w.fine} fill="none" />
      {label !== undefined && !ctx.thumb ? (
        <Txt
          x={r2(side === "left" ? x - 3 : x + 3)}
          y={r2((y1 + y2) / 2 + 2)}
          textAnchor={side === "left" ? "end" : "start"}
          fill={c}
          size={FS.small}
        >
          {label}
        </Txt>
      ) : null}
    </g>
  );
}

/** A numbered callout bubble, as on an assembly drawing. */
export function Callout({
  ctx,
  x,
  y,
  n,
  r = 4.6,
  active = false,
  className,
  style,
}: {
  ctx: Ctx;
  x: number;
  y: number;
  n: ReactNode;
  r?: number;
  active?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const { p, w } = ctx;
  return (
    <g className={className} style={style}>
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={active ? p.accent : p.canvas}
        stroke={active ? p.accent : p.ink}
        strokeWidth={w.fine}
      />
      <Txt x={x} y={r2(y + 1.95)} size={5.4} textAnchor="middle" fill={active ? p.onAccent : p.ink}>
        {n}
      </Txt>
    </g>
  );
}

/** A leader line ending in a dot on the thing it points at. */
export function Leader({
  ctx,
  points,
  color,
  className,
  style,
}: {
  ctx: Ctx;
  points: readonly Pt[];
  color?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const c = color ?? ctx.p.ink;
  const end = points[points.length - 1];
  return (
    <g className={className} style={style}>
      <path d={line(points)} stroke={c} strokeWidth={ctx.w.hair} fill="none" pathLength={1} />
      <circle cx={end[0]} cy={end[1]} r={1.1} fill={c} />
    </g>
  );
}

/** A hatch pattern for fills: parallel lines at `angle`, `gap` apart. */
export function Hatch({
  id,
  angle = 45,
  gap = 3,
  color,
  width,
  cross = false,
  background,
}: {
  id: string;
  angle?: number;
  gap?: number;
  color: string;
  width: number;
  cross?: boolean;
  background?: string;
}) {
  const h = gap / 2;
  return (
    <pattern
      id={id}
      width={gap}
      height={gap}
      patternUnits="userSpaceOnUse"
      patternTransform={`rotate(${angle})`}
    >
      {background ? <rect width={gap} height={gap} fill={background} /> : null}
      <path d={`M${h} 0V${gap}${cross ? `M0 ${h}H${gap}` : ""}`} stroke={color} strokeWidth={width} />
    </pattern>
  );
}

/** A stipple pattern: one dot per cell. */
export function Stipple({
  id,
  gap = 3,
  r = 0.45,
  color,
  background,
}: {
  id: string;
  gap?: number;
  r?: number;
  color: string;
  background?: string;
}) {
  return (
    <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse">
      {background ? <rect width={gap} height={gap} fill={background} /> : null}
      <circle cx={gap / 2} cy={gap / 2} r={r} fill={color} />
    </pattern>
  );
}

/**
 * Engraver's water lines: rings that follow the coast out to sea. `d` is the
 * land outline (closed paths, closed off-canvas where they leave the frame).
 * Draw before the land fill, which covers the inner half of every ring.
 */
export function WaterLines({
  ctx,
  d,
  rings = [2.2, 4.6, 7.4, 10.8],
}: {
  ctx: Ctx;
  d: string;
  rings?: readonly number[];
}) {
  const { p, w } = ctx;
  const outerFirst = [...rings].sort((a, b) => b - a);
  return (
    <g fill="none" strokeLinejoin="round" strokeLinecap="round" aria-hidden>
      {outerFirst.map((r, i) => (
        <g key={r}>
          <path d={d} stroke={p.muted} strokeOpacity={0.16 + 0.1 * i} strokeWidth={r2(2 * r + w.hair)} />
          <path d={d} stroke={p.canvas} strokeWidth={r2(2 * r - w.hair)} />
        </g>
      ))}
    </g>
  );
}

/** Graticule ticks along the frame edges, as on a survey sheet. */
export function FrameTicks({
  ctx,
  xs = [],
  ys = [],
  len = 4,
}: {
  ctx: Ctx;
  xs?: readonly number[];
  ys?: readonly number[];
  len?: number;
}) {
  let d = "";
  for (const x of xs) d += `M${r2(x)} 0V${len}M${r2(x)} ${H}V${H - len}`;
  for (const y of ys) d += `M0 ${r2(y)}H${len}M${W} ${r2(y)}H${W - len}`;
  return <path d={d} stroke={ctx.p.muted} strokeWidth={ctx.w.hair} fill="none" />;
}
