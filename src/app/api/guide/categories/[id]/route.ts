import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - 获取单个分类详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.guideCategory.findUnique({
      where: { id },
      include: {
        articles: {
          where: { published: true },
          orderBy: { publishedAt: "desc" },
          select: {
            id: true,
            title: true,
            summary: true,
            coverImage: true,
            author: true,
            views: true,
            publishedAt: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "分类不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching guide category:", error);
    return NextResponse.json(
      { error: "获取分类失败" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - 更新分类（仅管理员）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    const category = await prisma.guideCategory.update({
      where: { id },
      data: {
        name: body.name,
        icon: body.icon,
        order: body.order,
        description: body.description,
        color: body.color,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating guide category:", error);
    return NextResponse.json(
      { error: "更新分类失败" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - 删除分类（仅管理员）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    await prisma.guideCategory.delete({
      where: { id },
    });

    return NextResponse.json({ message: "分类已删除" });
  } catch (error) {
    console.error("Error deleting guide category:", error);
    return NextResponse.json(
      { error: "删除分类失败" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
