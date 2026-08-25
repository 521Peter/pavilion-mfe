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
  totals: { commits: number; additions: number; deletions: number; changedFiles: number };
  diffSummary: {
    includedCommits: number;
    includedCharacters: number;
    excludedFiles: number;
    truncated: boolean;
  };
  truncated: boolean;
}

export interface AvailableModel {
  id: string;
  providerId: string;
  providerName: string;
  providerType: string;
  modelName: string;
  displayName: string;
}
