import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/../prisma";
import Workbook from "exceljs";
import { findOrCreateClassroom } from "@/lib/pdf-parser";
import { parseDayOfWeek, parsePeriod, parseWeekRange } from "@/lib/course-parsing";

const PDF_PARSER_API_URL = process.env.PDF_PARSER_API_URL || 'https://superlizi-sxhh.hf.space';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
const DEBUG = process.env.NODE_ENV === 'development';

const ExcelWorkbook = Workbook.Workbook;

/**
 * 验证 PDF 文件签名（magic bytes）
 * 防止客户端类型欺骗（client-side type spoofing）
 */
function isValidPdfFile(file: File, buffer: ArrayBuffer): boolean {
  // 验证文件扩展名
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.pdf') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
    return false;
  }

  // 验证 PDF magic bytes (%PDF)
  if (fileName.endsWith('.pdf')) {
    const header = new Uint8Array(buffer).slice(0, 5);
    return header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 &&
           header[3] === 0x46 && header[4] === 0x2D; // %PDF-
  }

  // Excel 文件检查（简单检查文件大小和类型）
  return true;
}

/**
 * 限制课程数据长度，防止恶意输入
 */
function sanitizeCourseInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 200) // Limit length
    .trim();
}

/**
 * 导入课表数据
 * 支持格式：
 * 1. Excel 文件（.xlsx）- 教务系统导出格式
 * 2. PDF 文件（.pdf）- 教务系统导出格式
 * 3. JSON 文本 - 直接粘贴课表数据
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const userId = session.user.id as string;
    if (!userId) {
      return NextResponse.json({ error: "用户 ID 不存在" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const courseData = formData.get("courseData") as string | null;

    let courses: CourseInput[] = [];

    // 解析 PDF 文件
    if (file && file.type === "application/pdf") {
      // 验证文件大小
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `文件过大，最大允许 ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        );
      }

      // 验证文件类型（包括 magic bytes 检查）
      const arrayBuffer = await file.arrayBuffer();
      if (!isValidPdfFile(file, arrayBuffer)) {
        return NextResponse.json(
          { error: "不支持的文件类型" },
          { status: 400 }
        );
      }

      // 再次验证大小（防御性编程）
      if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `文件过大，最大允许 ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        );
      }

      if (DEBUG) {
        console.log("开始调用云端 PDF 解析 API...");
      }

      // 调用云端 Hugging Face Spaces API
      const hfFormData = new FormData();
      hfFormData.append('file', file);

      const hfResponse = await fetch(`${PDF_PARSER_API_URL}/parse`, {
        method: 'POST',
        body: hfFormData,
      });

      if (!hfResponse.ok) {
        throw new Error(`云端 API 返回错误：${hfResponse.status}`);
      }

      const hfResult = await hfResponse.json();

      if (!hfResult.success || !hfResult.courses) {
        throw new Error(hfResult.error || '解析失败');
      }

      // 调试日志：输出 HF API 返回的课程数量
      console.log(`[IMPORT] HF API 返回课程数量：${hfResult.courses.length}`);
      if (hfResult.courses.length > 0) {
        console.log(`[IMPORT] 第一门课程数据:`, JSON.stringify(hfResult.courses[0]));
      }

      // 将 snake_case 转换为 camelCase 并添加 userId
      courses = hfResult.courses.map((course: Record<string, unknown>) => {
        // 处理 weekList：Python 的 None 转为 JSON null，需要转为 undefined
        let weekListValue: number[] | undefined = undefined;
        if (Array.isArray(course.weekList)) {
          weekListValue = course.weekList as number[];
        }

        return {
          courseName: String(course.course_name || ''),
          teacher: course.teacher && course.teacher !== '' ? String(course.teacher) : null,
          classroom: String(course.classroom || ''),
          dayOfWeek: Number(course.day_of_week || 1),
          startTime: String(course.start_time || ''),
          endTime: String(course.end_time || ''),
          period: String(course.period || ''),
          weekStart: Number(course.weekStart || 1),
          weekEnd: Number(course.weekEnd || 16),
          weekPattern: course.weekPattern ? String(course.weekPattern) : null,
          weekList: weekListValue,
          notes: null,
          color: null,
          userId,
        };
      });

      console.log(`[IMPORT] 转换后课程数量：${courses.length}`);
      if (DEBUG && courses.length > 0) {
        console.log(`[IMPORT] 转换后第一门课程:`, JSON.stringify(courses[0]));
      }
    }
    // 解析 Excel 文件
    else if (file) {
      // 验证文件类型和大小
      if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
        return NextResponse.json(
          { error: "不支持的文件类型，仅支持 .xlsx 或 .xls 文件" },
          { status: 400 }
        );
      }
      courses = await parseExcelFile(file, userId);
    }
    // 解析 JSON/文本数据
    else if (courseData) {
      // 限制文本数据大小
      if (courseData.length > 100000) {
        return NextResponse.json(
          { error: "数据过大，最大允许 100KB" },
          { status: 400 }
        );
      }
      courses = await parseCourseData(courseData, userId);
    } else {
      return NextResponse.json(
        { error: "请上传 Excel/PDF 文件或输入课表数据" },
        { status: 400 }
      );
    }

    if (courses.length === 0) {
      return NextResponse.json(
        { error: "未解析到有效的课程数据" },
        { status: 400 }
      );
    }

    // 批量导入课程
    const imported = await bulkImportCourses(courses);

    // 解析 weekList 字段（从 JSON 字符串转为数组）后返回给前端
    const parsedCourses = imported.map(course => ({
      ...course,
      weekList: course.weekList ? JSON.parse(course.weekList as string) : undefined,
    }));

    return NextResponse.json({
      success: true,
      count: imported.length,
      courses: parsedCourses,
    });
  } catch (error) {
    console.error("课表导入失败:", error);
    return NextResponse.json(
      { error: "导入失败：" + (error as Error).message },
      { status: 500 }
    );
  }
}

// 课程输入类型
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
  color?: string | null;
  notes?: string | null;
  userId: string;
}

/**
 * 解析 Excel 文件（山东信息职业技术学院教务系统导出格式）
 */
