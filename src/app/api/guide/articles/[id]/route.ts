import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - 获取单篇文章详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const article = await prisma.guideArticle.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
        tags: {
          include: {
            tag: {
              select: { id: true, name: true, color: true },
            },
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: "文章不存在" },
        { status: 404 }
      );
    }

    // 增加浏览量
    await prisma.guideArticle.update({
      where: { id },
      data: { views: article.views + 1 },
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error("Error fetching guide article:", error);
    return NextResponse.json(
      { error: "获取文章失败" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - 更新文章（仅管理员）
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

    const article = await prisma.guideArticle.update({
      where: { id },
      data: {
        title: body.title,
        content: body.content,
        summary: body.summary,
        coverImage: body.coverImage,
        author: body.author,
        published: body.published,
        publishedAt: body.published ? new Date() : null,
        categoryId: body.categoryId,
        tags: body.tagIds
          ? {
              deleteMany: {},
              create: body.tagIds.map((tagId: string) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error("Error updating guide article:", error);
    return NextResponse.json(
      { error: "更新文章失败" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - 删除文章（仅管理员）
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

    await prisma.guideArticle.delete({
      where: { id },
    });

    return NextResponse.json({ message: "文章已删除" });
  } catch (error) {
    console.error("Error deleting guide article:", error);
    return NextResponse.json(
      { error: "删除文章失败" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
