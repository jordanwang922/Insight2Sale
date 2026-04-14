# Insight2Sale v0.7.0

智慧父母养育测评与销售转化 CRM。

这套系统把 `家长测评 -> 自动评分与报告 -> 销售解读 SOP -> 预约跟进 -> 主管管理 -> 知识库/RAG -> AI 课程挂钩` 串成一条完整链路，服务对象是家长、销售顾问和主管团队。

## 当前版本范围

- **v0.7.0**：工作台「家长类型解读」与「通话模式」对齐知识库 Excel 矩阵（按当前养育类型列精确抽取，不混 9 型）；通话简报由矩阵「隐性风险 / 关键提醒」行 + 测评最弱维 + 倦怠/核心难题短句构成，关键词加粗展示；开发日志归档续写
- **v0.6.0**：销售后台手机端体验专项（顶栏与快捷入口、客户列表卡片化、团队日历横向滑动、复制测评链接降级与提示、知识库召回标题换行）；PC 端布局保持 `md:` 及以上断点不变
- 家长端 H5 测评
- 45 题测评题库、自动评分、9 类家长类型判断
- 孩子/家长双雷达图与 6 维度解读
- 销售工作台、客户解读台、跟进记录、预约日历
- 主管端客户分配、团队日历、状态字典、模板审核
- 测评表管理与“主推测评”
- 6 类知识库管理与基础 RAG 召回
- 豆包 AI 驱动的 SOP 解读、课程挂钩、维度解读

## 技术栈

- Next.js 16
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Auth.js / NextAuth
- Recharts

## 本地启动

### 1. 配置环境变量

复制 `.env.example` 到 `.env`，至少配置：

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/insight2sale?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_URL="http://localhost:3001"
ARK_API_KEY="your-doubao-api-key"
ARK_BASE_URL="https://ark.cn-beijing.volces.com/api/v3"
ARK_MODEL="doubao-seed-1-6-251015"
ARK_TIMEOUT_MS="8000"
```

### 2. 启动 PostgreSQL

项目内提供了 `compose.yaml`：

```bash
npm run db:start
```

如果本机没有 Docker，也可以自己准备一个 PostgreSQL 实例，只要 `DATABASE_URL` 指向它即可。

### 3. 初始化数据库

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. 启动项目

```bash
npm run dev
```

生产方式：

```bash
npm run build
npm run start -- --port 3001
```

## 默认账号

种子数据会创建：

- 主管：`tianmanager / demo12345`
- 销售：`zhoulan / demo12345`
- 销售：`xuning / demo12345`

## 目录说明

- 设计方案：`docs/design/system-design.md`
- 开发日志：`docs/logs/development-log.md`
- 交接日志：`docs/logs/handoff-log.md`

## 当前注意事项

- 知识库 RAG 已接通，但向量模型目前仍是本地 `local-hash-v1`
- 豆包 AI 已接入正式 `ark` 地址
- 手机测试需要使用局域网地址，而不是 `localhost`
- 如需正式上线，建议继续补浏览器级 E2E、对象存储、短信/微信通知和更高质量 embedding

## 仓库定位

这个仓库只包含 `Insight2Sale` 项目本身，不应混入上层其他实验项目或历史仓库内容。
