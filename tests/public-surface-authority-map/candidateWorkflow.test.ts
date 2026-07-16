// @ts-nocheck -- Node test harness; production contracts remain type-checked by tsc.

import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { sha256Hex } from "../../src/lib/public-surface-authority-map/byteIdentity.ts";
import {
  ARTIFACT_IDENTITY_SCHEMA,
  CandidateWorkflowError,
  candidateBranch,
  candidateCommitMessage,
  candidatePullRequestRecord,
  classifyPullRequests,
  packageArtifact,
  SOURCE_REPOSITORY,
  validateArtifact,
  validateDispatch,
} from "../../scripts/public-surface-candidate-workflow.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const workflow = await readFile(path.join(root, ".github/workflows/public-surface-candidate-generation.yml"), "utf8");
const script = await readFile(path.join(root, "scripts/public-surface-candidate-workflow.mjs"), "utf8");
const fallback = JSON.parse(await readFile(path.join(root, "src/data/public-surface-authority-map/last-known-good.json"), "utf8"));
const SOURCE = "1".repeat(40);
const BASE = "2".repeat(40);

function expectCode(action, code) {
  assert.throws(action, (error) => error instanceof CandidateWorkflowError && error.code === code);
}

function syntheticBytes(label = "fixture") {
  const candidate = structuredClone(fallback);
  candidate.title = `Synthetic workflow fixture ${label}`;
  return new TextEncoder().encode(`${JSON.stringify(candidate)}\n`);
}

async function artifactFixture(t) {
  const temp = await mkdtemp(path.join(os.tmpdir(), "candidate-workflow-test-"));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const website = path.join(temp, "website");
  const artifact = path.join(temp, "artifact");
  const candidate = syntheticBytes();
  const sha = await sha256Hex(candidate);
  const retained = `src/data/public-surface-authority-map/runtime-snapshots/${SOURCE}-${sha}.json`;
  await mkdir(path.join(website, ...path.dirname(retained).split("/")), { recursive: true });
  await writeFile(path.join(website, ...retained.split("/")), candidate);
  const record = {
    candidate_generation_record_schema_version: "public-surface-candidate-generation-record/1.0",
    source_repository: SOURCE_REPOSITORY,
    SOURCE_COMMIT_APPROVED_FOR_GENERATION: SOURCE,
    generator_identity: SOURCE,
    candidate_sha256: sha,
    retained_snapshot_path: retained,
    retention_result: "created",
    validation_result: "passed",
  };
  const recordPath = path.join(temp, "record.json");
  await writeFile(recordPath, `${JSON.stringify(record)}\n`);
  await packageArtifact({ recordPath, websiteRepository: website, artifactDirectory: artifact, sourceCommit: SOURCE });
  return { artifact, candidate, record, sha, temp };
}

test("workflow_dispatch is the only trigger", () => {
  const triggerBlock = workflow.match(/^on:\n([\s\S]*?)\npermissions:/m)?.[1] ?? "";
  assert.match(triggerBlock, /^  workflow_dispatch:/m);
  for (const trigger of ["push", "pull_request", "pull_request_target", "schedule", "repository_dispatch", "workflow_run", "workflow_call", "release", "deployment"]) {
    assert.doesNotMatch(triggerBlock, new RegExp(`^  ${trigger}:`, "m"));
  }
});

test("exact approval input is required and no fallback is present", () => {
  assert.match(workflow, /SOURCE_COMMIT_APPROVED_FOR_GENERATION:\n[\s\S]*?required: true/);
  assert.doesNotMatch(workflow, /SOURCE_COMMIT_APPROVED_FOR_GENERATION[\s\S]{0,120}(default|fallback):/);
});

test("dispatch refuses a non-main ref", () => {
  expectCode(() => validateDispatch({ repository: "metawritingecology/metawritingecology-site", ref: "refs/heads/topic", sourceCommit: SOURCE }), "WORKFLOW_REF_NOT_MAIN");
});

