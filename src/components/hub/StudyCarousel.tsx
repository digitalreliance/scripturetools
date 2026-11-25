"use client";

import Link from "next/link";
import { Pause, Play } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { clsx } from "clsx";

export interface CarouselSlide {
  id: string;
  /** The study's name, for its tab. */
  title: string;
  href: string | null;
  /** The plate's drawing, rendered on the server. */
  figure: ReactNode;
  /** Everything beside the plate, rendered on the server. */
  text: ReactNode;
}

/** How long each study is presented: its plate's demo (up to ~6 s), then a rest. */
const DWELL_MS = 8000;
/** Share of the carousel that must be on screen before anything plays. */
const VISIBLE_RATIO = 0.35;
/** The most one frame may add to the clock, so a stalled tab never skips a study. */
const MAX_FRAME_MS = 100;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const prefersReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;

/**
 * The presented plate's demo: not started (as prerendered), held on its first
 * frame until the carousel is seen, playing, or finished.
 */
type Demo = "idle" | "armed" | "playing" | "done";

/**
 * Presents studies one at a time in the hub's plate. Each arrives with its
 * plate's demo (the `illo-play` class), stays for DWELL_MS, then gives way to
 * the next. Rotation runs only while the carousel is on screen; it holds while
 * the pointer is over it or keyboard focus is inside it, stops with the pause
 * button, and starts stopped under reduced motion. With a single study there is
 * nothing to rotate: its demo plays once when it comes into view, and hovering
 * the plate replays it.
 */
