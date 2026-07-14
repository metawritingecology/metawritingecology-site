// Public Surface and Authority-Ceiling Map — Phase 1 preview + Phase 2B runtime.
//
// Native DOM + native SVG only. No D3, no CDN, no canvas/WebGL, no iframe, no
// remote dynamic import, no innerHTML for metadata, no storage, no service
// worker, no telemetry. The bundled snapshot is read from an already-rendered
// <script type="application/json"> element, so the initial interface makes NO
// network request. All derived values are limited to filtering, grouping,
// layout coordinates, counts, selection, and routing visibility — nothing here
// computes similarity, centrality, importance, authority, classification,
// inferred relations, or ranking. All edges remain navigation only.
//
// Phase 2B (progressive enhancement): after the bundled fallback interface is
// fully initialized, the runtime loader is invoked EXACTLY ONCE. On a verified
// same-origin runtime snapshot the entire snapshot-dependent runtime root is
// activated ATOMICALLY (prepared off-DOM, then committed in one pass) so a mixed
// fallback/runtime interface is never observable. On any failure the bundled
// fallback is preserved unchanged and only the bounded status text updates.
// There is no retry, no polling, and no background refresh.

import type {
  GroupingField,
  PublicSurfaceAuthoritySnapshot,
  PublicSurfaceEdge,
  PublicSurfaceNode,
} from "../lib/public-surface-authority-map/contract.ts";
import type { RuntimeManifest } from "../lib/public-surface-authority-map/runtimeManifestContract.ts";
import { bootRuntimeLoader } from "../lib/public-surface-authority-map/runtimeLoader.ts";

const SVG_NS = "http://www.w3.org/2000/svg";
const SOURCE_LINK_PREFIX =
  "https://github.com/metawritingecology/meta-writing-ecology/";

// Approved Phase 2B public status strings (verbatim; never paraphrased).
const VERIFIED_STATUS = "Verified same-origin runtime snapshot.";
const FAILURE_STATUS =
  "Runtime snapshot unavailable; showing bundled last-known-good preview snapshot.";
const MISSING_SELECTION_MSG =
  "The previously selected node is not present in the verified runtime snapshot. Selection and selected-node routing were cleared.";

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

// A fully-prepared runtime activation, built off-DOM. Committing it mutates the
// live runtime root in one synchronous pass; nothing here touches live DOM.
interface ActivationPlan {
  readonly snapshot: PublicSurfaceAuthoritySnapshot;
  readonly manifest: RuntimeManifest;
  readonly nodesById: Map<string, PublicSurfaceNode>;
  readonly buttons: Map<string, HTMLButtonElement>;
  readonly optionValues: Map<MetadataField, string[]>;
  readonly tableFragment: DocumentFragment;
}

// A complete snapshot of every live model + DOM surface the activation
// transaction may mutate. Captured before the transaction begins; restored
// verbatim if any activation stage throws, so no partially-activated (mixed
// fallback/runtime) interface is ever left visible.
interface LiveCapture {
  snapshot: PublicSurfaceAuthoritySnapshot;
  nodesById: Map<string, PublicSurfaceNode>;
  buttons: Map<string, HTMLButtonElement>;
  selectedId: string | null;
  mapChildren: ChildNode[];
  mapWidth: string;
  mapHeight: string;
  edgesChildren: ChildNode[];
  edgesW: string | null;
  edgesH: string | null;
  edgesVB: string | null;
  columnLabels: HTMLElement[];
  positions: Array<[string, Point]>;
  selects: Map<MetadataField, { options: ChildNode[]; value: string }>;
  tableRows: ChildNode[] | null;
  status: Record<string, string | null>;
  detail: { children: ChildNode[]; bodyHidden: boolean; emptyHidden: boolean } | null;
  routeSelected: boolean;
  routeGlobal: boolean;
  densityHidden: boolean;
  activeEl: HTMLElement | null;
}

