// Public Surface and Authority-Ceiling Map — Phase 2B browser runtime loader.
//
// Browser-executed progressive-enhancement loader. It fetches the fixed
// same-origin runtime manifest, strictly validates it, constructs the approved
// immutable snapshot URL, fetches that snapshot once, validates its exact byte
// identity and shared snapshot semantics, and returns a COMPLETE verified
// snapshot object — or a bounded failure. It performs NO DOM rendering; the
// caller (the client component) owns all atomic activation and fallback UI.
//
// Hard guarantees (see Phase 2B task boundaries):
//   - exactly one manifest request, then at most one snapshot request;
//   - one SHARED total request budget (manifest + snapshot), never restarted;
//   - byte ceilings enforced by bounded streaming reads BEFORE any text decode;
//   - the decoded response-body byte sequence is the identity boundary, so
//     `response.json()` / `response.text()` are never used for identity;
//   - no retry, no polling, no interval, no storage, no service worker, no
//     telemetry, no external origin, no dynamic remote import;
//   - all validation reuses the shared production contracts unchanged.
//
// The manifest is a WEBSITE-LOCAL runtime pointer only. A passing manifest and
// snapshot establish same-origin byte identity and public-surface semantics —
// NOT currentness, Registry status, ontology, completeness, supersession,
// ranking, authority, or any confirmed conceptual relation.

import {
  MAX_MANIFEST_BYTES,
  MAX_RUNTIME_SNAPSHOT_BYTES,
  decodeUtf8Fatal,
  assertByteIdentity,
  ByteIdentityError,
} from "./byteIdentity.ts";
import {
  assertRuntimeManifest,
  snapshotPathForId,
  SNAPSHOT_ROUTE_PREFIX,
  RuntimeManifestError,
  type RuntimeManifest,
} from "./runtimeManifestContract.ts";
import {
  assertSnapshot,
  SnapshotContractError,
  type PublicSurfaceAuthoritySnapshot,
} from "./contract.ts";

// --- Fixed constants --------------------------------------------------------

/** Fixed literal same-origin manifest path. Never user-controlled. */
export const MANIFEST_PATH = "/public-surface-map/data/manifest.json";
/** Approved same-origin snapshot route prefix (shared with the contract). */
export const SNAPSHOT_PREFIX = SNAPSHOT_ROUTE_PREFIX;

/** Manifest maximum decoded response size (bytes). */
export const MANIFEST_MAX_BYTES = MAX_MANIFEST_BYTES; // 16384
/** Snapshot maximum decoded response size (bytes). */
export const SNAPSHOT_MAX_BYTES = MAX_RUNTIME_SNAPSHOT_BYTES; // 262144
/** One shared total loading budget for manifest + snapshot (milliseconds). */
export const TOTAL_BUDGET_MS = 10000;

const JSON_MIME_ESSENCE = "application/json";

// --- Result type ------------------------------------------------------------

export type LoaderStage = "manifest" | "snapshot" | "boot";

/** Verified success: a complete, identity- and semantics-checked snapshot. */
export interface RuntimeLoadSuccess {
  readonly ok: true;
  readonly manifest: RuntimeManifest;
  readonly snapshot: PublicSurfaceAuthoritySnapshot;
}

/**
 * Bounded failure. `code` is a stable, coarse rejection code; `detail` carries
 * the underlying contract/identity code where one exists. Neither is intended
 * for public UI — the caller shows only the approved bounded failure string.
 */
export interface RuntimeLoadFailure {
  readonly ok: false;
  readonly stage: LoaderStage;
  readonly code: string;
  readonly detail?: string;
}

export type RuntimeLoadResult = RuntimeLoadSuccess | RuntimeLoadFailure;

// --- Injectable browser seam (production uses real globals) ------------------

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
  /** Total shared budget override (tests only). Defaults to TOTAL_BUDGET_MS. */
  readonly budgetMs?: number;
  /**
   * Abort controller override (tests only). Defaults to a fresh controller.
   * Lets a test supply an already-aborted controller to exercise the pre-abort
   * guard. Production never passes this.
   */
  readonly controller?: AbortController;
}

// --- Internal error carrier -------------------------------------------------

