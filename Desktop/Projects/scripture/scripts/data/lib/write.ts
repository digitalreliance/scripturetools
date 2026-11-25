import fs from "node:fs";
import path from "node:path";

/**
 * Write `content` to `file` unless the file already holds exactly that
 * content, so regenerating unchanged data leaves no diff. Returns whether the
 * file was written.
 */
export function writeFileIfChanged(file: string, content: string): boolean {
  try {
    if (fs.readFileSync(file, "utf8") === content) return false;
  } catch {
    // Missing file: fall through and create it.
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return true;
}

/** Human-readable byte size, e.g. "4.31 MB". */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
