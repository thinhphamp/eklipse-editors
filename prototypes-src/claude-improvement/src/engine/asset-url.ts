/**
 * URL for a file under public/ (e.g. `media/demo-poster.jpg`). In the single-file download the
 * files are embedded and a loader maps paths to blob URLs (`window.__embeddedUrl`); elsewhere the
 * path is returned unchanged. Use it for inline CSS `url(...)`, which no loader can intercept.
 */
export const assetUrl = (path: string): string =>
  (window as unknown as { __embeddedUrl?: (p: string) => string }).__embeddedUrl?.(path) ?? path;
