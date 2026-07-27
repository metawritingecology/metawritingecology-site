// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here.
//
// Focused PAGE-CONTENT contract test for the Applied Evidence Layer route
// `/human-governed-ai-workflows/`.
//
// SCOPE OF THIS TEST (deliberately narrow):
// It verifies the NEW page's approved content, structure, source-link
// constraints, claim ceilings and boundary language, the single approved
// Entry Points inbound entry, and the absence of an inbound link to this route
// from the homepage, the shared top navigation and the Diagnostic Entry Layer.
//
// WHAT THIS TEST DOES NOT ESTABLISH:
// Reading this page proves nothing about whether unrelated repository files
// were modified. The assertions below about the homepage, top navigation and
// Diagnostic Entry Layer assert only that no inbound link to this route was
// added to them; they are NOT evidence of those files' integrity. Proof that
// no prohibited file was modified comes from the separate authorized-file
// audit (`git diff --name-only` plus `git status --short`), not from here.
//
// A passing content test establishes only the asserted source properties, not
// governance, framework effectiveness, conformity, or any measured outcome.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { getRegisteredRoutes, getRoutePolicy } from "../src/lib/publicMetadata.ts";

const root = new URL("../", import.meta.url);
const rd = (rel: string) => readFileSync(fileURLToPath(new URL(rel, root)), "utf8");

const ROUTE = "/human-governed-ai-workflows/";
const PAGE_PATH = "src/pages/human-governed-ai-workflows.astro";

const pageSource = rd(PAGE_PATH);
const entryPoints = rd("src/pages/entry-points.md");

// ---------------------------------------------------------------------------
// Source slicing helpers
// ---------------------------------------------------------------------------

// The rendered body region: everything between the component frontmatter fence
// and the page-scoped <style> block.
function bodyRegion(source: string): string {
  const fenceEnd = source.indexOf("---", source.indexOf("---") + 3);
  assert.notEqual(fenceEnd, -1, "page must have an Astro frontmatter fence");
  const afterFence = source.slice(fenceEnd + 3);
  const styleStart = afterFence.indexOf("<style>");
  return styleStart === -1 ? afterFence : afterFence.slice(0, styleStart);
}

const body = bodyRegion(pageSource);

