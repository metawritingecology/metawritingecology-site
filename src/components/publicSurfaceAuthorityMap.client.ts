// Public Surface and Authority-Ceiling Map — Phase 1 preview client.
//
// Native DOM + native SVG only. No D3, no CDN, no canvas/WebGL, no iframe, no
// fetch, no remote dynamic import, no innerHTML for metadata. The bundled
// snapshot is read from an already-rendered <script type="application/json">
// element, so no external request is made. All derived values are limited to
// filtering, grouping, layout coordinates, counts, selection, and routing
// visibility — nothing here computes similarity, centrality, importance,
// authority, classification, inferred relations, or ranking.

import type {
  GroupingField,
  PublicSurfaceAuthoritySnapshot,
  PublicSurfaceEdge,
  PublicSurfaceNode,
} from "../lib/public-surface-authority-map/contract.ts";

const SVG_NS = "http://www.w3.org/2000/svg";
const SOURCE_LINK_PREFIX =
  "https://github.com/metawritingecology/meta-writing-ecology/";

const NODE_W = 168;
const NODE_H = 52;
const COL_GAP = 32;
const ROW_GAP = 14;
const PAD_X = 20;
const PAD_TOP = 42;
const PAD_BOTTOM = 22;
const COL_W = NODE_W + COL_GAP;
const ROW_H = NODE_H + ROW_GAP;

const GROUP_LABELS: Record<GroupingField, string> = {
  surface_role: "surface role",
  authority_ceiling: "authority ceiling",
  public_surface_status: "public-surface status",
};

const DEFAULT_GROUP: GroupingField = "surface_role";

type MetadataField =
  | "surface_role"
  | "authority_ceiling"
  | "public_surface_status"
  | "classification_evidence";

const METADATA_FIELDS: readonly MetadataField[] = [
  "surface_role",
  "authority_ceiling",
  "public_surface_status",
  "classification_evidence",
];

interface Point {
  readonly cx: number;
  readonly cy: number;
}

function isSafeSourceUrl(url: string): boolean {
  return url.startsWith(SOURCE_LINK_PREFIX);
}

function isGroupingField(value: string): value is GroupingField {
  return (
    value === "surface_role" ||
    value === "authority_ceiling" ||
    value === "public_surface_status"
  );
}

function comparator(a: PublicSurfaceNode, b: PublicSurfaceNode): number {
  return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
}

