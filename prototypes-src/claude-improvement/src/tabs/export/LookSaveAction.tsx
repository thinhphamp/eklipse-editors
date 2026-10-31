import type { EditorState } from '../../state';
import { saveTemplate, loadTemplates, applyTemplate } from './template-store';
import { useEditor } from '../../state';
import { hasVariant } from '../../variant';

export function LookSaveAction({ state, compact = false }: { state: EditorState; compact?: boolean }) {
  const { actions } = useEditor();
  if (!hasVariant('look-save')) return null;
  return <button className={compact ? 'look-save-action compact' : 'look-save-action'} onClick={() => {
    const name = `My look ${loadTemplates().length + 1}`;
    try {
      saveTemplate({ ...state, templateName: name, templateFields: { Layout: true, Text: true, Captions: true, Gifs: true, Stickers: true, 'Sound Effects': true, 'Video Effects': true, 'AI Word Censoring': true } });
      actions.notify('Saved as ' + name);
    } catch { actions.notify('Could not save this look locally'); }
  }}>＋ Save as my look</button>;
}

export function ApplyMyLook() {
  const { state, actions } = useEditor();
  if (!hasVariant('look-save') || state.clipIndex !== 2) return null;
  const saved = loadTemplates().at(-1);
  if (!saved) return null;
  return <button className="apply-my-look" onClick={() => actions.commit({ ...applyTemplate(saved, state), savedCaptionPreset: saved.project.captions?.preset, toast: 'Your saved look is on this clip' }, 'Apply my look')}>
    <span>✦</span><strong>Apply my look</strong><small>{saved.name} · layout, captions and sticker</small>
  </button>;
}
