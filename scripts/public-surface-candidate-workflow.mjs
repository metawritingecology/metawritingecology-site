#!/usr/bin/env node

import { spawn } from "node:child_process";
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { decodeUtf8Fatal, sha256Hex } from "../src/lib/public-surface-authority-map/byteIdentity.ts";
import { assertSnapshot } from "../src/lib/public-surface-authority-map/contract.ts";
import {
  retainPublicSurfaceSnapshot,
  SNAPSHOT_ROOT_RELATIVE,
} from "./public-surface-snapshot-retention.mjs";

export const SOURCE_REPOSITORY = "metawritingecology/meta-writing-ecology";
export const WEBSITE_REPOSITORY = "metawritingecology/metawritingecology-site";
export const RECORD_SCHEMA = "public-surface-candidate-generation-record/1.0";
export const ARTIFACT_IDENTITY_SCHEMA = "public-surface-candidate-artifact-identity/1.0";
export const ARTIFACT_FILES = ["candidate.json", "candidate-generation-record.json", "candidate-identity.json"];
export const FAILURE_CODES = Object.freeze([
  "WORKFLOW_REF_NOT_MAIN",
  "APPROVED_SOURCE_COMMIT_MISSING",
  "APPROVED_SOURCE_COMMIT_MALFORMED",
  "APPROVED_SOURCE_COMMIT_NOT_FOUND",
  "SOURCE_CHECKOUT_IDENTITY_MISMATCH",
  "WEBSITE_CHECKOUT_IDENTITY_MISMATCH",
  "GENERATOR_IDENTITY_MISMATCH",
  "ORCHESTRATION_FAILURE",
  "CANDIDATE_OUTPUT_MISSING",
  "CANDIDATE_OUTPUT_AMBIGUOUS",
  "CANDIDATE_ARTIFACT_UNSAFE",
  "CANDIDATE_UTF8_INVALID",
  "CANDIDATE_JSON_INVALID",
  "CANDIDATE_CONTRACT_INVALID",
  "CANDIDATE_SHA_MISMATCH",
  "RETENTION_IDENTITY_CONFLICT",
  "PROTECTED_PATH_MUTATION",
  "WEBSITE_MAIN_DRIFT",
  "CANDIDATE_BRANCH_IDENTITY_CONFLICT",
  "CANDIDATE_PR_STATE_CONFLICT",
  "CANDIDATE_PR_CLOSED_UNMERGED",
  "GITHUB_PR_PERMISSION_UNAVAILABLE",
]);
const HEX40 = /^[0-9a-f]{40}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const PROTECTED = new Set([
  "src/data/public-surface-authority-map/runtime-manifest.json",
  "src/data/public-surface-authority-map/last-known-good.json",
]);

export class CandidateWorkflowError extends Error {
  constructor(code, detail) {
    super(`${code}: ${detail}`);
    this.name = "CandidateWorkflowError";
    this.code = code;
  }
}

function fail(code, detail) {
  throw new CandidateWorkflowError(code, detail);
}

export function validateDispatch({ repository, ref, sourceCommit }) {
  if (repository !== WEBSITE_REPOSITORY) fail("WORKFLOW_REPOSITORY_MISMATCH", "unexpected repository");
  if (ref !== "refs/heads/main") fail("WORKFLOW_REF_NOT_MAIN", "workflow must run from refs/heads/main");
  if (sourceCommit === undefined || sourceCommit === "") {
    fail("APPROVED_SOURCE_COMMIT_MISSING", "SOURCE_COMMIT_APPROVED_FOR_GENERATION is required");
  }
  if (!HEX40.test(sourceCommit)) {
    fail("APPROVED_SOURCE_COMMIT_MALFORMED", "source commit must be 40 lowercase hexadecimal characters");
  }
  return sourceCommit;
}

function stableJson(value) {
  return `${JSON.stringify(value)}\n`;
}

function parseExactJson(bytes, code) {
  let text;
  try {
    text = decodeUtf8Fatal(bytes);
  } catch (error) {
    fail("CANDIDATE_UTF8_INVALID", error.message);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(code, error.message);
  }
}

function assertPlainRecord(value, expectedKeys, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code, "record must be an object");
  if (JSON.stringify(Object.keys(value)) !== JSON.stringify(expectedKeys)) fail(code, "record fields or order are invalid");
}

