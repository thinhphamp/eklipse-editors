// Every icon the prototype shows, mapped to a symbol in public/icons/sprite.svg.
// Sources: Lucide (ISC) for generic actions, Eklipse editor SVGs (eklipse-video-editor/src/assets/svg)
// for editor glyphs and the Eklipse mark. Licences: public/icons/LICENSES.md.
export const iconMap = {
  // Rail tabs
  layouts: 'layouts', elements: 'elements', effects: 'effects', audio: 'audio', captions: 'captions', export: 'export',
  // Brand + rail bottom / profile menu
  'eklipse-logo': 'eklipse-logo', help: 'help', home: 'home', user: 'user', logout: 'logout',
  // Stage tools + timeline toolbar (Eklipse editor glyphs)
  undo: 'undo', redo: 'redo', split: 'split', trash: 'trash', 'skip-back': 'skip-back', 'skip-forward': 'skip-forward', unlink: 'unlink',
  // Playback bar
  play: 'play', pause: 'pause', 'step-back': 'step-back', 'step-forward': 'step-forward', volume: 'volume', 'volume-off': 'volume-off',
  fullscreen: 'fullscreen', 'zoom-in': 'zoom-in', 'zoom-out': 'zoom-out', keyboard: 'keyboard',
  // Panels, dialogs, menus
  back: 'back', chevron: 'chevron', close: 'close', collapse: 'collapse', upload: 'upload', save: 'save', search: 'search',
  plus: 'plus', minus: 'minus', check: 'check', copy: 'copy', heart: 'heart', scissors: 'scissors', chat: 'chat', 'trim-start': 'trim-start', 'trim-end': 'trim-end', more: 'more',
  settings: 'settings', globe: 'globe', pencil: 'pencil', camera: 'camera', crown: 'crown',
  'arrow-left': 'arrow-left', 'arrow-right': 'arrow-right', 'arrow-up': 'arrow-up', 'arrow-down': 'arrow-down',
  // Effects feature cards
  zoom: 'zoom', gauge: 'gauge', tts: 'tts', type: 'type', ban: 'ban',
} as const;
export type IconName = keyof typeof iconMap;
export const isIconName = (value: string): value is IconName => value in iconMap;
