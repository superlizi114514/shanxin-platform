import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../prisma/index";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - 获取新闻详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const news = await prisma.news.findUnique({
      where: { id },
      include: {
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
            replies: {
              include: {
                user: {
                  select: { id: true, name: true, avatar: true },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!news) {
      return NextResponse.json(
        { error: "News not found" },
        { status: 404 }
      );
    }

    // 增加浏览量
    await prisma.news.update({
      where: { id },
      data: { views: news.views + 1 },
    });

    // 获取相关新闻（同分类的最新 3 篇）
    const relatedNews = await prisma.news.findMany({
      where: {
        category: news.category,
        id: { not: id },
        published: true,
      },
      take: 3,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        summary: true,
        coverImage: true,
        category: true,
        views: true,
        publishedAt: true,
      },
    });

    return NextResponse.json({ ...news, relatedNews });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - 更新新闻
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 检查是否为管理员
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required to update news" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content, summary, coverImage, category, author, source, published } = body;

    const existingNews = await prisma.news.findUnique({
      where: { id },
    });

    if (!existingNews) {
      return NextResponse.json(
        { error: "News not found" },
        { status: 404 }
      );
    }

    const updateData: {
      title?: string;
      content?: string;
      summary?: string | null;
      coverImage?: string | null;
      category?: string;
      author?: string | null;
      source?: string | null;
      published?: boolean;
      publishedAt?: Date | null;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (summary !== undefined) updateData.summary = summary;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (category !== undefined) updateData.category = category;
    if (author !== undefined) updateData.author = author;
    if (source !== undefined) updateData.source = source;
    if (published !== undefined) {
      updateData.published = published;
      if (published && !existingNews.published) {
        updateData.publishedAt = new Date();
      }
    }

    const news = await prisma.news.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(news);
  } catch (error) {
    console.error("Error updating news:", error);
    return NextResponse.json(
      { error: "Failed to update news" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - 删除新闻
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 检查是否为管理员
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required to delete news" },
        { status: 403 }
      );
    }

    const { id } = await params;

    await prisma.news.delete({
      where: { id },
    });

    return NextResponse.json({ message: "News deleted successfully" });
  } catch (error) {
    console.error("Error deleting news:", error);
    return NextResponse.json(
      { error: "Failed to delete news" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
