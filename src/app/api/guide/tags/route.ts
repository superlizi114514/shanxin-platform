import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - 获取所有标签
export async function GET() {
  try {
    const tags = await prisma.guideTag.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Error fetching guide tags:", error);
    return NextResponse.json(
      { error: "获取标签失败" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - 创建新标签（仅管理员）
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
    const { name, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: "标签名称是必需的" },
        { status: 400 }
      );
    }

    const tag = await prisma.guideTag.create({
      data: {
        name,
        color: color || null,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Error creating guide tag:", error);
    return NextResponse.json(
      { error: "创建标签失败" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
