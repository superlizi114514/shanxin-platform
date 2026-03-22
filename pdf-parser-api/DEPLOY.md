# 部署到 Hugging Face Spaces

## 步骤

### 1. 创建 Hugging Face 账号
访问 https://huggingface.co/join 注册账号（免费）

### 2. 创建新的 Space
1. 访问 https://huggingface.co/new-space
2. 填写：
   - **Owner**: 你的用户名
   - **Space name**: `schedule-pdf-parser`
   - **License**: MIT
   - **SDK**: Docker
   - **Visibility**: Public（免费）

3. 点击 "Create Space"

### 3. 上传代码

创建仓库后，上传 `pdf-parser-api` 目录下的所有文件：
```bash
cd pdf-parser-api

# 初始化 git
git init
git add .

# 关联 HF 仓库（替换为你的用户名和仓库名）
git remote add origin https://huggingface.co/spaces/<你的用户名>/schedule-pdf-parser

# 提交并推送
git commit -m "Initial commit"
git push -u origin main
```

### 4. 等待部署
Hugging Face 会自动构建 Docker 镜像并部署，大约 2-5 分钟。

部署成功后，你会得到 API 地址：
```
https://<你的用户名>-schedule-pdf-parser.hf.space
```

### 5. 配置 CORS（可选）
如果要从 Vercel 前端调用，编辑 `app.py` 中的 `allow_origins`：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://你的 Vercel 域名.vercel.app"],
    # ...
)
```

## 费用

- **完全免费** - Hugging Face Spaces 提供免费额度
- 如需私有部署或更高性能，可升级到 Pro ($9/月)

## API 使用示例

### 使用 fetch (前端)
```javascript
const formData = new FormData();
formData.append('file', pdfFile);

const response = await fetch('https://你的用户名-schedule-pdf-parser.hf.space/parse', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(result.courses);
```

### 使用 curl (测试)
```bash
curl -X POST \
  -F "file=@课表.pdf" \
  https://你的用户名-schedule-pdf-parser.hf.space/parse
```

## 对接到现有项目

修改 `src/app/api/courses/import/route.ts`，将 Python 本地调用改为 HTTP 请求：

```typescript
// 替换 exec 调用为 fetch
const response = await fetch(process.env.PDF_PARSER_API_URL + '/parse', {
  method: 'POST',
  body: formData,
});
```

详细对接代码见 `VERCEL_INTEGRATION.md`
