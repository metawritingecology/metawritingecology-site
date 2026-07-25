// @ts-nocheck — Node built-in test runner. This repo ships no `@types/node`
// and adding a test dependency is prohibited, so `node:test` has no ambient
// types; type-checking of this test harness is disabled here. The production
// modules it imports remain fully typed and are type-checked by `tsc`.
//
// Expanded Public Surface Adjacency Map — existing-product preservation tests.
//
// Phase 3A P6 adds a SECOND, parallel public product. The frozen 30-record
// authority-ceiling product must not change by a single byte. The identities
// below were captured from the untouched website base
// 220c2c03ec8a832bb4fecdadc1d5ee19b6097750 BEFORE any P6 edit, and are asserted
// here against the working tree.
//
// If one of these fails, the correct response is to restore the frozen file —
// never to update the pinned identity.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  sha256Hex,
  gitBlobSha1Hex,
} from "../../src/lib/public-surface-adjacency-map/byteIdentity.ts";

const root = new URL("../../", import.meta.url);
const p = (rel: string) => fileURLToPath(new URL(rel, root));
const bytesOf = (rel: string) => new Uint8Array(readFileSync(p(rel)));

// Captured at website base 220c2c03ec8a832bb4fecdadc1d5ee19b6097750.
const FROZEN_IDENTITIES = [
  {
    path: "src/data/public-surface-authority-map/last-known-good.json",
    byteLength: 92903,
    sha256: "3b1e5993a52cbce340b85472fea1ae5ea6f921cf8f7751d2d635edc7b17216ea",
    gitBlob: "2d59c4fdd07a2a9ddfad94e2e214a2d1c84912af"
  },
  {
    path: "src/data/public-surface-authority-map/runtime-manifest.json",
    byteLength: 685,
    sha256: "db93852555c19607eb81cc014f5397479080ca93345b898dcc71744f4a2df9a7",
    gitBlob: "d9fb76f82f9afe667426ee33a89774e92ae5d7e4"
  },
  {
    path: "src/data/public-surface-authority-map/runtime-snapshots/18491105f0bc0451e0bf99eaa78c39f69c7cb57c-82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e.json",
    byteLength: 83727,
    sha256: "82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e",
    gitBlob: "aa25de9c60b0c0bcb2f8fec1f82bafc135e1f10b"
  },
  {
    path: "src/data/public-surface-authority-map/runtime-snapshots/3219fa03149b4bf1a229f059b4912b632028422b-3b1e5993a52cbce340b85472fea1ae5ea6f921cf8f7751d2d635edc7b17216ea.json",
    byteLength: 92903,
    sha256: "3b1e5993a52cbce340b85472fea1ae5ea6f921cf8f7751d2d635edc7b17216ea",
    gitBlob: "2d59c4fdd07a2a9ddfad94e2e214a2d1c84912af"
  },
  {
    path: "src/data/public-surface-authority-map/runtime-snapshots/97631bc0a36f39331a6950d1498400213208afb6-82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e.json",
    byteLength: 83727,
    sha256: "82f7f74b98a9b3b94a9ed0b12a394f1db2d9b5d256f700d311061c1353f4ef1e",
    gitBlob: "aa25de9c60b0c0bcb2f8fec1f82bafc135e1f10b"
  },
  {
    path: "src/lib/public-surface-authority-map/byteIdentity.ts",
    byteLength: 6504,
    sha256: "91900acf92a67fd26b659eb9d1549f3c23a4acb897ca8dd23fe40a9694960bd0",
    gitBlob: "b72f38641aa7962eb60b0b81b0e28b5160dbfefd"
  },
  {
    path: "src/lib/public-surface-authority-map/contract.ts",
    byteLength: 27850,
    sha256: "56bdd47d1a7dea0fa8ff4d314ca7201e83d205901399bf363383b01edc4356b2",
    gitBlob: "e70c26fd4ebb089ddcb720bda091ffaf1ca5a82d"
  },
  {
    path: "src/lib/public-surface-authority-map/d3AuthorityKeyboardNavigation.ts",
    byteLength: 8775,
    sha256: "31b17a17447332481b0b60d6bad7eec44d6a4b1e09779ff0c22f50ca176d6c23",
    gitBlob: "fa219cb80199901efba3fee82f6eac792c9c8704"
  },
  {
    path: "src/lib/public-surface-authority-map/d3AuthorityLayout.ts",
    byteLength: 15537,
    sha256: "a0d5442b2cfb9d4f3ee08f40a6c3ab9ce2080438af13129523746a093d320770",
    gitBlob: "d262bcdd11204454c1141e514f7c2ddfdbeaa8a6"
  },
  {
    path: "src/lib/public-surface-authority-map/d3AuthorityRenderer.ts",
    byteLength: 12699,
    sha256: "2a9b078457fd8b566f8e9fec13b91f9b3c347e9a918825ce2ea03f24b67b8ab0",
    gitBlob: "c0ec7485ed0033a9b41ddb6ab7f7e615f4b3b828"
  },
  {
    path: "src/lib/public-surface-authority-map/d3AuthorityViewport.ts",
    byteLength: 18587,
    sha256: "baf2f99fa73f2f0e6f840a32a3b72958eabcb5b3b30bfa20b898197eddf58a29",
    gitBlob: "b4288e3438b62daf7e6b421b213fc473666b3a2e"
  },
  {
    path: "src/lib/public-surface-authority-map/fallback.ts",
    byteLength: 4415,
    sha256: "831445ab258f0539406e2e41b8aa113bbc16e1d8256dba3c33cb0be36e7e555e",
    gitBlob: "529ead5abdb3ea5ea41876ed48b4eb10cf50c413"
  },
  {
    path: "src/lib/public-surface-authority-map/runtimeLoader.ts",
    byteLength: 15945,
    sha256: "6aecc6ec88f84828c5f187258f00e1adb582c23f2d07f281ef792a08b00d9211",
    gitBlob: "c930965a344a752e9f725fd458abc4848d11cb5d"
  },
  {
    path: "src/lib/public-surface-authority-map/runtimeManifestContract.ts",
    byteLength: 11859,
    sha256: "47a25e65004fc60b6956c30f1eb967abd3f1b8f8af22882c2a7e391fcab04c96",
    gitBlob: "5530778ed95db75f30d67656c7439d2deff71cb8"
  },
  {
    path: "src/pages/public-surface-map/interactive.astro",
    byteLength: 1204,
    sha256: "d9d8dbdebf4fdff51a3cdecb2730d237cbe137a09cb1eb6320880934d9af4151",
    gitBlob: "d6e359c086fe48948f04dab43d4d27e46c7f50c4"
  },
  {
    path: "src/pages/public-surface-map/data/manifest.json.ts",
    byteLength: 1135,
    sha256: "5ab7292720a1df1d1dbe1f6a1ce84b11d995fed25cd986f52bb918543ccb750c",
    gitBlob: "26df6e55ca0822b5b9d44be566b3b1ad422b031b"
  },
  {
    path: "src/pages/public-surface-map/data/snapshots/[snapshotId].json.ts",
    byteLength: 2929,
    sha256: "c3e062a1aa59076ab519a447fe9333f5a690644b4486aed371cfc4f83f8b57e0",
    gitBlob: "99a83371f00d780469c9452398f1a7941fd46816"
  },
  {
    path: "src/components/PublicSurfaceAuthorityMap.astro",
    byteLength: 34753,
    sha256: "92329a320c38dec0df5f6148d878f9e64d549a5710a5d95edd7fb7928722b563",
    gitBlob: "e04ebc307d801acb878e2a6a0795ece1ac746762"
  },
  {
    path: "src/components/publicSurfaceAuthorityMap.client.ts",
    byteLength: 50946,
    sha256: "9d39d30476dff7ea7374ea1b6c5a871f0a754554db5b7a60cdd573004b38a63c",
    gitBlob: "6fbe3d5827f412dd07d228a83f066cc8301eb404"
  },
  {
    path: "scripts/verify-public-surface-map-build.mjs",
    byteLength: 31519,
    sha256: "0a248c87794c3ab9ea5994cc79dc258c4638eb9f14fcf4aeee3b58a8fafb02cb",
    gitBlob: "de691294e9ff70e69a39113f361058d4dd11f50f"
  }
];

