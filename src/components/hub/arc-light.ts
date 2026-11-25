/**
 * Light passing through the cross-reference arcs.
 *
 * A WebGL2 overlay for `CrossReferenceArcs`. A front of light reads through
 * the canon from Genesis to Revelation, again and again. As it reaches the
 * earlier chapter of a link, light leaves that foot and runs along the arc to
 * the later chapter, then dims back to rest. Each pass flows seamlessly into
 * the next: the last arcs out of Revelation are still settling as the front
 * returns to Genesis.
 *
 * The overlay draws only light. The resting arcs stay on the 2D canvas
 * underneath, and the page adds the two together (`mix-blend-mode:
 * plus-lighter`). Arcs are sorted by their left foot, so the arcs that are lit
 * at any moment form one contiguous run of instances (two across the seam),
 * and each frame draws only that run, and only the lit part of each arc.
 */

/** When and how fast the light moves. The shader and the culling in `litRuns` both follow it. */
export const TIMING = {
  /** Seconds for the front to read from Genesis to Revelation. */
  pass: 18,
  /** Distance the front travels past each end of the spine, as a share of the width, so the first and last chapters light in full. */
  margin: 0.01,
  /** Speed of light along an arc, CSS px per second. The longest arcs take about four seconds to cross the Bible. */
  speed: 300,
  /** Each arc lights up to half this many seconds early or late… */
  jitter: 0.6,
  /** …and runs up to half this share faster or slower, so the heads never march in step. */
  jitterSpeed: 0.35,
  /** Seconds a lit stretch of arc takes to return to rest after the head passes. */
  afterglow: 2.2,
} as const;

/** Seconds for the bright head's tail to fade. */
const HEAD_TAU = 0.28;
/** Intensity of the head and of the afterglow, relative to the arc's resting alpha. */
const HEAD_GAIN = 2.8;
const GLOW_GAIN = 0.35;
/** Soft light around each head, as a share of the head's intensity. */
const BLOOM = 0.3;
/** How far a head's core runs toward white. */
const WHITE_HOT = 0.4;
/** How much more light the strongest links carry than the weakest (0: light in proportion to resting alpha). */
const SELECT = 1;
/** Light left at the very foot of an arc, where hundreds of arcs meet the spine. */
const FOOT = 0.35;
/** Half-width of each arc's ribbon in CSS px: room for the soft bloom around each head. */
const REACH = 3.5;
/** Segments per arc. Plenty for the flattest, widest arc to read as a smooth curve. */
const SEGMENTS = 72;

/** Arcs ready for the GPU, built by the caller from the figure's geometry. */
export interface LightArcs {
  /** Per arc, interleaved: x1, x2, resting alpha, path length (CSS px), canon group index, seed (0…1). */
  data: Float32Array;
  /** Left foot of each arc, ascending (the order of `data`). */
  x1: Float32Array;
  count: number;
  /** Longest path length, CSS px. */
  maxLength: number;
}

/** Size of the drawing surface. */
export interface LightView {
  width: number;
  height: number;
  /** Baseline of the spine, CSS px from the top. */
  base: number;
  dpr: number;
}

export const FLOATS_PER_ARC = 6;

