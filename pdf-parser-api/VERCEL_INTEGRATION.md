# Vercel 前端对接指南

## 修改 `src/lib/pdf-parser.ts`

将本地 Python 调用改为远程 API 调用：

```typescript
// PDF 解析器 - 使用远程 API 提取文本
import { prisma } from "@/../prisma/index";
import { parsePeriod, parseWeekRange } from './course-parsing';
import { parseFormat5 } from './pdf-parser-format5';

const PDF_PARSER_API_URL = process.env.PDF_PARSER_API_URL || 'http://localhost:7860';

interface CourseInput {
  courseName: string;
  teacher?: string | null;
  classroom: string;
  classroomId?: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  period?: string | null;
  weekStart: number;
  weekEnd: number;
  weekPattern?: string | null;
  weekList?: number[];
  notes?: string | null;
  userId: string;
}

interface PythonCourse {
  course_name: string;
  teacher: string;
  classroom: string;
  day_of_week: number;
  start_period: string;
  end_period: string;
  period: string;
  week_range: string;
  start_time: string;
  end_time: string;
  weekStart: number;
  weekEnd: number;
  weekPattern: string | null;
  weekList: number[] | null;
}

/**
 * 使用远程 API 解析 PDF 课程表
 */
export async function parseSchedulePDF(
  file: File,
  userId: string,
  buffer?: ArrayBuffer
): Promise<CourseInput[]> {
  const arrayBuffer = buffer || await file.arrayBuffer();

  try {
    // 构建 FormData 发送到 API
    const formData = new FormData();
    formData.append('file', new Blob([arrayBuffer], { type: 'application/pdf' }), 'schedule.pdf');

    // 调用远程 API
    const response = await fetch(`${PDF_PARSER_API_URL}/parse`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `API 返回错误：${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '解析失败');
    }

    console.log('PDF 解析成功，课程数:', result.count);

    // 转换为输入格式
    return convertTableCoursesToInput(result.courses, userId);

  } catch (error) {
    console.error('PDF parsing failed:', error);

    // 回退到本地文本解析（如果 API 不可用）
    // 或者抛出错误
    throw new Error('无法解析 PDF 文件：' + (error as Error).message);
  }
}

/**
 * 将 Python API 返回的课程转换为输入格式
 */
function convertTableCoursesToInput(courses: PythonCourse[], userId: string): CourseInput[] {
  return courses.map(course => {
    const { startTime, endTime } = parsePeriod(course.period);

    return {
      courseName: sanitizeCourseText(course.course_name),
      teacher: sanitizeCourseText(course.teacher) || null,
      classroom: sanitizeCourseText(course.classroom) || '',
      dayOfWeek: course.day_of_week,
      startTime: course.start_time || startTime,
      endTime: course.end_time || endTime,
      period: course.period,
      weekStart: course.weekStart,
      weekEnd: course.weekEnd,
      weekPattern: course.weekPattern,
      weekList: course.weekList,
      notes: null,
      userId,
    };
  });
}

/**
 * 清理课程数据，防止 XSS 和 SQL 注入
 */
function sanitizeCourseText(text: string): string {
  if (!text) return '';
  let sanitized = text
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .substring(0, 200)
    .trim();
  return sanitized;
}

// 导出其他需要的函数...
export async function findOrCreateClassroom(classroomName: string) {
  // ... 保持原有实现
}
```

## 配置环境变量

在 Vercel 项目中添加环境变量：

1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. Settings → Environment Variables
4. 添加：
   - **Key**: `PDF_PARSER_API_URL`
   - **Value**: `https://你的用户名-schedule-pdf-parser.hf.space`
   - **Environments**: 勾选 Production 和 Preview

## 本地开发

创建 `.env.local` 文件：

```
PDF_PARSER_API_URL=http://localhost:7860
```

或者如果你想使用远程 API：

```
PDF_PARSER_API_URL=https://你的用户名 -schedule-pdf-parser.hf.space
```

## 完整测试流程

1. **部署 Python API 到 Hugging Face**
2. **在 Vercel 配置环境变量**
3. **推送代码到 Vercel**
4. 测试上传 PDF 课表

## 故障排查

### API 调用失败
检查 Vercel Functions 日志：
```
https://vercel.com/你的项目/deployments/xxx/functions
```

### CORS 错误
确保 `app.py` 中配置了正确的域名：
```python
allow_origins=["https://你的项目.vercel.app"]
```

### 超时问题
Hugging Face 免费版可能有响应延迟，考虑：
- 升级 HF Space 到 Pro ($9/月)
- 或者迁移到 Railway/Render
