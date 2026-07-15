// @ts-nocheck -- Node test harness; this repository intentionally has no
// @types/node dependency. Production contracts remain type-checked by tsc.

import assert from "node:assert/strict";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { sha256Hex } from "../../src/lib/public-surface-authority-map/byteIdentity.ts";
import {
  assertRepositoryRelativePath,
  retainPublicSurfaceSnapshot,
  serializeRetentionRecord,
  SNAPSHOT_ROOT_RELATIVE,
} from "../../scripts/public-surface-snapshot-retention.mjs";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const productionSnapshotRelative =
  "src/data/public-surface-authority-map/runtime-snapshots/18491105f0bc0451e0bf99eaa78c39f69c7cb57c-82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e.json";
const fallbackRelative =
  "src/data/public-surface-authority-map/last-known-good.json";
const manifestRelative =
  "src/data/public-surface-authority-map/runtime-manifest.json";

const productionRaw = await readFile(
  path.join(repositoryRoot, productionSnapshotRelative),
  "utf8",
);
const productionSnapshot = JSON.parse(productionRaw);
const productionManifest = await readFile(
  path.join(repositoryRoot, manifestRelative),
);
const productionFallback = await readFile(
  path.join(repositoryRoot, fallbackRelative),
);

const COMMIT_A = "1111111111111111111111111111111111111111";
const COMMIT_B = "2222222222222222222222222222222222222222";

async function temporaryRepository(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "psam-retention-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "candidates"), { recursive: true });
  await mkdir(path.join(root, ...SNAPSHOT_ROOT_RELATIVE.split("/")), {
    recursive: true,
  });
  return root;
}

function syntheticBytes(label) {
  const snapshot = structuredClone(productionSnapshot);
  snapshot.title = `Synthetic retention fixture ${label}`;
  return new TextEncoder().encode(`${JSON.stringify(snapshot, null, 2)}\n`);
}

async function stageInput(root, name, bytes, sourceCommit = COMMIT_A) {
  const relative = `candidates/${name}.json`;
  await writeFile(path.join(root, ...relative.split("/")), bytes);
  const snapshotSha256 = await sha256Hex(bytes);
  const record = await retainPublicSurfaceSnapshot({
    repositoryRoot: root,
    snapshotPath: relative,
    sourceCommit,
    snapshotSha256,
  });
  return { record, snapshotSha256 };
}

function retainedAbsolute(root, record) {
  return path.join(root, ...record.destination.split("/"));
}

async function readBytes(file) {
  return new Uint8Array(await readFile(file));
}

async function expectCode(action, code) {
  await assert.rejects(action, (error) => {
    assert.equal(error.code, code);
    return true;
  });
}

test("retention: two distinct valid synthetic identities coexist", async (t) => {
  const root = await temporaryRepository(t);
  const first = await stageInput(root, "first", syntheticBytes("one"), COMMIT_A);
  const second = await stageInput(root, "second", syntheticBytes("two"), COMMIT_B);

  assert.notEqual(first.record.destination, second.record.destination);
  assert.deepEqual(await readBytes(retainedAbsolute(root, first.record)), syntheticBytes("one"));
  assert.deepEqual(await readBytes(retainedAbsolute(root, second.record)), syntheticBytes("two"));
});

test("retention: byte-identical re-stage is an idempotent no-op", async (t) => {
  const root = await temporaryRepository(t);
  const bytes = syntheticBytes("idempotent");
  const first = await stageInput(root, "candidate", bytes);
  const destination = retainedAbsolute(root, first.record);
  const before = await lstat(destination);

  const second = await stageInput(root, "candidate", bytes);
  const after = await lstat(destination);

  assert.deepEqual(second.record, first.record);
  assert.equal(after.mtimeMs, before.mtimeMs);
  assert.deepEqual(await readBytes(destination), bytes);
});

test("retention: existing identity with different bytes fails closed", async (t) => {
  const root = await temporaryRepository(t);
  const bytes = syntheticBytes("conflict");
  const sha = await sha256Hex(bytes);
  const destination = path.join(
    root,
    ...SNAPSHOT_ROOT_RELATIVE.split("/"),
    `${COMMIT_A}-${sha}.json`,
  );
  const conflicting = new TextEncoder().encode("different existing bytes\n");
  await writeFile(destination, conflicting);
  await writeFile(path.join(root, "candidates", "candidate.json"), bytes);

  await expectCode(
    async () =>
      retainPublicSurfaceSnapshot({
        repositoryRoot: root,
        snapshotPath: "candidates/candidate.json",
        sourceCommit: COMMIT_A,
        snapshotSha256: sha,
      }),
    "destination_conflict",
  );
  assert.deepEqual(await readBytes(destination), conflicting);
});