const VERTEX = /* glsl */ `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_vertex;  // t along the arc (0 left foot, 1 right foot), side of the ribbon (-1, 1)
layout(location = 1) in vec4 a_arc;     // x1, x2, resting alpha, path length
layout(location = 2) in vec2 a_extra;   // canon group index, seed (0…1)

uniform vec2 u_view;
uniform float u_base;
uniform float u_ratio;
uniform float u_time;
uniform float u_pass;
uniform float u_span;
uniform float u_margin;
uniform float u_speed;
uniform float u_life;
uniform float u_reach;
uniform float u_jitter;
uniform float u_jitterSpeed;
uniform float u_select;
uniform float u_strongest;
uniform vec3 u_palette[7];

out vec3 v_color;
out float v_alpha;
out float v_side;
out float v_lag;
out float v_speed;
out float v_height;

const float PI = 3.14159265359;

void main() {
  float x1 = a_arc.x;
  float x2 = a_arc.y;
  float len = max(a_arc.w, 0.5);
  float seed = a_extra.y;
  float speed = u_speed * (1.0 + u_jitterSpeed * (fract(seed * 7.31) - 0.5));
  float travel = len / speed;

  // Seconds since the front last passed this arc's left foot.
  float reached = (x1 + u_margin) / u_span * u_pass + u_jitter * (seed - 0.5);
  float age = mod(u_time - reached, u_pass);
  bool lit = u_time - age >= 0.0 && age < travel + u_life;
  if (!lit) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }

  // Draw only the lit stretch: from where the afterglow has died to just past the head.
  float head = age / travel;
  float tail = (age - u_life) / travel;
  float lead = 8.0 / len;
  float t = clamp(a_vertex.x, max(tail, 0.0), min(head + lead, 1.0));

  float r = (x2 - x1) * 0.5;
  float ry = max(1.5, r * u_ratio);
  float theta = PI + t * PI;
  vec2 p = vec2(x1 + r + r * cos(theta), u_base + ry * sin(theta));
  float height = u_base - p.y;
  vec2 tangent = normalize(vec2(-r * sin(theta), ry * cos(theta)) + 1e-6);
  vec2 normal = vec2(-tangent.y, tangent.x);
  // Small loops between neighbouring chapters get a narrow ribbon so it can't fold over itself.
  float reach = min(u_reach, 0.75 + ry);
  p += normal * a_vertex.y * reach;

  vec2 clip = p / u_view * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  v_color = u_palette[int(a_extra.x + 0.5)];
  // The most-cited links carry the most light: a weak link glows, a strong one shines.
  v_alpha = a_arc.z * pow(a_arc.z / u_strongest, u_select);
  v_side = a_vertex.y * reach;
  v_height = height;
  v_lag = age - t * travel;
  v_speed = speed;
}
`;

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

in vec3 v_color;
in float v_alpha;
in float v_side;
in float v_lag;
in float v_speed;
in float v_height;

uniform float u_dpr;
uniform float u_life;
uniform float u_headTau;
uniform float u_headGain;
uniform float u_glowGain;
uniform float u_bloom;
uniform float u_whiteHot;
uniform float u_foot;

out vec4 outColor;

void main() {
  // Across the ribbon: a crisp core about a pixel wide, and a soft bloom.
  float d = abs(v_side);
  float core = clamp((0.55 - d) * u_dpr + 0.5, 0.0, 1.0);
  float bloom = exp(-d * d / 2.4);

  // Along the arc: nothing ahead of the head, a soft leading edge, a bright
  // tail, then an afterglow that eases back to rest.
  float ahead = min(v_lag, 0.0) * v_speed;
  float lead = exp(-ahead * ahead / 8.0);
  float lag = max(v_lag, 0.0);
  float headLight = exp(-lag / u_headTau) * lead;
  float fade = max(1.0 - lag / u_life, 0.0);
  float glow = fade * fade * lead;

  // Only the head blooms, and its core runs white-hot; the tail keeps the arc's pigment.
  float light = core * (u_headGain * headLight + u_glowGain * glow) + bloom * u_bloom * u_headGain * headLight;
  // Hundreds of arcs share each foot: let the light rise out of the spine rather than pool on it.
  light *= mix(u_foot, 1.0, smoothstep(0.0, 22.0, v_height));
  float a = min(1.0, light * v_alpha);
  vec3 color = mix(v_color, vec3(1.0), u_whiteHot * headLight * core);
  outColor = vec4(color * a, a);
}
`;

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create a shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader did not compile: ${log}`);
  }
  return shader;
}

