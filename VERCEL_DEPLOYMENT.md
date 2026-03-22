# 山信二手平台 - Vercel 部署指南

## 部署前准备

### 1. Vercel 账号
1. 访问 [Vercel](https://vercel.com)
2. 使用 GitHub 账号登录
3. 创建新团队或个人项目

### 2. 数据库设置 (Vercel Postgres)

1. 在 Vercel Dashboard 中，进入项目
2. 点击 **Storage** 标签
3. 点击 **Add Database** > **Create new** > **PostgreSQL**
4. 选择数据库名称和区域（建议选择 **hnd1** - 东京，离中国最近）
5. 创建完成后，Vercel 会自动注入 `POSTGRES_URL` 环境变量
6. 手动创建 `DATABASE_URL` 环境变量，值与 `POSTGRES_URL` 相同

### 3. 图片存储设置 (Vercel Blob)

1. 在 Vercel Dashboard 中，进入项目
2. 点击 **Storage** 标签
3. 点击 **Add** > **Create new** > **Blob**
4. 创建完成后，Vercel 会自动注入 `BLOB_READ_WRITE_TOKEN` 环境变量

### 4. 邮件服务设置 (Resend)

1. 访问 [Resend](https://resend.com)
2. 注册账号并创建 API Key
3. 在 Vercel 环境变量中添加 `RESEND_API_KEY`

### 5. OAuth 应用设置

#### Google OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 创建新项目
3. 启用 **Google+ API**
4. 创建 **OAuth 2.0 客户端 ID**
5. 添加授权跳转 URI:
   - `http://localhost:3000/api/auth/callback/google` (本地开发)
   - `https://your-domain.vercel.app/api/auth/callback/google` (生产环境)
6. 获取 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`

#### GitHub OAuth

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 创建新的 **OAuth App**
3. Application name: `山信二手平台`
4. Homepage URL: `https://your-domain.vercel.app`
5. Authorization callback URL:
   - `http://localhost:3000/api/auth/callback/github` (本地开发)
   - `https://your-domain.vercel.app/api/auth/callback/github` (生产环境)
6. 获取 `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET`

### 6. 生成 AUTH_SECRET

```bash
# 使用 OpenSSL 生成随机密钥
openssl rand -base64 32
```

## 部署步骤

### 方法一：通过 Vercel Dashboard

1. **导入项目**
   - 在 Vercel Dashboard 点击 **Add New...** > **Project**
   - 从 GitHub 导入仓库
   - 选择 `shanxin-platform` 项目

2. **配置环境变量**
   在 Vercel Dashboard 的 **Settings** > **Environment Variables** 中添加：

   ```
   DATABASE_URL=postgres://...
   AUTH_SECRET=your-secret-key
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
   RESEND_API_KEY=re_xxxxx
   BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx
   GOOGLE_CLIENT_ID=xxxxx
   GOOGLE_CLIENT_SECRET=xxxxx
   GITHUB_CLIENT_ID=xxxxx
   GITHUB_CLIENT_SECRET=xxxxx
   ```

3. **配置数据库**
   - 进入 **Storage** 标签
   - 添加 Vercel Postgres 数据库
   - 添加 Vercel Blob 存储

4. **部署**
   - 点击 **Deploy**
   - 等待构建完成

### 方法二：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 进入项目目录
cd shanxin-platform

# 首次部署
vercel

# 生产环境部署
vercel --prod
```

## 数据库迁移

部署后需要运行数据库迁移：

```bash
# 在 Vercel 中，使用 Vercel CLI 运行迁移
vercel env pull .env.production.local
npx prisma generate
npx prisma db push

# 或者使用 Vercel 的 Postgres 管理界面直接执行 SQL
```

## 环境变量说明

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `DATABASE_URL` | 数据库连接 URL | Vercel Postgres |
| `AUTH_SECRET` | NextAuth 密钥 | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | NextAuth 回调 URL | 你的 Vercel 域名 |
| `NEXT_PUBLIC_SITE_URL` | 站点 URL | 你的 Vercel 域名 |
| `RESEND_API_KEY` | Resend 邮件服务密钥 | https://resend.com |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 存储密钥 | Vercel Dashboard |
| `GOOGLE_CLIENT_ID` | Google OAuth 客户端 ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 密钥 | Google Cloud Console |
| `GITHUB_CLIENT_ID` | GitHub OAuth 客户端 ID | GitHub Settings |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth 密钥 | GitHub Settings |

## 部署后配置

### 1. 更新 OAuth 回调 URL

确保在 Google Cloud Console 和 GitHub Developer Settings 中添加了生产环境的回调 URL:
- `https://your-domain.vercel.app/api/auth/callback/google`
- `https://your-domain.vercel.app/api/auth/callback/github`

### 2. 更新站点 URL

在 Vercel Dashboard 中更新环境变量:
- `NEXT_PUBLIC_SITE_URL` = `https://your-domain.vercel.app`
- `NEXTAUTH_URL` = `https://your-domain.vercel.app`

### 3. 自定义域名 (可选)

1. 在 Vercel Dashboard 进入 **Settings** > **Domains**
2. 添加自定义域名
3. 按照指引配置 DNS 记录

## 故障排查

### 构建失败

检查构建日志，常见问题：
- Prisma 客户端未生成：运行 `npx prisma generate`
- TypeScript 错误：运行 `npm run build` 本地测试

### 运行时错误

- 数据库连接失败：检查 `DATABASE_URL` 是否正确
- OAuth 登录失败：检查回调 URL 是否配置正确
- 图片上传失败：检查 `BLOB_READ_WRITE_TOKEN` 是否有效

### 查看日志

```bash
# 查看实时日志
vercel logs

# 查看生产环境日志
vercel logs --prod
```

## 持续集成

Vercel 会自动监听 `main` 分支的变更：
- Push 到 `main` 分支 → 自动部署到生产环境
- Push 到其他分支 → 创建预览部署

## 性能优化建议

1. **图片优化**: 使用 Vercel Blob 存储图片，自动优化格式
2. **CDN 加速**: Vercel 全球 CDN 自动加速
3. **边缘缓存**: 静态内容自动缓存到边缘节点
4. **数据库优化**: 使用 Vercel Postgres 连接池

## 监控与分析

### 1. Vercel Analytics（推荐）

在 Vercel Dashboard 启用：
1. 进入项目 Dashboard
2. 点击 **Analytics** 标签
3. 启用 **Web Vitals** 监控

系统会自动收集：
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- TTFB (Time to First Byte)

### 2. 应用日志

查看日志：
```bash
# 查看实时日志
vercel logs

# 查看生产环境日志
vercel logs --prod

# 过滤错误日志
vercel logs --prod | grep "ERROR"
```

### 3. 错误追踪

系统已集成错误追踪：
- 前端自动捕获 JavaScript 错误
- API 错误自动记录日志
- 结构化日志输出

详见：[监控与日志指南](./docs/MONITORING.md)

### 4. 可选：Sentry 集成

如需更强大的错误追踪，可集成 Sentry：

```bash
npm install @sentry/nextjs
```

配置参考：[docs/MONITORING.md](./docs/MONITORING.md)