test("retention: invalid source-commit and SHA-256 formats are rejected", async (t) => {
  const root = await temporaryRepository(t);
  const bytes = syntheticBytes("formats");
  await writeFile(path.join(root, "candidates", "candidate.json"), bytes);
  const sha = await sha256Hex(bytes);
  const base = {
    repositoryRoot: root,
    snapshotPath: "candidates/candidate.json",
    sourceCommit: COMMIT_A,
    snapshotSha256: sha,
  };

  await expectCode(
    () => retainPublicSurfaceSnapshot({ ...base, sourceCommit: "A".repeat(40) }),
    "source_commit",
  );
  await expectCode(
    () => retainPublicSurfaceSnapshot({ ...base, sourceCommit: "a".repeat(39) }),
    "source_commit",
  );
  await expectCode(
    () => retainPublicSurfaceSnapshot({ ...base, snapshotSha256: "F".repeat(64) }),
    "snapshot_sha256",
  );
  await expectCode(
    () => retainPublicSurfaceSnapshot({ ...base, snapshotSha256: "f".repeat(63) }),
    "snapshot_sha256",
  );
});

test("retention: filename identity must match exact content SHA-256", async (t) => {
  const root = await temporaryRepository(t);
  const bytes = syntheticBytes("mismatch");
  await writeFile(path.join(root, "candidates", "candidate.json"), bytes);

  await expectCode(
    async () =>
      retainPublicSurfaceSnapshot({
        repositoryRoot: root,
        snapshotPath: "candidates/candidate.json",
        sourceCommit: COMMIT_A,
        snapshotSha256: "0".repeat(64),
      }),
    "snapshot_sha256_mismatch",
  );
});

test("retention: invalid JSON is rejected", async (t) => {
  const root = await temporaryRepository(t);
  const bytes = new TextEncoder().encode("{not-json\n");
  await writeFile(path.join(root, "candidates", "invalid.json"), bytes);

  await expectCode(
    async () =>
      retainPublicSurfaceSnapshot({
        repositoryRoot: root,
        snapshotPath: "candidates/invalid.json",
        sourceCommit: COMMIT_A,
        snapshotSha256: await sha256Hex(bytes),
      }),
    "snapshot_json",
  );
});

test("retention: invalid public-surface map contract is rejected", async (t) => {
  const root = await temporaryRepository(t);
  const snapshot = structuredClone(productionSnapshot);
  snapshot.authority_ceiling = "formal_authority";
  const bytes = new TextEncoder().encode(`${JSON.stringify(snapshot)}\n`);
  await writeFile(path.join(root, "candidates", "invalid-contract.json"), bytes);

  await expectCode(
    async () =>
      retainPublicSurfaceSnapshot({
        repositoryRoot: root,
        snapshotPath: "candidates/invalid-contract.json",
        sourceCommit: COMMIT_A,
        snapshotSha256: await sha256Hex(bytes),
      }),
    "snapshot_contract",
  );
});

test("path safety: host-independent unsafe path forms are rejected", () => {
  const cases = [
    ["C:/x", "path_drive"],
    ["C:relative", "path_drive"],
    ["/absolute", "path_absolute"],
    ["../escape", "path_traversal"],
    ["directory\\file.json", "path_backslash"],
    ["", "path_empty"],
  ];
  for (const [candidate, code] of cases) {
    assert.throws(
      () => assertRepositoryRelativePath(candidate),
      (error) => error.code === code,
      candidate,
    );
  }
});

test("path safety: normal repository-relative forward-slash path is accepted", () => {
  assert.equal(
    assertRepositoryRelativePath("candidates/directory/file.json"),
    "candidates/directory/file.json",
  );
});

test("path safety: symlink or reparse-point escape is rejected", async (t) => {
  const root = await temporaryRepository(t);
  const outside = await mkdtemp(path.join(os.tmpdir(), "psam-outside-"));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await writeFile(path.join(outside, "candidate.json"), syntheticBytes("escape"));
  try {
    await symlink(
      outside,
      path.join(root, "linked-outside"),
      process.platform === "win32" ? "junction" : "dir",
    );
  } catch (error) {
    if (["EPERM", "EACCES", "ENOSYS"].includes(error.code)) {
      t.skip(`platform does not permit symlink/reparse fixture: ${error.code}`);
      return;
    }
    throw error;
  }

  await expectCode(
    () =>
      retainPublicSurfaceSnapshot({
        repositoryRoot: root,
        snapshotPath: "linked-outside/candidate.json",
        sourceCommit: COMMIT_A,
        snapshotSha256: "0".repeat(64),
      }),
    "path_symlink",
  );
});

