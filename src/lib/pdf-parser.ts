// PDF 解析器 - 使用 Python pdfplumber 提取文本
import { prisma } from "@/../prisma/index";
import { parsePeriod, parseWeekRange } from './course-parsing';
import { exec } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { parseFormat5 } from './pdf-parser-format5';

/**
 * Unicode 字符常量 - 用于 PDF 解析
 * \u8282 = '节' (课程节次标记)
 * \u2606 = '☆' (课程名称标记)
 */
const UNICODE = {
  JIE: '\u8282', // 节
  STAR: '\u2606', // ☆
} as const;

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

/**
 * 使用 Python pdfplumber 提取 PDF 文本（表格提取方式）
 */
async function extractScheduleTableWithPython(pdfPath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'extract-schedule-table.py');
    const command = `python "${pythonScript}" "${pdfPath}"`;

    exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Python 执行失败：${error.message}`));
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (e) {
        reject(new Error(`JSON 解析失败：${stdout.substring(0, 500)}`));
      }
    });
  });
}

/**
 * 使用 Python pdfplumber 提取 PDF 文本
 */
async function extractPdfTextWithPython(pdfPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'extract-pdf-json.py');
    const command = `python "${pythonScript}" "${pdfPath}"`;

    exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Python 执行失败：${error.message}`));
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());
        if (result.success) {
          resolve(result.text);
        } else {
          reject(new Error(result.error || 'PDF 提取失败'));
        }
      } catch (e) {
        reject(new Error(`JSON 解析失败：${stdout.substring(0, 500)}`));
      }
    });
  });
}

/**
 * 解析 PDF 课程表
 */
export async function parseSchedulePDF(file: File, userId: string, buffer?: ArrayBuffer): Promise<CourseInput[]> {
  const arrayBuffer = buffer || await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  // 保存 PDF 到临时文件
  const tempPath = path.join(process.cwd(), `temp-${Date.now()}.pdf`);

  try {
    await writeFile(tempPath, Buffer.from(data));
    console.log('PDF 文件已保存:', tempPath);

    // 首先尝试使用表格提取方式（更准确）
    console.log('开始使用 Python 表格提取 PDF 课程...');
    const tableResult = await extractScheduleTableWithPython(tempPath);

    if (tableResult.success && tableResult.courses && tableResult.courses.length > 0) {
      console.log('表格提取成功，课程数:', tableResult.courses.length);
      return convertTableCoursesToInput(tableResult.courses, userId);
    }

    // 表格提取失败，回退到文本提取方式
    console.log('表格提取未找到课程，尝试文本提取方式...');
    const pdfText = await extractPdfTextWithPython(tempPath);
    console.log('PDF 文本提取成功，长度:', pdfText.length);

    if (!pdfText || pdfText.trim().length === 0) {
      throw new Error('PDF 文件为空或无效。');
    }

    console.log('PDF 文本预览 (前 500 字符):', pdfText.substring(0, 500));

    return parseCourseText(pdfText, userId);
  } catch (error) {
    console.error('PDF parsing failed:', error);
    throw new Error('无法解析 PDF 文件：' + (error as Error).message);
  } finally {
    // 清理临时文件
    try {
      await unlink(tempPath);
      console.log('临时文件已清理:', tempPath);
    } catch (e) {
      console.warn('清理临时文件失败:', e);
    }
  }
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
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '');
  return sanitized.substring(0, 200).trim();
}

/**
 * 解析课程表文本数据 - 支持多种格式
 */
