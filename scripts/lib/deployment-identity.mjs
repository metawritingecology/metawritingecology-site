import { execFileSync } from "node:child_process";

const FULL_SHA = /^[0-9a-f]{40}$/;

function defaultRunGit(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"]
  }).trim();
}

export function resolveDeploymentCommit({ cwd, env = process.env, runGit = defaultRunGit } = {}) {
  if (!cwd) throw new Error("deployment identity requires a repository root");

  let head;
  let status;
  try {
    head = runGit(["rev-parse", "HEAD"], cwd);
    status = runGit(["status", "--porcelain", "--untracked-files=all"], cwd);
  } catch {
    throw new Error("deployment identity requires a readable Git HEAD and working tree");
  }

  if (!FULL_SHA.test(head)) {
    throw new Error("deployment identity requires a full lowercase Git SHA at HEAD");
  }
  if (status.length > 0) {
    throw new Error("deployment identity requires a clean tracked working tree");
  }

  const configured = env.PSADJ_DEPLOYMENT_COMMIT?.trim();
  if (configured !== undefined && configured !== head) {
    throw new Error("PSADJ_DEPLOYMENT_COMMIT must exactly equal git rev-parse HEAD");
  }

  return head;
}
