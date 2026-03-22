import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/../prisma";

/**
 * 获取当前用户的课表
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const userId = session.user.id as string;
    if (!userId) {
      return NextResponse.json({ error: "用户 ID 不存在" }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
      where: { userId },
      include: {
        location: true,
      },
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" },
      ],
    });

    // 解析 weekList 字段（从 JSON 字符串转为数组）
    const parsedCourses = courses.map(course => ({
      ...course,
      weekList: course.weekList ? JSON.parse(course.weekList) : undefined,
    }));

    return NextResponse.json({
      success: true,
      courses: parsedCourses,
    });
  } catch (error) {
    console.error("获取课表失败:", error);
    return NextResponse.json(
      { error: "获取课表失败" },
      { status: 500 }
    );
  }
}

/**
 * 清空用户课表
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const userId = session.user.id as string;
    if (!userId) {
      return NextResponse.json({ error: "用户 ID 不存在" }, { status: 401 });
    }

    // 删除所有课程
    await prisma.course.deleteMany({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      message: "已清空课表",
    });
  } catch (error) {
    console.error("清空课表失败:", error);
    return NextResponse.json(
      { error: "清空课表失败" },
      { status: 500 }
    );
  }
}
