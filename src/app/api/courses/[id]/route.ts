import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/../prisma";

/**
 * 获取单个课程
 */
export async function GET(
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

    const course = await prisma.course.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        location: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: "课程不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, course });
  } catch (error) {
    console.error("获取课程失败:", error);
    return NextResponse.json(
      { error: "获取课程失败" },
      { status: 500 }
    );
  }
}

/**
 * 更新课程
 */
export async function PUT(
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

    // 验证课程属于当前用户
    const existing = await prisma.course.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "课程不存在" }, { status: 404 });
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        courseName: body.courseName ?? existing.courseName,
        teacher: body.teacher ?? existing.teacher,
        classroom: body.classroom ?? existing.classroom,
        dayOfWeek: body.dayOfWeek ?? existing.dayOfWeek,
        startTime: body.startTime ?? existing.startTime,
        endTime: body.endTime ?? existing.endTime,
        period: body.period ?? existing.period,
        weekStart: body.weekStart ?? existing.weekStart,
        weekEnd: body.weekEnd ?? existing.weekEnd,
        weekPattern: body.weekPattern ?? existing.weekPattern,
        notes: body.notes ?? existing.notes,
        color: body.color ?? existing.color,
      },
      include: {
        location: true,
      },
    });

    return NextResponse.json({ success: true, course: updated });
  } catch (error) {
    console.error("更新课程失败:", error);
    return NextResponse.json(
      { error: "更新课程失败" },
      { status: 500 }
    );
  }
}

/**
 * 删除课程
 */
export async function DELETE(
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

    // 验证课程属于当前用户
    const existing = await prisma.course.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "课程不存在" }, { status: 404 });
    }

    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "课程已删除" });
  } catch (error) {
    console.error("删除课程失败:", error);
    return NextResponse.json(
      { error: "删除课程失败" },
      { status: 500 }
    );
  }
}
