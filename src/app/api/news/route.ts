import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../prisma/index";
import { auth } from "@/lib/auth";

// GET - 获取新闻列表 (支持增强搜索)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const published = searchParams.get("published");
    const startDate = searchParams.get("startDate"); // 日期范围开始
    const endDate = searchParams.get("endDate"); // 日期范围结束
    const author = searchParams.get("author"); // 作者筛选
    const sortBy = searchParams.get("sortBy") || "publishedAt"; // 排序字段：publishedAt, views, createdAt
    const sortOrder = searchParams.get("sortOrder") || "desc"; // 排序方向：asc, desc

    const skip = (page - 1) * limit;

    const where: {
      category?: string;
      published?: boolean;
      author?: string;
      publishedAt?: {
        gte?: Date;
        lte?: Date;
      };
      OR?: Array<{ title: { contains: string } } | { content: { contains: string } }>;
    } = {};

    if (category) {
      where.category = category;
    }

    if (author) {
      where.author = author;
    }

    // 日期范围筛选
    if (startDate || endDate) {
      where.publishedAt = {};
      if (startDate) {
        where.publishedAt.gte = new Date(startDate);
      }
      if (endDate) {
        // 包含结束日期的全天
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        where.publishedAt.lte = endDateObj;
      }
    }

    // 默认只获取已发布的新闻，除非指定了 published 参数
    if (published === "all") {
      // 获取所有新闻（包括未发布）
    } else if (published === "false") {
      where.published = false;
    } else {
      where.published = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    // 验证排序字段
    const validSortFields = ["publishedAt", "views", "createdAt"];
    const validSortOrders = ["asc", "desc"];
    const effectiveSortBy = validSortFields.includes(sortBy) ? sortBy : "publishedAt";
    const effectiveSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : "desc";

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        skip,
        take: limit,
        include: {
          comments: {
            select: {
              id: true,
              createdAt: true,
              user: {
                select: { id: true, name: true, avatar: true },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        orderBy: [
          { [effectiveSortBy]: effectiveSortOrder },
        ],
      }),
      prisma.news.count({ where }),
    ]);

    return NextResponse.json({
      news,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        category,
        author,
        startDate,
        endDate,
        sortBy: effectiveSortBy,
        sortOrder: effectiveSortOrder,
      },
    });
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

// POST - 创建新闻
export async function POST(request: NextRequest) {
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
        { error: "Admin access required to create news" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, summary, coverImage, category, author, source } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const news = await prisma.news.create({
      data: {
        title,
        content,
        summary: summary || null,
        coverImage: coverImage || null,
        category: category || "news",
        author: author || null,
        source: source || null,
        published: body.published || false,
        publishedAt: body.published ? new Date() : null,
      },
    });

    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    console.error("Error creating news:", error);
    return NextResponse.json(
      { error: "Failed to create news" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
