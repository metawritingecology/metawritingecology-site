import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  readlink,
  realpath,
  rm,
} from "node:fs/promises";
import path from "node:path";

import {
  decodeUtf8Fatal,
  MAX_RUNTIME_SNAPSHOT_BYTES,
  sha256Hex,
} from "../src/lib/public-surface-authority-map/byteIdentity.ts";
import { assertSnapshot } from "../src/lib/public-surface-authority-map/contract.ts";
import {
  retainPublicSurfaceSnapshot,
  SNAPSHOT_ROOT_RELATIVE,
} from "./public-surface-snapshot-retention.mjs";

const HEX40 = /^[0-9a-f]{40}$/;
const SOURCE_REPOSITORY_IDENTIFIER = "metawritingecology/meta-writing-ecology";
const SOURCE_ORIGIN_URLS = new Set([
  "https://github.com/metawritingecology/meta-writing-ecology.git",
  "https://github.com/metawritingecology/meta-writing-ecology",
  "git@github.com:metawritingecology/meta-writing-ecology.git",
]);
const RESULT_SCHEMA_VERSION = "public-surface-candidate-generation-record/1.0";
const TEMPORARY_PREFIX = ".public-surface-candidate-orchestration-";
const PROTECTED_RELATIVE_PATHS = [
  "src/data/public-surface-authority-map/runtime-manifest.json",
  "src/data/public-surface-authority-map/last-known-good.json",
];
const REQUIRED_GENERATOR_PATHS = [
  "scripts/build_public_surface_authority_map.py",
  "scripts/validate_public_metadata.py",
  "mwe-public-surface-dependency-inventory.schema.json",
];

export class CandidateOrchestrationError extends Error {
  constructor(code, detail) {
    super(`Candidate orchestration violation [${code}]: ${detail}`);
    this.name = "CandidateOrchestrationError";
    this.code = code;
  }
}

function fail(code, detail) {
  throw new CandidateOrchestrationError(code, detail);
}

function requireExactCommit(value, code, label) {
  if (typeof value !== "string" || !HEX40.test(value)) {
    fail(code, `${label} must be exactly 40 lowercase hexadecimal characters`);
  }
  return value;
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

async function existingDirectory(value, code, label) {
  if (typeof value !== "string" || value.length === 0) {
    fail(code, `${label} must be an explicit non-empty path`);
  }
  let resolved;
  try {
    resolved = await realpath(path.resolve(value));
    if (!(await lstat(resolved)).isDirectory()) throw new Error("not a directory");
  } catch (error) {
    fail(code, `${label} is unavailable: ${error.message}`);
  }
  return resolved;
}

function normalizedEnvironment() {
  return {
    ...process.env,
    GIT_OPTIONAL_LOCKS: "0",
    PYTHONNOUSERSITE: "1",
    PYTHONPATH: "",
    PYTHONSAFEPATH: "1",
  };
}

async function runChild(executable, args, { cwd, code, label, maxBytes = 1_048_576 }) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd,
      env: normalizedEnvironment(),
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    let byteLength = 0;
    let settled = false;

    const rejectOnce = (detail) => {
      if (settled) return;
      settled = true;
      child.kill();
      reject(new CandidateOrchestrationError(code, detail));
    };
    const capture = (target) => (chunk) => {
      byteLength += chunk.length;
      if (byteLength > maxBytes) {
        rejectOnce(`${label} emitted more than ${maxBytes} captured bytes`);
        return;
      }
      target.push(chunk);
    };

    child.stdout.on("data", capture(stdout));
    child.stderr.on("data", capture(stderr));
    child.on("error", (error) => rejectOnce(`${label} could not start: ${error.message}`));
    child.on("close", (status, signal) => {
      if (settled) return;
      settled = true;
      const out = Buffer.concat(stdout).toString("utf8");
      const err = Buffer.concat(stderr).toString("utf8");
      if (status !== 0) {
        const suffix = signal ? ` (signal ${signal})` : "";
        reject(
          new CandidateOrchestrationError(
            code,
            `${label} failed with exit ${status}${suffix}${err ? `: ${err.trim()}` : ""}`,
          ),
        );
        return;
      }
      resolve({ stdout: out, stderr: err });
    });
  });
}

async function git(sourceRepository, args, options) {
  return runChild(options.gitExecutable, ["-C", sourceRepository, ...args], options);
}

