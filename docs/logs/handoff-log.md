# 交接日志

> 文件用途：给下一个 AI 或开发者快速接手当前项目。  
> 使用方式：阶段性更新「当前状态 / 关键路径 / 下一步 / 风险」。  
> 历史长篇记录如需可查 `docs/logs/archive/development-log-through-2026-04-12.md`（开发日志归档）。

---

## 当前状态（v0.7.0）

- **版本**：`package.json` → **0.7.0**；Git 发布请打 tag **`v0.7.0`**（与 npm 一致）。
- **产品定位**：测评 + 销售 CRM（解读台、客户、日历、知识库、主管视图），非单一测评工具。
- **本轮核心行为**：
  - **家长类型长文案**：仅来自测评解读库中标题含「父母养育的9种类型解读」或「家长9型解析」的 Excel/入库文本；按 **表头列 = 当前养育类型** 取整列，按行输出 `【维度标题】` + 正文，**禁止**把 9 列混成一段。
  - **通话模式（顶栏琥珀色区）**：**不依赖**豆包生成的主摘要句；用 **孩子六维最低分维度名** + **当前类型** + 同矩阵中 **「隐性风险」「关键提醒」行**（仅该类型列）+ 倦怠二选一兜底 + 可选核心难题；展示为 2～3 句，关键词 **加粗**（`CallModeBriefText`）。
- **技术栈要点**：Next.js 16 App Router、Prisma、NextAuth、豆包（部分 AI 流程）、知识库向量检索、`xlsx` 解析 Excel。

---

## 关键路径（必读代码）

| 领域 | 入口 |
|------|------|
| 设计基线 | `docs/design/system-design.md`（§25 Excel、§26 家长类型解读） |
| 矩阵列/行抽取 | `src/features/knowledge/parent-type-matrix.ts` |
| 家长类型文案 lookup | `src/features/knowledge/interpretation-lookup.ts` |
| 通话模式简报 | `src/features/crm/call-mode-brief.ts`、`lookupCallModeMatrixSnippets` |
| 客户解读台页 | `src/app/dashboard/customers/[customerId]/page.tsx` |
| 豆包工作台 JSON | `src/features/crm/ai.ts`（通话区块主文案已弱化，其它仍可能用） |
| 开发日志（新） | `docs/logs/development-log.md` |
| 开发日志（v0.6 及以前全文） | `docs/logs/archive/development-log-through-2026-04-12.md` |

---

## 环境变量（常见）

- `DATABASE_URL`、`AUTH_SECRET`、`AUTH_URL`（局域网调试需与浏览器访问一致）
- 豆包：`ARK_BASE_URL`、`ARK_API_KEY`、`ARK_MODEL`、`ARK_TIMEOUT_MS`（见 `.env.example`）

---

## 下一步建议

1. 生产环境：**勿**将本机 `storage/` 目录提交仓库；部署时配置文件上传存储与备份。
2. 验收：用真实 9 型 Excel 核对「隐性风险 / 关键提醒」行标题是否与 `parent-type-matrix.ts` 匹配函数一致。
3. 可选：E2E 覆盖登录、客户工作台、知识库上传；embedding 从 `local-hash-v1` 升级正式 API。

---

## 已知风险

- 测评题库结构化、动态评分规则仍在持续演进。
- 矩阵表头命名若与系统 9 型不一致，需扩展列名等价或映射表。
- 豆包超时或失败时，部分 AI 功能会走 fallback，需关注首屏耗时。