function init(root: HTMLElement): void {
  const dataEl = root.querySelector<HTMLScriptElement>("#psam-data");
  if (!dataEl || !dataEl.textContent) {
    return;
  }

  let snapshot: PublicSurfaceAuthoritySnapshot;
  try {
    snapshot = JSON.parse(dataEl.textContent) as PublicSurfaceAuthoritySnapshot;
  } catch {
    // Leave the server-rendered fallback (table + boundaries) in place.
    return;
  }

  const mapEl = root.querySelector<HTMLElement>("[data-psam-map]");
  const edgesEl = root.querySelector<SVGSVGElement>("[data-psam-edges]");
  const fallbackEl = root.querySelector<HTMLElement>("[data-psam-map-fallback]");
  const statusEl = root.querySelector<HTMLElement>("[data-psam-status]");
  const detailEmptyEl = root.querySelector<HTMLElement>("[data-psam-detail-empty]");
  const detailBodyEl = root.querySelector<HTMLElement>("[data-psam-detail-body]");
  const filterTextEl = root.querySelector<HTMLInputElement>("[data-psam-filter-text]");
  const resetEl = root.querySelector<HTMLButtonElement>("[data-psam-reset]");
  const routeSelectedEl = root.querySelector<HTMLInputElement>("[data-psam-route-selected]");
  const routeGlobalEl = root.querySelector<HTMLInputElement>("[data-psam-route-global]");
  const densityWarningEl = root.querySelector<HTMLElement>("[data-psam-density-warning]");

  if (!mapEl || !edgesEl) {
    return;
  }

  const groupRadios = Array.from(
    root.querySelectorAll<HTMLInputElement>('input[name="psam-group"]'),
  );
  const metadataSelects = new Map<MetadataField, HTMLSelectElement>();
  for (const field of METADATA_FIELDS) {
    const select = root.querySelector<HTMLSelectElement>(
      `[data-psam-filter="${field}"]`,
    );
    if (select) {
      metadataSelects.set(field, select);
    }
  }

  // Build node buttons once; reuse across relayouts.
  const buttons = new Map<string, HTMLButtonElement>();
  const columnLabels: HTMLElement[] = [];
  const positions = new Map<string, Point>();
  const nodesById = new Map<string, PublicSurfaceNode>();

  let selectedId: string | null = null;

  for (const node of snapshot.nodes) {
    nodesById.set(node.id, node);
    buttons.set(node.id, createNodeButton(node));
  }

  if (fallbackEl) {
    fallbackEl.hidden = true;
  }

  function createNodeButton(node: PublicSurfaceNode): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "psam__node";
    button.dataset.id = node.id;
    button.setAttribute("aria-pressed", "false");
    button.setAttribute(
      "aria-label",
      `${node.name} — surface role ${node.surface_role}; ` +
        `public-surface status ${node.public_surface_status}; ` +
        `authority ceiling ${node.authority_ceiling}. Navigation only.`,
    );
    button.style.width = `${NODE_W}px`;
    button.style.height = `${NODE_H}px`;

    const glyph = document.createElement("span");
    glyph.className = "psam__node-glyph";
    glyph.setAttribute("aria-hidden", "true");
    glyph.textContent = "●"; // ●

    const name = document.createElement("span");
    name.className = "psam__node-name";
    name.textContent = node.name;

    button.append(glyph, name);
    button.addEventListener("click", () => {
      selectNode(node.id);
    });
    mapEl!.appendChild(button);
    return button;
  }

  function currentGroupField(): GroupingField {
    const checked = groupRadios.find((radio) => radio.checked);
    if (checked && isGroupingField(checked.value)) {
      return checked.value;
    }
    return DEFAULT_GROUP;
  }

  function visibleNodes(): PublicSurfaceNode[] {
    const query = filterTextEl ? filterTextEl.value.trim().toLowerCase() : "";
    return snapshot.nodes.filter((node) => {
      if (query) {
        const haystack = `${node.name} ${node.repository_path}`.toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      for (const [field, select] of metadataSelects) {
        if (select.value && node[field] !== select.value) {
          return false;
        }
      }
      return true;
    });
  }

  function anyFilterActive(): boolean {
    if (filterTextEl && filterTextEl.value.trim() !== "") {
      return true;
    }
    for (const select of metadataSelects.values()) {
      if (select.value !== "") {
        return true;
      }
    }
    return false;
  }

  function layout(visible: PublicSurfaceNode[]): void {
    positions.clear();
    for (const label of columnLabels) {
      label.remove();
    }
    columnLabels.length = 0;

    const visibleIds = new Set(visible.map((node) => node.id));
    for (const [id, button] of buttons) {
      button.hidden = !visibleIds.has(id);
    }

    const groupField = currentGroupField();
    const groups = new Map<string, PublicSurfaceNode[]>();
    for (const node of visible) {
      const key = node[groupField];
      const bucket = groups.get(key);
      if (bucket) {
        bucket.push(node);
      } else {
        groups.set(key, [node]);
      }
    }

    const groupKeys = Array.from(groups.keys()).sort((a, b) =>
      a.localeCompare(b),
    );

    let maxRows = 0;
    groupKeys.forEach((key, columnIndex) => {
      const bucket = (groups.get(key) ?? []).slice().sort(comparator);
      maxRows = Math.max(maxRows, bucket.length);
      const x = PAD_X + columnIndex * COL_W;

      const label = document.createElement("div");
      label.className = "psam__col-label";
      label.setAttribute("aria-hidden", "true");
      label.style.left = `${x}px`;
      label.style.top = "12px";
      label.style.width = `${NODE_W}px`;
      label.textContent = `${key} (${bucket.length})`;
      mapEl!.appendChild(label);
      columnLabels.push(label);

      bucket.forEach((node, rowIndex) => {
        const y = PAD_TOP + rowIndex * ROW_H;
        const button = buttons.get(node.id);
        if (button) {
          button.style.left = `${x}px`;
          button.style.top = `${y}px`;
        }
        positions.set(node.id, {
          cx: x + NODE_W / 2,
          cy: y + NODE_H / 2,
        });
      });
    });

    const width = Math.max(
      PAD_X * 2 + Math.max(groupKeys.length, 1) * COL_W - COL_GAP,
      PAD_X * 2 + NODE_W,
    );
    const height = Math.max(PAD_TOP + maxRows * ROW_H - ROW_GAP + PAD_BOTTOM, 220);

    mapEl!.style.width = `${width}px`;
    mapEl!.style.height = `${height}px`;
    edgesEl!.setAttribute("width", String(width));
    edgesEl!.setAttribute("height", String(height));
    edgesEl!.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }

  function drawRouting(): void {
    while (edgesEl!.firstChild) {
      edgesEl!.removeChild(edgesEl!.firstChild);
    }

    const showGlobal = routeGlobalEl ? routeGlobalEl.checked : false;
    const showSelected = routeSelectedEl ? routeSelectedEl.checked : false;

    let edges: readonly PublicSurfaceEdge[] = [];
    if (showGlobal) {
      edges = snapshot.edges;
    } else if (showSelected && selectedId) {
      const active = selectedId;
      edges = snapshot.edges.filter(
        (edge) => edge.source === active || edge.target === active,
      );
    }

    for (const edge of edges) {
      const from = positions.get(edge.source);
      const to = positions.get(edge.target);
      if (!from || !to) {
        continue; // endpoint filtered out of the current view
      }
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", String(from.cx));
      line.setAttribute("y1", String(from.cy));
      line.setAttribute("x2", String(to.cx));
      line.setAttribute("y2", String(to.cy));
      line.setAttribute("class", `psam__edge psam__edge--${edge.relation_type}`);
      edgesEl!.appendChild(line);
    }
  }

  function renderDetail(node: PublicSurfaceNode): void {
    if (!detailBodyEl || !detailEmptyEl) {
      return;
    }
    detailEmptyEl.hidden = true;
    detailBodyEl.hidden = false;
    while (detailBodyEl.firstChild) {
      detailBodyEl.removeChild(detailBodyEl.firstChild);
    }

    const heading = document.createElement("h3");
    heading.className = "psam__detail-name";
    heading.textContent = node.name;
    detailBodyEl.appendChild(heading);

    const dl = document.createElement("dl");
    dl.className = "psam__detail-dl";

    const addRow = (term: string, build: (dd: HTMLElement) => void): void => {
      const dt = document.createElement("dt");
      dt.textContent = term;
      const dd = document.createElement("dd");
      build(dd);
      dl.append(dt, dd);
    };

    const textRow = (term: string, value: string): void => {
      addRow(term, (dd) => {
        dd.textContent = value;
      });
    };

    textRow("Repository path", node.repository_path);
    textRow("Surface role", node.surface_role);
    textRow("Public-surface status", node.public_surface_status);
    textRow("Authority ceiling", node.authority_ceiling);
    textRow("Relation default", node.relation_default);
    textRow("Classification evidence", node.classification_evidence);
    if (node.publicly_declared_classification) {
      textRow("Declared classification", node.publicly_declared_classification);
    }
    textRow("Source-use reference", node.source_use_reference);

    addRow("Boundary references", (dd) => {
      if (node.boundary_references.length === 0) {
        dd.textContent = "None listed.";
        return;
      }
      const list = document.createElement("ul");
      for (const ref of node.boundary_references) {
        const item = document.createElement("li");
        item.textContent = ref;
        list.appendChild(item);
      }
      dd.appendChild(list);
    });

    addRow("Source", (dd) => {
      if (isSafeSourceUrl(node.canonical_public_url)) {
        const link = document.createElement("a");
        link.href = node.canonical_public_url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Open source file";
        dd.appendChild(link);
      } else {
        dd.textContent = node.canonical_public_url;
      }
    });

    detailBodyEl.appendChild(dl);

    const note = document.createElement("p");
    note.className = "psam__detail-note";
    note.textContent =
      "Selection and routing are navigation only. This does not establish a confirmed conceptual relation.";
    detailBodyEl.appendChild(note);
  }

  function selectNode(id: string): void {
    const node = nodesById.get(id);
    if (!node) {
      return;
    }
    selectedId = id;
    for (const [buttonId, button] of buttons) {
      button.setAttribute("aria-pressed", buttonId === id ? "true" : "false");
    }
    renderDetail(node);
    announce(`Selected ${node.name}. Navigation only.`);
    drawRouting();
  }

  function clearSelection(): void {
    selectedId = null;
    for (const button of buttons.values()) {
      button.setAttribute("aria-pressed", "false");
    }
    if (detailBodyEl && detailEmptyEl) {
      detailBodyEl.hidden = true;
      detailEmptyEl.hidden = false;
      while (detailBodyEl.firstChild) {
        detailBodyEl.removeChild(detailBodyEl.firstChild);
      }
    }
  }

  function announce(message: string): void {
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  function announceCount(visibleCount: number): void {
    const total = snapshot.nodes.length;
    if (anyFilterActive()) {
      announce(
        `Showing ${visibleCount} of ${total} records, filtered from the current map view. No records are removed from the record table.`,
      );
    } else {
      announce(`Showing all ${total} records.`);
    }
  }

  function refresh(announceMode: "count" | "silent"): void {
    const visible = visibleNodes();
    layout(visible);
    drawRouting();
    if (announceMode === "count") {
      announceCount(visible.length);
    }
  }

  function updateDensityWarning(): void {
    if (densityWarningEl) {
      densityWarningEl.hidden = !(routeGlobalEl && routeGlobalEl.checked);
    }
  }

  // --- Wiring ---------------------------------------------------------------

  for (const radio of groupRadios) {
    radio.addEventListener("change", () => {
      if (radio.checked) {
        refresh("silent");
        announce(`Grouped by ${GROUP_LABELS[currentGroupField()]}.`);
      }
    });
  }

  if (filterTextEl) {
    filterTextEl.addEventListener("input", () => {
      refresh("count");
    });
  }

  for (const select of metadataSelects.values()) {
    select.addEventListener("change", () => {
      refresh("count");
    });
  }

  if (routeSelectedEl) {
    routeSelectedEl.addEventListener("change", () => {
      drawRouting();
    });
  }

  if (routeGlobalEl) {
    routeGlobalEl.addEventListener("change", () => {
      updateDensityWarning();
      drawRouting();
    });
  }

  if (resetEl) {
    resetEl.addEventListener("click", () => {
      if (filterTextEl) {
        filterTextEl.value = "";
      }
      for (const select of metadataSelects.values()) {
        select.value = "";
      }
      for (const radio of groupRadios) {
        radio.checked = radio.value === DEFAULT_GROUP;
      }
      if (routeSelectedEl) {
        routeSelectedEl.checked = false;
      }
      if (routeGlobalEl) {
        routeGlobalEl.checked = false;
      }
      updateDensityWarning();
      clearSelection();
      const visible = visibleNodes();
      layout(visible);
      drawRouting();
      announce(`View reset. Showing all ${snapshot.nodes.length} records.`);
    });
  }

  // Initial render.
  updateDensityWarning();
  refresh("silent");
}

function boot(): void {
  const root = document.querySelector<HTMLElement>("[data-psam]");
  if (root) {
    init(root);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