function parseCourseText(text: string, userId: string): CourseInput[] {
  const minValidLength = 50;
  if (!text || text.trim().length < minValidLength) {
    throw new Error('PDF 文件未包含有效的课程数据，请确保上传的是教务系统导出的课表 PDF（非图像型）');
  }

  const dayMap: Record<string, number> = {
    '星期一': 1, '周一': 1,
    '星期二': 2, '周二': 2,
    '星期三': 3, '周三': 3,
    '星期四': 4, '周四': 4,
    '星期五': 5, '周五': 5,
    '星期六': 6, '周六': 6,
    '星期日': 7, '周日': 7
  };

  const lines = text.split(/\r?\n/).filter(l => l.trim());
  const DEBUG = process.env.NODE_ENV === 'development';

  if (DEBUG) {
    console.log('解析的行数:', lines.length);
  }

  // 尝试格式 1：|课程名☆| 格式
  const format1Result = parseFormat1(lines, dayMap, userId);
  if (format1Result.length > 0) {
    if (DEBUG) {
      console.log('使用格式 1 解析到', format1Result.length, '条课程');
    }
    return format1Result;
  }

  // 尝试格式 2：表格格式
  const format2Result = parseFormat2(lines, dayMap, userId);
  if (format2Result.length > 0) {
    if (DEBUG) {
      console.log('使用格式 2 解析到', format2Result.length, '条课程');
    }
    return format2Result;
  }

  // 尝试格式 3：文本格式
  const format3Result = parseFormat3(lines, dayMap, userId);
  if (format3Result.length > 0) {
    if (DEBUG) {
      console.log('使用格式 3 解析到', format3Result.length, '条课程');
    }
    return format3Result;
  }

  // 尝试格式 4：山信教务系统格式（☆标记 + /分隔）
  const format4Result = parseFormat4(text, dayMap, userId);
  if (format4Result.length > 0) {
    if (DEBUG) {
      console.log('使用格式 4（山信教务）解析到', format4Result.length, '条课程');
    }
    return format4Result;
  }

  // 尝试格式 5：山东信息职业技术学院横向表格格式
  const format5Result = parseFormat5(text, dayMap, userId);
  if (format5Result.length > 0) {
    if (DEBUG) {
      console.log('使用格式 5（横向表格）解析到', format5Result.length, '条课程');
    }
    return format5Result;
  }

  throw new Error('无法识别的课程表格式，请确保上传的是教务系统导出的标准课表 PDF');
}

/**
 * 格式 1：|课程名☆|(X-Y 节)... /教室/教师/ 格式
 */
function parseFormat1(lines: string[], dayMap: Record<string, number>, userId: string): CourseInput[] {
  const courses: CourseInput[] = [];
  let currentDay = 0;

  for (const line of lines) {
    for (const [dayText, dayNum] of Object.entries(dayMap)) {
      if (line.includes(dayText)) {
        currentDay = dayNum;
        break;
      }
    }

    if (currentDay === 0) continue;
    if (!line.includes(UNICODE.JIE)) continue;

    const segments = line.split('|').map(s => s.trim()).filter(s => s);

    for (let j = 0; j < segments.length; j++) {
      const segment = segments[j];
      if (!segment.includes(UNICODE.STAR)) continue;

      let courseName = sanitizeCourseText(segment.replace(UNICODE.STAR, '').trim());
      if (!courseName || courseName.length > 100) continue;

      let fullInfo = '';
      for (let k = j; k < Math.min(j + 10, segments.length); k++) {
        fullInfo += sanitizeCourseText(segments[k]) + ' ';
      }

      const periodMatch = fullInfo.match(new RegExp(`\\((\\d+)-(\\d+)${UNICODE.JIE}\\)`));
      if (!periodMatch || periodMatch.index === undefined) continue;

      const startPeriod = parseInt(periodMatch[1]);
      const endPeriod = parseInt(periodMatch[2]);

      const afterPeriod = fullInfo.substring(periodMatch.index + periodMatch[0].length);
      const weekMatch = afterPeriod.match(/^([\d, 周双单 ()-]+)/);
      const weekText = weekMatch ? sanitizeCourseText(weekMatch[1]) : '';

      const remaining = afterPeriod.substring(weekMatch?.[0].length ?? 0);
      const parts = remaining.split('/').filter(p => p.trim());

      let classroom = sanitizeCourseText(parts[0] || '');
      classroom = classroom.replace(/(?:教室 | 合堂 | 公共 | 中心 | 网络空间安全培养中心 | 微机室 | 篮球场 | 操场 | 室)/g, '').trim();
      const roomMatch = classroom.match(/^[A-Za-z]*\d+/);
      if (roomMatch) {
        classroom = roomMatch[0];
      } else {
        classroom = classroom.split(/\s/)[0] || classroom;
      }

      let teacher = parts[1] ? sanitizeCourseText(parts[1]) : '';
      if (teacher.includes('-')) {
        teacher = teacher.split('-')[0].trim();
      }

      const { weekStart, weekEnd } = parseWeekRange(weekText);
      const { startTime, endTime, period } = parsePeriod(`${startPeriod}-${endPeriod}节`);

      courses.push({
        courseName,
        teacher: teacher || null,
        classroom: classroom || '',
        dayOfWeek: currentDay,
        startTime,
        endTime,
        period: period || null,
        weekStart,
        weekEnd,
        weekPattern: null,
        notes: null,
        userId,
      });
    }
  }

  return courses;
}

