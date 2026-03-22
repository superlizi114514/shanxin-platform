import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/../prisma";

/**
 * 获取当前学期信息
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 获取当前学期
    const currentSemester = await prisma.semester.findFirst({
      where: { isCurrent: true },
    });

    // 获取所有学期
    const semesters = await prisma.semester.findMany({
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({
      success: true,
      current: currentSemester,
      all: semesters,
    });
  } catch (error) {
    console.error("获取学期信息失败:", error);
    return NextResponse.json(
      { error: "获取学期信息失败" },
      { status: 500 }
    );
  }
}

/**
 * 设置当前学期
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 只有管理员可以设置学期
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    const body = await request.json();
    const { name, startDate, endDate, totalWeeks } = body;

    // 验证必填字段
    if (!name || !startDate) {
      return NextResponse.json(
        { error: "学期名称和开始日期为必填项" },
        { status: 400 }
      );
    }

    // 检查是否已有当前学期
    const existingCurrent = await prisma.semester.findFirst({
      where: { isCurrent: true },
    });

    // 如果已有当前学期，先取消它的当前状态
    if (existingCurrent) {
      await prisma.semester.update({
        where: { id: existingCurrent.id },
        data: { isCurrent: false },
      });
    }

    // 创建新学期并设为当前
    const semester = await prisma.semester.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        totalWeeks: totalWeeks || 20,
        isCurrent: true,
      },
    });

    return NextResponse.json({
      success: true,
      semester,
      message: "学期设置成功",
    });
  } catch (error) {
    console.error("设置学期失败:", error);
    return NextResponse.json(
      { error: "设置学期失败" },
      { status: 500 }
    );
  }
}

/**
 * 更新学期信息
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 只有管理员可以更新学期
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, startDate, endDate, totalWeeks, isCurrent } = body;

    if (!id) {
      return NextResponse.json(
        { error: "学期 ID 为必填项" },
        { status: 400 }
      );
    }

    // 如果设置为当前学期，先取消其他学期的当前状态
    if (isCurrent) {
      await prisma.semester.updateMany({
        where: { isCurrent: true, id: { not: id } },
        data: { isCurrent: false },
      });
    }

    const semester = await prisma.semester.update({
      where: { id },
      data: {
        name,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        totalWeeks,
        isCurrent,
      },
    });

    return NextResponse.json({
      success: true,
      semester,
    });
  } catch (error) {
    console.error("更新学期失败:", error);
    return NextResponse.json(
      { error: "更新学期失败" },
      { status: 500 }
    );
  }
}

/**
 * 删除学期
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 只有管理员可以删除学期
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "学期 ID 为必填项" },
        { status: 400 }
      );
    }

    await prisma.semester.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "学期删除成功",
    });
  } catch (error) {
    console.error("删除学期失败:", error);
    return NextResponse.json(
      { error: "删除学期失败" },
      { status: 500 }
    );
  }
}
