import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - 检查用户对评价的点赞状态
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ isHelpful: false, helpful: 0 });
    }

    const { id: merchantId, reviewId } = await params;

    // 检查评价是否存在
    const review = await prisma.merchantReview.findUnique({
      where: { id: reviewId },
      select: { helpful: true },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // 检查用户是否已点赞
    const existingHelpful = await prisma.merchantReviewHelpful.findFirst({
      where: {
        reviewId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      isHelpful: !!existingHelpful,
      helpful: review.helpful,
    });
  } catch (error) {
    console.error("Error fetching review helpful status:", error);
    return NextResponse.json(
      { error: "Failed to fetch helpful status" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - 点赞/取消点赞评价
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { id: merchantId, reviewId } = await params;
    const userId = session.user.id;

    // 检查评价是否存在
    const review = await prisma.merchantReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // 检查是否已经点过赞
    const existingHelpful = await prisma.merchantReviewHelpful.findFirst({
      where: {
        reviewId,
        userId,
      },
    });

    if (existingHelpful) {
      // 取消点赞
      await prisma.merchantReviewHelpful.delete({
        where: { id: existingHelpful.id },
      });

      // 更新点赞数
      const helpfulCount = await prisma.merchantReviewHelpful.count({
        where: { reviewId },
      });

      await prisma.merchantReview.update({
        where: { id: reviewId },
        data: { helpful: helpfulCount },
      });

      return NextResponse.json({ helpful: helpfulCount, isHelpful: false });
    } else {
      // 添加点赞
      await prisma.merchantReviewHelpful.create({
        data: {
          reviewId,
          userId,
        },
      });

      // 更新点赞数
      const helpfulCount = await prisma.merchantReviewHelpful.count({
        where: { reviewId },
      });

      await prisma.merchantReview.update({
        where: { id: reviewId },
        data: { helpful: helpfulCount },
      });

      return NextResponse.json({ helpful: helpfulCount, isHelpful: true });
    }
  } catch (error) {
    console.error("Error toggling review helpful:", error);
    return NextResponse.json(
      { error: "Failed to toggle review helpful" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