/**
 * 格式 2：表格格式 - 课程名 | 教师 | 教室 | 星期 | 节次 | 周次
 */
function parseFormat2(lines: string[], dayMap: Record<string, number>, userId: string): CourseInput[] {
  const courses: CourseInput[] = [];

  for (const line of lines) {
    if (!line.includes(UNICODE.JIE) && !line.includes('周')) continue;

    const parts = line.split(/[|\t]/).map(p => p.trim()).filter(p => p);
    if (parts.length < 4) continue;

    let courseName = '';
    let teacher = '';
    let classroom = '';
    let dayText = '';
    let periodText = '';
    let weekText = '';

    for (const part of parts) {
      if (dayMap[part] || part.match(/^周 [一二三四五六日]$/)) {
        dayText = part;
      } else if (part.match(/\d+[-~]\d+\s*节/) || part.match(/\d+\s*节/)) {
        periodText = part;
      } else if (part.match(/\d+[-~]\d+\s*周/) || part.match(/^\d+\s*周$/)) {
        weekText = part;
      } else if (part.match(/^[A-Za-z]?\d{3,}$/)) {
        classroom = part;
      } else if (!courseName) {
        courseName = sanitizeCourseText(part);
      } else if (!teacher) {
        teacher = sanitizeCourseText(part);
      }
    }

    if (!courseName || !periodText) continue;

    const dayOfWeek = dayMap[dayText] || parseDayOfWeekFallback(dayText);
    if (!dayOfWeek) continue;

    const { startTime, endTime, period } = parsePeriod(periodText);
    const { weekStart, weekEnd } = parseWeekRange(weekText);

    courses.push({
      courseName,
      teacher: teacher || null,
      classroom: classroom || '',
      dayOfWeek,
      startTime,
      endTime,
      period: period || null,
      weekStart,
      weekEnd,
      weekPattern: null,
      notes: null,
      userId,
    });
  }

  return courses;
}

/**
 * 格式 3：文本格式 - 课程名 (X-Y 节) Z 周 教室 教师
 */
