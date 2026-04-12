# 交接日志

> 文件用途：给下一个 AI 或开发者快速接手当前项目。
> 使用方式：每次阶段性结束时更新“当前状态 / 关键文件 / 下一步动作 / 风险”。

---

## 当前状态

- 项目阶段：`v0.5.0` 发布前收尾
- 当前目标：完成按钮交互修复、同步日志文档、建立独立仓库并推送到 `jordanwang922/Insight2Sale`
- 当前路线：在现有可用版本基础上做发布级整理，而不是继续扩功能

## 已完成内容

- 已收集并阅读关键业务资料：
  - `智慧父母前端测评4.0（教研版-田老师修订版）.pdf`
  - `测评解读SOP.pdf`
  - `田宏杰智慧父母总体课程大纲.png`
  - `帆书 田宏杰《家长养育能力与孩子成长潜能匹配度评估》完整题目解读(1).pdf`
- 已确认系统定位：
  - 不是单一测评工具
  - 是围绕测评、解读、直播、试听、成交的销售型 CRM
- 已确认关键需求：
  - 家长端手机 H5
  - 销售端自适应后台
  - 主管总览
  - 双雷达图
  - 9 类家长类型
  - 课程挂钩建议
  - SOP 分步话术
  - 销售可编辑话术
  - 销售个人人设文案库
  - 可配置客户状态字典
  - 模板人工沉淀机制

## 关键文件

- 设计基线：
  - `docs/design/system-design.md`
- 开发日志：
  - `docs/logs/development-log.md`
- 交接日志：
  - `docs/logs/handoff-log.md`

## 下一步必须做的事

1. 让用户审阅并确认 `docs/design/system-design.md`
2. 基于设计方案输出详细实现计划
3. 完整提取 45 道测评题、选项、分值、理论依据、得分逻辑、解析
4. 确认技术栈并初始化项目结构
5. 开始实现家长端测评、评分引擎、销售后台、主管总览

## 已知风险

- 测评题库还未结构化完成
- 技术栈未最终确认
- 课程模块与维度的精细挂钩规则仍需在开发期补充

## 建议接手策略

- 先不要直接开始写业务代码
- 先确认设计文档
- 再写实现计划
- 再从“完整题库结构化 + 项目初始化”开始

---

## 2026-04-11 最新交接

### 当前状态

- MVP 主流程已开发完成，并通过 lint、test、生产构建验证
- 当前系统可完成：家长测评 -> 自动报告 -> 销售解读台 -> 预约/跟进/状态流转 -> 主管总览 -> 模板管理

### 当前可用账号

- 主管：`manager@insight2sale.local / demo12345`
- 销售：`sales1@insight2sale.local / demo12345`

### 关键文件

- `src/features/assessment/question-details.generated.ts`
- `src/features/assessment/scoring.ts`
- `src/features/crm/queries.ts`
- `src/server/actions/assessment.ts`
- `src/app/dashboard/customers/[customerId]/page.tsx`
- `src/app/dashboard/templates/page.tsx`
- `src/app/dashboard/settings/statuses/page.tsx`
- `prisma/seed.ts`

### 已知注意事项

- 附加量表题目的内部 ID 为 `100/101/102/200/201/202/300/301/302`
- `npm run build` 已切换为 `next build --webpack`，用于规避当前环境的 Turbopack 限制
- 本地数据库为 SQLite；正式部署前建议迁移 PostgreSQL

### 下一步建议

1. 接入 PostgreSQL 并产出 migration
2. 增加浏览器级 E2E 自动化
3. 细化模板审核权限与主管专属访问控制
4. 按真实业务继续精修课程模块映射和销售 SOP 文案

### 本轮新增修复

- 已补齐 Server Action 层的服务端权限校验，避免只靠页面做权限控制
- `db:seed` 已改为当前环境可稳定执行的命令
- 最新验证结果：
  - `npm run db:seed` 通过
  - `npx eslint src tests prisma next.config.ts` 通过
  - `npm test` 通过
  - `npm run build` 通过

### 数据库切换补充

- 数据库目标已从 SQLite 切换为 PostgreSQL
- 关键文件：
  - `prisma/schema.prisma`
  - `prisma/migrations/20260411_init_postgres/migration.sql`
  - `compose.yaml`
  - `.env.example`
