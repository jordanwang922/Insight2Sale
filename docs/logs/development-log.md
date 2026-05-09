# 开发日志

> 文件用途：记录每次开发完成了什么，帮助回溯改动历史。  
> 行数限制：本文件不超过 500 行。超过后必须归档到 `docs/logs/archive/`，然后重建本文件继续记录。  
> 记录原则：只记录高信号内容，不写流水账。  
> **2026-04-13 起**：v0.6 及更早的完整条目已归档至 `docs/logs/archive/development-log-through-2026-04-12.md`。

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

### 2026-05-09 测评选项隐藏分数

- 本次目标：修复用户端测评页所有选项后直接显示 `（1分）/ (1分)` 的低级展示问题。
- 完成内容：
  - `AssessmentForm` 新增 `displayAssessmentOptionLabel`，展示时去掉选项 label 末尾的中文/英文括号分数。
  - 仅改变页面展示；表单提交仍保留原始 `option.label` 与 `option.score`，不影响计分、报告、历史测试。
  - 新增单测覆盖中文括号和英文括号两种分数后缀。
- 影响文件：`src/components/assessment/assessment-form.tsx`、`tests/assessment/assessment-form.test.tsx`
- 验证情况：`npm test -- tests/assessment/assessment-form.test.tsx tests/assessment/report.test.ts tests/assessment/word-scoring-boundaries.test.ts` 通过；`npm run build` 通过；`git diff --check` 通过。日志未超过 500 行，无需归档。

### 2026-05-02 账号默认密码重置

- 本次目标：在 **主管总览** 的新增账号卡片下增加密码重置能力；主管可重置直属销售，管理员可重置主管；被重置账号下次登录必须修改密码。
- 完成内容：
  - `src/server/actions/users.ts` 新增 `resetSalesUserPassword` 与 `resetManagerUserPassword`：重置为 `DEFAULT_NEW_USER_PASSWORD`，并将 `User.defaultPassword` 置为 `true`。
  - 主管重置范围限定为自己的直属销售；管理员重置范围为主管账号。
  - `/dashboard/manager` 在新增销售 / 新增主管卡片下方增加 **重置密码** 表单：先选择账号，再点击 **确认重置密码**；提交中禁用并复用 `ActionFeedbackForm` 显示成功/失败提示。
  - 重置按钮文案改为 **重置密码**；点击后先弹出页面内自定义确认弹窗（不再使用浏览器原生 `confirm()`，避免顶部显示 `localhost:3001`），取消不提交，确认后才提交服务端重置。
  - 修复自定义弹窗点 **确认** 后仍停留在弹窗上的问题：确认按钮先关闭弹窗，再触发隐藏 submit 按钮提交表单。
  - 设计文档补充账号重置规则。
- 影响文件：`src/server/actions/users.ts`、`src/app/dashboard/manager/page.tsx`、`src/components/forms/confirm-submit-button.tsx`、`docs/design/system-design.md`
- 验证情况：`npm test -- tests/crm/dashboard.test.ts` 通过；`npm run build` 通过；`git diff --check` 通过。日志未超过 500 行，无需归档。

### 2026-05-01 13:40 解读台左栏高度与家长类型标题修正

- 本次目标：按验收反馈修正解读台首屏左栏：黑色雷达卡应更短，下面两条综合得分一起参与左栏高度，左侧四条合计与右侧「各维度详细分析」尽量齐平；家长类型标题需显示前缀。
- 完成内容：
  - 解读台首屏家长类型极简卡由 **温情弹性型** 改为 **家长类型：温情弹性型** 这种格式。
  - 内联黑色雷达卡高度从 `34rem` 回调到 `25rem`，`RadarChartCardDual.squashed` 内部最小高度同步从 `26rem` 下调到 `17rem`，避免内部 min-height 把卡片重新撑高，并在 23rem 过短与 27rem 过长之间取中间值。
  - 左栏仍保持 **家长类型 → 雷达图 → 家长综合得分 → 孩子综合得分** 四段结构，右栏仍只保留「各维度详细分析」。
- 影响文件：`src/components/assessment/assessment-report-parent-type-block.tsx`、`src/components/charts/radar-chart-card.tsx`、`src/app/dashboard/customers/[customerId]/page.tsx`
- 验证情况：`npm test -- tests/components/radar-chart-card.test.tsx tests/assessment/report.test.ts` 通过；`npm run build` 通过；`git diff --check` 通过。

### 2026-04-30 测评报告评分矩阵、指数标签与学习顾问文案

