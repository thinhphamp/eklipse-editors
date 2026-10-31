import test from 'node:test';
import assert from 'node:assert/strict';
import { Session } from '../lib/session.mjs';

test('player drag uses one step and stops at the configured budget', async () => {
  const session = Object.create(Session.prototype);
  Object.assign(session, {
    flags: { done: false, gaveUp: false, budgetHit: false },
    probe: { checkpoints: true, budget: { steps: 1 } },
    steps: 0, seq: 0, refs: { 2: { x: 10, y: 20, desc: 'meme' }, 7: { x: 40, y: 50, desc: 'timeline' } },
    page: { mouse: { move: async () => {}, down: async () => {}, up: async () => {} } },
    record: () => {}, look: async () => 'screen', lastShot: '001.jpg'
  });

  await session.act({ action: 'drag', ref: 2, toRef: 7 });
  assert.equal(session.steps, 1);
  assert.equal(await session.act({ action: 'click', target: '1' }), 'stopped: budget');
  assert.equal(session.steps, 1);
});
