// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here.
//
// Bounded semantic + placement tests for the semantic-flow corrections and the
// three public source entries. Node 22 built-in test runner + assert only (no
// added dependency). Reads the actual page and layout source files.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const rd = (rel: string) => readFileSync(fileURLToPath(new URL(rel, root)), "utf8");

const models = rd("src/pages/models.md");
const publications = rd("src/pages/publications.md");
const entryPoints = rd("src/pages/entry-points.md");
const surfaces = rd("src/pages/surfaces.md");
const publicRecords = rd("src/pages/public-records.md");
const baseLayout = rd("src/layouts/BaseLayout.astro");

const sectionBody = (markdown: string, heading: string) => {
  const start = markdown.indexOf(heading);
  assert.notEqual(start, -1, `missing section heading: ${heading}`);
  const level = heading.match(/^#+/)?.[0].length ?? 0;
  const bodyStart = start + heading.length;
  const remainder = markdown.slice(bodyStart);
  const nextHeading = remainder.match(new RegExp(`^#{1,${level}}\\s`, "m"));
  return nextHeading?.index === undefined ? remainder : remainder.slice(0, nextHeading.index);
};

const countOccurrences = (text: string, value: string) => text.split(value).length - 1;

const entryLine = (section: string, title: string) => {
  const line = section.split("\n").find((candidate) => candidate.includes(title));
  assert.ok(line, `entry is not present in its approved section: ${title}`);
  return line;
};

const modelsEntrySection = sectionBody(models, "### Selected Boundary Notes / Protocol-Facing Notes");
const publicationsEntrySection = sectionBody(publications, "## Selected Source-Linked DOI Records");
const entryPointsEntrySection = sectionBody(entryPoints, "### Boundary-Oriented Source Routes");

// Canonical entry data.
const ENTRIES = {
  delegated: {
    title: "Delegated Execution / Retained Answerability",
    source:
      "https://github.com/metawritingecology/meta-writing-ecology/blob/main/delegated-execution-retained-answerability.md",
    classification: "Cross-Supporting Boundary Note",
    doi: "https://doi.org/10.17605/OSF.IO/6M95U",
  },
  fidelity: {
    title: "Structural Fidelity / Use-Validity Boundary",
    source:
      "https://github.com/metawritingecology/meta-writing-ecology/blob/main/structural-fidelity-use-validity-boundary.md",
    classification: "Cross-Supporting Boundary Note",
    doi: "https://doi.org/10.17605/OSF.IO/BU4KT",
  },
  llm: {
    title: "LLM-Condition / Research-Result Boundary",
    source:
      "https://github.com/metawritingecology/meta-writing-ecology/blob/main/llm-condition-research-result-boundary.md",
    classification: "Protocol-Facing Boundary Note",
    doi: "https://doi.org/10.17605/OSF.IO/47PXB",
  },
};

// ---------------------------------------------------------------------------
// Semantic tests
// ---------------------------------------------------------------------------

test("models: classification-aware title and boundary present", () => {
  assert.match(models, /title: Models and Framework Documents/);
  assert.match(models, /# Models and Framework Documents/);
  assert.match(models, /## Classification and Model Boundary/);
  assert.match(models, /## Classification-Aware Framework Index/);
  assert.match(models, /Only source-visible materials are represented here/);
  assert.match(models, /not the full working corpus, complete Registry, private archive, or internal calibration layer/);
  assert.ok(!models.includes("professional methods"), "unapproved broad 'professional methods' wording present");
  for (const method of ["clinical methods", "legal methods", "financial methods"]) {
    assert.ok(models.includes(method), `specific method boundary missing: ${method}`);
  }
  // Old index heading is gone.
  assert.ok(!/## Model Index/.test(models), "stale '## Model Index' heading present");
});

test("publications: stale phrases are absent", () => {
  assert.ok(
    !publications.includes("GitHub-visible navigation ontology"),
    "stale 'GitHub-visible navigation ontology' present",
  );
  assert.ok(
    !publications.includes("Current Canonical Source DOI Records"),
    "stale 'Current Canonical Source DOI Records' present",
  );
  assert.match(publications, /## Selected Source-Linked DOI Records/);
});

test("entry-points: manual additions section removed", () => {
  assert.ok(
    !entryPoints.includes("Selected public corpus additions"),
    "stale 'Selected public corpus additions' list present",
  );
  assert.match(entryPoints, /## Source Reading Paths/);
  assert.equal(
    countOccurrences(entryPoints, "## Source Reading Paths"),
    1,
    "Source Reading Paths heading must occur exactly once",
  );
  assert.ok(
    !entryPoints.includes("## Source-Based Reading Paths"),
    "near-duplicate Source-Based Reading Paths section present",
  );
  assert.ok(
    sectionBody(entryPoints, "## Source Reading Paths").includes(
      "Earlier Medium companion texts remain legacy public surfaces",
    ),
    "Medium boundary sentence is not integrated into Source Reading Paths",
  );
});

test("surfaces: no individual recent-document list", () => {
  assert.ok(
    !surfaces.includes("Selected public source additions"),
    "stale 'Selected public source additions' list present",
  );
  assert.ok(
    surfaces.includes("They should not cause MWE to be summarized as a fictional universe."),
    "fictional-universe boundary missing",
  );
  assert.ok(
    surfaces.includes("The fiction, system, corpus, and platform surfaces"),
    "closing boundary does not use the four implemented surface labels",
  );
});

test("public-records: no individual DOI enumeration", () => {
  assert.ok(
    !publicRecords.includes("Current source DOI records including:"),
    "stale individual DOI enumeration present",
  );
  // No individual OSF DOI links remain in the anchor categories.
  assert.ok(
    !/doi\.org\/10\.17605\/OSF\.IO\//.test(publicRecords),
    "individual OSF DOI links present on public-records",
  );
  const categories = sectionBody(publicRecords, "## Public Anchor Categories");
  assert.equal(
    countOccurrences(categories, "[Publications and DOI Records](/publications/)"),
    1,
    "Public Anchor Categories contains duplicate Publications bullets",
  );
});

test("surfaces: platform surface present only if /platforms/ exists", () => {
  const hasPlatformsRoute = (() => {
    for (const routeFile of ["src/pages/platforms.md", "src/pages/platforms.mdx", "src/pages/platforms.astro"]) {
      try {
        readFileSync(fileURLToPath(new URL(routeFile, root)), "utf8");
        return true;
      } catch {
        // Try the next Astro-supported source extension.
      }
    }
    return false;
  })();
  if (hasPlatformsRoute) {
    assert.match(surfaces, /## Platform surface/);
  } else {
    assert.ok(!surfaces.includes("## Platform surface"), "Platform surface added without route");
  }
});

test("baseLayout: route-specific metadata for the four approved routes", () => {
  for (const route of ["/models/", "/publications/", "/entry-points/", "/public-records/"]) {
    assert.ok(baseLayout.includes(`"${route}":`), `missing schemaOverride for ${route}`);
  }
  // Existing /surfaces/ override preserved.
  assert.ok(baseLayout.includes('"/surfaces/":'), "existing /surfaces/ override removed");
  assert.match(baseLayout, /Classification-aware conceptual navigation/);
  assert.match(baseLayout, /Publication and citation record/);
  assert.match(baseLayout, /Thematic reading orientation/);
  assert.match(baseLayout, /Public-record summary/);
});

// ---------------------------------------------------------------------------
// Placement tests
// ---------------------------------------------------------------------------

for (const [key, e] of Object.entries(ENTRIES)) {
  test(`placement: ${key} appears on /models/ with exact title, source, classification, DOI`, () => {
    const line = entryLine(modelsEntrySection, e.title);
    assert.ok(line.includes(e.source), `source missing from models entry: ${e.source}`);
    assert.ok(line.includes(e.classification), `classification missing from models entry: ${e.classification}`);
    assert.ok(line.includes(e.doi), `DOI missing from models entry: ${e.doi}`);
  });

  test(`placement: ${key} appears on /publications/ with exact title, source, classification, DOI`, () => {
    const line = entryLine(publicationsEntrySection, e.title);
    assert.ok(line.includes(e.source), `source missing from publications entry: ${e.source}`);
    assert.ok(line.includes(e.classification), `classification missing from publications entry: ${e.classification}`);
    assert.ok(line.includes(e.doi), `DOI missing from publications entry: ${e.doi}`);
  });

  test(`placement: ${key} appears on /entry-points/ with exact title and source`, () => {
    const line = entryLine(entryPointsEntrySection, e.title);
    assert.ok(line.includes(e.source), `source missing from entry-points entry: ${e.source}`);
    assert.ok(line.includes(e.classification), `classification missing from entry-points entry: ${e.classification}`);
  });

  test(`placement: ${key} absent by title from /surfaces/ and /public-records/`, () => {
    assert.ok(!surfaces.includes(e.title), `entry named on surfaces: ${e.title}`);
    assert.ok(!publicRecords.includes(e.title), `entry named on public-records: ${e.title}`);
  });
}

test("entry-points: canonical Reading Paths wording present", () => {
  assert.match(
    entryPoints,
    /canonical \[Reading Paths\]\(https:\/\/github\.com\/metawritingecology\/meta-writing-ecology\/blob\/main\/model-atlas\/READING_PATHS\.md\)/,
  );
  assert.ok(
    entryPoints.includes("public navigation only"),
    "canonical Reading Paths navigation-only wording missing",
  );
});

// ---------------------------------------------------------------------------
// Guardrail test: LLM-Condition must not be over-described
// ---------------------------------------------------------------------------

test("guardrail: LLM-Condition is described only as a Protocol-Facing Boundary Note", () => {
  const forbidden = [
    "completed Protocol",
    "reporting standard",
    "checklist",
    "certification system",
    "compliance instrument",
    "complete operational method",
  ];
  for (const section of [modelsEntrySection, publicationsEntrySection, entryPointsEntrySection]) {
    const line = entryLine(section, "LLM-Condition / Research-Result Boundary");
    assert.ok(
      line.includes("Protocol-Facing Boundary Note"),
      `LLM-Condition line lacks 'Protocol-Facing Boundary Note': ${line}`,
    );
    for (const phrase of forbidden) {
      assert.ok(
        !section.toLowerCase().includes(phrase.toLowerCase()),
        `LLM-Condition section contains prohibited promotion phrase "${phrase}"`,
      );
    }
  }
});
