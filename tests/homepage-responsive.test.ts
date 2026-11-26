// @ts-nocheck — Node's test runner has no ambient types in this repository.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { XMLValidator } from 'fast-xml-parser';

const source = readFileSync(new URL('../src/components/DesktopArticleEntries.astro', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const svgs = source.match(/<svg\b[\s\S]*?<\/svg>/g) ?? [];

test('homepage retains the four accepted v4 SVGs exactly, including mobile crop bounds', () => {
  assert.deepEqual(svgs.slice(0, 4).map(svg => createHash('sha256').update(svg).digest('hex')), [
    'b5de80c13d60900fd286ca1f5ca41f2b4dfe4fd12b69fda2981de80b51db961a',
    '1e7522e0df75444bebe17af42c0c1196eb1fa878545b25b13ca2b916b8621413',
    '905e18b5041882f9522b63b3edd7f8fdc4245a0cf3920ec613c00652ce00516b',
    'ab3532c10154dd6d8e528409c10b60554b97fddc78a8b7ab1a0c201672e83815',
  ]);
  for (const svg of svgs) {
    assert.equal(XMLValidator.validate(svg), true);
    assert.match(svg, /aria-hidden="true"/);
    assert.match(svg, /focusable="false"/);
  }
  const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});

function assertReadingLinks(markup: string) {
  // Count all opening anchors before reading attributes or nested text, so
  // a differently formatted duplicate cannot disappear from the contract.
  assert.equal((markup.match(/<a\b[^>]*>/gi) ?? []).length, 13, 'exactly thirteen reading anchors');
  const anchors = [...markup.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)];
  assert.equal(anchors.length, 13, 'all reading anchors are closed');
  const links = anchors.map(([, attributes, contents]) => {
    const href = attributes.match(/\bhref\s*=\s*(["'])(.*?)\1/i);
    assert.ok(href, 'every reading anchor has a quoted href');
    return [href[2], contents.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()];
  });
  assert.deepEqual(links, [
    ['/artistic-research/public-surface-case/2026-08-18/', '18 August 2026: the first reading'],
    ['/artistic-research/public-surface-case/2026-09-19/', '19 September 2026: one month on'],
    ['/artistic-research/public-surface-case/2026-10-04/', '4 October 2026 · Original essay'],
    ['/artistic-research/public-surface-case/2026-10-04-revisited/#latest-disciplinary-levels', '5 October 2026 · Additions'],
    ['/artistic-research/public-surface-case/2026-10-04-revisited/#november-harm-reduction', '21 November 2026 · Follow-up'],
    ['/artistic-research/public-surface-case/2026-10-04-revisited/', 'Read all layers together'],
    ['/artistic-research/public-surface-case/2026-10-18/', 'Read the France protests snapshot · 18 October 2026'],
    ['/artistic-research/public-surface-case/2026-11-15/', 'Read the Guandu snapshot · 15 November 2026'],
    ['/artistic-research/public-surface-case/2026-11-18/', 'Read the Beiyang snapshot · 18 November 2026'],
    ['/artistic-research/public-surface-case/2026-11-21/', 'Read the Kaohsiung snapshot · 21 November 2026'],
    ['/artistic-research/public-surface-case/2026-11-22/', 'Read the election snapshot · 22 November 2026'],
    ['/artistic-research/public-surface-case/2026-11-23/', 'Read the homecoming snapshot · 23 November 2026'],
    ['/artistic-research/public-surface-case/2026-11-26/', 'Read the Taipei case · 26 November 2026'],
  ]);
}

test('responsive artwork keeps one set of the thirteen approved reading links', () => {
  assertReadingLinks(source);
});

test('reading-link contract rejects duplicates with extra attributes or nested text', () => {
  const first = source.match(/<a\b[^>]*>[\s\S]*?<\/a>/)![0];
  const extraAttributes = first.replace('<a href=', '<a class="duplicate" href=');
  const nestedText = first.replace('18 August 2026: the first reading', '<span>18 August 2026: the first reading</span>');
  for (const duplicate of [extraAttributes, nestedText]) {
    assert.throws(() => assertReadingLinks(source + duplicate), /exactly thirteen reading anchors/);
  }
  const second = source.match(/<a\b[^>]*>[\s\S]*?<\/a>/g)![1];
  assert.throws(() => assertReadingLinks(source.replace(second, extraAttributes)));
});

test('reading-link contract reads legitimate attributes and nested text without losing anchors', () => {
  assertReadingLinks(source
    .replace('<a href=', '<a class="reading-link" href=')
    .replace('18 August 2026: the first reading', '18 August 2026: <span>the first reading</span>'));
});


test('new history card uses one inline vector layer without an image rectangle', () => {
  assert.equal(svgs.length, 5);
  assert.match(svgs[4], /class="history-art"/);
  assert.match(svgs[4], /viewBox="250 215 1170 505"/);
  assert.doesNotMatch(svgs[4], /<image|data:image|<rect[^>]*width="1672"|<script/);
  assert.doesNotMatch(source, /<img[^>]*history-art/);
  assert.match(source, /\.plate--history::before/);
  assert.match(source, /overflow: visible/);
});

test('Kaohsiung uses the same reading link at all widths and keeps its picture on the homepage', () => {
  const art = readFileSync(new URL('../src/pages/artistic-research.md', import.meta.url), 'utf8');
  const article = readFileSync(new URL('../src/data/public-surface-case/2026-11-21/rendered-body.en.html', import.meta.url), 'utf8');
  const asset = '/assets/public-surface-case/2026-11-21/harbour-projection.webp';
  assert.ok(source.includes(`src="${asset}"`));
  assert.ok(!art.includes(asset), 'Art listing remains text-only');
  assert.ok(!article.includes(asset), 'article uses its own figures');
  assert.match(art, /Two concerts, three metro stops apart\./);
  assert.equal((article.match(/<li id="s\d+">/g) ?? []).length, 19);
  const sourceIds = new Set([...article.matchAll(/<li id="(s\d+)">/g)].map(m => m[1]));
  for (const [, ref] of article.matchAll(/href="#(s\d+)"/g)) assert.ok(sourceIds.has(ref), ref);
});

test('dated readings share the homepage date convention and remain in order', () => {
  const dates = ['2026-08-18', '2026-09-19', '2026-10-04', '2026-10-18', '2026-11-15', '2026-11-18', '2026-11-21', '2026-11-22', '2026-11-23', '2026-11-26'];
  assert.deepEqual([...source.matchAll(/<time datetime="([^"]+)">([^<]+)<\/time>/g)].map(m => m[1]), dates);
  const format = new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'});
  const label = date => format.format(new Date(date));
  for (const d of dates) assert.ok(source.includes(`<time datetime="${d}">${label(d)}</time>`), d);

  const pages = [
    ...['2026-07-25', '2026-07-31', '2026-08-07'].map(d => [d, `pages/artistic-research/public-slice/${d}.astro`]),
    ...['2026-08-18', '2026-08-22', '2026-09-19', '2026-10-04', '2026-10-04-revisited'].map(d => [d.slice(0, 10), `pages/artistic-research/public-surface-case/${d}.astro`]),
    ...['2026-10-18', '2026-11-15', '2026-11-18', '2026-11-21', '2026-11-22', '2026-11-23', '2026-11-26'].map(d => [d, `data/public-surface-case/${d}/rendered-body.en.html`]),
  ];
  for (const [d, path] of pages) {
    const page = readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
    assert.ok(page.includes(`<time datetime="${d}">${label(d)}</time>`), path);
  }
});

test('homepage article cards use shared typography at all widths', () => {
  for (const role of ['h3', 'p', '.date', 'a']) {
    assert.ok(source.includes(`.scene-entry article ${role} { font-size:`) ||
              source.includes(`.scene-entry article ${role} { color: var(--muted); font-size:`), role);
  }
  assert.doesNotMatch(source, /\.(?:plate|guandu)-copy\s+h3\s*\{/);
});

test('the homecoming cover is homepage-only and both reading entries point to one clean article', () => {
  const art = readFileSync(new URL('../src/pages/artistic-research.md', import.meta.url), 'utf8');
  const article = readFileSync(new URL('../src/data/public-surface-case/2026-11-23/rendered-body.en.html', import.meta.url), 'utf8');
  const asset = '/assets/public-surface-case/2026-11-23/convergence-cover.svg';
  const svg = readFileSync(new URL('../public' + asset, import.meta.url), 'utf8');
  assert.ok(source.includes(`src="${asset}"`));
  assert.ok(art.includes('/artistic-research/public-surface-case/2026-11-23/'));
  assert.ok(!art.includes(asset));
  assert.doesNotMatch(article, /<(?:img|svg|figure)\b|unpublished draft|cover sample/i);
  assert.equal(XMLValidator.validate(svg), true);
  const ids = [...article.matchAll(/<li id="(s\d+)">/g)].map(m => m[1]);
  const refs = [...article.matchAll(/href="#(s\d+)"/g)].map(m => m[1]);
  assert.equal(ids.length, 11);
  assert.deepEqual(refs, ids);
  assert.match(source, /\.homecoming-plate img \{[^}]*object-fit: contain/);
});

test('Taipei neutrality uses a homepage-only cover and numbered article sources', () => {
  const route = '/artistic-research/public-surface-case/2026-11-26/';
  const asset = '/assets/public-surface-case/2026-11-26/balance-cover.svg';
  const art = readFileSync(new URL('../src/pages/artistic-research.md', import.meta.url), 'utf8');
  const article = readFileSync(new URL('../src/data/public-surface-case/2026-11-26/rendered-body.en.html', import.meta.url), 'utf8');
  const svg = readFileSync(new URL('../public' + asset, import.meta.url), 'utf8');
  assert.equal(source.split(asset).length - 1, 1);
  assert.ok(art.includes(route));
  assert.ok(!art.includes(asset));
  assert.doesNotMatch(article, /<(?:img|svg|figure)\b/);
  assert.equal(XMLValidator.validate(svg), true);
  const ids = [...article.matchAll(/<li id="(s\d+)">/g)].map(m => m[1]);
  const refs = [...article.matchAll(/href="#(s\d+)"/g)].map(m => m[1]);
  assert.deepEqual(ids, Array.from({length: 22}, (_, i) => 's' + (i + 1)));
  assert.deepEqual([...new Set(refs)], ids);
});
