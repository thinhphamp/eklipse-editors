import test from 'node:test';
import assert from 'node:assert/strict';
import { pickTopModal, isReachable, formatLook } from '../lib/look.mjs';

test('no modal: nothing picked', () => assert.equal(pickTopModal([]), -1));
test('hidden dialogs are ignored', () => assert.equal(pickTopModal([{ z: 5, visible: false }]), -1));
test('later dialog in DOM wins on equal z', () => assert.equal(pickTopModal([{ z: 10, visible: true }, { z: 10, visible: true }]), 1));
test('higher z wins over later DOM order', () => assert.equal(pickTopModal([{ z: 50, visible: true }, { z: 10, visible: true }]), 0));
test('fully covered element is not reachable', () => assert.equal(isReachable([false, false, false]), false));
test('partly covered element stays listed', () => assert.equal(isReachable([false, true, false]), true));
test('look announces an open dialog first', () => {
  const r = formatLook({ items: [{ kind: 'button', name: 'Close', x: 1, y: 2, idx: 0 }], total: 1, scrollers: [], dialog: 'Select your quality' });
  assert.match(r.text, /^A dialog is open: Select your quality/);
  assert.equal(r.refs[1].desc, 'button "Close"');
});
test('no dialog: no announcement', () => assert.doesNotMatch(formatLook({ items: [], total: 0, scrollers: [], dialog: null }).text, /dialog/));