- 当前状态：
  - Prisma schema、迁移 SQL、项目脚本、README 已全部切换
  - 因当前机器没有 Docker，尚未实际启动本地 PostgreSQL 容器

### 2026-04-11 销售流程修复补充

- 已修复的销售端问题：
  - 快捷入口新增“复制测评链接”，使用当前站点域名拼接 `/assessment/start`
  - 销售首页已移除“维护客户状态字典”“查看团队总览”这类主管专属入口
  - `/dashboard/calendar` 已改成本月月历视图，左侧菜单和快捷入口共用同一路由
  - 客户解读台雷达图组件新增空态，且查询优先读取 `ReportSnapshot` 中已存雷达图 JSON
  - 演示客户种子数据已补齐 `AssessmentSubmission` 和 `ReportSnapshot`
- 当前验证状态：
  - 演示客户 `快乐女孩`、`午後的咖啡` 都已有 1 条报告快照
  - 服务当前跑在 `http://localhost:3001`
- 后续若继续收口：
  1. 可考虑给日历加上跨月切换
  2. 可补一批演示预约数据，便于直接看到月历分布
  3. 若用户继续反馈图表问题，优先检查浏览器控制台和 Recharts hydration 行为

### 2026-04-11 知识库 / RAG 补充

- 已新增主管端知识库页面：`/dashboard/knowledge`
- 已实现 6 类知识库：
  - 课程体系库
  - 测评解读库
  - 专家话术库
  - 案例库
  - 禁用表达库
  - 关键词与风格库
- 支持输入方式：
  - 上传 PDF
  - 上传 DOCX
  - 上传 TXT / Markdown
  - 直接粘贴文本
- RAG 当前实现：
  - 文本切片：`src/features/knowledge/rag.ts`
  - 向量化：本地 `local-hash-v1`
  - 检索：按 query 计算相似度，在 `src/features/knowledge/retrieval.ts`
  - 客户解读台已展示六类召回结果
- 数据库新增：
  - `KnowledgeDocument`
  - `KnowledgeChunk`
- 种子数据：
  - 已补 6 条初始知识文档，主管登录后可直接看到
- 若继续接手：
  1. 真正要提升语义质量时，把 `local-hash-v1` 替换成正式 embedding provider
  2. 把召回知识进一步融合进完整报告生成逻辑

### 2026-04-11 17:30 继续开发后的交接补充

- 当前本地服务：
  - `http://localhost:3001`
  - 进程为新的 production build，已在本轮构建后重启
- 当前数据库状态：
  - Prisma schema 已包含：
    - `AssessmentTemplate`
    - `SupplementalScript`
    - `Appointment.title / participantName / customerId?`
    - `AssessmentSubmission.templateId`
    - `KnowledgeDocument.assessmentTemplateId`
    - `User.defaultPassword`
  - 已执行：
    - `npx prisma db push`
    - `npm run db:seed`
- 当前主推测评：
  - slug：`smart-parenting-core`
  - 标题：`智慧父母养育测评`
  - `/assessment` 和 `/assessment/start` 都会跳到 `/assessment/smart-parenting-core`
- 豆包接入现状：
  - API 已接入 `src/lib/ai/doubao.ts`
  - 当前已用于：
    - 测评模板草案生成：`src/server/actions/assessments.ts`
    - 客户解读台 SOP / 通话模式 / 维度解读：`src/features/crm/ai.ts`
  - 当前未用于：
    - RAG 向量化 embedding；仍为本地 `local-hash-v1`
- 主管端新增能力：
  - `/dashboard/assessments`：测评表管理
  - `/dashboard/calendar`：团队月历，主管可看自己和下属，不同销售不同颜色
  - `/dashboard/templates`：审核销售补充话术，勾选后进入共享模板池
  - `/dashboard/manager`：新增销售账号
- 销售端新增能力：
  - 快捷入口会跟随“主推测评”
  - 客户解读台左侧显示完整客户信息
  - 右侧 SOP 改为豆包生成，并支持按板块补充话术
