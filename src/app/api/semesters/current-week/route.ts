import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/../prisma";

/**
 * 获取当前周次信息
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

    if (!currentSemester) {
      return NextResponse.json(
        { error: "未设置当前学期", week: 1 },
        { status: 404 }
      );
    }

    const today = new Date();
    const startDate = new Date(currentSemester.startDate);

    // 计算周次差
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const currentWeek = Math.floor(diffDays / 7) + 1;

    // 计算学期总天数
    let endDate = currentSemester.endDate;
    if (!endDate) {
      // 如果没有结束日期，使用总周数计算
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (currentSemester.totalWeeks * 7));
    }

    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);

    return NextResponse.json({
      success: true,
      semester: {
        id: currentSemester.id,
        name: currentSemester.name,
        startDate: currentSemester.startDate,
        endDate: currentSemester.endDate,
        totalWeeks: currentSemester.totalWeeks,
      },
      current: {
        week: currentWeek,
        date: today.toISOString().split("T")[0],
      },
      isWithinSemester: currentWeek >= 1 && currentWeek <= totalWeeks,
    });
  } catch (error) {
    console.error("获取周次信息失败:", error);
    return NextResponse.json(
      { error: "获取周次信息失败" },
      { status: 500 }
    );
  }
}