export function validateGenerationRecord(record, sourceCommit) {
  const keys = [
    "candidate_generation_record_schema_version",
    "source_repository",
    "SOURCE_COMMIT_APPROVED_FOR_GENERATION",
    "generator_identity",
    "candidate_sha256",
    "retained_snapshot_path",
    "retention_result",
    "validation_result",
  ];
  assertPlainRecord(record, keys, "CANDIDATE_ARTIFACT_UNSAFE");
  if (record.candidate_generation_record_schema_version !== RECORD_SCHEMA || record.source_repository !== SOURCE_REPOSITORY) {
    fail("CANDIDATE_ARTIFACT_UNSAFE", "generation record identity is invalid");
  }
  if (record.SOURCE_COMMIT_APPROVED_FOR_GENERATION !== sourceCommit) fail("SOURCE_CHECKOUT_IDENTITY_MISMATCH", "artifact source identity differs");
  if (record.generator_identity !== sourceCommit) fail("GENERATOR_IDENTITY_MISMATCH", "generator identity differs");
  if (!HEX64.test(record.candidate_sha256)) fail("CANDIDATE_SHA_MISMATCH", "candidate SHA-256 is malformed");
  const expectedPath = `${SNAPSHOT_ROOT_RELATIVE}/${sourceCommit}-${record.candidate_sha256}.json`;
  if (record.retained_snapshot_path !== expectedPath) fail("RETENTION_IDENTITY_CONFLICT", "retained path is not identity-derived");
  if (!["created", "identical-existing"].includes(record.retention_result) || record.validation_result !== "passed") {
    fail("CANDIDATE_ARTIFACT_UNSAFE", "generation result is not a passed mechanical result");
  }
  return record;
}

async function regularFile(file, code) {
  const stat = await lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(code, `${path.basename(file)} is not a regular file`);
  if (process.platform !== "win32" && (stat.mode & 0o111) !== 0) fail(code, `${path.basename(file)} must not be executable`);
  return stat;
}

export async function packageArtifact({ recordPath, websiteRepository, artifactDirectory, sourceCommit }) {
  await mkdir(artifactDirectory, { recursive: false });
  const recordBytes = new Uint8Array(await readFile(recordPath));
  const record = validateGenerationRecord(parseExactJson(recordBytes, "CANDIDATE_ARTIFACT_UNSAFE"), sourceCommit);
  const candidatePath = path.join(websiteRepository, ...record.retained_snapshot_path.split("/"));
  await regularFile(candidatePath, "CANDIDATE_OUTPUT_MISSING");
  const candidateBytes = new Uint8Array(await readFile(candidatePath));
  const candidateSha256 = await sha256Hex(candidateBytes);
  if (candidateSha256 !== record.candidate_sha256) fail("CANDIDATE_SHA_MISMATCH", "generated candidate bytes differ");
  const candidate = parseExactJson(candidateBytes, "CANDIDATE_JSON_INVALID");
  try { assertSnapshot(candidate); } catch (error) { fail("CANDIDATE_CONTRACT_INVALID", error.message); }
  await copyFile(candidatePath, path.join(artifactDirectory, "candidate.json"));
  await writeFile(path.join(artifactDirectory, "candidate-generation-record.json"), stableJson(record), { flag: "wx" });
  await writeFile(path.join(artifactDirectory, "candidate-identity.json"), stableJson({
    artifact_identity_schema_version: ARTIFACT_IDENTITY_SCHEMA,
    candidate_sha256: candidateSha256,
    source_commit: sourceCommit,
    generator_identity: sourceCommit,
  }), { flag: "wx" });
}

async function assertSafeArtifactTree(root) {
  const names = (await readdir(root)).sort();
  const expected = [...ARTIFACT_FILES].sort();
  if (JSON.stringify(names) !== JSON.stringify(expected)) fail("CANDIDATE_ARTIFACT_UNSAFE", "artifact file set is not exact");
  for (const name of names) {
    if (name.includes("\\") || name.includes("/") || path.isAbsolute(name) || name === "." || name === "..") {
      fail("CANDIDATE_ARTIFACT_UNSAFE", "unsafe artifact path");
    }
    await regularFile(path.join(root, name), "CANDIDATE_ARTIFACT_UNSAFE");
  }
}