// Visible prose: strip tags, drop Astro attribute values, collapse whitespace.
function visibleText(html: string): string {
  return html
    .replace(/<br\s*\/?>/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    // Tag removal can leave a space before terminal punctuation
    // (e.g. `<strong>Not measured.</strong> .`); rejoin it so assertions can
    // compare against the approved sentences exactly.
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}

const text = visibleText(body);

const countOf = (haystack: string, needle: string) =>
  haystack.split(needle).length - 1;

// Approved copy fragments, transcribed from rev5. They are declared here so
// that the fixed sentences reused by later assertions have exactly one
// definition; every one of them is a literal, not an extraction.

const EYEBROW = "Applied Evidence Layer";

const H1 = "Human-Governed AI Workflows";

const SUBTITLE =
  "Three public cases on authority boundaries, artifact-scoped provenance, and delegated execution, with declared controls, implemented artifacts, tested properties, and measured outcomes kept distinct.";

const HERO_1 =
  "This page presents three public repository-level cases concerning AI authority boundaries, provenance and artifact-scoped reconstruction, and delegated execution with retained human answerability. Each case separates declared controls, implemented artifacts, tested technical properties, and measured outcomes.";

const HERO_2 =
  "The cases also identify limited, case-specific correspondence with the NIST Artificial Intelligence Risk Management Framework (AI RMF 1.0) and the public ISO/IEC 42001 overview. Correspondence here means a bounded structural comparison. It does not mean that Meta-Writing Ecology has adopted or implemented either framework.";

const FRAMEWORK_INTRO =
  "The framework notes below are limited to exact MWE public evidence and official public framework concepts. Each correspondence identifies the shared structural function, the difference in scope, and the stronger inference that is not permitted. Shared vocabulary alone is not treated as correspondence.";

const NIST_BOUNDARY =
  "Validators, version identities, and reconstruction tests provide evidence infrastructure that may support selected NIST AI RMF Measure activities. They do not by themselves measure AI risk, system trustworthiness, or organizational effectiveness.";

const ISO_BOUNDARY =
  "This is a public-overview conceptual correspondence, not a clause-level ISO/IEC 42001 mapping.";

// ---------------------------------------------------------------------------
// A. Canonical visible-copy contract — complete author-approved rev5 copy
//
// APPROVED_VISIBLE_TEXT is a FIXED, INDEPENDENT transcription of the complete
// author-approved public copy, rev5 §8.1 through §8.10, in the approved order.
// It is typed out from the approved copy itself. It is NOT derived from
// `pageSource`, `body`, `text`, a rendered snapshot, or any other runtime
// extraction of the implementation — so the equality assertion below is a real
// contract rather than a tautology.
//
// It deliberately contains NO metadata (HTML title, meta description) and NO
// Entry Points copy: those are separately asserted further down, and must not
// be absorbed into this constant.
//
// It contains no standalone "Case 01" / "Case 02" / "Case 03" ordinal label.
// The only occurrences of those strings are inside the approved §8.8 and §8.9
// sentences, where they are part of the fixed copy.
//
// The equality assertion fails if any visible prose is omitted, changed,
// reordered, duplicated, or added.
// ---------------------------------------------------------------------------

const APPROVED_VISIBLE_TEXT = visibleText(`
  ${EYEBROW}
  ${H1}
  ${SUBTITLE}

  ${HERO_1}
  ${HERO_2}

  Evidence boundary
  Declared control ≠ implemented artifact ≠ tested property ≠ measured outcome.
  A public rule does not prove that a mechanism exists. A mechanism does not
  prove that a property was tested. A passing technical test does not establish
  an operational or organizational effect. Where no outcome measure is public,
  this page says Not measured.

  ${FRAMEWORK_INTRO}

  AI Authority Boundaries and Human Oversight

  Human-authority rules: Declared control
  Metadata and machine-reading artifacts: Tested technical property

  Condition. AI-assisted interpretation and implementation can encounter
  decisions about naming, classification, relation status, publication,
  navigation, and public/private boundaries that agents are not authorized to
  settle.

  Control objective. Preserve final human authority and reduce the inference
  authority of automated interpretation when evidence is missing, conflicting,
  or unconfirmed.

  Declared controls. Public repository instructions reserve specified
  conceptual and publication decisions to the repository owner. Candidate and
  navigation relations may not be promoted into confirmed relations. Unknown,
  conflicting, and unconfirmed interpretation states fail closed.

  Implemented artifacts. Public route-metadata policy rejects unregistered
  BaseLayout routes and excludes authority-bearing metadata keys. A
  machine-reading state model represents source-access states, uncertainty
  flags, and claim scopes.

  Tested properties. Public tests and validators check the route-metadata
  contract and the machine-reading state model. These tests establish
  properties of the artifacts; they do not test whether the human-authority
  rules are followed in practice.

  Publicly established result. The repository publicly declares authority
  limits and exposes tested technical mechanisms that preserve selected
  metadata and machine-reading boundaries.

  Measurement state. Not measured.

  Inference ceiling. The evidence does not establish effective human
  oversight, reduced unauthorized promotion, measured governance improvement,
  or organizational risk reduction.

  NIST AI RMF 1.0 correspondence. MWE’s documented authority boundaries and
  fail-closed interpretation rules correspond at a limited structural level to
  selected NIST AI RMF GOVERN and MAP concerns about documented roles,
  responsibilities, knowledge limits, and human oversight. This does not
  establish adoption, implementation, or completion of GOVERN or MAP.

  ISO/IEC 42001 public-overview correspondence. At public-overview level,
  MWE’s documented authority limits and tested fail-closed metadata behavior
  have limited conceptual correspondence with ISO/IEC 42001’s high-level
  treatment of responsibilities, policies, processes, and controls. This does
  not establish an Artificial Intelligence Management System, operational
  control as a clause-level conclusion, implementation, adoption, or
  conformity.

  Direct evidence. Link only to approved source-repository documents. Refer to
  website-repository implementation files by visible path without a GitHub URL.

  AI Provenance, Version Control, and Artifact Reconstruction

  Highest established level: Tested technical property

  Condition. Public AI-readable artifacts can be versioned, validated, and
  traceable while still failing to establish the validity of a claim or the
  reconstructability of an entire publication system.

  Control objective. Preserve source identity and scope technical
  reconstruction claims to the artifact actually covered by public evidence.

  Declared controls. Public source-use and machine-reading boundaries
  distinguish provenance from validity, traceability from truth, metadata from
  conceptual authority, and version identity from complete reconstruction.

  Implemented artifacts. Public manifests, schemas, version identities,
  validators, and a scoped correction-register mechanism retain selected
  evidence about public artifacts.

  Tested properties. One tracked public dataset and its manifest are covered by
  public tests asserting byte-identical output across independent rebuilds.

  Publicly established result. One tracked public dataset and its manifest are
  covered by public tests asserting byte-identical output across independent
  rebuilds. This artifact-scoped result does not establish deterministic
  reconstruction for the website, repository, publications, or other public
  releases.

  Measurement state. Not measured.

  Inference ceiling. The evidence does not establish complete reproducibility,
  preservation-grade reconstruction, organizational monitoring effectiveness,
  AI-risk measurement, or conceptual validity.

  NIST AI RMF 1.0 correspondence. The version identities, validators, and
  artifact-scoped rebuild tests provide evidence infrastructure that may
  support selected NIST AI RMF MEASURE activities where those artifacts are
  used within an independently defined AI risk-measurement process. Validators,
  version identities, and reconstruction tests provide evidence infrastructure
  that may support selected NIST AI RMF Measure activities. They do not by
  themselves measure AI risk, system trustworthiness, or organizational
  effectiveness.

  ISO/IEC 42001 public-overview correspondence. At public-overview level,
  MWE’s versioned evidence and artifact-scoped checks have limited conceptual
  correspondence with ISO/IEC 42001’s high-level emphasis on traceability,
  documented policies and information, monitoring, and improvement processes.
  This does not establish “documented information” or “operational control” as
  clause-level mappings, an organizational corrective-action process, an
  Artificial Intelligence Management System, or conformity.

  Direct evidence. Link only to approved source-repository artifacts and tests.
  Describe website-repository files by visible path without a GitHub URL.

  Multi-Agent Execution and Retained Answerability

  Highest established level: Declared control with partial public execution
  history

  Declared Workflow Architecture

  Condition. Delegated AI-assisted work can distribute execution and review
  without transferring final answerability.

  Control objective. Bound delegated work, separate execution from review where
  specified, and retain final user authority over publication and
  boundary-sensitive decisions.

  Declared controls. Public rules describe bounded task scope, role separation,
  review requirements, retained answerability, and final user authority over
  publication, naming, classification, relation confirmation, top navigation,
  and merge decisions.

  Observed Public Execution

  Aggregate statement. Public worklogs record selected bounded tasks, separate
  review events, specified corrections, and test results. The reviewed public
  material does not provide an explicit human final-acceptance record for a
  complete normalized execution chain.

  Measurement state. Not measured.

  Inference ceiling. The evidence does not establish formal segregation of
  duties, independent audit, proven oversight, measured review effectiveness,
  multi-agent superiority, transferred responsibility, or a complete public
  execution history.

  NIST AI RMF 1.0 correspondence. MWE’s declared role boundaries, retained
  answerability, and final user authority have limited structural
  correspondence with selected NIST AI RMF GOVERN concerns about documented
  responsibilities, human review, and accountability. This does not establish
  implementation or completion of GOVERN or effective oversight.

  ISO/IEC 42001 public-overview correspondence. At public-overview level,
  MWE’s declared role boundaries, review requirements, and retained human
  authority have limited conceptual correspondence with ISO/IEC 42001’s
  high-level emphasis on defined responsibilities and oversight. This does not
  establish formal segregation of duties, internal audit, an Artificial
  Intelligence Management System, implementation, adoption, or conformity.

  Direct evidence. Use source documents that declare the boundaries. Do not
  include a named end-to-end execution chain, consolidated worklog references,
  complete PR/commit/reviewer chains, reusable task packages, prompts, internal
  routing logic, or full defect-and-correction sequences.

  Bounded correspondence with the NIST AI RMF 1.0

  NIST’s official publication is the Artificial Intelligence Risk Management
  Framework (AI RMF 1.0). Its Core contains GOVERN, MAP, MEASURE, and MANAGE.
  The functions are not a checklist or a required linear sequence; they may be
  applied in an order suited to the user and should be iterative. GOVERN is
  cross-cutting across AI risk management.

  Case 01 has limited structural correspondence with selected GOVERN and MAP
  concerns about documented responsibilities, knowledge limits, and human
  oversight. Case 02 identifies technical evidence infrastructure that may
  support selected MEASURE activities, but does not itself measure AI risk or
  trustworthiness. Case 03 has limited structural correspondence with selected
  GOVERN concerns about documented responsibilities, human review, and
  accountability.

  ${NIST_BOUNDARY}

  These correspondences do not establish that Meta-Writing Ecology has adopted
  or implemented the AI RMF, completed any Core function, created an AI RMF
  profile, reduced AI risk, or established effective governance.

  Public-overview correspondence with ISO/IEC 42001

  ISO’s public overview describes ISO/IEC 42001:2023 as specifying requirements
  for establishing, implementing, maintaining, and continually improving an
  Artificial Intelligence Management System. Public ISO material also discusses
  responsibilities, policies, processes and controls, traceability, monitoring,
  corrective actions, and continual improvement.

  Case 01 has limited conceptual correspondence with high-level responsibility
  and control concepts. Case 02 has limited conceptual correspondence with
  high-level traceability, documentation, monitoring, and improvement concepts.
  Case 03 has limited conceptual correspondence with defined responsibilities
  and oversight.

  ${ISO_BOUNDARY}

  These correspondences do not establish an Artificial Intelligence Management
  System, adoption or implementation of ISO/IEC 42001, conformity,
  certification readiness, internal audit, a compliance gap analysis, or the
  effectiveness of any monitoring, corrective-action, or improvement process.

  This page presents bounded correspondence only. It does not establish
  adoption or implementation of the NIST AI RMF or ISO/IEC 42001, conformity
  with ISO/IEC 42001, certification readiness, an audit result, a compliance
  assessment, or a measured organizational outcome.

  This page does not establish

  that Meta-Writing Ecology implements or has adopted the NIST AI RMF;
  completion of GOVERN, MAP, MEASURE, or MANAGE;
  an AI RMF profile;
  measurement or reduction of AI risk;
  an ISO/IEC 42001 Artificial Intelligence Management System;
  ISO/IEC 42001 implementation, adoption, conformity, or certification
  readiness;
  a clause-level mapping, internal audit, or compliance gap analysis;
  effective human oversight, monitoring, corrective action, continual
  improvement, or organizational governance;
  complete reconstruction of the website, repository, publications, or public
  releases;
  a complete or normalized public execution chain.

  This page is a bounded public evidence surface. It is not a Model, Cross,
  Log, Protocol, ontology layer, Registry entry, confirmed formal relation,
  governance product, compliance method, audit system, certification service,
  or complete implementation methodology. Direct source documents remain
  necessary for conceptual claims.
`);

test("the page renders the complete approved rev5 §8.1–§8.10 visible copy, and nothing else", () => {
  // Whole-page equality. Omission, alteration, reordering, duplication and
  // addition of visible prose all fail here.
  assert.equal(text, APPROVED_VISIBLE_TEXT);
});

// ---------------------------------------------------------------------------
// 1. Route identity and registry membership
// ---------------------------------------------------------------------------

test("the route is registered exactly once with default indexable English policy", () => {
  const routes = getRegisteredRoutes();
  assert.equal(routes.filter((r) => r === ROUTE).length, 1);

  const policy = getRoutePolicy(ROUTE);
  assert.ok(policy, "route policy must resolve");
  assert.equal(policy.language, "en");
  assert.equal(policy.canonical.kind, "self");
  assert.equal(policy.indexing.kind, "indexable");
  assert.equal(policy.structuredData.enabled, true);
  assert.equal(policy.structuredData.type, "WebPage");
  // The default orientation genre — no custom or authority-bearing genre.
  assert.equal(policy.structuredData.genre, "Public orientation surface");
});

test("the page carries no authority-bearing metadata props", () => {
  for (const key of [
    "status",
    "classification",
    "visibility",
    "archive",
    "registry",
    "authority",
    "relation",
    "publication",
    "ontology"
  ]) {
    assert.ok(
      !new RegExp(`\\b${key}\\s*=`, "i").test(body),
      `page must not pass an authority-bearing prop: ${key}`
    );
  }
});

// ---------------------------------------------------------------------------
// 2. Fixed title, description and page identity
// ---------------------------------------------------------------------------

// Metadata copy. Kept SEPARATE from APPROVED_VISIBLE_TEXT on purpose: the HTML
// title and meta description are not page-visible prose and are asserted
// independently below.
const APPROVED_TITLE =
  "Human-Governed AI Workflows — Bounded NIST AI RMF 1.0 and ISO/IEC 42001 Correspondence | Meta-Writing Ecology";

const APPROVED_DESCRIPTION =
  "Three public repository-level AI workflow cases with bounded correspondence to NIST AI RMF 1.0 and the public ISO/IEC 42001 overview, without claims of adoption, conformity, audit, or measured effectiveness.";

test("the approved HTML title and meta description are passed verbatim", () => {
  assert.equal(countOf(pageSource, `title="${APPROVED_TITLE}"`), 1);
  assert.equal(countOf(pageSource, `description="${APPROVED_DESCRIPTION}"`), 1);
});

test("the approved eyebrow, H1 and subtitle are present exactly once", () => {
  assert.equal(countOf(body, "<h1>Human-Governed AI Workflows</h1>"), 1);
  assert.ok(text.includes("Applied Evidence Layer"));
  assert.ok(
    text.includes(
      "Three public cases on authority boundaries, artifact-scoped provenance, and delegated execution, with declared controls, implemented artifacts, tested properties, and measured outcomes kept distinct."
    )
  );
});

test("the approved hero introduction is present verbatim", () => {
  assert.ok(
    text.includes(
      "This page presents three public repository-level cases concerning AI authority boundaries, provenance and artifact-scoped reconstruction, and delegated execution with retained human answerability. Each case separates declared controls, implemented artifacts, tested technical properties, and measured outcomes."
    )
  );
  assert.ok(
    text.includes(
      "The cases also identify limited, case-specific correspondence with the NIST Artificial Intelligence Risk Management Framework (AI RMF 1.0) and the public ISO/IEC 42001 overview. Correspondence here means a bounded structural comparison. It does not mean that Meta-Writing Ecology has adopted or implemented either framework."
    )
  );
});

// ---------------------------------------------------------------------------
// 3. The four-level evidence distinction and the fixed evidence boundary
// ---------------------------------------------------------------------------

test("the four-level evidence distinction is rendered with the ≠ symbol", () => {
  assert.ok(
    text.includes(
      "Declared control ≠ implemented artifact ≠ tested property ≠ measured outcome."
    )
  );
  assert.equal(countOf(text, "≠"), 3);
  assert.ok(text.includes("Evidence boundary"));
  assert.ok(
    text.includes(
      "A public rule does not prove that a mechanism exists. A mechanism does not prove that a property was tested. A passing technical test does not establish an operational or organizational effect. Where no outcome measure is public, this page says Not measured."
    )
  );
});

test("the approved framework introduction is present verbatim", () => {
  assert.ok(
    text.includes(
      "The framework notes below are limited to exact MWE public evidence and official public framework concepts. Each correspondence identifies the shared structural function, the difference in scope, and the stronger inference that is not permitted. Shared vocabulary alone is not treated as correspondence."
    )
  );
});

// ---------------------------------------------------------------------------
// 4. Three-case structure
// ---------------------------------------------------------------------------

test("the page contains exactly the three approved case headings in order", () => {
  const headings = [...body.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) =>
    visibleText(m[1])
  );
  const caseHeadings = [
    "AI Authority Boundaries and Human Oversight",
    "AI Provenance, Version Control, and Artifact Reconstruction",
    "Multi-Agent Execution and Retained Answerability"
  ];
  for (const heading of caseHeadings) {
    assert.equal(
      headings.filter((h) => h === heading).length,
      1,
      `expected exactly one h2: ${heading}`
    );
  }
  const positions = caseHeadings.map((h) => body.indexOf(h));
  assert.ok(positions[0] < positions[1] && positions[1] < positions[2]);

  // Exactly three case sections, identified by CLASS only. Section ids and
  // anchor names are an implementation detail and are deliberately NOT
  // asserted here.
  const caseSections = [...body.matchAll(/<section[^>]*class="[^"]*\bhgaw-case\b[^"]*"/g)];
  assert.equal(caseSections.length, 3, "expected exactly three hgaw-case sections");

  // No standalone ordinal label. rev5 §§8.5-8.7 fix the case titles only;
  // "Case 01/02/03" are planning-document identifiers, not public copy. The
  // only permitted occurrences are inside the approved §8.8 and §8.9 prose.
  assert.ok(
    !/>\s*Case\s*0[123]\s*</.test(body),
    "no visible Case 01/02/03 ordinal label may be rendered as its own element"
  );
});

