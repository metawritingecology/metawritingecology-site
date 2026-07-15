import {
  constants as fsConstants,
  lstat,
  open,
  readFile,
  realpath,
} from "node:fs/promises";
import path from "node:path";

import {
  decodeUtf8Fatal,
  MAX_RUNTIME_SNAPSHOT_BYTES,
  sha256Hex,
} from "../src/lib/public-surface-authority-map/byteIdentity.ts";
import { assertSnapshot } from "../src/lib/public-surface-authority-map/contract.ts";

const HEX40 = /^[0-9a-f]{40}$/;
const HEX64 = /^[0-9a-f]{64}$/;

export const SNAPSHOT_ROOT_RELATIVE =
  "src/data/public-surface-authority-map/runtime-snapshots";

export class SnapshotRetentionError extends Error {
  constructor(code, detail) {
    super(`Snapshot retention violation [${code}]: ${detail}`);
    this.name = "SnapshotRetentionError";
    this.code = code;
  }
}

function fail(code, detail) {
  throw new SnapshotRetentionError(code, detail);
}

function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

export function assertRepositoryRelativePath(value, label = "path") {
  if (typeof value !== "string" || value.length === 0) {
    fail("path_empty", `${label} must be a non-empty string`);
  }
  if (value.includes("\\")) {
    fail("path_backslash", `${label} must use forward slashes only`);
  }
  if (value.startsWith("/")) {
    fail("path_absolute", `${label} must not start with a slash`);
  }
  if (/^[a-zA-Z]:/.test(value)) {
    fail("path_drive", `${label} must not be drive-qualified`);
  }

  const segments = value.split("/");
  if (segments.some((segment) => segment === "..")) {
    fail("path_traversal", `${label} must not contain parent traversal`);
  }
  if (segments.some((segment) => segment === "" || segment === ".")) {
    fail("path_segment", `${label} must not contain empty or dot segments`);
  }

  return value;
}

async function resolveSafeExistingPath(repositoryRoot, relativePath, label) {
  const validated = assertRepositoryRelativePath(relativePath, label);
  const repositoryReal = await realpath(repositoryRoot);
  const segments = validated.split("/");
  let current = repositoryReal;

  for (const segment of segments) {
    current = path.join(current, segment);
    const stat = await lstat(current);
    if (stat.isSymbolicLink()) {
      fail(
        "path_symlink",
        `${label} must not traverse a symlink or reparse point: ${validated}`,
      );
    }
    const currentReal = await realpath(current);
    if (!isWithin(repositoryReal, currentReal)) {
      fail("path_escape", `${label} resolves outside the repository root`);
    }
    current = currentReal;
  }

  return { absolute: current, repositoryReal };
}

function requireLowerHex(value, pattern, code, label) {
  if (typeof value !== "string" || !pattern.test(value)) {
    fail(code, `${label} must be lowercase hexadecimal in the required length`);
  }
  return value;
}

async function readValidatedSnapshot(repositoryRoot, snapshotPath, expectedSha256) {
  const resolved = await resolveSafeExistingPath(
    repositoryRoot,
    snapshotPath,
    "snapshot path",
  );
  const stat = await lstat(resolved.absolute);
  if (!stat.isFile()) {
    fail("snapshot_file", "snapshot path must identify a regular file");
  }

  const bytes = new Uint8Array(await readFile(resolved.absolute));
  if (bytes.length === 0 || bytes.length > MAX_RUNTIME_SNAPSHOT_BYTES) {
    fail(
      "snapshot_byte_length",
      `snapshot must contain 1-${MAX_RUNTIME_SNAPSHOT_BYTES} exact bytes; received ${bytes.length}`,
    );
  }

  const computedSha256 = await sha256Hex(bytes);
  if (computedSha256 !== expectedSha256) {
    fail(
      "snapshot_sha256_mismatch",
      `declared SHA-256 ${expectedSha256} does not match exact-byte SHA-256 ${computedSha256}`,
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(decodeUtf8Fatal(bytes));
  } catch (error) {
    fail("snapshot_json", `snapshot is not valid UTF-8 JSON: ${error.message}`);
  }

  try {
    assertSnapshot(parsed);
  } catch (error) {
    fail("snapshot_contract", error.message);
  }

  return { bytes, computedSha256 };
}

async function existingDestinationBytes(destination) {
  try {
    const stat = await lstat(destination);
    if (stat.isSymbolicLink()) {
      fail("destination_symlink", "destination must not be a symlink or reparse point");
    }
    if (!stat.isFile()) {
      fail("destination_type", "destination exists but is not a regular file");
    }
    return new Uint8Array(await readFile(destination));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function bytesEqual(left, right) {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

async function assertDestinationCompatible(destination, bytes) {
  const existing = await existingDestinationBytes(destination);
  if (existing === null) return false;
  if (!bytesEqual(existing, bytes)) {
    fail(
      "destination_conflict",
      "retained snapshot identity already exists with different exact bytes",
    );
  }
  return true;
}

async function createExclusive(destination, bytes) {
  let handle;
  try {
    handle = await open(
      destination,
      fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_WRONLY,
      0o444,
    );
    await handle.writeFile(bytes);
    await handle.sync();
  } catch (error) {
    if (error?.code === "EEXIST") return false;
    throw error;
  } finally {
    await handle?.close();
  }
  return true;
}

export function serializeRetentionRecord(record) {
  return `${JSON.stringify(record)}\n`;
}

/**
 * Validate and append one immutable snapshot beneath the designated root.
 * The return record is mechanical identity evidence only. It carries no
 * active, last-known-good, production, Registry, ontology, or authority state.
 */
export async function retainPublicSurfaceSnapshot({
  repositoryRoot,
  snapshotPath,
  sourceCommit,
  snapshotSha256,
}) {
  const snapshotRootRelative = SNAPSHOT_ROOT_RELATIVE;
  requireLowerHex(sourceCommit, HEX40, "source_commit", "source commit");
  requireLowerHex(snapshotSha256, HEX64, "snapshot_sha256", "snapshot SHA-256");
  assertRepositoryRelativePath(snapshotRootRelative, "snapshot root");

  const root = await resolveSafeExistingPath(
    repositoryRoot,
    snapshotRootRelative,
    "snapshot root",
  );
  const rootStat = await lstat(root.absolute);
  if (!rootStat.isDirectory()) {
    fail("snapshot_root", "designated snapshot root must be an existing directory");
  }

  const { bytes, computedSha256 } = await readValidatedSnapshot(
    repositoryRoot,
    snapshotPath,
    snapshotSha256,
  );
  const id = `${sourceCommit}-${computedSha256}`;
  const filename = `${id}.json`;
  const destination = path.join(root.absolute, filename);
  if (!isWithin(root.absolute, destination)) {
    fail("destination_escape", "destination resolves outside the snapshot root");
  }

  if (!(await assertDestinationCompatible(destination, bytes))) {
    const created = await createExclusive(destination, bytes);
    if (!created) {
      await assertDestinationCompatible(destination, bytes);
    }
  }

  return {
    byte_length: bytes.length,
    destination: `${snapshotRootRelative}/${filename}`,
    sha256: computedSha256,
    source_commit: sourceCommit,
  };
}
