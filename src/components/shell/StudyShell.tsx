"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { ChevronLeft, PanelBottom, PanelLeft, PanelRight } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/cn";
import { HOME_HREF } from "@/lib/routes";
import { SITE } from "@/lib/site";
import { paletteVars, type StudyPalette } from "@/studies/palettes";
import { ContributeMenu } from "./ContributeMenu";
import { ShareButton } from "./ShareButton";
import styles from "./StudyShell.module.css";

export interface StudyShellProps {
  /** The study's registry slug: names its code and its issues on GitHub. */
  slug: string;
  title: string;
  palette: StudyPalette;
  /** Short qualifier after the title, e.g. "51 paired passages". */
  subtitle?: ReactNode;
  /** Centre of the top bar: usually a view switcher. */
  toolbar?: ReactNode;
  /** Right side of the top bar, before `search`. */
  actions?: ReactNode;
  search?: ReactNode;
  /** Rightmost control, e.g. the study's main action. */
  primaryAction?: ReactNode;
  sidebar?: ReactNode;
  sidebarLabel?: string;
  sidebarWidth?: number;
  inspector?: ReactNode;
  inspectorLabel?: string;
  inspectorWidth?: number;
  /**
   * What the reader has chosen, if anything: any value that changes when the
   * choice does. In the compact layout, a new choice opens the inspector
   * beneath the canvas and puts the outline away, so the reader sees what
   * they chose. Docked panels are left as the reader set them.
   */
  selection?: string | null;
  /**
   * Bump this number to bring the inspector into view in whichever layout is
   * on screen, for example from a button that points the reader to it.
   */
  revealInspector?: number;
  /** Status bar, left and right. Use <StatusItem> for labelled values. */
  status?: ReactNode;
  statusEnd?: ReactNode;
  /** The canvas. */
  children: ReactNode;
  canvasClassName?: string;
}

type Panel = "sidebar" | "inspector";
type Layout = "docked" | "compact";
type Panels = Record<Layout, Record<Panel, boolean>>;

/** Docked panels start open; in the compact layout they start put away. */
const INITIAL_PANELS: Panels = {
  docked: { sidebar: true, inspector: true },
  compact: { sidebar: false, inspector: false },
};

/** The inspector's share of the compact layout's height, in percent. */
const INSPECTOR_SHARE = { initial: 44, min: 22, max: 82, step: 6 };
/** Released below this share, a dragged inspector is put away instead. */
const DISMISS_SHARE = 14;

const DOCKED_QUERY = `(width >= ${SITE.dockedPanelsWidth}px)`;