- 本次目标：修正 45 题测评表第 37-45 题维度标签、报告中 9 型「家长养育类型」矩阵映射、三指数分数/文案展示，并将页面中的「销售顾问」改为「学习顾问」。
- 完成内容：
  - **题目标签**：`questions.ts` 对 37-39 / 40-42 / 43-45 题分别覆盖显示为 **家长的教育焦虑指数 / 家长的教育倦怠指数 / 家长的教养能力感**，避免 Word 生成题库里沿用 `需求`。
  - **9 型矩阵**：`scoring.ts` 按 **情感支持度（维度1+2+3）x 规则引导度（维度4+5+6）** 映射：高高=权威型、中高=温和管控型、低高=独裁型、高中=爱心管家型、中中=温柔引导型、低中=冷静管理型、高低=放任型、中低=温情弹性型、低低=忽视型；`report-normalize.ts` 会基于快照中的 `emotionalSupportRaw/ruleGuidanceRaw` 重算展示类型，避免历史快照继续显示旧错误类型。
  - **三指数**：教育焦虑 / 养育倦怠 / 教养能力感继续按 3 题原始分 `/15*100` 取整，报告 UI 显示为 **xx分**；教养能力感文案改为 **能力弱 / 待提升 / 能力强**。
  - **报告展示**：新增家长/孩子 6 维综合摘要卡（各自平均分 + 优势/潜力/卡点数量）；家长类型卡优先读取知识库 **「父母养育的9种类型解读」** 对应类型的 **「一句话总结」**；类型重点提醒优先读取 **「家长9型解析」** 的 **「给你一句关键提醒」** 与 **「你需要重点修炼的父母品质」**。
  - **知识库抽取**：`parent-type-matrix.ts` 新增按当前类型列 + 指定行标签抽取能力，避免整列旧内容混入「匹配度分析 / 成长建议」等不需要的报告块。
  - **文案**：家长结果页与 README 中「销售顾问」改为 **「学习顾问」**。
- 影响文件（摘）：`src/features/assessment/scoring.ts`、`questions.ts`、`report-normalize.ts`、`src/features/knowledge/parent-type-matrix.ts`、`interpretation-lookup.ts`、`src/components/assessment/*`、`src/app/assessment/result/[submissionId]/page.tsx`、`src/app/dashboard/customers/[customerId]/page.tsx`、`tests/assessment/*`、`tests/knowledge/parent-type-matrix.test.ts`、`README.md`、`DOCS/logs/*.md`、`DOCS/design/system-design.md`
- 验证情况：**`npm test`** 全量通过（17 files / 49 tests）；**`npm run build`** 通过。**`npm run lint`** 仍失败于既有 React Hooks 规则问题（如 `customer-workspace-radars.tsx`、登录/改密表单、`interpretation-desk-template.ts`、`ark-embedding.ts`），非本次改动引入。
- 风险 / 注意事项：知识库精确取文依赖 Excel 首列行标签接近 **一句话总结 / 给你一句关键提醒 / 你需要重点修炼的父母品质**；如客户上传表头命名差异较大，需扩展 `rowLabelMatches` 规则。
- 下一步建议：用真实知识库 Excel 验收 9 个类型各自的一句话总结、关键提醒、修炼品质；如需历史报告快照也同步新 9 型结论，需批量重算 `ReportSnapshot.reportData`。

### 2026-04-30 解读台同步新评分与 9 型报告逻辑

- 本次目标：确保 **解读台** 不只展示层改报告，而是在数据查询、知识库取文、通话模式和列表入口都使用同一套新评分 / 9 型逻辑。
- 完成内容：
  - `getCustomerWorkspace` 在 CRM 查询层先执行 `normalizeAssessmentReport`，再用重算后的 `parentType.name` 做知识库精确取文和通话模式查询，避免旧 `ReportSnapshot.reportData.parentType` 继续污染解读台。
  - 客户列表页 `dashboard/customers` 的家长类型也改为 normalize 后展示，避免列表与解读台详情页显示不一致。
  - 解读台报告区新增 `AssessmentReportDimensionSummary`，与家长端一样显示家长/孩子各维度平均分及优势/潜力/卡点数量。
  - 解读台类型解读区如果已取到 **「给你一句关键提醒」** 与 **「你需要重点修炼的父母品质」**，不再叠加 AI 旧 `salesHooks` 列表，避免图七旧「匹配度分析/成长建议」口径混入。
  - 通话模式短句中的「销售可先对齐」改为「顾问可先对齐」。
- 影响文件：`src/features/crm/queries.ts`、`src/app/dashboard/customers/page.tsx`、`src/app/dashboard/customers/[customerId]/page.tsx`、`src/features/crm/call-mode-brief.ts`、`DOCS/logs/*.md`
- 验证情况：`npm test -- tests/assessment/word-scoring-boundaries.test.ts tests/features/crm/call-mode-brief.test.ts tests/crm/dashboard.test.ts` 通过；`npm run build` 通过；本地 dev 服务仍在 **http://localhost:3001** 运行。
- 风险 / 注意事项：解读台页面当前每次请求仍会查询知识库与生成 AI 输出，已有页面响应约 8-10s；若后续觉得慢，应缓存 `lookupParentTypeReportCopy` 或减少实时 AI 生成。

### 2026-04-30 解读台布局与长文恢复

- 本次目标：响应验收反馈：解释图 1 文案来源；将解读台上方布局改为左侧「家长养育类型 + 雷达图」、右侧「各维度详细分析」；恢复原本的长类型解读和 SOP，不因新指定板块而删掉旧长文。
- 完成内容：
  - 图 1 的「负责，但不够温柔 / 中接纳+高要求 / …」来自代码内置 `parentTypeDefinitions` 的 `description` 与 `characteristics`，仅作为知识库缺失时的兜底；知识库有内容时仍优先显示「一句话总结」。
  - `buildKbWorkspaceInterpretation` 恢复 `parentTypeSnippet` 为原来的当前类型整列长文；`parentTypePracticeSections` 只作为新增指定板块，不再替换长文。
  - 解读台报告概览改为两栏：左栏上方家长养育类型、下方孩子/家长 6 维雷达图；右栏整块显示各维度详细分析。
  - 解读台类型解读区先显示新规则指定的「给你一句关键提醒 / 你需要重点修炼的父母品质」，再保留原来的长文 `ParentTypeInterpretationText`；SOP 模版块保持原样。
