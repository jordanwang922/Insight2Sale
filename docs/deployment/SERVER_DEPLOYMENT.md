# Insight2Sale 服务器部署说明（生产）

本文描述在 **Linux 服务器**（Ubuntu 22.04+ 或同类）上从 **Git `main` 分支**部署本项目的推荐路径与命令。路径以 **`/opt/insight2sale`** 为示例，可按实际替换。

---

## 1. 前置条件

| 项 | 说明 |
|----|------|
| Node.js | **20.x LTS** 或 **22.x**（与 Next.js 16 兼容即可） |
| PostgreSQL | **16**（与 `compose.yaml` 示例一致；托管 RDS 亦可） |
| 反向代理 | **Nginx** 或 Caddy（HTTPS 终止、转发到 Node） |
| 进程守护 | **PM2** 或 systemd（下文以 PM2 为例） |
| 防火墙 | 仅开放 **80/443**（及 SSH）；应用监听 **127.0.0.1:3001** 由 Nginx 反代 |

---

## 2. 目录与仓库路径（示例）

```text
/opt/insight2sale/          # 应用根目录（= 仓库 clone 目录，内含 package.json、prisma/）
├── .env                  # 生产环境变量（勿提交 Git；权限建议 600）
├── storage/              # 运行时生成：通话录音、知识库上传等（勿提交 Git；须持久化磁盘或改对象存储）
│   ├── call-recordings/
│   └── knowledge-base/
├── .next/                # npm run build 产出
└── prisma/migrations/    # 迁移 SQL；生产用 migrate deploy 应用
```

- **代码路径**：`/opt/insight2sale`（`git clone` 或 CI `rsync` 的目标目录）。
- **持久化路径**：与代码同级的 **`storage/`**（已在 `.gitignore` 中忽略）。部署后首次上传录音/知识库前，确保进程用户可写：

```bash
sudo mkdir -p /opt/insight2sale/storage/call-recordings /opt/insight2sale/storage/knowledge-base
sudo chown -R deploy:deploy /opt/insight2sale/storage
```

（`deploy` 替换为运行 Node 的系统用户。）

---

## 3. 环境变量（`.env`）

在 **`/opt/insight2sale/.env`** 配置，至少包含（详见仓库根目录 **`.env.example`**）：

- **`DATABASE_URL`**：生产 PostgreSQL 连接串（含库名、schema）。
- **`AUTH_SECRET`**：随机长串。
- **`AUTH_URL`** / **`NEXTAUTH_URL`**：浏览器访问的 **https 根地址**（与 Nginx 对外域名一致，**含端口则写端口**）。
- **`DEFAULT_NEW_USER_PASSWORD`**：新建销售/主管初始密码（≥8 位，勿泄露）。
- **`ARK_*`**、可选 **`ARK_EMBEDDING_MODEL`**：知识库向量与对话。
- **`VOLC_SPEECH_*`**：通话录音转写（若用豆包语音）。

可选：**`NEXT_PUBLIC_SITE_URL`** — 仅在反代未传 `Host` 时作为站点根兜底（见 `src/lib/public-site-url.ts`）。

---

## 4. 首次部署流程（命令顺序）

在服务器以部署用户登录，进入应用目录：

```bash
cd /opt/insight2sale
git fetch origin && git checkout main && git pull origin main
```

### 4.1 安装依赖

```bash
npm ci
```

（生产推荐 `npm ci`；勿用开发机直接 `scp node_modules`。）

### 4.2 数据库迁移

```bash
npx prisma migrate deploy
```

若生产库 **从未** 应用过 Prisma Migrate（仅有旧 `db push`），需先做 [Prisma Baseline](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate/baselining)，再 `migrate deploy`。开发/全新库可直接 deploy。

**本次测评相关迁移示例**：`prisma/migrations/20260422120000_customer_residence_city/`（`Customer.residenceCity`）。

### 4.3 构建与启动

```bash
npm run build
```

生产启动（端口可按需修改，**与 Nginx upstream 一致**）：

```bash
npm run start -- --port 3001 --hostname 127.0.0.1
```

建议使用 **PM2** 常驻（在 `/opt/insight2sale` 下）：

```bash
pm2 start npm --name insight2sale -- run start -- --port 3001 --hostname 127.0.0.1
pm2 save
```

### 4.4 种子与管理员（按需）

- **演示数据 + 默认角色/测评模板**：`npm run db:seed`（会写演示客户等，生产慎用）。
- **仅补管理员 `admin`**：见 `docs/sql/provision-admin.sql` 说明；或 **`npm run provision-admin-sql`** 生成 SQL 后 **`npx prisma db execute --file ...`**（勿将含真实哈希的 SQL 提交 Git）。

### 4.5 知识库向量（按需）

配置 `ARK_EMBEDDING_MODEL` 后，在服务器执行：

```bash
npm run db:reembed-knowledge
```

---

## 5. Nginx 反向代理（示例）

假设对外域名 **`https://crm.example.com`**，应用监听 **`127.0.0.1:3001`**：

```nginx
server {
    listen 443 ssl http2;
    server_name crm.example.com;
    # ssl_certificate /path/fullchain.pem;
    # ssl_certificate_key /path/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

部署后 **`AUTH_URL` / `NEXTAUTH_URL`** 必须与 **`https://crm.example.com`** 一致，否则登录回调异常。

---

## 6. 健康检查与日志

- 浏览器访问根路径与 `/login`。
- PM2：`pm2 logs insight2sale`。
- 数据库：确认 `npx prisma migrate status` 无待执行迁移。

---

## 7. 升级发布（小版本）

```bash
cd /opt/insight2sale
git pull origin main
npm ci
npx prisma migrate deploy
npm run build
pm2 restart insight2sale
```

---

## 8. 与测评 v2 / 题库相关的运维命令

| 命令 | 用途 |
|------|------|
| `npm run assessment:gen-from-docx` | 从 **`docs/client/智慧父母测评-v2.docx`** 重新生成 `questions.generated.ts` 与 `question-details.generated.ts`（改 Word 后执行，再 build） |
| `npm run assessment:verify-word` | 校验仓库题库 JSON 与 Word 解析一致、脚注与 Word 503–505 一致 |

---

## 9. 常见问题

| 现象 | 排查 |
|------|------|
| 登录后无限重定向 / OAuth 错 | **`AUTH_URL` / `NEXTAUTH_URL`** 是否与浏览器地址栏完全一致（协议、域名、端口） |
| 502 / 空白页 | Nginx upstream 端口是否与 `npm run start` 一致；`pm2` 进程是否崩溃（看日志） |
| 录音无法播放 | **`storage/call-recordings/`** 是否存在、权限是否可写；磁盘是否满 |
| 迁移失败 | `DATABASE_URL` 是否正确；是否需 Prisma baseline |

---

## 10. 相关文档

- 设计总览：`docs/design/system-design.md`
- 交接与变量摘要：`docs/logs/handoff-log.md`
- 本地 Docker Postgres：`compose.yaml`（生产多用托管库，不必用 compose）
