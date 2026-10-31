import { readFileSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { browserPath } from './browser-path.mjs';

const flowsDir = new URL('../../../.claude/skills/eklipse-usability-probe/flows/claude-improvement/', import.meta.url);
const target = JSON.parse(readFileSync(new URL('../../../.claude/skills/eklipse-usability-probe/targets/claude-improvement.json', import.meta.url), 'utf8'));
const flows = readdirSync(flowsDir).filter(x => x.endsWith('.json')).sort().map(x => JSON.parse(readFileSync(new URL(x, flowsDir), 'utf8')));
const scenarios = target.scenarios;
const playersDir = new URL('../../../.claude/skills/eklipse-usability-probe/players/', import.meta.url);
const players = new Map(readdirSync(playersDir).filter(x=>x.endsWith('.json')).map(x=>{const p=JSON.parse(readFileSync(new URL(x,playersDir),'utf8'));return [p.id,p]}));
const browser = await chromium.launch({ executablePath: browserPath() });
let failed = false;
try {
  for (const flow of flows) {
    for (const playerId of flow.playerIds) {
      const player=players.get(playerId); if(!player)throw new Error(`Unknown player ${playerId}`);
      const context = await browser.newContext({ viewport: target.viewport });
      const page = await context.newPage();
      const scenario = scenarios[player.scenario];
      if (!scenario) throw new Error(`Unknown scenario ${player.scenario}`);
      await page.addInitScript(storage => { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); }, scenario.storage);
      const query = new URLSearchParams({ verify: '1', screen: flow.start.screen === 'default' ? '' : flow.start.screen });
      if (flow.input?.clip) query.set('clip', flow.input.clip);
      await page.goto(`http://127.0.0.1:4318/${target.page}?${query}`);
      await page.waitForSelector('.topbar');
      await page.waitForFunction(() => Boolean(window.__verify?.state));
      await page.waitForTimeout(250);
      await page.evaluate(() => { window.__flowInitial = structuredClone(window.__verify.state); });
      let pathError = ''; let currentStep = 0;
      try {
        for (const [stepIndex, step] of flow.bestPath.entries()) { currentStep = stepIndex;
          if (step.do === 'click') {
            const loc = step.selector ? page.locator(step.selector).first() : step.role ? page.getByRole(step.role, { name: step.name, exact: false }).first() : page.getByText(step.text, { exact: false }).first();
            await loc.click({ timeout: 5000, ...(step.positionRatio !== undefined ? { position: { x: (await loc.boundingBox()).width * step.positionRatio, y: 5 } } : {}) }); await page.waitForTimeout(step.text === 'Generate captions' ? 500 : step.selector === '.captions-setup .captions-primary' ? 1500 : step.selector === '.tb-primary' ? 1000 : 500);
          } else if (step.do === 'type') await page.locator(step.selector).fill(step.text);
          else if (step.do === 'key') await page.keyboard.press(step.key);
          else if (step.do === 'scroll') await page.locator(step.selector).evaluate((el, dy) => el.scrollBy(0, dy), step.dy);
          else if (step.do === 'drag') await page.locator(step.selector).first().dragTo(page.locator(step.to).first(), { timeout: 5000 });
          else throw new Error(`Unsupported step: ${JSON.stringify(step)}`);
        }
        if (flow.bestPath.some(step => step.selector === '.export-primary')) await page.waitForFunction(() => window.__verify.state.exported, { timeout: 12000 }).catch(() => {});
        await page.waitForTimeout(100);
      } catch (error) { pathError = `step ${currentStep}: ` + String(error).split('\n')[0]; }
      const results = await page.evaluate(checkpoints => {
        const state = window.__verify.state, initial = window.__flowInitial;
        return checkpoints.map(cp => { try { return { id: cp.id, pass: Boolean(new Function('state', 'initial', `return (${cp.check})`)(state, initial)) }; } catch (error) { return { id: cp.id, pass: false, error: String(error) }; } });
      }, flow.checkpoints);
      const pass = !pathError && results.every(x => x.pass);
      if (!pass) failed = true;
      console.log(`${pass ? 'PASS' : 'FAIL'} ${flow.id} / ${player.id} (${player.scenario}${flow.input?.clip ? `, clip=${flow.input.clip}` : ''})${pathError ? ` path=${pathError}` : ''} checkpoints=${results.map(x => `${x.id}:${x.pass ? 'pass' : 'FAIL'}`).join(',')}`);
      await context.close();
    }
  }
} finally { await browser.close(); }
process.exitCode = failed ? 1 : 0;