function link(gl: WebGL2RenderingContext): WebGLProgram {
  const program = gl.createProgram();
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Shader program did not link: ${log}`);
  }
  return program;
}

/** First index whose value is >= `value` in an ascending array. */
function lowerBound(values: Float32Array, value: number): number {
  let lo = 0;
  let hi = values.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (values[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** First index whose value is > `value` in an ascending array. */
function upperBound(values: Float32Array, value: number): number {
  let lo = 0;
  let hi = values.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (values[mid] <= value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** "#E2553A" to 0…1 channels. Like the 2D canvas underneath, the light blends in sRGB. */
function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * The runs of arcs, as [start, end) instance ranges, that can be lit at
 * `time`: those whose left foot the front passed recently enough for their
 * light to still be travelling or fading. Every arc the shader would light is
 * inside a run; the shader discards the rest of each run itself.
 */
export function litRuns(arcs: Pick<LightArcs, "x1" | "count" | "maxLength">, width: number, time: number): [number, number][] {
  const { pass, margin: share, speed, jitter, jitterSpeed, afterglow } = TIMING;
  const margin = width * share;
  const span = width + 2 * margin;
  const cycle = time / pass;
  const front = (cycle - Math.floor(cycle)) * span - margin;
  // An arc lit this far behind the front can still be glowing; a late or early start shifts that by up to half the jitter.
  const slowest = speed * (1 - jitterSpeed / 2);
  const behind = ((arcs.maxLength / slowest + afterglow + jitter / 2) / pass) * span;
  const ahead = (jitter / 2 / pass) * span;
  const runs: [number, number][] = [[lowerBound(arcs.x1, front - behind), upperBound(arcs.x1, front + ahead)]];
  // Across the seam: arcs near Revelation still glowing from the previous pass…
  if (front - behind < -margin) runs.push([lowerBound(arcs.x1, front - behind + span), arcs.count]);
  // …and arcs near Genesis already lighting for the next one.
  if (front + ahead > width + margin) runs.push([0, upperBound(arcs.x1, front + ahead - span)]);

  // Never draw an arc twice: overlapping runs would double its light.
  runs.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [start, end] of runs) {
    if (end <= start) continue;
    const prev = merged.at(-1);
    if (prev && start <= prev[1]) prev[1] = Math.max(prev[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

export class ArcLight {
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly strip: WebGLBuffer;
  private readonly instances: WebGLBuffer;
  private readonly uniforms: Record<string, WebGLUniformLocation | null>;
  private arcs: LightArcs | null = null;
  private view: LightView | null = null;

  /** A renderer for this canvas, or null where WebGL2 is unavailable. */
  static create(canvas: HTMLCanvasElement, palette: readonly string[]): ArcLight | null {
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl || gl.isContextLost()) return null;
    try {
      return new ArcLight(gl, palette);
    } catch {
      return null;
    }
  }

  private constructor(gl: WebGL2RenderingContext, palette: readonly string[]) {
    this.gl = gl;
    this.program = link(gl);
    const vao = gl.createVertexArray();
    const strip = gl.createBuffer();
    const instances = gl.createBuffer();
    if (!vao || !strip || !instances) throw new Error("Could not allocate WebGL buffers");
    this.vao = vao;
    this.strip = strip;
    this.instances = instances;

    // One ribbon, shared by every arc: (t, side) pairs along a triangle strip.
    const vertices = new Float32Array((SEGMENTS + 1) * 4);
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS;
      vertices.set([t, -1, t, 1], i * 4);
    }
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, strip);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribDivisor(2, 1);
    gl.bindVertexArray(null);

    const names = [
      "u_view", "u_base", "u_ratio", "u_time", "u_pass", "u_span", "u_margin", "u_speed", "u_life",
      "u_reach", "u_jitter", "u_jitterSpeed", "u_palette", "u_dpr", "u_headTau", "u_headGain", "u_glowGain",
      "u_bloom", "u_whiteHot", "u_select", "u_strongest", "u_foot",
    ];
    this.uniforms = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(this.program, n)]));

    gl.useProgram(this.program);
    gl.uniform3fv(this.uniforms.u_palette, palette.flatMap(rgb));
    gl.uniform1f(this.uniforms.u_pass, TIMING.pass);
    gl.uniform1f(this.uniforms.u_speed, TIMING.speed);
    gl.uniform1f(this.uniforms.u_life, TIMING.afterglow);
    gl.uniform1f(this.uniforms.u_reach, REACH);
    gl.uniform1f(this.uniforms.u_jitter, TIMING.jitter);
    gl.uniform1f(this.uniforms.u_jitterSpeed, TIMING.jitterSpeed);
    gl.uniform1f(this.uniforms.u_headTau, HEAD_TAU);
    gl.uniform1f(this.uniforms.u_headGain, HEAD_GAIN);
    gl.uniform1f(this.uniforms.u_glowGain, GLOW_GAIN);
    gl.uniform1f(this.uniforms.u_bloom, BLOOM);
    gl.uniform1f(this.uniforms.u_whiteHot, WHITE_HOT);
    gl.uniform1f(this.uniforms.u_select, SELECT);
    gl.uniform1f(this.uniforms.u_foot, FOOT);
  }

  get lost(): boolean {
    return this.gl.isContextLost();
  }

  setArcs(arcs: LightArcs) {
    const { gl } = this;
    this.arcs = arcs;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instances);
    gl.bufferData(gl.ARRAY_BUFFER, arcs.data, gl.STATIC_DRAW);
    // Light is shared out relative to the strongest link.
    let strongest = 0;
    for (let i = 2; i < arcs.data.length; i += FLOATS_PER_ARC) strongest = Math.max(strongest, arcs.data[i]);
    gl.useProgram(this.program);
    gl.uniform1f(this.uniforms.u_strongest, strongest || 1);
  }

  setView(view: LightView) {
    const { gl } = this;
    this.view = view;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.width = Math.round(view.width * view.dpr);
    canvas.height = Math.round(view.height * view.dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(this.program);
    gl.uniform2f(this.uniforms.u_view, view.width, view.height);
    gl.uniform1f(this.uniforms.u_base, view.base);
    gl.uniform1f(this.uniforms.u_ratio, Math.min(1, (view.base - 8) / (view.width / 2)));
    gl.uniform1f(this.uniforms.u_dpr, view.dpr);
    const margin = view.width * TIMING.margin;
    gl.uniform1f(this.uniforms.u_margin, margin);
    gl.uniform1f(this.uniforms.u_span, view.width + 2 * margin);
  }

  /** Paint the light at `time` seconds on the light's own clock. */
  render(time: number) {
    const { gl, arcs, view } = this;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!arcs || !view || arcs.count === 0) return;

    const { pass } = TIMING;
    gl.useProgram(this.program);
    // Only the phase matters after the first pass; folding the clock keeps it precise in float32 however long the page stays open.
    gl.uniform1f(this.uniforms.u_time, time < pass ? time : pass + ((time - pass) % pass));
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instances);
    const stride = FLOATS_PER_ARC * 4;
    for (const [start, end] of litRuns(arcs, view.width, time)) {
      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, stride, start * stride);
      gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, start * stride + 16);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, (SEGMENTS + 1) * 2, end - start);
    }
    gl.bindVertexArray(null);
  }

  dispose() {
    const { gl } = this;
    gl.deleteBuffer(this.strip);
    gl.deleteBuffer(this.instances);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
    this.arcs = null;
  }
}

/** A stable pseudo-random number in 0…1 for arc `i`, so the light plays the same way on every visit. */
export function arcSeed(i: number): number {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Half the perimeter of an ellipse with radii `a` and `b` (Ramanujan). */
export function halfEllipseLength(a: number, b: number): number {
  return (Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)))) / 2;
}