async function verifyGitRepository(sourceRepository, options) {
  const result = await git(sourceRepository, ["rev-parse", "--show-toplevel"], {
    ...options,
    code: "source_repository_not_git",
    label: "source repository verification",
  });
  let top;
  try {
    top = await realpath(result.stdout.trim());
  } catch {
    fail("source_repository_not_git", "Git returned an unreadable repository root");
  }
  if (top !== sourceRepository) {
    fail("source_repository_mismatch", "source repository path must be its Git top level");
  }
  const origin = await git(sourceRepository, ["config", "--get", "remote.origin.url"], {
    ...options,
    code: "source_repository_mismatch",
    label: "source repository origin verification",
  });
  if (!SOURCE_ORIGIN_URLS.has(origin.stdout.trim())) {
    fail(
      "source_repository_mismatch",
      `source repository origin must identify ${SOURCE_REPOSITORY_IDENTIFIER}`,
    );
  }
}

async function verifyCommit(sourceRepository, approvedCommit, options) {
  await git(sourceRepository, ["cat-file", "-e", `${approvedCommit}^{commit}`], {
    ...options,
    code: "approved_source_commit_not_found",
    label: "approved source commit lookup",
  });
  const resolved = await git(
    sourceRepository,
    ["rev-parse", "--verify", `${approvedCommit}^{commit}`],
    {
      ...options,
      code: "approved_source_commit_not_found",
      label: "approved source commit resolution",
    },
  );
  if (resolved.stdout.trim() !== approvedCommit) {
    fail("source_commit_mismatch", "Git did not resolve the exact approved commit identity");
  }
}

async function archiveCommit(sourceRepository, commit, archivePath, destination, options) {
  await git(
    sourceRepository,
    ["archive", "--format=tar", `--output=${archivePath}`, commit],
    { ...options, code: "source_archive_failure", label: "exact-commit archive" },
  );
  await runChild(options.tarExecutable, ["-xf", archivePath, "-C", destination], {
    ...options,
    code: "source_archive_failure",
    label: "exact-commit archive extraction",
  });
}