async function parseExcelFile(file: File, userId: string): Promise<CourseInput[]> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const workbook = new ExcelWorkbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(buffer as any);

  const courses: CourseInput[] = [];
  const worksheet = workbook.getWorksheet(1);

  if (!worksheet) {
    throw new Error("无法读取 Excel 文件");
  }

  // 遍历行（跳过表头）
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // 跳过表头

    const cells = row.values as Record<number, unknown>;

    // 尝试解析不同格式
    const courseName = cells[1]?.toString() || "";
    if (!courseName || courseName.trim() === "") return;

    const teacher = cells[2]?.toString() || "";
    const classroom = cells[3]?.toString() || "";
    const dayText = cells[4]?.toString() || "";
    const periodText = cells[5]?.toString() || "";
    const weekText = cells[6]?.toString() || "";
    const notes = cells[7]?.toString() || "";

    // 解析星期
    const dayOfWeek = parseDayOfWeek(dayText);
    if (!dayOfWeek) return;

    // 解析节次
    const { startTime, endTime, period } = parsePeriod(periodText);

    // 解析周次
    const { weekStart, weekEnd, weekPattern, weekList } = parseWeekRange(weekText);

    courses.push({
      courseName: courseName.trim(),
      teacher: teacher.trim() || null,
      classroom: classroom.trim() || "",
      dayOfWeek,
      startTime,
      endTime,
      period: period || null,
      weekStart,
      weekEnd,
      weekPattern: weekPattern || null,
      weekList,
      notes: notes.trim() || null,
      userId,
    });
  });

  return courses;
}

/**
 * 解析 JSON/文本格式课表数据
 */
async function parseCourseData(data: string, userId: string): Promise<CourseInput[]> {
  try {
    // 尝试解析 JSON
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed.map((course) => ({
        courseName: sanitizeCourseInput(course.courseName || ''),
        teacher: course.teacher ? sanitizeCourseInput(course.teacher) : null,
        classroom: course.classroom ? sanitizeCourseInput(course.classroom) : '',
        dayOfWeek: course.dayOfWeek,
        startTime: course.startTime || '',
        endTime: course.endTime || '',
        period: course.period || null,
        weekStart: course.weekStart || 1,
        weekEnd: course.weekEnd || 16,
        weekPattern: course.weekPattern || null,
        notes: course.notes ? sanitizeCourseInput(course.notes) : null,
        color: course.color || null,
        userId,
      }));
    }
  } catch {
    // 尝试解析表格文本格式
    const lines = data.trim().split("\n");
    const courses: CourseInput[] = [];

    for (const line of lines) {
      const cells = line.split(/[\t,|]/).map((c) => c.trim());
      if (cells.length < 5) continue;

      const courseName = cells[0];
      if (!courseName) continue;

      const dayOfWeek = parseDayOfWeek(cells[3] || "");
      if (!dayOfWeek) continue;

      const { startTime, endTime, period } = parsePeriod(cells[4] || "");
      const { weekStart, weekEnd, weekPattern } = parseWeekRange(cells[5] || "");

      courses.push({
        courseName: sanitizeCourseInput(courseName),
        teacher: cells[1] ? sanitizeCourseInput(cells[1]) : null,
        classroom: cells[2] ? sanitizeCourseInput(cells[2]) : '',
        dayOfWeek,
        startTime,
        endTime,
        period: period || null,
        weekStart,
        weekEnd,
        weekPattern: weekPattern || null,
        notes: cells[6] ? sanitizeCourseInput(cells[6]) : null,
        userId,
      });
    }

    return courses;
  }

  return [];
}

/**
 * 批量导入课程到数据库
 */
async function bulkImportCourses(courses: CourseInput[]) {
  const imported = [];

  for (const course of courses) {
    // 查找或创建教室位置
    let classroomId: string | null = null;

    if (course.classroom) {
      try {
        const location = await findOrCreateClassroom(course.classroom);
        classroomId = location?.id || null;
      } catch (error) {
        console.error(`创建教室失败 (${course.classroom}):`, error);
        // 教室创建失败时，继续创建课程但不关联教室
        classroomId = null;
      }
    }

    // 创建课程
    const created = await prisma.course.create({
      data: {
        userId: course.userId,
        courseName: course.courseName,
        teacher: course.teacher,
        classroom: course.classroom,
        classroomId: classroomId,
        dayOfWeek: course.dayOfWeek,
        startTime: course.startTime,
        endTime: course.endTime,
        period: course.period,
        weekStart: course.weekStart,
        weekEnd: course.weekEnd,
        weekPattern: course.weekPattern,
        weekList: course.weekList ? JSON.stringify(course.weekList) : null,
        notes: course.notes,
      },
      include: {
        location: true,
      },
    });

    imported.push(created);
  }

  return imported;
}