export function StudyCarousel({ slides, label }: { slides: CarouselSlide[]; label: string }) {
  const count = slides.length;
  const multiple = count > 1;
  const baseId = useId();
  const root = useRef<HTMLElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  /** How long the current study has been on show, in ms. */
  const shown = useRef(0);

  const [active, setActive] = useState(0);
  const [demo, setDemo] = useState<Demo>("idle");
  const [visible, setVisible] = useState(false);
  const [choice, setChoice] = useState<"auto" | "play" | "pause">("auto");
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);

  const rotating = multiple && (choice === "play" || (choice === "auto" && !reducedMotion));
  const ticking = visible && (multiple ? rotating && !hovered && !focused : demo === "playing");

  /** Fill the current tab's bar to the time shown and empty the others. */
  const paint = useCallback((index: number) => {
    const progress = Math.min(1, shown.current / DWELL_MS);
    bars.current.forEach((bar, i) => bar?.style.setProperty("--progress", String(i === index ? progress : 0)));
  }, []);

  /** Present a study from the start, demo and all. */
  const show = useCallback(
    (index: number) => {
      shown.current = 0;
      paint(index);
      setActive(index);
      setDemo("playing");
    },
    [paint],
  );

  // Nothing plays off screen. The first report also arms the demo of a
  // carousel below the fold, so it starts from its first frame when reached.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const seen = entry.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO - 0.01;
        setVisible(seen);
        setDemo((d) => (d === "idle" || d === "armed" ? (seen ? "playing" : "armed") : d));
      },
      { threshold: [0, VISIBLE_RATIO] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The clock: a frame loop that runs only while rotating (for a single study,
  // while its demo plays) and stops whenever anything above holds it.
  useEffect(() => {
    if (!ticking) return;
    let frame = 0;
    let last: number | undefined;
    const tick = (now: number) => {
      if (last !== undefined) shown.current += Math.min(MAX_FRAME_MS, Math.max(0, now - last));
      last = now;
      if (shown.current < DWELL_MS) {
        if (multiple) paint(active);
        frame = requestAnimationFrame(tick);
      } else if (multiple) {
        show((active + 1) % count);
      } else {
        // Finished: hovering the plate can replay it from here.
        setDemo("done");
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ticking, multiple, active, count, paint, show]);

  const toggleRotation = () => {
    if (rotating) {
      setChoice("pause");
      // Stopping stops everything: the plate shows its finished drawing.
      setDemo((d) => (d === "playing" || d === "armed" ? "done" : d));
    } else {
      setChoice("play");
    }
  };

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target =
      event.key === "ArrowRight"
        ? (index + 1) % count
        : event.key === "ArrowLeft"
          ? (index - 1 + count) % count
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? count - 1
              : null;
    if (target === null) return;
    event.preventDefault();
    show(target);
    tabs.current[target]?.focus();
  };

  return (
    <section
      ref={root}
      aria-label={label}
      aria-roledescription={multiple ? "carousel" : undefined}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={(event) => {
        if (event.target.matches(":focus-visible")) setFocused(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div className="grid grid-cols-12 items-center gap-x-12">
        {/* One frame; the drawings stack inside it and the new one fades in over the old. */}
        <div className="col-span-7 grid overflow-hidden rounded-plate border border-paper-line bg-paper-raised">
          {slides.map((slide, i) => {
            const current = i === active;
            const playing = current && (demo === "armed" || demo === "playing");
            const className = clsx(
              "col-start-1 row-start-1 block transition-[opacity,visibility]",
              current
                ? "illo-host z-10 opacity-100 duration-500 ease-out-quint"
                : "pointer-events-none invisible z-0 opacity-0 delay-500 duration-0",
              playing && "illo-play",
            );
            const style = playing
              ? ({ "--illo-state": demo === "playing" && visible ? "running" : "paused" } as CSSProperties)
              : undefined;
            return slide.href ? (
              <Link key={slide.id} href={slide.href} tabIndex={-1} aria-hidden className={className} style={style}>
                {slide.figure}
              </Link>
            ) : (
              <div key={slide.id} aria-hidden className={className} style={style}>
                {slide.figure}
              </div>
            );
          })}
        </div>

        <div className="col-span-5 grid" aria-live={multiple ? (rotating ? "off" : "polite") : undefined}>
          {slides.map((slide, i) => {
            const current = i === active;
            return (
              <div
                key={slide.id}
                id={`${baseId}-slide-${i}`}
                role={multiple ? "tabpanel" : undefined}
                aria-roledescription={multiple ? "slide" : undefined}
                aria-label={multiple ? `${i + 1} of ${count}` : undefined}
                inert={!current}
                className={clsx(
                  "col-start-1 row-start-1 self-center transition-[opacity,translate,visibility] ease-out-quint",
                  current ? "opacity-100 delay-150 duration-500" : "invisible translate-y-1.5 opacity-0 duration-150",
                )}
              >
                {slide.text}
              </div>
            );
          })}
        </div>
      </div>

      {multiple ? (
        <div className="mt-10 flex items-center gap-6">
          <button
            type="button"
            onClick={toggleRotation}
            aria-label={rotating ? "Pause rotation" : "Start rotation"}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-control border border-paper-line bg-paper-raised text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
          >
            {rotating ? <Pause aria-hidden className="size-3.5" /> : <Play aria-hidden className="size-3.5" />}
          </button>
          <div
            role="tablist"
            aria-label="Studies"
            className="grid flex-1 gap-6"
            style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 15rem))` }}
          >
            {slides.map((slide, i) => {
              const current = i === active;
              return (
                <button
                  key={slide.id}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${i}`}
                  aria-selected={current}
                  aria-controls={`${baseId}-slide-${i}`}
                  tabIndex={current ? 0 : -1}
                  onClick={() => show(i)}
                  onKeyDown={(event) => onTabKey(event, i)}
                  className="group min-w-0 rounded-[4px] py-1 text-left"
                >
                  <span
                    className={clsx(
                      "block h-[2px] overflow-hidden rounded-full transition-colors",
                      current ? "bg-ink/30" : "bg-paper-line group-hover:bg-ink/20",
                    )}
                  >
                    <span
                      ref={(el) => {
                        bars.current[i] = el;
                      }}
                      className="block h-full origin-left bg-ink [transform:scaleX(var(--progress,0))]"
                    />
                  </span>
                  <span
                    className={clsx(
                      "mt-3 block truncate text-[13px] transition-colors",
                      current ? "font-medium text-ink" : "text-ink-muted group-hover:text-ink",
                    )}
                  >
                    {slide.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