export async function validateArtifact({ artifactDirectory, sourceCommit }) {
  await assertSafeArtifactTree(artifactDirectory);
  const candidateBytes = new Uint8Array(await readFile(path.join(artifactDirectory, "candidate.json")));
  const record = validateGenerationRecord(
    parseExactJson(new Uint8Array(await readFile(path.join(artifactDirectory, "candidate-generation-record.json"))), "CANDIDATE_ARTIFACT_UNSAFE"),
    sourceCommit,
  );
  const identity = parseExactJson(new Uint8Array(await readFile(path.join(artifactDirectory, "candidate-identity.json"))), "CANDIDATE_ARTIFACT_UNSAFE");
  assertPlainRecord(identity, ["artifact_identity_schema_version", "candidate_sha256", "source_commit", "generator_identity"], "CANDIDATE_ARTIFACT_UNSAFE");
  if (identity.artifact_identity_schema_version !== ARTIFACT_IDENTITY_SCHEMA || identity.source_commit !== sourceCommit) {
    fail("SOURCE_CHECKOUT_IDENTITY_MISMATCH", "artifact identity source differs");
  }
  if (identity.generator_identity !== sourceCommit) fail("GENERATOR_IDENTITY_MISMATCH", "artifact generator differs");
  const actualSha = await sha256Hex(candidateBytes);
  if (identity.candidate_sha256 !== actualSha || record.candidate_sha256 !== actualSha) fail("CANDIDATE_SHA_MISMATCH", "artifact candidate SHA differs");
  const candidate = parseExactJson(candidateBytes, "CANDIDATE_JSON_INVALID");
  try { assertSnapshot(candidate); } catch (error) { fail("CANDIDATE_CONTRACT_INVALID", error.message); }
  return { candidateBytes, record, identity };
}

export function candidateBranch(sourceCommit, candidateSha256) {
  if (!HEX40.test(sourceCommit) || !HEX64.test(candidateSha256)) fail("CANDIDATE_BRANCH_IDENTITY_CONFLICT", "branch identities are malformed");
  return `candidate/public-surface/${sourceCommit}/${candidateSha256}`;
}

export function candidateCommitMessage(sourceCommit, candidateSha256) {
  return `Retain public-surface candidate ${sourceCommit}-${candidateSha256}`;
}

export function candidatePullRequestRecord({ sourceCommit, candidateSha256, generatorIdentity, websiteBaseCommit, retainedPath, retentionResult }) {
  const title = `Public-surface candidate ${sourceCommit}-${candidateSha256}`;
  const body = [
    "# CANDIDATE ONLY — NOT ADOPTED",
    "",
    "This Draft PR does not move runtime-manifest.json or last-known-good.json and does not authorize production adoption, publication, Registry confirmation, ontology confirmation, or authority promotion.",
    "",
    `- Source repository: ${SOURCE_REPOSITORY}`,
    `- SOURCE_COMMIT_APPROVED_FOR_GENERATION: ${sourceCommit}`,
    `- Generator identity: ${generatorIdentity}`,
    `- Website workflow-base commit: ${websiteBaseCommit}`,
    `- Candidate SHA-256: ${candidateSha256}`,
    `- Retained repository-relative path: ${retainedPath}`,
    `- Retention result: ${retentionResult}`,
    "- Validation result: passed",
    "- Boundary: candidate snapshot only",
    "",
  ].join("\n");
  return { title, body };
}

export function classifyPullRequests(pulls, expected) {
  if (!Array.isArray(pulls)) fail("CANDIDATE_PR_STATE_CONFLICT", "pull request state must be an array");
  if (pulls.length === 0) return "create";
  if (pulls.length !== 1) fail("CANDIDATE_PR_STATE_CONFLICT", "multiple pull requests use the candidate branch");
  const pull = pulls[0];
  if (pull.state === "closed" && !pull.merged_at) fail("CANDIDATE_PR_CLOSED_UNMERGED", "closed unmerged candidate PR exists");
  const identical = pull.state === "open" && pull.draft === true && pull.base?.ref === "main" &&
    pull.head?.ref === expected.branch && pull.title === expected.title && pull.body === expected.body;
  if (identical) return "identical-open-draft";
  fail("CANDIDATE_PR_STATE_CONFLICT", "existing candidate PR differs from the mechanical record");
}

