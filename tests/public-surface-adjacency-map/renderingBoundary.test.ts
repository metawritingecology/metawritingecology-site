// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// Expanded Public Surface Adjacency Map — P7.0 rendering-boundary guards.
//
// Phase 3A P7 splits into four packages. This file is the whole of P7.0: the
// thirteen policy and source-boundary guards, numbered 1–13, that must all pass
// against UNMODIFIED production code. P7.0 changes no production source, adds
// no dependency, and changes nothing a visitor sees.
//
// A guard here is a promise about what the adjacency-map product may never
// become — a Three.js scene, a WebGL or Canvas renderer, an embedded external
// runtime, an animated or randomised surface — plus a restatement of the
// semantic, security and accessibility guarantees the product already keeps.
//
// Two rules govern every guard, and both come from measurement rather than
// preference:
//
//   1. GUARDS SCAN PRODUCTION SOURCE ONLY. Test files are excluded, because the
//      existing tests legitimately contain forbidden tokens as ABSENCE
//      assertions; a repository-wide scan would flag the prohibition itself.
//   2. A GUARD THAT FAILS ON UNMODIFIED PRODUCTION CODE IS MIS-SCOPED, and the
//      guard is corrected — never the production source. Each guard below
//      therefore carries an explicit false-positive control documenting the
//      legitimate construct it must not flag.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

// The TypeScript compiler API is already a declared dependency of this
// repository (`dependencies.typescript`), so Guard 13 can inspect the sibling
// test file syntactically rather than textually. No dependency is added.
import ts from "typescript";

const root = new URL("../../", import.meta.url);
const p = (rel: string) => fileURLToPath(new URL(rel, root));
const rd = (rel: string) => readFileSync(p(rel), "utf8");

// ---------------------------------------------------------------------------
// The thirteen guards — canonical mapping table
// ---------------------------------------------------------------------------
//
// Guard number ← canonical P7.0 check number. Each row maps to exactly one
// `test("guard N — <title>")` below, and the integrity check that follows this
// table proves that mapping holds in this file's own source.

const P7_0_GUARDS = [
  { guard: 1, title: "no Three.js dependency", scope: "package.json + pnpm-lock.yaml" },
  { guard: 2, title: "no Three.js import specifier", scope: "production scan scope" },
  { guard: 3, title: "no WebGL renderer or context", scope: "production scan scope" },
  { guard: 4, title: "no Canvas graph", scope: "production scan scope" },
  { guard: 5, title: "no CodePen runtime reference", scope: "production scan scope" },
  { guard: 6, title: "no embedded external runtime surface", scope: "adjacency component + client" },
  { guard: 7, title: "no randomness", scope: "production scan scope" },
  { guard: 8, title: "no motion or timer architecture", scope: "production scan scope less runtimeLoader.ts" },
  { guard: 9, title: "dependency and lockfile boundary", scope: "package.json + pnpm-lock.yaml" },
  { guard: 10, title: "retained semantic and security guarantees", scope: "adjacency production surface" },
  { guard: 11, title: "no ResizeObserver", scope: "production scan scope" },
  { guard: 12, title: "no browser or DOM harness", scope: "package.json + lockfile + test configuration" },
  { guard: 13, title: "interaction assertions retargeted without semantic loss", scope: "interaction.test.ts + this file" },
];

// Integrity of the mapping itself, checked at load so a renumbered, duplicated,
// dropped or unregistered guard fails the run rather than silently shrinking
// the suite. `ownSource` is this file, read back and inspected as text.
const ownSource = readFileSync(fileURLToPath(import.meta.url), "utf8");