test("append-only: existing snapshots are never deleted or overwritten", async (t) => {
  const root = await temporaryRepository(t);
  const snapshotRoot = path.join(root, ...SNAPSHOT_ROOT_RELATIVE.split("/"));
  const historicalA = path.join(snapshotRoot, `${COMMIT_A}-${"a".repeat(64)}.json`);
  const historicalB = path.join(snapshotRoot, `${COMMIT_B}-${"b".repeat(64)}.json`);
  const bytesA = new TextEncoder().encode("historical-a\n");
  const bytesB = new TextEncoder().encode("historical-b\n");
  await writeFile(historicalA, bytesA);
  await writeFile(historicalB, bytesB);

  await stageInput(root, "new", syntheticBytes("new"));

  assert.deepEqual(await readBytes(historicalA), bytesA);
  assert.deepEqual(await readBytes(historicalB), bytesB);
  assert.equal((await lstat(snapshotRoot)).isDirectory(), true);
});

async function pointerFixture(t) {
  const root = await temporaryRepository(t);
  const dataRoot = path.join(root, "src", "data", "public-surface-authority-map");
  await writeFile(path.join(dataRoot, "runtime-manifest.json"), productionManifest);
  await writeFile(path.join(dataRoot, "last-known-good.json"), productionFallback);
  await writeFile(
    path.join(dataRoot, "runtime-snapshots", path.basename(productionSnapshotRelative)),
    new TextEncoder().encode(productionRaw),
  );
  return root;
}

test("pointer separation: active runtime manifest remains byte-identical", async (t) => {
  const root = await pointerFixture(t);
  await stageInput(root, "candidate", syntheticBytes("pointer-manifest"), COMMIT_B);
  assert.deepEqual(
    await readFile(path.join(root, ...manifestRelative.split("/"))),
    productionManifest,
  );
});

test("pointer separation: last-known-good remains byte-identical", async (t) => {
  const root = await pointerFixture(t);
  await stageInput(root, "candidate", syntheticBytes("pointer-lkg"), COMMIT_B);
  assert.deepEqual(
    await readFile(path.join(root, ...fallbackRelative.split("/"))),
    productionFallback,
  );
});

test("pointer separation: existing production snapshot remains byte-identical", async (t) => {
  const root = await pointerFixture(t);
  const active = path.join(root, ...productionSnapshotRelative.split("/"));
  const before = await readBytes(active);
  await stageInput(root, "candidate", syntheticBytes("pointer-active"), COMMIT_B);
  assert.deepEqual(await readBytes(active), before);
});

test("pointer separation: retaining a candidate cannot alter active runtime resolution", async (t) => {
  const root = await pointerFixture(t);
  const manifestPath = path.join(root, ...manifestRelative.split("/"));
  const before = JSON.parse(await readFile(manifestPath, "utf8"));
  const selectedBefore = before.selected_snapshot.path;

  const candidate = await stageInput(
    root,
    "candidate",
    syntheticBytes("resolution"),
    COMMIT_B,
  );
  const after = JSON.parse(await readFile(manifestPath, "utf8"));

  assert.equal(after.selected_snapshot.path, selectedBefore);
  assert.notEqual(candidate.record.destination, selectedBefore.replace(/^\//, ""));
});

test("determinism: equivalent runs produce identical bytes and records", async (t) => {
  const root = await temporaryRepository(t);
  const bytes = syntheticBytes("deterministic");
  const first = await stageInput(root, "candidate", bytes, COMMIT_A);
  const retainedBefore = await readBytes(retainedAbsolute(root, first.record));
  const firstRecord = serializeRetentionRecord(first.record);

  const second = await stageInput(root, "candidate", bytes, COMMIT_A);
  const retainedAfter = await readBytes(retainedAbsolute(root, second.record));
  const secondRecord = serializeRetentionRecord(second.record);

  assert.deepEqual(retainedAfter, retainedBefore);
  assert.equal(secondRecord, firstRecord);
  assert.equal(firstRecord.includes("timestamp"), false);
  assert.equal(firstRecord.includes(root), false);
});
