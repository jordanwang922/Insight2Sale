# 开发日志

> 文件用途：记录每次开发完成了什么，帮助回溯改动历史。
> 行数限制：本文件不超过 500 行。超过后必须归档到 `docs/logs/archive/`，然后重建本文件继续记录。
> 记录原则：只记录高信号内容，不写流水账。

---

## 记录模板

### YYYY-MM-DD HH:mm

- 本次目标：
- 完成内容：
- 影响文件：
- 验证情况：
- 未完成项：
- 风险 / 注意事项：
- 下一步建议：

---

## 当前记录

### 2026-04-12 下午

- 本次目标：修复主管知识库「检索与状态」中「保存」按钮被压成竖排字的问题；修复客户解读台「开场人设」两按钮在 13 寸屏上换行的问题；更新日志并确认本地可访问服务供验收。
- 完成内容：
  - 知识库卡片：左侧内容区 `min-w-0 flex-1`，右侧「启用 + 保存」表单 `shrink-0`、`flex-nowrap`，保存按钮 `whitespace-nowrap` + `type="submit"`，避免窄宽度下按钮被挤成一字一行
  - 开场人设：两按钮统一更小字号（`text-[11px]` / `sm:text-xs`）、`whitespace-nowrap`，避免与 `sm:text-sm` 放大后换行
- 影响文件：
  - `src/app/dashboard/knowledge/page.tsx`
  - `src/app/dashboard/customers/[customerId]/page.tsx`
  - `docs/logs/development-log.md`
  - `docs/logs/handoff-log.md`
- 验证情况：
  - `npx eslint` 针对上述页面已通过
  - 本地 `http://127.0.0.1:3001/` 返回 `200`（该端口已有 `next dev` / Node 进程在监听；若重复执行 `PORT=3001 npm run dev` 会因 `EADDRINUSE` 失败，属正常）
  - **补充（同日稍后）**：用户以生产模式访问时需重新编译；已执行 `npm run build` 成功，结束旧 3001 进程后已用 `PORT=3001 npm run start` 拉起新构建，强刷后即可看到界面更新
- 未完成项：同前（独立 Git 仓库与远端推送等）
- 下一步建议：浏览器强刷后验收知识库与客户解读台布局；若需改端口，可用 `PORT=3000 npm run dev`。

### 2026-04-12 10:11

- 本次目标：修复客户解读台开场人设区的按钮布局与导入逻辑，补齐版本文档并准备发布 `v0.5.0`。
- 完成内容：
  - 将“保存开场人设”“导入个人文案库”拆成两个独立表单，避免同一表单里两个 Server Action 互相干扰
  - 调整按钮字号、内边距与栅格间距，保证手机端尽量保持同排显示
  - 修复“导入个人文案库”逻辑，只从销售个人文案字段拼接导入，不再把旧 `openingStyle` 自己重复拼进去
  - 清理已有 `PersonaProfile.openingStyle` 历史重复脏数据，重算为干净版本
  - README 重写为 `v0.5.0` 版本说明，补充最新账号、AI、RAG、启动方式和仓库定位
  - `package.json` 版本号更新为 `0.5.0`
- 影响文件：
  - `src/app/dashboard/customers/[customerId]/page.tsx`
  - `src/server/actions/templates.ts`
  - `README.md`
  - `package.json`
  - `docs/logs/development-log.md`
  - `docs/logs/handoff-log.md`
- 验证情况：
  - `npx eslint src tests prisma next.config.ts` 通过
  - `npm run build` 通过
  - 页面 HTML 已确认包含“保存开场人设”“导入个人文案库”
  - 数据库中 `PersonaProfile.openingStyle` 已清洗为单次拼接结果
- 未完成项：
  - 将当前项目初始化为独立 Git 仓库
  - 打 `v0.5.0` 标签并推送到 `jordanwang922/Insight2Sale`
  - 更新 GitHub 仓库描述
- 风险 / 注意事项：
  - 上层 `YOLO` 目录本身是另一个 Git 仓库，不能直接在上层仓库推送，否则会混入大量无关目录
- 下一步建议：在 `Insight2Sale` 目录单独初始化 Git 仓库，关联目标远端后提交、打标签、推送。

### 2026-04-11 00:00

- 本次目标：建立项目基线文档体系，落地系统设计方案、开发日志、交接日志。
- 完成内容：
  - 新建 `docs/design/system-design.md`
  - 新建 `docs/logs/development-log.md`
  - 新建 `docs/logs/handoff-log.md`
  - 在设计方案中明确产品定位、角色权限、客户漏斗、测评系统、报告系统、销售作战台、管理端、销售人设文案库、模板沉淀机制、日志规范
