import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function sha256Hex(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

export interface CachedFile {
  bytes: Uint8Array;
  sha256: string;
  /** True when the bytes came from the cache rather than the network. */
  cached: boolean;
}

/**
 * Return the bytes of `url`, downloading them into `cacheFile` only when the
 * cache is empty (or `refresh` is set). Writes are atomic (temp file + rename)
 * so an interrupted download never leaves a truncated archive behind.
 */
export async function downloadCached(
  url: string,
  cacheFile: string,
  { refresh = false }: { refresh?: boolean } = {},
): Promise<CachedFile> {
  if (!refresh && fs.existsSync(cacheFile)) {
    const bytes = new Uint8Array(fs.readFileSync(cacheFile));
    return { bytes, sha256: sha256Hex(bytes), cached: true };
  }

  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`GET ${url} failed: HTTP ${res.status} ${res.statusText}`);
  const bytes = new Uint8Array(await res.arrayBuffer());

  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  const tmp = `${cacheFile}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, bytes);
  fs.renameSync(tmp, cacheFile);
  return { bytes, sha256: sha256Hex(bytes), cached: false };
}
