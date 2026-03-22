import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - 获取单个标签
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tag = await prisma.guideTag.findUnique({
      where: { id },
      include: {
        articles: {
          include: {
            article: {
              select: {
                id: true,
                title: true,
                published: true,
              },
            },
          },
        },
      },
    });

    if (!tag) {
      return NextResponse.json(
        { error: "标签不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Error fetching guide tag:", error);
    return NextResponse.json(
      { error: "获取标签失败" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - 更新标签（仅管理员）
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

    const tag = await prisma.guideTag.update({
      where: { id },
      data: {
        name: body.name,
        color: body.color,
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Error updating guide tag:", error);
    return NextResponse.json(
      { error: "更新标签失败" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - 删除标签（仅管理员）
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

    await prisma.guideTag.delete({
      where: { id },
    });

    return NextResponse.json({ message: "标签已删除" });
  } catch (error) {
    console.error("Error deleting guide tag:", error);
    return NextResponse.json(
      { error: "删除标签失败" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
