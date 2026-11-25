import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { ChapterArcs } from "@/lib/xrefs/types";
import { arcSeed, halfEllipseLength, litRuns, TIMING } from "../arc-light";

const data = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "public/data/xrefs/chapter-arcs.json"), "utf8"),
) as ChapterArcs;

/** The cover figure at its widest, and its baseline. */
const WIDTH = 1208;
const BASE = 214;

/** The arcs laid out along the spine (book gaps don't matter here). */
function layout(width: number) {
  const unit = width / data.chapters;
  const ratio = Math.min(1, (BASE - 8) / (width / 2));
  const x1 = new Float32Array(data.links.length);
  const lengths = new Float32Array(data.links.length);
  data.links.forEach(([a, b], i) => {
    x1[i] = (a + 0.5) * unit;
    const r = ((b - a) * unit) / 2;
    lengths[i] = halfEllipseLength(r, Math.max(1.5, r * ratio));
  });
  return { x1, lengths, count: data.links.length, maxLength: lengths.reduce((m, l) => Math.max(m, l), 0) };
}

const fract = (x: number) => x - Math.floor(x);

/** Whether the vertex shader in arc-light.ts lights arc `i` at `time` (a line-for-line mirror of its test). */
function shaderLights(arcs: ReturnType<typeof layout>, i: number, width: number, time: number) {
  const { pass, margin: share, speed, jitter, jitterSpeed, afterglow } = TIMING;
  const margin = width * share;
  const span = width + 2 * margin;
  const t = time < pass ? time : pass + ((time - pass) % pass);
  const seed = arcSeed(i);
  const travel = Math.max(arcs.lengths[i], 0.5) / (speed * (1 + jitterSpeed * (fract(seed * 7.31) - 0.5)));
  const reached = ((arcs.x1[i] + margin) / span) * pass + jitter * (seed - 0.5);
  const age = t - reached - pass * Math.floor((t - reached) / pass);
  return t - age >= 0 && age < travel + afterglow;
}

describe("halfEllipseLength", () => {
  it("is exact for a semicircle", () => {
    expect(halfEllipseLength(10, 10)).toBeCloseTo(Math.PI * 10, 10);
  });

  it("matches the arc length of the cover's flattest, widest arc", () => {
    const [a, b] = [604, 206];
    let length = 0;
    const steps = 100_000;
    for (let k = 0; k < steps; k++) {
      const t = ((k + 0.5) / steps) * Math.PI;
      length += Math.hypot(a * Math.sin(t), b * Math.cos(t)) * (Math.PI / steps);
    }
    expect(Math.abs(halfEllipseLength(a, b) - length) / length).toBeLessThan(1e-4);
  });
});

describe("arcSeed", () => {
  const seeds = Array.from({ length: data.links.length }, (_, i) => arcSeed(i));

  it("is stable and stays within 0…1", () => {
    expect(arcSeed(42)).toBe(arcSeed(42));
    expect(seeds.every((s) => s >= 0 && s < 1)).toBe(true);
  });

  it("spreads evenly, even between neighbouring arcs", () => {
    const deciles = new Array<number>(10).fill(0);
    for (const s of seeds) deciles[Math.floor(s * 10)]++;
    for (const n of deciles) expect(n / seeds.length).toBeGreaterThan(0.09);
    const step = seeds.slice(1).reduce((sum, s, i) => sum + Math.abs(s - seeds[i]), 0) / (seeds.length - 1);
    expect(step).toBeGreaterThan(0.3); // 1/3 for independent draws
  });
});

describe("litRuns", () => {
  const arcs = layout(WIDTH);
  // Two full passes in small steps, including both seams and the very start.
  const times = Array.from({ length: Math.ceil((TIMING.pass * 2.2) / 0.1) }, (_, k) => k * 0.1);

  it("includes every arc the shader lights", () => {
    for (const time of times) {
      const runs = litRuns(arcs, WIDTH, time);
      for (let i = 0; i < arcs.count; i++) {
        if (shaderLights(arcs, i, WIDTH, time) && !runs.some(([s, e]) => i >= s && i < e)) {
          throw new Error(`arc ${i} is lit at ${time.toFixed(1)} s but not drawn`);
        }
      }
    }
  });

  it("draws each arc at most once and only a share of them", () => {
    let widest = 0;
    for (const time of times) {
      const runs = litRuns(arcs, WIDTH, time);
      runs.forEach(([start, end], k) => {
        expect(end).toBeGreaterThan(start);
        if (k > 0) expect(start).toBeGreaterThan(runs[k - 1][1]);
      });
      widest = Math.max(widest, runs.reduce((n, [s, e]) => n + e - s, 0) / arcs.count);
    }
    expect(widest).toBeLessThan(0.6);
  });
});