async function hashFile(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

async function captureTree(root) {
  const entries = [];
  async function walk(current, relative) {
    const names = await readdir(current);
    names.sort();
    for (const name of names) {
      const absolute = path.join(current, name);
      const childRelative = relative ? `${relative}/${name}` : name;
      const stat = await lstat(absolute);
      if (stat.isSymbolicLink()) {
        entries.push(`${childRelative}\0symlink\0${await readlink(absolute)}`);
      } else if (stat.isDirectory()) {
        entries.push(`${childRelative}\0directory`);
        await walk(absolute, childRelative);
      } else if (stat.isFile()) {
        entries.push(`${childRelative}\0file\0${stat.size}\0${await hashFile(absolute)}`);
      } else {
        entries.push(`${childRelative}\0other`);
      }
    }
  }
  await walk(root, "");
  return createHash("sha256").update(entries.join("\n")).digest("hex");
}

async function captureProtectedWebsiteState(websiteRepository) {
  const files = new Map();
  for (const relative of PROTECTED_RELATIVE_PATHS) {
    const absolute = path.join(websiteRepository, ...relative.split("/"));
    files.set(relative, `${(await lstat(absolute)).size}:${await hashFile(absolute)}`);
  }

  const snapshots = new Map();
  const root = path.join(websiteRepository, ...SNAPSHOT_ROOT_RELATIVE.split("/"));
  for (const name of (await readdir(root)).sort()) {
    const absolute = path.join(root, name);
    const stat = await lstat(absolute);
    snapshots.set(name, stat.isFile() ? `${stat.size}:${await hashFile(absolute)}` : "non-file");
  }
  return { files, snapshots };
}

function assertMapUnchanged(before, after, code, label, allowedAddition) {
  for (const [name, identity] of before) {
    if (after.get(name) !== identity) fail(code, `${label} changed: ${name}`);
  }
  for (const name of after.keys()) {
    if (!before.has(name) && name !== allowedAddition) {
      fail(code, `${label} gained an unexpected entry: ${name}`);
    }
  }
}

async function assertRequiredGenerator(generatorRoot) {
  for (const relative of REQUIRED_GENERATOR_PATHS) {
    const absolute = path.join(generatorRoot, ...relative.split("/"));
    try {
      if (!(await lstat(absolute)).isFile()) throw new Error("not a file");
    } catch {
      fail("source_generator_unavailable", `required generator file is unavailable: ${relative}`);
    }
  }
}

async function assertExactGeneratedOutputs(outputRoot, candidateName, inventoryName) {
  const names = (await readdir(outputRoot)).sort();
  const expected = [candidateName, inventoryName].sort();
  if (JSON.stringify(names) !== JSON.stringify(expected)) {
    fail(
      names.length < expected.length ? "missing_generated_output" : "ambiguous_generated_output",
      `generator output directory must contain exactly ${expected.join(" and ")}`,
    );
  }
  for (const name of names) {
    if (!(await lstat(path.join(outputRoot, name))).isFile()) {
      fail("ambiguous_generated_output", `generated output is not a regular file: ${name}`);
    }
  }
}

function serializeRecord(record) {
  return `${JSON.stringify(record)}\n`;
}

/**
 * Generate, validate, and append one review candidate. The returned record is
 * deterministic mechanical evidence only and carries no adoption or authority state.
 */
export async function orchestratePublicSurfaceCandidate({
  sourceRepository,
  SOURCE_COMMIT_APPROVED_FOR_GENERATION,
  generatorIdentity,
  websiteRepository,
  pythonExecutable,
  gitExecutable = "git",
  tarExecutable = "tar",
}) {
  if (SOURCE_COMMIT_APPROVED_FOR_GENERATION === undefined) {
    fail(
      "missing_approved_source_commit",
      "SOURCE_COMMIT_APPROVED_FOR_GENERATION is required",
    );
  }
  const approvedCommit = requireExactCommit(
    SOURCE_COMMIT_APPROVED_FOR_GENERATION,
    "malformed_approved_source_commit",
    "SOURCE_COMMIT_APPROVED_FOR_GENERATION",
  );
  const generatorCommit = requireExactCommit(
    generatorIdentity,
    "malformed_generator_identity",
    "generator identity",
  );
  if (generatorCommit !== approvedCommit) {
    fail(
      "source_generator_identity_mismatch",
      "generator identity must match the exact commit archived and executed",
    );
  }
  if (typeof pythonExecutable !== "string" || pythonExecutable.length === 0) {
    fail("source_generator_unavailable", "an explicit Python executable is required");
  }

  const sourceRoot = await existingDirectory(
    sourceRepository,
    "source_repository_unavailable",
    "source repository",
  );
  const websiteRoot = await existingDirectory(
    websiteRepository,
    "website_repository_unavailable",
    "website repository",
  );
  if (isWithin(sourceRoot, websiteRoot) || isWithin(websiteRoot, sourceRoot)) {
    fail("repository_boundary_overlap", "source and website repositories must be disjoint");
  }

  const childOptions = { gitExecutable, tarExecutable };
  await verifyGitRepository(sourceRoot, childOptions);
  await verifyCommit(sourceRoot, approvedCommit, childOptions);

  const sourceStateBefore = await captureTree(sourceRoot);
  const websiteStateBefore = await captureProtectedWebsiteState(websiteRoot);
  let temporaryRoot;
  try {
    temporaryRoot = await mkdtemp(path.join(websiteRoot, TEMPORARY_PREFIX));
    const materializedSource = path.join(temporaryRoot, "source");
    const materializedGenerator = path.join(temporaryRoot, "generator");
    const generatedRoot = path.join(temporaryRoot, "generated");
    const workingRoot = path.join(temporaryRoot, "working");
    await Promise.all([
      mkdir(materializedSource),
      mkdir(materializedGenerator),
      mkdir(generatedRoot),
      mkdir(workingRoot),
    ]);

    await archiveCommit(
      sourceRoot,
      approvedCommit,
      path.join(temporaryRoot, "source.tar"),
      materializedSource,
      childOptions,
    );
    await archiveCommit(
      sourceRoot,
      generatorCommit,
      path.join(temporaryRoot, "generator.tar"),
      materializedGenerator,
      childOptions,
    );
    await assertRequiredGenerator(materializedGenerator);

    const validator = path.join(
      materializedGenerator,
      "scripts",
      "validate_public_metadata.py",
    );
    const builder = path.join(
      materializedGenerator,
      "scripts",
      "build_public_surface_authority_map.py",
    );
    const candidateName = "candidate.json";
    const inventoryName = "dependency-inventory.json";
    const candidatePath = path.join(generatedRoot, candidateName);
    const inventoryPath = path.join(generatedRoot, inventoryName);

    await runChild(
      pythonExecutable,
      [validator, "--source-root", materializedSource, "--mode", "preflight"],
      { cwd: workingRoot, code: "source_preflight_failure", label: "source preflight" },
    );
    await runChild(
      pythonExecutable,
      [
        builder,
        "--source-root",
        materializedSource,
        "--output",
        candidatePath,
        "--inventory-output",
        inventoryPath,
      ],
      { cwd: workingRoot, code: "source_generation_failure", label: "source generation" },
    );
    await assertExactGeneratedOutputs(generatedRoot, candidateName, inventoryName);
    const generatedCandidateIdentity = await hashFile(candidatePath);
    const generatedInventoryIdentity = await hashFile(inventoryPath);
    await runChild(
      pythonExecutable,
      [
        validator,
        "--source-root",
        materializedSource,
        "--mode",
        "verify-inventory",
        "--inventory",
        inventoryPath,
      ],
      {
        cwd: workingRoot,
        code: "source_inventory_validation_failure",
        label: "source inventory verification",
      },
    );
    await assertExactGeneratedOutputs(generatedRoot, candidateName, inventoryName);
    if ((await hashFile(candidatePath)) !== generatedCandidateIdentity) {
      fail(
        "candidate_sha_mismatch",
        "candidate bytes changed after the source generator completed",
      );
    }
    if ((await hashFile(inventoryPath)) !== generatedInventoryIdentity) {
      fail(
        "source_inventory_validation_failure",
        "dependency-inventory bytes changed during verification",
      );
    }

    const candidateBytes = new Uint8Array(await readFile(candidatePath));
    if (
      candidateBytes.length === 0 ||
      candidateBytes.length > MAX_RUNTIME_SNAPSHOT_BYTES
    ) {
      fail("candidate_byte_length", "candidate byte length is outside the map contract limit");
    }
    let candidateText;
    try {
      candidateText = decodeUtf8Fatal(candidateBytes);
    } catch (error) {
      fail("invalid_candidate_utf8", error.message);
    }
    let candidate;
    try {
      candidate = JSON.parse(candidateText);
    } catch (error) {
      fail("invalid_candidate_json", error.message);
    }
    try {
      assertSnapshot(candidate);
    } catch (error) {
      fail("invalid_public_surface_map_contract", error.message);
    }
    const candidateSha256 = await sha256Hex(candidateBytes);

    if ((await captureTree(sourceRoot)) !== sourceStateBefore) {
      fail("attempted_source_repository_write", "source repository bytes or refs changed");
    }
    const websiteStatePreRetention = await captureProtectedWebsiteState(websiteRoot);
    assertMapUnchanged(
      websiteStateBefore.files,
      websiteStatePreRetention.files,
      "attempted_pointer_mutation",
      "protected pointer",
    );
    assertMapUnchanged(
      websiteStateBefore.snapshots,
      websiteStatePreRetention.snapshots,
      "existing_snapshot_identity_conflict",
      "existing snapshot",
    );

    const candidateRelative = path
      .relative(websiteRoot, candidatePath)
      .split(path.sep)
      .join("/");
    const destinationName = `${approvedCommit}-${candidateSha256}.json`;
    const existedBefore = websiteStateBefore.snapshots.has(destinationName);
    let retentionRecord;
    try {
      retentionRecord = await retainPublicSurfaceSnapshot({
        repositoryRoot: websiteRoot,
        snapshotPath: candidateRelative,
        sourceCommit: approvedCommit,
        snapshotSha256: candidateSha256,
      });
    } catch (error) {
      const mapping = {
        snapshot_sha256_mismatch: "candidate_sha_mismatch",
        destination_conflict: "existing_snapshot_identity_conflict",
        destination_escape: "unsafe_destination_path",
        path_escape: "unsafe_destination_path",
        path_symlink: "unsafe_destination_path",
      };
      fail(mapping[error?.code] ?? "retention_failure", error.message);
    }

    const websiteStateAfter = await captureProtectedWebsiteState(websiteRoot);
    assertMapUnchanged(
      websiteStateBefore.files,
      websiteStateAfter.files,
      "attempted_pointer_mutation",
      "protected pointer",
    );
    assertMapUnchanged(
      websiteStateBefore.snapshots,
      websiteStateAfter.snapshots,
      "existing_snapshot_identity_conflict",
      "existing snapshot",
      destinationName,
    );
    if ((await captureTree(sourceRoot)) !== sourceStateBefore) {
      fail("attempted_source_repository_write", "source repository bytes or refs changed");
    }

    return {
      candidate_generation_record_schema_version: RESULT_SCHEMA_VERSION,
      source_repository: SOURCE_REPOSITORY_IDENTIFIER,
      SOURCE_COMMIT_APPROVED_FOR_GENERATION: approvedCommit,
      generator_identity: generatorCommit,
      candidate_sha256: candidateSha256,
      retained_snapshot_path: retentionRecord.destination,
      retention_result: existedBefore ? "identical-existing" : "created",
      validation_result: "passed",
    };
  } finally {
    if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true });
  }
}

export function serializeCandidateGenerationRecord(record) {
  return serializeRecord(record);
}