assert.deepEqual(
  P7_0_GUARDS.map((entry) => entry.guard),
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  "the P7.0 guard table must be contiguous 1–13, each number exactly once",
);
assert.equal(
  new Set(P7_0_GUARDS.map((entry) => entry.title)).size,
  P7_0_GUARDS.length,
  "guard titles must be unique",
);
assert.equal(
  [...ownSource.matchAll(/^test\("guard /gm)].length,
  13,
  "this file must register exactly 13 guard tests",
);
for (const { guard, title } of P7_0_GUARDS) {
  assert.ok(
    ownSource.includes(`test("guard ${guard} — ${title}"`),
    `guard ${guard} (${title}) has no matching test registration`,
  );
}

// ---------------------------------------------------------------------------
// Production scan scope
// ---------------------------------------------------------------------------
//
// Exactly the four adjacency-map production surfaces. Directory traversal is
// sorted at every level, so the scan order — and therefore every failure
// message — is deterministic across platforms and filesystems.

const walk = (rel: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(p(rel)).sort()) {
    const child = `${rel}/${entry}`;
    if (statSync(p(child)).isDirectory()) out.push(...walk(child));
    else out.push(child);
  }
  return out;
};

const ADJACENCY_LIB = "src/lib/public-surface-adjacency-map";
const ADJACENCY_CLIENT = "src/scripts/public-surface-adjacency-map.ts";
const ADJACENCY_COMPONENT = "src/components/PublicSurfaceAdjacencyMap.astro";
const ADJACENCY_PAGE = "src/pages/public-surface-map/expanded/index.astro";
const RUNTIME_LOADER = `${ADJACENCY_LIB}/runtimeLoader.ts`;

const PRODUCTION_SCOPE = [
  ...walk(ADJACENCY_LIB),
  ADJACENCY_CLIENT,
  ADJACENCY_COMPONENT,
  ADJACENCY_PAGE,
].sort();

const PRODUCTION_SOURCES = PRODUCTION_SCOPE.map((rel) => [rel, rd(rel)] as const);

/**
 * Every line in the production scan scope matching `pattern`, reported with a
 * repository-relative path and a 1-based line number. `exclude` drops whole
 * files, and is used by exactly one guard for exactly one documented reason.
 */
const scan = (pattern: string, options: { exclude?: string[]; only?: string[] } = {}): string[] => {
  const { exclude = [], only = null } = options;
  const hits: string[] = [];
  for (const [rel, source] of PRODUCTION_SOURCES) {
    if (exclude.includes(rel)) continue;
    if (only && !only.includes(rel)) continue;
    const lines = source.split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      if (new RegExp(pattern).test(lines[index])) {
        hits.push(`${rel}:${index + 1}: ${lines[index].trim()}`);
      }
    }
  }
  return hits;
};

const clean = (label: string, hits: string[]) =>
  assert.deepEqual(hits, [], `${label}\n  ${hits.join("\n  ")}`);

// The scope must never silently collapse to nothing: an empty or truncated file
// list would make every absence assertion below vacuously true.
assert.ok(PRODUCTION_SCOPE.length >= 10, "the production scan scope is unexpectedly small");
for (const required of [ADJACENCY_CLIENT, ADJACENCY_COMPONENT, ADJACENCY_PAGE, RUNTIME_LOADER]) {
  assert.ok(PRODUCTION_SCOPE.includes(required), `${required} is missing from the scan scope`);
}
for (const [rel, source] of PRODUCTION_SOURCES) {
  assert.ok(source.length > 0, `${rel} is empty`);
}

// ---------------------------------------------------------------------------
// Shared readers
// ---------------------------------------------------------------------------

const component = rd(ADJACENCY_COMPONENT);
const client = rd(ADJACENCY_CLIENT);
const page = rd(ADJACENCY_PAGE);
const layoutSource = rd(`${ADJACENCY_LIB}/layout.ts`);
const packageJson = JSON.parse(rd("package.json"));
const lockfile = rd("pnpm-lock.yaml");

// Raw bytes, never newline-normalised text: the lockfile identity below is a
// byte contract, so a line-ending rewrite or an appended whitespace byte must
// change the digest.
const LOCKFILE_BYTES = readFileSync(p("pnpm-lock.yaml"));

/** Authorized baseline `pnpm-lock.yaml` identity at 32f992d2…eed8. If this
 *  fails, the correct response is to restore the lockfile — never to update the
 *  expectation. */
const LOCKFILE_IDENTITY = {
  byteLength: 184577,
  sha256: "9da220e6781fa9bf636fe2f2540dd1a40dad2ed44a031afd86f099ab8c041719",
};

/**
 * Executable code only. These files deliberately NAME banned APIs and banned
 * concepts in prose to document the boundary they hold, so a raw substring scan
 * would flag the documentation instead of the implementation. Identical to the
 * stripper the existing authority-map boundary tests already use, plus HTML
 * comment removal for `.astro` sources.
 */
const stripComments = (source: string) =>
  source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/(^|[^:"'\\])\/\/.*$/, "$1"))
    .join("\n");

const layoutCode = stripComments(layoutSource);
const clientCode = stripComments(client);
const componentCode = stripComments(component);
const pageCode = stripComments(page);

// The stripper must leave executable code intact and must really remove prose,
// or every comment-stripped assertion below would be meaningless.
assert.ok(layoutCode.includes("export function computeRadialLayout"));
assert.ok(clientCode.includes("function enhance("));
assert.ok(componentCode.includes("{APPROVED_TITLE}"));
assert.ok(layoutSource.includes("centrality") && !layoutCode.includes("centrality"));
assert.ok(component.includes("server-rendered component.") && !componentCode.includes("server-rendered component."));

/**
 * Package names declared in `pnpm-lock.yaml`, at any depth. Entry keys are
 * parsed structurally — `name@version`, `@scope/name@version`, with any peer
 * suffix ignored — so matching is package-aware and never a substring search.
 */
const lockfilePackageNames = (): Set<string> => {
  const names = new Set<string>();
  let section: string | null = null;
  for (const line of lockfile.split("\n")) {
    const top = /^([a-zA-Z][\w-]*):\s*$/.exec(line);
    if (top) {
      section = top[1];
      continue;
    }
    if (section !== "packages" && section !== "snapshots" && section !== "importers") continue;
    const entry = /^ {2,6}('?)([^'\s][^:]*?)\1:\s*$/.exec(line);
    if (!entry) continue;
    const key = entry[2];
    const named = /^((?:@[^/@\s]+\/)?[^@\s]+)@/.exec(key);
    if (named) names.add(named[1]);
    else if (/^(?:@[^/@\s]+\/)?[a-zA-Z][\w.-]*$/.test(key)) names.add(key);
  }
  return names;
};

const LOCKFILE_PACKAGES = lockfilePackageNames();

// The lockfile parser must actually resolve packages. An empty or broken parse
// would make every "no prohibited package" assertion vacuously true.
assert.ok(
  LOCKFILE_PACKAGES.size >= 100,
  `the lockfile parser resolved only ${LOCKFILE_PACKAGES.size} package names`,
);
for (const known of ["astro", "d3-selection", "@astrojs/mdx", "wrangler", "typescript"]) {
  assert.ok(LOCKFILE_PACKAGES.has(known), `the lockfile parser did not resolve ${known}`);
}

/** Every module specifier a source imports, requires, or dynamically imports. */
const importSpecifiers = (source: string): string[] => {
  const found: string[] = [];
  for (const pattern of [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\bimport\s+["']([^"']+)["']/g,
  ]) {
    for (const match of source.matchAll(pattern)) found.push(match[1]);
  }
  return found;
};

/**
 * Syntax-aware inspection of a test file, via the TypeScript compiler API.
 *
 * Guard 13 requires each retained guarantee to appear inside an ACTIVE
 * assertion. A textual scanner cannot tell an assertion from a comment, a
 * string, a template literal or a regex that merely looks like one, so
 * commenting an assertion out left it counted. The parser can: only a real
 * `assert.<method>(…)` CallExpression inside a real `test(…)` callback is an
 * active assertion, and comments and literals are never call expressions.
 */
const inspectTestFile = (relativePath: string) => {
  const text = rd(relativePath);
  const source = ts.createSourceFile(
    relativePath,
    text,
    ts.ScriptTarget.ESNext,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );

  const activeAssertions = (node: ts.Node): string[] => {
    const found: string[] = [];
    const visit = (child: ts.Node): void => {
      if (
        ts.isCallExpression(child) &&
        ts.isPropertyAccessExpression(child.expression) &&
        ts.isIdentifier(child.expression.expression) &&
        child.expression.expression.text === "assert"
      ) {
        found.push(text.slice(child.getStart(source), child.getEnd()));
      }
      ts.forEachChild(child, visit);
    };
    ts.forEachChild(node, visit);
    return found;
  };

  const tests: { title: string; assertions: string[] }[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "test" &&
      node.arguments.length >= 2 &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      tests.push({
        title: node.arguments[0].text,
        assertions: activeAssertions(node.arguments[1]),
      });
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(source, visit);

  return { text, tests, assertions: tests.flatMap((entry) => entry.assertions) };
};

/**
 * Slice one `export function <name>(…) { … }` body out of the layout module by
 * matching braces. Returned text is EXECUTABLE code: comments are already gone,
 * because the slice is taken from the comment-stripped source.
 */
const layoutFunctionBody = (name: string): string => {
  const start = layoutCode.indexOf(`export function ${name}(`);
  assert.notEqual(start, -1, `layout.ts must export ${name}`);
  const open = layoutCode.indexOf("{", layoutCode.indexOf(")", start));
  assert.notEqual(open, -1, `no body for ${name}`);
  let depth = 0;
  for (let i = open; i < layoutCode.length; i += 1) {
    if (layoutCode[i] === "{") depth += 1;
    else if (layoutCode[i] === "}") {
      depth -= 1;
      if (depth === 0) return layoutCode.slice(open, i + 1);
    }
  }
  return assert.fail(`unbalanced braces in ${name}`);
};

/**
 * Slice one `<target>.addEventListener("<type>", …)` body out of the client by
 * matching braces, then drop comment lines. Everything returned is EXECUTABLE
 * code, so no assertion over it can be satisfied by a comment.
 */
const listenerBody = (source: string, target: string, type: string): string => {
  const start = source.indexOf(`${target}.addEventListener("${type}"`);
  assert.notEqual(start, -1, `no ${target}.addEventListener("${type}") call found`);
  const open = source.indexOf("{", source.indexOf("=>", start));
  assert.notEqual(open, -1, `no arrow body for the ${target} ${type} listener`);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return stripComments(source.slice(open, i + 1));
    }
  }
  return assert.fail(`unbalanced braces in the ${target} ${type} listener`);
};

// ---------------------------------------------------------------------------
// Guard 1 — no Three.js dependency
// ---------------------------------------------------------------------------

const isThreePackage = (name: string) =>
  name === "three" || name.startsWith("three/") || name.startsWith("@react-three/");

test("guard 1 — no Three.js dependency", () => {
  // False-positive control: the check is STRUCTURAL, over package-name keys. A
  // substring scan for "three" matches legitimate repository content such as
  // `three-questions.md` and `the-central-naming-tower.md`, and would fail on
  // unmodified `main` today.
  assert.ok(isThreePackage("three"));
  assert.ok(isThreePackage("@react-three/fiber"));
  assert.ok(!isThreePackage("three-questions"));
  assert.ok(!isThreePackage("the-central-naming-tower"));
  assert.ok(!isThreePackage("@types/three-questions"));

  const declared = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ];
  assert.ok(declared.length > 0, "no declared packages were read");
  assert.deepEqual(declared.filter(isThreePackage), []);

  // …and no prohibited entry exists at any depth in the lockfile, matched
  // against parsed package names rather than raw file text.
  assert.deepEqual([...LOCKFILE_PACKAGES].filter(isThreePackage).sort(), []);
});

