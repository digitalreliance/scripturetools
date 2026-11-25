import type { ReactNode } from "react";
import { css, FS, LINEAR, timing, Txt, r2, type Ctx } from "./kit";

type Reign = readonly [name: string, from: number, to: number];

/*
 * Reigns in years BC after Thiele, sole reigns only (co-regencies are folded
 * into the successor). Reigns under a year (Zimri's seven days, Shallum's
 * month) keep a sliver so the turmoil before 722 stays visible.
 */
const ISRAEL: readonly Reign[] = [
  ["Jeroboam", 931, 910], ["Nadab", 910, 909], ["Baasha", 909, 886], ["Elah", 886, 885],
  ["Zimri", 885, 885], ["Omri", 885, 874], ["Ahab", 874, 853], ["Ahaziah", 853, 852],
  ["Joram", 852, 841], ["Jehu", 841, 814], ["Jehoahaz", 814, 798], ["Jehoash", 798, 782],
  ["Jeroboam II", 782, 753], ["Zachariah", 753, 752], ["Shallum", 752, 752], ["Menahem", 752, 742],
  ["Pekahiah", 742, 740], ["Pekah", 740, 732], ["Hoshea", 732, 722],
];

const JUDAH: readonly Reign[] = [
  ["Rehoboam", 931, 913], ["Abijam", 913, 911], ["Asa", 911, 870], ["Jehoshaphat", 870, 848],
  ["Jehoram", 848, 841], ["Ahaziah", 841, 841], ["Athaliah", 841, 835], ["Joash", 835, 796],
  ["Amaziah", 796, 767], ["Uzziah", 767, 740], ["Jotham", 740, 732], ["Ahaz", 732, 715],
  ["Hezekiah", 715, 686], ["Manasseh", 686, 642], ["Amon", 642, 640], ["Josiah", 640, 609],
  ["Jehoahaz", 609, 609], ["Jehoiakim", 609, 598], ["Jehoiachin", 598, 598], ["Zedekiah", 597, 586],
];

/** Kings named on the plate; the rest are bars only. */
const NAMED = new Set(["Jeroboam", "Ahab", "Jehu", "Jeroboam II", "Asa", "Joash", "Uzziah", "Hezekiah", "Josiah"]);

/** Prophets by the kingdom they spoke to: a ministry span, or a single year. */
type Prophet = readonly [name: string, from: number, to?: number];
const TO_ISRAEL: readonly Prophet[] = [
  ["Ahijah", 931],
  ["Elijah", 870, 852],
  ["Elisha", 852, 798],
  ["Jonah", 785],
  ["Hosea", 755, 715],
];
const TO_JUDAH: readonly Prophet[] = [
  ["Shemaiah", 930],
  ["Isaiah", 740, 686],
  ["Jeremiah", 627, 586],
];

const START = 931;
const SAMARIA = 722;
const JERUSALEM = 586;

/**
 * The divided kingdom: Israel's and Judah's reigns in two lanes on one scale,
 * with the prophets sent to each. Israel's lane stops at 722. Hover runs the
 * years forward, reign by reign.
 */