- 当前仍然存在的明显后续项：
  1. `AssessmentTemplate` 目前是“模板管理 + 主推入口 + AI 草案生成”，还不是完整的动态题库/动态评分执行器
  2. 知识库关联测评已打通筛选，但向量质量仍依赖本地 hash，后续应切正式 embedding
  3. 浏览器级 E2E 还没做；本轮仅完成服务端/构建/测试级验证和 curl 冒烟
  4. GitHub 还没推；按用户要求，等再收一轮“初步可用”后再推到 `jordanwang922/Insight2Sale`

### 2026-04-11 22:20 测试与豆包修正补充

- 豆包接入现状已确认：
  - 用户提供的 API Key 是可用的
  - 之前不通的根因不是 key，而是基地址错配到了 `operator.las.../api/v1`
  - 当前项目已改为 `https://ark.cn-beijing.volces.com/api/v3`
  - 本地已验证：
    - 直接调用豆包 chat completions 返回 `200`
    - `src/lib/ai/doubao.ts` 的 `generateDoubaoJson()` 可返回真实 JSON
- 新增稳定性保护：
  - 新环境变量：`ARK_TIMEOUT_MS=8000`
  - 豆包超时或解析失败时，客户解读台会自动回退到增强 fallback，不再一直卡住
- 本轮实际验证过的关键链路：
  1. 用户名登录：
     - `tianmanager / demo12345`
     - `zhoulan / demo12345`
  2. 销售客户详情页：
     - `快乐女孩` 页面返回 `200`
     - 页面包含：雷达图、各维度详细分析、SOP 解读台、开场人设、补充话术、课程挂钩
  3. 主管首页今日预约：
     - 已确认不再混入 `2026/4/14 10:00:00`
  4. 日历页：
     - `?date=2026-04-12` 时，右侧默认开始/结束时间已同步为 `2026-04-12T15:00 / 2026-04-12T16:00`
- 当前仍建议后续继续做的优化：
  1. 客户解读台现在是真实豆包同步生成，首屏约 8 秒，建议后续加缓存或异步刷新
  2. 若继续做浏览器级 E2E，优先覆盖登录、客户解读台、日历新增/编辑/删除

### 2026-04-12 08:50 主管流程与移动端补充

- 新测评客户当前默认归主管名下：
  - `src/server/actions/assessment.ts` 已改为优先绑定最早创建的 `MANAGER`
  - 这样主管登录后能看到全部新完成测评的客户，再决定分配给哪个销售
- 客户分配能力已落地：
  - `src/server/actions/customer.ts :: assignCustomerOwner`
  - `src/app/dashboard/customers/page.tsx` 中主管可直接分配客户
  - 分配时会同步更新该客户未来预约的负责人
- “下次预约”显示逻辑已修正：
  - `src/features/crm/queries.ts` 不再只看 `customer.appointments` 关系
  - 会优先取未来最近预约，并对历史上未绑定 `customerId`、仅填了 `participantName` 的预约做昵称兜底匹配
- 日历日期同步问题已修正：
  - `src/app/dashboard/calendar/page.tsx` 右侧表单按 `selectedDate + selectedAppointmentId` 加 key 强制刷新
  - 已验证 `?date=2026-04-14` 输出 `2026-04-14T15:00 / 2026-04-14T16:00`
- 手机测试入口已可用：
  - 当前局域网地址：`http://192.168.71.53:3001`
  - `AUTH_URL` 已切到该局域网地址
  - `src/auth.ts` redirect callback 改成相对路径，登录后回跳为 `/dashboard`，不会再落回 localhost
- 关于“测试用户AAA”：
  - 当前数据库里没有这条客户，原因是之前切 PostgreSQL / 重建 schema 时执行过 reset
  - 现在新测评客户会默认先归主管，再由主管分配给销售

### 2026-04-12 10:11 发布前交接补充

- 最新修复：
  - 客户解读台“保存开场人设”“导入个人文案库”已拆成两个独立表单
  - 手机端按钮文案字号已缩小，目标是保持同排显示
  - `importPersonaLibraryToOpeningStyle` 已修正，不再把旧 `openingStyle` 重复拼接回自身
  - 已清理 `PersonaProfile` 中历史重复的 `openingStyle` 脏数据
- 当前代码状态：
  - `npx eslint src tests prisma next.config.ts` 通过
  - `npm run build` 通过
  - 本地服务仍可用：`http://localhost:3001`
  - 局域网服务仍可用：`http://192.168.71.53:3001`
