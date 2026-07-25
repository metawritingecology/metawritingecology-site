// Expanded Public Surface Adjacency Map — browser runtime loader.
//
// Independent progressive-enhancement loader for this product only. It never
// imports the authority-map loader and is never imported by it.
//
// It fetches the fixed same-origin runtime manifest, strictly validates it,
// reconstructs the approved immutable snapshot path from the validated id,
// fetches that snapshot once, validates its exact byte identity and the full
// dataset contract, and returns a COMPLETE verified snapshot — or a bounded
// failure with a stable result code. It performs NO DOM work; the caller owns
// atomic activation and all fallback UI.
//
// Hard guarantees:
//   - exactly one manifest request, then AT MOST one snapshot request;
//   - one shared total budget, never restarted;
//   - same-origin only — never GitHub, its raw-content host, OSF, or any other
//     external data origin;
//   - byte ceilings enforced by a bounded streaming read BEFORE any text decode;
//   - the response-body byte sequence is the identity boundary, so
//     `response.json()` / `response.text()` are never used for identity;
//   - no retry, no polling, no interval, no browser storage service of any kind
//     (local, session, or indexed), no service worker, no analytics, no
//     telemetry;
//   - no `eval`, no dynamic remote import, no CDN script.
//
// A passing manifest and snapshot establish same-origin byte identity and the
// declared public-surface semantics — NOT currentness, canonicality, Registry
// status, ontology, completeness, supersession, ranking, or authority.

import {
  MAX_MANIFEST_BYTES,
  MAX_RUNTIME_SNAPSHOT_BYTES,
  decodeUtf8Fatal,
  assertByteIdentity,
  sha256Hex,
  gitBlobSha1Hex,
  ByteIdentityError,
} from "./byteIdentity.ts";
import {
  assertAdjacencyRuntimeManifest,
  isContainedSnapshotPath,
  snapshotPathForId,
  MANIFEST_ROUTE_PATH,
  SNAPSHOT_ROUTE_PREFIX,
  SNAPSHOT_SCHEMA_VERSION,
  AdjacencyRuntimeManifestError,
  type AdjacencyRuntimeManifest,
} from "./runtimeManifestContract.ts";
import {
  assertAdjacencySnapshot,
  AdjacencySnapshotError,
  type AdjacencySnapshot,
} from "./contract.ts";

// --- Fixed constants --------------------------------------------------------

/** Fixed literal same-origin manifest path. Never user-controlled. */
export const MANIFEST_PATH = MANIFEST_ROUTE_PATH;
/** Approved same-origin snapshot route prefix. */
export const SNAPSHOT_PREFIX = SNAPSHOT_ROUTE_PREFIX;

export const MANIFEST_MAX_BYTES = MAX_MANIFEST_BYTES; // 16384
export const SNAPSHOT_MAX_BYTES = MAX_RUNTIME_SNAPSHOT_BYTES; // 262144
/** One shared total budget for manifest + snapshot (milliseconds). */
export const TOTAL_BUDGET_MS = 10000;

const JSON_MIME_ESSENCE = "application/json";

// --- Stable result / error codes -------------------------------------------

export type LoaderStage = "boot" | "manifest" | "snapshot";

/** Every stable failure code this loader can return. Tests assert on these. */
export const LOADER_ERROR_CODES = [
  "unsupported",
  "aborted",
  "timeout",
  "network",
  "http",
  "redirect",
  "url",
  "origin",
  "pathname",
  "query",
  "fragment",
  "mime",
  "body",
  "oversize",
  "read",
  "utf8",
  "json",
  "contract",
  "identity",
  "path_reconstruct",
  "path_prefix",
  "schema_version_mismatch",
  "unexpected",
] as const;

export type LoaderErrorCode = (typeof LOADER_ERROR_CODES)[number];

export interface RuntimeLoadSuccess {
  readonly ok: true;
  readonly manifest: AdjacencyRuntimeManifest;
  readonly snapshot: AdjacencySnapshot;
}

