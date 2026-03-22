# 部署 PDF 解析服务 - 最终方案

## 方案选择

Vercel 不支持 Python，pdfjs-dist 无法解析中文 PDF。
**唯一可行方案：Python 服务部署到外部，Vercel 前端调用 API。**

## 推荐平台：Railway

- ✅ GitHub 账号直接登录
- ✅ 自动构建部署
- ✅ 免费额度够用（$5/月抵扣）
- ✅ 不休眠、无冷启动

## 部署步骤

### 1. 访问 Railway
https://railway.app/

### 2. 登录
点击 **Login** → **Sign in with GitHub**

### 3. 新建项目
1. **New Project**
2. **Deploy from GitHub repo**
3. 授权 Railway 访问你的 GitHub
4. 选择 `shanxin-platform` 仓库
5. 部署 `pdf-parser-api` 目录

### 4. 配置环境变量
在 Railway 面板的 **Variables** 添加：
```
PORT=7860
```

### 5. 等待部署
2-3 分钟后生成 URL：
```
https://xxx-production.up.railway.app
```

### 6. 测试 API
访问 `https://xxx-production.up.railway.app/`
看到 `{"status":"ok","service":"课程表 PDF 解析 API"}` 即成功

### 7. 配置 Vercel
在 Vercel 项目设置添加环境变量：
- `PDF_PARSER_API_URL` = `https://xxx-production.up.railway.app`

---

## 文件说明

`pdf-parser-api/` 目录已包含所有必需文件：
- `app.py` - FastAPI 服务（已更新支持 PORT 环境变量）
- `requirements.txt` - Python 依赖
- `Dockerfile` - Railway 自动构建用
- `railway.json` - Railway 配置

**无需修改，直接部署即可。**