function parseFormat3(lines: string[], dayMap: Record<string, number>, userId: string): CourseInput[] {
  const courses: CourseInput[] = [];
  let currentDay = 0;

  for (const line of lines) {
    for (const [dayText, dayNum] of Object.entries(dayMap)) {
      if (line.includes(dayText)) {
        currentDay = dayNum;
        break;
      }
    }

    if (currentDay === 0) continue;

    const courseMatch = line.match(/(.+?)\s*\((\d+)[-~](\d+)\s*节\)/);
    if (!courseMatch) continue;

    let courseName = sanitizeCourseText(courseMatch[1].trim());
    if (!courseName || courseName.length > 100) continue;

    const startPeriod = parseInt(courseMatch[2]);
    const endPeriod = parseInt(courseMatch[3]);

    const afterCourse = line.substring(courseMatch[0].length);

    const weekMatch = afterCourse.match(/(\d+)[-~](\d+)\s*周/);
    const weekText = weekMatch && weekMatch.index !== undefined
      ? afterCourse.substring(weekMatch.index, weekMatch.index + weekMatch[0].length)
      : '';
    const { weekStart, weekEnd } = parseWeekRange(weekText);

    const remaining = weekMatch && weekMatch.index !== undefined
      ? afterCourse.substring(weekMatch.index + weekMatch[0].length)
      : afterCourse;
    const parts = remaining.split(/[\s,]+/).filter(p => p.trim());

    let classroom = '';
    let teacher = '';

    for (const part of parts) {
      const cleanPart = sanitizeCourseText(part);
      if (!cleanPart) continue;

      if (!classroom && cleanPart.match(/^[A-Za-z]?\d{3,}$/)) {
        classroom = cleanPart.replace(/(?:教室 | 合堂 | 室)/g, '');
      } else if (!teacher && cleanPart.length >= 2 && cleanPart.length <= 6) {
        teacher = cleanPart;
      }
    }

    const { startTime, endTime, period } = parsePeriod(`${startPeriod}-${endPeriod}节`);

    courses.push({
      courseName,
      teacher: teacher || null,
      classroom: classroom || '',
      dayOfWeek: currentDay,
      startTime,
      endTime,
      period: period || null,
      weekStart,
      weekEnd,
      weekPattern: null,
      notes: null,
      userId,
    });
  }

  return courses;
}

/**
 * 格式 4：山信教务系统格式（☆标记 + /分隔）
 * 格式：课程名☆\n(节次) 周次/教室/教师/...
 */
function parseFormat4(text: string, dayMap: Record<string, number>, userId: string): CourseInput[] {
  const courses: CourseInput[] = [];

  // 解析节次到时间的映射
  const periodTimeMap: Record<number, { start: string; end: string }> = {
    1: { start: '08:00', end: '08:45' },
    2: { start: '08:55', end: '09:40' },
    3: { start: '10:00', end: '10:45' },
    4: { start: '10:55', end: '11:40' },
    5: { start: '14:00', end: '14:45' },
    6: { start: '14:55', end: '15:40' },
    7: { start: '16:00', end: '16:45' },
    8: { start: '16:55', end: '17:40' },
    9: { start: '18:30', end: '19:15' },
    10: { start: '19:25', end: '20:10' },
  };

  const lines = text.split(/\r?\n/);
  let currentDay = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测星期
    for (const [dayText, dayNum] of Object.entries(dayMap)) {
      if (line.includes(dayText)) {
        currentDay = dayNum;
        break;
      }
    }

    // 检测课程（带☆）
    if (line.includes(UNICODE.STAR) && currentDay > 0) {
      const courseName = line.replace(UNICODE.STAR, '').trim().replace(/^[0-9\s]+/, ''); // 去掉节次编号
      if (!courseName || courseName.length < 2) continue;

      // 下一行应该是课程详情
      const nextLine = lines[i + 1];
      if (nextLine && nextLine.startsWith('(')) {
        // 解析详情：(1-2 节) 周次/教室/教师/...
        const detailMatch = nextLine.match(/\((\d+)-(\d+) 节\)([^/]+)\/([^/]+)\/([^/]+)/);
        if (detailMatch) {
          const startPeriod = parseInt(detailMatch[1]);
          const endPeriod = parseInt(detailMatch[2]);
          const weekText = detailMatch[3];
          const classroomRaw = detailMatch[4];
          const teacherRaw = detailMatch[5];

          // 清理教室
          const classroom = classroomRaw.replace(/(?:教室 | 合堂教室 | 公共微机室 | 网络空间安全培养中心与考试认证中心)/g, '').trim();
          const teacher = teacherRaw.trim();

          // 解析周次
          const weeks = new Set<number>();
          const rangeRegex = /(\d+)-(\d+) 周/g;
          let weekMatch;
          while ((weekMatch = rangeRegex.exec(weekText)) !== null) {
            const start = parseInt(weekMatch[1]);
            const end = parseInt(weekMatch[2]);
            for (let j = start; j <= end; j++) weeks.add(j);
          }

          const weekPattern = weekText.includes('(单)') ? 'odd' : weekText.includes('(双)') ? 'even' : null;
          const weekList = Array.from(weeks);
          const weekStart = weekList.length > 0 ? Math.min(...weekList) : 1;
          const weekEnd = weekList.length > 0 ? Math.max(...weekList) : 16;

          const startTime = periodTimeMap[startPeriod]?.start || '';
          const endTime = periodTimeMap[endPeriod]?.end || '';

          courses.push({
            courseName,
            teacher: teacher || null,
            classroom,
            dayOfWeek: currentDay,
            startTime,
            endTime,
            period: `${startPeriod}-${endPeriod}节`,
            weekStart,
            weekEnd,
            weekPattern,
            notes: null,
            userId,
          });
        }
      }
    }
  }

  return courses;
}