export interface RuntimeLoadFailure {
  readonly ok: false;
  readonly stage: LoaderStage;
  readonly code: LoaderErrorCode;
  readonly detail?: string;
}

export type RuntimeLoadResult = RuntimeLoadSuccess | RuntimeLoadFailure;

// --- Injectable browser seam (production uses real globals) -----------------

export interface LoaderResponseReader {
  read(): Promise<{ done: boolean; value?: Uint8Array }>;
  cancel?(reason?: unknown): void | Promise<void>;
}
export interface LoaderResponseBody {
  getReader(): LoaderResponseReader;
}
export interface LoaderResponse {
  readonly ok: boolean;
  readonly url: string;
  readonly redirected?: boolean;
  readonly headers: { get(name: string): string | null };
  readonly body: LoaderResponseBody | null;
}
export interface LoaderRequestInit {
  readonly method: "GET";
  readonly credentials: "same-origin";
  readonly redirect: "error";
  readonly signal: AbortSignal;
}
export type LoaderFetch = (
  input: string,
  init: LoaderRequestInit,
) => Promise<LoaderResponse>;

export interface LoaderDeps {
  /** Fetch implementation. Defaults to the same-origin browser `fetch`. */
  readonly fetch?: LoaderFetch;
  /** Expected exact origin. Defaults to `window.location.origin`. */
  readonly origin?: string;
  /** Total shared budget override (tests only). */
  readonly budgetMs?: number;
  /** Abort controller override (tests only). Production never passes this. */
  readonly controller?: AbortController;
}

// --- Internal error carrier -------------------------------------------------

class LoaderError extends Error {
  readonly stage: LoaderStage;
  readonly code: LoaderErrorCode;
  readonly detail?: string;
  constructor(stage: LoaderStage, code: LoaderErrorCode, detail?: string) {
    super(`adjacency runtime loader failure [${stage}:${code}]${detail ? ` (${detail})` : ""}`);
    this.name = "LoaderError";
    this.stage = stage;
    this.code = code;
    this.detail = detail;
  }
}

// --- Helpers ----------------------------------------------------------------

function mimeEssence(contentType: string | null): string {
  if (!contentType) return "";
  const semi = contentType.indexOf(";");
  const essence = semi === -1 ? contentType : contentType.slice(0, semi);
  return essence.trim().toLowerCase();
}

function resolveFetch(deps: LoaderDeps): LoaderFetch | null {
  if (deps.fetch) return deps.fetch;
  if (typeof fetch === "function") {
    return (input, init) =>
      fetch(input, init as RequestInit) as unknown as Promise<LoaderResponse>;
  }
  return null;
}

function resolveOrigin(deps: LoaderDeps): string | null {
  if (typeof deps.origin === "string") return deps.origin;
  if (typeof window !== "undefined" && window.location) return window.location.origin;
  return null;
}

/**
 * Bounded streaming byte read. Rejects an oversize body without unbounded
 * buffering and before any text decoding. This byte sequence is the identity
 * boundary.
 */
