# 部署 PDF 解析服务到 Railway

## 前提条件

- 有 GitHub 账号
- 已安装 Docker（可选，用于本地测试）

## 步骤

### 1. 登录 Railway

访问 https://railway.app/
点击 **Login** → **Sign in with GitHub**

### 2. 创建新项目

1. 点击 **New Project**
2. 选择 **Deploy from GitHub repo**
3. 连接你的 GitHub 账号
4. 选择 `shanxin-platform` 仓库
5. 选择 `pdf-parser-api` 目录

### 3. 配置 Railway

在 Railway 面板中配置：

**Variables（环境变量）:**
```
PORT=7860
```

**Root Directory:**
```
pdf-parser-api
```

### 4. 等待部署

大约 2-3 分钟，部署成功后会生成一个 URL：
```
https://你的项目.up.railway.app
```

### 5. 测试 API

访问：
```
https://你的项目.up.railway.app/
```

应该看到：
```json
{"status":"ok","service":"课程表 PDF 解析 API","version":"1.0.0"}
```

### 6. 配置 Vercel

修改主项目的 `.env.local`：
```
PDF_PARSER_API_URL=https://你的项目.up.railway.app
```

在 Vercel 项目设置中添加环境变量：
- `PDF_PARSER_API_URL` = `https://你的项目.up.railway.app`

### 7. 更新前端 API 调用

确保前端调用使用正确的 URL。

---

## 本地测试

```bash
cd pdf-parser-api
docker-compose up --build
```

然后访问 http://localhost:7860

---

## 费用

- Railway 免费额度：$5/月 抵扣
- PDF 解析用量很小，基本够用
- 如需更多：$5/月 基础版