test("dispatch rejects a missing source commit", () => {
  expectCode(() => validateDispatch({ repository: "metawritingecology/metawritingecology-site", ref: "refs/heads/main" }), "APPROVED_SOURCE_COMMIT_MISSING");
});

test("dispatch rejects malformed and uppercase source commits", () => {
  for (const sourceCommit of ["1".repeat(39), "A".repeat(40), "z".repeat(40)]) {
    expectCode(() => validateDispatch({ repository: "metawritingecology/metawritingecology-site", ref: "refs/heads/main", sourceCommit }), "APPROVED_SOURCE_COMMIT_MALFORMED");
  }
});

test("dispatch refuses a different repository", () => {
  expectCode(() => validateDispatch({ repository: SOURCE_REPOSITORY, ref: "refs/heads/main", sourceCommit: SOURCE }), "WORKFLOW_REPOSITORY_MISMATCH");
});

test("top-level permissions are empty", () => assert.match(workflow, /^permissions: \{\}$/m));

test("generation permissions are read-only", () => {
  const block = workflow.match(/  generate:[\s\S]*?  publish:/)?.[0] ?? "";
  assert.match(block, /permissions:\n      contents: read/);
  assert.doesNotMatch(block, /contents: write|pull-requests: write|github\.token|GH_TOKEN/);
});

test("publishing permissions contain only the two authorized writes", () => {
  const block = workflow.match(/  publish:[\s\S]*$/)?.[0] ?? "";
  const permission = block.match(/    permissions:\n((?:      .+\n)+)/)?.[1] ?? "";
  assert.equal(permission.trim(), "contents: write\n      pull-requests: write");
});

