// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here.
//
// Package D v2 — bounded-request / verifier-lifecycle regression tests.
//
// Deterministic coverage that every HTTP request the metadata build verifier
// makes is bounded, that a stalled response (headers-only OR partial-body) is
// aborted within its configured timeout, that the full verifier fails
// deterministically (never hangs) when a single rendered route stalls, that the
// Wrangler/workerd subtree is reaped and its port released afterward, and that a
// stalled readiness probe is bounded per-attempt and overall.
//
// Node built-ins only. No external network access. Loopback servers are used for
// the header/body timeout cases; a trusted in-process fetch hook is used for the
// full-verifier and readiness cases. Every test carries an outer timeout so a
// regression can never hang the Node test runner.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { connect, createServer as createNetServer } from "node:net";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  fetchRoute,
  awaitReady,
  verifyMetadataBuild,
  getFreePort,
  VerifierTimeoutError
} from "../scripts/verify-metadata-build.mjs";

const REPO_ROOT = new URL("../", import.meta.url);

// --- small helpers ---------------------------------------------------------

// Start a loopback HTTP server whose per-request behavior is defined by `onReq`.
// Live sockets are tracked so the server can be torn down deterministically
// after a client abort (a lingering half-open socket left by an aborted request
// is explicitly destroyed on close), which keeps the Node test runner's event
// loop accounting stable across the abort.
function startHttpServer(onReq) {
  const server = createServer(onReq);
  const sockets = new Set();
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({
        origin: `http://127.0.0.1:${port}`,
        port,
        close: () =>
          new Promise((res) => {
            for (const s of sockets) {
              try {
                s.destroy();
              } catch {
                /* already gone */
              }
            }
            server.close(() => res());
          })
      });
    });
  });
}

// Resolve true if a TCP connection to the port succeeds, false if refused.
function canConnect(port) {
  return new Promise((resolve) => {
    const socket = connect({ port, host: "127.0.0.1" });
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
}

// A fetch hook that hangs on exactly `selectedPath` until its AbortSignal fires,
// delegating every other request (including readiness `/about/`) to real fetch.
function hangingRouteFetch(selectedPath) {
  return (url, opts) => {
    let pathname;
    try {
      pathname = new URL(url).pathname;
    } catch {
      pathname = "";
    }
    if (pathname === selectedPath) {
      return new Promise((_resolve, reject) => {
        opts.signal.addEventListener("abort", () =>
          reject(new DOMException("The operation was aborted.", "AbortError"))
        );
      });
    }
    return globalThis.fetch(url, opts);
  };
}

// A fetch hook that never completes until its AbortSignal fires (readiness case).
function neverReadyFetch() {
  return (_url, opts) =>
    new Promise((_resolve, reject) => {
      opts.signal.addEventListener("abort", () =>
        reject(new DOMException("The operation was aborted.", "AbortError"))
      );
    });
}

// Build the SSR dist once if it is not already present (the check chain builds
// before this suite runs; a standalone run builds on demand). Returns true when
// dist is available.
function ensureBuild() {
  const worker = fileURLToPath(new URL("dist/_worker.js/index.js", REPO_ROOT));
  if (existsSync(worker)) return true;
  const res = spawnSync("node_modules/.bin/astro", ["build"], {
    cwd: fileURLToPath(REPO_ROOT),
    stdio: "ignore"
  });
  return res.status === 0 && existsSync(worker);
}

// ---------------------------------------------------------------------------
// A. Response-header timeout
// ---------------------------------------------------------------------------

test("A: a route whose server never sends headers aborts within the bound", { timeout: 15_000 }, async () => {
  // Accept the request but never send a response: the client blocks waiting for
  // response headers, then must abort at the timeout.
  const srv = await startHttpServer(() => {
    /* never writeHead / never end */
  });
  try {
    const started = Date.now();
    await assert.rejects(
      () => fetchRoute(srv.origin, "/", { timeoutMs: 300 }),
      (err) => {
        assert.ok(err instanceof VerifierTimeoutError, "expected VerifierTimeoutError");
        assert.equal(err.code, "VERIFIER_FETCH_TIMEOUT");
        assert.equal(err.phase, "/");
        return true;
      }
    );
    const elapsed = Date.now() - started;
    assert.ok(elapsed < 5_000, `header timeout should be prompt, took ${elapsed}ms`);
  } finally {
    await srv.close();
  }
});

// ---------------------------------------------------------------------------
// B. Response-body timeout (clearing the timer after headers would fail this)
// ---------------------------------------------------------------------------

test("B: a route that sends headers but never finishes its body aborts within the bound", { timeout: 15_000 }, async () => {
  // Declare a large Content-Length, then send only a partial body and never end.
  const srv = await startHttpServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain", "Content-Length": "1000" });
    res.write("partial body — never completed");
    // Intentionally never res.end(): the client's body read must block, then abort.
  });
  try {
    const started = Date.now();
    await assert.rejects(
      () => fetchRoute(srv.origin, "/slow-body/", { timeoutMs: 400 }),
      (err) => {
        assert.ok(err instanceof VerifierTimeoutError, "expected VerifierTimeoutError on body read");
        assert.equal(err.code, "VERIFIER_FETCH_TIMEOUT");
        assert.equal(err.phase, "/slow-body/");
        return true;
      }
    );
    const elapsed = Date.now() - started;
    assert.ok(elapsed < 5_000, `body timeout should be prompt, took ${elapsed}ms`);
  } finally {
    await srv.close();
  }
});

