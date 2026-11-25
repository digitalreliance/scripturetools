import { BrandMark } from "@/components/brand/BrandMark";
import { SITE } from "@/lib/site";
import styles from "./DeviceGate.module.css";
import { GateActions } from "./GateActions";
import { PreviewBar } from "./PreviewBar";

/** Canon colours for the arcs on the illustrated screen. */
const ARCS = [
  { d: "M44 92a22 22 0 0 1 44 0", color: "var(--color-canon-law)" },
  { d: "M60 92a40 40 0 0 1 80 0", color: "var(--color-canon-prophets)" },
  { d: "M96 92a26 26 0 0 1 52 0", color: "var(--color-canon-gospels)" },
  { d: "M52 92a56 56 0 0 1 112 0", color: "var(--color-canon-wisdom)" },
  { d: "M120 92a18 18 0 0 1 36 0", color: "var(--color-canon-epistles)" },
];

/**
 * The phone and tablet screen. It is part of every page's static HTML but
 * hidden by default; the boot script in <head> reveals it before first paint
 * on touch-first devices (see globals.css). Both elements below must stay
 * direct children of <body>.
 */
export function DeviceGate() {
  return (
    <>
      <div
        data-device-gate
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-gate-title"
        aria-describedby="device-gate-body"
        className="theme-cover min-h-dvh bg-cover px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] text-cover-ink"
      >
        <div className="mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-sm flex-col">
          <div className="flex items-center gap-2 text-[15px] font-semibold [font-stretch:112%]">
            <BrandMark className="size-[22px]" />
            {SITE.name}
          </div>

          <div className="flex flex-1 flex-col justify-center py-10">
            <svg viewBox="0 0 208 132" aria-hidden className="mb-10 w-full max-w-[260px] self-center">
              <rect x="20" y="8" width="168" height="104" rx="8" fill="none" stroke="var(--color-cover-line)" strokeWidth="2" />
              <path d="M4 118h200l-8 10H12z" fill="var(--color-cover-raised)" stroke="var(--color-cover-line)" strokeWidth="2" strokeLinejoin="round" />
              <path d="M36 92h136" stroke="var(--color-cover-muted)" strokeWidth="1.5" strokeLinecap="round" />
              <g fill="none" strokeWidth="2" strokeLinecap="round">
                {ARCS.map((arc) => (
                  <path key={arc.d} d={arc.d} stroke={arc.color} pathLength={1} className={styles.arc} />
                ))}
              </g>
            </svg>

            <h1 id="device-gate-title" className="text-[34px] leading-[1.08] font-semibold tracking-[-0.02em] [font-stretch:118%]">
              Made for a larger screen
            </h1>
            <p id="device-gate-body" className="mt-4 text-[17px] leading-relaxed text-cover-muted">
              {SITE.name}&rsquo;s maps, diagrams and timelines need the room of a laptop or
              desktop. Send yourself this link and open it on a computer.
            </p>

            <div className="mt-8">
              <GateActions />
            </div>
          </div>

          <p className="text-[13px] leading-relaxed text-cover-muted">
            The preview shows the full desktop layout, scaled to fit your screen.
          </p>
        </div>
      </div>
      <PreviewBar />
    </>
  );
}
