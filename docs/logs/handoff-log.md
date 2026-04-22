# 交接日志

> 文件用途：给下一个 AI 或开发者快速接手当前项目。  
> 使用方式：阶段性更新「当前状态 / 关键路径 / 下一步 / 风险」。  
> 历史长篇记录如需可查 `docs/logs/archive/development-log-through-2026-04-12.md`（开发日志归档）。

---

## 当前状态（v1.0.0 + 管理员与组织）

- **版本**：`package.json` → **1.0.0**；Git 发布 tag：**`v1.0.0`**（与 package 一致）。
- **产品定位**：测评 + 销售 CRM（解读台、客户、日历、知识库、**主管视图 + 管理员组织总览**），非单一测评工具。
- **知识库 RAG 向量**：**火山方舟豆包 Embedding**；向量存 PostgreSQL `KnowledgeChunk.embeddingJson`。须 `ARK_EMBEDDING_MODEL`；多模态 Vision 须 `ARK_EMBEDDING_USE_MULTIMODAL=1`。未配置时降级 `local-hash-v1`。全量重算：`npm run db:reembed-knowledge`。设计见 **`docs/design/system-design.md` §28**。
- **通话录音（v0.8 延续）**：解读台宽屏录音条 → 豆包语音转写 / 方舟纪要 → `/dashboard/call-recordings`；详见 §11.5、§27。
- **v1.0 账号与安全**
  - **新建用户默认密码**（销售 / 主管）：环境变量 **`DEFAULT_NEW_USER_PASSWORD`**（至少 8 位，勿写入 Git）；代码见 **`getDefaultNewUserPassword()`**；`User.defaultPassword`。
  - **角色**：**`ADMIN`**（唯一管理员账号约定为 **`admin`**）仅建主管、看全组织；**`MANAGER`** 建销售；主管 **`adminId`** 指向管理员。
  - **首次登录强制改密**：`session.user.mustChangePassword`；未改密不能进 `/dashboard`；改密后自动进工作台（见 `change-password-form.tsx`）。
  - 主管在 **团队总览 → 新增销售**、管理员在 **组织总览 → 新增主管** 处有**醒目提示**默认密码与安全告知。
  - **云端补管理员（无 seed 演示数据时）**：迁移应用后运行 **`npm run provision-admin-sql`** 生成 SQL（读 `.env` 中 `DEFAULT_NEW_USER_PASSWORD`），再 `psql` 执行生成结果；勿将含真实哈希的 SQL 提交到 Git。
  - **本地若 `admin` 登录 `CredentialsSignin`**：确认 `.env` 已配置 **`DEFAULT_NEW_USER_PASSWORD`**；库结构含 `ADMIN`/`adminId` 后 **`npm run db:seed`** 或执行生成的 SQL；登录用户名在服务端已 **统一小写**。
- **v1.0 快捷入口（工作台）**：桌面为「打开测评 + 复制链接」；**手机**仅显示只读链接框（长按复制）。链接根地址由 **`getPublicSiteUrl()`**（请求头）拼接，部署公网后随访问域名变化；可选 **`NEXT_PUBLIC_SITE_URL`** 兜底。
- **v0.7 仍有效**：家长类型长文案来自 9 型矩阵列；通话模式简报来自矩阵行 + 最弱维等。

---

## 关键路径（必读代码）

| 领域 | 入口 |
|------|------|
| 设计基线 | `docs/design/system-design.md`（§11.5、§27、§28；**账号条款见路线图「账号管理补充」**） |
| 初始密码（环境变量） | `.env` → `DEFAULT_NEW_USER_PASSWORD`；读取 `src/config/default-credentials.ts` → `getDefaultNewUserPassword()` |
| 会话与首次改密 | `src/auth.ts`（JWT 内同步 `defaultPassword`）、`src/app/dashboard/layout.tsx` |
| 改密表单与自动跳转 | `src/components/forms/change-password-form.tsx` |
| 创建销售 / 主管 | `src/server/actions/users.ts` → `createSalesUser` / `createManagerUser`；UI `src/app/dashboard/manager/page.tsx`（管理员与主管视图分支） |
| 云端 provision admin | `npm run provision-admin-sql` → `scripts/generate-provision-admin-sql.ts`（须已应用含 `ADMIN`/`adminId` 的迁移）；说明见 `docs/sql/provision-admin.sql` |
| 公网站点根 URL | `src/lib/public-site-url.ts` |
| 快捷入口 | `src/components/dashboard/quick-actions.tsx` |
| 方舟知识库向量 | `src/lib/ai/ark-embedding.ts`、`src/features/knowledge/ingestion.ts`、`retrieval.ts` |
| 全量重算向量 | `npm run db:reembed-knowledge`、`scripts/reembed-knowledge-embeddings.ts` |
| 豆包语音 ASR | `src/lib/ai/doubao-speech.ts` |
| 通话 API | `src/app/api/call-recordings/**` |
| 矩阵列/行抽取 | `src/features/knowledge/parent-type-matrix.ts` |
| 客户解读台页 | `src/app/dashboard/customers/[customerId]/page.tsx` |
| 开发日志 | `docs/logs/development-log.md` |
| 实机测豆包语音 | `scripts/test-volc-speech-live.ts` |

---

## 环境变量（常见）

- `DATABASE_URL`、`AUTH_SECRET`、`AUTH_URL` / `NEXTAUTH_URL`（须与浏览器访问根 URL 一致；dev 默认端口 **3001**）
- 可选 **`NEXT_PUBLIC_SITE_URL`**：canonical 站点根（代理未传 Host 时兜底），见 `.env.example`
- **方舟**：`ARK_BASE_URL`、`ARK_API_KEY`、`ARK_MODEL`、`ARK_TIMEOUT_MS`
- **方舟 Embedding**：`ARK_EMBEDDING_MODEL`；多模态另需 `ARK_EMBEDDING_USE_MULTIMODAL=1`；可选 `ARK_EMBEDDING_TIMEOUT_MS`
- **豆包语音**：`VOLC_SPEECH_*`
- **备选 Whisper**：`OPENAI_API_KEY`

详见 `.env.example`。

---

## 下一步建议

1. **部署文档与上线**：见团队下一版「部署文档」；生产执行 **`npm run build`**、**`prisma migrate deploy`**；**`storage/call-recordings/`** 持久化或对象存储。
2. **验收**：首次改密全链路、快捷入口链接在 HTTPS 公网域名下是否正确。
3. **知识库**：生产配置 Embedding 接入点后按需 **`npm run db:reembed-knowledge`**。

---

## 已知风险

- 测评题库与评分规则仍在演进。
- 矩阵表头命名若与 9 型不一致，需扩展映射。
- 豆包 / 方舟超时或失败时关注日志与 `processingError`。
- **知识库**：未配置 `ARK_EMBEDDING_MODEL` 时检索为本地哈希；切换模型后须重算或保证 `embeddingModel` 一致。
- **多服务同机**：本机 `3000` 被占用时 dev 用 **3001**，勿与 `AUTH_URL` 不一致。