- 影响文件：`src/features/knowledge/interpretation-lookup.ts`、`src/app/dashboard/customers/[customerId]/page.tsx`、`DOCS/logs/development-log.md`
- 验证情况：`npm test -- tests/knowledge/parent-type-matrix.test.ts tests/assessment/word-scoring-boundaries.test.ts` 通过；`npm run build` 通过。

### 2026-04-30 解读台/长图视觉细节修正

- 本次目标：按验收截图修正指数卡、浮动雷达与分享长图底部内容。
- 完成内容：
  - `AssessmentReportIndexCards`：三张指数卡内容整体居中；底部只显示 **比较焦虑 / 比较疲惫 / 能力弱** 等文案，去掉 `（x/15 分）`。
  - `CustomerWorkspaceRadars` / `RadarChartCardDual`：左侧浮动雷达宽度收窄，避免遮挡课程学习等内容；标题改为完整 **家长与孩子六维雷达图** 且单行显示，图例置于标题下方。
  - `AssessmentReportParentTypeBlock`：分享长图模式下去掉内置特征 bullet 与情感/规则 raw 分说明，只保留类型名与一句话总结。
  - `AssessmentReportSharePanel`：分享长图先移除底部 **课程学习建议** 与 **脚注说明** 两块。
- 影响文件：`src/components/assessment/assessment-report-index-cards.tsx`、`assessment-report-parent-type-block.tsx`、`assessment-report-share-panel.tsx`、`src/components/dashboard/customer-workspace-radars.tsx`、`src/components/charts/radar-chart-card.tsx`
- 验证情况：`npm test -- tests/components/radar-chart-card.test.tsx tests/assessment/report.test.ts tests/assessment/word-bands.test.ts` 通过；`npm run build` 通过。

### 2026-04-30 解读台首屏高度与分享长图格式继续调整

- 本次目标：让解读台左/右首屏模块高度更接近；让摘要得分条并入右侧详细分析上方；让雷达图变正方形；让分享长图的类型重点提醒更接近用户给定格式。
- 完成内容：
  - `AssessmentReportDimensionSummary` 增加 `compact` 模式：每条摘要一行显示，左侧为「家长/孩子各维度综合得分：xx分」，右侧为「x项优势·x项潜力·x项卡点」。
  - 解读台首屏改为右侧 `AssessmentReportDimensionSummary compact` + `DimensionAnalysisGrid`，左侧为缩短的家长类型卡 + 正方形雷达图，减少左右高度差。
  - `AssessmentReportPracticeSections` 在分享长图模式下取消每段黑底卡片，改为标题 + 正文的直接排版，更贴近指定格式。
- 影响文件：`src/components/assessment/assessment-report-dimension-summary.tsx`、`assessment-report-practice-sections.tsx`、`assessment-report-parent-type-block.tsx`、`src/app/dashboard/customers/[customerId]/page.tsx`
- 验证情况：`npm test -- tests/assessment/report.test.ts tests/components/radar-chart-card.test.tsx` 通过；`npm run build` 通过。

### 2026-04-30 解读台首屏与分享长图最终收口

- 本次目标：继续按验收截图收口布局：首屏左右等高、右侧摘要与详细分析合并、分享长图雷达正方形、家长类型块直接承接知识库两段提醒。
- 完成内容：
  - `AssessmentReportParentTypeBlock` 新增 `practiceSections`、`hideDiagnostics`、`compact`：解读台首屏可隐藏情感/规则原始分，只保留类型、一句话总结和知识库两段提醒；分享长图中两段提醒紧跟家长类型块展示。
  - 解读台首屏两栏比例改为左窄右宽；左侧雷达限制为 `aspect-square max-h-[31rem]`，避免再次拉成长方形。
  - `CustomerWorkspaceRadars` 内联雷达容器补 `h-full`，标题统一为 **家长与孩子六维雷达图**。
  - `RadarChartCardDual.forSharePng` 改为 `aspect-square` 内部自适应，不再使用固定 `22rem/96` 高度，避免长图雷达上下空白。
  - 分享长图中如已取得「给你一句关键提醒 / 你需要重点修炼的父母品质」，不再另起一块重复展示。
- 影响文件：`src/components/assessment/assessment-report-parent-type-block.tsx`、`assessment-report-share-panel.tsx`、`src/components/dashboard/customer-workspace-radars.tsx`、`src/components/charts/radar-chart-card.tsx`、`src/app/dashboard/customers/[customerId]/page.tsx`
- 验证情况：`npm test -- tests/assessment/report.test.ts tests/components/radar-chart-card.test.tsx` 通过；`npm run build` 通过；`git diff --check` 通过。

### 2026-04-30 解读台首屏类型卡极简与雷达对齐

- 本次目标：按验收反馈，首屏家长养育类型卡只保留类型名称，并让下方黑色雷达卡与上方黄色类型卡同栏边缘对齐。
- 完成内容：
  - `AssessmentReportParentTypeBlock` 新增 `titleOnly` 模式；解读台首屏只显示如 **冷静管理型** 的类型名称，不显示标题、总结、两段提醒、特征 bullet 或原始分。
  - 解读台左栏宽度比例进一步收窄；雷达外层去掉 `max-h` 截断，改为 `aspect-square w-full`，避免宽度仍满而高度被截导致边缘不齐。
