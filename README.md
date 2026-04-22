# Insight2Sale v1.0.0

智慧父母养育测评与销售转化 CRM。

这套系统把 `家长测评 -> 自动评分与报告 -> 销售解读 SOP -> 预约跟进 -> 主管管理 -> 知识库/RAG -> AI 课程挂钩` 串成一条完整链路，服务对象是家长、销售顾问和主管团队。

## 当前版本范围

- **v1.0.0（首版）**：**新建销售/主管初始密码**由环境变量 **`DEFAULT_NEW_USER_PASSWORD`**（至少 8 位，勿提交到 Git）+ **`getDefaultNewUserPassword()`** 读取；**首次登录强制改密**（未改密不可进工作台；改密后自动进入工作台）；团队总览页**醒目提示**初始密码；**快捷入口**分端（桌面：打开 + 复制链接；手机：仅可长按复制的链接框）；测评链接根地址 **`getPublicSiteUrl()`** 随部署域名变化；移除调试用「前端包」角标；设计文档 / 开发日志 / 交接日志已对齐
- **v0.8.0**：网页端通话录音 → 豆包语音妙记式转写 + 方舟纪要；通话管理列表与详情；`prisma generate` 纳入 install/build；开发默认端口 **3001**
- **v0.7.0**：家长类型解读与通话模式对齐知识库 Excel 矩阵
- 家长端 H5 测评、45 题题库、双雷达图、销售工作台、主管视图、知识库与 RAG、豆包 AI 解读等（详见 `docs/design/system-design.md`）

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
# 与 seed / 创建销售 / 创建主管一致；至少 8 位，勿写入版本库
DEFAULT_NEW_USER_PASSWORD="replace-with-min-8-chars"
# 若使用 compose.yaml 起 Postgres，须与 compose 中变量一致
POSTGRES_PASSWORD="replace-local-postgres-password"
AUTH_URL="http://localhost:3001"
NEXTAUTH_URL="http://localhost:3001"
ARK_API_KEY="your-doubao-api-key"
ARK_BASE_URL="https://ark.cn-beijing.volces.com/api/v3"
ARK_MODEL="doubao-seed-1-6-251015"
ARK_TIMEOUT_MS="8000"
```

知识库语义向量（生产建议配置）：`ARK_EMBEDDING_MODEL`（方舟 Embedding 接入点 ID，与 `ARK_MODEL` 不同）。

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

种子数据会创建（登录名固定，**密码均为你在 `.env` 中配置的 `DEFAULT_NEW_USER_PASSWORD`**）：

- 管理员：`admin`
- 主管：`tianmanager`
- 销售：`zhoulan`、`xuning`

首次登录若仍使用上述初始密码，系统会要求先修改密码后再进入工作台。

## 目录说明

- 设计方案：`docs/design/system-design.md`
- 开发日志：`docs/logs/development-log.md`
- 交接日志：`docs/logs/handoff-log.md`

## 当前注意事项

- 知识库 RAG 在生产应配置 **方舟 Embedding**（`ARK_EMBEDDING_MODEL`）；切换或补算向量见 `npm run db:reembed-knowledge`
- 手机或局域网调试时，`AUTH_URL` / `NEXTAUTH_URL` 须与浏览器实际访问地址（含端口）一致
- 正式上线前建议配置 HTTPS、持久化上传与录音目录、并复核环境变量

## 仓库定位

这个仓库只包含 `Insight2Sale` 项目本身，不应混入上层其他实验项目或历史仓库内容。