// ---------------------------------------------------------------------------
// E. Readiness attempt timeout (bounded per-attempt AND overall)
// ---------------------------------------------------------------------------

test("E: a never-completing readiness probe is bounded per attempt and overall", { timeout: 15_000 }, async () => {
  const started = Date.now();
  const ready = await awaitReady("http://127.0.0.1:1", {
    fetchImpl: neverReadyFetch(),
    readinessFetchTimeoutMs: 100,
    readinessTotalMs: 400,
    readinessIntervalMs: 50
  });
  const elapsed = Date.now() - started;
  assert.equal(ready, false, "readiness must terminate as not-ready");
  // Overall must respect the configured total budget (plus a small margin), not
  // the number of attempts times an unbounded per-attempt wait.
  assert.ok(elapsed < 3_000, `readiness overall should be bounded, took ${elapsed}ms`);
});

// ---------------------------------------------------------------------------
// C. Full-verifier single-route timeout (never hangs; deterministic failure)
// ---------------------------------------------------------------------------

test("C: the full verifier fails deterministically when one rendered route stalls", { timeout: 120_000 }, async () => {
  assert.ok(ensureBuild(), "SSR dist build is required for the full-verifier lifecycle test");
  // "/atlas/" is a real indexable route (rendered), sorted after "/about/", and
  // is NOT the readiness probe path, so readiness still succeeds via real fetch.
  const started = Date.now();
  await assert.rejects(
    () =>
      verifyMetadataBuild({
        testHooks: {
          fetchImpl: hangingRouteFetch("/atlas/"),
          routeFetchTimeoutMs: 800
        }
      }),
    (err) => {
      assert.ok(err instanceof VerifierTimeoutError, "expected VerifierTimeoutError from the verifier");
      assert.equal(err.code, "VERIFIER_FETCH_TIMEOUT");
      assert.equal(err.phase, "/atlas/", "timeout must identify the stalled route");
      return true;
    }
  );
  const elapsed = Date.now() - started;
  assert.ok(elapsed < 90_000, `verifier must not hang, took ${elapsed}ms`);
});

// ---------------------------------------------------------------------------
// D. Cleanup + port closure after a full-verifier timeout
// ---------------------------------------------------------------------------

test("D: after a verifier timeout the Wrangler/workerd port is released and reusable", { timeout: 120_000 }, async () => {
  assert.ok(ensureBuild(), "SSR dist build is required for the cleanup lifecycle test");
  const port = await getFreePort();
  await assert.rejects(
    () =>
      verifyMetadataBuild({
        port,
        testHooks: {
          fetchImpl: hangingRouteFetch("/atlas/"),
          routeFetchTimeoutMs: 800
        }
      }),
    (err) => err instanceof VerifierTimeoutError && err.phase === "/atlas/"
  );

  // Poll (bounded) until the local worker listener on the selected port is gone.
  let closed = false;
  for (let i = 0; i < 40; i++) {
    if (!(await canConnect(port))) {
      closed = true;
      break;
    }
    await new Promise((res) => setTimeout(res, 250));
  }
  assert.ok(closed, "the verifier's local worker port must be released after cleanup");

  // A fresh server must be able to bind the port — proving no stale local server
  // was left holding it (and cannot be silently reused).
  await new Promise((resolve, reject) => {
    const probe = createNetServer();
    probe.on("error", reject);
    probe.listen(port, "127.0.0.1", () => {
      probe.close(() => resolve());
    });
  });
});