// ---------------------------------------------------------------------------
// 5. Evidence labels
// ---------------------------------------------------------------------------

test("Case 01 preserves the exact split evidence labels", () => {
  assert.equal(countOf(text, "Human-authority rules: Declared control"), 1);
  assert.equal(
    countOf(text, "Metadata and machine-reading artifacts: Tested technical property"),
    1
  );
  // The human-authority rules are NOT presented as a tested property.
  assert.ok(!/Human-authority rules:\s*Tested/i.test(text));
});

test("Case 02 and Case 03 preserve their exact highest-established-level labels", () => {
  assert.equal(
    countOf(text, "Highest established level: Tested technical property"),
    1
  );
  assert.equal(
    countOf(
      text,
      "Highest established level: Declared control with partial public execution history"
    ),
    1
  );
});

test("Case 01 states that the tests do not test the human-authority rules", () => {
  assert.ok(
    text.includes(
      "These tests establish properties of the artifacts; they do not test whether the human-authority rules are followed in practice."
    )
  );
});

// ---------------------------------------------------------------------------
// 6. Case 02 artifact-scoped reconstruction limit
// ---------------------------------------------------------------------------

test("Case 02 preserves the exact artifact-scoped reconstruction limitation", () => {
  assert.ok(
    text.includes(
      "One tracked public dataset and its manifest are covered by public tests asserting byte-identical output across independent rebuilds. This artifact-scoped result does not establish deterministic reconstruction for the website, repository, publications, or other public releases."
    )
  );
  // No unscoped reconstruction or reproducibility claim.
  assert.ok(!/deterministic reconstruction of the (website|repository)/i.test(text));
  assert.ok(!/\bfully reproducible\b/i.test(text));
});