- 关键文件：
  - `src/app/dashboard/customers/[customerId]/page.tsx`
  - `src/server/actions/templates.ts`
  - `README.md`
  - `package.json`
- 发布注意事项：
  - 当前目录不是独立 Git 仓库；上层 `/Users/jordanwang/YOLO` 才是 Git 根，且远端是另一个项目
  - 发布到 `jordanwang922/Insight2Sale` 前，需要先在本目录单独 `git init`
  - 不能直接在上层仓库提交/推送，否则会带上大量无关项目
- 下一步动作：
  1. 在 `Insight2Sale` 目录初始化独立 Git 仓库
  2. 关联 `https://github.com/jordanwang922/Insight2Sale.git`
  3. 提交当前代码并打 `v0.5.0` 标签
  4. 推送分支和标签
  5. 用 `gh repo edit` 更新仓库描述
  - 当前数据库中已不存在该客户
  - 大概率是在之前为切 Postgres / 改 schema 执行 `db push --force-reset` 时被清掉，无法从当前库直接恢复

### 2026-04-12 下午 UI 与本地服务

- 本次修复：
  - 主管端知识库「检索与状态」：每条知识卡片右侧「保存」按钮不再被挤成竖排；左侧摘要区可收缩（`min-w-0 flex-1`），右侧「启用 + 保存」不收缩（`shrink-0`、`flex-nowrap`）
  - 客户解读台「开场人设」：「保存开场人设」「导入个人文案库」两按钮缩小字号并 `whitespace-nowrap`，减少 13 寸屏上第二颗按钮换行
- 关键文件：
  - `src/app/dashboard/knowledge/page.tsx`
  - `src/app/dashboard/customers/[customerId]/page.tsx`
- 本地验收：
  - 浏览器访问 `http://localhost:3001`（与 README 中 `AUTH_URL` 端口一致）
  - 本轮尝试再起 `PORT=3001 npm run dev` 时若报 `EADDRINUSE`，说明该端口已有实例在跑，直接刷新页面即可，无需重复启动
  - **若使用 `npm run start`（生产模式）**：改代码后必须重新 `npm run build` 并重启 `next start`，否则页面仍是旧构建；`next dev` 则一般保存即热更新

### 2026-04-12 晚间 知识库 PDF OCR

- 能力说明：
  - 上传 PDF 时除 `pdf-parse` 提取**可选文字层**外，对需要识别的页面做**整页渲染 + Tesseract OCR**（简体中文字 + 英文），结果追加到 `KnowledgeDocument.rawText` 再切片与向量化（`local-hash-v1` 不变）
  - 测评资料上传若走同一 `extractKnowledgeText`，同样享受 OCR
- 关键文件：
  - `src/features/knowledge/pdf-ocr.ts`（OCR 主逻辑、环境变量读取）
  - `src/features/knowledge/ingestion.ts`（PDF 分支合并文字层与 OCR）
  - `next.config.ts`（`serverExternalPackages`）
  - `.env.example`（参数说明）
  - `docs/design/system-design.md` 第 24 节（产品/设计层说明 + 参数表）
- 环境变量（详见设计文档与 `.env.example`）：
  - `PDF_OCR_DISABLE`：设为 `1` 关闭 OCR
  - `PDF_OCR_MODE`：`hybrid`（默认）或 `full`（每页都 OCR，更慢更全）
  - `PDF_OCR_MAX_PAGES`、`PDF_OCR_RENDER_SCALE`、`PDF_OCR_MIN_PAGE_TEXT_CHARS`、`PDF_OCR_SHORT_DOC_THRESHOLD`
- 后续接手改法：
  - 调识别策略：改 `pdf-ocr.ts` 中 `needsFullOcr` / 跳过页逻辑
  - 换语言：改 `createWorker("chi_sim+eng")` 或增加训练数据路径
  - 换引擎：可替换 `extractPdfOcrText` 实现，保持 `ingestion.ts` 合并格式或约定
- 已知风险：`full` OCR 大文件可能拖慢 Server Action；首启可能下载语言包；`hybrid` 可能漏「同页多文字 + 少量图内字」场景
