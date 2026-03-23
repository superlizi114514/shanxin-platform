import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createReviewSchema, reviewQuerySchema } from "@/lib/validators/review";
import { z } from "zod";
import { checkSensitiveWords } from "@/lib/sensitive-words";

/**
 * GET /api/reviews - 获取点评列表
 *
 * 查询参数:
 * - merchantId: 按商家筛选
 * - userId: 按用户筛选
 * - rating: 按评分筛选
 * - status: 审核状态 (默认 approved)
 * - page: 页码 (默认 1)
 * - pageSize: 每页数量 (默认 20, 最大 100)
 * - sortBy: 排序方式 (newest/highest/lowest/helpful)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // 验证查询参数
    const queryParams = reviewQuerySchema.parse({
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
      merchantId: searchParams.get("merchantId"),
      userId: searchParams.get("userId"),
      rating: searchParams.get("rating"),
      sortBy: searchParams.get("sortBy"),
      status: searchParams.get("status"),
    });

    const { page, pageSize, merchantId, userId, rating, sortBy, status } = queryParams;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: Record<string, unknown> = { status };

    if (merchantId) where.merchantId = merchantId;
    if (userId) where.userId = userId;
    if (rating) where.rating = rating;

    // 构建排序
    const orderBy: Record<string, "asc" | "desc"> = {};
    switch (sortBy) {
      case "newest":
        orderBy.createdAt = "desc";
        break;
      case "highest":
        orderBy.rating = "desc";
        break;
      case "lowest":
        orderBy.rating = "asc";
        break;
      case "helpful":
        orderBy.helpfulCount = "desc";
        break;
    }

    // 并行查询：点评列表、总数、平均评分
    const [reviews, total, ratingStats] = await Promise.all([
      prisma.review.findMany({
        where: where as any,
        orderBy,
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          imagesRel: {
            select: { url: true },
          },
        },
      }),
      prisma.review.count({ where: where as any }),
      prisma.review.aggregate({
        where: where as any,
        _avg: { rating: true },
      }),
    ]);

    // 转换数据格式
    const reviewsWithImages = reviews.map((review) => ({
      ...review,
      images: review.imagesRel.map((img) => img.url),
    }));

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviewsWithImages,
        total,
        page,
        pageSize,
        averageRating: ratingStats._avg.rating || 0,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => e.message).join(", ");
      return NextResponse.json(
        { success: false, error: messages },
        { status: 400 }
      );
    }
    console.error("获取点评列表失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/reviews - 创建点评
 *
 * 请求体:
 * - merchantId: 商家 ID
 * - rating: 评分 (1-5)
 * - content: 点评内容 (10-1000 字)
 * - images: 图片 URL 数组 (可选)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户登录
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 2. 验证输入
    const validatedData = createReviewSchema.parse(body);
    const { merchantId, rating, content, images } = validatedData;

    // 3. 验证商家存在
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: "商家不存在" },
        { status: 404 }
      );
    }

    // 4. 检查每日点评限制 (10 条/日)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await prisma.review.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: today },
      },
    });
    if (todayCount >= 10) {
      return NextResponse.json(
        { success: false, error: "今日点评已达上限 (10 条)" },
        { status: 429 }
      );
    }

    // 5. 敏感词检测
    const hasSensitiveWords = checkSensitiveWords(content);

    // 6. 确定审核状态
    // 新用户 (注册<7 天) 或 未实名认证 → 待审核
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { createdAt: true, studentId: true },
    });

    const userAge = Date.now() - new Date(user?.createdAt || Date.now()).getTime();
    const isNewUser = userAge < 7 * 24 * 60 * 60 * 1000;
    const isVerified = user?.studentId !== null && user?.studentId !== undefined;

    let status: "pending" | "approved" = "approved";
    if (hasSensitiveWords || isNewUser || !isVerified) {
      status = "pending";
    }

    // 6. 创建点评
    const review = await prisma.review.create({
      data: {
        merchantId,
        userId: session.user.id,
        rating,
        content,
        status,
        imagesRel: images.length > 0 ? {
          create: images.map((url: string) => ({ url })),
        } : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            studentId: true,
          },
        },
        imagesRel: {
          select: { url: true },
        },
      },
    });

    // 7. 更新商家评分
    const stats = await prisma.review.aggregate({
      where: { merchantId },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: review.id,
          status: review.status,
          createdAt: review.createdAt,
          images: review.imagesRel.map((img) => img.url),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => e.message).join(", ");
      return NextResponse.json(
        { success: false, error: messages },
        { status: 400 }
      );
    }
    console.error("创建点评失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