function run(executable, args, { cwd, env = process.env, code }) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd, env, shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    const stdout = []; const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", (error) => reject(new CandidateWorkflowError(code, error.message)));
    child.on("close", (status) => {
      const out = Buffer.concat(stdout).toString("utf8"); const err = Buffer.concat(stderr).toString("utf8");
      if (status !== 0) reject(new CandidateWorkflowError(code, `${executable} exited ${status}: ${err.trim()}`));
      else resolve(out.trim());
    });
  });
}

async function git(cwd, args, code) { return run("git", args, { cwd, code }); }
async function gh(cwd, args, code) { return run("gh", args, { cwd, code, env: process.env }); }

async function assertOnlyCandidateMutation(repository, retainedPath) {
  const status = await git(repository, ["status", "--porcelain=v1", "--untracked-files=all"], "PROTECTED_PATH_MUTATION");
  const lines = status ? status.split("\n") : [];
  if (lines.length !== 1 || lines[0] !== `?? ${retainedPath}`) fail("PROTECTED_PATH_MUTATION", "candidate must be the only worktree mutation");
  if (PROTECTED.has(retainedPath)) fail("PROTECTED_PATH_MUTATION", "pointer path is protected");
}

export async function publishCandidate({ artifactDirectory, websiteRepository, sourceCommit, websiteBaseCommit }) {
  const repositoryReal = await realpath(websiteRepository);
  const head = await git(repositoryReal, ["rev-parse", "HEAD"], "WEBSITE_CHECKOUT_IDENTITY_MISMATCH");
  if (head !== websiteBaseCommit) fail("WEBSITE_CHECKOUT_IDENTITY_MISMATCH", "publishing checkout differs from workflow base");
  const { candidateBytes, record } = await validateArtifact({ artifactDirectory, sourceCommit });
  const destination = path.join(repositoryReal, ...record.retained_snapshot_path.split("/"));
  try {
    const existing = new Uint8Array(await readFile(destination));
    if (await sha256Hex(existing) === record.candidate_sha256 && Buffer.from(existing).equals(Buffer.from(candidateBytes))) {
      return { result: "IDENTICAL_CANDIDATE_ALREADY_PRESENT", branch: null };
    }
    fail("RETENTION_IDENTITY_CONFLICT", "main contains conflicting candidate identity");
  } catch (error) { if (error?.code !== "ENOENT") throw error; }

  const temporary = await mkdtemp(path.join(repositoryReal, ".candidate-workflow-"));
  try {
    const staging = path.join(temporary, "candidate.json");
    await writeFile(staging, candidateBytes, { flag: "wx" });
    const relative = path.relative(repositoryReal, staging).split(path.sep).join("/");
    await retainPublicSurfaceSnapshot({ repositoryRoot: repositoryReal, snapshotPath: relative, sourceCommit, snapshotSha256: record.candidate_sha256 });
  } finally { await rm(temporary, { recursive: true, force: true }); }
  await assertOnlyCandidateMutation(repositoryReal, record.retained_snapshot_path);

  await git(repositoryReal, ["fetch", "--no-tags", "origin", "+refs/heads/main:refs/remotes/origin/main"], "WEBSITE_MAIN_DRIFT");
  const remoteMain = await git(repositoryReal, ["rev-parse", "refs/remotes/origin/main"], "WEBSITE_MAIN_DRIFT");
  if (remoteMain !== websiteBaseCommit) fail("WEBSITE_MAIN_DRIFT", "origin/main moved after dispatch");

  const branch = candidateBranch(sourceCommit, record.candidate_sha256);
  await git(repositoryReal, ["add", "--", record.retained_snapshot_path], "PROTECTED_PATH_MUTATION");
  const expectedTree = await git(repositoryReal, ["write-tree"], "CANDIDATE_BRANCH_IDENTITY_CONFLICT");
  const remoteRef = `refs/remotes/origin/${branch}`;
  let branchExists = true;
  try { await git(repositoryReal, ["fetch", "--no-tags", "origin", `+refs/heads/${branch}:${remoteRef}`], "CANDIDATE_BRANCH_IDENTITY_CONFLICT"); }
  catch (error) { if (/couldn't find remote ref|remote ref does not exist/.test(error.message)) branchExists = false; else throw error; }
  if (branchExists) {
    const actualTree = await git(repositoryReal, ["rev-parse", `${remoteRef}^{tree}`], "CANDIDATE_BRANCH_IDENTITY_CONFLICT");
    if (actualTree !== expectedTree) fail("CANDIDATE_BRANCH_IDENTITY_CONFLICT", "existing branch tree differs");
  } else {
    await git(repositoryReal, ["-c", "user.name=github-actions[bot]", "-c", "user.email=41898282+github-actions[bot]@users.noreply.github.com", "commit", "-m", candidateCommitMessage(sourceCommit, record.candidate_sha256)], "CANDIDATE_BRANCH_IDENTITY_CONFLICT");
    await git(repositoryReal, ["push", "origin", `HEAD:refs/heads/${branch}`], "CANDIDATE_BRANCH_IDENTITY_CONFLICT");
  }

  const pr = candidatePullRequestRecord({ sourceCommit, candidateSha256: record.candidate_sha256, generatorIdentity: record.generator_identity, websiteBaseCommit, retainedPath: record.retained_snapshot_path, retentionResult: record.retention_result });
  let pulls;
  try {
    pulls = JSON.parse(await gh(repositoryReal, ["api", `repos/${WEBSITE_REPOSITORY}/pulls?state=all&head=metawritingecology:${encodeURIComponent(branch)}&base=main`], "CANDIDATE_PR_STATE_CONFLICT"));
  } catch (error) { if (error instanceof SyntaxError) fail("CANDIDATE_PR_STATE_CONFLICT", "GitHub returned malformed PR state"); throw error; }
  const disposition = classifyPullRequests(pulls, { ...pr, branch });
  if (disposition === "identical-open-draft") return { result: "IDENTICAL_DRAFT_PR_ALREADY_OPEN", branch };
  try {
    const created = JSON.parse(await gh(repositoryReal, ["api", "--method", "POST", `repos/${WEBSITE_REPOSITORY}/pulls`, "-f", `title=${pr.title}`, "-f", `head=${branch}`, "-f", "base=main", "-f", `body=${pr.body}`, "-F", "draft=true"], "GITHUB_PR_PERMISSION_UNAVAILABLE"));
    if (created.draft !== true || created.base?.ref !== "main" || created.head?.ref !== branch) fail("CANDIDATE_PR_STATE_CONFLICT", "created pull request is not the exact Draft PR");
  } catch (error) { if (error.code === "GITHUB_PR_PERMISSION_UNAVAILABLE") throw error; throw error; }
  return { result: branchExists ? "DRAFT_PR_CREATED_FOR_IDENTICAL_BRANCH" : "CANDIDATE_BRANCH_AND_DRAFT_PR_CREATED", branch };
}

function args(argv) {
  const command = argv[0]; const values = new Map();
  for (let index = 1; index < argv.length; index += 2) {
    if (!argv[index]?.startsWith("--") || argv[index + 1] === undefined || values.has(argv[index])) fail("WORKFLOW_ARGUMENT_INVALID", "arguments must be unique name/value pairs");
    values.set(argv[index], argv[index + 1]);
  }
  return { command, values };
}

async function main() {
  const { command, values } = args(process.argv.slice(2));
  if (command === "validate-dispatch") {
    validateDispatch({ repository: values.get("--repository"), ref: values.get("--ref"), sourceCommit: values.get("--source-commit") });
    return;
  }
  if (command === "package-artifact") {
    await packageArtifact({ recordPath: values.get("--record"), websiteRepository: values.get("--website-repository"), artifactDirectory: values.get("--artifact-directory"), sourceCommit: values.get("--source-commit") });
    return;
  }
  if (command === "publish") {
    const result = await publishCandidate({ artifactDirectory: values.get("--artifact-directory"), websiteRepository: values.get("--website-repository"), sourceCommit: values.get("--source-commit"), websiteBaseCommit: values.get("--website-base-commit") });
    process.stdout.write(stableJson(result)); return;
  }
  fail("WORKFLOW_ARGUMENT_INVALID", "unknown command");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