- 影响文件：
  - `docs/design/system-design.md`
  - `docs/logs/development-log.md`
  - `docs/logs/handoff-log.md`
- 验证情况：文档已写入项目目录，内容覆盖当前已确认需求。
- 未完成项：
  - 设计方案需用户确认
  - 需要输出详细实现计划
  - 需要完整提取测评 45 题与解析
  - 需要开始系统开发
- 风险 / 注意事项：
  - 测评题库尚未完成最终结构化录入
  - 技术选型尚未最终确认
- 下一步建议：请用户先审阅设计方案，再进入实现计划与开发阶段。

### 2026-04-11 07:00

- 本次目标：完成 MVP 主流程开发，并做完整验证。
- 完成内容：
  - 完成家长端 H5 测评、45 题题库接入、自动评分与基础结果页
  - 完成销售端登录、工作台、客户列表、客户解读台、预约、状态流转、跟进记录、销售人设文案编辑
  - 完成主管端总览、模板管理、状态配置中心
  - 完成课程挂钩建议、家长类型输出、双雷达图展示
  - 完成模板沉淀与模板优先级/状态管理
  - 完成题目“理论依据 / 得分逻辑 / 题目解析”的结构化接入
  - 修复种子脚本、类型定义、重复手机号提交、未完成答题提交、离线字体与生产构建问题
- 影响文件：
  - `src/app/**`
  - `src/components/**`
  - `src/features/**`
  - `src/server/actions/**`
  - `prisma/schema.prisma`
  - `prisma/seed.ts`
  - `package.json`
- 验证情况：
  - `npx prisma generate` 通过
  - `npx prisma db push --force-reset --skip-generate` 通过
  - `npm run db:seed` 通过
  - `npx eslint src tests prisma next.config.ts` 通过
  - `npm test` 通过（5/5）
  - `npm run build` 通过（使用 webpack）
- 未完成项：
  - PostgreSQL 生产迁移
  - 真正的浏览器级 E2E 自动化
  - 日志自动归档脚本
- 风险 / 注意事项：
  - 当前本地数据库为 SQLite，适合 MVP 演示，不建议直接作为正式生产库
  - Turbopack 在当前环境受限，因此生产构建已固定为 webpack
- 下一步建议：进入真实业务联调，优先细化课程挂钩文案、模板审核规则和上云部署。

### 2026-04-11 07:20

- 本次目标：做全面测试并修复关键缺陷。
- 完成内容：
  - 发现并修复 Server Action 权限绕过风险
  - 为状态配置、模板管理、客户状态更新、预约、跟进、销售人设编辑补上服务端鉴权与客户归属校验
  - 修复种子脚本在当前环境下因 `tsx` IPC 导致无法执行的问题，改为 `node --import tsx prisma/seed.ts`
  - 重新完成数据库、lint、测试、生产构建验证
- 影响文件：
  - `src/server/action-auth.ts`
  - `src/server/actions/statuses.ts`
  - `src/server/actions/templates.ts`
  - `src/server/actions/customer.ts`
  - `src/server/actions/appointments.ts`
  - `package.json`
- 验证情况：
  - `npx prisma db push --skip-generate` 通过
  - `npm run db:seed` 通过
  - `npx eslint src tests prisma next.config.ts` 通过
  - `npm test` 通过（5/5）
  - `npm run build` 通过
- 未完成项：
  - 浏览器级 E2E 自动化仍待补充
- 风险 / 注意事项：
  - 当前沙箱不允许监听本地端口，因此本轮无法做真实浏览器级端到端回放
  - 代码层、构建层、数据库初始化层已完成可执行验证
- 下一步建议：交由你进行人工业务验收，优先检查登录、测评提交、客户解读台、主管页面和模板管理。

### 2026-04-11 07:40

- 本次目标：将数据库从 SQLite 切换到 PostgreSQL。
- 完成内容：
  - Prisma 数据源已切换为 PostgreSQL
  - 补充了正式环境更需要的索引
  - 新增 PostgreSQL 初始化迁移文件与 migration lock
  - 新增 `compose.yaml`，提供本地 PostgreSQL 容器配置
  - 更新 `.env`、`.env.example`、README 和数据库脚本
  - 保留现有种子脚本，改为兼容当前环境的执行方式
- 影响文件：
  - `prisma/schema.prisma`
  - `prisma/migrations/20260411_init_postgres/migration.sql`
  - `prisma/migrations/migration_lock.toml`
  - `.env`
  - `.env.example`
  - `compose.yaml`
  - `package.json`
  - `README.md`
