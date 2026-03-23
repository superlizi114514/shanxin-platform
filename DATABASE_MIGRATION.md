# Vercel Postgres 数据库部署指南

## 概述

本项目已从 SQLite 迁移到 **Vercel Postgres**，以支持生产环境部署。

## 部署步骤

### 步骤 1：在 Vercel Dashboard 创建数据库

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目（山信二手平台）
3. 点击 **Storage** 标签页
4. 点击 **Add Database** → **New Vercel Postgres database**
5. 选择数据库名称（建议使用 `shanxin-platform-db`）
6. 选择区域（建议：**日本东京 hnd1**，离山东最近）
7. 点击 **Create Database**

### 步骤 2：获取数据库连接字符串

创建完成后，在数据库页面：

1. 点击 **Connect** 按钮
2. 选择 **Production** 环境
3. 复制 `POSTGRES_URL` 的值
4. 在 URL 末尾添加 `?pgbouncer=true`（启用连接池）

最终格式：
```
postgres://user:password@hostname.vercel-pg.com:5432/dbname?pgbouncer=true
```

### 步骤 3：在 Vercel 配置环境变量

在项目设置中配置以下环境变量：

1. 进入 **Settings** → **Environment Variables**
2. 添加以下变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `DATABASE_URL` | 你的 Vercel Postgres URL（带 ?pgbouncer=true） | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://sxhh.online` | All |
| `AUTH_SECRET` | 生成随机字符串（见下方） | Production |
| `NEXTAUTH_URL` | `https://sxhh.online` | Production |

生成 AUTH_SECRET：
```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[System.Web.Security.Membership]::GeneratePassword(32, 8)
```

### 步骤 4：运行数据库迁移

在本地或 Vercel 部署时自动运行：

```bash
# 生成 Prisma Client
npx prisma generate

# 运行迁移
npx prisma migrate deploy
```

### 步骤 5：重新部署项目

1. 进入 Vercel Dashboard → 你的项目
2. 点击 **Deployments** 标签页
3. 点击最新部署的 **...** → **Redeploy**
4. 或者推送代码到 Git 触发自动部署

---

## 本地开发配置

本地开发继续使用 SQLite，无需连接生产数据库：

```bash
# .env.local 配置（本地开发）
DATABASE_URL="file:./dev.db"
```

---

## 验证连接

部署后，访问以下页面验证：

- 首页：https://sxhh.online
- 管理后台：https://sxhh.online/admin

---

## 故障排查

### 问题：无法连接数据库

**原因**：缺少 `?pgbouncer=true` 参数

**解决**：在 DATABASE_URL 末尾添加 `?pgbouncer=true`

### 问题：迁移失败

**原因**：Prisma Client 未重新生成

**解决**：
```bash
npx prisma generate
npx prisma migrate deploy
```

### 问题：环境变量未生效

**原因**：Vercel 缓存

**解决**：
1. 进入 Vercel Dashboard → Settings → Environment Variables
2. 确认变量已配置到 Production 环境
3. 重新部署项目（Redeploy）

---

## 数据库管理

### 查看数据

使用 Vercel Data Studio：
1. 进入 Vercel Dashboard → Storage → 你的数据库
2. 点击 **Data Studio**
3. 浏览和查询数据

### 备份数据

Vercel Postgres 自动备份：
- 每日自动备份
- 保留 7 天历史
- 可在 Data Studio 中恢复

### 监控用量

进入 Vercel Dashboard → Storage → 你的数据库 → **Usage**

免费计划配额：
- 存储：2 GB
- 写入：500 MB/月
- 读取：无限制

---

## 迁移完成检查清单

- [ ] Vercel Postgres 数据库已创建
- [ ] DATABASE_URL 已配置到 Vercel
- [ ] AUTH_SECRET 已生成并配置
- [ ] 数据库迁移已运行
- [ ] 项目已重新部署
- [ ] 首页可以正常访问
- [ ] 用户可以注册登录
- [ ] 商品可以正常发布

---

## 相关文档

- [Vercel Postgres 官方文档](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma + Vercel Postgres 指南](https://www.prisma.io/docs/getting-started/quickstart)
- [NextAuth.js 认证配置](https://next-auth.js.org/providers/)
