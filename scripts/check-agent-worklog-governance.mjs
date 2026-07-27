#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const REVIEW_THRESHOLD_LINES = 4000;
const HARD_REVIEW_THRESHOLD_LINES = 5000;
const BOT_BRANCH_PREFIXES = ["dependabot/", "renovate/"];
const REPOSITORY = "metawritingecology/metawritingecology-site";

const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== "--json")) {
  console.error("Usage: node scripts/check-agent-worklog-governance.mjs [--json]");
  process.exit(2);
}

const jsonMode = args[0] === "--json";

function runGit(gitArgs) {
  try {
    return {
      ok: true,
      stdout: execFileSync("git", ["-c", "http.sslBackend=openssl", "-c", "core.longpaths=true", ...gitArgs], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim(),
      stderr: "",
    };
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout?.toString().trim() ?? "",
      stderr: error.stderr?.toString().trim() || error.message,
    };
  }
}

function requireGit(gitArgs, message) {
  const result = runGit(gitArgs);
  if (!result.ok) throw new Error(`${message}: ${result.stderr}`);
  return result.stdout;
}

function splitLines(text) {
  if (text.length === 0) return [];
  return text.split(/\r\n|\n|\r/);
}

function rolloverLineStatus(lineCount) {
  if (lineCount >= HARD_REVIEW_THRESHOLD_LINES) return "hard_review_threshold_reached";
  if (lineCount >= REVIEW_THRESHOLD_LINES) return "review_threshold_reached";
  return "below_review_threshold";
}