- 验证情况：
  - `npx prisma validate` 通过
  - `npx prisma generate` 通过
  - `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` 通过
  - `npx eslint src tests prisma next.config.ts` 通过
  - `npm test` 通过（5/5）
  - `npm run build` 通过
- 未完成项：
  - 本机未安装 Docker，因此未实际拉起 PostgreSQL 容器做联机验证
- 风险 / 注意事项：
  - 代码和迁移已切换到 PostgreSQL，但要真正启动数据库仍需要你本机安装 Docker 或提供现成 PostgreSQL 实例
- 下一步建议：你本机装好 Docker 后执行 `npm run db:start && npm run db:push && npm run db:seed`，即可完成真实 PostgreSQL 初始化。

### 2026-04-11 13:45

- 本次目标：修复销售端测试中暴露出的快捷入口、权限入口、预约日历和雷达图问题。
- 完成内容：
  - 新增销售/主管分角色快捷入口配置
  - 快捷入口新增“复制测评链接”按钮，复制后提示“已复制测评链接，请发给客户。”
  - 销售首页不再显示主管专属入口，避免点击后被重定向回工作台造成“没反应”的体验
  - 预约日历页改为本月月历视图，同页显示每天预约块和本月预约清单
  - 客户解读台的雷达图组件新增空态提示，不再渲染纯空白卡片
  - 查询层增加从 `ReportSnapshot.parentRadarData/childRadarData` 的雷达图回退读取
  - 种子脚本补齐演示客户的测评提交与报告快照，确保销售演示流程能直接看到雷达图和报告
  - 去掉首页“今日工作总览”中的“把测评、预约和后续推进放在同一个节奏里。”
- 影响文件：
  - `src/features/crm/dashboard.ts`
  - `src/features/crm/calendar.ts`
  - `src/components/dashboard/quick-actions.tsx`
  - `src/components/charts/radar-chart-card.tsx`
  - `src/features/crm/queries.ts`
  - `src/app/dashboard/page.tsx`
  - `src/app/dashboard/calendar/page.tsx`
  - `src/app/dashboard/customers/[customerId]/page.tsx`
  - `prisma/seed.ts`
  - `tests/crm/dashboard.test.ts`
  - `tests/crm/calendar.test.ts`
  - `tests/components/radar-chart-card.test.tsx`
- 验证情况：
  - `npm test` 通过（9/9）
  - `npx eslint src tests prisma next.config.ts` 通过
  - `npm run build` 通过
  - `npm run db:seed` 通过
- 风险 / 注意事项：
  - 本月预约日历当前是“当前月份静态视图”，暂未加入跨月切换
  - 日历默认不会自动生成演示预约数据，若需要可由销售在客户解读台手动创建
- 下一步建议：继续按销售真实操作流做回归，重点测试“新增预约后日历是否立刻展示”“销售提交模板后主管页是否可见”。

### 2026-04-11 14:10

- 本次目标：为主管端增加 6 类知识库管理，并打通基础 RAG 检索链路到销售解读台。
- 完成内容：
  - Prisma 新增 `KnowledgeDocument`、`KnowledgeChunk` 模型
  - 新增知识库分类常量、文本切片、向量化、相似度排序能力
  - 支持主管上传 `PDF / DOCX / TXT / 直接粘贴文本`
  - 上传后自动切片并生成本地向量 `local-hash-v1`
  - 新增主管页面 `/dashboard/knowledge`
  - 新增知识库启停、分类统计、搜索和 chunk 预览
  - 侧边栏新增“知识库管理”，仅主管可见
  - 客户解读台新增“知识库召回”区域，按 6 类知识显示 RAG 结果
  - 种子数据新增 6 条初始知识，覆盖课程、测评解读、话术、案例、禁用表达、风格
- 影响文件：
  - `prisma/schema.prisma`
  - `src/features/knowledge/categories.ts`
  - `src/features/knowledge/rag.ts`
  - `src/features/knowledge/ingestion.ts`
  - `src/features/knowledge/retrieval.ts`
  - `src/server/actions/knowledge.ts`
  - `src/app/dashboard/knowledge/page.tsx`
  - `src/features/crm/queries.ts`
  - `src/app/dashboard/customers/[customerId]/page.tsx`
  - `src/components/dashboard/sidebar.tsx`
  - `prisma/seed.ts`
  - `tests/knowledge/rag.test.ts`