test("generation checkouts use the job token without persisting credentials", () => {
  const block = workflow.match(/  generate:[\s\S]*?  publish:/)?.[0] ?? "";
  const checkoutSteps = [...block.matchAll(/      - name: [^\n]+\n[\s\S]*?uses: actions\/checkout@[0-9a-f]{40}\n[\s\S]*?(?=\n      - name: |\n  publish:)/g)].map((match) => match[0]);
  assert.equal(checkoutSteps.length, 2);
  for (const checkout of checkoutSteps) assert.match(checkout, /persist-credentials: false/);
  assert.doesNotMatch(workflow, /^\s*token:\s*(["'])\1\s*$/m);
});

test("publishing job never checks out the source repository", () => {
  const block = workflow.match(/  publish:[\s\S]*$/)?.[0] ?? "";
  assert.doesNotMatch(block, /meta-writing-ecology|source-repository|python3|orchestration/);
});

test("all action references use immutable full commit SHAs", () => {
  const refs = [...workflow.matchAll(/^\s*uses:\s*([^\s]+)$/gm)].map((match) => match[1]);
  assert.ok(refs.length >= 5);
  for (const ref of refs) assert.match(ref, /^[^@]+@[0-9a-f]{40}$/);
});

test("every action pin has a version comment", () => {
  const lines = workflow.split("\n");
  for (let index = 0; index < lines.length; index++) if (lines[index].includes("uses:")) assert.match(lines[index - 1], /# actions\/.+ v\d/);
});

test("no PAT, inherited secret, id-token, deployment, or write-all exists", () => {
  for (const forbidden of ["PAT", "secrets: inherit", "id-token: write", "write-all", "environment:", "wrangler deploy"]) assert.equal(workflow.includes(forbidden), false);
});

test("artifact validates exact synthetic files and identities", async (t) => {
  const fixture = await artifactFixture(t);
  const validated = await validateArtifact({ artifactDirectory: fixture.artifact, sourceCommit: SOURCE });
  assert.equal(validated.record.candidate_sha256, fixture.sha);
  assert.deepEqual(validated.candidateBytes, fixture.candidate);
});

test("artifact rejects an unexpected file", async (t) => {
  const fixture = await artifactFixture(t);
  await writeFile(path.join(fixture.artifact, "extra.sh"), "exit 0\n");
  await assert.rejects(() => validateArtifact({ artifactDirectory: fixture.artifact, sourceCommit: SOURCE }), { code: "CANDIDATE_ARTIFACT_UNSAFE" });
});

test("artifact rejects a missing candidate", async (t) => {
  const fixture = await artifactFixture(t);
  await rm(path.join(fixture.artifact, "candidate.json"));
  await assert.rejects(() => validateArtifact({ artifactDirectory: fixture.artifact, sourceCommit: SOURCE }), { code: "CANDIDATE_ARTIFACT_UNSAFE" });
});

test("artifact rejects a symlink or reparse equivalent", async (t) => {
  const fixture = await artifactFixture(t);
  await rm(path.join(fixture.artifact, "candidate.json"));
  try { await symlink(path.join(fixture.temp, "record.json"), path.join(fixture.artifact, "candidate.json"), "file"); }
  catch (error) { if (["EPERM", "EACCES", "ENOSYS"].includes(error.code)) return t.skip(`symlink unavailable: ${error.code}`); throw error; }
  await assert.rejects(() => validateArtifact({ artifactDirectory: fixture.artifact, sourceCommit: SOURCE }), { code: "CANDIDATE_ARTIFACT_UNSAFE" });
});

test("artifact rejects a source identity mismatch", async (t) => {
  const fixture = await artifactFixture(t);
  await assert.rejects(() => validateArtifact({ artifactDirectory: fixture.artifact, sourceCommit: "3".repeat(40) }), { code: "SOURCE_CHECKOUT_IDENTITY_MISMATCH" });
});

test("artifact rejects a candidate SHA mismatch", async (t) => {
  const fixture = await artifactFixture(t);
  await writeFile(path.join(fixture.artifact, "candidate.json"), syntheticBytes("changed"));
  await assert.rejects(() => validateArtifact({ artifactDirectory: fixture.artifact, sourceCommit: SOURCE }), { code: "CANDIDATE_SHA_MISMATCH" });
});

test("artifact rejects a generator identity mismatch", async (t) => {
  const fixture = await artifactFixture(t);
  const identityPath = path.join(fixture.artifact, "candidate-identity.json");
  const identity = JSON.parse(await readFile(identityPath, "utf8"));
  identity.generator_identity = "3".repeat(40);
  await writeFile(identityPath, `${JSON.stringify(identity)}\n`);
  await assert.rejects(() => validateArtifact({ artifactDirectory: fixture.artifact, sourceCommit: SOURCE }), { code: "GENERATOR_IDENTITY_MISMATCH" });
});

test("candidate branch uses both full deterministic identities", () => {
  const sha = "a".repeat(64);
  assert.equal(candidateBranch(SOURCE, sha), `candidate/public-surface/${SOURCE}/${sha}`);
});

test("candidate branch rejects malformed identities", () => {
  expectCode(() => candidateBranch("1".repeat(39), "a".repeat(64)), "CANDIDATE_BRANCH_IDENTITY_CONFLICT");
});

test("candidate commit message is deterministic and status-neutral", () => {
  const message = candidateCommitMessage(SOURCE, "a".repeat(64));
  assert.equal(message, candidateCommitMessage(SOURCE, "a".repeat(64)));
  assert.doesNotMatch(message, /approve|adopt|production|publish|authority/i);
});

function expectedPr() {
  const sha = "a".repeat(64);
  const branch = candidateBranch(SOURCE, sha);
  return { branch, ...candidatePullRequestRecord({ sourceCommit: SOURCE, candidateSha256: sha, generatorIdentity: SOURCE, websiteBaseCommit: BASE, retainedPath: `src/data/public-surface-authority-map/runtime-snapshots/${SOURCE}-${sha}.json`, retentionResult: "created" }) };
}

test("identical open Draft PR is an idempotent no-op", () => {
  const expected = expectedPr();
  assert.equal(classifyPullRequests([{ state: "open", draft: true, base: { ref: "main" }, head: { ref: expected.branch }, title: expected.title, body: expected.body }], expected), "identical-open-draft");
});

test("no existing PR requests creation", () => assert.equal(classifyPullRequests([], expectedPr()), "create"));

test("differing open PR fails closed", () => {
  const expected = expectedPr();
  expectCode(() => classifyPullRequests([{ state: "open", draft: true, base: { ref: "main" }, head: { ref: expected.branch }, title: "different", body: expected.body }], expected), "CANDIDATE_PR_STATE_CONFLICT");
});

test("non-Draft open PR fails closed", () => {
  const expected = expectedPr();
  expectCode(() => classifyPullRequests([{ state: "open", draft: false, base: { ref: "main" }, head: { ref: expected.branch }, title: expected.title, body: expected.body }], expected), "CANDIDATE_PR_STATE_CONFLICT");
});

test("closed-unmerged PR is never reopened", () => {
  expectCode(() => classifyPullRequests([{ state: "closed", merged_at: null }], expectedPr()), "CANDIDATE_PR_CLOSED_UNMERGED");
});

test("multiple PR records fail closed", () => {
  expectCode(() => classifyPullRequests([{}, {}], expectedPr()), "CANDIDATE_PR_STATE_CONFLICT");
});

test("PR body contains the exact candidate-only boundary", () => {
  const { body } = expectedPr();
  assert.match(body, /^# CANDIDATE ONLY — NOT ADOPTED/m);
  assert.match(body, /does not move runtime-manifest\.json or last-known-good\.json/);
});

test("equivalent PR inputs produce byte-identical records", () => {
  assert.deepEqual(expectedPr(), expectedPr());
  assert.equal(JSON.stringify(expectedPr()), JSON.stringify(expectedPr()));
});

test("deterministic PR record excludes ambient and authority-status fields", () => {
  const record = JSON.stringify(expectedPr());
  for (const forbidden of ["timestamp", "run_id", "username", "hostname", os.tmpdir(), "registry_status", "ontology_status", "authority_status", "production_status"]) assert.equal(record.toLowerCase().includes(forbidden.toLowerCase()), false);
});

test("workflow never force-pushes, merges, approves, auto-merges, or deploys", () => {
  for (const forbidden of ["--force", "force-with-lease", "gh pr merge", "auto-merge", "gh pr review", "wrangler", "deployments:"]) assert.equal(workflow.includes(forbidden), false);
});

test("workflow never writes pointer files", () => {
  assert.doesNotMatch(workflow, />\s*[^\n]*(runtime-manifest|last-known-good)|tee\s+[^\n]*(runtime-manifest|last-known-good)/);
});

test("publishing code checks main drift before branch push", () => {
  assert.ok(script.indexOf("WEBSITE_MAIN_DRIFT") < script.indexOf('["push", "origin"'));
});

test("publishing code permits only one new retained path", () => {
  assert.match(script, /lines\.length !== 1/);
  assert.match(script, /PROTECTED_PATH_MUTATION/);
});

test("branch creation uses a non-force exact refspec", () => {
  assert.match(script, /`HEAD:refs\/heads\/\$\{branch\}`/);
  assert.doesNotMatch(script, /push[^\n]*(--force|-f\b)/);
});

test("Draft PR creation is explicit and auto-merge is absent", () => {
  assert.match(script, /"-F", "draft=true"/);
  assert.doesNotMatch(script, /auto.?merge|review.*approve/i);
});

test("failure cleanup is in a finally block before mutation planning", () => {
  assert.match(script, /finally \{\s*await rm\(temporary, \{ recursive: true, force: true \}\);\s*\}/);
});

test("artifact identity schema is deterministic mechanical data", () => {
  assert.equal(ARTIFACT_IDENTITY_SCHEMA, "public-surface-candidate-artifact-identity/1.0");
});

test("tests and workflow contain no real approved source identity", () => {
  assert.doesNotMatch(workflow, /97631bc0a36f39331a6950d1498400213208afb6/);
  assert.doesNotMatch(workflow, /18491105f0bc0451e0bf99eaa78c39f69c7cb57c/);
});
