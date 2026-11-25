/**
 * Recursively freeze parsed JSON. Loaded books are cached and shared, so one
 * consumer mutating them would silently change every other page's data.
 */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