class LoaderError extends Error {
  readonly stage: LoaderStage;
  readonly code: string;
  readonly detail?: string;
  constructor(stage: LoaderStage, code: string, detail?: string) {
    super(`runtime loader failure [${stage}:${code}]${detail ? ` (${detail})` : ""}`);
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
  if (typeof window !== "undefined" && window.location) {
    return window.location.origin;
  }
  return null;
}

/**
 * Bounded streaming byte read. Accumulates chunks while enforcing a hard
 * ceiling, so an oversize body is rejected without unbounded buffering and
 * before any text decoding. This decoded byte sequence is the identity
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
        if (total > max) {
          throw new LoaderError(stage, "oversize", `${total} > ${max}`);
        }
        chunks.push(value);
      }
    }
  } finally {
    // Release the stream lock deterministically on every path.
    if (typeof reader.cancel === "function") {
      try {
        await reader.cancel();
      } catch {
        // ignore — cancellation is best-effort cleanup
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
 * Fetch one same-origin resource and validate the transport envelope, then
 * return the exact decoded response-body bytes. One attempt, no retry.
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
  // Pre-abort guard: if the shared budget already elapsed (or the caller's
  // signal is already aborted), fail immediately and issue ZERO network
  // requests. No timer restart, no retry.
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
  // Require an EXACT same-origin final URL: exact origin, exact pathname, and no
  // query or fragment. A non-empty search/hash is rejected, never silently
  // stripped, so a redirect that appends `?…`/`#…` cannot slip through.
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
): Promise<RuntimeManifest> {
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
    return assertRuntimeManifest(parsed);
  } catch (error) {
    if (error instanceof RuntimeManifestError) {
      throw new LoaderError("manifest", "contract", error.code);
    }
    throw new LoaderError("manifest", "contract");
  }
}

// --- Snapshot pipeline ------------------------------------------------------

async function loadSnapshot(
  doFetch: LoaderFetch,
  origin: string,
  manifest: RuntimeManifest,
  signal: AbortSignal,
): Promise<PublicSurfaceAuthoritySnapshot> {
  const selected = manifest.selected_snapshot;

  // Reconstruct the snapshot pathname from the fixed prefix + validated id and
  // require it to equal the validated manifest path. Never fetch a raw manifest
  // path string without reconstructing and verifying it.
  const constructedPath = snapshotPathForId(selected.id);
  if (constructedPath !== selected.path) {
    throw new LoaderError("snapshot", "path_reconstruct");
  }
  if (!constructedPath.startsWith(SNAPSHOT_PREFIX)) {
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

  // Exact byte-length -> SHA-256 -> Git blob id, in that order.
  try {
    await assertByteIdentity(
      bytes,
      {
        byteLength: selected.byte_length,
        sha256: selected.sha256,
        gitBlob: selected.git_blob,
      },
      "runtime_snapshot",
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

  let snapshot: PublicSurfaceAuthoritySnapshot;
  try {
    // No expectedCounts: internal consistency only, so a generalized snapshot
    // with different-but-consistent counts is accepted without weakening any
    // semantic rule.
    snapshot = assertSnapshot(parsed);
  } catch (error) {
    if (error instanceof SnapshotContractError) {
      const code = /\[([^\]]+)\]/.exec(error.message)?.[1] ?? "contract";
      throw new LoaderError("snapshot", "contract", code);
    }
    throw new LoaderError("snapshot", "contract");
  }

  // Snapshot schema version cross-check against the manifest's declared value.
  assertSchemaVersionsAgree(selected.snapshot_schema_version, snapshot.schema_version);

  return snapshot;
}

/**
 * Cross-check that the snapshot's own schema version equals the version the
 * manifest declared for it. Exported for direct testing because both values are
 * independently pinned by their contracts, so this guard is defensive.
 */
export function assertSchemaVersionsAgree(
  manifestDeclared: string,
  snapshotActual: string,
): void {
  if (manifestDeclared !== snapshotActual) {
    throw new LoaderError("snapshot", "schema_version_mismatch");
  }
}

// --- Orchestration ----------------------------------------------------------

/**
 * Run the full manifest -> snapshot pipeline exactly once under one shared
 * total budget. Returns a verified snapshot or a bounded failure. Never throws.
 */
export async function loadVerifiedRuntimeSnapshot(
  deps: LoaderDeps = {},
): Promise<RuntimeLoadResult> {
  const doFetch = resolveFetch(deps);
  const origin = resolveOrigin(deps);
  if (!doFetch || !origin) {
    return { ok: false, stage: "boot", code: "unsupported" };
  }

  const budgetMs =
    typeof deps.budgetMs === "number" && deps.budgetMs > 0
      ? deps.budgetMs
      : TOTAL_BUDGET_MS;

  const controller = deps.controller ?? new AbortController();
  // One shared timer for the whole pipeline; it is NOT restarted for the
  // second request, and it is always cleared in `finally`.
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
 * in-flight/settled promise and issue NO additional requests. There is no
 * interval, no polling, no background refresh, and no automatic retry.
 */
export function bootRuntimeLoader(deps: LoaderDeps = {}): Promise<RuntimeLoadResult> {
  if (bootLatch) return bootLatch;
  bootLatch = loadVerifiedRuntimeSnapshot(deps);
  return bootLatch;
}

/** Test-only: reset the one-boot latch. Never invoked by production UI. */
export function __resetRuntimeLoaderBootForTests(): void {
  bootLatch = null;
}
