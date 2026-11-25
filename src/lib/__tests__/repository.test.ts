import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { SITE } from "../site";

/**
 * The repository's owner and name are set once, in SITE.repo. A few files
 * outside the code have to spell them out (package metadata, CODEOWNERS,
 * issue-form links, the clone command). If the repository moves or is
 * renamed, this lists every one that still names the old address.
 */

const root = process.cwd();

function filesUnder(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const path = join(dir, name);
    return statSync(join(root, path)).isDirectory() ? filesUnder(path) : [path];
  });
}

const FILES = ["README.md", "CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "SECURITY.md", "package.json", ...filesUnder(".github")];

const EXPECTED = `${SITE.repo.owner}/${SITE.repo.name}`;

/** Every "owner/name" a file gives for a GitHub repository, and CODEOWNERS' owners. */
function addressesIn(file: string): string[] {
  const text = readFileSync(join(root, file), "utf8");
  const found = [...text.matchAll(/github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?(?=[/"'#?)\s]|$)/gm)].map(
    (m) => `${m[1]}/${m[2]}`,
  );
  if (file.endsWith("CODEOWNERS")) {
    found.push(...[...text.matchAll(/^[^#\s]\S*\s+@([A-Za-z0-9-]+)/gm)].map((m) => `${m[1]}/${SITE.repo.name}`));
  }
  return found;
}

describe("repository address", () => {
  it("is the same everywhere as in SITE.repo", () => {
    const stale = FILES.flatMap((file) =>
      addressesIn(file)
        .filter((address) => address !== EXPECTED)
        .map((address) => `${relative(root, join(root, file))} names "${address}"`),
    );
    expect(stale, `Expected "${EXPECTED}" (SITE.repo)`).toEqual([]);
  });

  it("is checked in every file that should name it", () => {
    for (const file of ["README.md", "package.json", ".github/CODEOWNERS", ".github/ISSUE_TEMPLATE/config.yml"]) {
      expect(addressesIn(file).length, file).toBeGreaterThan(0);
    }
  });
});