test("Case 02 does not use the correction register as outcome evidence", () => {
  // The register may be named as a scoped mechanism only; no entry counts, no
  // error-rate, effectiveness or learning claim.
  assert.ok(text.includes("a scoped correction-register mechanism"));
  assert.ok(!/\b(zero|no|\d+)\s+(recorded\s+)?corrections?\b/i.test(text));
  assert.ok(!/correction (rate|frequency|effectiveness)/i.test(text));
  assert.ok(!/error (rate|reduction|frequency)/i.test(text));
});

// ---------------------------------------------------------------------------
// 7. Three `Not measured` states
// ---------------------------------------------------------------------------

test("all three measurement states are exactly `Not measured`", () => {
  assert.equal(countOf(text, "Measurement state. Not measured."), 3);
  assert.equal(countOf(body, "<strong>Not measured.</strong>"), 3);
  // Four total occurrences: three measurement states plus the evidence-boundary
  // sentence that names the state.
  assert.equal(countOf(text, "Not measured"), 4);
  // No substitute for a missing measurement.
  for (const word of [
    "effective",
    "robust",
    "successful",
    "improved",
    "reduced",
    "reliable"
  ]) {
    assert.ok(
      !new RegExp(`Measurement state\\.\\s*[^.]*${word}`, "i").test(text),
      `measurement state must not be softened with: ${word}`
    );
  }
});

