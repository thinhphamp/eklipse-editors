// The deltas of this prototype against prototypes-src/streamladder-editor-ref, shown in the top bar
// ("What changed") and in the report. Evidence: plans/261026-1500-editor-direction-claude/report.md.
export const claudeChanges = [
  { id: 'C1', title: 'Top bar with Undo/Redo, Saved state and Export', why: 'Export is always one click away; it is no longer the 6th rail tab or the last step of a wizard.' },
  { id: 'C2', title: 'Rail ordered by value: Layouts, Captions, Elements, Effects, Audio', why: 'Web projects 5-22 Oct: captions and text go with exported clips (+29.4 and +45.9 points, same user); music is in 3.8% of projects with no gain.' },
  { id: 'C3', title: 'My styles: layout + captions in one click, music optional', why: '72.6% of web projects reuse the previous layout; paid users repeat the same edit ~3 times a week.' },
  { id: 'C4', title: 'Layouts panel opens with your style and recent layouts first', why: 'The usual choice is the first thing on screen instead of row 2 of 11 tiles.' },
  { id: 'C5', title: 'Timeline keeps every lane that has content on every tab', why: 'Captions and music no longer disappear while you change the layout.' },
  { id: 'C6', title: 'No Back/Next wizard and no bottom bar: Export lives in the top bar only', why: 'Quan, 30 Oct: the Brand · Layout · Captions · Title finish bar is removed; the timeline gets the space and Export stays in one place.' },
  { id: 'C7', title: 'Export dialog remembers the quality and offers Export & post', why: 'Same settings every time for repeat users; posting is the next step after export.' },
  { id: 'C8', title: 'Brand sticker on every clip: saved once, added automatically', why: 'The social sticker is the streamer’s brand; it is already on 73.1% of web projects, so it is a setting, not a per-clip decoration.' },
  { id: 'C9', title: 'AI Edit review: keep or remove each AI meme, zoom and sound', why: 'AI memes left untouched export 44.4%; with one user edit 72.9%. The strip invites that one edit.' },
  { id: 'C10', title: 'Make it vertical: a 16:9 clip opens Layouts with your last layout', why: '8.2% of web projects stay 16:9 and export 41.0% vs 66.0% for 9:16.' },
] as const;
