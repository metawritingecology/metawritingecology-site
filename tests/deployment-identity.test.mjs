import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveDeploymentCommit } from "../scripts/lib/deployment-identity.mjs";

const HEAD = "44f90001ec2cc8629c5aee3dfc692b1933b45f50";

function fakeGit(status = "", head = HEAD) {
  return (args) => {
    if (args[0] === "rev-parse") return head;
    if (args[0] === "status") return status;
    throw new Error("unexpected git command");
  };
}

test("deployment identity accepts a clean HEAD when no override is set", () => {
  assert.equal(resolveDeploymentCommit({ cwd: ".", env: {}, runGit: fakeGit() }), HEAD);
});

test("deployment identity rejects an override that differs from HEAD", () => {
  assert.throws(
    () => resolveDeploymentCommit({
      cwd: ".",
      env: { PSADJ_DEPLOYMENT_COMMIT: "4916e8f190eed5a76d47c6aa998e0e3e804a6644" },
      runGit: fakeGit(),
    }),
    /exactly equal/,
  );
});

test("deployment identity rejects a dirty working tree", () => {
  assert.throws(
    () => resolveDeploymentCommit({ cwd: ".", env: {}, runGit: fakeGit(" M src/file.ts") }),
    /clean tracked working tree/,
  );
});

test("deployment identity rejects a malformed configured SHA", () => {
  assert.throws(
    () => resolveDeploymentCommit({ cwd: ".", env: { PSADJ_DEPLOYMENT_COMMIT: "not-a-sha" }, runGit: fakeGit() }),
    /exactly equal/,
  );
});

test("deployment identity rejects missing Git identity", () => {
  assert.throws(
    () => resolveDeploymentCommit({ cwd: ".", env: {}, runGit: () => { throw new Error("not a repository"); } }),
    /readable Git HEAD/,
  );
});
