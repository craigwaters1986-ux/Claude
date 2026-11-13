// End-to-end flows in headless Chromium: `npm run test:e2e`
// Starts the static server, walks the core journeys, asserts behaviour and
// fails on any page error. Screenshots go to $SHOTS (optional).
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');

const PORT = 5199;
const BASE = `http://localhost:${PORT}/`;
const SHOTS = process.env.SHOTS;

(async () => {
  const server = spawn(process.execPath, [path.join(__dirname, '../../scripts/serve.mjs')], { env: { ...process.env, PORT }, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 600));
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: false });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const shot = async (n) => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${n}.png`) }); };
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('forma.state.v1')));
  const step = async (name, fn) => { process.stdout.write(`• ${name} … `); await fn(); console.log('ok'); };
  let failed = false;

  try {
    await page.goto(BASE);

    await step('onboarding: choose lb, skip health, start fresh', async () => {
      await page.click('.onb [data-act="next"]');           // welcome
      await page.click('.onb [data-act="goal"][data-v="strength"]');
      await page.click('.onb [data-act="next"]');
      await page.waitForTimeout(300);
      await page.click('.onb [data-act="skip"]');
      await page.waitForTimeout(300);
      await page.click('.onb [data-act="fresh"]');
      await page.waitForTimeout(400);
      const s = await state();
      assert.equal(s.profile.onboarded, true);
      assert.equal(s.profile.goal, 'strength');
      assert.equal(s.workouts.length, 0);
    });

    await step('empty states render without data', async () => {
      for (const r of ['home', 'train', 'body', 'progress']) { await page.goto(`${BASE}#/${r}`); await page.waitForTimeout(300); }
      assert.ok(await page.locator('text=No data yet').count());
    });

    await step('log a workout: add exercise, enter sets, rest timer, finish', async () => {
      await page.goto(`${BASE}#/train`);
      await page.click('[data-act="empty"]');
      await page.waitForSelector('.wk-top');
      await page.click('[data-act="add-ex"]');
      await page.fill('.sheet [data-search]', 'bench press');
      await page.click('.sheet [data-act="exercise"][data-id="bench"]');
      await page.waitForTimeout(300);
      const w = page.locator('[data-field="weight"][data-i="0"][data-j="0"]');
      await w.fill('60'); await w.dispatchEvent('change');
      const r = page.locator('[data-field="reps"][data-i="0"][data-j="0"]');
      await r.fill('8'); await r.dispatchEvent('change');
      await page.click('.set-row [data-act="done"][data-i="0"][data-j="0"]');
      await page.waitForSelector('.rest-banner');
      await shot('e2e-logger');
      // one-handed thumb bar: next set is pre-filled from the row above when added
      await page.click('[data-act="rest-skip"]');
      await page.click('[data-act="add-set"][data-i="0"]');
      await page.click('.thumbbar [data-act="step"][data-f="w"][data-d="2.5"]');
      await page.click('.thumbbar [data-act="done"]');
      await page.waitForTimeout(400); // autosave is debounced (~180 ms)
      const s = await state();
      const sets = s.active.exercises[0].sets;
      assert.equal(sets.filter((x) => x.done).length, 2);
      assert.equal(sets[1].weightKg, 62.5);
      // autosave survives a reload mid-workout (offline-first)
      await page.reload(); await page.waitForSelector('.wk-top');
      assert.equal((await state()).active.exercises[0].sets.filter((x) => x.done).length, 2);
      await page.click('[data-act="finish"]');
      await page.click('.sheet [data-ok]').catch(() => {});
      await page.waitForSelector('text=Workout complete');
      await shot('e2e-summary');
      await page.click('.sheet [data-s="tpl"]');
      await page.waitForTimeout(400);
      const after = await state();
      assert.equal(after.active, null);
      assert.equal(after.workouts.length, 1);
      assert.equal(after.templates.length, 1);
      assert.equal(after.workouts[0].exercises[0].sets.length, 2, 'incomplete sets are dropped');
    });

    await step('second session from template detects a PR', async () => {
      await page.goto(`${BASE}#/train`);
      await page.click('[data-act="tpl"]');
      await page.waitForSelector('.wk-top');
      const w = page.locator('[data-field="weight"][data-i="0"][data-j="0"]');
      await w.fill('70'); await w.dispatchEvent('change');
      const r = page.locator('[data-field="reps"][data-i="0"][data-j="0"]');
      await r.fill('8'); await r.dispatchEvent('change');
      await page.click('.set-row [data-act="done"][data-i="0"][data-j="0"]');
      await page.waitForSelector('.toast.pr');
      assert.ok(await page.locator('.badge.pr').count());
      await page.click('[data-act="finish"]');
      await page.click('.sheet [data-ok]');
      await page.waitForSelector('text=personal record');
      await page.click('.sheet [data-s="done"]');
      await page.waitForTimeout(300);
    });

    await step('discarding a workout does not resurrect it (autosave race)', async () => {
      await page.goto(`${BASE}#/train`);
      await page.click('[data-act="empty"]');
      await page.waitForSelector('.wk-top');
      await page.fill('[data-field="name"]', 'temp');
      await page.click('[data-act="discard"]');
      await page.click('.sheet [data-ok]');
      await page.waitForTimeout(400);
      assert.equal((await state()).active, null);
    });

    await step('units switch to lb converts display, storage stays kg', async () => {
      await page.goto(`${BASE}#/profile`);
      await page.click('[data-act="units"][data-v="lb"]');
      await page.waitForTimeout(200);
      const s = await state();
      assert.equal(s.profile.units, 'lb');
      assert.equal(s.workouts[0].exercises[0].sets[0].weightKg, 60);
      await page.goto(`${BASE}#/progress/workout/${s.workouts[0].id}`);
      assert.ok(await page.locator('text=132.5 lb × 8').count(), '60 kg shows as 132.5 lb');
      await page.goto(`${BASE}#/profile`);
      await page.click('[data-act="units"][data-v="kg"]');
    });

    await step('edit a completed workout', async () => {
      const id = (await state()).workouts[0].id;
      await page.goto(`${BASE}#/workout/edit/${id}`);
      const r = page.locator('[data-field="reps"][data-i="0"][data-j="0"]');
      await r.fill('9'); await r.dispatchEvent('change');
      await page.click('[data-act="finish"]');
      await page.waitForTimeout(300);
      assert.equal((await state()).workouts[0].exercises[0].sets[0].reps, 9);
    });

    await step('load sample data → recovery, body model + muscle tap', async () => {
      await page.goto(`${BASE}#/profile`);
      await page.click('[data-act="sample"]');
      await page.waitForTimeout(300);
      await page.goto(`${BASE}#/body`);
      await page.waitForSelector('[data-stage] canvas', { timeout: 8000 });
      await page.waitForTimeout(1500);
      // Tap a muscle via the list (canvas picking depends on camera framing)
      await page.click('.list-item[data-id="chest"]');
      await page.waitForSelector('.muscle-callout');
      const txt = await page.locator('.muscle-callout').innerText();
      assert.match(txt, /CHEST/i); assert.match(txt, /recovered/); assert.match(txt, /Weekly sets/i);
      await shot('e2e-body-callout');
      // Canvas picking: click at the chest location on the front view
      await page.click('[data-act="reset"]');
      await page.waitForTimeout(800);
      await page.click('[data-act="mode"][data-m="volume"]');
      await page.waitForTimeout(800);
      // Anatomical (BodyParts3D) model loads and its meshes are tappable via the same mapping
      await page.click('[data-act="model"][data-v="anatomical"]');
      await page.waitForFunction(() => !document.querySelector('[data-stage]')?.dataset.loading, null, { timeout: 30000 });
      assert.match(await page.locator('[data-model-note]').innerText(), /BodyParts3D/);
      await page.waitForTimeout(800);
      const box = await page.locator('[data-stage] canvas').boundingBox();
      await page.mouse.click(box.x + box.width / 2 - 18, box.y + box.height * 0.27);
      await page.waitForTimeout(500);
      assert.match(await page.locator('[data-callout]').innerText(), /CHEST/i);
      await shot('e2e-body-anatomical');
      await page.click('[data-act="model"][data-v="builtin"]');
      await page.click('[data-act="tab"][data-t="dashboard"]');
      await page.waitForSelector('text=Recovery trend');
      await shot('e2e-recovery-dashboard');
    });

    await step('AI generator: generate, regenerate one exercise, weekly programme', async () => {
      await page.goto(`${BASE}#/generator`);
      await page.click('[data-act="target"][data-v="back"]');
      await page.click('[data-act="injury"][data-v="lowerBack"]');
      await page.click('[data-act="generate"]');
      await page.waitForSelector('[data-act="start"]');
      const names = await page.locator('.card b').allInnerTexts();
      assert.ok(names.length > 1, 'plan has exercises');
      assert.ok(!names.some((n) => /Deadlift|Barbell Row|Back Extension/.test(n)), `lower-back-loading lifts excluded: ${names}`);
      const before = await page.locator('[data-i="0"] b').first().innerText();
      await page.click('[data-act="regen"][data-i="0"]');
      const after = await page.locator('[data-i="0"] b').first().innerText();
      assert.notEqual(before, after);
      await shot('e2e-generator');
      await page.click('[data-act="edit"]');
      await page.click('[data-act="mode"][data-v="week"]');
      await page.click('[data-act="target"][data-v="back"]'); // clear target
      await page.click('[data-act="days"][data-v="5"]');
      await page.click('[data-act="generate"]');
      await page.waitForSelector('text=Push / Pull / Legs');
    });

    await step('coach answers are grounded', async () => {
      await page.goto(`${BASE}#/coach`);
      await page.click('[data-act="suggest"] >> nth=2');
      await page.waitForSelector('.msg.bot:not(.typing)');
      const t = await page.locator('.msg.bot').last().innerText();
      assert.match(t, /flat|estimated 1RM/);
      await page.fill('[data-q]', 'How is my HRV?');
      await page.press('[data-q]', 'Enter');
      await page.waitForTimeout(800);
      assert.match(await page.locator('.msg.bot').last().innerText(), /don't have access/);
      await shot('e2e-coach');
    });

    await step('watch preview counts synthetic reps and syncs to the active workout', async () => {
      await page.goto(`${BASE}#/train`);
      await page.click('[data-act="tpl"] >> nth=0');   // Push Day template (bench first)
      await page.waitForSelector('.wk-top');
      // move the curl-friendly path: use demo by adding curls first
      await page.goto(`${BASE}#/watch`);
      await page.waitForTimeout(500);
      const target = (await state()).active.exercises[0].sets[0].reps || 10;
      await page.click('[data-act="start-set"]');
      // Synthetic motion streams in real time (~2.5 s per rep); wait until counting settles.
      let reps = 0, last = -1, stable = 0;
      for (let t = 0; t < 60 && stable < 4; t++) { await page.waitForTimeout(1000); reps = +(await page.locator('[data-w-reps]').innerText()); stable = reps === last && reps > 0 ? stable + 1 : 0; last = reps; }
      assert.ok(Math.abs(reps - target) <= 1, `counted ${reps}, target ${target} (stream does target or target−1 reps)`);
      await page.click('[data-act="end"]');
      await page.waitForTimeout(300);
      assert.ok(reps >= 6, `counted ${reps}`);
      const s = await state();
      const first = s.active.exercises[0].sets[0];
      assert.equal(first.done, true); assert.equal(first.source, 'watch');
      await shot('e2e-watch');
      await page.goto(`${BASE}#/workout`);
      await page.click('[data-act="discard"]'); await page.click('.sheet [data-ok]');
    });

    await step('export + delete all data', async () => {
      await page.goto(`${BASE}#/profile`);
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act="export"]')]);
      assert.match(dl.suggestedFilename(), /forma-export/);
      await page.click('[data-act="delete"]'); await page.click('.sheet [data-ok]');
      await page.waitForTimeout(400);
      assert.equal(await page.evaluate(() => localStorage.getItem('forma.state.v1')), null);
    });

    assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
    console.log('\nAll e2e flows passed.');
  } catch (e) {
    failed = true;
    console.log('FAILED');
    console.error(e.message);
    if (errors.length) console.error('page errors:', errors);
    await page.screenshot({ path: path.join(SHOTS || '.', 'e2e-failure.png') }).catch(() => {});
  } finally {
    await browser.close(); server.kill();
    process.exit(failed ? 1 : 0);
  }
})();