// ---------------------------------------------------------------------------
// Guard 2 — no Three.js import specifier
// ---------------------------------------------------------------------------

test("guard 2 — no Three.js import specifier", () => {
  // False-positive control: only real module specifiers are inspected, so prose
  // and record names containing the letters "three" are never rejected.
  assert.deepEqual(importSpecifiers('// three questions\nconst three = "three";'), []);
  assert.deepEqual(importSpecifiers('import x from "three";'), ["three"]);

  let inspected = 0;
  for (const [rel, source] of PRODUCTION_SOURCES) {
    for (const specifier of importSpecifiers(source)) {
      inspected += 1;
      assert.ok(!isThreePackage(specifier), `${rel} imports ${specifier}`);
    }
  }
  // The extractor must actually see the real imports this product has.
  assert.ok(inspected > 10, `only ${inspected} import specifiers were inspected`);
  assert.ok(importSpecifiers(client).includes("d3-selection"));
});

// ---------------------------------------------------------------------------
// Guard 3 — no WebGL renderer or context
// ---------------------------------------------------------------------------

const WEBGL_PATTERN =
  String.raw`WebGLRenderer|WebGL2?RenderingContext|getContext\s*\(\s*["'\x60]\s*(?:experimental-)?webgl`;

test("guard 3 — no WebGL renderer or context", () => {
  // False-positive control: the pattern matches real WebGL acquisition in every
  // quote style and both context versions, and test files are outside the scan
  // scope so their own absence assertions can never trip it.
  for (const positive of [
    'new THREE.WebGLRenderer()',
    'canvas.getContext("webgl")',
    "canvas.getContext('webgl2')",
    'el.getContext("experimental-webgl")',
    "if (ctx instanceof WebGL2RenderingContext) {}",
  ]) {
    assert.ok(new RegExp(WEBGL_PATTERN, "i").test(positive), positive);
  }
  assert.ok(!new RegExp(WEBGL_PATTERN, "i").test('const label = "webgl is not used here";'));

  clean("WebGL renderer or context in production source:", scan(WEBGL_PATTERN, {}));
});

// ---------------------------------------------------------------------------
// Guard 4 — no Canvas graph
// ---------------------------------------------------------------------------

const CANVAS_PATTERN =
  String.raw`<canvas\b|getContext\s*\(|CanvasRenderingContext|createElement\s*\(\s*["'\x60]canvas["'\x60]\s*\)`;

test("guard 4 — no Canvas graph", () => {
  // False-positive control: `canvas` is the EXISTING variable, data attribute
  // and CSS class name for the SVG container, so the guard rejects only actual
  // Canvas element or Canvas API use — never the identifier.
  for (const positive of [
    '<canvas id="graph"></canvas>',
    "const ctx = node.getContext('2d');",
    'document.createElement("canvas")',
    "ctx instanceof CanvasRenderingContext2D",
  ]) {
    assert.ok(new RegExp(CANVAS_PATTERN).test(positive), positive);
  }
  for (const legitimate of [
    'const canvas = container.querySelector<HTMLElement>("[data-psadj-canvas]");',
    '<div class="psadj__canvas" data-psadj-canvas hidden></div>',
    ".psadj__canvas .psadj-node rect {",
  ]) {
    assert.ok(!new RegExp(CANVAS_PATTERN).test(legitimate), legitimate);
  }
  // …and those legitimate forms really are what production contains.
  assert.ok(client.includes("const canvas = container.querySelector"));
  assert.ok(component.includes('data-psadj-canvas'));

  clean("Canvas element or Canvas API use in production source:", scan(CANVAS_PATTERN, {}));
});

// ---------------------------------------------------------------------------
// Guard 5 — no CodePen runtime reference
// ---------------------------------------------------------------------------

const CODEPEN_PATTERN = String.raw`codepen\.io|cdpn\.io|cpwebassets\.com`;

test("guard 5 — no CodePen runtime reference", () => {
  // This is a RUNTIME and SOURCE boundary. It scans shipped production source
  // only; planning evidence and review documents are never scanned, and none is
  // copied into this repository.
  for (const positive of [
    'https://codepen.io/pen/abc',
    "//cdpn.io/x.js",
    'src="https://cpwebassets.com/x.js"',
  ]) {
    assert.ok(new RegExp(CODEPEN_PATTERN, "i").test(positive), positive);
  }
  assert.ok(!new RegExp(CODEPEN_PATTERN, "i").test("a pen sketch of the codebase"));

  clean("CodePen runtime reference in production source:", scan(CODEPEN_PATTERN, {}));
});

// ---------------------------------------------------------------------------
// Guard 6 — no embedded external runtime surface
// ---------------------------------------------------------------------------

const EMBED_PATTERN = String.raw`<iframe\b|<embed\b|<object\b`;

test("guard 6 — no embedded external runtime surface", () => {
  // Scoped to the adjacency component and client. The frozen authority-map
  // product legitimately NAMES `iframe` in the prose that documents its own
  // boundary, and the existing build verifier carries "<iframe" as a
  // prohibition token, so a wider scan would flag the prohibition itself.
  const outOfScope = rd("src/lib/public-surface-authority-map/d3AuthorityRenderer.ts");
  assert.ok(/iframe/.test(outOfScope), "the documented out-of-scope precedent no longer holds");

  for (const positive of ['<iframe src="x">', "<embed src='x'>", "<object data='x'>"]) {
    assert.ok(new RegExp(EMBED_PATTERN, "i").test(positive), positive);
  }
  assert.ok(!new RegExp(EMBED_PATTERN, "i").test("no iframe, no external visualization service"));

  clean(
    "embedded external runtime surface in the adjacency component or client:",
    scan(EMBED_PATTERN, { only: [ADJACENCY_COMPONENT, ADJACENCY_CLIENT] }),
  );
});