test("every frozen authority-map product file is byte-identical", async () => {
  assert.equal(FROZEN_IDENTITIES.length, 20);
  for (const expected of FROZEN_IDENTITIES) {
    assert.ok(existsSync(p(expected.path)), `missing frozen file: ${expected.path}`);
    const bytes = bytesOf(expected.path);
    assert.equal(bytes.length, expected.byteLength, `${expected.path}: byte length`);
    assert.equal(await sha256Hex(bytes), expected.sha256, `${expected.path}: SHA-256`);
    assert.equal(await gitBlobSha1Hex(bytes), expected.gitBlob, `${expected.path}: Git blob`);
  }
});

test("no file was added to or removed from the frozen data namespace", () => {
  const dir = "src/data/public-surface-authority-map";
  const entries = readdirSync(p(dir)).sort();
  assert.deepEqual(entries, ["last-known-good.json", "runtime-manifest.json", "runtime-snapshots"]);

  const snapshots = readdirSync(p(`${dir}/runtime-snapshots`)).sort();
  assert.equal(snapshots.length, 3);
  for (const name of snapshots) {
    assert.ok(
      FROZEN_IDENTITIES.some((entry) => entry.path.endsWith(`/${name}`)),
      `unpinned snapshot appeared: ${name}`,
    );
  }
});

