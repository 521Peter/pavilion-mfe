export {};

import type { GitReportData, GitReportQuery, GitRepositoryInfo } from "./types";

declare global {
  interface Window {
    __PAVILION_MFE_ENV__?: boolean;
    desktop?: {
      platform: string;
      versions: { electron: string; chrome: string; node: string };
      git: {
        pickRepository(): Promise<GitRepositoryInfo | null>;
        generateData(query: GitReportQuery): Promise<GitReportData>;
      };
      report: {
        save(input: { suggestedName: string; content: string }): Promise<{ canceled: boolean; filePath?: string }>;
      };
    };
  }
}
