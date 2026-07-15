#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  retainPublicSurfaceSnapshot,
  serializeRetentionRecord,
} from "./public-surface-snapshot-retention.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function usage() {
  return [
    "Usage:",
    "  node scripts/retain-public-surface-snapshot.mjs \\",
    "    --source-commit <40-lowercase-hex> \\",
    "    --snapshot-sha256 <64-lowercase-hex> \\",
    "    --snapshot-path <repository-relative-forward-slash-path>",
  ].join("\n");
}

function parseArgs(argv) {
  const allowed = new Set([
    "--source-commit",
    "--snapshot-sha256",
    "--snapshot-path",
  ]);
  const parsed = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!allowed.has(key) || value === undefined || parsed.has(key)) {
      throw new Error(usage());
    }
    parsed.set(key, value);
  }
  if (parsed.size !== allowed.size) throw new Error(usage());
  return parsed;
}

try {
  const args = parseArgs(process.argv.slice(2));
  const record = await retainPublicSurfaceSnapshot({
    repositoryRoot,
    sourceCommit: args.get("--source-commit"),
    snapshotSha256: args.get("--snapshot-sha256"),
    snapshotPath: args.get("--snapshot-path"),
  });
  process.stdout.write(serializeRetentionRecord(record));
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
