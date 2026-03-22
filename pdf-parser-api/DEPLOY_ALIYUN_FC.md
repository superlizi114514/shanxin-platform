# 部署到阿里云函数计算 FC

阿里云函数计算有免费额度，足够 PDF 解析使用。

## 免费额度

- 每月 100 万 CU 秒（计算单元）
- 每月 100 万次调用
- 对于 PDF 解析场景，基本够用

## 部署步骤

### 1. 开通阿里云函数计算

1. 访问 https://fcnext.console.aliyun.com/
2. 用支付宝扫码登录（不需要信用卡）
3. 开通函数计算服务（免费）

### 2. 安装部署工具

```bash
# 安装 Node.js 和 npm
npm install -g @serverless-devs/s
```

### 3. 配置阿里云账号

```bash
s config add
```

按提示输入：
- **Alias Name**: `aliyun`
- **Access Key ID**: 从阿里云控制台获取
- **Access Key Secret**: 从阿里云控制台获取

获取 AK 的方法：
1. 访问 https://ram.console.aliyun.com/
2. 用户管理 → 创建用户
3. 勾选"编程访问"
4. 复制 AccessKey ID 和 Secret

### 4. 创建函数

```bash
cd pdf-parser-api

# 初始化项目
s init fc-nodejs18 -p ./fc-app

# 或者手动创建 s.yaml
```

### 5. 创建 s.yaml 配置文件

```yaml
edition: 1.0.0
name: pdf-parser-fc
access: "aliyun"

vars:
  region: cn-hangzhou
  service:
    name: pdf-parser-service
    description: "PDF 课程表解析服务"

services:
  pdf-parser:
    component: fc
    props:
      region: ${vars.region}
      service: ${vars.service.name}
      function:
        name: pdf-parser-function
        description: "解析课程表 PDF"
        runtime: custom-container
        codeUri: ./
        customContainerConfig:
          image: registry.cn-hangzhou.cr.aliyuncs.com/${your-namespace}/pdf-parser:latest
        memorySize: 512
        timeout: 30
      triggers:
        - name: httpTrigger
          type: http
          config:
            authType: anonymous
            methods:
              - POST
              - GET
```

### 6. 构建 Docker 镜像并推送

```bash
# 登录阿里云容器镜像服务
docker login --username=<你的阿里云账号> registry.cn-hangzhou.cr.aliyuncs.com

# 构建镜像
docker build -t registry.cn-hangzhou.cr.aliyuncs.com/<你的 namespace>/pdf-parser:latest .

# 推送镜像
docker push registry.cn-hangzhou.cr.aliyuncs.com/<你的 namespace>/pdf-parser:latest
```

### 7. 部署函数

```bash
s deploy
```

部署成功后，会返回函数 URL：
```
https://<service-id>.<region>.fc.aliyuncs.com
```

---

## 更简单的方法：直接部署 Web 函数

阿里云 FC 支持直接部署 Web 应用，不需要 Docker：

### 创建 app.py 的 HTTP 触发器版本

```python
# index.py
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import io
import pdfplumber
import re

# ... (保留之前的解析逻辑)

class SimpleHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        # 解析 PDF
        courses = extract_courses_from_pdf(post_data)

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": True,
            "courses": courses
        }).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 9000), SimpleHandler)
    server.serve_forever()
```

### requirements.txt

```
pdfplumber==0.10.3
pillow==10.1.0
```

### 部署命令

```bash
# 使用 fun 工具部署
npm install -g @alicloud/fun

fun install
fun deploy
```

---

## 对接 Vercel

部署成功后，在 Vercel 添加环境变量：

```
PDF_PARSER_API_URL=https://你的函数 URL.fc.aliyuncs.com
```

---

## 费用估算

| 项目 | 免费额度 | 你的用量 | 费用 |
|------|---------|---------|------|
| 调用次数 | 100 万/月 | ~100 次/月 | ¥0 |
| 计算资源 | 100 万 CU 秒 | ~500 CU 秒/月 | ¥0 |
| 流量 | 100GB/月 | ~10MB/月 | ¥0 |

**总计：¥0/月** ✅
