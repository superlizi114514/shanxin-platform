# Vercel Postgres 数据库迁移完整指南

## 前提条件

- Vercel 账号已登录
- 域名 `sxhh.online` 已在 DNSPod 配置好 DNS 记录
- 已安装 Node.js 和 npm

---

## 步骤 1：在 Vercel 创建 Postgres 数据库

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 **山信二手平台**
3. 点击 **Storage** 标签页
4. 点击 **Add Database** → **New Vercel Postgres database**
5. 填写：
   - **Name**: `shanxin-platform-db`
   - **Region**: `hnd1` (日本东京 - 离山东最近)
6. 点击 **Create Database**

---

## 步骤 2：获取数据库连接字符串

1. 数据库创建后，点击 **Connect**
2. 选择 **Production** 环境
3. 点击 **Copy** 复制 `POSTGRES_URL`
4. 在 URL 末尾添加 `?pgbouncer=true`

最终格式类似：
```
postgres://username:password@xxx.vercel-pg.com:5432/dbname?pgbouncer=true
```

---

## 步骤 3：在 Vercel 配置环境变量

1. 进入项目 **Settings** → **Environment Variables**
2. 点击 **Add Environment Variable**
3. 添加以下变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `DATABASE_URL` | 步骤 2 的连接字符串（带 ?pgbouncer=true） | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://sxhh.online` | Production |
| `AUTH_SECRET` | 见下方生成方法 | Production |
| `NEXTAUTH_URL` | `https://sxhh.online` | Production |
| `RESEND_API_KEY` | `re_your-resend-api-key` (暂时占位) | Production |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_your-blob-token` (暂时占位) | Production |

### 生成 AUTH_SECRET

在本地终端运行：

**Windows PowerShell:**
```powershell
[System.Web.Security.Membership]::GeneratePassword(32, 8)
```

**macOS/Linux:**
```bash
openssl rand -base64 32
```

复制生成的随机字符串作为 AUTH_SECRET 的值。

---

## 步骤 4：本地运行数据库迁移

在本地终端执行以下命令：

```bash
# 1. 进入项目目录
cd "E:\项目总\山信二手平台\shanxin-platform"

# 2. 设置临时环境变量（PowerShell）
$env:DATABASE_URL="你的 Vercel Postgres 连接字符串"

# 3. 生成 Prisma Client
npx prisma generate

# 4. 运行数据库迁移
npx prisma migrate deploy
```

**注意**：连接字符串需要包含 `?pgbouncer=true` 后缀。

---

## 步骤 5：运行种子脚本（创建初始数据）

```bash
# 运行 seed 脚本（PowerShell，保持 DATABASE_URL 环境变量）
npx prisma db seed
```

这将创建：
- ✅ 学校：山东信息职业技术学院
- ✅ 管理员账号：`347012785@qq.com` / `lzlz58205820`
- ✅ 商家分类（美食餐饮、购物消费等）
- ✅ 信息大全分类
- ✅ 当前学期设置
- ✅ 奎文校区建筑数据
- ✅ 滨海校区建筑数据
- ✅ 教室位置数据

---

## 步骤 6：重新部署项目

1. 进入 Vercel Dashboard → 你的项目
2. 点击 **Deployments** 标签页
3. 找到最新部署，点击 **...** → **Redeploy**
4. 或者推送代码到 Git 触发自动部署

---

## 验证

### 1. 检查数据库连接

部署完成后，访问项目首页：https://sxhh.online

### 2. 测试管理员登录

1. 访问：https://sxhh.online/login
2. 输入：
   - 邮箱：`347012785@qq.com`
   - 密码：`lzlz58205820`
3. 成功登录后进入管理后台

### 3. 检查数据

访问以下页面验证数据：
- 商家页面：https://sxhh.online/merchants
- 信息大全：https://sxhh.online/guide
- 课表页面：https://sxhh.online/courses

---

## 故障排查

### 问题 1：`npx prisma migrate deploy` 失败

**错误**: Can't reach database server

**原因**: DATABASE_URL 未正确设置

**解决**:
```powershell
# 确认环境变量已设置
echo $env:DATABASE_URL

# 确保包含 ?pgbouncer=true
```

### 问题 2：Prisma Client 未更新

**错误**: Type mismatch

**解决**:
```bash
npx prisma generate
```

### 问题 3：Vercel 部署失败

**原因**: 环境变量未生效

**解决**:
1. 检查 Settings → Environment Variables
2. 确认所有变量都配置到 **Production** 环境
3. 点击 **Redeploy**

### 问题 4：DNS 验证失败

**解决**:
1. 在 DNSPod 确认 CNAME 记录已添加
2. 使用 `nslookup` 验证：
   ```bash
   nslookup -qt=CNAME www.sxhh.online
   ```
3. 等待 DNS 生效（5-30 分钟）

---

## 迁移完成检查清单

- [ ] Vercel Postgres 数据库已创建
- [ ] DATABASE_URL 已配置到 Vercel（带 ?pgbouncer=true）
- [ ] AUTH_SECRET 已生成并配置
- [ ] 其他环境变量已配置
- [ ] `npx prisma generate` 成功
- [ ] `npx prisma migrate deploy` 成功
- [ ] `npx prisma db seed` 成功
- [ ] 项目已重新部署
- [ ] 首页 https://sxhh.online 可访问
- [ ] 管理员可以登录
- [ ] 商家分类显示正常
- [ ] 信息大全显示正常

---

## 管理员账号信息

```
登录邮箱：347012785@qq.com
登录密码：lzlz58205820
```

⚠️ **重要**：首次登录后请尽快修改密码！

---

## 后续操作

1. **配置 Resend 邮件服务**（用于邮箱验证和密码重置）
   - 访问 https://resend.com
   - 注册账号并获取 API Key
   - 在 Vercel 更新 `RESEND_API_KEY` 环境变量

2. **配置 Vercel Blob 存储**（用于图片上传）
   - Vercel Dashboard → Storage → Add Blob
   - 复制 `BLOB_READ_WRITE_TOKEN`
   - 在 Vercel 更新环境变量

3. **配置 OAuth 登录**（可选）
   - Google OAuth
   - GitHub OAuth

---

## 参考文档

- [Vercel Postgres 官方文档](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma 迁移指南](https://www.prisma.io/docs/guides/database/production-database)
- [NextAuth.js 认证配置](https://next-auth.js.org/providers/)
