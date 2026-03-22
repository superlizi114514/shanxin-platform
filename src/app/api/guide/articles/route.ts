import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, type Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - 获取文章列表（支持筛选、搜索、分页）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const published = searchParams.get("published") === "true";

    const skip = (page - 1) * limit;

    const where: Prisma.GuideArticleWhereInput = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (published) {
      where.published = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.guideArticle.findMany({
        where,
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
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.guideArticle.count({ where }),
    ]);

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching guide articles:", error);
    return NextResponse.json(
      { error: "获取文章列表失败" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - 创建新文章（仅管理员）
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
    const {
      categoryId,
      title,
      content,
      summary,
      coverImage,
      author,
      published,
      tagIds,
    } = body;

    if (!categoryId || !title || !content) {
      return NextResponse.json(
        { error: "分类 ID、标题和内容是必需的" },
        { status: 400 }
      );
    }

    const article = await prisma.guideArticle.create({
      data: {
        categoryId,
        title,
        content,
        summary: summary || null,
        coverImage: coverImage || null,
        author: author || null,
        published: published || false,
        publishedAt: published ? new Date() : null,
        tags: tagIds && tagIds.length > 0
          ? {
              create: tagIds.map((tagId: string) => ({
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

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error("Error creating guide article:", error);
    return NextResponse.json(
      { error: "创建文章失败" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
