import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/../prisma";

/**
 * 更新课程提醒设置
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const userId = session.user.id as string;
    if (!userId) {
      return NextResponse.json({ error: "用户 ID 不存在" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reminderEnabled, reminderMinutes } = body;

    // 验证课程属于当前用户
    const existingCourse = await prisma.course.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "课程不存在" }, { status: 404 });
    }

    // 更新提醒设置
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        reminderEnabled: reminderEnabled ?? existingCourse.reminderEnabled,
        reminderMinutes: reminderMinutes ?? existingCourse.reminderMinutes,
      },
    });

    return NextResponse.json({
      success: true,
      course: updatedCourse,
    });
  } catch (error) {
    console.error("更新课程提醒失败:", error);
    return NextResponse.json(
      { error: "更新课程提醒失败" },
      { status: 500 }
    );
  }
}
