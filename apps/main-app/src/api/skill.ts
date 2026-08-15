import { api, http } from "./http";

export interface SkillSummary {
  name: string;
  description: string;
  source: string;
  repoOwner: string | null;
  repoName: string | null;
  isActive: boolean;
  fileCount: number;
  contentHash: string | null;
}

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
  children?: FileNode[];
}

export interface SkillDetail {
  name: string;
  description: string;
  directory: string;
  skillMd: string;
  fileTree: FileNode[];
  source: string;
  repoOwner: string | null;
  repoName: string | null;
  readmeUrl: string | null;
  contentHash: string | null;
  updatedAt: string | null;
}

export interface RemoteSkillInfo {
  name: string;
  description: string;
  path: string;
}

export interface SkillRepo {
  id: string;
  owner: string;
  name: string;
  branch: string;
  isEnabled: boolean;
}

export const skillApi = {
  list: () => api.get<SkillSummary[]>("/skills"),
  get: (name: string) => api.get<SkillDetail>(`/skills/${name}`),
  readFile: (name: string, path: string) =>
    api.get<{ path: string; content: string }>(`/skills/${name}/files?path=${encodeURIComponent(path)}`),
  create: (data: { name: string; description?: string }) => api.post<SkillDetail>("/skills", data),
  toggle: (name: string, isActive: boolean) =>
    http<SkillDetail>(`/skills/${name}/toggle`, { method: "PUT", body: JSON.stringify({ isActive }) }),
  writeFile: (name: string, path: string, content: string) =>
    http<{ success: boolean }>(`/skills/${name}/files`, { method: "PUT", body: JSON.stringify({ path, content }) }),
  delete: (name: string) => http<{ success: boolean }>(`/skills/${name}`, { method: "DELETE" }),
  // 远程
  browseRemote: (data: { owner: string; repo: string; branch: string; path?: string }) =>
    api.post<RemoteSkillInfo[]>("/skills/remote/browse", data),
  installRemote: (data: { owner: string; repo: string; branch: string; skillName: string; skillPath?: string }) =>
    api.post<SkillDetail>("/skills/remote/install", data),
  // 仓库源
  listRepos: () => api.get<SkillRepo[]>("/skills/repos/list"),
  addRepo: (data: { owner: string; name: string; branch?: string }) => api.post<SkillRepo>("/skills/repos", data),
  removeRepo: (id: string) => http<{ success: boolean }>(`/skills/repos/${id}`, { method: "DELETE" })
};