function hasCommand(command) {
  return spawnSync(command, ["--version"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).status === 0;
}

function fetchPrMetadata() {
  if (!hasCommand("gh")) {
    return { available: false, reason: "gh_absent", detail: null, byHead: new Map() };
  }

  const result = spawnSync(
    "gh",
    [
      "pr",
      "list",
      "--repo",
      REPOSITORY,
      "--state",
      "all",
      "--limit",
      "200",
      "--json",
      "number,state,isDraft,headRefName,headRefOid,baseRefName,mergedAt,mergeCommit",
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );

  if (result.status !== 0) {
    return {
      available: false,
      reason: "gh_pr_access_failed",
      detail: result.stderr.trim() || result.stdout.trim(),
      byHead: new Map(),
    };
  }

  try {
    const byHead = new Map();
    for (const pr of JSON.parse(result.stdout)) {
      if (!pr.headRefName) continue;
      byHead.set(pr.headRefName, {
        number: pr.number,
        state: pr.state,
        draft: pr.isDraft,
        base: pr.baseRefName,
        headRefName: pr.headRefName,
        headSha: pr.headRefOid,
        mergedAt: pr.mergedAt || null,
        mergeCommitSha: pr.mergeCommit?.oid || null,
      });
    }
    return { available: true, reason: null, detail: null, byHead };
  } catch (error) {
    return { available: false, reason: "gh_json_parse_failed", detail: error.message, byHead: new Map() };
  }
}

function parseRemoteBranches(output) {
  return splitLines(output)
    .map((line) => line.match(/^([0-9a-f]{40})\s+refs\/heads\/(.+)$/i))
    .filter(Boolean)
    .map((match) => ({ tipSha: match[1], name: match[2] }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeBranchName(branchName) {
  return branchName.replace(/^refs\/heads\//, "").replace(/^origin\//, "");
}

function isCurrentBranch(branchName, currentBranch) {
  return normalizeBranchName(branchName) === normalizeBranchName(currentBranch);
}

function containedInMainByAncestry(tipSha, originMainSha) {
  if (!originMainSha) return "unknown";
  const result = runGit(["merge-base", "--is-ancestor", tipSha, originMainSha]);
  if (result.ok) return true;
  return result.stderr ? "unknown" : false;
}

function buildBranchEvidence(branch, currentBranch, originMainSha, prMetadata) {
  const contained = containedInMainByAncestry(branch.tipSha, originMainSha);
  const evidence = {
    branchName: branch.name,
    tipSha: branch.tipSha,
    contained_in_main_by_ancestry: contained,
    current_branch_excluded: branch.name === currentBranch,
  };

  const pr = prMetadata.byHead.get(branch.name);
  if (pr) {
    return {
      ...evidence,
      pr,
      requires_author_or_pr_review: contained !== true && !(pr.state === "MERGED" || pr.mergedAt),
    };
  }

  return {
    ...evidence,
    pr_state_unavailable: !prMetadata.available,
    pr_metadata_found: false,
    requires_author_or_pr_review: contained !== true,
  };
}

function collectEvidence() {
  const repositoryRoot = requireGit(["rev-parse", "--show-toplevel"], "repository root cannot be determined");
  const currentBranch = requireGit(["rev-parse", "--abbrev-ref", "HEAD"], "current branch cannot be determined");
  const currentHead = requireGit(["rev-parse", "HEAD"], "current HEAD cannot be determined");
  const originMainResult = runGit(["rev-parse", "origin/main"]);
  const originMainSha = originMainResult.ok ? originMainResult.stdout : null;

  const worklogPath = `${repositoryRoot}/AGENT_WORKLOG.md`;
  if (!existsSync(worklogPath)) throw new Error("AGENT_WORKLOG.md cannot be read");

  const worklogBuffer = readFileSync(worklogPath);
  const worklogText = worklogBuffer.toString("utf8");
  const activeNoticeCount = (worklogText.match(/^## Active Log Notice$/gm) ?? []).length;
  const activeNoticePointsToAgents = /## Active Log Notice[\s\S]*?`AGENTS\.md`/.test(worklogText);

  const agentsPath = `${repositoryRoot}/AGENTS.md`;
  const agentsText = existsSync(agentsPath) ? readFileSync(agentsPath, "utf8") : "";
  const agentsCanonicalPointerPresent = agentsText.includes("node scripts/check-agent-worklog-governance.mjs");

  const remoteResult = runGit(["ls-remote", "--heads", "origin"]);
  const remoteBranches = remoteResult.ok ? parseRemoteBranches(remoteResult.stdout) : [];
  const prMetadata = fetchPrMetadata();
  const dependencyBranches = [];
  const nonBotRemoteBranches = [];
  const excludedCurrentBranches = [];

  for (const branch of remoteBranches) {
    if (isCurrentBranch(branch.name, currentBranch)) {
      excludedCurrentBranches.push({
        branchName: branch.name,
        tipSha: branch.tipSha,
        reason: "current_branch",
      });
      continue;
    }

    const evidence = buildBranchEvidence(branch, currentBranch, originMainSha, prMetadata);
    if (BOT_BRANCH_PREFIXES.some((prefix) => branch.name.startsWith(prefix))) {
      dependencyBranches.push(evidence);
    } else {
      nonBotRemoteBranches.push(evidence);
    }
  }

  return {
    repositoryRoot,
    currentBranch,
    currentHead,
    originMainSha,
    agentWorklog: {
      byteSize: worklogBuffer.byteLength,
      lineCount: splitLines(worklogText).length,
      datedEntryCount: (worklogText.match(/^### \d{4}-\d{2}-\d{2} /gm) ?? []).length,
      rolloverLineStatus: rolloverLineStatus(splitLines(worklogText).length),
      activeLogNoticeCount: activeNoticeCount,
      activeLogNoticeOccursExactlyOnce: activeNoticeCount === 1,
      activeLogNoticePointsToAgents: activeNoticePointsToAgents,
    },
    agentsCanonicalPointerPresent,
    remoteBranchEvidenceAvailable: remoteResult.ok,
    currentBranchExclusion: currentBranch,
    excludedCurrentBranches,
    botDependencyPrefixes: BOT_BRANCH_PREFIXES,
    prMetadata: {
      available: prMetadata.available,
      reason: prMetadata.reason,
      detail: prMetadata.detail,
    },
    dependencyBranches,
    nonBotRemoteBranches,
  };
}

function printHuman(evidence) {
  console.log("Agent worklog governance evidence");
  console.log("");
  console.log(`Repository root: ${evidence.repositoryRoot}`);
  console.log(`Current branch: ${evidence.currentBranch}`);
  console.log(`Current HEAD: ${evidence.currentHead}`);
  console.log(`Available origin/main SHA: ${evidence.originMainSha ?? "unknown"}`);
  console.log("");
  console.log("AGENT_WORKLOG.md:");
  console.log(`  Exact byte size: ${evidence.agentWorklog.byteSize}`);
  console.log(`  Exact line count: ${evidence.agentWorklog.lineCount}`);
  console.log(`  Dated-entry count: ${evidence.agentWorklog.datedEntryCount}`);
  console.log(`  Rollover line status: ${evidence.agentWorklog.rolloverLineStatus}`);
  console.log(`  Active Log Notice count: ${evidence.agentWorklog.activeLogNoticeCount}`);
  console.log(`  Active Log Notice points to AGENTS.md: ${evidence.agentWorklog.activeLogNoticePointsToAgents}`);
  console.log(`  AGENTS.md script invocation pointer present: ${evidence.agentsCanonicalPointerPresent}`);
  console.log("");
  console.log(`Current branch exclusion: ${evidence.currentBranchExclusion}`);
  console.log("Excluded current branch refs:");
  for (const branch of evidence.excludedCurrentBranches) {
    console.log(`  - ${branch.branchName} ${branch.tipSha} reason=${branch.reason}`);
  }
  console.log(`Remote branch evidence available: ${evidence.remoteBranchEvidenceAvailable}`);
  const prState = evidence.prMetadata.available
    ? "available"
    : `pr_state_unavailable (${evidence.prMetadata.reason}${evidence.prMetadata.detail ? `: ${evidence.prMetadata.detail}` : ""})`;
  console.log(`PR metadata: ${prState}`);
  console.log("");
  console.log("Bot/dependency branches:");
  for (const branch of evidence.dependencyBranches) {
    console.log(
      `  - ${branch.branchName} ${branch.tipSha} contained_in_main_by_ancestry=${branch.contained_in_main_by_ancestry}`,
    );
  }
  console.log("");
  console.log("Non-bot remote branches:");
  for (const branch of evidence.nonBotRemoteBranches) {
    const prText = branch.pr
      ? ` pr=#${branch.pr.number} state=${branch.pr.state} merged_at=${branch.pr.mergedAt ?? "null"}`
      : branch.pr_state_unavailable
        ? " pr_state_unavailable"
        : " pr_metadata_found=false";
    console.log(
      `  - ${branch.branchName} ${branch.tipSha} contained_in_main_by_ancestry=${branch.contained_in_main_by_ancestry}${prText} requires_author_or_pr_review=${branch.requires_author_or_pr_review}`,
    );
  }
}

try {
  const evidence = collectEvidence();
  const errors = [];
  if (!evidence.agentWorklog.activeLogNoticeOccursExactlyOnce) {
    errors.push("Active Log Notice must occur exactly once");
  }
  if (!evidence.agentWorklog.activeLogNoticePointsToAgents) {
    errors.push("Active Log Notice must point to AGENTS.md");
  }
  if (!evidence.agentsCanonicalPointerPresent) {
    errors.push("AGENTS.md script invocation pointer is absent");
  }

  if (jsonMode) {
    console.log(JSON.stringify(evidence, null, 2));
  } else {
    printHuman(evidence);
  }

  if (errors.length > 0) {
    for (const error of errors) console.error(`ERROR: ${error}`);
    process.exit(1);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (jsonMode) {
    console.log(JSON.stringify({ error: message }, null, 2));
  } else {
    console.error(message);
  }
  process.exit(1);
}
