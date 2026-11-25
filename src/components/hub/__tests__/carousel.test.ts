import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StudyCarousel, type CarouselSlide } from "@/components/hub/StudyCarousel";

const slide = (id: string, href: string | null = `/studies/${id}`): CarouselSlide => ({
  id,
  title: `Study ${id}`,
  href,
  figure: createElement("svg", { "data-figure": id }),
  text: createElement("h2", null, `Study ${id}`),
});

const render = (slides: CarouselSlide[]) =>
  renderToStaticMarkup(createElement(StudyCarousel, { slides, label: "New and updated studies" }));

const count = (html: string, pattern: RegExp) => html.match(pattern)?.length ?? 0;

describe("StudyCarousel (prerendered)", () => {
  it("shows a single study without carousel controls", () => {
    const html = render([slide("a")]);
    expect(html).toContain('aria-label="New and updated studies"');
    expect(html).not.toContain("aria-roledescription");
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain("rotation");
    expect(html).not.toContain("inert");
  });

  it("prerenders every study, the first one showing, with a tab each", () => {
    const html = render([slide("a"), slide("b"), slide("c", null)]);
    expect(html).toContain('aria-roledescription="carousel"');
    expect(count(html, /role="tab"/g)).toBe(3);
    expect(count(html, /aria-selected="true"/g)).toBe(1);
    expect(html.indexOf('aria-selected="true"')).toBeLessThan(html.indexOf("Study b</span>"));
    expect(count(html, /role="tabpanel"/g)).toBe(3);
    expect(count(html, /inert=""/g)).toBe(2);
    expect(count(html, /data-figure=/g)).toBe(3);
    expect(html).toContain('aria-label="Pause rotation"');
    expect(html).toContain('aria-live="off"');
  });

  it("links each plate to its study, and leaves an unbuilt one unlinked", () => {
    const html = render([slide("a"), slide("c", null)]);
    expect(html).toContain('href="/studies/a"');
    expect(html).not.toContain('href="/studies/c"');
  });

  it("starts with the drawing at rest: no demo until the carousel is seen", () => {
    expect(render([slide("a"), slide("b")])).not.toContain("illo-play");
  });
});
