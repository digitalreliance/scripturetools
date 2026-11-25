/**
 * Writes the README's study gallery and docs/STUDIES.md from the registry.
 *
 *   npm run docs:studies
 *
 * Run it whenever a study is added, goes live, or changes its title or
 * summary. Take each live study's picture with `npm run docs:shots`.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CATEGORIES, STUDIES } from "../../src/studies/registry";
import { liveOf, previewImagePath, renderCatalogue, renderGallery, withGallery } from "./catalogue";

const root = path.resolve(import.meta.dirname, "../..");

function write(file: string, text: string) {
  const full = path.join(root, file);
  const before = existsSync(full) ? readFileSync(full, "utf8") : null;
  if (before === text) {
    console.log(`unchanged  ${file}`);
    return;
  }
  writeFileSync(full, text);
  console.log(`wrote      ${file}`);
}

const readme = readFileSync(path.join(root, "README.md"), "utf8");
write("README.md", withGallery(readme, renderGallery(STUDIES)));
write("docs/STUDIES.md", renderCatalogue(STUDIES, CATEGORIES));

const missing = liveOf(STUDIES).filter((s) => !existsSync(path.join(root, previewImagePath(s.slug))));
if (missing.length > 0) {
  console.warn(`\nNo picture yet for: ${missing.map((s) => s.slug).join(", ")}. Run npm run docs:shots.`);
}
