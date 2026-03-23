# 高德地图 (AMap) 配置指南

## 问题说明

如果校园地图页面无法显示地图，通常是因为没有配置高德地图 API Key 和安全密钥。

## 获取 API Key 和安全密钥

### 步骤 1: 注册高德开放平台

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 点击"注册"，使用手机号或邮箱注册账号
3. 完成实名认证（需要手机号验证）

### 步骤 2: 创建应用

1. 登录高德开放平台
2. 进入 [控制台](https://console.amap.com/)
3. 点击左侧菜单 "应用管理" > "我的应用"
4. 点击 "创建新应用"
5. 填写应用信息：
   - **应用名称**: 山信二手平台（或任意名称）
   - **应用类型**: 其他
6. 点击 "确定"

### 步骤 3: 添加 Key

1. 在创建的应用下，点击 "添加 Key"
2. 填写 Key 信息：
   - **Key 名称**: Web 端 JS API（或任意名称）
   - **服务平台**: Web 端 (JS API)
   - **白名单**:
     - 本地开发：`localhost`
     - 生产环境：`sxhh.online` 和 `*.vercel.app`
3. 点击 "确定"

### 步骤 4: 获取 Security Code

1. 在应用详情页，找到 "安全密钥" 或 "Security Code"
2. 点击 "显示" 或 "复制"
3. 保存 Security Code（重要：只在创建时显示一次）

## 配置本地开发环境

1. 打开项目根目录的 `.env.local` 文件
2. 添加以下配置：

```env
NEXT_PUBLIC_AMAP_KEY="你的 API Key"
NEXT_PUBLIC_AMAP_SECURITY_CODE="你的安全密钥"
```

3. 重启开发服务器：

```bash
npm run dev
```

## 配置 Vercel 生产环境

### 方法一：通过 Vercel Dashboard（推荐）

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目
3. 点击左侧菜单 "Settings" > "Environment Variables"
4. 点击 "Add New" 添加以下环境变量：

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_AMAP_KEY` | 你的 API Key | Production, Preview, Development |
| `NEXT_PUBLIC_AMAP_SECURITY_CODE` | 你的安全密钥 | Production, Preview, Development |

5. 点击 "Save" 保存
6. 重新部署项目：进入 "Deployments" > 点击最新部署的 "..." > "Redeploy"

### 方法二：通过 Vercel CLI

```bash
# 登录 Vercel
vercel login

# 进入项目目录
cd shanxin-platform

# 添加环境变量
vercel env add NEXT_PUBLIC_AMAP_KEY
vercel env add NEXT_PUBLIC_AMAP_SECURITY_CODE

# 部署时选择所有环境（Production, Preview, Development）
```

### 方法三：更新 vercel.json（不推荐用于生产密钥）

> 注意：不要将真实的 API Key 提交到 Git 仓库

```json
{
  "env": {
    "NEXT_PUBLIC_AMAP_KEY": "你的 API Key",
    "NEXT_PUBLIC_AMAP_SECURITY_CODE": "你的安全密钥"
  }
}
```

## 验证配置

1. 访问 [校园地图页面](https://sxhh.online/map)
2. 检查地图是否正常显示
3. 打开浏览器开发者工具 (F12)
4. 查看控制台是否有错误信息

### 常见错误

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `AMap API 加载失败` | API Key 未配置 | 检查环境变量是否正确配置 |
| `invalid userkey` | API Key 错误 | 检查 API Key 是否正确复制 |
| `security code error` | 安全密钥错误 | 检查 Security Code 是否正确 |
| `refer deny` | 白名单限制 | 在应用设置中添加域名到白名单 |

## 安全建议

1. **不要将真实 API Key 提交到 Git**
   - 使用 `.env.example` 作为模板
   - 确保 `.env.local` 和 `.env.production` 在 `.gitignore` 中

2. **设置合理的白名单**
   - 本地开发：`localhost`
   - 生产环境：`sxhh.online`, `*.vercel.app`

3. **定期检查用量**
   - 在 [高德控制台](https://console.amap.com/) 查看 API 调用量
   - 个人认证用户有每日配额限制

## 配额说明

高德地图个人认证用户配额：
- QPS（每秒请求数）：2
- 日配额：5000 次

企业认证用户配额：
- QPS（每秒请求数）：50
- 日配额：100 万次

## 故障排查

### 地图仍然无法显示

1. **检查环境变量是否生效**

在浏览器控制台运行：
```javascript
console.log('AMAP_KEY:', process.env.NEXT_PUBLIC_AMAP_KEY)
```

2. **清除浏览器缓存**
   - Ctrl + Shift + Delete (Windows)
   - Cmd + Shift + Delete (Mac)

3. **重新部署**
   - 在 Vercel Dashboard 中触发重新部署

4. **检查网络请求**
   - 打开开发者工具 (F12)
   - 查看 Network 标签
   - 查找是否有来自 `webapi.amap.com` 的错误

## 联系支持

如果问题仍未解决，请联系：
- 微信：SiNianNiQWQ
- 邮箱：support@sxhh.online
