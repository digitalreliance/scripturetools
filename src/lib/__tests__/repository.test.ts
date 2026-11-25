import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { SITE } from "../site";

/**
 * The repository's owner is set once, in SITE.repo. A few files outside the
 * code have to spell it out (package metadata, CODEOWNERS, issue-form links).
 * If the repository moves, this lists every one that still names the old
 * owner.
 */

const root = process.cwd();

function filesUnder(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const path = join(dir, name);
    return statSync(join(root, path)).isDirectory() ? filesUnder(path) : [path];
  });
}

const FILES = ["README.md", "CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "SECURITY.md", "package.json", ...filesUnder(".github")];

function ownersNamedIn(file: string): string[] {
  const text = readFileSync(join(root, file), "utf8");
  const owners = [...text.matchAll(/github\.com\/([A-Za-z0-9-]+)\/scripture\b/g)].map((m) => m[1]);
  if (file.endsWith("CODEOWNERS")) {
    owners.push(...[...text.matchAll(/^[^#\s]\S*\s+@([A-Za-z0-9-]+)/gm)].map((m) => m[1]));
  }
  return owners;
}

describe("repository owner", () => {
  it("is named the same everywhere as in SITE.repo", () => {
    const stale = FILES.flatMap((file) =>
      ownersNamedIn(file)
        .filter((owner) => owner !== SITE.repo.owner)
        .map((owner) => `${relative(root, join(root, file))} names "${owner}"`),
    );
    expect(stale, `Expected "${SITE.repo.owner}" (SITE.repo.owner)`).toEqual([]);
  });

  it("is checked in every file that should name it", () => {
    for (const file of ["package.json", ".github/CODEOWNERS", ".github/ISSUE_TEMPLATE/config.yml"]) {
      expect(ownersNamedIn(file).length, file).toBeGreaterThan(0);
    }
  });
});
