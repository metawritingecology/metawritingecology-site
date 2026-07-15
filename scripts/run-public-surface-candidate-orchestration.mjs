#!/usr/bin/env node

import {
  orchestratePublicSurfaceCandidate,
  serializeCandidateGenerationRecord,
} from "./public-surface-candidate-orchestration.mjs";

function usage() {
  return [
    "Usage:",
    "  node scripts/run-public-surface-candidate-orchestration.mjs \\",
    "    --source-repository <path> \\",
    "    --SOURCE_COMMIT_APPROVED_FOR_GENERATION <40-lowercase-hex> \\",
    "    --generator-identity <40-lowercase-hex> \\",
    "    --website-repository <path> \\",
    "    --python-executable <path>",
  ].join("\n");
}

function parseArgs(argv) {
  const allowed = new Set([
    "--source-repository",
    "--SOURCE_COMMIT_APPROVED_FOR_GENERATION",
    "--generator-identity",
    "--website-repository",
    "--python-executable",
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
  return parsed;
}

try {
  const args = parseArgs(process.argv.slice(2));
  const record = await orchestratePublicSurfaceCandidate({
    sourceRepository: args.get("--source-repository"),
    SOURCE_COMMIT_APPROVED_FOR_GENERATION: args.get(
      "--SOURCE_COMMIT_APPROVED_FOR_GENERATION",
    ),
    generatorIdentity: args.get("--generator-identity"),
    websiteRepository: args.get("--website-repository"),
    pythonExecutable: args.get("--python-executable"),
  });
  process.stdout.write(serializeCandidateGenerationRecord(record));
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
