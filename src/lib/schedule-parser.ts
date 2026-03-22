/**
 * 课表 PDF 解析器
 * 支持多种格式的课表 PDF 文件解析
 */

import { CourseInput } from "@prisma/client";

export interface ParseResult {
  courses: CourseInput[];
  metadata: {
    semester?: string;
    studentName?: string;
    studentId?: string;
  };
}

/**
 * 清理教室信息，提取有效部分
 */
function cleanClassroom(raw: string): string {
  return raw
    .replace(
      /(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间 | 培养中心 | 考试认证 | 与)/g,
      ""
    )
    .trim();
}

/**
 * 标准格式解析器 - 适用于标准课表 PDF 文本
 */
export function parseStandardSchedule(
  text: string,
  userId: string
): ParseResult {
  const courses: CourseInput[] = [];

  // 提取元数据
  const headerMatch = text.match(
    /(\d{4}-\d{4} 学年第 [12] 学期)\s*(.+?) 课表.*？学号：(\d+)/s
  );
  const metadata = {
    semester: headerMatch?.[1],
    studentName: headerMatch?.[2]?.trim(),
    studentId: headerMatch?.[3],
  };

  // 课程行格式：课程名☆ (X-Y 节)Z 周/教室/教师
  const courseRegex =
    /([^\n(]+)\s*\((\d+)-(\d+)\s*节\)\s*([\d,\-周 () 双单/]+?)\/([^/\n]+?)\/([^/\n]+?)\//g;

  let match;
  while ((match = courseRegex.exec(text)) !== null) {
    const courseName = match[1].trim();
    const startPeriod = parseInt(match[2]);
    const endPeriod = parseInt(match[3]);
    const weekText = match[4];
    const classroomRaw = match[5];
    const teacherRaw = match[6];

    // 跳过无效数据
    if (!courseName || courseName.length < 2) continue;

    const classroom = cleanClassroom(classroomRaw);
    const teacher = teacherRaw.trim();

    // 解析周次
    const weeks = new Set<number>();
    const weekRangePattern = /(\d+)(?:-(\d+))?/g;
    let weekMatch;

    while ((weekMatch = weekRangePattern.exec(weekText)) !== null) {
      const start = parseInt(weekMatch[1]);
      const end = weekMatch[2] ? parseInt(weekMatch[2]) : start;
      for (let w = start; w <= end; w++) {
        weeks.add(w);
      }
    }

    const weekList = Array.from(weeks);
    const weekStart = weekList.length > 0 ? Math.min(...weekList) : 1;
    const weekEnd = weekList.length > 0 ? Math.max(...weekList) : 16;
    const weekPattern = weekText.includes("(双)")
      ? "even"
      : weekText.includes("(单)")
      ? "odd"
      : null;

    // 星期几解析（简化处理，默认星期一）
    let dayOfWeek = 1;
    const dayMap: Record<string, number> = {
      星期一：1,
      星期二：2,
      星期三：3,
      星期四：4,
      星期五：5,
      星期六：6,
      星期日：7,
    };

    for (const [dayText, dayNum] of Object.entries(dayMap)) {
      if (text.includes(dayText)) {
        dayOfWeek = dayNum;
        break;
      }
    }

    courses.push({
      courseName,
      teacher: teacher || null,
      classroom: classroom || "",
      dayOfWeek,
      startTime: `${startPeriod}`,
      endTime: `${endPeriod}`,
      period: `${startPeriod}-${endPeriod}节`,
      weekStart,
      weekEnd,
      weekPattern,
      notes: null,
      userId,
    });
  }

  return { courses, metadata };
}

/**
 * 山信模板解析器 - 基于块的解析
 */
export function parseShanxinSchedule(text: string, userId: string): ParseResult {
  const courses: CourseInput[] = [];

  // 提取元数据
  const headerMatch = text.match(
    /(\d{4}-\d{4} 学年第 [12] 学期)\s*(.+?) 课表 [\s\S]*?学号：(\d+)/
  );
  const metadata = {
    semester: headerMatch?.[1],
    studentName: headerMatch?.[2]?.trim(),
    studentId: headerMatch?.[3],
  };

  // 按课程块解析：课程名☆\n(节次) 周次/教室/教师/...
  // 使用更宽松的正则
  const courseBlockRegex =
    /([^\n(]+) ☆\s*\n\((\d+)-(\d+) 节\)([\d,\-周 () 双单/]+?)\/([^/\n]+?)\/([^/\n]+?)\//g;

  let match;
  while ((match = courseBlockRegex.exec(text)) !== null) {
    const courseName = match[1].trim();
    const startPeriod = parseInt(match[2]);
    const endPeriod = parseInt(match[3]);
    const weekText = match[4];
    const classroomRaw = match[5];
    const teacherRaw = match[6];

    // 清理教室和教师
    const classroom = cleanClassroom(classroomRaw);
    const teacher = teacherRaw.trim();

    // 跳过无效数据
    if (!courseName || courseName.length < 2) continue;

    // 解析周次
    const weeks = new Set<number>();
    const weekRangePattern = /(\d+)(?:-(\d+))?/g;
    let weekMatch;

    while ((weekMatch = weekRangePattern.exec(weekText)) !== null) {
      const start = parseInt(weekMatch[1]);
      const end = weekMatch[2] ? parseInt(weekMatch[2]) : start;
      for (let w = start; w <= end; w++) {
        weeks.add(w);
      }
    }

    const weekList = Array.from(weeks);
    const weekStart = weekList.length > 0 ? Math.min(...weekList) : 1;
    const weekEnd = weekList.length > 0 ? Math.max(...weekList) : 16;
    const weekPattern = weekText.includes("(双)")
      ? "even"
      : weekText.includes("(单)")
      ? "odd"
      : null;

    // 星期几解析
    let dayOfWeek = 1;
    const dayMap: Record<string, number> = {
      星期一：1,
      星期二：2,
      星期三：3,
      星期四：4,
      星期五：5,
      星期六：6,
      星期日：7,
    };

    for (const [dayText, dayNum] of Object.entries(dayMap)) {
      if (text.includes(dayText)) {
        dayOfWeek = dayNum;
        break;
      }
    }

    courses.push({
      courseName,
      teacher: teacher || null,
      classroom: classroom || "",
      dayOfWeek,
      startTime: `${startPeriod}`,
      endTime: `${endPeriod}`,
      period: `${startPeriod}-${endPeriod}节`,
      weekStart,
      weekEnd,
      weekPattern,
      notes: null,
      userId,
    });
  }

  return { courses, metadata };
}

/**
 * 主解析函数 - 自动识别格式并调用相应解析器
 */
export function parseScheduleText(
  text: string,
  userId: string
): ParseResult | null {
  // 尝试山信模板
  if (text.includes("☆")) {
    const result = parseShanxinSchedule(text, userId);
    if (result.courses.length > 0) {
      return result;
    }
  }

  // 尝试标准格式
  const result = parseStandardSchedule(text, userId);
  if (result.courses.length > 0) {
    return result;
  }

  return null;
}