function setOrRemoveAttr(el: Element, name: string, value: string | null): void {
  if (value === null) {
    el.removeAttribute(name);
  } else {
    el.setAttribute(name, value);
  }
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

function distinctValues(
  snapshot: PublicSurfaceAuthoritySnapshot,
  field: MetadataField,
): string[] {
  return Array.from(new Set(snapshot.nodes.map((node) => node[field]))).sort(
    (a, b) => a.localeCompare(b),
  );
}

function init(root: HTMLElement): void {
  const dataEl = root.querySelector<HTMLScriptElement>("#psam-data");
  if (!dataEl || !dataEl.textContent) {
    return;
  }

  // The bundled snapshot is the INITIAL active model. Phase 2B starts from this
  // fully-initialized fallback and only replaces it on a verified runtime load.
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

  // Phase 2B snapshot-dependent surfaces (updated together on activation).
  const runtimeStatusEl = root.querySelector<HTMLElement>("[data-psam-runtime-status]");
  const recordCountEl = root.querySelector<HTMLElement>("[data-psam-record-count]");
  const edgeCountEl = root.querySelector<HTMLElement>("[data-psam-edge-count]");
  const schemaVersionEl = root.querySelector<HTMLElement>("[data-psam-schema-version]");
  const omittedCountEl = root.querySelector<HTMLElement>("[data-psam-omitted-count]");
  const shaEl = root.querySelector<HTMLElement>("[data-psam-sha256]");
  const sourceCommitEl = root.querySelector<HTMLElement>("[data-psam-source-commit]");
  const sourceCommitLinkEl = root.querySelector<HTMLAnchorElement>(
    "[data-psam-source-commit-link]",
  );
  const tableHeadingEl = root.querySelector<HTMLElement>("[data-psam-table-heading]");
  const tableBodyEl = root.querySelector<HTMLElement>("[data-psam-table-body]");

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

  // Mutable model. Reassigned atomically on a verified runtime activation.
  let nodesById = new Map<string, PublicSurfaceNode>();
  let buttons = new Map<string, HTMLButtonElement>();
  const columnLabels: HTMLElement[] = [];
  const positions = new Map<string, Point>();

  let selectedId: string | null = null;
  let runtimeBooted = false;

  // Build the initial fallback model (buttons appended to the live map).
  for (const node of snapshot.nodes) {
    nodesById.set(node.id, node);
    const button = createNodeButton(node);
    buttons.set(node.id, button);
    mapEl.appendChild(button);
  }

  if (fallbackEl) {
    fallbackEl.hidden = true;
  }

  // Return a DETACHED node button (caller appends). No layout side effects.
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
    glyph.textContent = "●";

    const name = document.createElement("span");
    name.className = "psam__node-name";
    name.textContent = node.name;

    button.append(glyph, name);
    button.addEventListener("click", () => {
      selectNode(node.id);
    });
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

  // --- Phase 2B: build the record-table row for one node ---------------------

  function buildTableRow(node: PublicSurfaceNode): HTMLTableRowElement {
    const tr = document.createElement("tr");

    const nameTh = document.createElement("th");
    nameTh.setAttribute("scope", "row");
    nameTh.textContent = node.name;
    tr.appendChild(nameTh);

    const pathTd = document.createElement("td");
    const code = document.createElement("code");
    code.textContent = node.repository_path;
    pathTd.appendChild(code);
    tr.appendChild(pathTd);

    const simple = [
      node.surface_role,
      node.public_surface_status,
      node.authority_ceiling,
      node.classification_evidence,
      node.relation_default,
      node.publicly_declared_classification ?? "—",
    ];
    for (const value of simple) {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    }

    const sourceTd = document.createElement("td");
    if (isSafeSourceUrl(node.canonical_public_url)) {
      const link = document.createElement("a");
      link.href = node.canonical_public_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Source file";
      sourceTd.appendChild(link);
    } else {
      const span = document.createElement("span");
      span.textContent = node.canonical_public_url;
      sourceTd.appendChild(span);
    }
    tr.appendChild(sourceTd);

    return tr;
  }

  // --- Phase 2B: prepare a verified activation entirely off-DOM ---------------

  function prepareActivation(
    runtimeSnapshot: PublicSurfaceAuthoritySnapshot,
    manifest: RuntimeManifest,
  ): ActivationPlan {
    const nextNodesById = new Map<string, PublicSurfaceNode>();
    const nextButtons = new Map<string, HTMLButtonElement>();
    for (const node of runtimeSnapshot.nodes) {
      nextNodesById.set(node.id, node);
      nextButtons.set(node.id, createNodeButton(node)); // detached
    }

    const optionValues = new Map<MetadataField, string[]>();
    for (const field of METADATA_FIELDS) {
      optionValues.set(field, distinctValues(runtimeSnapshot, field));
    }

    const tableFragment = document.createDocumentFragment();
    const sorted = [...runtimeSnapshot.nodes].sort(comparator);
    for (const node of sorted) {
      tableFragment.appendChild(buildTableRow(node));
    }

    return {
      snapshot: runtimeSnapshot,
      manifest,
      nodesById: nextNodesById,
      buttons: nextButtons,
      optionValues,
      tableFragment,
    };
  }

  // --- Phase 2B: rollback-safe activation transaction ------------------------
  //
  //   validated runtime snapshot (already prepared off-DOM as `plan`)
  //     → capture complete fallback/live model + DOM state
  //     → begin activation transaction
  //     → apply all live mutations (8 stages)
  //     → commit
  //   catch (any stage throws)
  //     → restore the captured model and DOM completely
  //     → restore interaction state
  //     → show only the bounded runtime-failure status
  //     → leave the Phase 1 fallback fully usable
  //
  // Preparation being off-DOM is not sufficient: a stage that throws mid-apply
  // must not leave runtime nodes over a fallback table, fallback provenance over
  // a runtime model, a cleared-but-not-restored selection, or any mixed surface.

  // Activation-stage fault injection is exercised by the environment-assisted
  // browser harness, which one-shot-overrides the specific DOM element operation
  // each stage performs (e.g. `mapEl.appendChild`, `tableBodyEl.appendChild`,
  // a status element's `textContent` setter). That requires no production seam,
  // no global, no DOM attribute, no query parameter, and no debug mode here.
  function commitActivation(plan: ActivationPlan): void {
    const priorSelected = selectedId;
    const active = document.activeElement as HTMLElement | null;
    const focusedNodeId =
      active && active.classList.contains("psam__node")
        ? active.dataset.id ?? null
        : null;

    const capture = captureLiveState();
    let missingSelection: boolean;
    try {
      missingSelection = applyActivation(plan, priorSelected, focusedNodeId);
    } catch {
      // Roll the entire interface back to the captured fallback/live state, then
      // surface only the bounded runtime-failure status. No mixed state remains;
      // the fallback stays interactive. No retry.
      restoreLiveState(capture);
      showRuntimeFailure();
      return;
    }
    // Success-only side effect: announce the final outcome exactly once. (The
    // verified status label was set inside stage 5 so a later-stage failure
    // rolls it back.)
    announce(missingSelection ? MISSING_SELECTION_MSG : VERIFIED_STATUS);
  }

  function captureLiveState(): LiveCapture {
    const selects = new Map<MetadataField, { options: ChildNode[]; value: string }>();
    for (const [field, select] of metadataSelects) {
      selects.set(field, { options: Array.from(select.childNodes), value: select.value });
    }
    return {
      snapshot,
      nodesById,
      buttons,
      selectedId,
      mapChildren: Array.from(mapEl!.childNodes),
      mapWidth: mapEl!.style.width,
      mapHeight: mapEl!.style.height,
      edgesChildren: Array.from(edgesEl!.childNodes),
      edgesW: edgesEl!.getAttribute("width"),
      edgesH: edgesEl!.getAttribute("height"),
      edgesVB: edgesEl!.getAttribute("viewBox"),
      columnLabels: [...columnLabels],
      positions: Array.from(positions.entries()),
      selects,
      tableRows: tableBodyEl ? Array.from(tableBodyEl.childNodes) : null,
      status: {
        recordCount: recordCountEl?.textContent ?? null,
        edgeCount: edgeCountEl?.textContent ?? null,
        schema: schemaVersionEl?.textContent ?? null,
        omitted: omittedCountEl?.textContent ?? null,
        sha: shaEl?.textContent ?? null,
        shaAria: shaEl?.getAttribute("aria-label") ?? null,
        commitText: sourceCommitEl?.textContent ?? null,
        commitHref: sourceCommitLinkEl?.getAttribute("href") ?? null,
        heading: tableHeadingEl?.textContent ?? null,
        runtimeStatus: runtimeStatusEl?.textContent ?? null,
      },
      detail:
        detailBodyEl && detailEmptyEl
          ? {
              children: Array.from(detailBodyEl.childNodes),
              bodyHidden: detailBodyEl.hidden,
              emptyHidden: detailEmptyEl.hidden,
            }
          : null,
      routeSelected: routeSelectedEl ? routeSelectedEl.checked : false,
      routeGlobal: routeGlobalEl ? routeGlobalEl.checked : false,
      densityHidden: densityWarningEl ? densityWarningEl.hidden : true,
      activeEl: document.activeElement as HTMLElement | null,
    };
  }

  function restoreLiveState(cap: LiveCapture): void {
    // Each surface is restored defensively so a single failing restore step can
    // never abort the rest or throw an uncaught exception into the console.
    const guard = (fn: () => void): void => {
      try {
        fn();
      } catch {
        /* continue restoring remaining surfaces */
      }
    };

    // Model references.
    guard(() => {
      snapshot = cap.snapshot;
    });
    guard(() => {
      nodesById = cap.nodesById;
    });
    guard(() => {
      buttons = cap.buttons;
    });
    guard(() => {
      selectedId = cap.selectedId;
    });
    guard(() => {
      columnLabels.length = 0;
      columnLabels.push(...cap.columnLabels);
    });
    guard(() => {
      positions.clear();
      for (const [id, point] of cap.positions) positions.set(id, point);
    });

    // Map + edges DOM (map first so the edges <svg> element is reinserted).
    guard(() => {
      mapEl!.replaceChildren(...cap.mapChildren);
      mapEl!.style.width = cap.mapWidth;
      mapEl!.style.height = cap.mapHeight;
    });
    guard(() => {
      edgesEl!.replaceChildren(...cap.edgesChildren);
      setOrRemoveAttr(edgesEl!, "width", cap.edgesW);
      setOrRemoveAttr(edgesEl!, "height", cap.edgesH);
      setOrRemoveAttr(edgesEl!, "viewBox", cap.edgesVB);
    });

    // Filter option lists and selected values.
    for (const [field, snap] of cap.selects) {
      const select = metadataSelects.get(field);
      if (!select) continue;
      guard(() => {
        select.replaceChildren(...snap.options);
        select.value = snap.value;
      });
    }

    // Record table body + row links.
    if (tableBodyEl && cap.tableRows) {
      const rows = cap.tableRows;
      guard(() => {
        tableBodyEl!.replaceChildren(...rows);
      });
    }

    // Status, provenance, counts, schema/version, table heading.
    guard(() => {
      if (recordCountEl) recordCountEl.textContent = cap.status.recordCount;
      if (edgeCountEl) edgeCountEl.textContent = cap.status.edgeCount;
      if (schemaVersionEl) schemaVersionEl.textContent = cap.status.schema;
      if (omittedCountEl) omittedCountEl.textContent = cap.status.omitted;
      if (shaEl) {
        shaEl.textContent = cap.status.sha;
        setOrRemoveAttr(shaEl, "aria-label", cap.status.shaAria);
      }
      if (sourceCommitEl) sourceCommitEl.textContent = cap.status.commitText;
      if (sourceCommitLinkEl) setOrRemoveAttr(sourceCommitLinkEl, "href", cap.status.commitHref);
      if (tableHeadingEl) tableHeadingEl.textContent = cap.status.heading;
      if (runtimeStatusEl) runtimeStatusEl.textContent = cap.status.runtimeStatus;
    });

    // Detail panel.
    if (cap.detail && detailBodyEl && detailEmptyEl) {
      const detail = cap.detail;
      guard(() => {
        detailBodyEl!.replaceChildren(...detail.children);
        detailBodyEl!.hidden = detail.bodyHidden;
        detailEmptyEl!.hidden = detail.emptyHidden;
      });
    }

    // Selected-node routing state, global-routing preference, density warning.
    guard(() => {
      if (routeSelectedEl) routeSelectedEl.checked = cap.routeSelected;
    });
    guard(() => {
      if (routeGlobalEl) routeGlobalEl.checked = cap.routeGlobal;
    });
    guard(() => {
      if (densityWarningEl) densityWarningEl.hidden = cap.densityHidden;
    });

    // Focus target where still applicable.
    guard(() => {
      if (cap.activeEl && document.contains(cap.activeEl)) {
        cap.activeEl.focus({ preventScroll: true });
      }
    });
  }

  // Apply all live mutations in eight discrete stages. A throw in any stage
  // propagates to `commitActivation`, which rolls the whole interface back.
  function applyActivation(
    plan: ActivationPlan,
    priorSelected: string | null,
    focusedNodeId: string | null,
  ): boolean {
    // Stage 1: node + label replacement.
    for (const button of buttons.values()) button.remove();
    for (const label of columnLabels) label.remove();
    columnLabels.length = 0;
    positions.clear();
    snapshot = plan.snapshot;
    nodesById = plan.nodesById;
    buttons = plan.buttons;
    for (const button of buttons.values()) mapEl!.appendChild(button);

    // Stage 2: edge replacement (clear prior edges).
    edgesEl!.replaceChildren();

    // Stage 3: filter-option replacement (preserve each value when still valid).
    for (const [field, select] of metadataSelects) {
      const prev = select.value;
      for (const opt of Array.from(select.options)) {
        if (opt.value !== "") select.removeChild(opt);
      }
      const values = plan.optionValues.get(field) ?? [];
      for (const value of values) {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = value;
        select.appendChild(opt);
      }
      select.value = values.includes(prev) ? prev : "";
    }

    // Stage 4: table-row replacement.
    if (tableBodyEl) {
      while (tableBodyEl.firstChild) tableBodyEl.removeChild(tableBodyEl.firstChild);
      tableBodyEl.appendChild(plan.tableFragment);
    }

    // Stage 5: status / provenance update (never sourced from failed metadata).
    updateStatusHooks(plan.manifest, plan.snapshot);
    setRuntimeStatusLabel(VERIFIED_STATUS);

    // Stage 6: selection / detail reconciliation.
    let missingSelection = false;
    if (priorSelected && nodesById.has(priorSelected)) {
      selectedId = priorSelected;
      const node = nodesById.get(priorSelected);
      if (node) renderDetail(node);
      const btn = buttons.get(priorSelected);
      if (btn) btn.setAttribute("aria-pressed", "true");
    } else if (priorSelected) {
      // Selected node absent from the runtime snapshot: clear selection and
      // selected-node routing; preserve unrelated filters and global routing.
      missingSelection = true;
      clearSelection();
      if (routeSelectedEl) routeSelectedEl.checked = false;
    } else {
      selectedId = null;
    }

    // Stage 7: layout and routing (global-routing preference never auto-enabled).
    updateDensityWarning();
    layout(visibleNodes());
    drawRouting();

    // Stage 8: focus restoration.
    restoreFocus(focusedNodeId);

    return missingSelection;
  }

  function updateStatusHooks(
    manifest: RuntimeManifest,
    snap: PublicSurfaceAuthoritySnapshot,
  ): void {
    const sel = manifest.selected_snapshot;
    if (recordCountEl) recordCountEl.textContent = String(snap.nodes.length);
    if (edgeCountEl) {
      edgeCountEl.textContent =
        `${snap.edges.length} (${snap.edge_counts.boundary_reference} boundary ` +
        `reference, ${snap.edge_counts.source_use_reference} source-use reference)`;
    }
    if (schemaVersionEl) schemaVersionEl.textContent = snap.schema_version;
    if (omittedCountEl) {
      omittedCountEl.textContent = String(snap.self_references_omitted_count);
    }
    if (shaEl) {
      shaEl.textContent = sel.sha256;
      shaEl.setAttribute("aria-label", `Snapshot SHA-256 ${sel.sha256}`);
    }
    if (sourceCommitEl) sourceCommitEl.textContent = sel.source_commit;
    if (sourceCommitLinkEl) {
      sourceCommitLinkEl.href = `${SOURCE_LINK_PREFIX}commit/${sel.source_commit}`;
    }
    if (tableHeadingEl) {
      tableHeadingEl.textContent = `All ${snap.nodes.length} records`;
    }
  }

  function setRuntimeStatusLabel(text: string): void {
    if (runtimeStatusEl) {
      runtimeStatusEl.textContent = text;
    }
  }

  function restoreFocus(focusedNodeId: string | null): void {
    if (!focusedNodeId) {
      return;
    }
    const target = buttons.get(focusedNodeId);
    if (target && !target.hidden) {
      target.focus({ preventScroll: true });
      return;
    }
    // Prior focus target is gone: move to the closest stable map control.
    const stable = resetEl ?? filterTextEl ?? groupRadios[0] ?? null;
    if (stable) {
      stable.focus({ preventScroll: true });
    }
  }

  function showRuntimeFailure(): void {
    // Preserve the bundled fallback data, interactions, filters, selection, and
    // provenance. Update only the bounded status text and announce once.
    setRuntimeStatusLabel(FAILURE_STATUS);
    announce(FAILURE_STATUS);
  }

  function startRuntimeBoot(): void {
    if (runtimeBooted) {
      return;
    }
    runtimeBooted = true;
    bootRuntimeLoader()
      .then((result) => {
        if (!result.ok) {
          showRuntimeFailure();
          return;
        }
        let plan: ActivationPlan;
        try {
          plan = prepareActivation(result.snapshot, result.manifest);
        } catch {
          showRuntimeFailure();
          return;
        }
        try {
          commitActivation(plan);
        } catch {
          // A commit failure must not leave a mixed interface visible; fall
          // back to the bounded failure status.
          showRuntimeFailure();
        }
      })
      .catch(() => {
        showRuntimeFailure();
      });
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

  // Initial render of the bundled fallback model.
  updateDensityWarning();
  refresh("silent");

  // Phase 2B: after the fallback interface is fully initialized, attempt exactly
  // one verified runtime activation.
  startRuntimeBoot();
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
