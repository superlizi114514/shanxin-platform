# PDF 解析 API 部署到 Vercel

## 📦 部署步骤

### 1. 确保已安装 Vercel CLI
```bash
npm i -g vercel
```

### 2. 登录 Vercel
```bash
vercel login
```

### 3. 部署
```bash
cd shanxin-platform
vercel --prod
```

## 🔗 API 端点

部署后，API 地址为：
```
https://你的域名.vercel.app/api/parse-pdf
```

## 📝 请求示例

```bash
curl -X POST https://你的域名.vercel.app/api/parse-pdf \
  -F "file=@课程表.pdf"
```

## ✅ 响应示例

```json
{
  "success": true,
  "count": 10,
  "courses": [
    {
      "course_name": "课程名",
      "teacher": "教师名",
      "classroom": "教室",
      "day_of_week": 1,
      "period": "1-2 节",
      "start_time": "08:00",
      "end_time": "08:45",
      "weekStart": 1,
      "weekEnd": 16
    }
  ]
}
```
