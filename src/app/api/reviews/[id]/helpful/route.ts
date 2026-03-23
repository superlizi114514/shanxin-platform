import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

/**
 * POST /api/reviews/[id]/helpful - 点赞点评
 * 不能重复点赞
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 检查点评存在
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "点评不存在" },
        { status: 404 }
      );
    }

    try {
      // 尝试创建点赞记录（唯一索引防止重复）
      await prisma.reviewHelpful.create({
        data: {
          reviewId: id,
          userId: session.user.id,
        },
      });

      // 增加点赞数
      const updatedReview = await prisma.review.update({
        where: { id },
        data: { helpfulCount: { increment: 1 } },
      });

      return NextResponse.json({
        success: true,
        data: { helpfulCount: updatedReview.helpfulCount },
      });
    } catch (error) {
      if (
        error instanceof z.ZodError ||
        (error as any).code === "P2002" // Prisma 唯一约束错误
      ) {
        return NextResponse.json(
          { success: false, error: "已点赞过" },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("点赞点评失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}
