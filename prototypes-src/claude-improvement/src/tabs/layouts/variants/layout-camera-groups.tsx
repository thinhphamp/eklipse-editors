import type { LayoutName } from '../../../data';
import './layout-camera-groups.css';

/** lay-cam-groups: All layouts grouped by how many cameras the layout shows, camera named first in each tile line. */
export const cameraGroups: { title: string; line: string; layouts: LayoutName[] }[] = [
  { title: 'One camera', line: 'The game plus your one facecam.', layouts: ['Small facecam', 'Circle facecam', 'Game UI', 'Split', 'Basecam', 'Mosaic', 'Half'] },
  { title: 'Two cameras', line: 'Two facecams, for you and a friend.', layouts: ['Dual facecam', 'Duo Split'] },
  { title: 'No camera', line: 'Only the game is shown.', layouts: ['Fullscreen', 'Blurred'] },
];

export const cameraDescriptions: Record<string, string> = {
  'Fullscreen': 'No camera: game fills the screen',
  'Blurred': 'No camera: game over a blurred background',
  'Small facecam': 'One camera: small, in a corner; game fills the screen',
  'Circle facecam': 'One camera: round, over the game',
  'Game UI': "One camera: kept off the game's HUD; game fills the screen",
  'Split': 'One camera: on top, game below',
  'Basecam': 'One camera: fills the screen',
  'Mosaic': 'One camera: mosaic with the game',
  'Half': 'One camera: shares the screen with the game',
  'Dual facecam': 'Two cameras: both over the game',
  'Duo Split': 'Two cameras: both on top, game below',
};
