import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../prisma/index";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const campus = searchParams.get("campus"); // kuwen, binhai, 或全部

    const whereClause = campus && campus !== "all"
      ? { campus }
      : {};

    // 获取所有校园建筑
    const buildings = await prisma.campusBuilding.findMany({
      where: whereClause,
      orderBy: [{ campus: "asc" }, { order: "asc" }],
      include: {
        classrooms: {
          orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
        },
      },
    });

    return NextResponse.json({ buildings });
  } catch (error) {
    console.error("获取校园建筑失败:", error);
    return NextResponse.json(
      { error: "获取校园建筑失败" },
      { status: 500 }
    );
  }
}