- 验证情况：
  - `npx prisma db push` 通过
  - `npx prisma generate` 通过
  - `npm test` 通过（12/12）
  - `npx eslint src tests prisma next.config.ts` 通过
  - `npm run build` 通过
  - `npm run db:seed` 通过
- 风险 / 注意事项：
  - 当前向量模型为本地 `local-hash-v1`，链路完整但语义质量不如真实 embedding API
  - PDF / DOCX 已支持抽取文本，但复杂版式文档仍可能需要人工整理后再上传
- 下一步建议：
  - 如后续提供正式 embedding API key，可把向量生成从本地模型切换到高质量语义模型
  - 可继续把知识库召回结果深度融合进完整测评报告版式，而不只是显示为解读参考块

### 2026-04-11 17:30

- 本次目标：把系统从 MVP 推进到可运营版本，补齐主推测评、主管测评管理、团队日历、豆包驱动解读、销售补充话术审核和账号管理。
- 完成内容：
  - Prisma 新增 `AssessmentTemplate`、`SupplementalScript`，并扩展 `AssessmentSubmission`、`KnowledgeDocument`、`Appointment`、`User`
  - 新增主管端 `/dashboard/assessments`，支持手工创建测评、上传资料让 AI 生成测评模板草案、设定“主推测评”
  - 销售快捷入口改为基于“主推测评”动态生成链接，复制时不再写死 `localhost`
  - 新增 `/assessment/[slug]`，`/assessment` 和 `/assessment/start` 自动跳到主推测评
  - 测评提交已回写 `templateId`，并按主推测评写入来源信息
  - 新增豆包接入：客户解读台的通话模式、SOP 步骤、维度解读由豆包按客户画像和知识库结果生成
  - 知识库已支持绑定到具体测评，客户解读台检索时按测评优先召回
  - 日历重做为团队月历：主管可看自己与下属，不同销售不同颜色，点击日期 `+` 可直接新增预约
  - 预约支持内部事项和非客户事项，`Appointment` 新增 `title`、`participantName`
  - 客户解读台重做：左侧展示完整客户信息，中间显示雷达图和维度解读，右侧为 AI 生成 SOP 与课程挂钩
  - 每个 SOP 板块支持“补充话术”，销售提交后先存为 `SupplementalScript`
  - 主管模板管理页新增销售补充话术审核，勾选后才进入共享模板池
  - 主管总览页新增“新增销售账号”，默认密码仍为 `demo12345`
  - 登录页新增“记住登录名和密码”和“修改密码”入口；新增 `/dashboard/password`
  - 测评前置页改成更接近目标视觉的暖色大版式
- 影响文件：
  - `prisma/schema.prisma`
  - `prisma/seed.ts`
  - `src/server/actions/assessments.ts`
  - `src/server/actions/appointments.ts`
  - `src/server/actions/assessment.ts`
  - `src/server/actions/templates.ts`
  - `src/server/actions/users.ts`
  - `src/features/crm/queries.ts`
  - `src/features/crm/ai.ts`
  - `src/features/knowledge/retrieval.ts`
  - `src/components/dashboard/quick-actions.tsx`
  - `src/components/forms/login-form.tsx`
  - `src/app/assessment/page.tsx`
  - `src/app/assessment/start/page.tsx`
  - `src/app/assessment/[slug]/page.tsx`
  - `src/app/dashboard/page.tsx`
  - `src/app/dashboard/calendar/page.tsx`
  - `src/app/dashboard/assessments/page.tsx`
  - `src/app/dashboard/customers/[customerId]/page.tsx`
  - `src/app/dashboard/knowledge/page.tsx`
  - `src/app/dashboard/manager/page.tsx`
  - `src/app/dashboard/password/page.tsx`
  - `src/app/dashboard/templates/page.tsx`
  - `tests/crm/dashboard.test.ts`
- 验证情况：
  - `npx prisma generate` 通过
  - `npx prisma db push` 通过
  - `npm run db:seed` 通过
  - `npx eslint src tests prisma next.config.ts` 通过
  - `npm test` 通过（12/12）
  - `npm run build` 通过
  - 新 build 已重新启动在 `http://localhost:3001`
- 风险 / 注意事项：
  - 豆包当前已用于测评模板草案生成和客户解读台 SOP 生成；RAG 向量仍是本地 `local-hash-v1`，还没切到正式 embedding API
  - 测评表管理目前能创建模板与主推入口，但“任意文档直接变成可执行打分问卷”仍是草案态，不是完整自动建模
  - 登录“记住密码”当前是浏览器本地存储方案，属于内测期能力
