# PavilionMfe 全仓 Oxc 工具链迁移设计

## 背景

PavilionMfe 当前的代码质量工具链处于分裂状态：部分 React 应用各自使用 Oxlint，`services/llm-gateway` 单独使用 ESLint 10 与 Prettier，根目录仍使用 Prettier，其他 workspace 没有统一 lint 入口。提交钩子、CI 和编辑器配置也没有共享同一套质量标准。

本次迁移以 Oxc 为唯一代码检查与格式化工具链：使用 Oxlint 取代 ESLint，使用 Oxfmt 取代 Prettier，并将配置、依赖和执行入口统一到 monorepo 根目录。

## 目标

- 全仓只维护一份 Oxlint 配置和一份 Oxfmt 配置。
- 删除 ESLint、Prettier 及各 workspace 重复的 Oxlint 直接依赖、配置和命令入口。
- 在 React、TypeScript、Node/NestJS 和声明文件之间提供清晰的规则边界。
- 启用 Oxlint 类型感知检查，并保证 lint 零 warning、零 error。
- 保持现有 Prettier 的主要格式风格，并统一使用 LF 换行。
- 让本地脚本、暂存区检查、VS Code 和 GitHub Actions 使用同一套质量入口。
- 将工具链配置迁移和全仓机械格式化拆成两个独立提交。

## 非目标

- 不启用当前仓库未使用的 Vue SFC lint 规则。
- 不在本次迁移中启用 import 排序、`package.json` 字段排序或 Tailwind class 排序。
- 不启用 Oxlint 的 `pedantic`、`restriction` 或 `nursery` 分类。
- 不要求 lockfile 中完全消失 ESLint 或 Prettier 的传递依赖；只清除本仓库的直接依赖和调用。
- 不借格式化迁移进行无关重构。

## 调研结论

Oxc 官方 monorepo 在根目录集中维护 `oxlintrc.json` 和 `oxfmtrc.jsonc`，使用 overrides 描述局部差异，并以 `--deny-warnings --report-unused-disable-directives` 作为严格 lint 入口。Vite monorepo 也已把 Oxfmt 作为根格式化器，并在 lint-staged 中按暂存文件运行格式化。Oxfmt 当前覆盖本仓库实际使用的 JavaScript、TypeScript、JSON、CSS、HTML、Markdown 和 YAML 等格式。

因此本仓库采用根目录单一配置，而不是继续保留 workspace 局部配置或引入额外共享配置包。

## 配置架构

### Oxlint

根目录维护唯一 Oxlint 配置，所有 workspace 从仓库根目录执行检查。

基础规则启用以下分类并统一为 error：

- `correctness`
- `suspicious`
- `perf`

启用与仓库技术栈匹配的插件：

- `typescript`
- `react`
- `oxc`
- `import`
- `node`
- `promise`

同时开启 `typeAware` 与 `typeCheck`，并安装 `oxlint-tsgolint`。全局明确启用 `no-plusplus: error` 和 `no-shadow: error`。Oxlint 直接使用原生 `no-shadow`、`no-unused-vars` 分析 TypeScript AST，不配置不存在的 `typescript/no-shadow` 或 `typescript/no-unused-vars` 别名。

参考旧 ESLint 配置的意图，允许以下用法：

- `console`
- 显式 `any`
- 非空断言
- 必要的 TypeScript 注释
- 空代码块
- 原配置允许的复杂遍历语法

通过 overrides 区分以下场景：

- React 应用和 React 相关包：启用 Hooks 与组件导出检查。
- 浏览器应用：提供 browser globals。
- Node/NestJS 服务、构建脚本和配置文件：提供 Node globals。
- `.d.ts`：关闭不适用于声明文件的检查。
- 测试文件：只对测试结构确实需要的规则做最小放宽。
- 现有 NestJS 特殊文件：仅在实际诊断证明必要时迁移原有局部例外。

不得使用仓库级大范围关闭来掩盖迁移问题。新增 override 或 disable 必须限定到最小文件范围，并在代码或迁移说明中给出原因。现有 `eslint-disable` 注释若能被 Oxlint 识别则保留；无效注释必须删除或改为对应的 Oxlint 规则名。

### Oxfmt

Oxfmt 保持现有 Prettier 的主要风格：

- `printWidth: 120`
- `tabWidth: 2`
- 使用空格缩进
- 保留分号
- JavaScript、TypeScript 和 JSX 使用双引号
- 不添加尾逗号
- 单参数箭头函数省略括号
- 对象括号内保留空格
- 多行 JSX 的结束尖括号单独换行
- Markdown 保持原有段落换行意图

换行符从 Prettier 的 `auto` 改为固定 LF，并通过 `.gitattributes` 固化跨平台行为。

格式化覆盖：

- JavaScript、TypeScript、JSX、TSX
- JSON、JSONC
- CSS、HTML
- Markdown
- YAML

忽略现有及常见生成内容：

