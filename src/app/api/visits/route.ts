import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - 获取用户的访问记录
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const targetType = searchParams.get("targetType"); // 按类型筛选：product, merchant, news, guide

    const skip = (page - 1) * limit;

    const where: { userId: string; targetType?: string } = {
      userId: session.user.id,
    };

    if (targetType) {
      where.targetType = targetType;
    }

    const visits = await prisma.visit.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.visit.count({
      where,
    });

    return NextResponse.json({
      visits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching visits:", error);
    return NextResponse.json(
      { error: "Failed to fetch visits" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - 记录访问
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetType, targetId } = body;

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: "Target type and target ID are required" },
        { status: 400 }
      );
    }

    const validTypes = ["product", "merchant", "news", "guide"];
    if (!validTypes.includes(targetType)) {
      return NextResponse.json(
        { error: "Invalid target type" },
        { status: 400 }
      );
    }

    // 检查是否已存在最近的访问记录（5 分钟内不重复记录）
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingVisit = await prisma.visit.findFirst({
      where: {
        userId: session.user.id,
        targetType,
        targetId,
        createdAt: {
          gte: fiveMinutesAgo,
        },
      },
    });

    if (existingVisit) {
      // 如果 5 分钟内已有访问记录，不重复创建
      return NextResponse.json({ message: "Visit already recorded recently" }, { status: 200 });
    }

    const visit = await prisma.visit.create({
      data: {
        userId: session.user.id,
        targetType,
        targetId,
      },
    });

    return NextResponse.json(visit, { status: 201 });
  } catch (error) {
    console.error("Error recording visit:", error);
    return NextResponse.json(
      { error: "Failed to record visit" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
