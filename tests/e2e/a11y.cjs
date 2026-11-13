// Automated accessibility audit (axe-core, WCAG 2.1 A/AA) of every screen.
//   npm run test:a11y      (fails on serious/critical violations)
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');
const PORT = 5197;
const BASE = `http://localhost:${PORT}/`;
const ROUTES = ['home', 'train', 'workout', 'library', 'generator', 'body', 'progress', 'progress/history', 'profile', 'coach', 'watch'];

(async () => {
  const server = spawn(process.execPath, [path.join(__dirname, '../../scripts/serve.mjs')], { env: { ...process.env, PORT }, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 600));
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  let failed = 0; const summary = {};
  try {
    await page.goto(BASE);
    await page.evaluate(() => localStorage.setItem('forma.state.v1', JSON.stringify({ profile: { onboarded: true } })));
    await page.goto(`${BASE}#/profile`); await page.reload(); await page.click('[data-act="sample"]'); await page.waitForTimeout(400);
    await page.goto(`${BASE}#/train`); await page.click('[data-act="tpl"] >> nth=0'); await page.waitForTimeout(400); // an active workout for the logger
    const audit = async (label) => {
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const res = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations
        .map((v) => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, targets: v.nodes.slice(0, 3).map((x) => x.target.join(' ')) })));
      for (const v of res) {
        const key = `${v.impact} ${v.id}`; (summary[key] ||= { help: v.help, where: new Set() }).where.add(label);
        if (v.impact === 'serious' || v.impact === 'critical') { failed++; console.log(`✗ ${label}: [${v.impact}] ${v.id} ×${v.n} — ${v.help}\n    ${v.targets.join('\n    ')}`); }
      }
    };
    for (const r of ROUTES) { await page.goto(`${BASE}#/${r}`); await page.waitForTimeout(r === 'body' ? 1500 : 500); await audit(r); }
    // Onboarding overlay and a bottom sheet
    await page.goto(`${BASE}#/profile`); await page.click('[data-act="onboarding"]'); await page.waitForTimeout(400); await audit('onboarding');
    await page.reload(); await page.goto(`${BASE}#/library`); await page.click('[data-act="exercise"] >> nth=0'); await page.waitForTimeout(400); await audit('exercise sheet');
    console.log('\nAll violations by rule:');
    for (const [k, v] of Object.entries(summary)) console.log(`  ${k} — ${v.help} (${[...v.where].join(', ')})`);
    console.log(failed ? `\n${failed} serious/critical violation groups.` : '\nNo serious or critical accessibility violations.');
  } finally { await browser.close(); server.kill(); process.exit(failed ? 1 : 0); }
})();
