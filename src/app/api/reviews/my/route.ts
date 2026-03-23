import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

/**
 * 获取当前用户的评价（包括商品评价和商家评价）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const userId = session.user.id as string;
    if (!userId) {
      return NextResponse.json({ error: "用户 ID 不存在" }, { status: 401 });
    }

    // 获取商品评价
    const productReviews = await prisma.review.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: {
              select: { id: true, url: true },
            },
          },
        },
        imagesRel: {
          select: { id: true, url: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 获取商家评价
    const merchantReviews = await prisma.merchantReview.findMany({
      where: { userId },
      include: {
        merchant: {
          include: {
            school: {
              select: { id: true, name: true, logo: true },
            },
          },
        },
        images: {
          select: { id: true, url: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      productReviews,
      merchantReviews,
      stats: {
        productReviews: productReviews.length,
        merchantReviews: merchantReviews.length,
      },
    });
  } catch (error) {
    console.error("获取评价失败:", error);
    return NextResponse.json(
      { error: "获取评价失败" },
      { status: 500 }
    );
  }
}
