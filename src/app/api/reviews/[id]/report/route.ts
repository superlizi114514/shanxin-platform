import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createReportSchema } from "@/lib/validators/review";
import { z } from "zod";

/**
 * POST /api/reviews/[id]/report - 举报点评
 * 同一用户不能重复举报
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
    const body = await request.json();

    // 验证输入
    const validatedData = createReportSchema.parse(body);
    const { reason } = validatedData;

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
      // 创建举报记录
      await prisma.reviewReport.create({
        data: {
          reviewId: id,
          userId: session.user.id,
          reason,
        },
      });

      // 增加举报数
      const updatedReview = await prisma.review.update({
        where: { id },
        data: { reportCount: { increment: 1 } },
      });

      // 自动隐藏逻辑：举报数 >= 5 且 review 状态为 approved
      if (updatedReview.reportCount >= 5 && updatedReview.status === "approved") {
        await prisma.review.update({
          where: { id },
          data: { status: "hidden" },
        });
        // TODO: 发送通知给管理员
      }

      return NextResponse.json({
        success: true,
        data: {
          reportCount: updatedReview.reportCount,
          status: updatedReview.status,
        },
      });
    } catch (error) {
      if (
        error instanceof z.ZodError ||
        (error as any).code === "P2002" // Prisma 唯一约束错误
      ) {
        return NextResponse.json(
          { success: false, error: "已举报过" },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("举报点评失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}
