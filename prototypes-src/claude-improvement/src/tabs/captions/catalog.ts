export const transcript: [string, string][] = [
  ['Reloading.', ''], ['Dropping a drone.', ''], ['Uh, 2 A.', 'Speaker 2'],
  ['Reyna and a Jett.', 'Speaker 2'], ['3 2 1 A site.', 'Speaker 3'],
  ['Go, go peek.', 'Speaker 3'], ['Go peek I said.', 'Speaker 3'],
  ['Hostile down.', ''], ['Spike down A.', 'Speaker 4'], ['Get wrecked.', ''],
  ['1 more Reyna.', 'Speaker 2'], ['I got spike.', ''], ['Reyna low.', 'Speaker 3'],
  ['Reyna low.', 'Speaker 3'], ['Reyna.', 'Speaker 3'], ['2 A.', 'Speaker 2'],
  ["Let's go B.", 'Speaker 5'], ["There's 2 2 A.", 'Speaker 5'],
  ['Last player standing.', ''], ['Spike down mid.', 'Speaker 4'], ['Mm, unfortunate.', 'Speaker 5'],
];

export type Preset = { text: string; flavor?: string; globe?: boolean };
const p = (text: string, flavor?: string, globe?: boolean): Preset => ({ text, flavor, globe });
export const presetGroups: { name: string; items: Preset[]; viewAll?: boolean }[] = [
  { name: 'All styles', viewAll: true, items: [p('THE HOOK.', 'hook'), p('WORDS YOU SING BACK.', 'thin'), p('WORDS YOU SING RIGHT', 'blue'), p('WORD', 'comic'), p('Let it bloom.', 'aqua'), p('THE GOOD PART.', 'red', true)] },
  { name: 'Popular', viewAll: true, items: [p('THE HOOK.', 'hook'), p('WORDS YOU SING BACK.', 'thin'), p('WORDS YOU SING RIGHT', 'blue'), p('WORD', 'soft'), p('EVERY', 'comic', true), p('THE HOOK.', 'hook')] },
  { name: 'Cozy', viewAll: true, items: [p('Let it bloom.', 'aqua'), p('THE GOOD PART.', 'red', true), p('the good part.', 'red'), p('LET IT BLOOM.', 'mint', true), p('EVERY', 'pink'), p('every', 'lilac')] },
  { name: 'Gameplay', viewAll: true, items: [p('THE HOOK.', 'hook'), p('HITS', 'green', true), p('the secret hides in one word.', 'secret'), p('CUTE CHAOS.', 'comic'), p('HITS', 'soft', true), p('WORDS YOU SING RIGHT BACK.', 'green')] },
  { name: 'Global', viewAll: true, items: [p('EVERY', 'soft', true), p('THE SPOTLIGHT FINDS YOU.', 'purple'), p('THE', 'yellow', true), p('let it bloom.', 'aqua'), p('HITS', 'comic'), p('Words you sing right back.', 'gray', true)] },
  { name: 'Horror', items: [p('THE HOOK.', 'hook'), p('HITS', 'black'), p('hits', 'dark')] },
  { name: 'Just Chatting', viewAll: true, items: [p('HITS', 'comic'), p('THE HOOK.', 'soft', true), p('word', 'soft'), p('THIS', 'yellow'), p('words you sing right back.', 'gray'), p('the secret hides in one word.', 'secret')] },
  { name: 'Playful', viewAll: true, items: [p('WORDS YOU SING BACK.', 'mint'), p('Let it bloom.', 'aqua'), p('The hook.', 'pink'), p('WORD', 'comic', true), p('THE HOOK.', 'yellow', true), p('WORD', 'soft')] },
  { name: 'Seasonal', items: [p('WORDS YOU', 'orange'), p('HERE FOR THE', 'green'), p('THE GOOD PART.', 'aqua'), p('WORD', 'soft'), p('word', 'black')] },
  { name: 'Simple', viewAll: true, items: [p('WORD', 'comic'), p('THE SPOTLIGHT FINDS YOU.', 'purple'), p('let it bloom.', 'aqua'), p('WORD', 'soft'), p('show em up.', 'yellow'), p('LET IT BLOOM.', 'black')] },
  { name: 'VTuber', items: [p('THE GOOD PART.', 'red', true), p('The hook.', 'pink'), p('the good part.', 'red'), p('the secret hides in one word.', 'secret')] },
];

// One speaker only (Eklipse has no diarisation; Thinh 29 Oct): no Multiple speakers / Speaker avatars.
export const effectNames = ['AI Shake', 'AI Supersize', 'Emojis', 'Hide Punctuation', 'Random rotation'];
export const effectDescriptions = ['Shake intense or loud words', 'Make words big and bold', 'Assign unique styles per speaker', 'Show an emoji next to your captions', "Show your speakers’ avatars next to your captions", "Remove ‘,.?!’ from captions", 'Randomly rotate words'];
export const effectIcons = ['♧', 'T↕', '▰', '🙂', '☻', '”', '◉'];
export const animationTiles = [
  ['none', '×', 'No animation'], ['one-word', 'word', 'One word at a time'], ['accessible', 'A few', 'Accessible short captions'],
  ['Karaoke bounce', 'Catch the word', 'Karaoke bounce'], ['marker-reveal', 'Watch the spotlight', 'Marker reveal'], ['scale-fit', 'Big words, bigger energy.', 'Scale to fit'],
  ['underline', 'The secret is in', 'Underline'], ['highlight', 'This is the part that goes viral.', 'Highlight'], ['typewriter', 'Typing ou_', 'Typewriter'],
  ['random-bounce', 'Chaos, but', 'Random bounce'], ['cascade-slide', 'Stack the', 'Cascade slide'], ['morph-bloom', 'Watch it flow', 'Morph bloom'],
];
