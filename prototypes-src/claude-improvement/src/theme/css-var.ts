// Reads a colour token from src/theme/tokens.css at runtime, for the few DOM APIs that
// need a literal value (e.g. <input type="color"> only accepts #rrggbb).
export function cssVar(name: string, fallback = ''): string {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim().toLowerCase() || fallback;
}
