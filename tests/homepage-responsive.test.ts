// @ts-nocheck — Node's test runner has no ambient types in this repository.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { XMLValidator } from 'fast-xml-parser';

const source = readFileSync(new URL('../src/components/DesktopArticleEntries.astro', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const svgs = source.match(/<svg\b[\s\S]*?<\/svg>/g) ?? [];

test('homepage retains the four accepted v4 SVGs exactly, including mobile crop bounds', () => {
  assert.deepEqual(svgs.map(svg => createHash('sha256').update(svg).digest('hex')), [
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
  assert.equal((markup.match(/<a\b[^>]*>/gi) ?? []).length, 3, 'exactly three reading anchors');
  const anchors = [...markup.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)];
  assert.equal(anchors.length, 3, 'all reading anchors are closed');
  const links = anchors.map(([, attributes, contents]) => {
    const href = attributes.match(/\bhref\s*=\s*(["'])(.*?)\1/i);
    assert.ok(href, 'every reading anchor has a quoted href');
    return [href[2], contents.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()];
  });
  assert.deepEqual(links, [
    ['/artistic-research/public-surface-case/2026-08-18/', '18 August: the first reading'],
    ['/artistic-research/public-surface-case/2026-09-19/', '19 September: one month on'],
    ['/artistic-research/public-surface-case/2026-10-04-revisited/', 'Read the essay, revisited'],
  ]);
}

test('responsive artwork keeps one set of the three approved reading links', () => {
  assertReadingLinks(source);
});

test('reading-link contract rejects duplicates with extra attributes or nested text', () => {
  const first = source.match(/<a\b[^>]*>[\s\S]*?<\/a>/)![0];
  const extraAttributes = first.replace('<a href=', '<a class="duplicate" href=');
  const nestedText = first.replace('18 August: the first reading', '<span>18 August: the first reading</span>');
  for (const duplicate of [extraAttributes, nestedText]) {
    assert.throws(() => assertReadingLinks(source + duplicate), /exactly three reading anchors/);
  }
  const second = source.match(/<a\b[^>]*>[\s\S]*?<\/a>/g)![1];
  assert.throws(() => assertReadingLinks(source.replace(second, extraAttributes)));
});

test('reading-link contract reads legitimate attributes and nested text without losing anchors', () => {
  assertReadingLinks(source
    .replace('<a href=', '<a class="reading-link" href=')
    .replace('18 August: the first reading', '18 August: <span>the first reading</span>'));
});
