import { execFile } from "node:child_process";
import { basename } from "node:path";
import type { GitCommitRecord, GitReportData, GitReportQuery, GitRepositoryInfo } from "./desktop-api";

const MAX_COMMITS = 1000;
const MAX_BUFFER = 20 * 1024 * 1024;
const MAX_DIFF_BUFFER = 2 * 1024 * 1024;
const MAX_DIFF_COMMITS = 30;
const MAX_DIFF_FILES_PER_COMMIT = 80;
const MAX_DIFF_CHARS_PER_COMMIT = 12_000;
const MAX_DIFF_CHARS = 90_000;
const authorizedRepositories = new Set<string>();

const EXCLUDED_DIRECTORIES = new Set([
  ".git",
  ".next",
  ".nuxt",
  ".output",
  "build",
  "coverage",
  "dist",
  "generated",
  "node_modules",
  "release",
  "vendor"
]);
const EXCLUDED_FILENAMES = new Set([
  ".npmrc",
  ".netrc",
  "bun.lock",
  "bun.lockb",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock"
]);
const EXCLUDED_EXTENSIONS = new Set([
  ".7z",
  ".avi",
  ".db",
  ".dmg",
  ".eot",
  ".gif",
  ".gz",
  ".ico",
  ".jar",
  ".jpeg",
  ".jpg",
  ".jks",
  ".keystore",
  ".mov",
  ".mp3",
  ".mp4",
  ".pdf",
  ".pfx",
  ".png",
  ".sqlite",
  ".tar",
  ".ttf",
  ".webm",
  ".webp",
  ".woff",
  ".woff2",
  ".zip"
]);

export function isSafeDiffPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  const parts = normalized.split("/");
  const fileName = parts.at(-1) ?? "";
  if (parts.slice(0, -1).some(part => EXCLUDED_DIRECTORIES.has(part))) return false;
  if (EXCLUDED_FILENAMES.has(fileName)) return false;
  if (fileName === ".env" || fileName.startsWith(".env.")) return false;
  if (/^(?:id_rsa|id_ed25519|secrets?|credentials?)(?:\..+)?$/i.test(fileName)) return false;
  const extension = fileName.includes(".") ? `.${fileName.split(".").at(-1)}` : "";
  if (EXCLUDED_EXTENSIONS.has(extension)) return false;
  return !/\.(?:key|p12|pem)$/i.test(fileName);
}

export function redactDiff(diff: string): string {
  const sensitiveAssignment =
    /(?:^|[^A-Za-z0-9])(?:[A-Za-z0-9]+[_-])*(?:api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|client[_-]?secret|database[_-]?url|connection[_-]?(?:string|uri)|password|passwd|private[_-]?key|secret)\b["']?\s*[:=]/i;
  const sensitiveValue =
    /-----BEGIN [A-Z ]*PRIVATE KEY-----|\bAKIA[0-9A-Z]{16}\b|\bAIza[0-9A-Za-z_-]{30,}\b|\bBearer\s+[A-Za-z0-9._~+/=-]{12,}|\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b|\b(?:ghp_|github_pat_|glpat-|npm_|sk-|xox[baprs]-)[A-Za-z0-9_-]{12,}\b/i;
  return diff
    .split("\n")
    .map(line => {
      if (!sensitiveAssignment.test(line) && !sensitiveValue.test(line)) return line;
      const prefix = line.startsWith("+") || line.startsWith("-") || line.startsWith(" ") ? line[0] : "";
      return `${prefix}[REDACTED sensitive line]`;
    })
    .join("\n");
}

function sanitizeRemoteUrl(remoteUrl: string): string {
  try {
    const url = new URL(remoteUrl);
    url.username = "";
    url.password = "";
    return url.toString();
  } catch {
    return remoteUrl;
  }
}

function runGit(cwd: string, args: string[], maxBuffer = MAX_BUFFER): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      args,
      { cwd, encoding: "utf8", maxBuffer, timeout: 60_000, windowsHide: true },
      (error, stdout, stderr) => {
        if (error) {
          const detail = stderr.trim() || error.message;
          reject(new Error(`Git 命令执行失败：${detail}`));
          return;
        }
        resolve(stdout);
      }
    );
  });
}

async function runGitOptional(cwd: string, args: string[]): Promise<string> {
  try {
    return await runGit(cwd, args);
  } catch {
    return "";
  }
}

export async function inspectRepository(selectedPath: string): Promise<GitRepositoryInfo> {
  const root = (await runGit(selectedPath, ["rev-parse", "--show-toplevel"])).trim();
  const insideWorkTree = (await runGit(root, ["rev-parse", "--is-inside-work-tree"])).trim();
  if (insideWorkTree !== "true") throw new Error("所选目录不是 Git 工作仓库");

  const currentBranch = (await runGitOptional(root, ["branch", "--show-current"])).trim() || "HEAD";
  const branches = (await runGitOptional(root, ["for-each-ref", "--format=%(refname:short)", "refs/heads/"]))
    .split("\n")
    .map(branch => branch.trim())
    .filter(Boolean);
  const rawRemoteUrl = (await runGitOptional(root, ["config", "--get", "remote.origin.url"])).trim();
  const remoteUrl = rawRemoteUrl ? sanitizeRemoteUrl(rawRemoteUrl) : null;

  authorizedRepositories.add(root);
  return { path: root, name: basename(root), currentBranch, branches, remoteUrl };
}

