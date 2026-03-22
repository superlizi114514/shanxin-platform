---
title: 课程表 PDF 解析 API
emoji: 📚
colorFrom: blue
colorTo: gray
sdk: docker
pinned: false
license: mit
---

# 课程表 PDF 解析 API

基于 pdfplumber 的课程表解析服务。

## API 端点

### POST /parse

解析课程表 PDF 文件。

**请求:**
- `file`: PDF 文件（multipart/form-data）

**响应:**
```json
{
  "success": true,
  "count": 5,
  "courses": [
    {
      "course_name": "高等数学",
      "teacher": "张三",
      "classroom": "A101",
      "day_of_week": 1,
      "start_period": "1",
      "end_period": "2",
      "period": "1-2 节",
      "start_time": "08:00",
      "end_time": "09:40",
      "week_range": "1-16 周",
      "weekStart": 1,
      "weekEnd": 16,
      "weekPattern": null,
      "weekList": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]
    }
  ]
}
```

## 部署

点击上面的 "Deploy" 按钮即可部署到这个 Space。

## 本地测试

```bash
pip install -r requirements.txt
python app.py
```

然后访问 http://localhost:7860