- 影响文件：`src/components/assessment/assessment-report-parent-type-block.tsx`、`src/app/dashboard/customers/[customerId]/page.tsx`
- 验证情况：`npm test -- tests/assessment/report.test.ts tests/components/radar-chart-card.test.tsx` 通过；`npm run build` 通过；`git diff --check` 通过。

### 2026-04-30 解读台左栏补齐与系统错误容错

- 本次目标：把家长/孩子综合得分两条移到雷达图下方补齐左栏高度；修复系统业务错误直接显示英文白屏的问题。
- 完成内容：
  - 解读台首屏左栏调整为 **类型名 → 雷达图 → 综合得分两条**，右栏只保留 **各维度详细分析** 大框，让左右高度更接近。
  - `submitLogin` 捕获 NextAuth `AuthError`，错误密码等登录失败跳回 `/login?error=...`，由登录页显示 **用户名或密码错误，请重试。**，不再进入 Next.js 错误页。
  - 新增 `src/app/error.tsx` 与 `src/app/global-error.tsx`，将漏网的页面/服务端错误改为中文错误页，展示可读错误信息、错误编号、重新加载和返回工作台入口。
  - `AssessmentForm` 增加答题完整性前端校验：题目未答完时直接在测评页提示 **已答 x / 45 题**，不再由服务端抛错。
- 影响文件：`src/app/dashboard/customers/[customerId]/page.tsx`、`src/server/actions/auth-login.ts`、`src/app/error.tsx`、`src/app/global-error.tsx`、`src/components/assessment/assessment-form.tsx`
- 验证情况：`npm test -- tests/assessment/report.test.ts tests/components/radar-chart-card.test.tsx` 通过；`npm run build` 通过；`git diff --check` 通过。

### 2026-04-30 保存反馈、防重复提交与状态历史分页

- 本次目标：继续修正解读台首屏左右对齐；让保存类操作有明确成功提示并防止重复点击产生重复数据；给状态流转历史增加分页。
- 完成内容：
  - 解读台首屏左栏宽度比例从 `0.82fr` 收窄到 `0.76fr`，右栏加宽到 `1.24fr`，使左侧三块底线更容易与右侧各维度详细分析对齐。
  - 新增 `ActionFeedbackForm`：提交中禁用整个表单，显示 **正在保存，请不要重复点击**；成功显示对应 **保存成功** 提示；失败显示中文错误。
  - 解读台客户页的 **保存状态 / 保存跟进记录 / 保存预约 / 保存个人文案库** 已接入成功提示与提交中禁用。
  - 团队总览创建账号、日历预约新增/修改/删除、状态字典新增/更新、测评模板新增/更新、知识条目编辑、话术模板审核/配置也接入同一保存反馈壳。
  - 服务端幂等：30 秒内相同跟进记录、相同预约重复提交直接忽略；客户状态如果已是目标状态则不再新增流转记录。
  - `getCustomerWorkspace` 支持状态流转分页；客户页通过 `transitionsPage` 查询参数展示上一页/下一页与总条数。
- 影响文件：`src/components/forms/action-feedback-form.tsx`、`src/app/dashboard/customers/[customerId]/page.tsx`、`src/features/crm/queries.ts`、`src/server/actions/customer.ts`、`src/server/actions/statuses.ts`、`src/server/actions/appointments.ts`、`src/app/dashboard/calendar/page.tsx`、`src/app/dashboard/manager/page.tsx`、`src/app/dashboard/settings/statuses/page.tsx`、`src/app/dashboard/assessments/page.tsx`、`src/app/dashboard/templates/page.tsx`、`src/app/dashboard/knowledge/document/[id]/edit/page.tsx`
- 验证情况：`npm test -- tests/assessment/report.test.ts tests/components/radar-chart-card.test.tsx` 通过；`npm run build` 通过；`git diff --check` 通过。

### 2026-05-01 雷达可读性、知识库页精简与首页统计修正

- 本次目标：按验收反馈优化浮动雷达可读性；移除知识库总览页过长的「检索与状态」板块；修正首页状态统计只看最终状态、状态卡只显示 4 个、首页黑色总览被预约列表撑高的问题。
- 完成内容：
  - `RadarChartCardDual` 的 docked 浮动模式：标题字号下调，雷达画布高度增加，维度标签字号、网格线、折线宽度和对比度提高，便于在左侧窄栏读取。
  - `/dashboard/knowledge` 移除整块 **检索与状态**，只保留知识库分类入口与新增知识表单；具体检索/编辑改走分类页和知识条目编辑页。
  - `/dashboard` 状态统计口径改为 **到达过该状态的客户数**：当前状态与 `StatusTransition.toStatusId` 历史均计入，同一客户同一状态只算一次。
  - 首页状态卡不再 `.slice(0, 4)`，改为 `xl:grid-cols-5`，有几个非零状态就显示几个，避免「已付款」等状态被覆盖。
  - 首页首屏总览区改为 `items-start`，黑色「今日工作总览」固定最小高度，右侧「今日预约」内部滚动，避免预约数量增加时把左侧黑框拉长。
