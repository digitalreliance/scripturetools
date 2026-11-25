"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { ChevronLeft, PanelLeft, PanelRight } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/cn";
import { HOME_HREF } from "@/lib/routes";
import { paletteVars, type StudyPalette } from "@/studies/palettes";

export interface StudyShellProps {
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
  /** Status bar, left and right. Use <StatusItem> for labelled values. */
  status?: ReactNode;
  statusEnd?: ReactNode;
  /** The canvas. */
  children: ReactNode;
  canvasClassName?: string;
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

/**
 * The frame every study uses: top bar, outline, canvas, inspector, status bar.
 * Themed entirely by the study's palette via --s-* CSS variables.
 * `[` and `]` collapse the outline and the inspector.
 */
export function StudyShell({
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
  status,
  statusEnd,
  children,
  canvasClassName,
}: StudyShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const sidebarId = useId();
  const inspectorId = useId();

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const toggleInspector = useCallback(() => setInspectorOpen((v) => !v), []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      if (event.key === "[" && sidebar) {
        event.preventDefault();
        toggleSidebar();
      } else if (event.key === "]" && inspector) {
        event.preventDefault();
        toggleInspector();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebar, inspector, toggleSidebar, toggleInspector]);

  const showSidebar = Boolean(sidebar) && sidebarOpen;
  const showInspector = Boolean(inspector) && inspectorOpen;

  return (
    <div
      style={paletteVars(palette)}
      className="grid h-dvh min-w-[1024px] grid-rows-[48px_minmax(0,1fr)_28px] overflow-hidden bg-s-canvas font-sans text-s-ink"
    >
      <header className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-b border-s-line bg-s-chrome px-2">
        <div className="flex min-w-0 items-center gap-1">
          <Link
            href={HOME_HREF}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-control pr-2.5 pl-1.5 text-ui font-medium text-s-muted transition-colors hover:bg-s-raised hover:text-s-ink"
          >
            <ChevronLeft aria-hidden className="size-4" />
            <BrandMark className="size-[18px]" />
            <span>Index</span>
          </Link>
          <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-s-line" />
          {sidebar ? (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-controls={sidebarId}
              aria-expanded={sidebarOpen}
              aria-label={`${sidebarOpen ? "Hide" : "Show"} ${sidebarLabel.toLowerCase()} ([)`}
              title={`${sidebarOpen ? "Hide" : "Show"} ${sidebarLabel.toLowerCase()} ([)`}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-control text-s-muted transition-colors hover:bg-s-raised hover:text-s-ink"
            >
              <PanelLeft aria-hidden className="size-4" />
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
          {inspector ? (
            <button
              type="button"
              onClick={toggleInspector}
              aria-controls={inspectorId}
              aria-expanded={inspectorOpen}
              aria-label={`${inspectorOpen ? "Hide" : "Show"} ${inspectorLabel.toLowerCase()} (])`}
              title={`${inspectorOpen ? "Hide" : "Show"} ${inspectorLabel.toLowerCase()} (])`}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-control text-s-muted transition-colors hover:bg-s-raised hover:text-s-ink"
            >
              <PanelRight aria-hidden className="size-4" />
            </button>
          ) : null}
        </div>
      </header>

      <div
        className="grid min-h-0 transition-[grid-template-columns] duration-200 ease-out-quint"
        style={{
          gridTemplateColumns: `${showSidebar ? sidebarWidth : 0}px minmax(0, 1fr) ${showInspector ? inspectorWidth : 0}px`,
        }}
      >
        <aside
          id={sidebarId}
          aria-label={sidebarLabel}
          inert={!showSidebar}
          className={cn(
            "scroll-thin min-h-0 overflow-x-hidden overflow-y-auto bg-s-chrome",
            showSidebar && "border-r border-s-line",
          )}
        >
          {sidebar ? <div style={{ width: sidebarWidth }}>{sidebar}</div> : null}
        </aside>

        <main className={cn("relative min-h-0 min-w-0 overflow-hidden bg-s-canvas", canvasClassName)}>
          {children}
        </main>

        <aside
          id={inspectorId}
          aria-label={inspectorLabel}
          inert={!showInspector}
          className={cn(
            "scroll-thin min-h-0 overflow-x-hidden overflow-y-auto bg-s-chrome",
            showInspector && "border-l border-s-line",
          )}
        >
          {inspector ? <div style={{ width: inspectorWidth }}>{inspector}</div> : null}
        </aside>
      </div>

      <footer className="flex min-w-0 items-center gap-5 border-t border-s-line bg-s-chrome px-3 text-[12px] text-s-muted">
        <div className="flex min-w-0 items-center gap-5">{status}</div>
        <div className="ml-auto flex min-w-0 items-center gap-5">{statusEnd}</div>
      </footer>
    </div>
  );
}
