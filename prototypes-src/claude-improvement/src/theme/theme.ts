// Editor appearance: two dark and two light themes. Kept in localStorage; ?theme=<id> overrides for review links.
export const themes = [
  { id: 'eklipse', name: 'Eklipse dark', note: 'Default · purple-tinted' },
  { id: 'graphite', name: 'Graphite', note: 'Neutral dark · true colour judging' },
  { id: 'light', name: 'Light', note: 'White panels · grey stage' },
  { id: 'lavender', name: 'Lavender', note: 'Soft light · brand-tinted' },
] as const;
export type ThemeId = typeof themes[number]['id'];
const KEY = 'ek-theme';
const isTheme = (v: string | null): v is ThemeId => themes.some(t => t.id === v);

export function currentTheme(): ThemeId {
  const fromUrl = new URLSearchParams(location.search).get('theme');
  if (isTheme(fromUrl)) return fromUrl;
  const saved = localStorage.getItem(KEY);
  return isTheme(saved) ? saved : 'eklipse';
}
export function applyTheme(id: ThemeId, persist = false) {
  if (id === 'eklipse') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = id;
  if (persist) localStorage.setItem(KEY, id);
}