- 影响文件：`src/components/charts/radar-chart-card.tsx`、`src/app/dashboard/knowledge/page.tsx`、`src/app/dashboard/page.tsx`、`src/features/crm/queries.ts`
- 验证情况：`npm test -- tests/assessment/report.test.ts tests/components/radar-chart-card.test.tsx` 通过；`npm run build` 通过；`git diff --check` 通过。

### 2026-05-01 解读台雷达高度与浮动出现条件修正

- 本次目标：解读台首屏左侧雷达卡再压扁，让下方两条综合得分上移补齐右侧详细分析高度；修复进页面时左侧浮动雷达直接出现并挡住菜单的问题。
- 完成内容：
  - `RadarChartCardDual` 新增 `squashed` 模式；`CustomerWorkspaceRadars` 内联大雷达使用压低高度，不再强制正方形。
  - 客户详情页内联雷达外层从 `aspect-square` 改为固定较扁高度 `h-[34rem]`，为下方摘要留出空间。
  - 浮动小雷达增加 `hasPassedInlineRadar` 条件：只有内联大雷达从屏幕上方滚出后才显示；刚进入页面或内联雷达仍在下方未出现时，不显示左侧浮窗，避免遮挡侧边菜单。
- 影响文件：`src/components/charts/radar-chart-card.tsx`、`src/components/dashboard/customer-workspace-radars.tsx`、`src/app/dashboard/customers/[customerId]/page.tsx`
- 验证情况：`npm test -- tests/assessment/report.test.ts tests/components/radar-chart-card.test.tsx` 通过；`npm run build` 通过；`git diff --check` 通过。

### 2026-04-12 v1.2.0 版本号与文档对齐

- **package.json / package-lock.json** → **`1.2.0`**（`npm version 1.2.0 --no-git-tag-version`）。
- **Git tag**：**`v1.2.0`**（与 semver 一致，推送 **`origin`**）。
- **README**、**`docs/logs/handoff-log.md`** 中版本描述已更新；v1.0.0 保留为「首版」历史条目。

### 2026-04-12 测评体验、报告长图、解读台、提交与生产部署备忘

- **测评入口页**：去掉模板 **`reportOutlineJson`** 渲染的四个黄色大纲块；测评说明题数改为 **`assessmentTotalQuestionCount`**（与题库动态一致）。
- **信息采集**：第 4 题「长期居住城市」改为 **6 档单选**（一线/新一线/二线/三线及以下/港澳台/海外）；第 11 题养育角色增加 **孩子的奶奶/爷爷或外婆/外公**、**其他**。
- **题库题干**：核心题 10 / 11 去掉「（参考量表…）」；**`build_assessment_from_docx.py`** 增加 **`clean_question_stem`**，从 Word 再生成时自动剥除，**`npm run assessment:verify-word`** 仍通过。
- **提交测评**：**`assessment-form.tsx`** 对 Server Action 使用 **`await submitAssessment(formData)`**，修复「提交并生成报告无反应 / redirect 不完成」。
- **Hydration**：**`layout.tsx`** 根 **`<html>`** 增加 **`suppressHydrationWarning`**，缓解浏览器扩展（如沉浸式翻译）注入 `data-*` 导致的 hydration 报错。
- **保存分享长图**：**`html-to-image`** — 去掉包裹 **`overflow-x-auto`**、雷达区去掉 **`translateZ(0)`**、**`toPng`** 传入实测 **`width`/`height`** 与样式锁定，修复导出图「大半空白、内容挤一侧」；长图卡片 **约 390px 宽**、根 **`text-[16px]`**，子组件 **`forSharePng`** + **`RadarChartCardDual.forSharePng`** 放大手机可读字号与雷达标签。
- **解读台 SOP**：仓库 **`interpretation-desk-template.txt`** 删除「解读前发图 8 + 相关话术」段；**`stripDeskNineTypePreviewBlock`** 在 **`buildInterpretationDeskMarkdownForDisplay`** / **`getInterpretationDeskRawForAi`** 中剥离同结构块（知识库旧切片仍生效）；**`interpretation-desk-markdown.tsx`** 移除对已删「解读前」行的单独 spotlight 渲染。
- **影响文件（摘）**：`src/app/assessment/[slug]/page.tsx`、`src/app/layout.tsx`、`src/features/assessment/intake-fields.ts`、`questions.ts`、`questions.generated.ts`、`scripts/build_assessment_from_docx.py`、`src/components/assessment/assessment-form.tsx`、`assessment-report-*.tsx`、`radar-chart-card.tsx`、`interpretation-desk-template.ts`、**`interpretation-desk-template.txt`**、`interpretation-desk-markdown.tsx`、`tests/features/sales/interpretation-desk-normalize.test.ts`
- **验证**：**`npm test`**、**`npm run build`**、**`npm run assessment:verify-word`**。
- **生产数据库**：若此前未跑过 Migrate，见交接日志 **`residenceCity`** 与 **`migrate deploy` / baseline / 应急 `db push`** 说明。

### 2026-04-12 部署文档：生产服务器根路径

- **`docs/deployment/SERVER_DEPLOYMENT.md`**、**`docs/logs/handoff-log.md`** 中示例根路径统一为 **`/var/www/crm001/Insight2Sale`**（与当前生产目录一致）。

### 2026-04-22 智慧父母测评 v2（Word 对齐）、报告与部署文档