- `dist`
- `public`
- `.local`
- `node_modules`
- `pnpm-lock.yaml`
- `skills`
- `coverage`
- `.turbo`

本次不启用 Oxfmt 的 import 排序、`package.json` 字段排序或 Tailwind class 排序，避免产生超出格式迁移范围的语义性重排。

## 命令与执行链路

根 `package.json` 提供统一命令：

- `lint`：运行全仓 Oxlint，拒绝 warning，并报告无效 disable。
- `lint:fix`：执行安全自动修复后再次满足严格检查。
- `format`：使用 Oxfmt 写入受支持文件。
- `format:check`：只检查格式，不写文件。
- `check`：依次执行 `format:check`、`lint` 和 `typecheck`。

现有 `lint:spellcheck` 保留，因为拼写检查不属于 ESLint/Prettier 替代范围。

各 workspace 删除重复的 Oxlint、ESLint 和 Prettier 直接依赖。局部 `lint` 与 `format` 脚本删除，避免产生多个事实来源。

## 提交钩子、编辑器与 CI

### lint-staged 与 Husky

lint-staged 对暂存文件按以下顺序处理：

1. Oxfmt 格式化全部受支持类型。
2. Oxlint 对 JavaScript、TypeScript、JSX 和 TSX 执行修复与严格检查。
3. 保留现有 cspell 检查。

Husky 直接调用 `pnpm exec lint-staged`，不再通过 `npm run` 间接执行。

### VS Code

仓库提交 Oxc 推荐扩展与 workspace 设置：

- Oxfmt 作为受支持文件的默认格式化器。
- 保存时执行格式化。
- 保存时应用 Oxlint 可用修复。
- 不再推荐或调用 ESLint、Prettier 扩展。

### GitHub Actions

部署工作流先构建类型感知检查所依赖的核心包声明产物，再在应用构建与部署前运行根 `check` 命令。格式不一致、lint warning/error 或类型检查失败都会阻止部署。

## 迁移顺序

### 第一阶段：工具链配置迁移

1. 添加根 Oxlint、Oxfmt、`.gitattributes`、VS Code 配置和迁移映射说明。
2. 更新根脚本、lint-staged、Husky 和 GitHub Actions。
3. 删除应用局部 Oxlint 配置与重复依赖。
4. 删除 `services/llm-gateway` 的 ESLint/Prettier 配置、直接依赖和局部命令。
5. 更新 lockfile。
6. 运行 Oxfmt 检查、严格 Oxlint 和 TypeScript 检查。
7. 修复真实问题；仅为确认的误报或合理例外添加最小 override/disable。

该阶段形成独立提交，内容包括配置、依赖、脚本以及 lint 为通过检查所必需的代码修复。

### 第二阶段：全仓格式化

1. 对全仓执行一次 Oxfmt 写入。
2. 确认 diff 仅包含机械格式变化，不混入行为修改。
3. 重新运行完整 `check` 和必要构建。
4. 运行 `git diff --check`，检查空白和换行问题。

该阶段形成单独的纯格式化提交，便于审查、回滚和 `git blame`。

## 错误处理与例外原则

- Oxfmt 对单个文件产生不可接受结果时，先确认是否为已知兼容问题；必要时只忽略该文件并记录原因，不恢复全局 Prettier。
- Oxlint 规则与旧 ESLint 规则无法等价映射时，以缺陷发现价值和仓库实际代码为准，并在迁移说明中记录差异。
- 类型感知检查若暴露 tsconfig 边界问题，应修复 workspace 配置或精确指定检查范围，不全局关闭类型检查。
- 第三方生成文件、fixture 或 vendored 内容只通过 ignore 排除，不直接重写。

## 验证与验收标准

迁移完成必须满足：

- 干净安装后根 `format:check` 通过。
- 根 `lint` 零 warning、零 error，并且不存在无效 disable。
- 根 `typecheck` 通过。
- 根 `check` 可作为本地和 CI 的唯一质量入口。
- 必要的 workspace 构建通过。
- lint-staged 能正确处理混合类型暂存文件。
- VS Code 配置不再调用 ESLint 或 Prettier。
- GitHub Actions 在构建前执行严格质量检查。
- 仓库中不存在 ESLint、Prettier 的直接依赖、配置文件或命令调用。
- workspace 中不存在重复 Oxlint 直接依赖或局部配置。
- lockfile 中允许保留第三方工具带来的 ESLint/Prettier 传递依赖。
- 工具链配置迁移与全仓格式化分别形成独立提交。

## 迁移说明交付物

实施阶段新增一份简洁的规则迁移说明，至少覆盖：

- 旧规则到 Oxlint 规则的直接映射。
- 被 Oxc categories 覆盖的规则。
- 因仓库不存在 Vue SFC 而未迁移的 Vue 规则。
- Oxlint 不支持或语义不完全一致的规则。
- 新增的严格要求，例如 `no-plusplus`。
- 针对 React、Node/NestJS、测试和声明文件的 overrides 原因。
