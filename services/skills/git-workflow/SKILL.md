---
name: git-workflow
description: Git 工作流规范和 commit message 规范，适用于团队协作开发
---

# Git Workflow

## Commit Message 规范

使用 Conventional Commits 格式：

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | 修复 bug |
| docs | 文档变更 |
| refactor | 重构（不改功能） |
| test | 测试相关 |
| chore | 构建/工具变更 |

## 分支策略

- main: 生产分支，只接受 PR 合入
- develop: 开发分支
- feature/*: 功能分支
- fix/*: 修复分支
- hotfix/*: 紧急修复

详细模板见 [commit-templates](references/commit-templates.md)