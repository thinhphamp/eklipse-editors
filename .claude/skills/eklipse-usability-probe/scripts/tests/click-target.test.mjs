import test from 'node:test';
import assert from 'node:assert/strict';
import { clickVerdict } from '../lib/click-target.mjs';
import { stepBudget } from '../lib/sweep-plan.mjs';

test('gone element is no-target', () => assert.equal(clickVerdict({ gone: true }, 'button "X"').outcome, 'no-target'));
test('disabled element is a normal no-op, not invalid', () => {
  const v = clickVerdict({ x: 1, y: 2, disabled: true }, 'button "Delete selected"');
  assert.equal(v.outcome, 'disabled'); assert.match(v.msg, /button is disabled/); assert.equal(v.point, undefined);
});
test('covered element is clicked where a user would and names what was hit', () => {
  const v = clickVerdict({ x: 5, y: 6, coveredBy: 'Adjust framing' }, 'button "Select Facecam crop"');
  assert.equal(v.outcome, 'ok'); assert.deepEqual(v.point, { x: 5, y: 6 }); assert.equal(v.covered, 'Adjust framing'); assert.match(v.msg, /Adjust framing/);
});
test('clear element is a plain click', () => assert.deepEqual(clickVerdict({ x: 3, y: 4 }, 'button "A"'), { outcome: 'ok', point: { x: 3, y: 4 }, msg: 'clicked button "A"' }));

test('step budget: one-and-done floor of 8, others keep min 4', () => {
  assert.equal(stepBudget(2, 1.5, 'one-and-done').steps, 8);
  assert.equal(stepBudget(2, 1.5, 'heavy-editor').steps, 4);
  assert.equal(stepBudget(6, 2, 'one-and-done').steps, 12);
  assert.match(stepBudget(2, 1.5, 'one-and-done').rule, /one-and-done floor/);
});