test("no file was added to or removed from the frozen contract namespace", () => {
  const entries = readdirSync(p("src/lib/public-surface-authority-map")).sort();
  assert.deepEqual(entries, [
    "byteIdentity.ts",
    "contract.ts",
    "d3AuthorityKeyboardNavigation.ts",
    "d3AuthorityLayout.ts",
    "d3AuthorityRenderer.ts",
    "d3AuthorityViewport.ts",
    "fallback.ts",
    "runtimeLoader.ts",
    "runtimeManifestContract.ts",
  ]);
});

test("the existing verifier is unchanged and still registered in the pipeline", () => {
  const pkg = JSON.parse(readFileSync(p("package.json"), "utf8"));
  assert.equal(
    pkg.scripts["verify:public-surface-map"],
    "node scripts/verify-public-surface-map-build.mjs",
  );
  assert.ok(pkg.scripts.check.includes("pnpm run verify:public-surface-map &&"));
  // The new verifier is registered alongside it, never in place of it.
  assert.equal(
    pkg.scripts["verify:public-surface-adjacency-map"],
    "node scripts/verify-public-surface-adjacency-map-build.mjs",
  );
  assert.ok(pkg.scripts.check.includes("pnpm run verify:public-surface-adjacency-map"));
});

test("the whole existing check pipeline is preserved in order", () => {
  const pkg = JSON.parse(readFileSync(p("package.json"), "utf8"));
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
  // The original pipeline is an unmodified PREFIX of the new one.
  assert.ok(pkg.scripts.check.startsWith(BASE_PIPELINE.join(" && ")));
});

test("no new dependency was introduced", () => {
  const pkg = JSON.parse(readFileSync(p("package.json"), "utf8"));
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), [
    "@astrojs/cloudflare",
    "@astrojs/mdx",
    "@astrojs/sitemap",
    "astro",
    "d3-selection",
    "typescript",
  ]);
  assert.deepEqual(Object.keys(pkg.devDependencies).sort(), [
    "@astrojs/check",
    "@types/d3-selection",
    "fast-xml-parser",
    "wrangler",
  ]);
  assert.equal(pkg.packageManager, "pnpm@10.34.5");
});

test("the expanded product never imports or repoints the frozen product", () => {
  const newSources = [
    "src/lib/public-surface-adjacency-map/byteIdentity.ts",
    "src/lib/public-surface-adjacency-map/contract.ts",
    "src/lib/public-surface-adjacency-map/fallback.ts",
    "src/lib/public-surface-adjacency-map/layout.ts",
    "src/lib/public-surface-adjacency-map/publicWording.ts",
    "src/lib/public-surface-adjacency-map/runtimeLoader.ts",
    "src/lib/public-surface-adjacency-map/runtimeManifestContract.ts",
    "src/components/PublicSurfaceAdjacencyMap.astro",
    "src/scripts/public-surface-adjacency-map.ts",
    "src/pages/public-surface-map/expanded/index.astro",
    "src/pages/public-surface-map/expanded/data/manifest.json.ts",
    "src/pages/public-surface-map/expanded/data/snapshots/[snapshotId].json.ts",
  ];
  for (const rel of newSources) {
    // Comment prose may NAME the frozen namespace to state the separation; what
    // must not exist is an executable import or path reference to it.
    const code = readFileSync(p(rel), "utf8")
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim();
        return !trimmed.startsWith("//") && !trimmed.startsWith("*") && !trimmed.startsWith("/*");
      })
      .join("\n");
    assert.ok(
      !code.includes("public-surface-authority-map"),
      `${rel} references the frozen namespace in executable code`,
    );
    assert.ok(!code.includes("PublicSurfaceAuthorityMap"), `${rel} references the frozen component`);
  }
});

test("the frozen route still exists and its data namespace is not aliased", () => {
  const interactive = readFileSync(p("src/pages/public-surface-map/interactive.astro"), "utf8");
  assert.ok(interactive.includes("PublicSurfaceAuthorityMap"));
  assert.ok(!interactive.includes("public-surface-adjacency-map"));

  const expandedManifest = JSON.parse(
    readFileSync(p("src/data/public-surface-adjacency-map/runtime-manifest.json"), "utf8"),
  );
  assert.ok(expandedManifest.selected_snapshot.path.startsWith("/public-surface-map/expanded/data/"));

  const frozenManifest = JSON.parse(
    readFileSync(p("src/data/public-surface-authority-map/runtime-manifest.json"), "utf8"),
  );
  assert.equal(frozenManifest.map_id, "public-surface-authority-map");
  assert.ok(frozenManifest.selected_snapshot.path.startsWith("/public-surface-map/data/"));
});
