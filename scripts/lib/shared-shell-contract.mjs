// Presentation-only route coverage. This is not an indexing/authority registry.
export const DATED_SHELL_ROUTES = [
  '/artistic-research/public-slice/2026-07-25/',
  '/artistic-research/public-slice/2026-07-31/',
  '/artistic-research/public-slice/2026-08-07/',
  '/artistic-research/public-surface-case/2026-08-18/',
  '/artistic-research/public-surface-case/2026-08-22/',
  '/artistic-research/public-surface-case/2026-09-19/',
  '/artistic-research/public-surface-case/2026-10-04/',
  '/artistic-research/public-surface-case/2026-10-04-revisited/',
  '/artistic-research/public-surface-case/2026-10-18/',
  '/artistic-research/public-surface-case/2026-11-15/',
  '/artistic-research/public-surface-case/2026-11-18/',
  '/artistic-research/public-surface-case/2026-11-21/',
  '/artistic-research/public-surface-case/2026-11-22/',
  '/artistic-research/public-surface-case/2026-11-23/',
  '/artistic-research/public-surface-case/2026-11-26/',
  '/artistic-research/public-surface-case/2026-11-26-between-two-pairs-of-hands/',
  '/artistic-research/public-surface-case/2026-11-27/',
  '/artistic-research/public-surface-case/2026-11-28/'
];
export const SHELL_EXCEPTIONS = ['/language-pressure-test-lab-prototype/', '/404/'];

// Count actual opening elements, not class-like prose, comments or JS templates.
// The input is rendered HTML; quoted > characters and boolean attributes are
// supported. Raw-text bodies cannot manufacture extra shell instances.
export function openingElements(html) {
  const elements = [];
  const tokens = /<!--[\s\S]*?-->|<(script|style|textarea|title)\b(?:[^>"']|"[^"]*"|'[^']*')*>[\s\S]*?<\/\1\s*>|<([a-z][\w:-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
  for (const m of html.matchAll(tokens)) {
    if (!m[2]) continue;
    const attrs = {};
    for (const a of m[3].matchAll(/\s+([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4] ?? '';
    }
    elements.push({ tag: m[2].toLowerCase(), attrs });
  }
  return elements;
}
export function shellCounts(html) {
  const tags = openingElements(html);
  const hasClass = (e, name) => (e.attrs.class ?? '').split(/\s+/).includes(name);
  return {
    header: tags.filter(e => e.tag === 'header' && hasClass(e, 'site-header')).length,
    navigation: tags.filter(e => e.tag === 'nav' && hasClass(e, 'site-nav')).length,
    footer: tags.filter(e => e.tag === 'footer' && hasClass(e, 'site-footer')).length,
    searchRoot: tags.filter(e => Object.hasOwn(e.attrs, 'data-public-search')).length,
    opener: tags.filter(e => e.tag === 'button' && Object.hasOwn(e.attrs, 'data-search-modal-trigger')).length,
    input: tags.filter(e => e.tag === 'input' && Object.hasOwn(e.attrs, 'data-search-input')).length,
    dialog: tags.filter(e => e.tag === 'section' && hasClass(e, 'public-search__dialog')).length,
    printMarkers: tags.filter(e => ['header', 'footer'].includes(e.tag) && Object.hasOwn(e.attrs, 'data-article-shell')).length,
    articleFooters: tags.filter(e => e.tag === 'footer' && !hasClass(e, 'site-footer')).length,
    articleNotes: tags.filter(e => e.tag === 'footer' && e.attrs.role === 'note').length
  };
}
export function assertShellCounts(counts, { present, dated }, route) {
  for (const key of ['header','navigation','footer','searchRoot','opener','input','dialog']) {
    if (counts[key] !== (present ? 1 : 0)) throw new Error(`${route}: ${key} count ${counts[key]}, expected ${present ? 1 : 0}`);
  }
  if (counts.printMarkers !== (dated ? 2 : 0)) throw new Error(`${route}: dated print marker count ${counts.printMarkers}`);
  if (dated) {
    const withoutArticleFooter = route.includes('/2026-10-04') ||
      route === '/artistic-research/public-surface-case/2026-11-18/' ||
      route === '/artistic-research/public-surface-case/2026-11-21/' ||
      route === '/artistic-research/public-surface-case/2026-11-22/' ||
      route === '/artistic-research/public-surface-case/2026-11-23/' ||
      route === '/artistic-research/public-surface-case/2026-11-26/' ||
      route === '/artistic-research/public-surface-case/2026-11-26-between-two-pairs-of-hands/' ||
      route === '/artistic-research/public-surface-case/2026-11-27/' ||
      route === '/artistic-research/public-surface-case/2026-11-28/';
    const scopedFooter = route.includes('/2026-07-25/') || route.includes('/2026-07-31/');
    if (counts.articleFooters !== (withoutArticleFooter ? 0 : 1)) throw new Error(`${route}: original article footer count ${counts.articleFooters}`);
    if (counts.articleNotes !== (!withoutArticleFooter && !scopedFooter ? 1 : 0)) throw new Error(`${route}: article footer landmark count ${counts.articleNotes}`);
  }
}