export function parallelReigns(ctx: Ctx): ReactNode {
  const { p, w, thumb } = ctx;
  const x0 = thumb ? 24 : 58;
  const x1 = thumb ? 296 : 280;
  const frac = (bc: number) => (START - bc) / (START - JERUSALEM);
  const x = (bc: number) => r2(x0 + frac(bc) * (x1 - x0));
  const sweep = thumb ? 1200 : 1350;
  const at = (bc: number) => frac(bc) * sweep;

  const laneH = thumb ? 32 : 12;
  const israelY = thumb ? 40 : 50;
  const judahY = thumb ? 128 : 110;
  const gap = thumb ? 3.4 : 0.8;
  const sliver = thumb ? 2.6 : 0.7;
  const axisY = 148;

  /** One bar per reign; thumbs fold reigns too short to show into the next. */
  const lane = (reigns: readonly Reign[], y: number) => {
    const minWidth = thumb ? 8 : 0;
    const bars: { key: string; from: number; to: number }[] = [];
    for (const [name, from, to] of reigns) {
      const last = bars[bars.length - 1];
      if (last && x(last.to) - x(last.from) < minWidth) last.to = to;
      else bars.push({ key: `${name}-${from}`, from, to });
    }
    return bars.map(({ key, from, to }, i) => {
      const left = i === 0 ? x(from) : x(from) + gap / 2;
      const right = Math.max(x(to) - gap / 2, left + sliver);
      return (
        <rect
          key={key}
          x={r2(left)}
          y={y}
          width={r2(right - left)}
          height={laneH}
          rx={thumb ? 2 : 0.8}
          fill={p.accent}
          className={css.growX}
          style={timing(at(from), Math.max(140, at(to) - at(from)), LINEAR)}
        />
      );
    });
  };

  const kings = (reigns: readonly Reign[], y: number) =>
    reigns
      .filter(([name]) => NAMED.has(name))
      .map(([name, from, to]) => {
        const first = from === START;
        return (
          <Txt
            key={name}
            x={first ? x(from) : r2((x(from) + x(to)) / 2)}
            y={y}
            textAnchor={first ? "start" : "middle"}
            size={FS.small}
            fill={p.ink}
            className={css.fade}
            style={timing(at(from) + 120, 260)}
          >
            {name}
          </Txt>
        );
      });

  /**
   * A diamond where the ministry starts, a fine span to where it ends. Thumbs
   * keep one diamond per prophet, at the middle of the ministry.
   */
  const prophets = (list: readonly Prophet[], y: number, labelY: number) =>
    list.map(([name, from, to]) => {
      const a = thumb && to ? x((from + to) / 2) : x(from);
      const b = to ? x(to) : a;
      const s = thumb ? 10 : 2.2;
      const atEdge = from > 925;
      return (
        <g key={name}>
          {to && !thumb ? (
            <path
              d={`M${a} ${y}H${b}M${b} ${r2(y - 2)}V${r2(y + 2)}`}
              stroke={p.ink}
              strokeWidth={w.fine}
              fill="none"
              className={css.growX}
              style={timing(at(from), Math.max(160, at(to) - at(from)), LINEAR)}
            />
          ) : null}
          <path
            d={`M${a} ${r2(y - s)}L${r2(a + s)} ${y}L${a} ${r2(y + s)}L${r2(a - s)} ${y}Z`}
            fill={p.ink}
            stroke={thumb ? "none" : p.canvas}
            strokeWidth={w.hair}
            className={css.pop}
            style={timing(at(from), 260)}
          />
          {thumb ? null : (
            <Txt
              x={atEdge ? r2(a - s) : to ? r2((a + b) / 2) : a}
              y={labelY}
              textAnchor={atEdge ? "start" : "middle"}
              size={FS.small}
              fill={p.muted}
              className={css.fade}
              style={timing(at(from) + 80, 260)}
            >
              {name}
            </Txt>
          )}
        </g>
      );
    });

  if (thumb) {
    const mid = (israelY + laneH + judahY) / 2;
    return (
      <g>
        {lane(ISRAEL, israelY)}
        {lane(JUDAH, judahY)}
        {prophets(TO_ISRAEL.slice(1), r2(mid - 12), 0)}
        {prophets(TO_JUDAH.slice(1), r2(mid + 12), 0)}
      </g>
    );
  }

  const israelMid = r2(israelY + laneH / 2);
  const judahMid = r2(judahY + laneH / 2);
  const toIsraelY = r2(israelY + laneH + 8);
  const toJudahY = r2(judahY - 8);

  return (
    <g>
      {/* Half-century grid and the year axis. */}
      <path
        d={[900, 850, 800, 750, 700, 650, 600].map((bc) => `M${x(bc)} ${israelY - 2}V${axisY}`).join("")}
        stroke={p.line}
        strokeWidth={w.hair}
      />
      <path d={`M${x0} ${axisY}H${x1}`} stroke={p.muted} strokeWidth={w.hair} />
      {[900, 800, 700, 600].map((bc) => (
        <g key={bc}>
          <path d={`M${x(bc)} ${axisY}v3`} stroke={p.muted} strokeWidth={w.fine} />
          <Txt x={x(bc)} y={axisY + 10} textAnchor="middle" fill={p.muted} size={FS.small}>
            {bc}
          </Txt>
        </g>
      ))}
      <Txt x={x0 - 6} y={axisY + 10} textAnchor="end" fill={p.muted} size={FS.small}>
        Years BC
      </Txt>

      {/* Row names. */}
      <Txt x={x0 - 6} y={r2(israelMid + 2.2)} textAnchor="end" fill={p.ink}>
        Israel
      </Txt>
      <Txt x={x0 - 6} y={r2((toIsraelY + toJudahY) / 2 + 2)} textAnchor="end" fill={p.muted} size={FS.small}>
        Prophets
      </Txt>
      <Txt x={x0 - 6} y={r2(judahMid + 2.2)} textAnchor="end" fill={p.ink}>
        Judah
      </Txt>

      {lane(ISRAEL, israelY)}
      {lane(JUDAH, judahY)}
      {kings(ISRAEL, r2(israelY - 4))}
      {kings(JUDAH, r2(judahY + laneH + 8.5))}
      {prophets(TO_ISRAEL, toIsraelY, r2(toIsraelY + 9))}
      {prophets(TO_JUDAH, toJudahY, r2(toJudahY - 5.5))}

      {/* Where each lane ends: Samaria taken, Jerusalem burnt. */}
      <Txt
        x={r2(x(SAMARIA) + 3)}
        y={r2(israelMid + 2)}
        size={FS.small}
        fill={p.muted}
        className={css.fade}
        style={timing(at(SAMARIA) + 80, 260)}
      >
        {SAMARIA}
      </Txt>
      <Txt
        x={r2(x(JERUSALEM) + 3)}
        y={r2(judahMid + 2)}
        size={FS.small}
        fill={p.muted}
        className={css.fade}
        style={timing(sweep + 80, 260)}
      >
        {JERUSALEM}
      </Txt>
    </g>
  );
}
