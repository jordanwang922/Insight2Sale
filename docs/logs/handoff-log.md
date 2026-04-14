# 交接日志

> 文件用途：给下一个 AI 或开发者快速接手当前项目。  
> 使用方式：阶段性更新「当前状态 / 关键路径 / 下一步 / 风险」。  
> 历史长篇记录如需可查 `docs/logs/archive/development-log-through-2026-04-12.md`（开发日志归档）。

---

## 当前状态（v0.8.0）

- **版本**：`package.json` → **0.8.0**；Git 发布请打 tag **`v0.8.0`**（与 npm 一致）。
- **产品定位**：测评 + 销售 CRM（解读台、客户、日历、知识库、主管视图），非单一测评工具。
- **v0.8 新增：网页端通话录音**
  - **解读台（宽屏）**：`CustomerCallRecordingBar` 开始/停止录音 → 上传 → 异步转写与纪要。
  - **转写**：火山 **豆包语音** 大模型录音文件极速版（分句 + 时间轴 JSON）；未配置时可选 **Whisper**。
  - **纪要 / 要点**：**方舟豆包** JSON，写入 `CallRecording.summary` / `highlightsJson`。
  - **通话管理**：`/dashboard/call-recordings` 列表 + 详情妙记式展示（`TranscriptTimeline`）；侧边栏「通话管理」。
- **v0.7 仍有效**：家长类型长文案来自 9 型矩阵列；通话模式简报来自矩阵「隐性风险 / 关键提醒」+ 最弱维等（见 `call-mode-brief.ts`）。

---

## 关键路径（必读代码）

| 领域 | 入口 |
|------|------|
| 设计基线 | `docs/design/system-design.md`（§11.5、§27 通话录音） |
| 豆包语音 ASR | `src/lib/ai/doubao-speech.ts` |
| 上传后处理 | `src/features/crm/call-recording-process.ts` |
| 权限与列表条件 | `src/features/crm/call-recording-access.ts` |
| 通话 API | `src/app/api/call-recordings/**` |
| 解读台录音条 | `src/components/call-recording/customer-call-recording-bar.tsx` |
| 妙记详情 UI | `src/components/call-recording/transcript-timeline.tsx` |
| 矩阵列/行抽取 | `src/features/knowledge/parent-type-matrix.ts` |
| 家长类型文案 lookup | `src/features/knowledge/interpretation-lookup.ts` |
| 通话模式简报 | `src/features/crm/call-mode-brief.ts` |
| 客户解读台页 | `src/app/dashboard/customers/[customerId]/page.tsx` |
| 开发日志 | `docs/logs/development-log.md` |
| 实机测豆包语音 | `scripts/test-volc-speech-live.ts` |

---

## 环境变量（常见）

- `DATABASE_URL`、`AUTH_SECRET`、`AUTH_URL`（局域网调试需与浏览器访问一致；当前 dev 默认 **3001**）
- **方舟（纪要）**：`ARK_BASE_URL`、`ARK_API_KEY`、`ARK_MODEL`、`ARK_TIMEOUT_MS`
- **豆包语音（转写）**：`VOLC_SPEECH_APP_KEY`、`VOLC_SPEECH_ACCESS_KEY`、可选 `VOLC_SPEECH_RESOURCE_ID`（默认 `volc.bigasr.auc_turbo`）
- **备选 Whisper**：`OPENAI_API_KEY`

详见 `.env.example`。

---

## 下一步建议

1. **部署（阿里云 ECS）**：`npm run build` → `npm start`；**`prisma migrate deploy`**；保证 `storage/call-recordings/` 持久化或迁对象存储。
2. **验收**：解读台录音全链路 + 通话管理列表/详情；用 `scripts/test-volc-speech-live.ts` 独立验证密钥。
3. **可选**：E2E；embedding 从 `local-hash-v1` 升级；录音上云 + CDN。

---

## 已知风险

- 测评题库结构化、动态评分规则仍在持续演进。
- 矩阵表头命名若与系统 9 型不一致，需扩展列名等价或映射表。
- 豆包 / 方舟超时或失败时，部分 AI 与转写会走 fallback 或报错，需关注日志与 `processingError`。
- **多服务同机**：本机 `3000` 若被占用，Insight2Sale dev 使用 **3001**，勿与 `AUTH_URL` 不一致导致登录异常。
