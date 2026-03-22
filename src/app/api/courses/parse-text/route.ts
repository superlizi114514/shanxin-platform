import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseScheduleText } from "@/lib/schedule-parser";
import { findOrCreateClassroom } from "@/lib/pdf-parser";
import { prisma } from "@/../prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const formData = await request.formData();
    const textData = formData.get("text") as string | null;

    if (!textData) {
      return NextResponse.json(
        { error: "请提供课程表文本数据" },
        { status: 400 }
      );
    }

    // 解析课程表
    const result = parseScheduleText(textData, userId);

    if (!result || result.courses.length === 0) {
      return NextResponse.json(
        { error: "未解析到有效的课程数据" },
        { status: 400 }
      );
    }

    // 批量导入课程
    const imported = await bulkImportCourses(result.courses);

    return NextResponse.json({
      success: true,
      count: imported.length,
      courses: imported,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error("课程表解析失败:", error);
    return NextResponse.json(
      { error: "解析失败：" + (error as Error).message },
      { status: 500 }
    );
  }
}

interface CourseInput {
  courseName: string;
  teacher?: string | null;
  classroom: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  period?: string | null;
  weekStart: number;
  weekEnd: number;
  weekPattern?: string | null;
  notes?: string | null;
  userId: string;
}

async function bulkImportCourses(courses: CourseInput[]) {
  const imported = [];

  for (const course of courses) {
    let classroomId: string | undefined;

    if (course.classroom) {
      const location = await findOrCreateClassroom(course.classroom);
      classroomId = location?.id;
    }

    const created = await prisma.course.create({
      data: {
        userId: course.userId,
        courseName: course.courseName,
        teacher: course.teacher,
        classroom: course.classroom,
        classroomId: classroomId || null,
        dayOfWeek: course.dayOfWeek,
        startTime: course.startTime,
        endTime: course.endTime,
        period: course.period,
        weekStart: course.weekStart,
        weekEnd: course.weekEnd,
        weekPattern: course.weekPattern,
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