function validateQuery(query: GitReportQuery): void {
  if (!authorizedRepositories.has(query.repositoryPath)) throw new Error("请重新选择 Git 仓库");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(query.since) || !/^\d{4}-\d{2}-\d{2}$/.test(query.until)) {
    throw new Error("日期格式无效");
  }
  if (query.since > query.until) throw new Error("开始日期不能晚于结束日期");
}

function parseLog(output: string): GitCommitRecord[] {
  return output
    .split("\x1e")
    .slice(1)
    .filter(Boolean)
    .map(record => {
      const parts = record.split("\0");
      const metadata = parts.shift()?.replace(/^\n+|\n+$/g, "") ?? "";
      const [hash, shortHash, authorName, authorEmail, authoredAt, subject] = metadata.split("\x1f");
      let additions = 0;
      let deletions = 0;
      let changedFiles = 0;
      const files: GitCommitRecord["files"] = [];

      for (const rawStat of parts) {
        const stat = rawStat.replace(/^\n+/, "");
        if (!stat) continue;
        const [added, deleted, ...pathParts] = stat.split("\t");
        if (!pathParts.length) continue;
        const path = pathParts.join("\t");
        const addedLines = added === "-" ? null : Number(added) || 0;
        const deletedLines = deleted === "-" ? null : Number(deleted) || 0;
        changedFiles += 1;
        if (addedLines !== null) additions += addedLines;
        if (deletedLines !== null) deletions += deletedLines;
        files.push({ path, additions: addedLines, deletions: deletedLines });
      }

      return {
        hash,
        shortHash,
        authorName,
        authorEmail,
        authoredAt,
        subject,
        additions,
        deletions,
        changedFiles,
        files,
        filesTruncated: false
      };
    });
}

async function includeDiffs(repositoryPath: string, commits: GitCommitRecord[]) {
  let includedCharacters = 0;
  let includedCommits = 0;
  let excludedFiles = 0;
  let truncated = false;
  const enriched: GitCommitRecord[] = [];

  for (const [index, commit] of commits.entries()) {
    const filteredFiles = commit.files.filter(file => isSafeDiffPath(file.path));
    excludedFiles += commit.files.length - filteredFiles.length;
    const files = filteredFiles.slice(0, MAX_DIFF_FILES_PER_COMMIT);
    const filesTruncated = filteredFiles.length > files.length;
    if (filesTruncated) truncated = true;
    const next: GitCommitRecord = { ...commit, files, filesTruncated };

    if (index >= MAX_DIFF_COMMITS || includedCharacters >= MAX_DIFF_CHARS || files.length === 0) {
      if (files.length > 0) truncated = true;
      enriched.push(next);
      continue;
    }

    try {
      const rawDiff = await runGit(
        repositoryPath,
        [
          "--literal-pathspecs",
          "show",
          "--format=",
          "--patch",
          "--first-parent",
          "--no-color",
          "--no-ext-diff",
          "--no-textconv",
          "--no-renames",
          "--unified=3",
          commit.hash,
          "--",
          ...files.map(file => file.path)
        ],
        MAX_DIFF_BUFFER
      );
      const redacted = redactDiff(rawDiff).trim();
      if (redacted) {
        const remaining = MAX_DIFF_CHARS - includedCharacters;
        const limit = Math.min(MAX_DIFF_CHARS_PER_COMMIT, remaining);
        next.diff = redacted.slice(0, limit);
        next.diffTruncated = redacted.length > limit || filesTruncated;
        includedCharacters += next.diff.length;
        includedCommits += 1;
        if (next.diffTruncated) truncated = true;
      }
    } catch {
      truncated = true;
    }
    enriched.push(next);
  }

  return {
    commits: enriched,
    diffSummary: { includedCommits, includedCharacters, excludedFiles, truncated }
  };
}

export async function generateGitData(query: GitReportQuery): Promise<GitReportData> {
  validateQuery(query);
  const repository = await inspectRepository(query.repositoryPath);
  if (query.branch !== "HEAD" && !repository.branches.includes(query.branch)) throw new Error("所选分支不存在");

  const args = [
    "log",
    `--max-count=${MAX_COMMITS + 1}`,
    `--since=${query.since}T00:00:00`,
    `--until=${query.until}T23:59:59`,
    "--use-mailmap",
    "--no-renames",
    "--no-show-signature",
    "--format=%x1e%H%x1f%h%x1f%an%x1f%ae%x1f%aI%x1f%s",
    "--numstat",
    "-z"
  ];
  if (!query.includeMerges) args.push("--no-merges");
  if (query.author?.trim()) args.push(`--author=${query.author.trim()}`);
  args.push("--end-of-options", query.branch, "--");

  const parsed = parseLog(await runGit(repository.path, args));
  const truncated = parsed.length > MAX_COMMITS;
  const commits = parsed.slice(0, MAX_COMMITS);
  const totals = commits.reduce(
    (summary, commit) => ({
      commits: summary.commits + 1,
      additions: summary.additions + commit.additions,
      deletions: summary.deletions + commit.deletions,
      changedFiles: summary.changedFiles + commit.changedFiles
    }),
    { commits: 0, additions: 0, deletions: 0, changedFiles: 0 }
  );

  const diffData = await includeDiffs(repository.path, commits);
  return { repository, commits: diffData.commits, totals, diffSummary: diffData.diffSummary, truncated };
}
