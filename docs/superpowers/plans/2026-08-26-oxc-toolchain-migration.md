# PavilionMfe 全仓 Oxc 工具链迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 以根目录统一的 Oxlint + Oxfmt 完整替代仓库中的 ESLint + Prettier，并让本地、暂存区、VS Code 与 CI 共享同一质量门禁。

**Architecture:** 根目录是 lint 与 format 的唯一事实来源，所有 workspace 删除局部配置和重复直接依赖。Oxlint 使用单一 `.oxlintrc.json` 及目录 overrides 覆盖 React、Node/NestJS、Jest 和声明文件；Oxfmt 使用单一 `.oxfmtrc.json` 保持既有格式风格。工具链迁移和机械格式化分别提交，最终通过根 `check`、干净安装和关键构建验证。

**Tech Stack:** pnpm workspace、Oxlint 1.80、Oxfmt 0.65、oxlint-tsgolint 7.0.2001、TypeScript、React、NestJS、Husky、lint-staged、GitHub Actions、VS Code Oxc 扩展。

**Spec:** `docs/superpowers/specs/2026-08-26-oxc-toolchain-migration-design.md`

## Global Constraints

- 全仓只允许根目录一份 Oxlint 配置和一份 Oxfmt 配置。
- `correctness`、`suspicious`、`perf` 全部为 error；不启用 `pedantic`、`restriction`、`nursery`。
- `no-plusplus` 必须为 error；lint 必须零 warning、零 error。
- 必须启用 `typeAware` 和 `typeCheck`，并安装 `oxlint-tsgolint@7.0.2001`。
- 允许 `console`、显式 `any`、非空断言、必要的 TypeScript 注释和空代码块。
- 不加入 Vue SFC 规则；仓库虽有 Vue peer dependency，但没有 `.vue` 文件。
- Oxfmt 使用 120 列、2 空格、分号、双引号、无尾逗号、单参数箭头省略括号、LF。
- 不启用 import 排序、`package.json` 字段排序或 Tailwind class 排序。
- 不格式化 `dist`、`public`、`.local`、`node_modules`、`pnpm-lock.yaml`、`skills`、`coverage`、`.turbo` 和生成目录。
- 只删除 ESLint/Prettier 的直接依赖、配置和调用；允许第三方传递依赖留在 lockfile。
- 第一份实现提交包含工具链、必要 lint 修复与集成；第二份实现提交只包含 Oxfmt 机械格式变化。

---

## File Map

**Create**

- `.oxlintrc.json`：全仓 lint 分类、插件、规则、环境、overrides 与 ignore。
- `.oxfmtrc.json`：全仓格式选项和 ignore。
- `.gitattributes`：固定文本文件 LF。
- `.vscode/extensions.json`：推荐官方 `oxc.oxc-vscode`。
- `.lintstagedrc.mjs`：无 CommonJS/ESM 告警的暂存区执行链。
- `docs/oxc-migration.md`：旧 ESLint/Prettier 到 Oxc 的迁移映射和差异。

**Modify**

- `package.json`：根依赖与 `lint`、`lint:fix`、`format`、`format:check`、`check` 脚本。
- `pnpm-lock.yaml`：根工具版本和删除的 workspace 直接依赖。
- `apps/ai-chat/package.json`、`apps/ai-customer/package.json`、`apps/git-report-generator/package.json`、`apps/main-app/package.json`：删除局部 `lint` 与 `oxlint`。
- `services/llm-gateway/package.json`：删除局部 ESLint/Prettier 脚本和直接依赖。
- `.husky/pre-commit`：直接运行 `pnpm exec lint-staged`。
- `.vscode/settings.json`：Oxfmt 保存格式化与 Oxlint 保存修复。
- `.github/workflows/deploy.yml`：核心包构建后、应用构建前执行 `pnpm check`。
- `cspell.json`：删除已不存在的 ESLint/Prettier 配置路径。
- `packages/router/src/create-router.ts`、`apps/main-app/src/layout/MainLayout.tsx`、`services/llm-gateway/libs/opentelemetry/tracing.ts`、`services/llm-gateway/libs/api-gateway/restful/services/proxy.service.ts`：清理或迁移旧 ESLint disable。
- Oxlint 首次诊断点名的源文件：只做让已批准规则通过所需的最小修复。

**Delete**

