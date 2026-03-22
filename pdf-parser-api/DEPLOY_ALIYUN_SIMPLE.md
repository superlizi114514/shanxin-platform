# 阿里云函数计算部署指南

## 第一步：开通服务

1. 访问 https://fcnext.console.aliyun.com/
2. 用支付宝扫码登录
3. 点击"开通函数计算"（免费，不扣钱）

---

## 第二步：获取 AccessKey

1. 访问 https://ram.console.aliyun.com/
2. 左侧菜单：**身份管理** → **用户**
3. 点击 **创建用户**
4. 填写用户名（如：fc-deploy）
5. 访问方式：勾选 **编程访问**
6. 点击确定
7. **复制 AccessKey ID 和 AccessKey Secret**（只显示一次，保存好！）

---

## 第三步：安装部署工具

```bash
# 安装 Serverless Devs
npm install -g @serverless-devs/s

# 验证安装
s -v
```

---

## 第四步：配置阿里云账号

```bash
s config add
```

按提示输入：
```
Alias Name: aliyun
Access Key ID: [粘贴你的 LTAI...]
Access Key Secret: [粘贴你的 secret]
```

---

## 第五步：部署

### 方法 A：使用 Docker 镜像部署（推荐，简单）

```bash
cd pdf-parser-api

# 1. 登录阿里云容器镜像服务（用阿里云账号密码）
docker login registry.cn-hangzhou.cr.aliyuncs.com

# 2. 创建命名空间（浏览器访问）
# 访问 https://cr.console.aliyun.com/
# 左侧：命名空间 → 创建命名空间（如：你的拼音）

# 3. 构建镜像
docker build -t registry.cn-hangzhou.cr.aliyuncs.com/<你的命名空间>/pdf-parser:latest .

# 4. 推送镜像
docker push registry.cn-hangzhou.cr.aliyuncs.com/<你的命名空间>/pdf-parser:latest
```

### 然后创建函数（控制台操作）

1. 访问 https://fcnext.console.aliyun.com/
2. 左侧：**服务及函数** → **创建服务**
3. 服务名称：`pdf-parser`
4. 点击 **创建函数**
5. 选择 **使用镜像创建**
6. 选择你刚才推送的镜像
7. 函数配置：
   - 运行环境：Custom Container
   - 内存：512MB
   - 超时：30 秒
8. 触发器配置：
   - 触发器类型：HTTP 触发器
   - 认证方式：免认证（anonymous）
9. 点击 **创建**

---

## 第六步：获取函数 URL

创建成功后，在函数详情页可以看到：

```
https://<service-id>.<region>.fc.aliyuncs.com/2023-03-30/functions/<function-id>/invoke
```

复制这个 URL！

---

## 第七步：配置 Vercel

在 Vercel 项目设置中添加环境变量：

1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. Settings → Environment Variables
4. 添加：
   - **Key**: `PDF_PARSER_API_URL`
   - **Value**: [上面复制的函数 URL]
   - **Environments**: 勾选 Production 和 Preview

---

## 第八步：修改前端代码

修改 `src/lib/pdf-parser.ts`（见 VERCEL_INTEGRATION.md）

---

## 费用检查

部署完成后，访问：
https://usercenter2.aliyun.com/bill/summary

免费额度：
- ✅ 100 万 CU 秒/月
- ✅ 100 万次调用/月
- ✅ 100GB 流量/月

---

## 常见问题

### Q: Docker 登录失败？
A: 阿里云容器镜像密码不是登录密码，在 容器镜像服务控制台 → 访问凭证 获取

### Q: 函数调用失败？
A: 检查触发器认证方式是否为"免认证"

### Q: CORS 错误？
A: 代码已配置允许所有域名，如需要限制请修改 index.py 中的 header

---

## 测试 API

```bash
curl -X POST \
  -F "file=@你的课表.pdf" \
  "https://你的函数 URL/invoke"
```
