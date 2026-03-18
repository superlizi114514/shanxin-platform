import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// POST - 创建商家评价
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { id: merchantId } = await params;
    const body = await request.json();
    const { content, rating, images } = body;

    if (!content || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Content and rating (1-5) are required" },
        { status: 400 }
      );
    }

    // 检查商家是否存在
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // 创建评价
    const review = await prisma.merchantReview.create({
      data: {
        content,
        rating,
        merchantId,
        userId: session.user.id,
        images: images
          ? {
              create: images.map((url: string) => ({ url })),
            }
          : undefined,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
        images: {
          select: { id: true, url: true },
        },
      },
    });

    // 更新商家评分
    const allReviews = await prisma.merchantReview.findMany({
      where: { merchantId },
      select: { rating: true },
    });

    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        rating: avgRating,
        reviewCount: allReviews.length,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET - 获取商家评价列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.merchantReview.findMany({
        where: { merchantId: id },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
          images: {
            select: { id: true, url: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.merchantReview.count({
        where: { merchantId: id },
      }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