// ---------------------------------------------------------------------------
// Guard 7 — no randomness
// ---------------------------------------------------------------------------

const RANDOM_PATTERN = String.raw`Math\.random|crypto\.getRandomValues|randomUUID`;

test("guard 7 — no randomness", () => {
  // False-positive control: neutral prose containing the word "random" is not
  // rejected. Only an invocation of, or a reference to, a random source is.
  for (const positive of [
    "const t = Math.random();",
    "crypto.getRandomValues(buffer)",
    "const id = crypto.randomUUID();",
  ]) {
    assert.ok(new RegExp(RANDOM_PATTERN).test(positive), positive);
  }
  for (const prose of [
    "// order is not random and carries no ranking",
    "records appear in no random order",
  ]) {
    assert.ok(!new RegExp(RANDOM_PATTERN).test(prose), prose);
  }

  clean("randomness in production source:", scan(RANDOM_PATTERN, {}));
});

// ---------------------------------------------------------------------------
// Guard 8 — no motion or timer architecture
// ---------------------------------------------------------------------------

const MOTION_PATTERN =
  String.raw`requestAnimationFrame|cancelAnimationFrame|\bsetInterval\b|\bsetTimeout\b` +
  String.raw`|\.animate\s*\(|@keyframes|(?:^|[^-\w])transition\s*:|(?:^|[^-\w])animation\s*:`;

test("guard 8 — no motion or timer architecture", () => {
  // `runtimeLoader.ts` is EXCLUDED, and only from this guard: it is frozen and
  // legitimately uses `setTimeout` for its request-budget abort. A
  // namespace-wide ban would fail on unmodified `main` today.
  assert.ok(
    new RegExp(MOTION_PATTERN, "m").test(rd(RUNTIME_LOADER)),
    "the runtimeLoader exclusion is no longer load-bearing — re-scope this guard",
  );

  // False-positive control: the reduced-motion block that pins the visitor's
  // preference uses `transition-duration` / `animation-duration` /
  // `animation-iteration-count`, which are NOT the banned shorthand and must
  // not be rejected.
  for (const positive of [
    "requestAnimationFrame(step)",
    "const t = setTimeout(done, 10);",
    "el.animate(frames, 200)",
    "@keyframes pulse {",
    "    transition: opacity 200ms ease;",
    "    animation: pulse 1s infinite;",
  ]) {
    assert.ok(new RegExp(MOTION_PATTERN, "m").test(positive), positive);
  }
  for (const legitimate of [
    "      transition-duration: 0.01ms !important;",
    "      animation-duration: 0.01ms !important;",
    "      animation-iteration-count: 1 !important;",
    "  @media (prefers-reduced-motion: reduce) {",
  ]) {
    assert.ok(!new RegExp(MOTION_PATTERN, "m").test(legitimate), legitimate);
  }
  // …and that reduced-motion block really is still in the component, so this
  // guard cannot pass because the styling was removed instead.
  assert.ok(component.includes("@media (prefers-reduced-motion: reduce)"));
  assert.ok(component.includes("animation-duration: 0.01ms !important;"));

  clean(
    "motion or timer architecture in production source:",
    scan(MOTION_PATTERN, { exclude: [RUNTIME_LOADER] }),
  );
});

// ---------------------------------------------------------------------------
// Guard 9 — dependency and lockfile boundary
// ---------------------------------------------------------------------------
//
// P7.0 may add SCRIPTS only. Captured from the authorized baseline
// 32f992d28f7c84d21c7af5a2ca5430d5fb63eed8. If one of these fails, the correct
// response is to restore the dependency lists — never to update the expectation.

const BASELINE_DEPENDENCIES = {
  "@astrojs/cloudflare": "12.6.12",
  "@astrojs/mdx": "4.3.13",
  "@astrojs/sitemap": "3.6.1",
  astro: "5.16.9",
  "d3-selection": "3.0.0",
  typescript: "5.9.3",
};

const BASELINE_DEV_DEPENDENCIES = {
  "@astrojs/check": "0.9.9",
  "@types/d3-selection": "3.0.11",
  "fast-xml-parser": "5.9.3",
  wrangler: "4.88.0",
};

const PROHIBITED_RUNTIME_PACKAGES = [
  "three",
  "regl",
  "pixi.js",
  "gsap",
  "animejs",
  "d3-zoom",
  "playwright",
  "jsdom",
  "happy-dom",
  "puppeteer",
];

const PROHIBITED_PACKAGE_PREFIXES = [
  "three/",
  "@react-three/",
  "@playwright/",
  "playwright-",
  "@puppeteer/",
  "puppeteer-",
];

const isProhibitedRuntimePackage = (name: string) =>
  PROHIBITED_RUNTIME_PACKAGES.includes(name) ||
  PROHIBITED_PACKAGE_PREFIXES.some((prefix) => name.startsWith(prefix));

test("guard 9 — dependency and lockfile boundary", () => {
  assert.deepEqual(packageJson.dependencies, BASELINE_DEPENDENCIES);
  assert.deepEqual(packageJson.devDependencies, BASELINE_DEV_DEPENDENCIES);
  assert.equal(packageJson.packageManager, "pnpm@10.34.5");
  assert.ok(existsSync(p("pnpm-lock.yaml")), "pnpm-lock.yaml must exist");

  // The lockfile is unchanged BY BYTES, not merely by parsed package names. A
  // package-name check alone accepts a reordered, re-encoded or whitespace-
  // altered lockfile, so the authorized baseline identity is pinned directly.
  assert.equal(
    LOCKFILE_BYTES.byteLength,
    LOCKFILE_IDENTITY.byteLength,
    `pnpm-lock.yaml is ${LOCKFILE_BYTES.byteLength} bytes, expected ${LOCKFILE_IDENTITY.byteLength}`,
  );
  assert.equal(
    createHash("sha256").update(LOCKFILE_BYTES).digest("hex"),
    LOCKFILE_IDENTITY.sha256,
    "pnpm-lock.yaml no longer matches the authorized baseline SHA-256",
  );

  // No prohibited package at ANY depth, matched against parsed lockfile package
  // names rather than raw text, so a version string or an unrelated path can
  // never satisfy or trip the check.
  assert.deepEqual([...LOCKFILE_PACKAGES].filter(isProhibitedRuntimePackage).sort(), []);

  // …and the same list is absent from the declared surface.
  const declared = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ];
  assert.deepEqual(declared.filter(isProhibitedRuntimePackage), []);

  // False-positive control: the predicate is package-aware, not a substring.
  assert.ok(isProhibitedRuntimePackage("d3-zoom"));
  assert.ok(isProhibitedRuntimePackage("@react-three/drei"));
  assert.ok(!isProhibitedRuntimePackage("d3-selection"));
  assert.ok(!isProhibitedRuntimePackage("@types/d3-selection"));
});

