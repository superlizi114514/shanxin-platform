import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/reviews/[id] - 获取点评详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            studentId: true,
          },
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        imagesRel: {
          select: { id: true, url: true },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "点评不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...review,
        images: review.imagesRel.map((img) => img.url),
      },
    });
  } catch (error) {
    console.error("获取点评详情失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/[id] - 删除点评
 * 权限：仅作者或管理员可删除
 */
export async function DELETE(
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
    const userId = session.user.id;
    const userRole = session.user.role;

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "点评不存在" },
        { status: 404 }
      );
    }

    // 权限检查：作者或管理员
    const isAdmin = userRole === "admin";
    const isAuthor = review.userId === userId;

    if (!isAdmin && !isAuthor) {
      return NextResponse.json(
        { success: false, error: "无权限删除" },
        { status: 403 }
      );
    }

    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error("删除点评失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}