async function readBoundedBody(
  body: LoaderResponseBody,
  max: number,
  stage: LoaderStage,
): Promise<Uint8Array> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value && value.byteLength > 0) {
        total += value.byteLength;
        if (total > max) throw new LoaderError(stage, "oversize", `${total} > ${max}`);
        chunks.push(value);
      }
    }
  } finally {
    if (typeof reader.cancel === "function") {
      try {
        await reader.cancel();
      } catch {
        // best-effort cleanup only
      }
    }
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/**
 * Fetch one same-origin resource, validate the transport envelope, and return
 * the exact response-body bytes. One attempt. No retry, ever.
 */
async function fetchExactBytes(
  doFetch: LoaderFetch,
  url: string,
  expectedOrigin: string,
  expectedPathname: string,
  max: number,
  stage: LoaderStage,
  signal: AbortSignal,
): Promise<Uint8Array> {
  if (signal.aborted) throw new LoaderError(stage, "aborted");

  let response: LoaderResponse;
  try {
    response = await doFetch(url, {
      method: "GET",
      credentials: "same-origin",
      redirect: "error",
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw new LoaderError(stage, "timeout");
    throw new LoaderError(stage, "network", (error as Error)?.message);
  }

  if (signal.aborted) throw new LoaderError(stage, "timeout");
  if (!response.ok) throw new LoaderError(stage, "http");
  if (response.redirected === true) throw new LoaderError(stage, "redirect");

  let finalUrl: URL;
  try {
    finalUrl = new URL(response.url);
  } catch {
    throw new LoaderError(stage, "url");
  }
  // Require an EXACT same-origin final URL. A non-empty search/hash is rejected,
  // never silently stripped.
  if (finalUrl.origin !== expectedOrigin) throw new LoaderError(stage, "origin");
  if (finalUrl.pathname !== expectedPathname) throw new LoaderError(stage, "pathname");
  if (finalUrl.search !== "") throw new LoaderError(stage, "query");
  if (finalUrl.hash !== "") throw new LoaderError(stage, "fragment");

  if (mimeEssence(response.headers.get("content-type")) !== JSON_MIME_ESSENCE) {
    throw new LoaderError(stage, "mime");
  }
  if (!response.body) throw new LoaderError(stage, "body");

  let bytes: Uint8Array;
  try {
    bytes = await readBoundedBody(response.body, max, stage);
  } catch (error) {
    if (error instanceof LoaderError) throw error;
    if (signal.aborted) throw new LoaderError(stage, "timeout");
    throw new LoaderError(stage, "read", (error as Error)?.message);
  }
  if (signal.aborted) throw new LoaderError(stage, "timeout");
  return bytes;
}

// --- Manifest pipeline ------------------------------------------------------

async function loadManifest(
  doFetch: LoaderFetch,
  origin: string,
  signal: AbortSignal,
): Promise<AdjacencyRuntimeManifest> {
  const url = new URL(MANIFEST_PATH, origin).toString();
  const bytes = await fetchExactBytes(
    doFetch,
    url,
    origin,
    MANIFEST_PATH,
    MANIFEST_MAX_BYTES,
    "manifest",
    signal,
  );

  let text: string;
  try {
    text = decodeUtf8Fatal(bytes);
  } catch (error) {
    throw new LoaderError("manifest", "utf8", (error as ByteIdentityError)?.code);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new LoaderError("manifest", "json", (error as Error)?.message);
  }

  try {
    return assertAdjacencyRuntimeManifest(parsed);
  } catch (error) {
    if (error instanceof AdjacencyRuntimeManifestError) {
      throw new LoaderError("manifest", "contract", error.code);
    }
    throw new LoaderError("manifest", "contract");
  }
}

// --- Snapshot pipeline ------------------------------------------------------

async function loadSnapshot(
  doFetch: LoaderFetch,
  origin: string,
  manifest: AdjacencyRuntimeManifest,
  signal: AbortSignal,
): Promise<AdjacencySnapshot> {
  const selected = manifest.selected_snapshot;

  // Reconstruct the path from the fixed prefix + validated id and require it to
  // equal the validated manifest path. A raw manifest path string is never
  // fetched without this reconstruction.
  const constructedPath = snapshotPathForId(selected.id);
  if (constructedPath !== selected.path) throw new LoaderError("snapshot", "path_reconstruct");
  if (!constructedPath.startsWith(SNAPSHOT_PREFIX) || !isContainedSnapshotPath(constructedPath)) {
    throw new LoaderError("snapshot", "path_prefix");
  }

  const url = new URL(constructedPath, origin).toString();
  const bytes = await fetchExactBytes(
    doFetch,
    url,
    origin,
    constructedPath,
    SNAPSHOT_MAX_BYTES,
    "snapshot",
    signal,
  );

  // Exact byte length -> SHA-256 -> Git blob id, in that order.
  try {
    await assertByteIdentity(
      bytes,
      {
        byteLength: selected.byte_length,
        sha256: selected.sha256,
        gitBlob: selected.git_blob,
      },
      "adjacency_runtime_snapshot",
    );
  } catch (error) {
    if (error instanceof ByteIdentityError) {
      throw new LoaderError("snapshot", "identity", error.code);
    }
    throw new LoaderError("snapshot", "identity");
  }

  let text: string;
  try {
    text = decodeUtf8Fatal(bytes);
  } catch (error) {
    throw new LoaderError("snapshot", "utf8", (error as ByteIdentityError)?.code);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new LoaderError("snapshot", "json", (error as Error)?.message);
  }

  let snapshot: AdjacencySnapshot;
  try {
    snapshot = assertAdjacencySnapshot(parsed);
  } catch (error) {
    if (error instanceof AdjacencySnapshotError) {
      throw new LoaderError("snapshot", "contract", error.code);
    }
    throw new LoaderError("snapshot", "contract");
  }

  assertSchemaVersionsAgree(selected.snapshot_schema_version, snapshot.schema_version);
  return snapshot;
}

/**
 * Cross-check the snapshot's own schema version against the version the manifest
 * declared for it. Exported for direct testing because both values are already
 * independently pinned, so this guard is defensive.
 */
export function assertSchemaVersionsAgree(
  manifestDeclared: string,
  snapshotActual: string,
): void {
  if (manifestDeclared !== snapshotActual || snapshotActual !== SNAPSHOT_SCHEMA_VERSION) {
    throw new LoaderError("snapshot", "schema_version_mismatch");
  }
}

/**
 * Recompute the identity of an arbitrary byte sequence. Exposed so the verifier
 * and tests can assert Git-blob support is present in the loader namespace.
 */
export async function computeIdentity(
  bytes: Uint8Array,
): Promise<{ byteLength: number; sha256: string; gitBlob: string }> {
  return {
    byteLength: bytes.length,
    sha256: await sha256Hex(bytes),
    gitBlob: await gitBlobSha1Hex(bytes),
  };
}

// --- Orchestration ----------------------------------------------------------

/**
 * Run the manifest -> snapshot pipeline exactly once under one shared budget.
 * Returns a verified snapshot or a bounded failure. Never throws, never retries,
 * never schedules another request.
 */
export async function loadVerifiedRuntimeSnapshot(
  deps: LoaderDeps = {},
): Promise<RuntimeLoadResult> {
  const doFetch = resolveFetch(deps);
  const origin = resolveOrigin(deps);
  if (!doFetch || !origin) return { ok: false, stage: "boot", code: "unsupported" };

  const budgetMs =
    typeof deps.budgetMs === "number" && deps.budgetMs > 0 ? deps.budgetMs : TOTAL_BUDGET_MS;

  const controller = deps.controller ?? new AbortController();
  // One shared timer for the whole pipeline. It is NOT restarted for the second
  // request and is always cleared in `finally`.
  const timer = setTimeout(() => controller.abort(), budgetMs);

  try {
    const manifest = await loadManifest(doFetch, origin, controller.signal);
    const snapshot = await loadSnapshot(doFetch, origin, manifest, controller.signal);
    return { ok: true, manifest, snapshot };
  } catch (error) {
    if (error instanceof LoaderError) {
      return { ok: false, stage: error.stage, code: error.code, detail: error.detail };
    }
    return { ok: false, stage: "boot", code: "unexpected" };
  } finally {
    clearTimeout(timer);
  }
}

// --- One boot attempt per page load -----------------------------------------

let bootLatch: Promise<RuntimeLoadResult> | null = null;

/**
 * Boot the loader at most once per page load. Repeated calls return the same
 * in-flight/settled promise and issue NO additional requests. No interval, no
 * polling, no background refresh, no automatic retry.
 */
export function bootRuntimeLoader(deps: LoaderDeps = {}): Promise<RuntimeLoadResult> {
  if (bootLatch) return bootLatch;
  bootLatch = loadVerifiedRuntimeSnapshot(deps);
  return bootLatch;
}

/** Test-only: reset the one-boot latch. Never invoked by production UI. */
export function __resetAdjacencyLoaderBootForTests(): void {
  bootLatch = null;
}