- 本次目标：以 **`docs/client/智慧父母测评-v2.docx`** 为真源对齐采集与题库；报告计分与 Word「三、计分规则」一致；用户端与解读台展示完整报告块；可核对、可部署。
- 完成内容：
  - **采集**：`intake-fields.ts` 按 Word 前段（含 **长期居住城市**）；`Customer.residenceCity` + 迁移 `20260422120000_customer_residence_city`；`submitAssessment` 写入；客户页展示。
  - **题库**：`scripts/build_assessment_from_docx.py` 从 docx 生成 `questions.generated.ts` / `question-details.generated.ts`；`npm run assessment:gen-from-docx`；**`npm run assessment:verify-word`** 逐项比对 Word 与仓库 JSON（题干/选项/分值/脚注）。
  - **计分**：`scoring.ts` — 六维 15 分档（13–15/9–12/0–8）、情感支持度与规则引导度 45 分档（37–45/27–36/0–26）、9 型矩阵、三指数话术档与百分制；`report-word-copy.ts` 脚注与 Word 503–505 一致（「教育能力感」用词与句末标点已对齐）。
  - **报告 UI**：结果页与长图含雷达、分档、三指数、家长类型矩阵说明、课程建议、脚注；解读台在 SOP 前增加与家长端一致的报告块；`normalizeAssessmentReport` 兼容旧快照。
  - **依赖**：`html-to-image`（报告长图导出）。
  - **部署**：新增 **`docs/deployment/SERVER_DEPLOYMENT.md`**（路径、迁移、PM2、Nginx、storage、升级命令）。
- 影响文件（摘）：`prisma/schema.prisma`、`prisma/migrations/*residence*`、`prisma/seed.ts`、`src/features/assessment/*`、`src/server/actions/assessment.ts`、`src/app/assessment/**`、`src/app/dashboard/customers/**`、`src/components/assessment/**`、`scripts/build_assessment_from_docx.py`、`scripts/verify_word_vs_repo.py`、`tests/assessment/*.test.ts`、`package.json`、`docs/logs/*.md`、`docs/deployment/SERVER_DEPLOYMENT.md`、`docs/client/智慧父母测评-v2.docx`、`.gitignore`
- 验证情况：**`npm run assessment:verify-word`** 通过；**`npm test`**（含 `word-bands`、`word-scoring-boundaries`）；**`npm run build`** 通过。
- 风险 / 注意事项：历史 **`ReportSnapshot.reportData`** 可由 normalize 补字段；若需库内报告数值与新版算法完全一致，需另行批量重算写回；生产 **`storage/`** 须持久化。
- 下一步建议：生产执行 **`migrate deploy`** 后回归测评全流程与解读台；按需 **`db:reembed-knowledge`**。

### 2026-04-22 安全：移除仓库内明文默认密码（GitGuardian）

- 本次目标：消除 GitHub **Generic Password** 类告警（典型来源：默认密码硬编码于源码、以及 `provision-admin.sql` 中存放的 bcrypt 与注释明文）。
- 完成内容：初始密码仅来自 **`DEFAULT_NEW_USER_PASSWORD`**（`getDefaultNewUserPassword()`）；**`npm run provision-admin-sql`** 从环境生成 SQL；`docs/sql/provision-admin.sql` 改为说明文件；`compose.yaml` 的 Postgres 口令改为必填 **`${POSTGRES_PASSWORD:?...}`**；README / 交接日志 / 设计文档去掉演示口令字面量；新增 **`scripts/load-dotenv.ts`** 供 seed 与生成脚本读取根目录 `.env`。
- 若历史提交已泄露口令：**轮换**线上 `DEFAULT_NEW_USER_PASSWORD` 与所有仍用旧初始密码的账号，并考虑 GitHub **secret scanning** 已推送密钥的吊销流程。
- 影响文件：`src/config/default-credentials.ts`、`src/server/actions/users.ts`、`src/app/dashboard/manager/page.tsx`、`prisma/seed.ts`、`scripts/*`、`package.json`、`compose.yaml`、`.env.example`、`docs/sql/provision-admin.sql`、`README.md`、`docs/logs/*.md`、`docs/design/system-design.md`

### 2026-04-12 管理员角色、组织总览与本地 admin 登录排查

- 本次目标：**单一管理员 `admin`**（`UserRole.ADMIN`）、主管挂 `adminId`、管理员仅建主管；新建用户默认密码改为 **环境变量 `DEFAULT_NEW_USER_PASSWORD`**（仓库内无明文）；云端用 **`npm run provision-admin-sql`** 生成 SQL 补管理员与挂靠；修复本地用 admin 登录报 **`CredentialsSignin`**。
- 完成内容：
  - **Schema / 迁移**：`UserRole.ADMIN`、`User.adminId` 及关系（`prisma/migrations/20260421103000_admin_role_admin_id`）；通话相关迁移见同目录较早文件。
  - **业务**：`createManagerUser`（仅管理员）、权限与 CRM 查询区分管理员/主管；`docs/sql/provision-admin.sql`。
  - **登录**：`src/auth.ts` 对用户名 **trim + toLowerCase** 再校验；`submitLogin` 同步小写，避免大小写不一致查不到用户。
  - **本地根因**：库中**无** `admin` 行，且曾缺 **`ADMIN` 枚举 / `adminId` 列**（仅用旧 `db push` 建库、未跑迁移历史时）；执行 **`npx prisma db push`** 对齐 schema 后 **`npm run db:seed`** 可写入 `admin` 并将 `tianmanager.adminId` 指向该管理员。