function parseDayOfWeekFallback(text: string): number | null {
  const match = text.match(/周 ([一二三四五六日])/);
  if (match) {
    const map: Record<string, number> = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7 };
    return map[match[1]];
  }
  return null;
}

/**
 * 查找或创建教室位置
 */
export async function findOrCreateClassroom(classroomName: string) {
  if (!classroomName) return null;

  // 清理教室名称
  const cleanName = classroomName.replace(/教室 | 合堂 | 公共 | 中心 | 篮球场 | 操场/g, '').trim();

  // 尝试提取房间号和楼栋
  const parts = cleanName.match(/([A-Za-z]*)(\d+)/);
  const roomNumber = parts ? parts[2] : cleanName;

  // 先尝试查找匹配的教室
  let location = await prisma.classroomLocation.findFirst({
    where: {
      OR: [
        { roomNumber: roomNumber },
        { roomName: classroomName },
      ],
    },
  });

  if (location) {
    return location;
  }

  // 没有找到，创建新教室
  const building = parts?.[1] || '教学楼';
  const floor = roomNumber && /^\d+$/.test(roomNumber) ? parseInt(roomNumber.charAt(0)) || 1 : 1;

  try {
    location = await prisma.classroomLocation.create({
      data: {
        building: building,
        floor,
        roomNumber,
        roomName: classroomName,
        type: 'classroom',
      },
    });
    return location;
  } catch (error) {
    // 如果创建失败（可能是并发创建导致），再次尝试查找
    console.error(`创建教室失败 (${classroomName}):`, error);
    location = await prisma.classroomLocation.findFirst({
      where: {
        roomName: classroomName,
      },
    });
    return location;
  }
}

/**
 * Python 表格提取的课程接口
 */
interface PythonCourse {
  course_name: string;
  teacher: string;
  classroom: string;
  day_of_week: number;
  start_period: string;
  end_period: string;
  period: string;
  week_range: string;
}

/**
 * 将 Python 表格提取的课程转换为输入格式
 */
function convertTableCoursesToInput(courses: PythonCourse[], userId: string): CourseInput[] {
  return courses.map(course => {
    const { weekStart, weekEnd, weekPattern, weekList } = parseWeekRange(course.week_range);
    const { startTime, endTime } = parsePeriod(course.period);

    return {
      courseName: sanitizeCourseText(course.course_name),
      teacher: sanitizeCourseText(course.teacher) || null,
      classroom: sanitizeCourseText(course.classroom) || '',
      dayOfWeek: course.day_of_week,
      startTime,
      endTime,
      period: course.period,
      weekStart,
      weekEnd,
      weekPattern,
      weekList,
      notes: null,
      userId,
    };
  });
}