function subscribeLayout(onChange: () => void) {
  const query = window.matchMedia(DOCKED_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const currentLayout = (): Layout => (window.matchMedia(DOCKED_QUERY).matches ? "docked" : "compact");

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

const clampShare = (share: number) => Math.min(INSPECTOR_SHARE.max, Math.max(INSPECTOR_SHARE.min, share));

const panelToggle =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-control text-s-muted transition-colors hover:bg-s-raised hover:text-s-ink active:bg-s-raised pointer-coarse:size-10";

/**
 * The frame every study uses: top bar, outline, canvas, inspector, status bar.
 * Themed entirely by the study's palette via --s-* CSS variables.
 *
 * It works on computers and tablets alike. From SITE.dockedPanelsWidth up,
 * the outline and inspector dock beside the canvas; in a narrower window (an
 * iPad held upright) the outline slides over the canvas and the inspector sits
 * beneath it, resizable by its top edge. Under a finger, every control grows
 * to a comfortable size (Tailwind's pointer-coarse).
 *
 * `[` and `]` show and hide the outline and the inspector, and Escape puts a
 * sliding outline away. Every study gets Share and Contribute in the top bar.
 */
export function StudyShell({
  slug,
  title,
  palette,
  subtitle,
  toolbar,
  actions,
  search,
  primaryAction,
  sidebar,
  sidebarLabel = "Outline",
  sidebarWidth = 264,
  inspector,
  inspectorLabel = "Inspector",
  inspectorWidth = 336,
  selection = null,
  revealInspector = 0,
  status,
  statusEnd,
  children,
  canvasClassName,
}: StudyShellProps) {
  // Prerendered as docked; corrected straight after hydration. CSS lays out
  // the first paint correctly either way, from the data attributes below.
  const layout = useSyncExternalStore<Layout>(subscribeLayout, currentLayout, () => "docked");
  const [panels, setPanels] = useState<Panels>(INITIAL_PANELS);
  const [share, setShare] = useState<number>(INSPECTOR_SHARE.initial);
  const [resizing, setResizing] = useState(false);
  const sidebarId = useId();
  const inspectorId = useId();
  const body = useRef<HTMLDivElement>(null);
  const sidebarPanel = useRef<HTMLElement>(null);
  const sidebarToggle = useRef<HTMLButtonElement>(null);

  const hasSidebar = Boolean(sidebar);
  const hasInspector = Boolean(inspector);
  const sidebarOpen = hasSidebar && panels[layout].sidebar;
  const inspectorOpen = hasInspector && panels[layout].inspector;
  const compactSidebarOpen = hasSidebar && panels.compact.sidebar;

  /** Open or close a panel in the layout on screen right now. */
  const setPanel = useCallback((panel: Panel, open: boolean | ((was: boolean) => boolean)) => {
    const mode = currentLayout();
    setPanels((p) => {
      const next = typeof open === "function" ? open(p[mode][panel]) : open;
      return next === p[mode][panel] ? p : { ...p, [mode]: { ...p[mode], [panel]: next } };
    });
  }, []);

  const toggleSidebar = useCallback(() => setPanel("sidebar", (was) => !was), [setPanel]);
  const toggleInspector = useCallback(() => setPanel("inspector", (was) => !was), [setPanel]);

  // A new choice, in the compact layout, brings the inspector up and puts the
  // outline away. (Adjusting state while rendering, as React recommends for
  // state that follows a prop.)
  const [shownSelection, setShownSelection] = useState(selection);
  if (selection !== shownSelection) {
    setShownSelection(selection);
    if (selection !== null && layout === "compact") {
      setPanels((p) => ({ ...p, compact: { sidebar: false, inspector: hasInspector || p.compact.inspector } }));
    }
  }

  // A request to reveal the inspector opens it wherever it is closed; in the
  // compact layout the outline makes way for it, as for a new choice.
  const [shownReveal, setShownReveal] = useState(revealInspector);
  if (revealInspector !== shownReveal) {
    setShownReveal(revealInspector);
    if (hasInspector) {
      setPanels((p) =>
        layout === "compact"
          ? { ...p, compact: { sidebar: false, inspector: true } }
          : { ...p, [layout]: { ...p[layout], inspector: true } },
      );
    }
  }

  // The sliding outline takes focus when it opens, and gives it back to its
  // button when it closes, so a keyboard user is never left behind it.
  const wasCompactSidebarOpen = useRef(compactSidebarOpen);
  useEffect(() => {
    const was = wasCompactSidebarOpen.current;
    wasCompactSidebarOpen.current = compactSidebarOpen;
    if (layout !== "compact" || was === compactSidebarOpen) return;
    if (compactSidebarOpen) sidebarPanel.current?.focus({ preventScroll: true });
    else if (sidebarPanel.current?.contains(document.activeElement)) sidebarToggle.current?.focus({ preventScroll: true });
  }, [compactSidebarOpen, layout]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      if (event.key === "[" && hasSidebar) {
        event.preventDefault();
        toggleSidebar();
      } else if (event.key === "]" && hasInspector) {
        event.preventDefault();
        toggleInspector();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasSidebar, hasInspector, toggleSidebar, toggleInspector]);

  // Escape puts a sliding outline away before the study hears it (this
  // listener runs in the capture phase, ahead of the study's own keys).
  useEffect(() => {
    if (layout !== "compact" || !compactSidebarOpen) return;
    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (event.target instanceof Element && event.target.closest('[role="dialog"], [role="menu"]')) return;
      event.stopImmediatePropagation();
      event.preventDefault();
      setPanel("sidebar", false);
    }
    window.addEventListener("keydown", onEscape, true);
    return () => window.removeEventListener("keydown", onEscape, true);
  }, [layout, compactSidebarOpen, setPanel]);

  /** Drag the inspector's top edge: it follows the finger; let go low down and it goes away. */
  const onGrab = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const el = body.current;
      if (!el || event.button > 0) return;
      // A mouse drag shouldn't select text on its way. (Touch needs nothing:
      // the grabber's touch-action already keeps the page from scrolling.)
      if (event.pointerType === "mouse") event.preventDefault();
      const handle = event.currentTarget;
      handle.setPointerCapture(event.pointerId);
      const rect = el.getBoundingClientRect();
      const startShare = share;
      let latest = startShare;
      setResizing(true);

      const move = (e: PointerEvent) => {
        latest = Math.min(INSPECTOR_SHARE.max, ((rect.bottom - e.clientY) / rect.height) * 100);
        // Below the minimum it keeps following, so the reader sees it is about to go.
        el.style.setProperty("--inspector-h", `${Math.max(0, latest)}%`);
      };
      const end = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", end);
        handle.removeEventListener("pointercancel", end);
        setResizing(false);
        if (latest < DISMISS_SHARE) {
          el.style.setProperty("--inspector-h", `${startShare}%`);
          setPanel("inspector", false);
        } else {
          const next = clampShare(latest);
          el.style.setProperty("--inspector-h", `${next}%`);
          setShare(next);
        }
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", end);
      handle.addEventListener("pointercancel", end);
    },
    [share, setPanel],
  );

  const onGrabberKey = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const delta =
        event.key === "ArrowUp" ? INSPECTOR_SHARE.step : event.key === "ArrowDown" ? -INSPECTOR_SHARE.step : 0;
      if (event.key === "Home") setShare(INSPECTOR_SHARE.max);
      else if (event.key === "End") setShare(INSPECTOR_SHARE.min);
      else if (delta) setShare((s) => clampShare(s + delta));
      else return;
      event.preventDefault();
    },
    [],
  );

  const bodyStyle = {
    "--sidebar-w": `${sidebarWidth}px`,
    "--inspector-w": `${inspectorWidth}px`,
    "--inspector-h": `${share}%`,
  } as CSSProperties;

  const state = (open: boolean) => (open ? "open" : "closed");
  const sidebarVerb = sidebarOpen ? "Hide" : "Show";
  const inspectorVerb = inspectorOpen ? "Hide" : "Show";
  const InspectorIcon = layout === "compact" ? PanelBottom : PanelRight;

  return (
    <div
      style={paletteVars(palette)}
      className="grid h-dvh grid-rows-[48px_minmax(0,1fr)_28px] overflow-hidden bg-s-canvas font-sans text-s-ink pointer-coarse:grid-rows-[56px_minmax(0,1fr)_32px]"
    >
      {/*
        The toolbar sits in the middle while there is room. The right-hand
        controls always keep their full width; when space runs short the
        title gives way first, so nothing overlaps.
      */}
      <header className="@container/bar grid grid-cols-[minmax(0,1fr)_auto_minmax(max-content,1fr)] items-center gap-3 border-b border-s-line bg-s-chrome px-2 max-lg:gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <Link
            href={HOME_HREF}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-control pr-2.5 pl-1.5 text-ui font-medium text-s-muted transition-colors hover:bg-s-raised hover:text-s-ink active:bg-s-raised pointer-coarse:h-10 @max-[63rem]/bar:px-1.5"
          >
            <ChevronLeft aria-hidden className="size-4" />
            <BrandMark className="size-[18px] @max-[63rem]/bar:hidden" />
            <span className="@max-[63rem]/bar:sr-only">Index</span>
          </Link>
          <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-s-line" />
          {sidebar ? (
            <button
              ref={sidebarToggle}
              type="button"
              onClick={toggleSidebar}
              aria-controls={sidebarId}
              aria-expanded={sidebarOpen}
              aria-label={`${sidebarVerb} ${sidebarLabel.toLowerCase()} ([)`}
              title={`${sidebarVerb} ${sidebarLabel.toLowerCase()} ([)`}
              className={panelToggle}
            >
              <PanelLeft aria-hidden className="size-4 pointer-coarse:size-[18px]" />
            </button>
          ) : null}
          <h1 className="ml-1 truncate text-[15px] font-semibold tracking-[-0.01em] [font-stretch:108%]">
            {title}
          </h1>
          {subtitle ? (
            <span className="ml-2 hidden truncate text-ui text-s-muted 2xl:inline">{subtitle}</span>
          ) : null}
        </div>

        <div className="flex items-center justify-center gap-2">{toolbar}</div>

        <div className="flex min-w-0 items-center justify-end gap-1.5">
          {actions}
          {search}
          {primaryAction}
          <ShareButton />
          <ContributeMenu slug={slug} title={title} />
          {inspector ? (
            <button
              type="button"
              onClick={toggleInspector}
              aria-controls={inspectorId}
              aria-expanded={inspectorOpen}
              aria-label={`${inspectorVerb} ${inspectorLabel.toLowerCase()} (])`}
              title={`${inspectorVerb} ${inspectorLabel.toLowerCase()} (])`}
              className={panelToggle}
            >
              <InspectorIcon aria-hidden className="size-4 pointer-coarse:size-[18px]" />
            </button>
          ) : null}
        </div>
      </header>

      <div
        ref={body}
        style={bodyStyle}
        className={styles.body}
        data-docked-sidebar={state(hasSidebar && panels.docked.sidebar)}
        data-docked-inspector={state(hasInspector && panels.docked.inspector)}
        data-compact-sidebar={state(compactSidebarOpen)}
        data-compact-inspector={state(hasInspector && panels.compact.inspector)}
        data-resizing={resizing ? "" : undefined}
      >
        <main className={cn(styles.canvas, "bg-s-canvas", canvasClassName)}>{children}</main>

        {sidebar ? (
          <div aria-hidden className={styles.scrim} onClick={() => setPanel("sidebar", false)} />
        ) : null}

        <aside
          ref={sidebarPanel}
          id={sidebarId}
          aria-label={sidebarLabel}
          inert={!sidebarOpen}
          tabIndex={-1}
          className={cn(styles.sidebar, "focus-visible:outline-none")}
        >
          {sidebar ? (
            <div className={cn(styles.scroll, "scroll-thin")}>
              <div className={styles.sidebarInner}>{sidebar}</div>
            </div>
          ) : null}
        </aside>

        <aside id={inspectorId} aria-label={inspectorLabel} inert={!inspectorOpen} className={styles.inspector}>
          {inspector ? (
            <>
              <div
                role="separator"
                aria-orientation="horizontal"
                aria-label={`Resize the ${inspectorLabel.toLowerCase()}`}
                aria-valuenow={Math.round(share)}
                aria-valuemin={INSPECTOR_SHARE.min}
                aria-valuemax={INSPECTOR_SHARE.max}
                tabIndex={layout === "compact" ? 0 : -1}
                onPointerDown={onGrab}
                onKeyDown={onGrabberKey}
                className={styles.grabber}
              />
              <div className={cn(styles.scroll, "scroll-thin")}>
                <div className={cn(styles.inspectorInner, "@container/inspector")}>{inspector}</div>
              </div>
            </>
          ) : null}
        </aside>
      </div>

      <footer className="scroll-none flex min-w-0 items-center gap-5 overflow-x-auto border-t border-s-line bg-s-chrome px-3 text-[12px] text-s-muted">
        <div className="flex shrink-0 items-center gap-5">{status}</div>
        <div className="ml-auto flex shrink-0 items-center gap-5">{statusEnd}</div>
      </footer>
    </div>
  );
}