- 影响文件（摘）：`prisma/schema.prisma`、`prisma/migrations/20260421103000_admin_role_admin_id/migration.sql`、`src/auth.ts`、`src/server/actions/auth-login.ts`、`docs/sql/provision-admin.sql`、`docs/logs/*.md`
- 验证情况：本地 `db push` + `.env` 配置初始密码 + `db:seed` 后 admin 登录与 `bcrypt.compare` 通过；`npm run build` 此前已通过。
- 风险 / 注意事项：**生产**若已有库且无 `_prisma_migrations`，不能假设 `migrate deploy` 一步到位，需 [Prisma baseline](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate/baselining) 或托管方推荐的「对齐迁移表」流程；本地可暂用 **`db push`** 快速对齐开发库。
- 下一步建议：云端 **`git pull`** → **`npm ci`** → **`npx prisma migrate deploy`**（或 baseline 后 deploy）→ **`npm run build`** → 执行 **`docs/sql/provision-admin.sql`**（或 seed，视是否接受演示数据）。

### 2026-04-16 v1.0.0 发布（首版冻结）

- 本次目标：发布 **v1.0.0**；账号与微信端体验收口；设计/开发/交接文档与 **README** 对齐；打 Git tag **`v1.0.0`** 并推送 **origin/main**。
- 完成内容：
  - **新销售默认密码**：曾由代码常量单点配置（后已改为环境变量 **`DEFAULT_NEW_USER_PASSWORD`**）；`createSalesUser` / `seed` 共用；主管创建销售页**醒目提示**初始密码与安全告知。
  - **首次登录强制改密**：`User.defaultPassword` ↔ JWT/Session `mustChangePassword`；`/dashboard` 布局拦截；`/login` 已登录且未改密直达 `/password?required=1`；`changePassword` 成功后清标记；已登录改密成功 **自动跳转工作台**（无需再点链接）。
  - **微信 / 手机**：快捷入口分端——桌面「打开 + 复制」；手机仅链接框长按复制；测评完整 URL 服务端 `getPublicSiteUrl()` + 客户端兜底；解读台内嵌链接区 HTML 结构修正（避免块级控件非法嵌套于段落）。
  - **产品清理**：移除调试用「前端包」角标与相关文件；雷达图等若干 UI 与知识库管线延续 v0.8。
  - **文档**：`system-design.md` 账号条款更新；`development-log` / `handoff-log` / `README` 版本号与说明。
- 影响文件（摘）：`src/config/default-credentials.ts`、`src/auth.ts`、`src/app/dashboard/layout.tsx`、`src/app/login/page.tsx`、`src/app/password/page.tsx`、`src/components/forms/change-password-form.tsx`、`src/server/actions/users.ts`、`src/components/dashboard/quick-actions.tsx`、`src/lib/public-site-url.ts`、`docs/design/system-design.md`、`docs/logs/*.md`、`README.md`、`package.json`
- 验证情况：`npm test`、`npm run build` 通过（发布前已执行）。
- 风险 / 注意事项：生产务必配置 **`AUTH_URL` / `NEXTAUTH_URL`** 与公网访问一致；可选 **`NEXT_PUBLIC_SITE_URL`** 仅在代理未传 Host 时使用。
- 下一步建议：**部署文档**（环境与反代、数据库迁移、持久化 `storage/`、HTTPS）；生产监控方舟与豆包额度。

### 2026-04-15 知识库：豆包语义向量（Embedding）

- 本次目标：将知识库 RAG 从本地 `local-hash-v1` **切换为火山方舟豆包 Embedding**；检索与入库向量一致；支持 **Vision 接入点**（`/embeddings/multimodal`）；历史切片可全量重算。
- 完成内容：
  - **实现**：`src/lib/ai/ark-embedding.ts`（标准 `/embeddings` + 多模态 `/embeddings/multimodal`）；`buildKnowledgeChunks` 异步；`retrieveKnowledge` 按 `embeddingModel` 过滤；`ARK_EMBEDDING_MODEL`、`ARK_EMBEDDING_USE_MULTIMODAL`、`ARK_EMBEDDING_TIMEOUT_MS`。
  - **脚本**：`npm run db:reembed-knowledge` → `scripts/reembed-knowledge-embeddings.ts`。
  - **文档**：`docs/design/system-design.md` 新增 **§28**；修订 §23、§25；`.env.example` 注释。
  - **实跑**：全量重算约 1774 条切片成功（多模态并发）；`npm test`、`npm run build` 通过。
- 影响文件（摘）：`src/lib/ai/ark-embedding.ts`、`src/features/knowledge/ingestion.ts`、`retrieval.ts`、`ingest-document.ts`、`src/server/actions/knowledge.ts`、`prisma/seed.ts`、`package.json`、`scripts/reembed-knowledge-embeddings.ts`、`.env.example`、`docs/design/system-design.md`、`docs/logs/handoff-log.md`
- 验证情况：`npm test`、`npm run build`；`db:reembed-knowledge` 对方舟成功（需有效 `ARK_*` 与接入点）。
- 风险 / 注意事项：接入点 ID 须与控制台一致（曾出现日期笔误导致 404）；**Vision** 须 `ARK_EMBEDDING_USE_MULTIMODAL=1`；纯文本 Embedding 接入点可关多模态开关以提升批量性能。
- 下一步建议：生产环境监控方舟 Embedding 额度与限流；可选改用 `Doubao-embedding` / `large` 文本接入点减轻多模态请求量。