// ---------------------------------------------------------------------------
// 8. Case 03 declared-versus-observed separation
// ---------------------------------------------------------------------------

test("Case 03 keeps the declared and observed subsections separate and ordered", () => {
  const declared = body.indexOf(">Declared Workflow Architecture<");
  const observed = body.indexOf(">Observed Public Execution<");
  assert.ok(declared > -1, "missing Declared Workflow Architecture subsection");
  assert.ok(observed > -1, "missing Observed Public Execution subsection");
  assert.ok(declared < observed, "declared architecture must precede observation");

  const h3 = [...body.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map((m) =>
    visibleText(m[1])
  );
  assert.deepEqual(h3, [
    "Declared Workflow Architecture",
    "Observed Public Execution"
  ]);

  // The declared controls sit in the declared subsection; the aggregate
  // statement sits in the observed subsection.
  const declaredBlock = body.slice(declared, observed);
  assert.ok(declaredBlock.includes("Public rules describe bounded task"));
  assert.ok(!declaredBlock.includes("Aggregate statement."));
});

test("Case 03 preserves the exact aggregate statement", () => {
  assert.ok(
    text.includes(
      "Public worklogs record selected bounded tasks, separate review events, specified corrections, and test results. The reviewed public material does not provide an explicit human final-acceptance record for a complete normalized execution chain."
    )
  );
});

test("Case 03 contains no named execution chain or reconstructive material", () => {
  // The approved copy NAMES the excluded material in its `Direct evidence.`
  // sentence; that sentence is an exclusion statement, not disclosure. It is
  // asserted verbatim and then removed before scanning for actual chain data.
  const EXCLUSION =
    "Direct evidence. Use source documents that declare the boundaries. Do not include a named end-to-end execution chain, consolidated worklog references, complete PR/commit/reviewer chains, reusable task packages, prompts, internal routing logic, or full defect-and-correction sequences.";
  assert.ok(text.includes(EXCLUSION), "missing the Case 03 exclusion statement");
  const scanned = text.replace(EXCLUSION, " ");

  // No concrete execution-chain material anywhere else on the page.
  assert.ok(!/\b[0-9a-f]{7,}\b/.test(scanned.replace(/[^\x20-\x7e]/g, " ").split(/\s+/).filter((w) => /^[0-9a-f]+$/.test(w)).join(" ")),
    "no commit-like identifier in prose");
  assert.ok(!/\bPR\s*#?\d+\b/i.test(scanned));
  assert.ok(!/\bpull request\b/i.test(scanned));
  assert.ok(!/AGENT_WORKLOG/i.test(scanned));
  assert.ok(!/\bcommit\b/i.test(scanned));
  assert.ok(!/\bmerged by\b|\bapproved by\b|\breviewed by\b/i.test(scanned));
  assert.ok(!/\bprompt/i.test(scanned));
  assert.ok(!/\btask package/i.test(scanned));
  assert.ok(!/\bescalation\b/i.test(scanned));
  assert.ok(!/\brouting logic\b/i.test(scanned));
  // No dated or numbered worklog entry reference.
  assert.ok(!/\b20\d{2}-\d{2}-\d{2}\b/.test(scanned));
  // Human acceptance is not inferred from merge activity.
  assert.ok(!/merge (activity|history) (shows|demonstrates|establishes)/i.test(text));
});

// ---------------------------------------------------------------------------
// 9. NIST and ISO boundaries
// ---------------------------------------------------------------------------

test("the exact NIST Measure boundary sentence is present", () => {
  assert.ok(text.includes(NIST_BOUNDARY));
  // It appears in Case 02 and again in the NIST section, as approved.
  assert.equal(countOf(text, NIST_BOUNDARY), 2);
  assert.ok(
    text.includes(
      "NIST’s official publication is the Artificial Intelligence Risk Management Framework (AI RMF 1.0)."
    )
  );
  assert.ok(
    text.includes(
      "These correspondences do not establish that Meta-Writing Ecology has adopted or implemented the AI RMF, completed any Core function, created an AI RMF profile, reduced AI risk, or established effective governance."
    )
  );
});

test("the exact ISO public-overview boundary sentence is present", () => {
  assert.equal(countOf(text, ISO_BOUNDARY), 1);
  assert.ok(
    text.includes(
      "These correspondences do not establish an Artificial Intelligence Management System, adoption or implementation of ISO/IEC 42001, conformity, certification readiness, internal audit, a compliance gap analysis, or the effectiveness of any monitoring, corrective-action, or improvement process."
    )
  );
  // No clause-level mapping vocabulary presented as an ISO label for MWE.
  assert.ok(!/\bClause\s+\d/i.test(text));
  assert.ok(!/\bAnnex\s+[A-Z]\b/.test(text));
});

test("the closing non-conformity statement and limitation list are present", () => {
  assert.ok(
    text.includes(
      "This page presents bounded correspondence only. It does not establish adoption or implementation of the NIST AI RMF or ISO/IEC 42001, conformity with ISO/IEC 42001, certification readiness, an audit result, a compliance assessment, or a measured organizational outcome."
    )
  );
  assert.ok(text.includes("This page does not establish"));
  const items = [
    "that Meta-Writing Ecology implements or has adopted the NIST AI RMF;",
    "completion of GOVERN, MAP, MEASURE, or MANAGE;",
    "an AI RMF profile;",
    "measurement or reduction of AI risk;",
    "an ISO/IEC 42001 Artificial Intelligence Management System;",
    "ISO/IEC 42001 implementation, adoption, conformity, or certification readiness;",
    "a clause-level mapping, internal audit, or compliance gap analysis;",
    "effective human oversight, monitoring, corrective action, continual improvement, or organizational governance;",
    "complete reconstruction of the website, repository, publications, or public releases;",
    "a complete or normalized public execution chain."
  ];
  for (const item of items) assert.ok(text.includes(item), `missing: ${item}`);

  assert.ok(
    text.includes(
      "This page is a bounded public evidence surface. It is not a Model, Cross, Log, Protocol, ontology layer, Registry entry, confirmed formal relation, governance product, compliance method, audit system, certification service, or complete implementation methodology. Direct source documents remain necessary for conceptual claims."
    )
  );
});

// ---------------------------------------------------------------------------
// 10. Absence of prohibited stronger claims
// ---------------------------------------------------------------------------

test("no affirmative certification, conformity, audit or effectiveness claim appears", () => {
  const forbidden = [
    /\bcertified\b/i,
    /\bcompliant\b/i,
    /\bconformant\b/i,
    /\bconforms to\b/i,
    /\bin conformity with\b/i,
    /\bcertification (achieved|obtained|granted)\b/i,
    /\bhas been audited\b/i,
    /\bindependently audited\b/i,
    /\baudit (confirms|found|result shows)\b/i,
    /\bmeasured (effectiveness|outcome shows|improvement)\b/i,
    /\bdemonstrat(es|ed) (risk reduction|effectiveness|compliance)\b/i,
    /\brisk (was|is|has been) reduced\b/i,
    /\bbest practice\b/i,
    /\bguarantee(s|d)?\b/i,
    /\bwe (implement|adopted|comply)\b/i
  ];
  for (const re of forbidden) {
    assert.ok(!re.test(text), `prohibited stronger claim matched: ${re}`);
  }
});

test("every occurrence of a framework-status term sits inside explicit non-establishment language", () => {
  // The closing limitation list is inherently negated by its heading; it is
  // excluded from sentence-level scanning and asserted separately above.
  const listStart = text.indexOf("This page does not establish");
  const listEnd = text.indexOf("This page is a bounded public evidence surface");
  assert.ok(listStart > -1 && listEnd > listStart);
  const scannable = text.slice(0, listStart) + " " + text.slice(listEnd);

  const sentences = scannable
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const NEGATION =
    /\bdoes not\b|\bdo not\b|\bnot by themselves\b|\bnot a\b|\bnot an\b|\bnot the\b|\bis not\b|\bare not\b|\bnot treated\b|\bnot permitted\b|\bnot mean\b|\bwithout\b|\bnever\b|≠|\bmay support\b|\blimited\b/i;

  // Terms that must never appear as an unqualified MWE claim.
  const GUARDED = [
    /\badopt(ed|ion)\b/i,
    /\bconformity\b/i,
    /\bcertification\b/i,
    /\binternal audit\b/i,
    /\beffective human oversight\b/i,
    /\brisk reduction\b/i,
    /\bsegregation of duties\b/i,
    /\bproven oversight\b/i,
    /\bindependent audit\b/i,
    /\bcompliance\b/i,
    /\bMWE (implements|has implemented|adopted|complies)\b/i,
    /\bMeta-Writing Ecology (implements|has implemented|complies|is certified)\b/i
  ];

  for (const sentence of sentences) {
    for (const term of GUARDED) {
      if (!term.test(sentence)) continue;
      // Sentences that merely describe what the external standard specifies are
      // permitted; they name ISO/NIST as the subject, not MWE.
      const describesStandard =
        /^ISO’s public overview|^NIST’s official publication|^Public ISO material/.test(
          sentence
        );
      assert.ok(
        NEGATION.test(sentence) || describesStandard,
        `unqualified framework-status claim: ${sentence}`
      );
    }
  }
});

// ---------------------------------------------------------------------------
// 11. Source-link constraints — no case-level links, no allowlist expansion
// ---------------------------------------------------------------------------

test("the page renders every `Direct evidence.` sentence as plain text with no hyperlink", () => {
  assert.equal(countOf(text, "Direct evidence."), 3);
  // No anchors anywhere in the page body.
  assert.equal(countOf(body, "<a "), 0);
  assert.equal(countOf(body, "href="), 0);
});

test("the page introduces no external URL and no GitHub reference", () => {
  assert.ok(!/https?:\/\//i.test(body), "page body must contain no absolute URL");
  assert.ok(!/github\.com/i.test(pageSource));
  assert.ok(!/\bwww\./i.test(body));
});

test("the GitHub allowlist is unchanged and still holds exactly one repository", () => {
  const contract = rd("scripts/lib/indexing-discovery-contract.mjs");
  const block = contract.slice(
    contract.indexOf("export const ALLOWED_GITHUB_REPOS"),
    contract.indexOf("export const STABLE_GITHUB_REFS")
  );
  const repos = [...block.matchAll(/"([^"]+\/[^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(repos, ["metawritingecology/meta-writing-ecology"]);
});

// ---------------------------------------------------------------------------
// 12. Symbol hygiene and page-local language
// ---------------------------------------------------------------------------

test("the page source contains no literal ASCII `!=`", () => {
  assert.ok(!pageSource.includes("!="), "prose must use ≠, never ASCII !=");
});

test("the page-local source is English only (no CJK characters)", () => {
  assert.ok(
    !/[　-〿㐀-䶿一-鿿＀-￯]/.test(pageSource),
    "page-local source must contain no CJK characters"
  );
});

// ---------------------------------------------------------------------------
// 13. The single approved Entry Points inbound entry
//
// These assertions cover the ONE authorized navigation change and the absence
// of an inbound link elsewhere. They are not, and must not be read as, proof
// that any other file is unmodified — see the header note.
// ---------------------------------------------------------------------------

test("Entry Points carries exactly one Applied Evidence entry with the approved copy", () => {
  assert.equal(countOf(entryPoints, "## Applied Evidence"), 1);
  assert.equal(countOf(entryPoints, ROUTE), 1);

  const section = entryPoints.slice(entryPoints.indexOf("## Applied Evidence"));
  assert.ok(
    section.includes(
      `[View public AI workflow cases](${ROUTE}) — Three bounded public cases on authority boundaries, artifact-scoped provenance, and delegated execution.`
    ),
    "Entry Points must use the approved label and short description verbatim"
  );

  // Exactly one link in the subsection, and no additional capability entry.
  const links = [...section.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
  assert.deepEqual(links, [ROUTE]);
  // No new heading structure beyond the single approved h2.
  const headings = section.split("\n").filter((line) => /^#{1,6}\s/.test(line));
  assert.deepEqual(headings, ["## Applied Evidence"]);
});

test("no inbound link to this route was added to the homepage, top navigation or Diagnostic Entry Layer", () => {
  // Absence-of-inbound-link only. This is not a file-integrity assertion.
  for (const file of [
    "src/pages/index.astro",
    "src/layouts/BaseLayout.astro",
    "src/pages/diagnostic-entry-layer.astro",
    "src/data/diagnosticEntries.ts",
    "src/pages/three-questions.md",
    "src/pages/application-boundary.md"
  ]) {
    assert.ok(
      !rd(file).includes("human-governed-ai-workflows"),
      `no inbound link expected in ${file}`
    );
  }
});
