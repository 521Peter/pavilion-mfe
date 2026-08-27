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
| `react-in-jsx-scope`                                    | React 应用统一使用自动 JSX runtime，不要求每个 TSX 文件导入 `React`     |
| `no-await-in-loop`                                      | 全局 error；仅对 14 个确认依赖顺序、背压或状态推进的精确文件关闭        |
| `no-unsafe-type-assertion`                              | 全局 error；修复可验证边界后，只对精确测试桩与框架/序列化边界关闭       |
| Airbnb/import 基础规则                                  | 由 correctness/suspicious/perf 和 import 插件覆盖可用部分               |
| Vue 规则                                                | 仓库无 `.vue` 文件，不迁移                                              |
| NestJS naming/max-lines 例外                            | 对应规则未启用，因此删除无效 disable；不保留空 override                 |

## 与 ESLint/Prettier 的差异

仓库不再直接依赖或调用 ESLint、Prettier，但 Nest CLI 等第三方工具仍可能在 lockfile 中带入传递依赖。Oxfmt 把换行固定为 LF，并保持迁移前的 120 列、2 空格、分号、双引号、无尾逗号和单参数箭头省略括号。import 排序、`package.json` 字段排序和 Tailwind class 排序均未启用。

## Overrides

React TSX 文件启用 Hooks 和组件导出检查，并关闭仅适用于经典 JSX runtime 的 `react-in-jsx-scope`；`apps` 源码使用 browser 环境；服务、桌面脚本和构建配置使用 Node 环境；服务测试使用 Jest 环境；TypeScript 文件关闭基础 `no-undef`，并让原生 `no-unused-vars` 忽略参数；声明文件关闭不适用的 unused-vars 检查。`no-underscore-dangle` 只放行 Pavilion 全局标识、Node `__dirname`、Prisma `_max` 与沙箱快照字段；`import/no-unassigned-import` 只放行样式、元数据/环境初始化和两个明确的注册入口。NestJS 装饰器类与静态工厂类通过规则选项保留，唯一以空类作为 metadata token 的测试文件使用精确文件 override。MF 生命周期入口、主路由、线程适配器和 Tabs Provider 必须混合导出框架契约与组件，因此仅这 5 个文件关闭 `react/only-export-components`。路由状态与远端数据加载必须在 effect 中同步的 5 个页面文件仅关闭 `react/set-state-in-effect`，避免为满足编译器规则改变加载与导航时序。

`no-await-in-loop` 保持全局 error。精确文件 override 只覆盖三类必须串行的现有流程：流式 reader/WS 消息的背压读取；路由卸载、技能同步、推理 tool-call 和限流计数的有序状态推进；桌面构建/报告与限流测试中依赖前一步结果的命令或断言。将这些循环改为 `Promise.all` 会改变生命周期、调用顺序、限流窗口或输出顺序，因此不做并发化；清单逐文件列在根配置中，未来文件不会自动获豁免。

`typescript/no-unsafe-type-assertion` 同样保持全局 error。迁移先把 Headers 合并改为标准 `Headers` API，把 JWT payload、登录响应和流事件改为 `unknown` 加运行时结构检查，并移除 DOM、选择键和 MCP tool 响应的无必要窄化。复审后进一步删除全部 37 个运行时整文件 override，并逐条处理其 78 条诊断：代理 header 会跳过 `undefined` 并序列化数字；异常响应、审计/认证 header、密文 JSON、GitHub/API 环境输入与 Redis 返回值均做运行时窄化；Prisma JSON 统一递归拒绝非 JSON 值；动态请求字段改为交叉类型或反射 API。确实无法由本仓库类型表达的 MF/Vite、LangGraph/OpenTelemetry、Nest Swagger/JWT、沙箱原生重载和泛型 Storage/API 桥接，仅保留 11 个文件中的 19 条带具体理由的单行 directive。14 个测试文件的部分 Nest/Express/Socket/模型 mock 仍使用逐文件 override；不使用运行时文件或目录 override，新文件默认接受该规则检查。

三大严格分类、`no-plusplus`、`no-await-in-loop`、`typescript/no-unsafe-type-assertion`、`typeAware` 与 `typeCheck` 均保持全局启用。