### 2026-04-15 v0.8.0 发布

- 本次目标：发布 **v0.8.0**；将 **网页端通话录音 + 豆包语音妙记式转写 + 方舟纪要** 纳入产品与文档基线；开发 / 交接日志更新；代码推送 **main**。
- 完成内容：
  - **通话录音**：解读台宽屏 `CustomerCallRecordingBar`（MediaRecorder）→ `POST /api/call-recordings`，音频存 `storage/call-recordings/`。
  - **转写**：优先 `transcribeWithDoubaoFlash`（`show_utterances`、分句入库 `transcriptSegmentsJson`）；备选 OpenAI Whisper；纪要 / 要点 `generateDoubaoJson`。
  - **页面**：`/dashboard/call-recordings` 列表与侧边栏入口；详情页 `TranscriptTimeline`（时间轴、点击跳转播放、复制全文）；列表说明文案单行展示。
  - **工程**：`postinstall` + `build` 前置 `prisma generate`；`prisma` 列入 `dependencies`；开发默认端口 **3001** 避免与本机其它服务抢 `3000`。
  - **文档**：`docs/design/system-design.md` 新增 §11.5、§27；§21 待确认项更新；`README` 版本说明；脚本 `scripts/test-volc-speech-live.ts` 便于验收豆包语音。
- 影响文件（摘）：`prisma/schema.prisma`、`prisma/migrations/*call_recording*`、`src/app/api/call-recordings/**`、`src/features/crm/call-recording-*.ts`、`src/lib/ai/doubao-speech.ts`、`src/components/call-recording/**`、`src/app/dashboard/call-recordings/**`、`package.json`、`docs/design/system-design.md`、`docs/logs/*`、`README.md`、`scripts/test-volc-speech-live.ts`
- 验证情况：`npm test`、`npm run build`；豆包语音可用 `node --env-file=.env --import tsx scripts/test-volc-speech-live.ts` 实机联调（需有效 `VOLC_SPEECH_*`）。
- 未完成项 / 风险：ECS / 生产须 **持久化 `storage` 或换对象存储**；数据库须执行迁移；勿将 `.env` 与录音提交仓库。
- 下一步建议：阿里云部署时配置反代超时与磁盘；按需将录音迁 OSS/COS。

### 2026-04-13 v0.7.0 发布

- 本次目标：发布 **v0.7.0**；工作台「家长类型解读」与「通话模式」与知识库 **Excel 矩阵**精确对齐（按列、按行，不混型）；开发/交接日志归档续写；代码推送 **main**。
- 完成内容：
  - **9 型矩阵列抽取**：`parent-type-matrix.ts` 表头识别、当前养育类型列、`【标题】\n正文` 输出；列名与系统类型支持后缀等价（如「权威型」↔「权威型父母」）；入库 `rawText` CSV 与磁盘 `.xlsx` 双路径。
  - **家长类型解读展示**：`parent-type-interpretation-parse.ts` 全局解析多段 `【】`；`ParentTypeInterpretationText`；客户页 `whitespace-pre-line`；标题全角括号 + 每段标题加粗略大于正文。
  - **通话模式简报**：`lookupCallModeMatrixSnippets` 仅从矩阵 **当前类型列** 取「隐性风险」「关键提醒」行；`call-mode-brief.ts` 拼 2～3 句（最弱维 + 类型名 + 矩阵风险/提醒 + 倦怠兜底 + 核心难题）；`CallModeBriefText` 关键词加粗；**不再**用豆包 `callMode` 三字段作为该区块主文案。
  - **interpretation-lookup**：`lookupParentTypeSnippet` 仅查标题含「父母养育的9种类型解读」「家长9型解析」的测评解读库文档。
  - **日志**：原开发日志全文归档 `docs/logs/archive/development-log-through-2026-04-12.md`；本文件自 v0.7 起重新计数。
  - **仓库卫生**：`.gitignore` 增加 `storage/`（本地上传）、根目录 `*.traineddata` 副本，避免误提交大文件与用户资料。
- 影响文件（摘）：`src/features/knowledge/parent-type-matrix.ts`、`interpretation-lookup.ts`、`src/features/crm/call-mode-brief.ts`、`src/components/sales/*`、`src/lib/parent-type-interpretation-parse.ts`、`src/app/dashboard/customers/[customerId]/page.tsx`、`tests/knowledge/`、`tests/lib/`、`tests/features/crm/`、`package.json`、`README.md`、`docs/logs/*`、`.gitignore`
- 验证情况：`npm test`、`npm run build` 通过（发布前已执行）。
- 风险 / 注意事项：矩阵行标题须与代码中「隐性风险 / 关键提醒」匹配规则一致，若 Excel 表头命名差异大需在 `rowMatchesRiskLabel` / `rowMatchesReminderLabel` 中扩展；本地 `storage/` 不上库，生产需配置持久化与备份策略。
- 下一步建议：真机验收通话模式简报与 9 型长文；按需将豆包 `callMode` 字段从 AI 输出类型中标记废弃或改作其它用途。
