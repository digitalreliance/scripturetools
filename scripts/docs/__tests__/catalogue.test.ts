import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CATEGORIES, STUDIES, type Study } from "../../../src/studies/registry";
import {
  GALLERY_END,
  GALLERY_START,
  liveOf,
  previewImagePath,
  renderCatalogue,
  renderGallery,
  withGallery,
} from "../catalogue";

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf8");
const STALE = "is out of date with src/studies/registry.ts: run npm run docs:studies";

describe("study catalogue", () => {
  it("the README's gallery matches the registry", () => {
    const readme = read("README.md");
    expect(withGallery(readme, renderGallery(STUDIES)) === readme, `README.md ${STALE}`).toBe(true);
  });

  it("docs/STUDIES.md matches the registry", () => {
    expect(read("docs/STUDIES.md") === renderCatalogue(STUDIES, CATEGORIES), `docs/STUDIES.md ${STALE}`).toBe(true);
  });

  it("every live study has a picture", () => {
    const missing = liveOf(STUDIES).filter((s) => !existsSync(join(root, previewImagePath(s.slug))));
    expect(missing.map((s) => s.slug), "run npm run docs:shots").toEqual([]);
  });
});

describe("gallery", () => {
  const study = (slug: string, status: Study["status"] = "live"): Study =>
    ({ ...STUDIES[0], slug, title: `Title <${slug}>`, status, href: `/studies/${slug}` }) as Study;

  it("puts three studies to a row and escapes text", () => {
    const gallery = renderGallery([study("a"), study("b"), study("c"), study("d"), study("e", "planned")]);
    expect(gallery.match(/<tr>/g)).toHaveLength(2);
    expect(gallery).toContain("Title &lt;a&gt;");
    expect(gallery).toContain("4 live and 1 planned");
    expect(gallery.startsWith(GALLERY_START) && gallery.endsWith(GALLERY_END)).toBe(true);
  });

  it("only replaces the text between the markers", () => {
    const readme = `before\n${GALLERY_START}\nold\n${GALLERY_END}\nafter\n`;
    expect(withGallery(readme, `${GALLERY_START}\nnew\n${GALLERY_END}`)).toBe(
      `before\n${GALLERY_START}\nnew\n${GALLERY_END}\nafter\n`,
    );
    expect(() => withGallery("no markers", "x")).toThrow(/markers/);
  });
});