- `prettier.config.js`
- `.prettierignore`
- `.lintstagedrc.js`
- `apps/ai-chat/.oxlintrc.json`
- `apps/git-report-generator/.oxlintrc.json`
- `apps/main-app/.oxlintrc.json`
- `services/llm-gateway/eslint.config.js`
- `services/llm-gateway/prettier.config.js`

## Interfaces

- Root command `pnpm lint` produces a strict, read-only whole-repo lint result.
- Root command `pnpm lint:fix` applies safe Oxlint fixes and still rejects warnings/unused disables.
- Root command `pnpm format` writes Oxfmt-supported files.
- Root command `pnpm format:check` is read-only and returns nonzero for formatting drift.
- Root command `pnpm check` runs `format:check`, `lint`, then existing root `typecheck`.
- CI consumes `pnpm check`; lint-staged consumes `oxfmt` and `oxlint` directly for passed file paths.

---

### Task 1: 建立根 Oxc 配置与统一命令

**Files:**

- Create: `.oxlintrc.json`
- Create: `.oxfmtrc.json`
- Create: `.gitattributes`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**

- Produces the five root commands documented above.
- Produces root-only config paths consumed by CLI, VS Code, lint-staged and CI.

- [ ] **Step 1: 记录迁移前的预期失败**

Run:

```bash
pnpm lint
pnpm format:check
```

Expected: both commands fail because the root scripts do not exist. Record the exit messages in the implementation notes; do not treat existing app-local `lint` scripts as satisfying this test.

- [ ] **Step 2: 在 workspace 根安装固定工具版本**

Run:

```bash
pnpm add -Dw oxlint@^1.80.0 oxfmt@^0.65.0 oxlint-tsgolint@7.0.2001
```

Expected: only root `package.json` and `pnpm-lock.yaml` gain these direct dependencies.

- [ ] **Step 3: 添加根脚本**

Set the root `scripts` entries to include exactly:

```json
{
  "lint": "oxlint -c .oxlintrc.json --disable-nested-config --deny-warnings --report-unused-disable-directives .",
  "lint:fix": "oxlint -c .oxlintrc.json --disable-nested-config --fix --deny-warnings --report-unused-disable-directives .",
  "format": "oxfmt -c .oxfmtrc.json --disable-nested-config --write .",
  "format:check": "oxfmt -c .oxfmtrc.json --disable-nested-config --check .",
  "check": "pnpm format:check && pnpm lint && pnpm typecheck"
}
```

Delete the old `lint:prettier` script. Keep `lint:spellcheck`, `prepare` and `pre-commit` unchanged in this step.

- [ ] **Step 4: 创建 `.oxfmtrc.json`**

Use this complete configuration:

```json
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "printWidth": 120,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": false,
  "quoteProps": "as-needed",
  "jsxSingleQuote": false,
  "trailingComma": "none",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "proseWrap": "preserve",
  "htmlWhitespaceSensitivity": "css",
  "endOfLine": "lf",
  "sortImports": false,
  "sortTailwindcss": false,
  "sortPackageJson": false,
  "ignorePatterns": [
    "**/dist/**",
    "dist-ghpages/**",
    "**/public/**",
    "**/.local/**",
    "**/node_modules/**",
    "pnpm-lock.yaml",
    "**/skills/**",
    "**/coverage/**",
    "**/.turbo/**",
    "**/generated/**",
    "**/.mf/**",
    "**/@mf-types/**"
  ]
}
```

- [ ] **Step 5: 创建 `.oxlintrc.json`**

