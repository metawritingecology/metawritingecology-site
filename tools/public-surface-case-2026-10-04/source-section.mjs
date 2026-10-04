// Keep source-section prose and numbered records in their authored order.
// Numbered source records use the manuscript's single-line [n] convention.
export function splitSourceSection(markdown) {
  const parts = [];
  let prose = [];
  let sources = [];
  const flushProse = () => {
    const text = prose.join('\n').trim();
    if (text) parts.push({ type: 'prose', markdown: text });
    prose = [];
  };
  const flushSources = () => {
    if (sources.length) parts.push({ type: 'sources', sources });
    sources = [];
  };
  for (const line of String(markdown).split('\n')) {
    const source = line.match(/^\[(\d+)\]\s*(.*)$/);
    if (source) {
      flushProse();
      sources.push({ number: source[1], text: source[2] });
    } else if (!line.trim() && sources.length) {
      // Empty separators do not split a consecutive numbered list.
      continue;
    } else {
      flushSources();
      prose.push(line);
    }
  }
  flushProse();
  flushSources();
  return parts;
}
