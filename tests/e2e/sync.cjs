// Two browser "devices" sync through the real Forma server (dev mode).
// Uses Postgres when DATABASE_URL is set, otherwise the in-memory store.
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');

const WEB = 5198, API = 8798;
const root = path.join(__dirname, '../..');
(async () => {
  const web = spawn(process.execPath, [path.join(root, 'scripts/serve.mjs')], { env: { ...process.env, PORT: WEB }, stdio: 'ignore' });
  const api = spawn(process.execPath, ['--import', 'tsx', path.join(root, 'server/src/index.ts')], { cwd: root, env: { ...process.env, PORT: API, FORMA_DEV: '1', FORMA_ALLOWED_ORIGINS: `http://localhost:${WEB}`, ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'unused-in-this-test' }, stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((r) => api.stdout.on('data', (d) => /Forma server/.test(String(d)) && r()));
  const browser = await chromium.launch();
  let failed = false;
  const pageErrors = [];
  try {
    const device = async (name) => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await ctx.newPage();
      page.on("pageerror", (e) => pageErrors.push(`${name}: ${e.message}`));
      await page.goto(`http://localhost:${WEB}/`);
      await page.evaluate((api) => localStorage.setItem('forma.state.v1', JSON.stringify({ profile: { onboarded: true, aiEndpoint: api } })), `http://localhost:${API}`);
      await page.goto(`http://localhost:${WEB}/#/profile`); await page.reload();
      return page;
    };
    const state = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('forma.state.v1')));

    const phone = await device('phone');
    await phone.click('[data-act="sign-in"]');
    await phone.waitForSelector('text=Sync now');
    await phone.waitForFunction(() => JSON.parse(localStorage.getItem('forma.state.v1')).sync?.token);
    const { deviceId } = (await state(phone)).sync;

    // Log a workout on the phone
    await phone.goto(`http://localhost:${WEB}/#/train`);
    await phone.click('[data-act="empty"]'); await phone.waitForSelector('.wk-top');
    await phone.click('[data-act="add-ex"]'); await phone.click('.sheet [data-act="exercise"][data-id="dbCurl"]');
    const w = phone.locator('[data-field="weight"][data-i="0"][data-j="0"]'); await w.fill('14'); await w.dispatchEvent('change');
    const r = phone.locator('[data-field="reps"][data-i="0"][data-j="0"]'); await r.fill('10'); await r.dispatchEvent('change');
    await phone.click('.set-row [data-act="done"][data-i="0"][data-j="0"]');
    await phone.click('[data-act="finish"]'); await phone.click('.sheet [data-ok]'); await phone.click('.sheet [data-s="done"]');
    // Auto-sync fires ~4 s after the change
    await phone.waitForFunction(() => { const s = JSON.parse(localStorage.getItem('forma.state.v1')); return s.sync?.lastSyncAt && Object.keys(s.sync.meta).some((k) => k.startsWith('workout:')); }, null, { timeout: 15000 });
    console.log('• phone logged a workout and auto-synced … ok');

    // Second device signs in to the same (dev) account and receives it
    const tablet = await device('tablet');
    await tablet.evaluate((id) => { const s = JSON.parse(localStorage.getItem('forma.state.v1')); s.sync = { deviceId: id }; localStorage.setItem('forma.state.v1', JSON.stringify(s)); }, deviceId);
    await tablet.reload();
    await tablet.click('[data-act="sign-in"]');
    await tablet.waitForFunction(() => (JSON.parse(localStorage.getItem('forma.state.v1')).workouts || []).length === 1, null, { timeout: 10000 });
    console.log('• tablet received the workout … ok');

    // Tablet renames it; phone pulls the change
    const t = await state(tablet);
    await tablet.evaluate(() => { const s = JSON.parse(localStorage.getItem('forma.state.v1')); s.workouts[0].name = 'Arms (edited on tablet)'; localStorage.setItem('forma.state.v1', JSON.stringify(s)); });
    await tablet.reload(); await tablet.goto(`http://localhost:${WEB}/#/profile`); await tablet.click('[data-act="sync-now"]');
    await tablet.waitForTimeout(800);
    await phone.goto(`http://localhost:${WEB}/#/profile`); await phone.click('[data-act="sync-now"]');
    await phone.waitForFunction(() => (JSON.parse(localStorage.getItem('forma.state.v1')).workouts || [{}])[0]?.name === 'Arms (edited on tablet)', null, { timeout: 10000 });
    assert.equal(t.workouts[0].exercises[0].sets[0].reps, 10);
    console.log('• edit on tablet reached the phone … ok');

    // Delete on phone → tombstone reaches tablet
    await phone.evaluate(() => { const s = JSON.parse(localStorage.getItem('forma.state.v1')); s.workouts = []; localStorage.setItem('forma.state.v1', JSON.stringify(s)); });
    await phone.reload(); await phone.goto(`http://localhost:${WEB}/#/profile`); await phone.click('[data-act="sync-now"]'); await phone.waitForTimeout(800);
    await tablet.click('[data-act="sync-now"]');
    await tablet.waitForFunction(() => (JSON.parse(localStorage.getItem('forma.state.v1')).workouts || [1]).length === 0, null, { timeout: 10000 });
    console.log('• deletion propagated … ok');

    await phone.click('[data-act="delete-cloud"]'); await phone.click('.sheet [data-ok]');
    await phone.waitForSelector('text=Sign in (development account)');
    assert.deepEqual(pageErrors, []);
    console.log('• cloud account deleted … ok\n\nSync e2e passed.');
  } catch (e) { failed = true; console.error('FAILED', e.message); }
  finally { await browser.close(); web.kill(); api.kill(); process.exit(failed ? 1 : 0); }
})();
