import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - 获取所有信息大全分类
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.guideCategory.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching guide categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch guide categories" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - 创建新的信息大全分类（仅管理员）
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 检查是否为管理员
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const body = await request.json();
    const { name, icon, order, description, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: "分类名称是必需的" },
        { status: 400 }
      );
    }

    const category = await prisma.guideCategory.create({
      data: {
        name,
        icon: icon || null,
        order: order || 0,
        description: description || null,
        color: color || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating guide category:", error);
    return NextResponse.json(
      { error: "Failed to create guide category" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
