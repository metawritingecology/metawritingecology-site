// @ts-nocheck -- Node test harness; this repository intentionally has no
// @types/node dependency. Production contracts remain type-checked by tsc.

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import {
  access,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { promisify } from "node:util";

import { sha256Hex } from "../../src/lib/public-surface-authority-map/byteIdentity.ts";
import {
  CandidateOrchestrationError,
  orchestratePublicSurfaceCandidate,
  serializeCandidateGenerationRecord,
} from "../../scripts/public-surface-candidate-orchestration.mjs";
import { SNAPSHOT_ROOT_RELATIVE } from "../../scripts/public-surface-snapshot-retention.mjs";

const exec = promisify(execFile);
const TEMP_PREFIX = ".public-surface-candidate-orchestration-";
const POINTERS = [
  "src/data/public-surface-authority-map/runtime-manifest.json",
  "src/data/public-surface-authority-map/last-known-good.json",
];

const VALIDATOR = String.raw`import argparse, json, pathlib, sys
p = argparse.ArgumentParser()
p.add_argument("--source-root", required=True)
p.add_argument("--mode", choices=("preflight", "verify-inventory"), required=True)
p.add_argument("--inventory")
a = p.parse_args()
control = json.loads((pathlib.Path(a.source_root) / "fixture-control.json").read_text(encoding="utf-8"))
if a.mode == "preflight" and control.get("mode") == "preflight_failure":
    sys.exit(7)
if a.mode == "verify-inventory":
    if not a.inventory or not pathlib.Path(a.inventory).is_file():
        sys.exit(8)
    if control.get("mode") == "inventory_failure":
        sys.exit(9)
    if control.get("mode") == "candidate_mutation":
        (pathlib.Path(a.inventory).parent / "candidate.json").write_text("{}\n", encoding="utf-8", newline="\n")
print("synthetic validation passed")
`;

const BUILDER = String.raw`import argparse, json, pathlib, sys
p = argparse.ArgumentParser()
p.add_argument("--source-root", required=True)
p.add_argument("--output", required=True)
p.add_argument("--inventory-output", required=True)
a = p.parse_args()
control = json.loads((pathlib.Path(a.source_root) / "fixture-control.json").read_text(encoding="utf-8"))
mode = control.get("mode", "valid")
out = pathlib.Path(a.output)
inv = pathlib.Path(a.inventory_output)
if mode == "generation_failure":
    sys.exit(11)
inv.write_text('{"synthetic":true}\n', encoding="utf-8", newline="\n")
if mode == "missing_output":
    sys.exit(0)
if mode == "invalid_utf8":
    out.write_bytes(b"\xff\xfe")
elif mode == "invalid_json":
    out.write_text("{not-json\n", encoding="utf-8", newline="\n")
elif mode == "invalid_contract":
    out.write_text("{}\n", encoding="utf-8", newline="\n")
else:
    out.write_text(json.dumps(control["candidate"], ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
if mode == "multiple_output":
    (out.parent / "second-candidate.json").write_text("{}\n", encoding="utf-8", newline="\n")
print("synthetic generation passed")
`;

function syntheticSnapshot(label) {
  return {
    schema_version: "1.0",
    title: `Synthetic candidate ${label}`,
    scope: "selected_public_surface_only",
    authority_ceiling: "navigation_only",
    generated_from: ["synthetic fixture only"],
    generated_record_count: 1,
    boundary_statements: [
      "Selected public surface only.",
      "Visual position does not indicate conceptual importance or internal authority.",
      "Reference routing does not establish a confirmed conceptual relation.",
      "Omission does not imply nonexistence.",
    ],
    grouping_fields: ["surface_role", "authority_ceiling", "public_surface_status"],
    edge_counts: { boundary_reference: 0, source_use_reference: 0 },
    self_references_omitted_count: 0,
    nodes: [
      {
        id: `synthetic-${label}`,
        name: `Synthetic ${label}`,
        repository_path: `synthetic-${label}.md`,
        canonical_public_url: `https://github.com/metawritingecology/meta-writing-ecology/blob/example/synthetic-${label}.md`,
        surface_role: "concept_node",
        public_surface_status: "selected_external_node",
        authority_ceiling: "navigation_only",
        relation_default: "navigation_only",
        classification_evidence: "not_asserted",
        boundary_references: [],
        source_use_reference: `synthetic-${label}.md`,
      },
    ],
    edges: [],
    transform_notes: {
      self_references_omitted_from_edges: true,
      record_order_implies_hierarchy: false,
      node_size_implies_importance: false,
      layout_position_implies_relation: false,
    },
  };
}

function candidateBytes(label) {
  return new TextEncoder().encode(`${JSON.stringify(syntheticSnapshot(label), null, 2)}\n`);
}

async function findPython() {
  const bundled = path.resolve(path.dirname(process.execPath), "..", "..", "python", "python.exe");
  const candidates = [process.env.PYTHON, bundled, "python3", "python"].filter(Boolean);
  for (const candidate of candidates) {
    try {
      await exec(candidate, ["--version"], { windowsHide: true });
      return candidate;
    } catch {}
  }
  throw new Error("candidate orchestration tests require Python");
}

async function git(root, args) {
  const { stdout } = await exec("git", ["-C", root, ...args], {
    windowsHide: true,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
  });
  return stdout.trim();
}

async function commitControl(root, label, mode = "valid") {
  await writeFile(
    path.join(root, "fixture-control.json"),
    `${JSON.stringify({ mode, candidate: syntheticSnapshot(label) }, null, 2)}\n`,
  );
  await git(root, ["add", "fixture-control.json"]);
  await git(root, ["commit", "-m", `synthetic ${label} ${mode}`]);
  return git(root, ["rev-parse", "HEAD"]);
}

let fixtureRoot;
let sourceRepository;
let pythonExecutable;
const commits = {};

before(async () => {
  fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "psam-orchestration-suite-"));
  sourceRepository = path.join(fixtureRoot, "source");
  await mkdir(path.join(sourceRepository, "scripts"), { recursive: true });
  await writeFile(
    path.join(sourceRepository, "scripts", "validate_public_metadata.py"),
    VALIDATOR,
  );
  await writeFile(
    path.join(sourceRepository, "scripts", "build_public_surface_authority_map.py"),
    BUILDER,
  );
  await writeFile(
    path.join(sourceRepository, "mwe-public-surface-dependency-inventory.schema.json"),
    '{"synthetic":true}\n',
  );
  await git(sourceRepository, ["init"]);
  await git(sourceRepository, ["config", "user.name", "Synthetic Test"]);
  await git(sourceRepository, ["config", "user.email", "synthetic@example.invalid"]);
  await git(sourceRepository, [
    "remote",
    "add",
    "origin",
    "https://github.com/metawritingecology/meta-writing-ecology.git",
  ]);
  await git(sourceRepository, ["add", "."]);
  await git(sourceRepository, ["commit", "-m", "synthetic generator fixture"]);
  commits.approved = await commitControl(sourceRepository, "approved");
  commits.head = await commitControl(sourceRepository, "head");
  commits.generationFailure = await commitControl(
    sourceRepository,
    "generation-failure",
    "generation_failure",
  );
  commits.missingOutput = await commitControl(
    sourceRepository,
    "missing-output",
    "missing_output",
  );
  commits.multipleOutput = await commitControl(
    sourceRepository,
    "multiple-output",
    "multiple_output",
  );
  commits.invalidUtf8 = await commitControl(sourceRepository, "utf8", "invalid_utf8");
  commits.invalidJson = await commitControl(sourceRepository, "json", "invalid_json");
  commits.invalidContract = await commitControl(
    sourceRepository,
    "contract",
    "invalid_contract",
  );
  commits.inventoryFailure = await commitControl(
    sourceRepository,
    "inventory",
    "inventory_failure",
  );
  commits.candidateMutation = await commitControl(
    sourceRepository,
    "candidate-mutation",
    "candidate_mutation",
  );
  await rm(path.join(sourceRepository, "scripts", "build_public_surface_authority_map.py"));
  await git(sourceRepository, ["add", "-u"]);
  await git(sourceRepository, ["commit", "-m", "synthetic missing generator"]);
  commits.missingGenerator = await git(sourceRepository, ["rev-parse", "HEAD"]);
  pythonExecutable = await findPython();
});