Start with this complete root configuration:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "react", "oxc", "import", "node", "promise"],
  "categories": {
    "correctness": "error",
    "suspicious": "error",
    "perf": "error"
  },
  "env": {
    "builtin": true
  },
  "rules": {
    "no-plusplus": "error",
    "no-console": "off",
    "no-empty": "off",
    "no-shadow": "error",
    "typescript/ban-ts-comment": "off",
    "typescript/consistent-return": "off",
    "typescript/no-explicit-any": "off",
    "typescript/no-non-null-assertion": "off"
  },
  "overrides": [
    {
      "files": ["apps/**/*.{js,jsx,ts,tsx}"],
      "env": { "browser": true }
    },
    {
      "files": ["apps/**/*.tsx", "packages/tabs/src/**/*.tsx"],
      "rules": {
        "react/rules-of-hooks": "error",
        "react/only-export-components": ["error", { "allowConstantExport": true }]
      }
    },
    {
      "files": ["**/*.{ts,tsx,mts,cts}"],
      "rules": {
        "no-undef": "off",
        "no-unused-vars": ["error", { "args": "none" }]
      }
    },
    {
      "files": [
        "services/**/*.{js,ts,mjs,cjs}",
        "packages/desktop/**/*.{js,ts,mjs,cjs}",
        "**/*.config.{js,ts,mjs,cjs}",
        "**/vite.config.ts"
      ],
      "env": { "node": true }
    },
    {
      "files": ["services/**/*.spec.ts", "services/**/test/**/*.ts"],
      "env": { "jest": true, "node": true }
    },
    {
      "files": ["**/*.d.ts", "**/*.d.mts", "**/*.d.cts"],
      "rules": {
        "no-unused-vars": "off"
      }
    }
  ],
  "ignorePatterns": [
    "**/dist/**",
    "dist-ghpages/**",
    "**/public/**",
    "**/node_modules/**",
    "**/coverage/**",
    "**/.turbo/**",
    "**/generated/**",
    "**/.mf/**",
    "**/@mf-types/**"
  ],
  "options": {
    "typeAware": true,
    "typeCheck": true
  }
}
```

Run `pnpm exec oxlint -c .oxlintrc.json --print-config` immediately. If Oxlint 1.80 rejects a rule name, verify the name with `pnpm exec oxlint --rules`; remove only rules whose intended behavior is already covered by the enabled categories, and record the exact difference in `docs/oxc-migration.md` in Task 3. Do not replace an unsupported rule with a broad category disable.

- [ ] **Step 6: 固定 LF**

Create `.gitattributes`:

```gitattributes
* text=auto eol=lf
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.woff binary
*.woff2 binary
```

- [ ] **Step 7: 验证配置可加载**

Run:

```bash
pnpm exec oxlint -c .oxlintrc.json --print-config
pnpm exec oxfmt -c .oxfmtrc.json --disable-nested-config --list-different .
git diff --check
```

Expected: both config files load without schema/unknown-option errors; Oxfmt may list existing files that will be handled in Task 5; `git diff --check` passes.

---

### Task 2: 删除局部工具链并迁移 disable 注释

**Files:**

- Modify: four `apps/*/package.json` files listed in File Map
- Modify: `services/llm-gateway/package.json`
- Modify: `cspell.json`
- Modify: four source files with old ESLint comments listed in File Map
- Delete: all legacy config files listed in File Map
- Modify: `pnpm-lock.yaml`

**Interfaces:**

- Consumes root `oxlint`, `oxfmt`, and `oxlint-tsgolint` dependencies from Task 1.
- Produces one root-only dependency/config topology.

- [ ] **Step 1: 证明旧工具仍存在**

Run:

```bash
rg -n 'eslint|prettier|"oxlint"|"lint": "oxlint"' \
  package.json apps packages services .lintstagedrc.js cspell.json \
  --glob 'package.json' --glob '*.js' --glob '*.json' --glob '*.ts' --glob '*.tsx'
```

Expected: matches include four app-local Oxlint entries, root/LLM Gateway Prettier, LLM Gateway ESLint, legacy config files and old disable comments.

- [ ] **Step 2: 删除 workspace 重复脚本与依赖**

In each of the four React app package files, delete:

```json
"lint": "oxlint"
```

and delete the app-local dev dependency:

```json
"oxlint": "^1.75.0"
```

In `services/llm-gateway/package.json`, delete `scripts.format`, `scripts.lint` and these direct dev dependencies:

```text
@hodfords/nestjs-eslint-config
@hodfords/nestjs-prettier-config
eslint
prettier
```

- [ ] **Step 3: 删除旧配置**

Delete exactly the legacy config files listed under **Delete** in the File Map, except `.lintstagedrc.js`, which is replaced in Task 3.

- [ ] **Step 4: 迁移旧 disable 注释**

Apply this policy to the five current comments:

- In `packages/router/src/create-router.ts`, rename the directive to `// oxlint-disable-next-line no-constant-condition -- router loop intentionally waits until a match is found`.
- In `apps/main-app/src/layout/MainLayout.tsx`, rename each rule from `react-hooks/exhaustive-deps` to `react/exhaustive-deps`; after running strict lint, delete any directive reported as unused.
- In `services/llm-gateway/libs/opentelemetry/tracing.ts` and `services/llm-gateway/libs/api-gateway/restful/services/proxy.service.ts`, delete the `@typescript-eslint/naming-convention` directives because the replacement config does not enable a naming-convention rule.

- [ ] **Step 5: 清理 cspell 的旧配置路径**

Delete `eslint.config.mjs` and `.prettierignore` from `cspell.json` `ignorePaths`. Keep all unrelated spelling configuration unchanged.

- [ ] **Step 6: 更新 lockfile 并检查直接依赖拓扑**

Run:

```bash
pnpm install --lockfile-only
pnpm why oxlint --depth 0
pnpm why oxfmt --depth 0
pnpm why oxlint-tsgolint --depth 0
```

Expected: each Oxc tool is a root direct dependency; the four apps no longer own Oxlint; LLM Gateway no longer owns ESLint or Prettier directly. Transitive ESLint/Prettier output from Nest tooling is allowed.

---

### Task 3: 接入暂存区、编辑器、CI 与迁移文档

**Files:**

- Create: `.lintstagedrc.mjs`
- Create: `.vscode/extensions.json`
- Create: `docs/oxc-migration.md`
- Modify: `.husky/pre-commit`
- Modify: `.vscode/settings.json`
- Modify: `.github/workflows/deploy.yml`
- Delete: `.lintstagedrc.js`

**Interfaces:**

- Consumes root Oxc binaries and config discovery.
- Produces a consistent staged-file, editor and CI workflow.

- [ ] **Step 1: 替换 lint-staged 配置**

Delete `.lintstagedrc.js` and create `.lintstagedrc.mjs`:

```javascript
export default {
  "*.{js,jsx,ts,tsx,mjs,cjs}": [
    "oxfmt --no-error-on-unmatched-pattern --write",
    "oxlint --no-error-on-unmatched-pattern --fix --deny-warnings --report-unused-disable-directives",
    "cspell lint --no-must-find-files"
  ],
  "*.{json,jsonc,css,less,scss,html}": [
    "oxfmt --no-error-on-unmatched-pattern --write",
    "cspell lint --no-must-find-files"
  ],
  "*.{md,mdx,yaml,yml}": ["oxfmt --no-error-on-unmatched-pattern --write"]
};
```

This removes the current `MODULE_TYPELESS_PACKAGE_JSON` warning without changing the root package module type.

- [ ] **Step 2: 更新 Husky**

Replace `.husky/pre-commit` with:

```sh
# 只检查暂存区的文件
pnpm exec lint-staged
```

- [ ] **Step 3: 添加官方 VS Code 集成**

Create `.vscode/extensions.json`:

```json
{
  "recommendations": ["oxc.oxc-vscode"]
}
```

Replace `.vscode/settings.json` with:

```json
{
  "editor.defaultFormatter": "oxc.oxc-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.oxc": "always"
  }
}
```

Do not duplicate `oxc.typeAware`; the extension reads `options.typeAware` from the root config.

- [ ] **Step 4: 在 CI 中添加质量门禁**

In `.github/workflows/deploy.yml`, insert after `Build core packages` and before `Build sub-apps`:

```yaml
- name: Quality check
  run: pnpm check
```

Keep the core build first because Oxlint type-aware monorepo analysis needs dependent `.d.ts` outputs on a clean runner.

- [ ] **Step 5: 编写迁移映射文档**

Create `docs/oxc-migration.md` with these concrete sections:

```markdown
# Oxc 工具链迁移说明

## 唯一入口

| 命令                | 用途                                           |
| ------------------- | ---------------------------------------------- |
| `pnpm lint`         | 严格检查全仓，拒绝 warning，并报告无效 disable |
| `pnpm lint:fix`     | 应用安全自动修复后继续执行严格检查             |
| `pnpm format`       | 使用根 Oxfmt 配置写入受支持文件                |
| `pnpm format:check` | 只检查格式漂移，不写文件                       |
| `pnpm check`        | 依次执行格式检查、lint 和 workspace typecheck  |

## 规则映射

| 旧规则/配置                                             | Oxc 处理                                                                |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| `@typescript-eslint/no-shadow`                          | Oxlint 原生 `no-shadow: error` 直接分析 TypeScript AST                  |
| `@typescript-eslint/no-unused-vars`                     | TS/TSX override 中使用原生 `no-unused-vars`，参数不检查                 |
| `no-plusplus`                                           | 明确设为 error                                                          |
| `no-console`、`no-empty`、显式 `any`、非空断言、TS 注释 | 按批准设计关闭                                                          |
| `consistent-return`                                     | 显式关闭 `typescript/consistent-return`，避免 suspicious 分类改变旧语义 |
| Airbnb/import 基础规则                                  | 由 correctness/suspicious/perf 和 import 插件覆盖可用部分               |
| Vue 规则                                                | 仓库无 `.vue` 文件，不迁移                                              |
| NestJS naming/max-lines 例外                            | 对应规则未启用，因此删除无效 disable；不保留空 override                 |

## 与 ESLint/Prettier 的差异

仓库不再直接依赖或调用 ESLint、Prettier，但 Nest CLI 等第三方工具仍可能在 lockfile 中带入传递依赖。Oxfmt 把换行固定为 LF，并保持迁移前的 120 列、2 空格、分号、双引号、无尾逗号和单参数箭头省略括号。import 排序、`package.json` 字段排序和 Tailwind class 排序均未启用。

## Overrides

React TSX 文件启用 Hooks 和组件导出检查；`apps` 源码使用 browser 环境；服务、桌面脚本和构建配置使用 Node 环境；服务测试使用 Jest 环境；TypeScript 文件关闭基础 `no-undef`，并让原生 `no-unused-vars` 忽略参数；声明文件关闭不适用的 unused-vars 检查。所有例外都限定到对应文件范围。
```

- [ ] **Step 6: 验证 lint-staged 配置加载**

Run:

```bash
pnpm exec lint-staged --config .lintstagedrc.mjs --diff=HEAD --debug
```

Expected: config loads as ESM without `MODULE_TYPELESS_PACKAGE_JSON`; only files changed from HEAD are selected. Restore any formatting changes produced by this diagnostic only if they are outside the intended Task 5 formatting commit; never discard unrelated user changes.

---

### Task 4: 收敛严格 lint 与类型检查并提交工具链迁移

**Files:**

- Modify: only source files named by Oxlint diagnostics, plus Task 1–3 files.
- Test: root Oxc commands and root TypeScript command.

**Interfaces:**

- Produces a strict lint/typecheck baseline with zero warnings and zero errors.
- Produces the first implementation commit.

- [ ] **Step 1: 构建类型感知分析需要的核心包**

Run in dependency order:

```bash
pnpm --filter @pavilion-mfe/sandbox build
pnpm --filter @pavilion-mfe/bridge build
pnpm --filter @pavilion-mfe/tabs build
pnpm --filter @pavilion-mfe/vite build
pnpm --filter @pavilion-mfe/router build
pnpm --filter @pavilion-mfe/runtime build
```

Expected: all commands exit 0 and dependent declaration outputs exist in ignored `dist` directories.

- [ ] **Step 2: 运行安全自动修复**

Run:

```bash
pnpm lint:fix
```

Expected: Oxlint applies only safe fixes. Do not use `--fix-suggestions` or `--fix-dangerously`.

- [ ] **Step 3: 按规则逐项修复剩余诊断**

Run:

```bash
pnpm lint
```

For every remaining diagnostic, apply this exact decision order:

1. Fix real defects or unused code in the named source file.
2. For `no-plusplus`, rewrite `i++`/`i--` as `i += 1`/`i -= 1`; do not disable the rule.
3. For unused disable reports, remove the directive.
4. For React dependency reports, stabilize the dependency or include it; retain a file-local directive only when changing dependencies would alter intentional lifecycle behavior, and include an inline reason.
5. For fixture/generated/vendor content, add the narrow directory to `ignorePatterns` only when ownership is demonstrably external.
6. For a confirmed false positive, add the narrowest file-specific override and document it in `docs/oxc-migration.md`.

Repeat `pnpm lint` until output contains no warnings, errors or unused disables.

- [ ] **Step 4: 验证 TypeScript**

Run:

```bash
pnpm typecheck
```

Expected: exit 0. If Oxlint `typeCheck` and `pnpm typecheck` disagree, treat `pnpm typecheck` as the workspace contract and fix tsconfig/source issues rather than turning off `typeCheck`.

- [ ] **Step 5: 验证旧直接工具链已清除**

Run:

```bash
rg -n 'eslint|prettier' \
  package.json apps packages services .github .husky .vscode cspell.json \
  --glob 'package.json' --glob '*.js' --glob '*.mjs' --glob '*.json' --glob '*.ts' --glob '*.tsx' --glob '*.yml'
rg --files -g '.oxlintrc.json' -g '.oxlintrc.jsonc' -g 'oxlint.config.*' -g '.oxfmtrc.json' -g '.oxfmtrc.jsonc' -g 'oxfmt.config.*'
```

Expected: the first command has no direct config/script/dependency or legacy source-comment matches; documentation and `pnpm-lock.yaml` are intentionally outside this search. The second command lists exactly root `.oxlintrc.json` and root `.oxfmtrc.json`.

- [ ] **Step 6: 检查第一提交边界**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: changes are toolchain/config/integration/docs plus minimal lint fixes. Oxfmt whole-repo mechanical changes are not yet present. `pnpm format:check` is expected to report drift until Task 5.

- [ ] **Step 7: 提交工具链迁移**

```bash
git add .
git commit -m "chore: 统一 Oxc 代码质量工具链"
```

If the new pre-commit hook formats staged migration files, inspect and restage those changes, rerun `pnpm lint` and `pnpm typecheck`, then commit. Do not bypass the hook unless it fails due to a verified hook infrastructure defect unrelated to diagnostics.

---

### Task 5: 执行并隔离全仓 Oxfmt 机械迁移

**Files:**

- Modify: every non-ignored Oxfmt-supported file selected by root config.

**Interfaces:**

- Consumes `.oxfmtrc.json` from Task 1.
- Produces the second implementation commit containing only mechanical formatting.

- [ ] **Step 1: 记录格式化前检查结果**

Run:

```bash
pnpm format:check
```

Expected: nonzero with a concrete list of files requiring formatting. Save the list for comparison.

- [ ] **Step 2: 格式化全仓**

Run:

```bash
pnpm format
```

Expected: only supported, non-ignored text files change; `pnpm-lock.yaml`, `skills`, generated files and build outputs remain untouched.

- [ ] **Step 3: 审查机械 diff**

Run:

```bash
git diff --check
git diff --stat
git diff --word-diff=porcelain | sed -n '1,240p'
```

Inspect every changed file category. If a behavior change appears, revert only that hunk with a targeted patch, fix the formatter configuration/ignore rule, rerun `pnpm format`, and repeat the review. Do not use broad checkout/reset commands.

- [ ] **Step 4: 验证格式与质量门禁**

Run:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm check
```

Expected: all commands exit 0; lint output has zero warnings/errors/unused disables.

- [ ] **Step 5: 提交纯格式化变更**

```bash
git add .
git commit -m "style: 使用 Oxfmt 格式化全仓"
```

Expected: this commit contains no dependency, configuration, workflow or behavior changes.

---

### Task 6: 干净状态与关键构建验收

**Files:**

- No planned source modifications.
- Test: clean install, quality gate, selected builds, repository searches.

**Interfaces:**

- Validates both implementation commits as a complete deliverable.

- [ ] **Step 1: 从 lockfile 验证安装可复现**

Run:

```bash
pnpm install --frozen-lockfile
```

Expected: exit 0 with no lockfile mutation.

- [ ] **Step 2: 重新构建核心包并运行统一门禁**

Run:

```bash
pnpm --filter @pavilion-mfe/sandbox build
pnpm --filter @pavilion-mfe/bridge build
pnpm --filter @pavilion-mfe/tabs build
pnpm --filter @pavilion-mfe/vite build
pnpm --filter @pavilion-mfe/router build
pnpm --filter @pavilion-mfe/runtime build
pnpm check
```

Expected: all commands exit 0.

- [ ] **Step 3: 验证代表性应用与服务构建**

Run:

```bash
pnpm --filter main-app build:dev
pnpm --filter git-report-generator build:dev
pnpm --filter @pavilion-mfe/llm-gateway build
pnpm --filter @pavilion-mfe/customer-service build
```

Expected: all commands exit 0. These cover React/MF applications and both NestJS services.

- [ ] **Step 4: 最终仓库审计**

Run:

```bash
git status --short
git diff --check HEAD~2..HEAD
git log -3 --oneline
rg -n 'eslint|prettier' package.json apps packages services .github .husky .vscode cspell.json \
  --glob 'package.json' --glob '*.js' --glob '*.mjs' --glob '*.json' --glob '*.ts' --glob '*.tsx' --glob '*.yml'
```

Expected: working tree clean; diff check passes; the two implementation commits are adjacent after the earlier design/plan documentation history; the search has no prohibited direct dependency/config/script/comment matches. Any ESLint/Prettier strings in `pnpm-lock.yaml` are transitive and allowed.

- [ ] **Step 5: 记录最终证据**

In the handoff response, report exact command outcomes for `pnpm check`, the four representative builds, the two commit hashes, and any intentionally retained narrow override/ignore. Do not claim completion from earlier partial checks.