// ---------------------------------------------------------------------------
// Guard 10 — retained semantic and security guarantees
// ---------------------------------------------------------------------------

test("guard 10 — retained semantic and security guarantees", () => {
  // (a) No importance-derived layout or display channel.
  //
  //     Scoped to the EXECUTABLE code of the layout module and the client —
  //     the only two places a layout or display value is computed. `contract.ts`
  //     carries several of these words as its own PROHIBITED_KEY_TOKENS
  //     vocabulary and the component states them in visible prose, so a wider
  //     scan would flag the boundary being enforced rather than a violation.
  for (const [name, code] of [["layout.ts", layoutCode], ["client", clientCode]]) {
    for (const forbidden of [
      "centrality",
      "degree(",
      "forceSimulation",
      "d3-force",
      "rankOf",
      "importance",
    ]) {
      assert.ok(!code.includes(forbidden), `${forbidden} must not appear in ${name}`);
    }
  }
  //     …and the COORDINATE PRODUCERS take no edge input, so no edge-derived
  //     value can reach a record coordinate even indirectly.
  //
  //     Scope note. This guard originally read "the layout module must take no
  //     edge input", which was true only while the module computed nothing but
  //     coordinates. P7.1 adds edge SORTING, BUCKETING and LANE ASSIGNMENT to
  //     the same module, because a chord is a function of the two records it
  //     connects — so a module-wide ban would now reject the canonical
  //     specification rather than a violation. The guard is therefore re-scoped
  //     to what it was always protecting: nothing that determines WHERE a record
  //     sits may read an edge. Routing may read edges; producers may not.
  //
  //     Re-scoping is the honest fix. Renaming a parameter to slip past the
  //     regex would leave the guard passing while its real subject went
  //     unprotected.
  const takesEdgeInput = (body: string) => /\bedges\b|\bAdjacencyEdge\b/.test(body);

  const COORDINATE_PRODUCERS = [
    "CONCEPT_GROUP_ORDER", // grouping keys, from which every sector derives
    "CONCEPT_ORDER", // canonical concept order -> concept ring index
    "ROLE_ORBIT_ORDER", // canonical role order -> role orbit index
    "GRAPH_RECORD_ORDER", // the complete canonical record order
    "computeRadialLayout", // concept coordinates and grouping spans
    "computeRoleOrbit", // role coordinates and role-label anchors
    "groupArcPath", // grouping-arc geometry
    "buildDirectionalIndex", // the coordinate table navigation reads
  ];
  for (const name of COORDINATE_PRODUCERS) {
    assert.ok(
      !takesEdgeInput(layoutFunctionBody(name)),
      `${name} is a coordinate producer and must take no edge input`,
    );
  }

  //     The split must be REAL, not vacuous. Routing genuinely does consume
  //     edges, so if these ever stopped doing so the guard above would be
  //     passing over a module that no longer routes anything.
  for (const name of ["assignLanes", "computeEdgeRouting"]) {
    assert.ok(
      takesEdgeInput(layoutFunctionBody(name)),
      `${name} is a routing function and is expected to consume edges`,
    );
  }

  //     Decisive mutation: an edge-dependent coordinate producer must fail.
  //     The mutation is applied to the REAL producer body and is asserted to
  //     have actually changed it, so this cannot pass on a no-op edit.
  const producer = layoutFunctionBody("computeRadialLayout");
  const mutated = producer.replace(
    "const order = CONCEPT_ORDER(nodes);",
    "const order = CONCEPT_ORDER(nodes); const bias = edges.length;",
  );
  assert.notEqual(mutated, producer, "the coordinate-producer mutation must apply");
  assert.ok(!takesEdgeInput(producer), "the unmutated producer must pass");
  assert.ok(
    takesEdgeInput(mutated),
    "an edge-dependent coordinate producer must fail this guard",
  );
  //     …and the same for a producer that merely accepts an edge parameter.
  assert.ok(
    takesEdgeInput("(nodes: readonly AdjacencyNode[], edges: readonly AdjacencyEdge[]) => {}"),
    "a producer that accepts an edge parameter must fail this guard",
  );

  // (b) No unsafe HTML path anywhere in production source.
  for (const forbidden of ["innerHTML", "outerHTML", "insertAdjacentHTML", "document.write"]) {
    clean(`${forbidden} in production source:`, scan(forbidden.replace(".", "\\.")));
  }

  // (c) BOTH Escape listeners remain, on their own distinct targets…
  assert.ok(/\bcanvas\.addEventListener\(\s*"keydown"/.test(client));
  assert.ok(/\bdetails\.addEventListener\(\s*"keydown"/.test(client));
  assert.equal([...client.matchAll(/\bdetails\.addEventListener\(/g)].length, 1);
  const canvasKeydown = listenerBody(client, "canvas", "keydown");
  const detailsKeydown = listenerBody(client, "details", "keydown");
  assert.ok(/event\.key === "Escape"/.test(canvasKeydown));
  assert.ok(/event\.key === "Escape"/.test(detailsKeydown));

  //     …and BOTH keep their no-op guard: the canvas listener returns when the
  //     event did not originate inside a rendered record, and the details
  //     listener acts only when a record is actually selected, with no else
  //     branch and no inferred fallback node.
  assert.ok(/if \(!currentId\) return;/.test(canvasKeydown), "canvas no-op guard");
  assert.ok(
    /event\.key === "Escape" && state\.selectedId/.test(detailsKeydown),
    "details no-op guard",
  );
  assert.ok(!/\belse\b/.test(detailsKeydown), "the details listener must have no else branch");
  for (const fallback of ["firstReachableId", "lastReachableId", "querySelector", "nodes[0]"]) {
    assert.ok(!detailsKeydown.includes(fallback), `details Escape must not infer a node via ${fallback}`);
  }

  // (d) `isApprovedSourceUrl` gates every generated href path.
  //
  //     Component: every href expression is either an approved module-level
  //     route/URL constant or the single gated helper — no dataset field is
  //     ever interpolated into an href directly.
  const hrefExpressions = [...component.matchAll(/href=\{([^}]+)\}/g)].map((m) => m[1].trim());
  assert.ok(hrefExpressions.length > 0);
  for (const expression of hrefExpressions) {
    assert.ok(
      /^[A-Z][A-Z0-9_]*$/.test(expression) || expression === "safeHref(node)",
      `href expression ${expression} is neither an approved constant nor the gated helper`,
    );
  }
  assert.ok(hrefExpressions.includes("safeHref(node)"));
  assert.ok(!/href=\{[^}]*node\.[^}]*\}/.test(component), "no dataset field is interpolated raw");
  assert.ok(
    /const safeHref =[\s\S]{0,240}?isApprovedSourceUrl\(node\.canonical_public_url, node\.repository_path\)/.test(
      component,
    ),
  );
  //     Client: exactly one href assignment, and it sits inside the approved-URL
  //     branch.
  assert.equal([...client.matchAll(/\.href\s*=/g)].length, 1);
  assert.ok(
    /if \(isApprovedSourceUrl\(node\.canonical_public_url, node\.repository_path\)\)[\s\S]{0,200}?link\.href = node\.canonical_public_url;/.test(
      client,
    ),
  );

  // (e) External-link protection: every new window is opener-isolated.
  const blankTargets = [...component.matchAll(/target="_blank"/g)].length;
  assert.ok(blankTargets > 0);
  assert.equal(blankTargets, [...component.matchAll(/rel="noopener noreferrer"/g)].length);
  assert.equal(
    [...client.matchAll(/\.target = "_blank"/g)].length,
    [...client.matchAll(/\.rel = "noopener noreferrer"/g)].length,
  );
  assert.ok(/link\.target = "_blank"/.test(client));
  assert.ok(/link\.rel = "noopener noreferrer"/.test(client));

  // (f) Edge-class defaults are unchanged, in the contract, the server-rendered
  //     control state, and the client's seeded state alike.
  assert.ok(
    /source_named_adjacency: true,\s*\n\s*navigation_adjacency: false,/.test(
      rd(`${ADJACENCY_LIB}/contract.ts`),
    ),
  );
  assert.ok(/visible: \{ source_named_adjacency: true, navigation_adjacency: false \}/.test(client));
  const namedToggle = component.indexOf('data-psadj-toggle="source_named_adjacency"');
  const navToggle = component.indexOf('data-psadj-toggle="navigation_adjacency"');
  assert.ok(namedToggle !== -1 && navToggle !== -1);
  assert.ok(
    /checked/.test(component.slice(component.lastIndexOf('type="checkbox"', namedToggle), namedToggle)),
    "the source-named control is checked by default",
  );
  assert.ok(
    !/checked/.test(component.slice(component.lastIndexOf('type="checkbox"', navToggle), navToggle)),
    "the navigation control is unchecked by default",
  );

  // (g) No unauthorized relation class is toggleable: exactly the two approved
  //     edge classes have a control, and none of the four withheld classes does.
  const toggles = [...component.matchAll(/data-psadj-toggle="([a-z_]+)"/g)].map((m) => m[1]);
  assert.deepEqual(toggles, ["source_named_adjacency", "navigation_adjacency"]);
  for (const withheld of [
    "governance_reference",
    "source_use_reference",
    "visual_layout_adjacency",
    "user_confirmed_relation",
  ]) {
    assert.ok(!component.includes(`data-psadj-toggle="${withheld}"`), withheld);
    assert.ok(!client.includes(withheld), `${withheld} must not be wired in the client`);
  }

  // (h) Approved visible wording still originates from `publicWording.ts`: the
  //     component and route import it and render the constants, and neither
  //     carries an inline copy of the approved text that could drift from it.
  for (const [name, code] of [["component", componentCode], ["page", pageCode]]) {
    assert.ok(
      /from ["'][^"']*public-surface-adjacency-map\/publicWording\.ts["']/.test(code),
      `${name} must import the approved wording module`,
    );
  }
  for (const rendered of [
    "{APPROVED_TITLE}",
    "{APPROVED_DESCRIPTION}",
    "{SCOPE_STATEMENT}",
    "{RELATIONSHIP_SENTENCE}",
    "{AUTHORITY_VIEW_LABEL}",
    "{EXPANDED_VIEW_LABEL}",
  ]) {
    assert.ok(componentCode.includes(rendered), `${rendered} must be rendered from the module`);
  }
  assert.ok(/NOT_CLAIMS\.map/.test(componentCode));
  const wording = rd(`${ADJACENCY_LIB}/publicWording.ts`);
  for (const constant of [
    "APPROVED_TITLE",
    "RELATIONSHIP_SENTENCE",
    "AUTHORITY_VIEW_LABEL",
    "EXPANDED_VIEW_LABEL",
  ]) {
    const literal = new RegExp(`export const ${constant} =\\s*\\n?\\s*"([^"]+)"`).exec(wording);
    assert.ok(literal, `${constant} must be a single string literal in publicWording.ts`);
    assert.ok(
      !componentCode.includes(literal[1]) && !pageCode.includes(literal[1]),
      `${constant} must not be duplicated inline; it is single-sourced`,
    );
  }
});