after(async () => {
  if (fixtureRoot) await rm(fixtureRoot, { recursive: true, force: true });
});

async function temporaryWebsite(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "psam-orchestration-site-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, ...SNAPSHOT_ROOT_RELATIVE.split("/")), {
    recursive: true,
  });
  for (const [index, relative] of POINTERS.entries()) {
    const absolute = path.join(root, ...relative.split("/"));
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, `synthetic protected pointer ${index}\n`);
  }
  await writeFile(
    path.join(root, ...SNAPSHOT_ROOT_RELATIVE.split("/"), "existing-production.json"),
    "synthetic existing production bytes\n",
  );
  return root;
}

function options(websiteRepository, commit = commits.approved) {
  return {
    sourceRepository,
    SOURCE_COMMIT_APPROVED_FOR_GENERATION: commit,
    generatorIdentity: commit,
    websiteRepository,
    pythonExecutable,
  };
}

async function expectCode(action, code) {
  await assert.rejects(action, (error) => {
    assert.equal(error instanceof CandidateOrchestrationError, true);
    assert.equal(error.code, code);
    return true;
  });
}

async function shaFile(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

async function repositoryIdentity(root) {
  return {
    head: await git(root, ["rev-parse", "HEAD"]),
    refs: await git(root, ["for-each-ref", "--format=%(refname) %(objectname)"]),
    status: await git(root, ["status", "--porcelain=v1", "--untracked-files=all"]),
    tracked: await git(root, ["ls-files", "-s"]),
  };
}

async function assertNoTemporaryState(root) {
  const entries = await readdir(root);
  assert.deepEqual(entries.filter((name) => name.startsWith(TEMP_PREFIX)), []);
}

test("exact gate: approved source commit is required", async () => {
  await expectCode(
    () => orchestratePublicSurfaceCandidate({}),
    "missing_approved_source_commit",
  );
});

test("exact gate: malformed approved source commit is rejected", async () => {
  await expectCode(
    () =>
      orchestratePublicSurfaceCandidate({
        SOURCE_COMMIT_APPROVED_FOR_GENERATION: "A".repeat(40),
      }),
    "malformed_approved_source_commit",
  );
});

test("exact gate: absent source commit is rejected", async (t) => {
  const website = await temporaryWebsite(t);
  await expectCode(
    () => orchestratePublicSurfaceCandidate(options(website, "0".repeat(40))),
    "approved_source_commit_not_found",
  );
});

test("approved commit, not source HEAD, supplies candidate bytes", async (t) => {
  const website = await temporaryWebsite(t);
  const record = await orchestratePublicSurfaceCandidate(options(website, commits.approved));
  assert.equal(record.candidate_sha256, await sha256Hex(candidateBytes("approved")));
  assert.notEqual(record.candidate_sha256, await sha256Hex(candidateBytes("head")));
});

test("dirty source working-tree content cannot alter approved-commit generation", async (t) => {
  const website = await temporaryWebsite(t);
  const control = path.join(sourceRepository, "fixture-control.json");
  const before = await readFile(control);
  await writeFile(control, `${JSON.stringify({ mode: "invalid_json" })}\n`);
  try {
    const record = await orchestratePublicSurfaceCandidate(options(website));
    assert.equal(record.candidate_sha256, await sha256Hex(candidateBytes("approved")));
  } finally {
    await writeFile(control, before);
  }
});

test("generator identity is captured mechanically", async (t) => {
  const website = await temporaryWebsite(t);
  const record = await orchestratePublicSurfaceCandidate(options(website));
  assert.equal(record.generator_identity, commits.approved);
  assert.equal(record.SOURCE_COMMIT_APPROVED_FOR_GENERATION, commits.approved);
});

test("generator identity mismatch fails closed", async (t) => {
  const website = await temporaryWebsite(t);
  await expectCode(
    () =>
      orchestratePublicSurfaceCandidate({
        ...options(website),
        generatorIdentity: commits.head,
      }),
    "source_generator_identity_mismatch",
  );
});

test("unavailable source generator fails closed", async (t) => {
  const website = await temporaryWebsite(t);
  await expectCode(
    () => orchestratePublicSurfaceCandidate(options(website, commits.missingGenerator)),
    "source_generator_unavailable",
  );
});

test("generator non-zero exit fails closed", async (t) => {
  const website = await temporaryWebsite(t);
  await expectCode(
    () => orchestratePublicSurfaceCandidate(options(website, commits.generationFailure)),
    "source_generation_failure",
  );
});

test("missing generated output fails closed", async (t) => {
  const website = await temporaryWebsite(t);
  await expectCode(
    () => orchestratePublicSurfaceCandidate(options(website, commits.missingOutput)),
    "missing_generated_output",
  );
});

test("multiple generated outputs fail closed", async (t) => {
  const website = await temporaryWebsite(t);
  await expectCode(
    () => orchestratePublicSurfaceCandidate(options(website, commits.multipleOutput)),
    "ambiguous_generated_output",
  );
});

test("invalid UTF-8 fails closed", async (t) => {
  const website = await temporaryWebsite(t);
  await expectCode(
    () => orchestratePublicSurfaceCandidate(options(website, commits.invalidUtf8)),
    "invalid_candidate_utf8",
  );
});

test("invalid JSON fails closed", async (t) => {
  const website = await temporaryWebsite(t);
  await expectCode(
    () => orchestratePublicSurfaceCandidate(options(website, commits.invalidJson)),
    "invalid_candidate_json",
  );
});

test("invalid public-surface map contract fails closed", async (t) => {
  const website = await temporaryWebsite(t);
  await expectCode(
    () => orchestratePublicSurfaceCandidate(options(website, commits.invalidContract)),
    "invalid_public_surface_map_contract",
  );
});

test("inventory verification failure prevents retention", async (t) => {
  const website = await temporaryWebsite(t);
  await expectCode(
    () => orchestratePublicSurfaceCandidate(options(website, commits.inventoryFailure)),
    "source_inventory_validation_failure",
  );
  assert.deepEqual(
    (await readdir(path.join(website, ...SNAPSHOT_ROOT_RELATIVE.split("/")))).sort(),
    ["existing-production.json"],
  );
});

test("candidate SHA mismatch after generation fails closed", async (t) => {
  const website = await temporaryWebsite(t);
  await expectCode(
    () => orchestratePublicSurfaceCandidate(options(website, commits.candidateMutation)),
    "candidate_sha_mismatch",
  );
  assert.deepEqual(
    (await readdir(path.join(website, ...SNAPSHOT_ROOT_RELATIVE.split("/")))).sort(),
    ["existing-production.json"],
  );
});

test("exact candidate-byte SHA-256 identifies the retained snapshot", async (t) => {
  const website = await temporaryWebsite(t);
  const record = await orchestratePublicSurfaceCandidate(options(website));
  const expected = await sha256Hex(candidateBytes("approved"));
  assert.equal(record.candidate_sha256, expected);
  assert.equal(
    record.retained_snapshot_path,
    `${SNAPSHOT_ROOT_RELATIVE}/${commits.approved}-${expected}.json`,
  );
  assert.equal(
    await shaFile(path.join(website, ...record.retained_snapshot_path.split("/"))),
    expected,
  );
});

test("first retention creates one immutable snapshot through Phase 3B-2", async (t) => {
  const website = await temporaryWebsite(t);
  const record = await orchestratePublicSurfaceCandidate(options(website));
  assert.equal(record.retention_result, "created");
  assert.deepEqual(
    (await readdir(path.join(website, ...SNAPSHOT_ROOT_RELATIVE.split("/")))).sort(),
    ["existing-production.json", path.basename(record.retained_snapshot_path)].sort(),
  );
});

test("identical rerun is an idempotent no-op", async (t) => {
  const website = await temporaryWebsite(t);
  const first = await orchestratePublicSurfaceCandidate(options(website));
  const destination = path.join(website, ...first.retained_snapshot_path.split("/"));
  const before = await lstat(destination);
  const second = await orchestratePublicSurfaceCandidate(options(website));
  const after = await lstat(destination);
  assert.equal(second.retention_result, "identical-existing");
  assert.equal(after.mtimeMs, before.mtimeMs);
});

test("conflicting existing identity fails closed", async (t) => {
  const website = await temporaryWebsite(t);
  const sha = await sha256Hex(candidateBytes("approved"));
  const destination = path.join(
    website,
    ...SNAPSHOT_ROOT_RELATIVE.split("/"),
    `${commits.approved}-${sha}.json`,
  );
  await writeFile(destination, "conflicting synthetic bytes\n");
  await expectCode(
    () => orchestratePublicSurfaceCandidate(options(website)),
    "existing_snapshot_identity_conflict",
  );
  assert.equal(await readFile(destination, "utf8"), "conflicting synthetic bytes\n");
});

test("active manifest, last-known-good, and existing snapshot remain byte-identical", async (t) => {
  const website = await temporaryWebsite(t);
  const protectedPaths = [
    ...POINTERS,
    `${SNAPSHOT_ROOT_RELATIVE}/existing-production.json`,
  ];
  const before = new Map();
  for (const relative of protectedPaths) {
    before.set(relative, await shaFile(path.join(website, ...relative.split("/"))));
  }
  await orchestratePublicSurfaceCandidate(options(website));
  for (const relative of protectedPaths) {
    assert.equal(await shaFile(path.join(website, ...relative.split("/"))), before.get(relative));
  }
});

test("source repository files, refs, HEAD, and dirty state remain unchanged", async (t) => {
  const website = await temporaryWebsite(t);
  const before = await repositoryIdentity(sourceRepository);
  await orchestratePublicSurfaceCandidate(options(website));
  assert.deepEqual(await repositoryIdentity(sourceRepository), before);
});

test("equivalent clean runs emit byte-identical mechanical records", async (t) => {
  const websiteA = await temporaryWebsite(t);
  const websiteB = await temporaryWebsite(t);
  const first = serializeCandidateGenerationRecord(
    await orchestratePublicSurfaceCandidate(options(websiteA)),
  );
  const second = serializeCandidateGenerationRecord(
    await orchestratePublicSurfaceCandidate(options(websiteB)),
  );
  assert.equal(second, first);
});

test("result excludes volatile, path, and authority-status fields", async (t) => {
  const website = await temporaryWebsite(t);
  const serialized = serializeCandidateGenerationRecord(
    await orchestratePublicSurfaceCandidate(options(website)),
  );
  for (const forbidden of [
    "timestamp",
    "hostname",
    "username",
    website,
    sourceRepository,
    os.tmpdir(),
    "approved\"",
    "adopted",
    "authoritative",
    "production",
    "published",
    "registryStatus",
    "ontologyStatus",
    "confirmed",
    "official",
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("failure cleanup removes temporary orchestration state", async (t) => {
  const website = await temporaryWebsite(t);
  await expectCode(
    () => orchestratePublicSurfaceCandidate(options(website, commits.invalidJson)),
    "invalid_candidate_json",
  );
  await assertNoTemporaryState(website);
});

test("success cleanup removes temporary orchestration state", async (t) => {
  const website = await temporaryWebsite(t);
  await orchestratePublicSurfaceCandidate(options(website));
  await assertNoTemporaryState(website);
});

test("source and website paths may not overlap", async (t) => {
  const website = await temporaryWebsite(t);
  await expectCode(
    () =>
      orchestratePublicSurfaceCandidate({
        ...options(website),
        websiteRepository: sourceRepository,
      }),
    "repository_boundary_overlap",
  );
});

test("implementation has no GitHub, network, workflow, branch, commit, PR, or deployment action", async () => {
  const modulePath = new URL(
    "../../scripts/public-surface-candidate-orchestration.mjs",
    import.meta.url,
  );
  const source = await readFile(modulePath, "utf8");
  for (const forbidden of [
    "fetch(",
    "api.github.com",
    "git push",
    "git commit",
    "git branch",
    "pull request",
    "wrangler",
    "deploy",
    ".github",
  ]) {
    assert.equal(source.toLowerCase().includes(forbidden), false, forbidden);
  }
  assert.equal(source.includes('"archive"'), true);
  assert.equal(source.includes("retainPublicSurfaceSnapshot"), true);
});

test("temporary fixture contains no real source corpus or production candidate", async () => {
  await access(path.join(sourceRepository, "fixture-control.json"));
  assert.equal(await git(sourceRepository, ["ls-files"]), [
    "fixture-control.json",
    "mwe-public-surface-dependency-inventory.schema.json",
    "scripts/validate_public_metadata.py",
  ].join("\n"));
});