- 下一步建议：
  - 继续把测评模板管理从“模板草案”推进到“真正可执行的动态题库与动态评分规则”
  - 把豆包 embedding 接到知识库向量化链路，提升语义召回质量
  - 做浏览器级 E2E 流程回放，重点覆盖登录、主推测评、客户解读台和团队日历

### 2026-04-11 22:20

- 本次目标：验证豆包是否真实接入，并对登录、客户解读台、今日预约筛选做一轮集成回归。
- 完成内容：
  - 对照 `YOLO/ai-learning-assistant` 的豆包接入方式核对出当前项目基地址配置错误
  - 将 `ARK_BASE_URL` 修正为 `https://ark.cn-beijing.volces.com/api/v3`
  - 更新 `src/lib/ai/doubao.ts`，支持直接传完整地址 / 自动补全 `/chat/completions`，并兼容 fenced JSON 输出
  - 为豆包请求增加 `ARK_TIMEOUT_MS` 超时兜底，避免客户解读台长时间阻塞
  - 修正 `/password` 页当前账号展示逻辑，避免类型错误导致构建失败
  - 完成一轮 HTTP 集成测试：用户名登录、客户详情页渲染、主管今日预约筛选、日历选中日期默认时间
- 影响文件：
  - `.env`
  - `.env.example`
  - `src/lib/ai/doubao.ts`
  - `src/app/password/page.tsx`
- 验证情况：
  - 直接请求 `https://ark.cn-beijing.volces.com/api/v3/chat/completions` 返回 `200`
  - 项目内 `generateDoubaoJson()` 实测可返回真实 JSON
  - `npx eslint src tests prisma next.config.ts` 通过
  - `npm test` 通过（12/12）
  - `npm run build` 通过
  - HTTP 集成测试确认：
    - 用户名登录成功
    - 客户详情页 `200` 返回，包含雷达图、维度分析、SOP 解读台、开场人设、补充话术、课程挂钩
    - 主管首页“今日预约”不再混入 `2026/4/14 10:00:00`
    - 日历页 `?date=2026-04-12` 默认时间为 `2026-04-12T15:00 / 2026-04-12T16:00`
- 风险 / 注意事项：
  - 客户详情页当前真实调用豆包后，首屏渲染约 8 秒，虽然已不再卡死，但后续仍建议把 AI 生成改成缓存或异步更新

### 2026-04-12 08:50

- 本次目标：修正主管反馈的预约日期同步、客户归属与分配、移动端登录跳转、客户列表下次预约显示。
- 完成内容：
  - 测评提交后新客户默认归主管，不再默认塞给第一个销售
  - 新增主管分配客户动作 `assignCustomerOwner`，可在客户管理列表直接把客户分配给销售或收回给主管
  - 客户分配时会同步改写该客户未来预约的 `ownerId`
  - 日历右侧预约表单按 `selectedDate + appointmentId` 强制重挂载，修复点击不同日期时默认开始/结束时间不刷新
  - 预约创建 / 修改时，若仅填写参与人昵称，会自动匹配现有客户并回填 `customerId`
  - 客户列表“下次预约”改为取未来最近预约，并支持按 `participantName` 兜底匹配老预约数据
  - Auth redirect callback 改成相对路径返回，配合 `AUTH_URL` 局域网地址，手机登录后不再跳回 localhost
  - 新增客户解读台 `loading.tsx`，进入解读台时展示“正在进行 AI 智能解读”
  - 调整维度分析卡片标题字号，降低“接纳情绪 / 家庭系统”换行概率
- 影响文件：
  - `src/server/actions/assessment.ts`
  - `src/server/actions/customer.ts`
  - `src/server/actions/appointments.ts`
  - `src/features/crm/queries.ts`
  - `src/app/dashboard/customers/page.tsx`
  - `src/app/dashboard/calendar/page.tsx`
  - `src/components/assessment/dimension-analysis-grid.tsx`
  - `src/auth.ts`
  - `.env`
  - `.env.example`
  - `src/app/dashboard/customers/[customerId]/loading.tsx`
- 验证情况：
  - `npx eslint src tests prisma next.config.ts` 通过
  - `npm test` 通过（12/12）
  - `npm run build` 通过
  - HTTP 验证通过：
    - 客户列表已显示 `2026/4/14`、`2026/4/16` 的下次预约
    - 局域网地址登录后认证回跳为 `/dashboard`
    - `?date=2026-04-14` 时，日历表单默认时间为 `2026-04-14T15:00 / 2026-04-14T16:00`
