import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';

// Short-lived test fixture, never a deployed/background service. Build first.
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'artifacts/browser-smoke');
await mkdir(output, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const relative = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
    const filename = path.resolve(root, 'dist', `.${relative}`);
    if (!filename.startsWith(path.join(root, 'dist') + path.sep)) throw new Error('Invalid path');
    const content = await readFile(filename);
    res.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream' });
    res.end(content);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const pageErrors = [], requests = [], external = [], checks = [];
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('request', req => requests.push({ method: req.method(), url: req.url() }));
  await page.route('**/*', route => {
    if (new URL(route.request().url()).origin !== origin) { external.push(route.request().url()); return route.abort(); }
    return route.continue();
  });
  await page.goto(origin, { waitUntil: 'networkidle' });
  assert.deepEqual(pageErrors, []);
  const id = page.getByLabel('Token ID', { exact: true });
  await id.waitFor({ state: 'visible' });
  // Exercise sequential navigation and native activation, not synthetic clicks.
  await page.keyboard.press('Tab');
  assert.equal(await id.evaluate(el => document.activeElement === el), true);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('#token-slider').evaluate(el => document.activeElement === el), true);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('#encode-text').evaluate(el => document.activeElement === el), true);
  await page.keyboard.press('Tab');
  const nativeEncode = page.getByRole('button', { name: 'Encode', exact: true });
  assert.equal(await nativeEncode.evaluate(el => document.activeElement === el), true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.locator('#encode-text').evaluate(el => document.activeElement === el), true);
  await page.locator('#encode-text').fill('hello');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  assert.equal(await page.getByLabel('Complete token-ID list', { exact: true }).textContent(), '[31373]');
  await page.keyboard.press('Shift+Tab');
  await page.locator('#encode-text').fill('');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  assert.equal(await page.getByLabel('Complete token-ID list', { exact: true }).textContent(), '[]');
  checks.push('sequential Tab / Shift+Tab and native Encode Enter / Space');
  await page.reload({ waitUntil: 'networkidle' });
  await id.fill('50256');
  await page.waitForFunction(() => document.querySelector('.token-output').textContent === '<|endoftext|>');
  for (const invalid of ['', 'NaN', '1.5', '1e2', '-1', '50257', ' 1']) {
    await id.fill(invalid);
    assert.equal(await id.inputValue(), invalid);
    assert.equal(await id.getAttribute('aria-invalid'), 'true');
    assert.match(await page.locator('#token-error').textContent(), /decimal digits/);
    assert.equal(await page.locator('.token-output').textContent(), '<|endoftext|>');
  }
  checks.push('invalid drafts retained; previous decoded text survives');
  await page.screenshot({ path: path.join(output, 'desktop-invalid.png'), fullPage: true });
  const slider = page.getByLabel('Token ID slider (0–50256)', { exact: true });
  await slider.focus(); await slider.press('Home'); await slider.press('ArrowRight');
  assert.equal(await slider.inputValue(), '1');
  assert.equal(await id.inputValue(), '1');
  assert.equal(await id.getAttribute('aria-invalid'), 'false');
  assert.equal(await page.locator('#token-error').textContent(), '');
  const focus = await slider.evaluate(el => ({ focused: document.activeElement === el, style: getComputedStyle(el).outlineStyle, width: getComputedStyle(el).outlineWidth }));
  assert.equal(focus.focused, true); assert.equal(focus.style, 'solid'); assert.equal(focus.width, '3px');
  await page.screenshot({ path: path.join(output, 'desktop-keyboard-focus.png'), fullPage: true });
  checks.push({ keyboardSlider: 'Home then ArrowRight -> 1, error cleared', focus });
  await id.fill('00000');
  assert.equal(await page.locator('.token-output').textContent(), '!');
  await id.fill('47249');
  assert.equal(await page.locator('.token-output').textContent(), '�');

  const text = page.getByLabel('Text to encode (maximum 2048 UTF-16 code units)', { exact: true });
  const button = page.getByRole('button', { name: 'Encode', exact: true });
  const summary = page.locator('.result-summary');
  const ids = page.getByLabel('Complete token-ID list', { exact: true });
  await text.fill('Hello, world!');
  assert.match(await summary.textContent(), /No encoding result yet/);
  await button.click();
  assert.equal(await ids.textContent(), '[15496, 11, 995, 0]');
  assert.match(await summary.textContent(), /Total token count: 4/);
  await text.fill('😀');
  assert.match(await summary.textContent(), /Stale result/);
  assert.equal(await ids.textContent(), '[15496, 11, 995, 0]');
  await button.click(); assert.equal(await ids.textContent(), '[47249, 222]');
  await text.fill('x'.repeat(2049)); await button.click();
  assert.match(await page.locator('#encode-error').textContent(), /Shorten/);
  assert.equal((await text.inputValue()).length, 2049);
  assert.equal(await ids.textContent(), '[47249, 222]');
  assert.match(await summary.textContent(), /Previous result/);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.screenshot({ path: path.join(output, 'narrow-oversize-error.png'), fullPage: true });
  await text.fill(''); await button.click();
  assert.equal(await ids.textContent(), '[]');
  assert.match(await summary.textContent(), /Total token count: 0 \(empty input\)/);
  await text.fill('😀'.repeat(1024)); await button.click();
  const expected = Array.from({ length: 1024 }, () => '47249, 222').join(', ');
  assert.equal(await ids.textContent(), `[${expected}]`);
  assert.match(await summary.textContent(), /Total token count: 2048/);
  const dimensions = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert.equal(dimensions.width, 320); assert.equal(dimensions.scrollWidth, 320);
  await text.fill('你好 😀'); await button.click();
  await page.screenshot({ path: path.join(output, 'narrow-current.png'), fullPage: true });
  const storage = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookies: document.cookie }));
  assert.deepEqual(storage, { local: 0, session: 0, cookies: '' });
  assert.deepEqual(pageErrors, []); assert.deepEqual(external, []);
  assert.ok(requests.every(req => req.method === 'GET'));
  checks.push('explicit encoding, stale count/list, emoji, oversize rejection without truncation, empty success, full 2048-ID result');
  checks.push({ dimensions, storage, requests: requests.length, external, pageErrors });
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ platform: process.platform, browser: browser.version(), checks }, null, 2));
  console.log(JSON.stringify(checks, null, 2));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
