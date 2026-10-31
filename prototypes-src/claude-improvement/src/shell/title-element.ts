import { useEditor } from '../state';

// C6/C9: "Add a title" from the finish bar and the AI review strip. Text is the tool with the largest export gap on
// the web (+45.9 points for the same user, 5-22 Oct), but it sits in Elements, so it gets a shortcut. An existing
// title is opened instead of adding a second one.
export const isTitle = (category: string) => category === 'Text Elements';

export function useAddTitle() {
  const { state, actions } = useEditor();
  return () => {
    const existing = state.elements.find(x => isTitle(x.category));
    const id = existing ? existing.id : actions.addItem({ label: 'YOUR TITLE', kind: 'element', category: 'Text Elements', start: 0, duration: Math.min(5, state.duration), preview: { x: 15, y: 9, width: 70, height: 10, opacity: 100 } });
    actions.chooseTab('Elements');
    actions.patch({ selectedElementId: id, playhead: existing ? existing.start : 0 });
    actions.pushPage({ type: 'edit', title: 'Edit text element', category: 'Text Elements' });
  };
}
