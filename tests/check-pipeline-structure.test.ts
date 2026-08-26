// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here.
//
// Structural invariant of the `check` pipeline in package.json.
//
// The rule (AGENTS.md, "Frozen check-pipeline prefix"): the BASE_PIPELINE
// steps must appear in `scripts.check` in their original order, none may be
// removed, and any step that is not part of BASE_PIPELINE may appear only
// AFTER the last BASE_PIPELINE step (new steps are appended at the tail).
//
// This is the structural restatement of the string-prefix assertion in
// tests/public-surface-adjacency-map/preservation.test.ts ("the whole
// existing check pipeline is preserved in order"). That test is left in
// place and unchanged; this file adds the rule as a named check with the two
// historical violations as negative fixtures, so that a future insertion
// fails for a stated reason rather than for a string mismatch:
//
//   fixtures/check-pipeline/insertion-2026-08-15.json
//     commit efd7428 (2026-08-15): `pnpm run test:human-governed` inserted
//     between test:indexing-discovery and verify:public-surface-map.
//     CI on PR #122 rejected it; corrected in the following commit.
//   fixtures/check-pipeline/insertion-e00d6cf-parent.json
//     parent of e00d6cf (2026-08-22): `pnpm run test:html-charset` inserted
//     after test:security-resilience. CI on PR #132 rejected it; e00d6cf
//     moved the step to the end.
//   fixtures/check-pipeline/tail-append.json
//     the pipeline at origin/main cb2f132 with one more step appended at
//     the tail: must PASS without editing this test.
//
// The fixtures are real `scripts.check` strings recovered from git history
// (git show <commit>:package.json), not hand-written approximations.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const p = (...segments) => join(here, "..", ...segments);
const fixture = (name) => join(here, "fixtures", "check-pipeline", name);

// Identical to BASE_PIPELINE in preservation.test.ts. Extending this list is
// itself a freeze move and needs its own owner authorization; new check steps
// go to the tail of `scripts.check`, not into this array.
const BASE_PIPELINE = [
  "astro build",
  "pnpm run check:astro",
  "pnpm run check:ts",
  "pnpm run test:metadata-contract",
  "pnpm run test:metadata-verifier-lifecycle",
  "wrangler deploy --dry-run",
  "pnpm run test:contracts",
  "pnpm run test:authority-layout",
  "pnpm run test:authority-viewport",
  "pnpm run test:authority-keyboard",
  "pnpm run test:runtime",
  "pnpm run test:retention",
  "pnpm run test:orchestration",
  "pnpm run test:workflow",
  "pnpm run test:semantic-flow",
  "pnpm run test:security-resilience",
  "pnpm run test:indexing-discovery",
  "pnpm run verify:public-surface-map",
  "pnpm run verify:indexing-discovery-build",
  "pnpm run verify:metadata-build",
];

const SEPARATOR = " && ";

export function splitPipeline(check) {
  return check.split(SEPARATOR).map((step) => step.trim());
}

// Evaluates the structural rule and returns every violation with a reason.
// An empty array means the pipeline satisfies the rule.
export function pipelineViolations(check, base = BASE_PIPELINE) {
  const steps = splitPipeline(check);
  const violations = [];

  // 1. No base step may be removed.
  const removed = base.filter((step) => !steps.includes(step));
  for (const step of removed) violations.push(`base step removed: ${step}`);

  // 2. Base steps must appear in their original relative order.
  const basePositions = base.filter((step) => steps.includes(step)).map((step) => steps.indexOf(step));
  for (let i = 1; i < basePositions.length; i += 1) {
    if (basePositions[i] <= basePositions[i - 1]) {
      violations.push(`base step out of order: ${steps[basePositions[i]]} before ${steps[basePositions[i - 1]]}`);
    }
  }

  // 3. Any non-base step must come after the LAST base step (tail-append only).
  const lastBaseIndex = basePositions.length > 0 ? Math.max(...basePositions) : -1;
  steps.forEach((step, index) => {
    if (!base.includes(step) && index < lastBaseIndex) {
      violations.push(`step inserted inside the frozen prefix (position ${index + 1} of ${steps.length}): ${step}`);
    }
  });

  // 4. No duplicate base step (a duplicate would let (2) and (3) be gamed).
  for (const step of base) {
    const count = steps.filter((candidate) => candidate === step).length;
    if (count > 1) violations.push(`base step duplicated ${count} times: ${step}`);
  }

  return violations;
}

const readCheck = (path) => JSON.parse(readFileSync(path, "utf8")).scripts.check;

test("BASE_PIPELINE here is identical to the list frozen in preservation.test.ts", () => {
  const source = readFileSync(p("tests", "public-surface-adjacency-map", "preservation.test.ts"), "utf8");
  const match = source.match(/const BASE_PIPELINE = \[([\s\S]*?)\];/);
  assert.ok(match, "preservation.test.ts must still declare BASE_PIPELINE");
  const frozen = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(frozen, BASE_PIPELINE);
});

test("the live package.json check pipeline satisfies the structural rule", () => {
  const violations = pipelineViolations(readCheck(p("package.json")));
  assert.deepEqual(violations, []);
});

test("negative fixture: the 2026-08-15 insertion (efd7428) is rejected for insertion inside the prefix", () => {
  const violations = pipelineViolations(readCheck(fixture("insertion-2026-08-15.json")));
  assert.equal(violations.length, 1, violations.join("\n"));
  assert.match(violations[0], /^step inserted inside the frozen prefix .*: pnpm run test:human-governed$/);
});

test("negative fixture: the e00d6cf parent shape is rejected for insertion inside the prefix", () => {
  const violations = pipelineViolations(readCheck(fixture("insertion-e00d6cf-parent.json")));
  assert.equal(violations.length, 1, violations.join("\n"));
  assert.match(violations[0], /^step inserted inside the frozen prefix .*: pnpm run test:html-charset$/);
});

test("positive fixture: a step appended at the tail passes without editing this test", () => {
  const check = readCheck(fixture("tail-append.json"));
  assert.ok(check.endsWith(" && pnpm run test:example-appended-at-tail"));
  assert.deepEqual(pipelineViolations(check), []);
});

test("removal and reordering of a base step are rejected", () => {
  const live = splitPipeline(readCheck(p("package.json")));
  const withoutRetention = live.filter((step) => step !== "pnpm run test:retention");
  assert.deepEqual(pipelineViolations(withoutRetention.join(SEPARATOR)), [
    "base step removed: pnpm run test:retention",
  ]);

  const swapped = [...live];
  const a = swapped.indexOf("pnpm run test:runtime");
  const b = swapped.indexOf("pnpm run test:retention");
  [swapped[a], swapped[b]] = [swapped[b], swapped[a]];
  const violations = pipelineViolations(swapped.join(SEPARATOR));
  assert.equal(violations.length, 1, violations.join("\n"));
  assert.match(violations[0], /^base step out of order:/);
});