// ---------------------------------------------------------------------------
// Guard 11 — no ResizeObserver
// ---------------------------------------------------------------------------

test("guard 11 — no ResizeObserver", () => {
  clean("ResizeObserver in production source:", scan(String.raw`ResizeObserver`));

  // Re-scoped at P7.1. Until P7.1 the client re-laid-out the graph on a window
  // resize, so this guard pinned that listener in place to prove the responsive
  // behaviour had not simply been deleted. P7.1 removes the listener because
  // responsiveness is now entirely static — a fixed logical viewBox plus CSS —
  // so the guard now bans BOTH observers and resize listeners, and proves the
  // static mechanism is actually present rather than absent.
  clean(
    "window resize listener in production source:",
    scan(String.raw`addEventListener\(\s*["']resize["']`),
  );

  // Positive control: the pattern really does catch a resize listener.
  assert.ok(
    /addEventListener\(\s*["']resize["']/.test('window.addEventListener("resize", handler)'),
  );

  // …and the static replacement is present, so this guard cannot pass because
  // responsive behaviour was dropped altogether.
  assert.ok(component.includes("preserveAspectRatio"), "the fixed viewBox fit must be declared");
  assert.ok(/max-width:\s*100%/.test(component), "the SVG must be width-constrained by CSS");
  assert.ok(/@media \(max-width: 640px\)/.test(component), "the responsive breakpoint must remain");
  assert.ok(/grid-template-columns:\s*1fr/.test(component), "the single-column collapse must remain");
});

// ---------------------------------------------------------------------------
// Guard 12 — no browser or DOM harness
// ---------------------------------------------------------------------------

const PROHIBITED_HARNESS_PACKAGES = [
  "playwright",
  "puppeteer",
  "jsdom",
  "happy-dom",
  "linkedom",
  "cypress",
  "global-jsdom",
  "jest-environment-jsdom",
];

const PROHIBITED_HARNESS_PREFIXES = [
  "@playwright/",
  "playwright-",
  "@puppeteer/",
  "puppeteer-",
  "@cypress/",
  "cypress-",
  "@testing-library/",
];

const isHarnessPackage = (name: string) =>
  PROHIBITED_HARNESS_PACKAGES.includes(name) ||
  PROHIBITED_HARNESS_PREFIXES.some((prefix) => name.startsWith(prefix));

test("guard 12 — no browser or DOM harness", () => {
  const declared = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ];
  assert.deepEqual(declared.filter(isHarnessPackage), []);
  assert.deepEqual([...LOCKFILE_PACKAGES].filter(isHarnessPackage).sort(), []);

  // No harness configuration file is introduced either…
  for (const config of [
    "playwright.config.ts",
    "playwright.config.js",
    "cypress.config.ts",
    "cypress.config.js",
    "jest.config.js",
    "jest.config.ts",
    "vitest.config.ts",
    "vitest.config.js",
    "karma.conf.js",
  ]) {
    assert.ok(!existsSync(p(config)), `${config} must not exist`);
  }

  // …and every test script still runs on the Node built-in runner against an
  // explicit file. No directory-level runner and no third-party runner appears.
  const scripts = packageJson.scripts ?? {};
  const testScripts = Object.entries(scripts).filter(([name]) => name.startsWith("test:"));
  assert.ok(testScripts.length > 0);
  for (const [name, command] of testScripts) {
    assert.ok(
      /^node --test tests\/[\w./[\]-]+\.test\.ts$/.test(command),
      `${name} must invoke node --test on one explicit test file, got: ${command}`,
    );
  }
  for (const [name, command] of Object.entries(scripts)) {
    for (const runner of ["playwright", "puppeteer", "cypress", "vitest", "jest", "karma"]) {
      assert.ok(!command.includes(runner), `${name} must not invoke ${runner}`);
    }
  }

  // False-positive control: the predicate is package-aware, and the approved
  // dependencies are not mistaken for a harness.
  assert.ok(isHarnessPackage("jsdom"));
  assert.ok(isHarnessPackage("@playwright/test"));
  assert.ok(!isHarnessPackage("d3-selection"));
  assert.ok(!isHarnessPackage("fast-xml-parser"));
});

// ---------------------------------------------------------------------------
// Guard 13 — interaction assertions retargeted without semantic loss
// ---------------------------------------------------------------------------

const INTERACTION_TEST = "tests/public-surface-adjacency-map/interaction.test.ts";

/**
 * The retargeted tests P7.0 protects, with the number of ACTIVE assertions each
 * leaves behind. A later package may add to one of these tests; it may not thin
 * one out, comment one out, or delete it.
 */
const PROTECTED_TESTS: [string, number][] = [
  ["edge classes are distinguished by pattern and marker, not color alone", 21],
  ["a visible focus indicator is defined for every interactive element", 36],
  ["the layout is usable at narrow mobile width", 9],
];

/** Active assertions across every test in `interaction.test.ts`. Recomputed
 *  from the parse tree after each correction: a stale floor stops pinning the
 *  state it is supposed to protect, which is how a removed assertion slipped
 *  past once already. */
const INTERACTION_ASSERTION_FLOOR = 220;

/**
 * Tokens that would mean a test depends on implementation that does not exist
 * yet.
 *
 * Re-scoped at P7.1. This list is a FORWARD prohibition, so it names only what
 * is still unbuilt. The P7.1 vocabulary — the radial producers, the canonical
 * orders, the directional resolver, the grouping-arc constant, the label
 * readout and the route width — has now landed, is asserted by the three P7.1
 * suites, and is therefore no longer "future": keeping it here would forbid
 * P7.1 from describing its own implemented behaviour.
 *
 * What remains is P7.2 only, and the list is extended rather than merely
 * trimmed, so the forward boundary is tighter than it was.
 */
const FUTURE_IMPLEMENTATION_TOKENS = [
  "viewport.ts",
  "fitLogicalBounds",
  "clampScale",
  "stepScale",
  "zoomAbout",
  "clampOffset",
  "centreOn",
  "resetTransform",
  "transformAttr",
  "Reset Exploration",
  "Focus Record",
  "Fit All",
  "Zoom In",
  "Zoom Out",
];

/** Markers that would mean a test is skipped, deferred or expected to fail. */
const SKIPPED_TEST_MARKERS = [
  "test.skip(",
  "test.todo(",
  "it.skip(",
  "describe.skip(",
  "skip: true",
  "todo: true",
  "{ skip:",
  "{ todo:",
];

/**
 * This file with its own two prohibition vocabularies removed. Scanning the
 * raw file would flag the LISTS that name what to look for rather than any real
 * usage — the same false-positive class every guard above controls for.
 */
const ownSourceScannable = ownSource
  .replace(/const FUTURE_IMPLEMENTATION_TOKENS = \[[\s\S]*?\n\];/, "")
  .replace(/const SKIPPED_TEST_MARKERS = \[[\s\S]*?\n\];/, "");

assert.ok(
  ownSourceScannable.length < ownSource.length,
  "the self-scan must strip this file's own prohibition vocabularies",
);
assert.ok(
  ownSourceScannable.includes('test("guard 13 — '),
  "the self-scan must leave the guard registrations intact",
);

test("guard 13 — interaction assertions retargeted without semantic loss", () => {
  const interaction = rd(INTERACTION_TEST);
  assert.ok(interaction.length > 0);

  // (a) Presentation coupling that P7.1 is authorized to replace is GONE. These
  //     are the exact literal-CSS and column-count assertions that were
  //     retargeted, not a search for a comment claiming they were.
  for (const [coupling, note] of [
    ["stroke-width: 1.2", "literal edge stroke width"],
    ["stroke-dasharray: 5 4", "literal edge dash declaration"],
    ["max-width: 640px", "literal responsive breakpoint"],
    ["columnsForWidth(320, 7)", "exact column count at a pinned width"],
    ["columnsForWidth(0, 7)", "exact column count at a pinned width"],
  ]) {
    assert.ok(!interaction.includes(coupling), `${note} is still pinned: ${coupling}`);
  }
  //     The focus-outline literal is coupling only when it is matched AGAINST
  //     THE COMPONENT. The cascade fixtures legitimately declare it as their own
  //     synthetic stylesheet input, which pins nothing about production.
  assert.deepEqual(
    interaction
      .split("\n")
      .filter((line) => line.includes("outline: 3px solid currentColor") && line.includes("component")),
    [],
    "the literal focus-outline declaration is still pinned against the component",
  );
  //     …and no assertion pins a resolved column count to a bare literal.
  assert.deepEqual(
    [...interaction.matchAll(/assert\.equal\(\s*columnsForWidth\([^)]*\),\s*\d+\s*\)/g)].map(
      (m) => m[0],
    ),
    [],
    "no assertion may pin columnsForWidth to a literal column count",
  );
  assert.ok(
    !/assert\.equal\([^\n]*\.columnsPerBand,\s*\d+\s*\)/.test(interaction),
    "no assertion may pin a resolved columnsPerBand to a literal",
  );

  // (b) Every prior semantic, security, accessibility and edge-class guarantee
  //     is STILL asserted — checked against assertion CONTENT, not against a
  //     token that could survive somewhere else in the file after the assertion
  //     using it was deleted.
  //     Extraction is SYNTAX-AWARE: a commented-out, stringified, templated or
  //     regex-shaped assertion is not a call expression and is never counted.
  const inspected = inspectTestFile(INTERACTION_TEST);
  const assertions = inspected.assertions;
  assert.ok(assertions.length > 100, `only ${assertions.length} active assertions were parsed`);
  assert.ok(
    assertions.some((call) => call.includes("EDGE_CLASS_DEFAULT_VISIBLE")),
    "the assertion parser did not find a known assertion",
  );
  const asserted = assertions.join("\n");

  //     The parser must actually discriminate. These fixtures prove it counts a
  //     real assertion and refuses every look-alike, which is the exact bypass
  //     the previous textual extractor allowed.
  const parseFixture = (body: string) => {
    const fixture = ts.createSourceFile(
      "fixture.test.ts",
      `test("fixture", () => {\n${body}\n});\n`,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );
    let count = 0;
    const visit = (node: ts.Node): void => {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === "assert"
      ) {
        count += 1;
      }
      ts.forEachChild(node, visit);
    };
    ts.forEachChild(fixture, visit);
    return count;
  };
  for (const inactive of [
    "// assert.match(client, /x/);",
    "/* assert.match(client, /x/); */",
    'const note = "assert.match(client, /x/)";',
    "const note = `assert.match(client, /x/)`;",
    "const pattern = /assert\\.match/;",
  ]) {
    assert.equal(parseFixture(inactive), 0, `must not count an inactive assertion: ${inactive}`);
  }
  for (const [active, expected] of [
    ["assert.ok(true);", 1],
    ["assert.ok(\n  /psadj-arrow-open/.test(client),\n  `multiline ${1 + 1}`,\n);", 1],
    ["assert.ok(nested(inner(deep())));", 1],
    ["assert.ok(/assert\\.match/.test(client));", 1],
    ["assert.ok(true);\nassert.equal(1, 1);", 2],
  ]) {
    assert.equal(parseFixture(active), expected, `must count the active assertion: ${active}`);
  }

  const RETAINED = [
    ["the navigation class keeps a dash declaration", /stroke-dasharray/],
    ["that declaration is required, not merely read", /must declare a stroke-dasharray/],
    ["…and it must actually render non-solid, not just contain digits", /must render non-solid/],
    ["the source-named class stays solid", /must stay solid/],
    ["edge-class distinction is not colour alone", /must not carry its own/],
    ["source-named and navigation carry distinct arrow markers", /psadj-arrow-filled/],
    ["…and the open marker too", /psadj-arrow-open/],
    ["edge-class default visibility is unchanged", /EDGE_CLASS_DEFAULT_VISIBLE/],
    ["only the two approved classes are toggleable", /data-psadj-toggle=/],
    ["a visible focus indicator exists", /:focus-visible/],
    ["…the interactive focus contract is actually established", /must paint a focus outline/],
    ["…no interactive selector suppresses it", /suppresses the focus outline/],
    ["…and no rule anywhere removes it", /removes the focus outline/],
    ["focus and selection state are exposed", /aria-pressed/],
    ["approved URL gating", /isApprovedSourceUrl/],
    ["external-link protection", /rel="noopener noreferrer"/],
    ["the details Escape behaviour", /details\.addEventListener/],
    ["the canvas Escape behaviour", /canvas\.addEventListener/],
    ["the details Escape no-op guard", /no else branch/],
    ["the canvas Escape no-op guard", /closest<SVGGElement>/],
    ["the complete no-JavaScript fallback", /data-psadj-record-list/],
    ["reduced motion is honoured", /prefers-reduced-motion/],
    // Re-scoped at P7.1 alongside the layout change. The guarantee is unchanged
    // — the layout stays usable at narrow width and never drops a record — but
    // it is now carried by the responsive grid and the fixed logical viewBox
    // rather than by a resolved column count, because `columnsForWidth` no
    // longer exists.
    ["responsive layout collapses to a single column", /psadj__grid/],
    ["…and keeps every concept record at every width", /concepts\.length/],
  ];
  for (const [guarantee, pattern] of RETAINED) {
    assert.ok(pattern.test(asserted), `retargeting dropped the guarantee: ${guarantee}`);
  }

  //     Prohibition VOCABULARIES are enumerated in loop tables rather than
  //     inside a call, so they are checked at file level.
  for (const vocabulary of [
    "innerHTML",
    "outerHTML",
    "insertAdjacentHTML",
    "document.write",
    "governance_reference",
    "source_use_reference",
    "visual_layout_adjacency",
    "user_confirmed_relation",
    "centrality",
    "forceSimulation",
    "d3-force",
    "rankOf",
    "publicWording.ts",
  ]) {
    assert.ok(interaction.includes(vocabulary), `retargeting dropped the ${vocabulary} check`);
  }

  //     No assertion was quietly deleted from a retargeted test. These floors
  //     are the counts P7.0 leaves behind; a later package may add to a test,
  //     but may not thin one out.
  //     Floors are counted from ACTIVE assertions, so commenting one out drops
  //     the count and fails here.
  for (const [title, floor] of PROTECTED_TESTS) {
    const protectedTest = inspected.tests.find((entry) => entry.title === title);
    assert.ok(protectedTest, `the protected test "${title}" is missing`);
    assert.ok(
      protectedTest.assertions.length >= floor,
      `"${title}" has ${protectedTest.assertions.length} active assertions, below the P7.0 floor of ${floor}`,
    );
  }
  //     …and the file as a whole did not shrink: retargeting replaced literal
  //     assertions with intent-level ones, it did not remove coverage.
  assert.equal(inspected.tests.length, 39, "no test was added or removed");
  assert.ok(
    assertions.length >= INTERACTION_ASSERTION_FLOOR,
    `the retargeted file has ${assertions.length} active assertions, below the P7.0 floor of ${INTERACTION_ASSERTION_FLOOR}`,
  );

  // (c) No assertion depends on P7.1 or P7.2 implementation, and (d) no test in
  //     either file is skipped, empty, placeholder-only, or marked as a future
  //     expected failure.
  const SUITES = [
    ["interaction.test.ts", interaction],
    ["renderingBoundary.test.ts", ownSourceScannable],
  ];
  for (const [name, source] of SUITES) {
    for (const future of FUTURE_IMPLEMENTATION_TOKENS) {
      assert.ok(!source.includes(future), `${name} must not depend on ${future}`);
    }
    for (const marker of SKIPPED_TEST_MARKERS) {
      assert.ok(!source.includes(marker), `${name} must not contain ${marker}`);
    }

    // Every registered test has a body, and every body actually asserts.
    const bodies = [...source.matchAll(/^test\("([^"]+)",[\s\S]*?\n\}\);$/gm)];
    assert.ok(bodies.length > 0, `${name} registers no test`);
    assert.equal(
      bodies.length,
      [...source.matchAll(/^test\(/gm)].length,
      `${name} has a test whose body could not be read`,
    );
    for (const [body, title] of bodies) {
      assert.ok(/\bassert\./.test(body), `${name}: test "${title}" asserts nothing`);
    }
  }

  //     …and for the interaction suite the same claim is re-checked from the
  //     parse tree, so an "assertion" that is only a comment cannot satisfy it.
  for (const entry of inspected.tests) {
    assert.ok(
      entry.assertions.length > 0,
      `interaction.test.ts: test "${entry.title}" has no active assertion`,
    );
  }

  // (e) This guard suite itself covers all thirteen canonical guards.
  assert.equal(P7_0_GUARDS.length, 13);
  assert.equal([...ownSource.matchAll(/^test\("guard /gm)].length, 13);
});
