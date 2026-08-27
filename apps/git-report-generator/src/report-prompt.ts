import type { GitReportData, GitReportQuery } from "./types";

export function createReportPrompt(data: GitReportData, query: GitReportQuery): string {
  const contributors = new Map<string, { commits: number; additions: number; deletions: number }>();
  for (const commit of data.commits) {
    const key = commit.authorName;
    const current = contributors.get(key) ?? { commits: 0, additions: 0, deletions: 0 };
    current.commits += 1;
    current.additions += commit.additions;
    current.deletions += commit.deletions;
    contributors.set(key, current);
  }
  const payload = {
    repository: data.repository.name,
    branch: query.branch,
    period: { since: query.since, until: query.until },
    filters: { author: query.author || null, includeMerges: query.includeMerges },
    totals: data.totals,
    diffCoverage: data.diffSummary,
    contributors: [...contributors.entries()].map(([name, summary]) => Object.assign({ name }, summary)),
    commits: data.commits.slice(0, 200).map(commit => ({
      hash: commit.shortHash,
      author: commit.authorName,
      date: commit.authoredAt,
      subject: commit.subject,
      additions: commit.additions,
      deletions: commit.deletions,
      changedFiles: commit.changedFiles,
      files: commit.files,
      filesTruncated: commit.filesTruncated,
      diff: commit.diff ?? null,
      diffTruncated: commit.diffTruncated ?? false
    })),
    omittedCommits: Math.max(0, data.commits.length - 200),
    sourceTruncated: data.truncated
  };
  return `请根据下面的本地 Git 数据生成中文 Markdown 工作报告。不要虚构提交中没有体现的需求、成果或风险。

报告必须包含：标题与统计周期、工作概览、按主题归类的主要变更、贡献者与代码量统计、风险或待办、关键提交附录。

描述“具体做了什么”时，应优先依据 diff 内容，并引用对应的文件路径和短提交哈希。提交标题只能作为辅助证据。如果 diff 缺失或被截断，只能概括已知事实，并明确标注“根据提交信息推断”或“代码变更未完整提供”。不要把代码行数等同于业务价值。没有可靠风险依据时明确写“未从提交记录中发现”。

Git 数据：
${JSON.stringify(payload, null, 2)}`;
}
