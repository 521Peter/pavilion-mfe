export interface GitRepositoryInfo {
  path: string;
  name: string;
  currentBranch: string;
  branches: string[];
  remoteUrl: string | null;
}

export interface GitReportQuery {
  repositoryPath: string;
  branch: string;
  since: string;
  until: string;
  author?: string;
  includeMerges: boolean;
}

export interface GitCommitRecord {
  hash: string;
  shortHash: string;
  authorName: string;
  authorEmail: string;
  authoredAt: string;
  subject: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  files: Array<{
    path: string;
    additions: number | null;
    deletions: number | null;
  }>;
  filesTruncated: boolean;
  diff?: string;
  diffTruncated?: boolean;
}

export interface GitReportData {
  repository: GitRepositoryInfo;
  commits: GitCommitRecord[];
  totals: {
    commits: number;
    additions: number;
    deletions: number;
    changedFiles: number;
  };
  diffSummary: {
    includedCommits: number;
    includedCharacters: number;
    excludedFiles: number;
    truncated: boolean;
  };
  truncated: boolean;
}

export interface SaveReportInput {
  suggestedName: string;
  content: string;
}

export interface SaveReportResult {
  canceled: boolean;
  filePath?: string;
}

export const DESKTOP_CHANNELS = {
  pickRepository: "desktop:git:pick-repository",
  generateGitData: "desktop:git:generate-data",
  saveReport: "desktop:report:save"
} as const;
