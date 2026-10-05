/* Review-only navigation is deliberately independent of D3. */
(() => {
  function revealHash() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    for (let node = target; node; node = node.parentElement) {
      if (node instanceof HTMLDetailsElement) node.open = true;
    }
    if (typeof target.scrollIntoView === 'function') {
      requestAnimationFrame(() => target.scrollIntoView({ block: 'center' }));
    }
  }
  window.addEventListener('hashchange', revealHash);
  revealHash();
  let printStates;
  window.addEventListener('beforeprint', () => {
    // The original branch app owns its three disclosure classes once js-ready.
    // Capture only unowned nodes, once per print cycle. Without the original
    // app, cover all disclosures so D3 absence does not remove print expansion.
    if (!printStates) {
      const oldAppReady = document.documentElement.classList.contains('js-ready');
      printStates = [...document.querySelectorAll('details')]
        .filter(node => !oldAppReady || !node.matches('.reading-branch, .branch-sources, .reading-combination'))
        .map(node => [node, node.open]);
    }
    for (const [node] of printStates) node.open = true;
  });
  window.addEventListener('afterprint', () => {
    for (const [node, open] of printStates || []) node.open = open;
    printStates = undefined;
  });
})();
